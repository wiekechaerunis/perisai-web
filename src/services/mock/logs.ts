/**
 * Adapter mock LogService — Log Akses (PRD ac582539-7263, FR-LA-01..19) dan Jejak Audit (PRD 70911a9e-e9ed,
 * FR-JA-01..25). Hak lihat: R-02/R-03 semua organisasi, R-04 organisasinya (FR-LA-06, FR-JA-11, FR-MX-07d);
 * R-07 tanpa akses (FR-LA-06). Penolakan tercatat (PR-03, ASSUMPTION: Log Akses dan Jejak Audit).
 */
import { formatTanggalJam } from '@/lib/format';
import { accessEvent, FAILED_STREAK_THRESHOLD, REASON_LABEL } from '@/lib/log-events';
import { MODULES } from '@/lib/rbac';
import { endOfDayWib } from '@/lib/user-rules';
import {
  ServiceError,
  type AccessLogEntry,
  type AccessLogQuery,
  type AdminSession,
  type AuditEntry,
  type AuditQuery,
  type LogService,
  type Page,
} from '../types';
import { audit, delay, isLive, log, requireSession, sessionEnd, userById } from './core';
import { commit, db, iso, now, type DbAudit, type DbUser, type LogEntry } from './db';

const MONTH = 30 * 86_400_000;

function actor(): DbUser {
  return userById(requireSession(true).userId);
}

type Reach = { all: true } | { all: false; orgId: string };

/** Siapa boleh melihat log (FR-LA-06, FR-JA-11). */
function reach(a: DbUser): Reach {
  if (a.roles.includes('R-02') || a.roles.includes('R-03')) return { all: true };
  if (a.roles.includes('R-04')) return { all: false, orgId: a.orgId };
  // PR-03: penolakan hanya di Jejak Audit.
  audit({ pelakuId: a.id, modul: 'M-22', aksi: 'view', objek: 'modul M-22', orgObjekId: a.orgId, hasil: 'Ditolak', alasan: 'Tidak punya izin', kelompok: 'Penolakan akses' });
  commit();
  throw new ServiceError('PERMISSION_DENIED');
}

function assertR03(a: DbUser, aksi: 'export' | 'manage'): void {
  if (a.roles.includes('R-03')) return;
  audit({ pelakuId: a.id, modul: 'M-22', aksi, objek: 'modul M-22', orgObjekId: a.orgId, hasil: 'Ditolak', alasan: 'Tidak punya izin', kelompok: 'Penolakan akses' });
  commit();
  throw new ServiceError('PERMISSION_DENIED');
}

function range(dari: string, sampai: string): [number, number] {
  return [new Date(`${dari}T00:00:00+07:00`).getTime(), endOfDayWib(sampai).getTime()];
}

function archived(at: number): boolean {
  return now() - at > db().retention.aktifBulan * MONTH;
}

function deviceOf(ua: string): string {
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /Linux/.test(ua) ? 'Linux' : '—';
  return `${browser} · ${os}`;
}

function paginate<T>(rows: T[], page: number, pageSize: number): Page<T> {
  const p = Math.max(1, page);
  return { items: rows.slice((p - 1) * pageSize, p * pageSize), total: rows.length, page: p, pageSize };
}

/* ---------- Log Akses ---------- */

function toAccess(e: LogEntry, viewer: DbUser, r: Reach): AccessLogEntry | null {
  const def = accessEvent(e.event, e.reason);
  if (!def) return null;
  const d = db();
  const u = d.users.find((x) => x.id === e.userId);
  const org = d.orgs.find((o) => o.id === e.orgId);
  // FR-LA-06a: Admin KKKS tidak melihat IP pelaku dari organisasi lain.
  const showIp = r.all || e.orgId === viewer.orgId;
  return {
    id: e.id,
    waktu: iso(e.at),
    pengguna: u?.nama ?? e.email ?? '—',
    email: u?.email ?? e.email,
    userId: e.userId,
    organisasi: org ? { id: org.id, nama: org.nama, jenis: org.jenis, status: org.status } : undefined,
    kelompok: def.kelompok,
    peristiwa: def.label,
    hasil: e.result === 'berhasil' ? 'Berhasil' : 'Gagal',
    alasan: e.reason ? (REASON_LABEL[e.reason] ?? e.reason) : undefined,
    ip: showIp ? e.ip : undefined,
    userAgent: showIp ? e.userAgent : undefined,
    perangkat: deviceOf(e.userAgent),
    perkiraanLokasi: 'Jakarta, Indonesia',
    sesiId: e.sessionId,
    modul: e.modul ? `${e.modul} ${MODULES[e.modul as keyof typeof MODULES]?.name ?? ''}`.trim() : undefined,
    aksi: e.aksi,
    arsip: archived(e.at),
  };
}

