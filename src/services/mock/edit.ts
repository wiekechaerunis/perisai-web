/**
 * Adapter mock PRD Ubah Data & Role Pengguna (ClickUp z8pmx9n8ny, FR-UDR-01..18) dan tautan email publik.
 * - Ubah pengguna lain: R-03 dan R-07 seluruh organisasi, R-04 organisasinya (FR-UDR-01, -02, D-7).
 * - Ringkasan + perbedaan hak akses sebelum disimpan (FR-UDR-09, FR-HE-17).
 * - Ubah email oleh admin: berlaku setelah pengguna memverifikasi tautan (FR-UDR-05).
 * - Persetujuan permintaan ubah email (FR-UDR-15, -16).
 * Aturan ditegakkan di sini; backend wajib menegakkan ulang.
 */
import { effectiveAccess, scopeFor, type EffectiveModule } from '@/lib/access';
import { formatTanggalJam, maskEmail } from '@/lib/format';
import { ACTION_LABEL, type RoleId, roleName } from '@/lib/rbac';
import {
  ALASAN_LAINNYA_MAX,
  JABATAN_MAX,
  NAMA_EDIT_MAX,
  NAMA_EDIT_MIN,
  editableRoles,
  emailApproverRole,
  inviterRoleOf,
  violatesSod,
} from '@/lib/user-rules';
import {
  ServiceError,
  type AccessDiffItem,
  type EmailLinkService,
  type EmailRequestItem,
  type FieldChange,
  type UpdateUserInput,
  type UserChangePreview,
  type UserService,
} from '../types';
import { audit, delay, normEmail, orgOf, sendEmail, sessionEnd, userById } from './core';
import { commit, db, iso, now, randomId, type DbUser } from './db';
import { wkOperatedBy } from './seed';
import { isRoleActive, needsWk } from '@/lib/role-catalog';
import {
  actor,
  activeAdmins,
  applyEmailChange,
  checkEmailForOrg,
  event,
  liveSessions,
  newEmailLink,
  newestSessionId,
  objekPengguna,
  recordDenial,
  toDetail,
  visibleTo,
} from './users';

const roleLabel = (r: RoleId) => `${r} ${roleName(r)}`;
const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x) => b.includes(x));

/** FR-UDR-01, -02: siapa boleh mengubah. Organisasi lain untuk R-04 = seperti data tidak ada (404). */
function assertCanEdit(a: DbUser, u: DbUser) {
  const editor = inviterRoleOf(a.roles);
  if (!editor || !visibleTo(a, u)) {
    if (editor) recordDenial(a, u, 'edit', 'NOT_FOUND');
    else recordDenial(a, u, 'edit', 'PERMISSION_DENIED');
    throw new ServiceError(editor ? 'NOT_FOUND' : 'PERMISSION_DENIED');
  }
  // Disetujui PM 14 Okt 2026: akun Nonaktif dan organisasi nonaktif tidak bisa diubah (selaras FR-SA-24b).
  if (u.status === 'Nonaktif') throw new ServiceError('NOT_ELIGIBLE');
  if (orgOf(u).status !== 'Aktif') throw new ServiceError('ORG_INACTIVE');
  return editor;
}

interface Normalized {
  nama: string;
  jabatan?: string;
  email?: string;
  roles: RoleId[];
  wkIds: string[];
  kkksIds: string[];
}

