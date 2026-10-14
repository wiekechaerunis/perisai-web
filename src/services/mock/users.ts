/**
 * Adapter mock gelombang 2: manajemen pengguna (Undang, Kirim Ulang, Batalkan, Kelola Status Akun, cabut sesi admin)
 * dan Akun Saya. Aturan dari user-rules.ts dan PRD terkait; backend wajib menegakkan ulang.
 */
import { effectiveAccess, scopeFor } from '@/lib/access';
import { formatTanggal, formatTanggalJam, maskEmail } from '@/lib/format';
import { type Action, type RoleId, roleName } from '@/lib/rbac';
import { SECURITY_PARAMS as P } from '@/lib/security-params';
import {
  ALASAN_LAINNYA_MAX,
  ALASAN_NONAKTIF,
  ALASAN_TANGGUH,
  JABATAN_MAX,
  NAMA_MAX,
  PERSONAL_EMAIL_DOMAINS,
  RESEND_GAP_MS,
  RESEND_PER_DAY,
  endOfDayWib,
  emailApproverRole,
  EMAIL_REQUESTS_PER_HOUR,
  invitableRoles,
  inviterRoleOf,
  isPastDate,
  violatesSod,
} from '@/lib/user-rules';
import {
  ServiceError,
  type AccountService,
  type EmailRequest,
  type MyAccount,
  type ReasonInput,
  type UserDetail,
  type UserService,
  type UserSummary,
} from '../types';
import {
  aksesLewat,
  audit,
  checkOtp,
  delay,
  isLive,
  log,
  newOtp,
  normEmail,
  orgOf,
  requireSession,
  resendOtp,
  sendEmail,
  sessionEnd,
  userById,
} from './core';
import { commit, db, iso, now, randomId, type DbUser } from './db';
import { wkOperatedBy, type SeedOrg } from './seed';
import { isRoleActive, needsWk, rolesByOrgType } from '@/lib/role-catalog';
import { domainMatches } from '@/lib/org-rules';

const DAY = 86_400_000;

/* ---------- utilitas ---------- */

export function actor(): DbUser {
  return userById(requireSession(true).userId);
}

export function event(u: DbUser, peristiwa: string, pelaku?: string, keterangan?: string, at = now()): void {
  u.events.unshift({ id: randomId('ev'), at, peristiwa, pelaku, keterangan });
}

/** Undangan berlaku 7 hari, sampai 23:59 WIB hari terakhir (BRD AB-14, NFR Aktivasi). */
function inviteExpiry(from: number): number {
  const d = new Date(from + P.inviteValidityDays * DAY);
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
  return endOfDayWib(ymd).getTime();
}

/** Penegakan cakupan admin: R-03 semua organisasi, R-04 organisasinya sendiri (FR-KU-02, FR-BU-02, FR-SA-05). */
export function assertCanManage(a: DbUser, target: DbUser, aksi: Action = 'edit'): void {
  if (a.roles.includes('R-03')) return;
  if (a.roles.includes('R-04') && a.orgId === target.orgId) return;
  recordDenial(a, target, aksi, 'PERMISSION_DENIED');
  throw new ServiceError('PERMISSION_DENIED');
}

function assertOrgActive(u: DbUser): void {
  // FR-SA-24b: aksi dinonaktifkan untuk pengguna organisasi nonaktif.
  if (orgOf(u).status !== 'Aktif') throw new ServiceError('ORG_INACTIVE');
}

export function assertReason(r: ReasonInput): void {
  if (!r.alasan) throw new ServiceError('VALIDATION', { field: 'alasan' });
  if (r.alasan === 'Lainnya' && !r.penjelasan?.trim()) throw new ServiceError('VALIDATION', { field: 'penjelasan' });
  if ((r.penjelasan ?? '').length > ALASAN_LAINNYA_MAX) throw new ServiceError('VALIDATION', { field: 'penjelasan' });
}

export function reasonText(r: ReasonInput): string {
  return r.alasan === 'Lainnya' ? `Lainnya: ${r.penjelasan?.trim()}` : r.alasan;
}

/** Kirim email; gagal bila alat uji memintanya (FR-UP-20, FR-KU-11). */
function deliver(to: string, subject: string, body: string, link?: string): void {
  const d = db();
  if (d.failNextEmail) {
    d.failNextEmail = false;
    commit();
    throw new ServiceError('SEND_FAILED');
  }
  sendEmail(to, subject, body, link);
}

export function activeAdmins(role: RoleId, orgId?: string): DbUser[] {
  return db().users.filter((u) => u.roles.includes(role) && u.status === 'Aktif' && (!orgId || u.orgId === orgId));
}

/** EC-UDR-05/06: permintaan/perubahan email yang belum berlaku dibatalkan otomatis. */
export function cancelPendingEmail(u: DbUser, sebab: string): void {
  const pending = (u.emailRequest && u.emailRequest.status !== 'Ditolak') || u.adminEmailChange;
  if (!pending) return;
  u.emailRequest = undefined;
  u.adminEmailChange = undefined;
  event(u, 'Permintaan ubah email dibatalkan', 'Sistem', sebab);
}

