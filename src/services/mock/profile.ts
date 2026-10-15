/**
 * Adapter mock PRD Profil Pengguna (ClickUp z8pmx9n8nx) dan Ekspor Daftar Pengguna (ClickUp z8pmx9n8nz).
 * - Ekspor: cakupan sama dengan daftar (FR-DP-08), seluruh hasil filter/pencarian tanpa batas halaman, kolom sesuai
 *   Export Data Specification, tanpa kata sandi/token, tercatat di Jejak Audit.
*   Keputusan PM 14 Okt 2026: ekspor untuk R-03 dan R-04 (Matriks M-15 belum punya aksi export).
 * - Reset kata sandi oleh admin: mengirim tautan atur ulang (alur Lupa Kata Sandi); kata sandi tidak pernah tampil.
 * - Sesi aktif per pengguna + akhiri satu sesi (alasan wajib, Tabel S-3).
 */
import { buildExport, type ExportFormat } from '@/lib/export-file';
import { formatTanggalJam } from '@/lib/format';
import { roleName } from '@/lib/rbac';
import { SECURITY_PARAMS as P } from '@/lib/security-params';
import { ServiceError, type AdminSession, type UserListQuery, type UserService } from '../types';
import { audit, delay, isLive, log, orgOf, sendEmail, sessionEnd, userById } from './core';
import { commit, db, iso, now, randomId, type DbSession, type DbUser } from './db';
import { actor, assertCanManage, assertReason, event, liveSessions, objekPengguna, reasonText, recordDenial, toSummary, visibleTo } from './users';

const EXPORT_HEADER = ['Nama Lengkap', 'Email', 'Username', 'Jabatan', 'Role', 'Organisasi', 'Status Akun', 'Tanggal Diundang', 'Tanggal Diaktifkan', 'Login Terakhir'];

function toAdminSession(s: DbSession, u: DbUser): AdminSession {
  const org = orgOf(u);
  return {
    id: s.id,
    userId: u.id,
    nama: u.nama,
    email: u.email,
    organisasi: { id: org.id, nama: org.nama, jenis: org.jenis, status: org.status },
    perangkat: s.perangkat,
    browser: s.browser,
    sistemOperasi: s.sistemOperasi,
    perkiraanLokasi: s.perkiraanLokasi,
    waktuMasuk: iso(s.createdAt),
    aktivitasTerakhir: iso(s.lastActivity),
  };
}

function assertVisible(a: DbUser, u: DbUser): void {
  // PRD Profil Pengguna meminta 403 untuk organisasi lain; Penegakan Hak Akses FR-PA-15 → 404 (keputusan PM 14 Okt 2026).
  if (!visibleTo(a, u)) {
    recordDenial(a, u, 'view', 'NOT_FOUND');
    commit();
    throw new ServiceError('NOT_FOUND');
  }
}