function normalize(a: DbUser, u: DbUser, input: UpdateUserInput): Normalized {
  const editor = assertCanEdit(a, u);
  const self = a.id === u.id;
  const d = db();
  const org = orgOf(u);

  const nama = input.nama.trim();
  if (!nama) throw new ServiceError('VALIDATION', { field: 'nama', value: 'kosong' });
  if (nama.length < NAMA_EDIT_MIN || nama.length > NAMA_EDIT_MAX) throw new ServiceError('VALIDATION', { field: 'nama' });
  const jabatan = input.jabatan?.trim() || undefined;
  if ((jabatan ?? '').length > JABATAN_MAX) throw new ServiceError('VALIDATION', { field: 'jabatan' });

  let email: string | undefined;
  if (input.email !== undefined && normEmail(input.email) !== u.email) {
    // Email diri sendiri lewat permintaan di Akun Saya (FR-UDR-12).
    if (self) throw new ServiceError('PERMISSION_DENIED');
    // Disetujui PM 14 Okt 2026: email akun yang belum aktif diganti lewat batalkan + undang ulang.
    if (u.status !== 'Aktif' && u.status !== 'Ditangguhkan') throw new ServiceError('NOT_ELIGIBLE');
    email = normEmail(input.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ServiceError('VALIDATION', { field: 'email' });
    if (d.users.some((x) => x.id !== u.id && (x.email === email || x.adminEmailChange?.emailBaru === email))) {
      throw new ServiceError('EMAIL_REGISTERED', { field: 'email' });
    }
    checkEmailForOrg(email, org);
  }

  const roles = [...new Set(input.roles)];
  if (!sameSet(roles, u.roles)) {
    // FR-UDR-11: tidak ada pengguna yang dapat mengubah role-nya sendiri (403; dicatat di Jejak Audit, PR-03).
    if (self) {
      recordDenial(a, u, 'edit', 'PERMISSION_DENIED');
      commit();
      throw new ServiceError('PERMISSION_DENIED');
    }
    if (roles.length === 0) throw new ServiceError('VALIDATION', { field: 'role' });
    // FR-AR-07: penetapan baru role Tidak Aktif ditolak; role lama yang sudah dimiliki boleh tetap (FR-AR-08).
    if (roles.some((r) => !u.roles.includes(r) && !isRoleActive(r))) throw new ServiceError('ROLE_INACTIVE', { field: 'role' });
    const allowed = editableRoles(editor, org.jenis);
    // Role lama yang di luar kewenangan pengubah boleh tetap ada, tetapi tidak boleh ditambahkan (FR-UDR-08).
    if (roles.some((r) => !allowed.includes(r) && !u.roles.includes(r))) throw new ServiceError('ROLE_NOT_ALLOWED', { field: 'role' });
    if (violatesSod(roles)) throw new ServiceError('SOD_VIOLATION', { field: 'role' });
  }

  // FR-CD-09: Pelapor KKKS wajib minimal satu Wilayah Kerja aktif organisasinya.
  let wkIds: string[] = [];
  if (needsWk(roles)) {
    wkIds = input.wilayahKerjaIds ?? u.wilayahKerjaIds;
    const orgWk = d.wk.filter((w) => wkOperatedBy(w, u.orgId)).map((w) => w.id);
    if (wkIds.length === 0 || wkIds.some((id) => !orgWk.includes(id))) throw new ServiceError('VALIDATION', { field: 'wilayahKerja' });
  }
  // FR-CD-04b, FR-CD-07: cakupan R-02.
  let kkksIds: string[] = [];
  if (roles.includes('R-02')) {
    kkksIds = input.cakupanOrganisasiIds ?? u.kkksIds ?? [];
    if (kkksIds.some((id) => d.orgs.find((o) => o.id === id)?.jenis !== 'KKKS')) throw new ServiceError('VALIDATION', { field: 'cakupan' });
  }
  return { nama, jabatan, email, roles, wkIds, kkksIds };
}

function wkNames(ids: string[]): string {
  const names = db().wk.filter((w) => ids.includes(w.id)).map((w) => w.nama);
  return names.length ? names.join(', ') : '—';
}

function cakupanText(roles: RoleId[], kkksIds: string[]): string {
  if (!roles.includes('R-02')) return '—';
  if (!kkksIds.length) return 'Seluruh KKKS';
  return db().orgs.filter((o) => kkksIds.includes(o.id)).map((o) => o.nama).join(', ');
}

function changesOf(u: DbUser, n: Normalized): FieldChange[] {
  const c: FieldChange[] = [];
  if (n.nama !== u.nama) c.push({ field: 'nama', sebelum: u.nama, sesudah: n.nama });
  if ((n.jabatan ?? '') !== (u.jabatan ?? '')) c.push({ field: 'jabatan', sebelum: u.jabatan ?? '—', sesudah: n.jabatan ?? '—' });
  if (n.email) c.push({ field: 'email', sebelum: u.email, sesudah: n.email });
  if (!sameSet(n.roles, u.roles)) c.push({ field: 'roles', sebelum: u.roles.map(roleLabel).join(', '), sesudah: n.roles.map(roleLabel).join(', ') });
  const wkBefore = needsWk(u.roles) ? u.wilayahKerjaIds : [];
  if (!sameSet(n.wkIds, wkBefore)) c.push({ field: 'wilayahKerja', sebelum: wkNames(wkBefore), sesudah: wkNames(n.wkIds) });
  const before = cakupanText(u.roles, u.kkksIds ?? []);
  const after = cakupanText(n.roles, n.kkksIds);
  if (before !== after) c.push({ field: 'cakupan', sebelum: before, sesudah: after });
  return c;
}

function accessOf(u: DbUser, roles: RoleId[], wkIds: string[], kkksIds: string[]): EffectiveModule[] {
  const d = db();
  const scope = scopeFor({
    roles,
    organisasi: orgOf(u).nama,
    wilayahKerja: d.wk.filter((w) => wkIds.includes(w.id)).map((w) => w.nama),
    kkksDitugaskan: d.orgs.filter((o) => kkksIds.includes(o.id)).map((o) => o.nama),
  });
  // Dihitung seolah akun Aktif agar perbedaan izin terlihat untuk akun Ditangguhkan/Diundang juga.
  return effectiveAccess('Aktif', roles, scope);
}

/** FR-HE-17: izin per modul yang bertambah/berkurang. */
function accessDiff(before: EffectiveModule[], after: EffectiveModule[]): { tambah: AccessDiffItem[]; kurang: AccessDiffItem[] } {
  const label = (p: EffectiveModule['permissions'][number]) => (p.notes.length ? `${ACTION_LABEL[p.action]} (${p.notes.join('; ')})` : ACTION_LABEL[p.action]);
  const index = (mods: EffectiveModule[]) => new Map(mods.map((m) => [m.module, { nama: m.nama, aksi: m.permissions.map(label) }]));
  const b = index(before);
  const a = index(after);
  const diff = (x: typeof a, y: typeof a): AccessDiffItem[] =>
    [...x.entries()]
      .map(([module, v]) => ({ module, nama: v.nama, aksi: v.aksi.filter((s) => !(y.get(module)?.aksi ?? []).includes(s)) }))
      .filter((m) => m.aksi.length > 0);
  return { tambah: diff(a, b), kurang: diff(b, a) };
}

function preview(u: DbUser, n: Normalized): UserChangePreview {
  const perubahan = changesOf(u, n);
  if (!perubahan.length) throw new ServiceError('NO_CHANGES');
  const { tambah, kurang } = accessDiff(
    accessOf(u, u.roles, needsWk(u.roles) ? u.wilayahKerjaIds : [], u.kkksIds ?? []),
    accessOf(u, n.roles, n.wkIds, n.kkksIds),
  );
  return { perubahan, aksesBertambah: tambah, aksesBerkurang: kurang };
}

const FIELD_AUDIT: Record<FieldChange['field'], string> = {
  nama: 'Nama lengkap',
  jabatan: 'Jabatan',
  email: 'Email (menunggu verifikasi)',
  roles: 'Role',
  wilayahKerja: 'Wilayah kerja',
  cakupan: 'Cakupan',
};

function approverCan(a: DbUser, u: DbUser): boolean {
  if (u.emailRequest?.status !== 'Menunggu Persetujuan' || a.id === u.id || a.status !== 'Aktif') return false;
  const role = emailApproverRole(u.roles);
  if (role === 'R-03') return a.roles.includes('R-03');
  if (role === 'R-04') return a.roles.includes('R-04') && a.orgId === u.orgId;
  return false;
}

export const userEditService: Pick<UserService, 'previewUpdate' | 'updateUser' | 'listEmailRequests' | 'approveEmailRequest' | 'rejectEmailRequest'> = {
  async previewUpdate(userId, input) {
    await delay();
    const a = actor();
    const u = userById(userId);
    return preview(u, normalize(a, u, input));
  },

  async updateUser(userId, input) {
    await delay();
    const a = actor();
    const u = userById(userId);
    const n = normalize(a, u, input);
    const p = preview(u, n);
    const korelasi = randomId('kor');
    const sebelum: Record<string, string> = {};
    const sesudah: Record<string, string> = {};
    for (const c of p.perubahan) {
      sebelum[FIELD_AUDIT[c.field]] = c.sebelum;
      sesudah[FIELD_AUDIT[c.field]] = c.sesudah;
    }
    const hadR03 = u.roles.includes('R-03');

    u.nama = n.nama;
    u.jabatan = n.jabatan;
    u.roles = n.roles;
    u.wilayahKerjaIds = n.wkIds;
    u.kkksIds = n.kkksIds;
    const dataFields = p.perubahan.filter((c) => c.field === 'nama' || c.field === 'jabatan');
    if (dataFields.length) event(u, 'Data pengguna diubah', a.nama, dataFields.map((c) => `${FIELD_AUDIT[c.field]}: ${c.sebelum} → ${c.sesudah}`).join('; '));
    const roleFields = p.perubahan.filter((c) => c.field === 'roles' || c.field === 'wilayahKerja' || c.field === 'cakupan');
    // FR-UDR-07: role baru berlaku pada permintaan berikutnya, tanpa mengakhiri sesi (FR-LO-19).
    if (roleFields.length) event(u, 'Role dan cakupan diubah', a.nama, roleFields.map((c) => `${FIELD_AUDIT[c.field]}: ${c.sebelum} → ${c.sesudah}`).join('; '));

    if (n.email) {
      // FR-UDR-05: tautan verifikasi ke email baru; email lama tetap dipakai sampai terverifikasi.
      u.emailRequest = undefined;
      const token = newEmailLink(u, 'verify');
      u.adminEmailChange = { emailBaru: n.email, token, diajukan: now(), olehId: a.id };
      sendEmail(n.email, 'Verifikasi email baru akun PERISAI', `${a.nama} mengubah email akun PERISAI Anda menjadi alamat ini. Buka tautan untuk memverifikasi.`, `/verifikasi-email/${token}`);
      event(u, 'Perubahan email diajukan', a.nama, `${u.email} → ${n.email} · menunggu verifikasi pengguna`);
    }

    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum, sesudah, hasil: 'Berhasil', kelompok: 'Identitas & akses', korelasi });

    // FR-UDR-01: perubahan oleh Admin Teknis diberitahukan ke Admin SKK.
    const admins = activeAdmins('R-03').filter((x) => x.id !== a.id);
    if (a.roles.includes('R-07') && !a.roles.includes('R-03')) {
      admins.forEach((x) => sendEmail(x.email, 'Perubahan pengguna oleh Admin Teknis', `${a.nama} mengubah data pengguna ${u.nama}: ${Object.keys(sesudah).join(', ')}.`));
    }
    // FR-UDR-01 / FR-UP-11b: pemberian role Admin SKK diberitahukan ke seluruh Admin SKK aktif.
    if (!hadR03 && n.roles.includes('R-03')) {
      admins.forEach((x) => sendEmail(x.email, 'Role Admin SKK diberikan', `${a.nama} memberikan role Admin SKK kepada ${u.nama}.`));
    }
    commit();
    return toDetail(u);
  },

  async listEmailRequests() {
    await delay();
    const a = actor();
    return db()
      .users.filter((u) => approverCan(a, u))
      .map(
        (u): EmailRequestItem => ({
          userId: u.id,
          nama: u.nama,
          organisasi: orgOf(u).nama,
          emailLama: u.email,
          emailBaru: u.emailRequest!.emailBaru,
          diajukan: iso(u.emailRequest!.diajukan),
        }),
      )
      .sort((x, y) => x.diajukan.localeCompare(y.diajukan));
  },

  async approveEmailRequest(userId) {
    await delay();
    const a = actor();
    const u = userById(userId);
    if (!approverCan(a, u)) throw new ServiceError('NOT_FOUND');
    const r = u.emailRequest!;
    // FR-UDR-16, EC-UDR-07: pemeriksaan ulang keunikan dan aturan domain; gagal → ditolak otomatis.
    let gagal: { code: 'EMAIL_TAKEN_ON_APPROVE' | 'EMAIL_DOMAIN_NOT_ALLOWED'; alasan: string } | null = null;
    if (db().users.some((x) => x.id !== u.id && x.email === r.emailBaru)) gagal = { code: 'EMAIL_TAKEN_ON_APPROVE', alasan: 'Email ini sudah dipakai akun lain.' };
    else {
      try {
        checkEmailForOrg(r.emailBaru, orgOf(u));
      } catch {
        gagal = { code: 'EMAIL_DOMAIN_NOT_ALLOWED', alasan: 'Email ini belum diizinkan untuk organisasi Anda.' };
      }
    }
    if (gagal) {
      Object.assign(r, { status: 'Ditolak', alasan: gagal.alasan });
      sendEmail(u.email, 'Permintaan ubah email ditolak', `Alasan: ${gagal.alasan}`);
      event(u, 'Permintaan ubah email ditolak', 'Sistem', gagal.alasan);
      audit({ modul: 'M-15', aksi: 'approve', objek: objekPengguna(u), orgObjekId: u.orgId, sesudah: { 'Permintaan ubah email': 'Ditolak otomatis' }, alasan: gagal.alasan, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
      commit();
      throw new ServiceError(gagal.code);
    }
    const emailBaru = r.emailBaru;
    // FR-AS-011: sesi lain dicabut; sesi pengguna yang paling baru aktif dipertahankan (disetujui PM 14 Okt 2026).
    applyEmailChange(u, newestSessionId(u));
    event(u, 'Permintaan ubah email disetujui', a.nama, emailBaru);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'approve', objek: objekPengguna(u), orgObjekId: u.orgId, sesudah: { 'Permintaan ubah email': `Disetujui (${emailBaru})` }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
  },

  async rejectEmailRequest(userId, alasan) {
    await delay();
    const a = actor();
    const u = userById(userId);
    if (!approverCan(a, u)) throw new ServiceError('NOT_FOUND');
    const text = alasan.trim();
    if (!text || text.length > ALASAN_LAINNYA_MAX) throw new ServiceError('VALIDATION', { field: 'alasan' });
    Object.assign(u.emailRequest!, { status: 'Ditolak', alasan: text });
    sendEmail(u.email, 'Permintaan ubah email ditolak', `Permintaan Anda mengubah email ditolak oleh ${a.nama}. Alasan: ${text}`);
    event(u, 'Permintaan ubah email ditolak', a.nama, `Alasan: ${text}`);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'approve', objek: objekPengguna(u), orgObjekId: u.orgId, sesudah: { 'Permintaan ubah email': 'Ditolak' }, alasan: text, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
  },
};

/* ---------- tautan publik dari email ---------- */

function linkOf(token: string, kind: 'verify' | 'notme') {
  return db().emailLinks.find((l) => l.token === token && l.kind === kind);
}

export const emailLinkService: EmailLinkService = {
  async checkVerifyLink(token) {
    await delay();
    const l = linkOf(token, 'verify');
    if (!l) return { state: 'invalid' };
    if (l.used) return { state: 'used' };
    const u = userById(l.userId);
    // Diganti perubahan lain atau dibatalkan otomatis (EC-UDR-05/06) → tidak berlaku.
    if (u.adminEmailChange?.token !== token) return { state: 'invalid' };
    return { state: 'valid', emailBaru: u.adminEmailChange.emailBaru };
  },

  async confirmVerifyLink(token) {
    await delay();
    const l = linkOf(token, 'verify');
    const u = l ? userById(l.userId) : undefined;
    if (!l || l.used || !u || u.adminEmailChange?.token !== token) throw new ServiceError('TOKEN_INVALID');
    const baru = u.adminEmailChange.emailBaru;
    if (db().users.some((x) => x.id !== u.id && x.email === baru)) throw new ServiceError('EMAIL_REGISTERED');
    const lama = u.email;
    u.email = baru;
    u.adminEmailChange = undefined;
    l.used = true;
    // FR-UDR-05: setelah berlaku, seluruh sesi dicabut; notifikasi ke email lama dan baru.
    liveSessions(u).forEach((s) => sessionEnd(s, 'password_changed'));
    const t = newEmailLink(u, 'notme', true);
    sendEmail(lama, 'Email akun PERISAI Anda diubah', `Email akun Anda diubah menjadi ${maskEmail(baru)} pada ${formatTanggalJam(now())}. Bukan Anda? Buka tautan "Bukan saya".`, `/bukan-saya/${t}`);
    sendEmail(baru, 'Email akun PERISAI Anda sudah berlaku', 'Mulai sekarang, gunakan email ini untuk masuk ke PERISAI.');
    event(u, 'Email diubah', 'Pengguna', `${lama} → ${baru} · terverifikasi ${formatTanggalJam(now())}`);
    audit({ pelakuId: u.id, modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum: { Email: lama }, sesudah: { Email: baru }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
  },

  async checkNotMeLink(token) {
    await delay();
    const l = linkOf(token, 'notme');
    if (!l) return { state: 'invalid' };
    return { state: l.used ? 'used' : 'valid' };
  },

  async confirmNotMe(token) {
    await delay();
    const l = linkOf(token, 'notme');
    if (!l || l.used) throw new ServiceError('TOKEN_INVALID');
    const u = userById(l.userId);
    l.used = true;
    // FR-UDR-13, -14: batalkan permintaan yang belum berlaku dan cabut seluruh sesi akun.
    if (u.emailRequest && u.emailRequest.status !== 'Ditolak') u.emailRequest = undefined;
    // Pesan Login umum (K-14), bukan 'diakhiri oleh admin organisasi'.
    liveSessions(u).forEach((s) => sessionEnd(s, 'password_changed'));
    event(u, 'Tautan "Bukan saya" dibuka', 'Pengguna', 'Permintaan ubah email dibatalkan dan seluruh sesi dicabut.');
    audit({ pelakuId: u.id, modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sesudah: { 'Permintaan ubah email': 'Dibatalkan lewat "Bukan saya"' }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    if (l.afterChange) {
      activeAdmins('R-03').forEach((x) =>
        sendEmail(x.email, 'Laporan "Bukan saya" atas perubahan email', `${u.nama} (${orgOf(u).nama}) melaporkan perubahan email akunnya tidak ia lakukan. Seluruh sesi akun sudah dicabut.`),
      );
    }
    commit();
  },
};