function queryAccess(q: AccessLogQuery, viewer: DbUser): AccessLogEntry[] {
  const r = reach(viewer);
  const [from, to] = range(q.dari, q.sampai);
  let rows = db()
    .logs.filter((e) => e.at >= from && e.at <= to)
    .filter((e) => r.all || e.orgId === r.orgId);
  if (q.gagalBeruntun) {
    // Kegagalan login berturut-turut ≥ ambang lockout per email (FR-LA-12).
    const byEmail = new Map<string, LogEntry[]>();
    for (const e of [...rows].sort((a, b) => a.at - b.at)) {
      if (!e.email || (e.event !== 'login_gagal' && e.event !== 'login_berhasil')) continue;
      const list = byEmail.get(e.email) ?? [];
      if (e.event === 'login_berhasil') list.length = 0;
      else list.push(e);
      byEmail.set(e.email, list);
    }
    const ids = new Set([...byEmail.values()].filter((l) => l.length >= FAILED_STREAK_THRESHOLD).flat().map((e) => e.id));
    rows = rows.filter((e) => ids.has(e.id));
  }
  const term = q.pengguna?.trim().toLowerCase();
  return rows
    .map((e) => toAccess(e, viewer, r))
    .filter((e): e is AccessLogEntry => !!e)
    .filter((e) => !term || e.pengguna.toLowerCase().includes(term) || (e.email ?? '').includes(term))
    .filter((e) => !q.organisasiId || e.organisasi?.id === q.organisasiId)
    .filter((e) => !q.kelompok || e.kelompok === q.kelompok)
    .filter((e) => !q.hasil || e.hasil === q.hasil)
    .filter((e) => !q.ip || (e.ip ?? '').includes(q.ip.trim()))
    .filter((e) => !q.sesiId || e.sesiId === q.sesiId)
    .reverse() // waktu sama → entri terbaru (dimasukkan terakhir) di atas
    .sort((a, b) => b.waktu.localeCompare(a.waktu));
}