/** Transisi otomatis oleh Sistem (Tabel A-2, FR-UP-23, FR-SA-24, FR-SA-30). */
function refresh(u: DbUser): void {
  const t = now();
  if (orgOf(u).status !== 'Aktif') cancelPendingEmail(u, 'Organisasi dinonaktifkan.');
  if (u.status === 'Diundang' && u.inviteExpiresAt && u.inviteExpiresAt < t) {
    u.status = 'Kedaluwarsa';
    event(u, 'Undangan kedaluwarsa', 'Sistem', undefined, u.inviteExpiresAt);
    audit({ modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum: { Status: 'Diundang' }, sesudah: { Status: 'Kedaluwarsa' }, alasan: 'Masa berlaku undangan habis', hasil: 'Berhasil', kelompok: 'Identitas & akses' });
  }
  if ((u.status === 'Aktif' || u.status === 'Ditangguhkan') && aksesLewat(u)) {
    u.status = 'Nonaktif';
    event(u, 'Masa berlaku akses berakhir', 'Sistem', 'Akun menjadi Nonaktif.', new Date(u.aksesBerakhir!).getTime());
    audit({ modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sesudah: { Status: 'Nonaktif' }, alasan: 'Masa berlaku akses berakhir', hasil: 'Berhasil', kelompok: 'Identitas & akses' });
  }
}

export function scopeOf(u: DbUser) {
  const d = db();
  return scopeFor({
    roles: u.roles,
    organisasi: orgOf(u).nama,
    wilayahKerja: d.wk.filter((w) => u.wilayahKerjaIds.includes(w.id)).map((w) => w.nama),
    kkksDitugaskan: d.orgs.filter((o) => (u.kkksIds ?? []).includes(o.id)).map((o) => o.nama),
  });
}

export const objekPengguna = (u: DbUser) => `pengguna #${u.id}`;

/** Penolakan dicatat di Log Akses DAN Jejak Audit — ASSUMPTION PR-03 (KD-06 belum diputuskan). Tanpa isi data (FR-PA-11a). */
export function recordDenial(a: DbUser, target: DbUser | undefined, aksi: Action, code: 'PERMISSION_DENIED' | 'NOT_FOUND'): void {
  // PR-03 diputuskan PM (14 Okt 2026): penolakan akses dicatat di Jejak Audit saja.
  audit({ pelakuId: a.id, modul: 'M-15', aksi, objek: target ? objekPengguna(target) : 'modul M-15', orgObjekId: target?.orgId, hasil: 'Ditolak', alasan: code === 'NOT_FOUND' ? 'Di luar cakupan' : 'Tidak punya izin', kelompok: 'Penolakan akses' });
  commit();
}

export function liveSessions(u: DbUser) {
  return db().sessions.filter((s) => s.userId === u.id && isLive(s));
}

export function toSummary(u: DbUser): UserSummary {
  refresh(u);
  const org = orgOf(u);
  const d = db();
  const inviter = d.users.find((x) => x.id === u.invitedBy);
  const isPic = u.roles.includes('R-04') && u.status === 'Aktif';
  return {
    id: u.id,
    nama: u.nama,
    email: u.email,
    jabatan: u.jabatan,
    roles: u.roles,
    organisasi: { id: org.id, nama: org.nama, jenis: org.jenis, status: org.status },
    wilayahKerja: d.wk.filter((w) => u.wilayahKerjaIds.includes(w.id) && w.aktif),
    status: u.status,
    keteranganStatus: u.keteranganStatus,
    pernahAktif: u.pernahAktif,
    undanganBerlakuSampai:
      (u.status === 'Diundang' || u.status === 'Kedaluwarsa') && u.inviteExpiresAt ? iso(u.inviteExpiresAt) : undefined,
    aksesBerakhir: u.aksesBerakhir,
    loginTerakhir: u.lastLogin ? iso(u.lastLogin) : undefined,
    diaktifkanPada: (() => {
      const e = [...u.events].reverse().find((x) => x.peristiwa === 'Akun diaktifkan');
      return e ? iso(e.at) : undefined;
    })(),
    mintaUndanganBaru: u.newInviteRequestedAt ? iso(u.newInviteRequestedAt) : undefined,
    diundangOleh: inviter?.nama,
    diundangPada: u.invitedAt ? iso(u.invitedAt) : undefined,
    sesiAktif: liveSessions(u).length,
    picTerakhir: isPic && activeAdmins('R-04', u.orgId).filter((x) => x.id !== u.id).length === 0,
    cakupan: scopeOf(u),
    // FR-CD-13: WK yang dinonaktifkan di data induk ditandai, tidak dicabut diam-diam.
    wilayahKerjaNonaktif: d.wk.filter((w) => u.wilayahKerjaIds.includes(w.id) && !w.aktif),
    kkksIds: u.kkksIds ?? [],
  };
}

export function toDetail(u: DbUser): UserDetail {
  const s = toSummary(u);
  return {
    ...s,
    riwayat: u.events.map((e) => ({ id: e.id, at: iso(e.at), peristiwa: e.peristiwa, pelaku: e.pelaku, keterangan: e.keterangan })),
    emailTertunda: u.adminEmailChange
      ? { emailBaru: u.adminEmailChange.emailBaru, status: 'Menunggu Verifikasi', diajukan: iso(u.adminEmailChange.diajukan), olehAdmin: true }
      : u.emailRequest && u.emailRequest.status !== 'Ditolak'
        ? { emailBaru: u.emailRequest.emailBaru, status: u.emailRequest.status, diajukan: iso(u.emailRequest.diajukan), olehAdmin: false }
        : undefined,
  };
}