export const userProfileService: Pick<UserService, 'exportUsers' | 'resetPassword' | 'userSessions' | 'revokeUserSession'> = {
  async exportUsers(q: UserListQuery, format: ExportFormat) {
    await delay();
    const a = actor();
    if (!a.roles.some((r) => r === 'R-03' || r === 'R-04')) {
      recordDenial(a, undefined, 'export', 'PERMISSION_DENIED');
      commit();
      throw new ServiceError('PERMISSION_DENIED');
    }
    const term = q.search?.trim().toLowerCase();
    const rows = db()
      .users.filter((u) => visibleTo(a, u))
      .map(toSummary)
      .filter((u) => (!q.status || u.status === q.status) && (!q.organisasiId || u.organisasi.id === q.organisasiId))
      .filter((u) => !q.mintaUndanganBaru || !!u.mintaUndanganBaru)
      .filter((u) => !q.role || u.roles.includes(q.role))
      .filter((u) => !term || u.nama.toLowerCase().includes(term) || u.email.includes(term));
    // US-ED-08: tidak membuat file kosong.
    if (!rows.length) throw new ServiceError('NOT_ELIGIBLE');
    const data = rows.map((u) => [
      u.nama,
      u.email,
      u.email.split('@')[0] ?? u.email,
      u.jabatan ?? '',
      u.roles.map((r) => `${r} ${roleName(r)}`).join('; '),
      u.organisasi.nama,
      u.status,
      u.diundangPada ? formatTanggalJam(u.diundangPada) : '',
      u.diaktifkanPada ? formatTanggalJam(u.diaktifkanPada) : '',
      u.loginTerakhir ? formatTanggalJam(u.loginTerakhir) : 'Belum pernah login',
    ]);
    const blob = await buildExport(format, EXPORT_HEADER, data, 'Pengguna');
    const stamp = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(now()));
    audit({
      pelakuId: a.id,
      modul: 'M-15',
      aksi: 'export',
      objek: 'daftar pengguna',
      orgObjekId: a.roles.includes('R-03') ? undefined : a.orgId,
      sesudah: { Format: format.toUpperCase(), Baris: String(rows.length), Filter: JSON.stringify(q) },
      hasil: 'Berhasil',
      kelompok: 'Identitas & akses',
    });
    commit();
    return { filename: `pengguna-perisai-${stamp}.${format}`, blob, count: rows.length };
  },

  async resetPassword(userId) {
    await delay();
    const a = actor();
    const u = userById(userId);
    assertVisible(a, u);
    assertCanManage(a, u, 'manage');
    if (a.id === u.id) throw new ServiceError('SELF_ACTION');
    // Disetujui PM 14 Okt 2026: hanya akun Aktif (akun lain tidak dapat login, FR-LP-03).
    if (u.status !== 'Aktif') throw new ServiceError('NOT_ELIGIBLE');
    const d = db();
    d.resets.filter((r) => r.userId === u.id).forEach((r) => (r.superseded = true));
    const token = randomId('rst');
    d.resets.push({ token, userId: u.id, expiresAt: now() + P.resetLinkValidityMs });
    sendEmail(
      u.email,
      'Atur ulang kata sandi PERISAI',
      `Halo ${u.nama}, admin organisasi Anda meminta Anda mengatur ulang kata sandi. Tautan berlaku sampai ${formatTanggalJam(now() + P.resetLinkValidityMs)}. PERISAI tidak pernah meminta password atau kode OTP lewat email.`,
      `/atur-ulang-kata-sandi/${token}`,
    );
    log({ log: 'akses', event: 'reset_diminta', email: u.email, userId: u.id, result: 'berhasil', reason: 'OLEH_ADMIN' });
    event(u, 'Tautan atur ulang kata sandi dikirim', a.nama);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'manage', objek: objekPengguna(u), orgObjekId: u.orgId, sesudah: { 'Atur ulang kata sandi': 'Tautan dikirim' }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
  },

  async userSessions(userId) {
    await delay();
    const a = actor();
    const u = userById(userId);
    assertVisible(a, u);
    return liveSessions(u)
      .sort((x, y) => y.lastActivity - x.lastActivity)
      .map((s) => toAdminSession(s, u));
  },

  async revokeUserSession(userId, sessionId, reason) {
    await delay();
    const a = actor();
    const u = userById(userId);
    assertVisible(a, u);
    assertCanManage(a, u, 'manage');
    assertReason(reason);
    const s = db().sessions.find((x) => x.id === sessionId && x.userId === u.id);
    if (!s || !isLive(s)) throw new ServiceError('NOT_FOUND');
    sessionEnd(s, 'revoked');
    const alasan = reasonText(reason);
    log({ log: 'akses', event: 'sesi_dicabut_admin', userId: u.id, sessionId: s.id, result: 'berhasil', reason: alasan });
    event(u, 'Sesi diakhiri', a.nama, `${s.browser} · ${s.sistemOperasi} · ${s.perkiraanLokasi} · Alasan: ${alasan}`);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'manage', objek: objekPengguna(u), orgObjekId: u.orgId, sesudah: { 'Sesi diakhiri': `${s.browser} · ${s.sistemOperasi}` }, alasan, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
  },
};