function csv(header: string[], rows: (string | undefined)[][]): string {
  const esc = (v: string | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;
  return [header.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

/* ---------- Jejak Audit ---------- */

function toAudit(e: DbAudit): AuditEntry {
  const org = db().orgs.find((o) => o.id === e.orgObjekId);
  return {
    id: e.id,
    waktu: iso(e.at),
    pelaku: e.pelaku,
    pelakuRole: e.pelakuRole,
    pelakuOrganisasi: e.pelakuOrganisasi,
    modul: e.modul,
    aksi: e.aksi,
    objek: e.objek,
    organisasiObjek: org ? `${org.nama}${org.status === 'Nonaktif' ? ' (Nonaktif)' : ''}` : undefined,
    sebelum: e.sebelum,
    sesudah: e.sesudah,
    alasan: e.alasan,
    hasil: e.hasil,
    ip: e.ip,
    userAgent: e.userAgent,
    korelasi: e.korelasi,
    kelompok: e.kelompok,
    arsip: archived(e.at),
  };
}

function queryAudit(q: AuditQuery, viewer: DbUser): AuditEntry[] {
  const r = reach(viewer);
  const [from, to] = range(q.dari, q.sampai);
  const viewerOrgName = db().orgs.find((o) => o.id === viewer.orgId)?.nama;
  const pelaku = q.pelaku?.trim().toLowerCase();
  const objek = q.objek?.trim().toLowerCase();
  return db()
    .audit.filter((e) => (q.korelasi ? e.korelasi === q.korelasi : e.at >= from && e.at <= to))
    // FR-MX-07d: Admin KKKS melihat peristiwa yang menyentuh organisasinya.
    .filter((e) => r.all || e.orgObjekId === r.orgId || e.pelakuOrganisasi === viewerOrgName)
    .filter((e) => !q.organisasiId || e.orgObjekId === q.organisasiId)
    .filter((e) => !q.modul || e.modul === q.modul)
    .filter((e) => !q.aksi || e.aksi === q.aksi)
    .filter((e) => !q.hasil || e.hasil === q.hasil)
    .filter((e) => !pelaku || e.pelaku.toLowerCase().includes(pelaku))
    .filter((e) => !objek || e.objek.toLowerCase().includes(objek))
    .reverse() // waktu sama → entri terbaru di atas
    .sort((a, b) => b.at - a.at)
    .map(toAudit);
}

/* ---------- Service ---------- */

export const logService: LogService = {
  async accessLog(q) {
    await delay();
    const rows = queryAccess(q, actor());
    commit();
    return paginate(rows, q.page, q.pageSize);
  },

  async accessEntry(id) {
    await delay();
    const a = actor();
    const r = reach(a);
    const e = db().logs.find((x) => x.id === id);
    const out = e && (r.all || e.orgId === r.orgId) ? toAccess(e, a, r) : null;
    if (!out) throw new ServiceError('NOT_FOUND');
    return out;
  },

  async exportAccessLog(q) {
    await delay();
    const a = actor();
    assertR03(a, 'export');
    const rows = queryAccess(q, a);
    // FR-LA-17: ekspor tercatat.
    audit({ pelakuId: a.id, modul: 'M-22', aksi: 'export', objek: 'Log akses', sesudah: { Periode: `${q.dari} s.d. ${q.sampai}`, Baris: String(rows.length) }, hasil: 'Berhasil', kelompok: 'Konfigurasi' });
    commit();
    return csv(
      ['Waktu (WIB)', 'Pengguna', 'Organisasi', 'Kelompok', 'Peristiwa', 'Hasil', 'Alasan', 'Alamat IP', 'User agent', 'Id sesi', 'Arsip'],
      rows.map((e) => [formatTanggalJam(e.waktu), e.email ?? e.pengguna, e.organisasi?.nama, e.kelompok, e.peristiwa, e.hasil, e.alasan, e.ip, e.userAgent, e.sesiId, e.arsip ? 'Ya' : 'Tidak']),
    );
  },

  async activeSessions(q = {}) {
    await delay();
    const a = actor();
    const r = reach(a);
    const d = db();
    const term = q.pengguna?.trim().toLowerCase();
    const rows: AdminSession[] = d.sessions
      .filter((s) => isLive(s))
      .map((s) => ({ s, u: d.users.find((u) => u.id === s.userId)! }))
      .filter(({ u }) => !!u && (r.all || u.orgId === r.orgId))
      .filter(({ u }) => !q.organisasiId || u.orgId === q.organisasiId)
      .filter(({ u }) => !term || u.nama.toLowerCase().includes(term) || u.email.includes(term))
      .map(({ s, u }) => {
        const org = d.orgs.find((o) => o.id === u.orgId)!;
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
      })
      .sort((x, y) => y.aktivitasTerakhir.localeCompare(x.aktivitasTerakhir));
    commit();
    return rows;
  },

  async revokeSession(sessionId, reason) {
    await delay();
    const a = actor();
    const d = db();
    const s = d.sessions.find((x) => x.id === sessionId);
    if (!s || !isLive(s)) throw new ServiceError('NOT_FOUND');
    const u = userById(s.userId);
    // FR-LO-14/15: R-03 semua, R-04 organisasi sendiri.
    const ok = a.roles.includes('R-03') || (a.roles.includes('R-04') && a.orgId === u.orgId);
    if (!ok) throw new ServiceError('PERMISSION_DENIED');
    if (!reason.alasan || (reason.alasan === 'Lainnya' && !reason.penjelasan?.trim())) throw new ServiceError('VALIDATION', { field: 'alasan' });
    sessionEnd(s, 'revoked');
    const alasan = reason.alasan === 'Lainnya' ? `Lainnya: ${reason.penjelasan}` : reason.alasan;
    log({ log: 'akses', event: 'sesi_dicabut_admin', userId: u.id, sessionId: s.id, result: 'berhasil', reason: alasan });
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'manage', objek: `pengguna #${u.id}`, orgObjekId: u.orgId, sesudah: { 'Sesi dicabut': '1' }, alasan, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    u.events.unshift({ id: `ev-${s.id}`, at: now(), peristiwa: 'Sesi dicabut', pelaku: a.nama, keterangan: `1 sesi · Alasan: ${alasan}` });
    commit();
  },

  async myLoginHistory() {
    await delay();
    const a = actor();
    const since = now() - 30 * 86_400_000;
    const r: Reach = { all: false, orgId: a.orgId };
    const own = db()
      .logs.filter((e) => (e.userId === a.id || e.email === a.email) && (e.event.startsWith('login_') || e.event === 'otp_berhasil'))
      .reverse()
      .sort((x, y) => y.at - x.at);
    const recent = own.filter((e) => e.at >= since);
    // FR-LA-15a: 20 peristiwa terakhir atau 30 hari (yang lebih banyak); FR-LA-15b: tanpa IP penuh.
    const pick = recent.length >= 20 ? recent : own.slice(0, 20);
    return pick.map((e) => ({ ...toAccess(e, a, r)!, ip: undefined, userAgent: undefined }));
  },

  async audit(q) {
    await delay();
    const rows = queryAudit(q, actor());
    commit();
    return paginate(rows, q.page, q.pageSize);
  },

  async auditEntry(id) {
    await delay();
    const a = actor();
    reach(a);
    const e = db().audit.find((x) => x.id === id);
    if (!e) throw new ServiceError('NOT_FOUND');
    return toAudit(e);
  },

  async exportAudit(q) {
    await delay();
    const a = actor();
    assertR03(a, 'export');
    const rows = queryAudit(q, a);
    // FR-JA-19: ekspor tercatat.
    audit({ pelakuId: a.id, modul: 'M-22', aksi: 'export', objek: 'Jejak audit', sesudah: { Periode: `${q.dari} s.d. ${q.sampai}`, Baris: String(rows.length) }, hasil: 'Berhasil', kelompok: 'Konfigurasi' });
    commit();
    const kv = (o?: Record<string, string>) => (o ? Object.entries(o).map(([k, v]) => `${k}: ${v}`).join('; ') : '');
    return csv(
      ['Waktu (WIB)', 'Pelaku', 'Role pelaku', 'Organisasi pelaku', 'Modul', 'Aksi', 'Objek', 'Organisasi objek', 'Nilai sebelum', 'Nilai sesudah', 'Alasan', 'Hasil', 'Alamat IP', 'Id korelasi', 'Arsip'],
      rows.map((e) => [formatTanggalJam(e.waktu), e.pelaku, e.pelakuRole, e.pelakuOrganisasi, `${e.modul} ${MODULES[e.modul].name}`, e.aksi, e.objek, e.organisasiObjek, kv(e.sebelum), kv(e.sesudah), e.alasan, e.hasil, e.ip, e.korelasi, e.arsip ? 'Ya' : 'Tidak']),
    );
  },

  async retention() {
    await delay();
    const a = actor();
    reach(a);
    const r = db().retention;
    return { aktifBulan: r.aktifBulan, totalTahun: r.totalTahun, diubah: r.diubah ? iso(r.diubah) : undefined, diubahOleh: r.diubahOleh };
  },

  async setRetention(p) {
    await delay();
    const a = actor();
    assertR03(a, 'manage');
    if (!Number.isInteger(p.aktifBulan) || p.aktifBulan < 1 || !Number.isInteger(p.totalTahun) || p.totalTahun < 1 || p.totalTahun * 12 < p.aktifBulan) {
      throw new ServiceError('VALIDATION', { field: 'retensi' });
    }
    const d = db();
    const before = { ...d.retention };
    d.retention = { aktifBulan: p.aktifBulan, totalTahun: p.totalTahun, diubah: now(), diubahOleh: a.nama };
    // FR-JA-25: perubahan tercatat, tidak berlaku surut.
    audit({
      pelakuId: a.id,
      modul: 'M-22',
      aksi: 'manage',
      objek: 'Kebijakan retensi',
      sebelum: { 'Masa aktif': `${before.aktifBulan} bulan`, 'Masa simpan total': `${before.totalTahun} tahun` },
      sesudah: { 'Masa aktif': `${p.aktifBulan} bulan`, 'Masa simpan total': `${p.totalTahun} tahun` },
      hasil: 'Berhasil',
      kelompok: 'Konfigurasi',
    });
    commit();
    return { aktifBulan: p.aktifBulan, totalTahun: p.totalTahun, diubah: iso(now()), diubahOleh: a.nama };
  },
};