export function visibleTo(a: DbUser, u: DbUser): boolean {
  if (a.roles.includes('R-03') || a.roles.includes('R-07')) return true;
  if (a.roles.includes('R-04')) return u.orgId === a.orgId;
  return false;
}

/** Entri email diizinkan yang masih berlaku (FR-ORG-27, -29). */
export function activeAllowEntry(email: string, org: SeedOrg) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(now()));
  return (org.emailAllow ?? []).find((e) => e.email === email && (!e.berlakuSampai || e.berlakuSampai >= today));
}

/** FR-UP-04 + PRD Kelola Organisasi: lolos bila domain cocok (subdomain ikut) atau email ada di daftar diizinkan. */
export function checkEmailForOrg(email: string, org: SeedOrg): { berlakuSampai?: string } {
  const domain = email.split('@')[1] ?? '';
  const allow = activeAllowEntry(email, org);
  if (allow) return { berlakuSampai: allow.berlakuSampai };
  if (PERSONAL_EMAIL_DOMAINS.includes(domain)) throw new ServiceError('EMAIL_PERSONAL', { field: 'email' });
  if (!org.domains.some((dm) => domainMatches(domain, dm))) throw new ServiceError('EMAIL_DOMAIN_NOT_ALLOWED', { field: 'email', value: org.nama });
  return {};
}

function newInviteToken(u: DbUser): string {
  const d = db();
  d.invites.filter((i) => i.userId === u.id).forEach((i) => (i.revoked = true));
  const token = randomId('inv');
  u.inviteExpiresAt = inviteExpiry(now());
  d.invites.push({ token, userId: u.id, expiresAt: u.inviteExpiresAt });
  return token;
}

function inviteEmailBody(u: DbUser, a: DbUser): string {
  return `${a.nama} mengundang Anda ke PERISAI sebagai ${u.roles.map((r) => roleName(r)).join(', ')} di ${orgOf(u).nama}. Tautan berlaku sampai ${formatTanggalJam(u.inviteExpiresAt!)}.`;
}

/* ---------- UserService ---------- */

export const userService: Omit<
  UserService,
  'previewUpdate' | 'updateUser' | 'listEmailRequests' | 'approveEmailRequest' | 'rejectEmailRequest' | 'exportUsers' | 'resetPassword' | 'userSessions' | 'revokeUserSession'
> = {
  async listUsers(q = {}) {
    await delay();
    const a = actor();
    if (!inviterRoleOf(a.roles)) throw new ServiceError('PERMISSION_DENIED');
    const term = q.search?.trim().toLowerCase();
    const rows = db()
      .users.filter((u) => visibleTo(a, u))
      .map(toSummary)
      .filter((u) => (!q.status || u.status === q.status) && (!q.organisasiId || u.organisasi.id === q.organisasiId))
      .filter((u) => !q.mintaUndanganBaru || !!u.mintaUndanganBaru)
      .filter((u) => !q.role || u.roles.includes(q.role))
      .filter((u) => !term || u.nama.toLowerCase().includes(term) || u.email.includes(term))
      .sort((x, y) => (y.diundangPada ?? '').localeCompare(x.diundangPada ?? ''));
    commit();
    return rows;
  },

  async getUser(id) {
    await delay();
    const a = actor();
    const u = db().users.find((x) => x.id === id);
    // Di luar cakupan = tidak ditemukan (Tabel P-1).
    if (!u || !visibleTo(a, u)) {
      if (u) recordDenial(a, u, 'view', 'NOT_FOUND');
      throw new ServiceError('NOT_FOUND');
    }
    const detail = toDetail(u);
    commit();
    return detail;
  },

  async listOrganisasi() {
    await delay();
    const a = actor();
    const inv = inviterRoleOf(a.roles);
    // R-02 butuh daftar organisasi untuk filter Log Akses / Jejak Audit (FR-LA-08, FR-JA-13).
    if (!inv && !a.roles.includes('R-02')) throw new ServiceError('PERMISSION_DENIED');
    return db()
      .orgs.filter((o) => (inv === 'R-04' ? o.id === a.orgId : true))
      .map((o) => ({ id: o.id, nama: o.nama, jenis: o.jenis, status: o.status }));
  },

  async listWilayahKerja(orgId) {
    await delay();
    actor();
    return db().wk.filter((w) => wkOperatedBy(w, orgId) && w.aktif);
  },

  async invite(input) {
    await delay();
    const a = actor();
    const inv = inviterRoleOf(a.roles);
    if (!inv) throw new ServiceError('PERMISSION_DENIED');
    const d = db();
    const orgId = inv === 'R-04' ? a.orgId : input.organisasiId;
    if (!orgId) throw new ServiceError('VALIDATION', { field: 'organisasi' });
    const org = d.orgs.find((o) => o.id === orgId);
    if (!org || org.status !== 'Aktif') throw new ServiceError('VALIDATION', { field: 'organisasi' });
    // FR-UP-11: PIC KKKS hanya organisasinya sendiri.
    if (inv === 'R-04' && input.organisasiId && input.organisasiId !== a.orgId) throw new ServiceError('PERMISSION_DENIED');

    const nama = input.nama.trim();
    if (!nama || nama.length > NAMA_MAX) throw new ServiceError('VALIDATION', { field: 'nama' });
    if ((input.jabatan ?? '').length > JABATAN_MAX) throw new ServiceError('VALIDATION', { field: 'jabatan' });
    if (input.roles.length === 0) throw new ServiceError('VALIDATION', { field: 'role' });
    // FR-AR-07: role Tidak Aktif ditolak dengan pesan Tabel V-1.
    if (input.roles.some((r) => !isRoleActive(r))) throw new ServiceError('ROLE_INACTIVE', { field: 'role' });
    const allowed = invitableRoles(inv, org.jenis);
    if (input.roles.some((r) => !allowed.includes(r))) throw new ServiceError('ROLE_NOT_ALLOWED', { field: 'role' });
    if (violatesSod(input.roles)) throw new ServiceError('SOD_VIOLATION', { field: 'role' });

    // FR-UP-12: Pelapor wajib wilayah kerja aktif.
    const wkIds = needsWk(input.roles) ? (input.wilayahKerjaIds ?? []) : [];
    if (needsWk(input.roles)) {
      const active = d.wk.filter((w) => wkOperatedBy(w, org.id) && w.aktif);
      if (active.length === 0) throw new ServiceError('ORG_NO_WK', { field: 'wilayahKerja' });
      if (wkIds.length === 0 || wkIds.some((id) => !active.some((w) => w.id === id))) {
        throw new ServiceError('VALIDATION', { field: 'wilayahKerja' });
      }
    }

    // FR-UP-16: trim + lowercase.
    const email = normEmail(input.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ServiceError('VALIDATION', { field: 'email' });
    if (inv === 'R-07' && email === a.email) throw new ServiceError('EMAIL_OWN', { field: 'email' });
    const viaAllow = checkEmailForOrg(email, org);

    // FR-CD-04b: R-02 seluruh KKKS (default) atau KKKS tertentu.
    const kkksIds = input.roles.includes('R-02') ? (input.cakupanOrganisasiIds ?? []) : [];
    if (kkksIds.some((id) => d.orgs.find((o) => o.id === id)?.jenis !== 'KKKS')) throw new ServiceError('VALIDATION', { field: 'cakupan' });

    if (input.aksesBerakhir) {
      if (inv !== 'R-03') throw new ServiceError('PERMISSION_DENIED');
      if (isPastDate(input.aksesBerakhir, new Date(now()))) throw new ServiceError('PAST_DATE', { field: 'aksesBerakhir' });
    }

    const existing = d.users.find((u) => u.email === email);
    if (existing) {
      refresh(existing);
      if (existing.status === 'Aktif') throw new ServiceError('EMAIL_REGISTERED', { field: 'email' });
      if (existing.status === 'Diundang' || existing.status === 'Kedaluwarsa') throw new ServiceError('EMAIL_INVITED', { field: 'email' });
      // FR-BU-14: undangan yang dibatalkan (Nonaktif, belum pernah aktif) boleh diundang ulang tanpa rekaman ganda.
      if (existing.pernahAktif) throw new ServiceError('EMAIL_INACTIVE_ACCOUNT');
    }

    const u: DbUser =
      existing ??
      ({
        id: randomId('u'),
        nama,
        email,
        roles: [],
        orgId: org.id,
        status: 'Diundang',
        password: null,
        loginFailures: 0,
        changePwFailures: 0,
        wilayahKerjaIds: [],
        pernahAktif: false,
        resendTimes: [],
        events: [],
        kkksIds: [],
      } as DbUser);
    const snapshot = structuredClone(u);
    Object.assign(u, {
      nama,
      jabatan: input.jabatan?.trim() || undefined,
      roles: input.roles,
      orgId: org.id,
      status: 'Diundang',
      keteranganStatus: undefined,
      wilayahKerjaIds: wkIds,
      kkksIds,
      invitedBy: a.id,
      invitedAt: now(),
      // FR-ORG-27: email diizinkan bertanggal → masa berlaku akses = tanggal itu, tidak boleh lebih lama.
      aksesBerakhir: (() => {
        const pick = [input.aksesBerakhir, viaAllow.berlakuSampai].filter(Boolean).sort()[0];
        return pick ? endOfDayWib(pick).toISOString() : undefined;
      })(),
      newInviteRequestedAt: undefined,
    });
    const token = newInviteToken(u);
    try {
      deliver(u.email, 'Undangan bergabung ke PERISAI', inviteEmailBody(u, a), `/aktivasi/${token}`);
    } catch (e) {
      // FR-UP-20: gagal kirim → tidak ada yang berubah.
      Object.assign(u, snapshot);
      d.invites = d.invites.filter((i) => i.token !== token);
      throw e;
    }
    if (!existing) d.users.push(u);
    event(u, 'Diundang', a.nama, `${org.nama} · ${u.roles.join(', ')}`);
    // FR-UP-11a / 11b: beri tahu seluruh R-03 aktif.
    if (inv === 'R-07' || u.roles.includes('R-03')) {
      activeAdmins('R-03')
        .filter((x) => x.id !== a.id)
        .forEach((x) =>
          sendEmail(x.email, 'Pemberitahuan undangan pengguna', `${a.nama} mengundang ${u.nama} (${u.email}) sebagai ${u.roles.join(', ')} di ${org.nama}.`),
        );
    }
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'create', objek: objekPengguna(u), orgObjekId: org.id, sesudah: { Nama: u.nama, Email: u.email, Role: u.roles.join(', '), Status: 'Diundang' }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
    return toSummary(u);
  },

  async resendInvite(userId) {
    await delay();
    const a = actor();
    const u = userById(userId);
    assertCanManage(a, u);
    refresh(u);
    if (u.status !== 'Diundang' && u.status !== 'Kedaluwarsa') throw new ServiceError('NOT_ELIGIBLE');
    assertOrgActive(u);
    const t = now();
    u.resendTimes = u.resendTimes.filter((x) => t - x < DAY);
    const last = u.resendTimes.at(-1);
    if (last && t - last < RESEND_GAP_MS) throw new ServiceError('RESEND_TOO_SOON', { retryAt: iso(last + RESEND_GAP_MS) });
    if (u.resendTimes.length >= RESEND_PER_DAY) throw new ServiceError('RESEND_QUOTA', { retryAt: iso(u.resendTimes[0]! + DAY) });
    const prevStatus = u.status;
    const prevExpiry = u.inviteExpiresAt;
    const prevTokens = db().invites.filter((i) => i.userId === u.id && !i.revoked).map((i) => i.token);
    const token = newInviteToken(u);
    try {
      deliver(u.email, 'Undangan PERISAI (dikirim ulang)', inviteEmailBody(u, a), `/aktivasi/${token}`);
    } catch (e) {
      // FR-KU-11: gagal → tidak ada yang berubah; FR-KU-22: tidak dihitung kuota.
      db().invites = db().invites.filter((i) => i.token !== token);
      db().invites.filter((i) => prevTokens.includes(i.token)).forEach((i) => (i.revoked = false));
      u.inviteExpiresAt = prevExpiry;
      commit();
      throw e;
    }
    u.status = 'Diundang';
    u.resendTimes.push(t);
    u.newInviteRequestedAt = undefined; // FR-KU-19c
    event(u, 'Undangan dikirim ulang', a.nama);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum: { Status: prevStatus }, sesudah: { Status: 'Diundang', Keterangan: 'Undangan dikirim ulang' }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
    return toSummary(u);
  },

  async cancelInvite(userId, reason) {
    await delay();
    const a = actor();
    const u = userById(userId);
    assertCanManage(a, u);
    refresh(u);
    if (u.status !== 'Diundang' && u.status !== 'Kedaluwarsa') throw new ServiceError('NOT_ELIGIBLE');
    assertReason(reason);
    const prevCancel = u.status;
    db().invites.filter((i) => i.userId === u.id).forEach((i) => (i.revoked = true));
    u.status = 'Nonaktif';
    u.keteranganStatus = 'Undangan dibatalkan';
    u.newInviteRequestedAt = undefined;
    event(u, 'Undangan dibatalkan', a.nama, `Alasan: ${reasonText(reason)}`);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum: { Status: prevCancel }, sesudah: { Status: 'Nonaktif', Keterangan: 'Undangan dibatalkan' }, alasan: reasonText(reason), hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
    return toSummary(u);
  },

  async suspend(userId, reason) {
    await delay();
    const a = actor();
    const u = userById(userId);
    assertCanManage(a, u);
    if (u.id === a.id) throw new ServiceError('SELF_ACTION');
    refresh(u);
    assertOrgActive(u);
    if (u.status !== 'Aktif') throw new ServiceError('NOT_ELIGIBLE');
    assertReason(reason);
    u.status = 'Ditangguhkan';
    liveSessions(u).forEach((s) => sessionEnd(s, 'revoked'));
    sendEmail(u.email, 'Akun PERISAI Anda ditangguhkan', ALASAN_TANGGUH[reason.alasan] ?? ALASAN_TANGGUH.Lainnya!);
    event(u, 'Akun ditangguhkan', a.nama, `Alasan: ${reasonText(reason)}`);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum: { Status: 'Aktif' }, sesudah: { Status: 'Ditangguhkan' }, alasan: reasonText(reason), hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    cancelPendingEmail(u, 'Akun ditangguhkan.');
    commit();
    return toSummary(u);
  },

  async deactivate(userId, reason) {
    await delay();
    const a = actor();
    const u = userById(userId);
    assertCanManage(a, u);
    if (u.id === a.id) throw new ServiceError('SELF_ACTION');
    refresh(u);
    assertOrgActive(u);
    if (u.status !== 'Aktif' && u.status !== 'Ditangguhkan') throw new ServiceError('NOT_ELIGIBLE');
    assertReason(reason);
    const prevDeact = u.status;
    u.status = 'Nonaktif';
    u.keteranganStatus = undefined;
    liveSessions(u).forEach((s) => sessionEnd(s, 'revoked'));
    db().resets.filter((r) => r.userId === u.id && !r.usedAt).forEach((r) => (r.superseded = true));
    sendEmail(u.email, 'Akun PERISAI Anda dinonaktifkan', ALASAN_NONAKTIF[reason.alasan] ?? ALASAN_NONAKTIF.Lainnya!);
    event(u, 'Akun dinonaktifkan', a.nama, `Alasan: ${reasonText(reason)}`);
    // FR-SA-07a: organisasi kehilangan PIC terakhir → beri tahu R-03.
    if (u.roles.includes('R-04') && activeAdmins('R-04', u.orgId).length === 0) {
      activeAdmins('R-03').forEach((x) =>
        sendEmail(x.email, 'Organisasi tanpa PIC KKKS aktif', `${orgOf(u).nama} tidak lagi memiliki PIC KKKS aktif setelah ${u.nama} dinonaktifkan.`),
      );
    }
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum: { Status: prevDeact }, sesudah: { Status: 'Nonaktif' }, alasan: reasonText(reason), hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    cancelPendingEmail(u, 'Akun dinonaktifkan.');
    commit();
    return toSummary(u);
  },

  async reactivate(userId) {
    await delay();
    const a = actor();
    const u = userById(userId);
    assertCanManage(a, u);
    if (u.id === a.id) throw new ServiceError('SELF_ACTION');
    refresh(u);
    assertOrgActive(u);
    const ok = u.status === 'Ditangguhkan' || (u.status === 'Nonaktif' && u.pernahAktif);
    if (!ok) throw new ServiceError('NOT_ELIGIBLE');
    // Masa berlaku akses sudah lewat → perpanjang dulu (FR-SA-26).
    if (aksesLewat(u)) throw new ServiceError('PAST_DATE', { field: 'aksesBerakhir' });
    const prevReact = u.status;
    u.status = 'Aktif';
    u.keteranganStatus = undefined;
    sendEmail(u.email, 'Akun PERISAI Anda diaktifkan kembali', 'Akun Anda dapat dipakai kembali. Role dan cakupan data Anda tidak berubah.');
    event(u, 'Akun diaktifkan kembali', a.nama);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum: { Status: prevReact }, sesudah: { Status: 'Aktif' }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
    return toSummary(u);
  },

  async setAccessEnd(userId, date) {
    await delay();
    const a = actor();
    const u = userById(userId);
    assertCanManage(a, u);
    if (date && isPastDate(date, new Date(now()))) throw new ServiceError('PAST_DATE', { field: 'aksesBerakhir' });
    const old = u.aksesBerakhir ? formatTanggal(u.aksesBerakhir) : 'Tanpa batas';
    u.aksesBerakhir = date ? endOfDayWib(date).toISOString() : undefined;
    event(u, 'Masa berlaku akses diubah', a.nama, `${old} → ${date ? formatTanggal(u.aksesBerakhir!) : 'Tanpa batas'}`);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum: { 'Masa berlaku akses': old }, sesudah: { 'Masa berlaku akses': date ? formatTanggal(u.aksesBerakhir!) : 'Tanpa batas' }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
    return toSummary(u);
  },

  async revokeSessions(userId, reason) {
    await delay();
    const a = actor();
    const u = userById(userId);
    // FR-LO-14 (R-03), FR-LO-15 (R-04 organisasi sendiri, lainnya 403).
    assertCanManage(a, u, 'manage');
    assertReason(reason);
    const live = liveSessions(u);
    live.forEach((s) => sessionEnd(s, 'revoked'));
    event(u, 'Sesi dicabut', a.nama, `${live.length} sesi · Alasan: ${reasonText(reason)}`);
    log({ log: 'akses', event: 'sesi_dicabut_admin', userId: u.id, sessionId: live[0]?.id, result: 'berhasil', reason: reasonText(reason), detail: { pelaku: a.nama, jumlah: live.length } });
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'manage', objek: objekPengguna(u), orgObjekId: u.orgId, sesudah: { 'Sesi dicabut': String(live.length) }, alasan: reasonText(reason), hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
    return { revoked: live.length };
  },

  async effectiveAccess(userId) {
    await delay();
    const a = actor();
    const u = db().users.find((x) => x.id === userId);
    if (!u || !visibleTo(a, u)) throw new ServiceError('NOT_FOUND');
    refresh(u);
    return effectiveAccess(u.status, u.roles, scopeOf(u));
  },
};

/* ---------- AccountService (Akun Saya) ---------- */

function toEmailRequest(u: DbUser): EmailRequest | undefined {
  const r = u.emailRequest;
  if (!r) return undefined;
  return {
    emailBaru: r.emailBaru,
    status: r.status,
    diajukan: iso(r.diajukan),
    resendAvailableAt: r.otp ? iso(r.otp.lastSentAt + P.otpResendCooldownMs) : undefined,
    alasan: r.alasan,
  };
}

function toMe(u: DbUser): MyAccount {
  const org = orgOf(u);
  return {
    nama: u.nama,
    email: u.email,
    username: u.email.split('@')[0] ?? u.email,
    jabatan: u.jabatan,
    roles: u.roles,
    organisasi: { id: org.id, nama: org.nama, jenis: org.jenis, status: org.status },
    status: u.status,
    wilayahKerja: db().wk.filter((w) => u.wilayahKerjaIds.includes(w.id)),
    aksesBerakhir: u.aksesBerakhir,
    cakupan: scopeOf(u),
    hakAkses: effectiveAccess(u.status, u.roles, scopeOf(u)),
    kataSandiDiubah: (() => {
      const e = u.events.find((x) => x.peristiwa === 'Kata sandi diubah' || x.peristiwa === 'Kata sandi diatur ulang');
      return e ? iso(e.at) : undefined;
    })(),
    permintaanEmail: toEmailRequest(u),
  };
}

export function newEmailLink(u: DbUser, kind: 'verify' | 'notme', afterChange = false): string {
  const token = randomId(kind === 'verify' ? 'vem' : 'bks');
  db().emailLinks.push({ token, kind, userId: u.id, afterChange });
  return token;
}

/** Sesi yang dipertahankan saat email berganti lewat persetujuan: sesi pengguna yang paling baru aktif. */
export function newestSessionId(u: DbUser): string | undefined {
  return [...liveSessions(u)].sort((a, b) => b.lastActivity - a.lastActivity)[0]?.id;
}

export function applyEmailChange(u: DbUser, keepSessionId?: string): void {
  const r = u.emailRequest!;
  const lama = u.email;
  // FR-UDR-13: tautan "Bukan saya" setelah email berganti mencabut seluruh sesi dan memberi tahu Administrator Bisnis.
  const t = newEmailLink(u, 'notme', true);
  sendEmail(lama, 'Email akun PERISAI Anda diubah', `Email akun Anda diubah menjadi ${maskEmail(r.emailBaru)} pada ${formatTanggalJam(now())}. Bukan Anda? Buka tautan "Bukan saya".`, `/bukan-saya/${t}`);
  sendEmail(r.emailBaru, 'Email akun PERISAI Anda sudah berlaku', 'Mulai sekarang, gunakan email ini untuk masuk ke PERISAI.');
  u.email = r.emailBaru;
  u.emailRequest = undefined;
  // Setelah disetujui, sesi lain dicabut (FR-AS-009).
  liveSessions(u)
    .filter((s) => s.id !== keepSessionId)
    .forEach((s) => sessionEnd(s, 'password_changed'));
  event(u, 'Email diubah', u.nama, `${lama} → ${u.email} · terverifikasi ${formatTanggalJam(now())}`);
  audit({ pelakuId: u.id, modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum: { Email: lama }, sesudah: { Email: u.email }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
}


export const accountService: AccountService = {
  async getMe() {
    await delay();
    const u = actor();
    commit();
    return toMe(u);
  },

  async updateProfile({ nama, jabatan }) {
    await delay();
    const u = actor();
    const n = nama.trim();
    // FR-AS-003: Nama Lengkap 3–150, Jabatan ≤ 100.
    if (n.length < 3 || n.length > 150) throw new ServiceError('VALIDATION', { field: 'nama' });
    if ((jabatan ?? '').length > JABATAN_MAX) throw new ServiceError('VALIDATION', { field: 'jabatan' });
    const changes: string[] = [];
    if (n !== u.nama) changes.push(`Nama lengkap: ${u.nama} → ${n}`);
    if ((jabatan?.trim() || undefined) !== u.jabatan) changes.push(`Jabatan: ${u.jabatan ?? '—'} → ${jabatan?.trim() || '—'}`);
    // FR-UDR-04: audit dengan nilai sebelum dan sesudah.
    const sebelum: Record<string, string> = {};
    const sesudah: Record<string, string> = {};
    if (n !== u.nama) {
      sebelum['Nama lengkap'] = u.nama;
      sesudah['Nama lengkap'] = n;
    }
    if ((jabatan?.trim() || undefined) !== u.jabatan) {
      sebelum.Jabatan = u.jabatan ?? '—';
      sesudah.Jabatan = jabatan?.trim() || '—';
    }
    u.nama = n;
    u.jabatan = jabatan?.trim() || undefined;
    if (changes.length) {
      event(u, 'Data profil diubah', 'Pengguna', changes.join('; '));
      audit({ pelakuId: u.id, modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum, sesudah, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    }
    commit();
    return toMe(u);
  },

  async requestEmailChange({ password, emailBaru }) {
    await delay();
    const u = actor();
    if (u.password !== password) throw new ServiceError('CURRENT_PASSWORD_WRONG', { field: 'password' });
    // FR-AS-010, FR-UDR-12: satu permintaan aktif per pengguna.
    if (u.emailRequest && u.emailRequest.status !== 'Ditolak') throw new ServiceError('EMAIL_REQUEST_PENDING');
    const email = normEmail(emailBaru);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ServiceError('VALIDATION', { field: 'email' });
    if (email === u.email) throw new ServiceError('EMAIL_SAME', { field: 'email' });
    if (db().users.some((x) => x.email === email)) throw new ServiceError('EMAIL_REGISTERED', { field: 'email' });
    checkEmailForOrg(email, orgOf(u));
    const hourAgo = now() - 60 * 60_000;
    u.emailRequestTimes = (u.emailRequestTimes ?? []).filter((x) => x > hourAgo);
    if (u.emailRequestTimes.length >= EMAIL_REQUESTS_PER_HOUR) throw new ServiceError('RATE_LIMITED');
    u.emailRequestTimes.push(now());
    const otp = newOtp();
    u.emailRequest = { emailBaru: email, status: 'Menunggu Verifikasi', diajukan: now(), otp };
    // FR-UDR-12: email lama diberi tahu (email baru disamarkan) + tautan "Bukan saya".
    const t = newEmailLink(u, 'notme');
    sendEmail(u.email, 'Permintaan ubah email akun PERISAI', `Ada permintaan mengubah email akun Anda menjadi ${maskEmail(email)} pada ${formatTanggalJam(now())}. Bukan Anda? Buka tautan "Bukan saya".`, `/bukan-saya/${t}`);
    sendEmail(email, 'Kode verifikasi email baru PERISAI', `Kode verifikasi Anda: ${otp.code}. Berlaku sampai ${formatTanggalJam(otp.expiresAt)}.`);
    commit();
    return toEmailRequest(u)!;
  },

  async verifyEmailChange(code) {
    await delay();
    const s = requireSession(true);
    const u = userById(s.userId);
    const r = u.emailRequest;
    if (!r?.otp || r.status !== 'Menunggu Verifikasi') throw new ServiceError('OTP_SESSION_INVALID');
    try {
      checkOtp(r.otp, code);
    } catch (e) {
      if (e instanceof ServiceError && e.code === 'OTP_LOCKED') u.emailRequest = undefined;
      commit();
      throw e;
    }
    r.otp = undefined;
    const approverRole = emailApproverRole(u.roles);
    if (approverRole) {
      r.status = 'Menunggu Persetujuan';
      event(u, 'Permintaan ubah email diajukan', 'Pengguna', r.emailBaru);
      // FR-UDR-15: penyetuju menerima email; pengaju tidak menyetujui permintaannya sendiri (FR-UDR-16).
      activeAdmins(approverRole, approverRole === 'R-04' ? u.orgId : undefined)
        .filter((x) => x.id !== u.id)
        .forEach((x) =>
          sendEmail(x.email, 'Permintaan ubah email menunggu persetujuan', `${u.nama} meminta mengubah email menjadi ${r.emailBaru}.`, '/permintaan-ubah-email'),
        );
    } else {
      applyEmailChange(u, s.id);
    }
    commit();
    return toMe(u);
  },

  async resendEmailCode() {
    await delay();
    const u = actor();
    const r = u.emailRequest;
    if (!r?.otp) throw new ServiceError('OTP_SESSION_INVALID');
    resendOtp(r.otp);
    sendEmail(r.emailBaru, 'Kode verifikasi email baru PERISAI', `Kode verifikasi baru Anda: ${r.otp.code}. Kode sebelumnya tidak berlaku lagi.`);
    commit();
    return toEmailRequest(u)!;
  },

  async cancelEmailChange() {
    await delay();
    const u = actor();
    if (u.emailRequest && u.emailRequest.status !== 'Ditolak') event(u, 'Permintaan ubah email dibatalkan', 'Pengguna');
    u.emailRequest = undefined;
    commit();
    return toMe(u);
  },

  async dismissEmailRejection() {
    await delay();
    const u = actor();
    if (u.emailRequest?.status === 'Ditolak') u.emailRequest = undefined;
    commit();
    return toMe(u);
  },
};

/* ---------- alat uji ---------- */

export const devUserTools = {
  async decideEmailRequest(userId: string, approve: boolean) {
    const u = userById(userId);
    if (u.emailRequest?.status !== 'Menunggu Persetujuan') return;
    // Sesi perangkat yang sedang dipakai tetap hidup; sesi lain dicabut (FR-AS-009).
    if (approve) applyEmailChange(u, db().currentSessionId ?? undefined);
    else Object.assign(u.emailRequest, { status: 'Ditolak', alasan: 'Ditolak oleh penyetuju (alat uji).' });
    commit();
  },
  async failNextEmail() {
    db().failNextEmail = true;
    commit();
  },
  /** Admin (uji) menambah/mengurangi satu role pengguna yang sedang masuk (FR-PA-18a, FR-HE-18, FR-LO-19). */
  async simulateRoleChange() {
    const d = db();
    const s = d.sessions.find((x) => x.id === d.currentSessionId);
    if (!s) return;
    const u = userById(s.userId);
    const before = u.roles.join(', ');
    const pool = rolesByOrgType(orgOf(u).jenis).filter((r) => !u.roles.includes(r) && !violatesSod([...u.roles, r]) && r !== 'R-05');
    if (u.roles.length > 1) u.roles = u.roles.slice(0, -1);
    else if (pool[0]) u.roles = [...u.roles, pool[0]];
    event(u, 'Role diubah', 'Administrator (uji)', `${before} → ${u.roles.join(', ')}`);
    audit({ modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum: { Role: before }, sesudah: { Role: u.roles.join(', ') }, alasan: 'Simulasi alat uji', hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
  },
};
