/**
 * Penyimpanan in-browser untuk adapter mock. Disimpan di localStorage agar reload tidak menghapus sesi
 * (meniru cookie httpOnly). Jam server mock = Date.now() + clockOffset (panel dev bisa memajukan jam).
 */
import type { AuditGroup } from '@/lib/log-events';
import { applyRoleCatalog, DEFAULT_ROLE_NAMES, ROLE_R2, type RoleStatus } from '@/lib/role-catalog';
import { DEFAULT_MATRIX, MODULE_IDS, ROLE_IDS, roleDef, type CakupanBawaan, type Grant, type OrgType, type RoleId } from '@/lib/rbac';
import type { Action, ModuleId } from '@/lib/rbac';
import type { SessionEndReason } from '@/lib/status';
import type { MockEmail } from '../types';
import { SEED_ORGS, SEED_USERS, SEED_WK, type SeedOrg, type SeedUser, type SeedWk } from './seed';

export interface OtpState {
  /** Mock menyimpan kode apa adanya; produksi menyimpan hash (Technical Notes PRD Login). */
  code: string;
  expiresAt: number;
  lastSentAt: number;
  wrong: number;
  resends: number;
}

export interface DbUser extends SeedUser {
  pendingPassword?: string | null;
  loginFailures: number;
  lockedUntil?: number;
  changePwFailures: number;
  changePwLockedUntil?: number;
  lastLogin?: number;
  wilayahKerjaIds: string[];
  pernahAktif: boolean;
  keteranganStatus?: string;
  invitedAt?: number;
  /** Akhir masa berlaku undangan (ms). */
  inviteExpiresAt?: number;
  /** Penanda "Minta undangan baru" (FR-KU-19). */
  newInviteRequestedAt?: number;
  /** Riwayat kirim ulang oleh admin (Tabel K-5). */
  resendTimes: number[];
  events: DbEvent[];
  emailRequest?: DbEmailRequest;
  adminEmailChange?: DbAdminEmailChange;
  /** Waktu permintaan kode ubah email (batas per jam, FR-UDR-12). */
  emailRequestTimes?: number[];
  /** R-02: id KKKS yang ditugaskan; kosong = seluruh KKKS (FR-CD-04b). */
  kkksIds: string[];
}

export interface DbEvent {
  id: string;
  at: number;
  peristiwa: string;
  pelaku?: string;
  keterangan?: string;
}

export interface DbEmailRequest {
  emailBaru: string;
  status: 'Menunggu Verifikasi' | 'Menunggu Persetujuan' | 'Ditolak';
  diajukan: number;
  otp?: OtpState;
  /** FR-AS-010: alasan penolakan. */
  alasan?: string;
}

/** Email baru yang diubah admin, menunggu verifikasi tautan oleh pengguna (FR-UDR-05). */
export interface DbAdminEmailChange {
  emailBaru: string;
  token: string;
  diajukan: number;
  olehId: string;
}

/** Tautan publik dari email: verifikasi email baru (FR-UDR-05) dan "Bukan saya" (FR-UDR-13, -14). */
export interface DbEmailLink {
  token: string;
  kind: 'verify' | 'notme';
  userId: string;
  used?: boolean;
  /** notme setelah email berganti (FR-UDR-13): beri tahu seluruh Administrator Bisnis. */
  afterChange?: boolean;
}

export interface DbSession {
  id: string;
  userId: string;
  createdAt: number;
  lastActivity: number;
  endedAt?: number;
  endReason?: SessionEndReason;
  perangkat: string;
  browser: string;
  sistemOperasi: string;
  perkiraanLokasi: string;
}

export interface PreAuth {
  id: string;
  userId: string;
  createdAt: number;
  otp: OtpState;
}

export interface InviteToken {
  token: string;
  userId: string;
  expiresAt: number;
  usedAt?: number;
  revoked?: boolean;
  otp?: OtpState;
  lastNewInviteRequestAt?: number;
}

export interface ResetToken {
  token: string;
  userId: string;
  expiresAt: number;
  usedAt?: number;
  superseded?: boolean;
}

export interface LogEntry {
  id: string;
  sessionId?: string;
  orgId?: string;
  modul?: string;
  aksi?: string;
  at: number;
  log: 'akses' | 'audit';
  event: string;
  email?: string;
  userId?: string;
  result: 'berhasil' | 'gagal' | 'ditolak';
  reason?: string;
  ip: string;
  userAgent: string;
  detail?: Record<string, unknown>;
}

/** Entri Jejak Audit (Tabel J-1). Nama pelaku, role, dan organisasi disimpan sebagai snapshot (FR-JA-09, -10). */
export interface DbAudit {
  id: string;
  at: number;
  pelakuId?: string;
  pelaku: string;
  pelakuRole?: string;
  pelakuOrganisasi?: string;
  modul: ModuleId;
  aksi: Action;
  objek: string;
  orgObjekId?: string;
  sebelum?: Record<string, string>;
  sesudah?: Record<string, string>;
  alasan?: string;
  hasil: 'Berhasil' | 'Ditolak';
  ip: string;
  userAgent: string;
  korelasi: string;
  kelompok: AuditGroup;
}

/** Katalog role (FR-KR-01, FR-AR-01). */
export interface DbRole {
  id: RoleId;
  nama: string;
  deskripsi: string;
  status: RoleStatus;
  orgType: OrgType;
  cakupan: CakupanBawaan;
  /** FR-KR-09c: tujuh role bawaan. */
  sistem: boolean;
  /** Hak akses per modul (FR-KR-09, -09f). */
  izin: Partial<Record<ModuleId, Grant[]>>;
}

export interface DbState {
  version: 8;
  roles: DbRole[];
  emailLinks: DbEmailLink[];
  audit: DbAudit[];
  retention: { aktifBulan: number; totalTahun: number; diubah?: number; diubahOleh?: string };
  wk: SeedWk[];
  /** Simulasi kegagalan pengiriman email berikutnya (alat uji). */
  failNextEmail?: boolean;
  clockOffset: number;
  orgs: SeedOrg[];
  users: DbUser[];
  sessions: DbSession[];
  currentSessionId: string | null;
  preAuths: PreAuth[];
  invites: InviteToken[];
  resets: ResetToken[];
  resetRequests: Record<string, number[]>;
  inbox: MockEmail[];
  logs: LogEntry[];
}

const KEY = 'perisai.mock.v1';

function defaultGrants(id: RoleId): Partial<Record<ModuleId, Grant[]>> {
  const out: Partial<Record<ModuleId, Grant[]>> = {};
  for (const m of MODULE_IDS) {
    const cell = DEFAULT_MATRIX[m][id];
    if (cell?.length) out[m] = cell;
  }
  return out;
}
const DAY = 86_400_000;

function seedUser(u: SeedUser, now: number): DbUser {
  const invitedAt = now - (u.invitedDaysAgo ?? 120) * DAY;
  const pernahAktif = u.pernahAktif ?? !(u.status === 'Diundang' || u.status === 'Kedaluwarsa');
  const inviter = SEED_USERS.find((x) => x.id === u.invitedBy)?.nama ?? 'Sistem';
  const org = SEED_ORGS.find((o) => o.id === u.orgId)?.nama ?? '';
  const events: DbEvent[] = [
    { id: `ev-${u.id}-1`, at: invitedAt, peristiwa: 'Diundang', pelaku: inviter, keterangan: `${org} · ${u.roles.join(', ')}` },
  ];
  if (pernahAktif) events.unshift({ id: `ev-${u.id}-2`, at: invitedAt + DAY, peristiwa: 'Akun diaktifkan', pelaku: 'Pengguna', keterangan: 'Email terverifikasi' });
  if (u.keteranganStatus === 'Undangan dibatalkan')
    events.unshift({ id: `ev-${u.id}-3`, at: invitedAt + DAY, peristiwa: 'Undangan dibatalkan', pelaku: inviter, keterangan: 'Alasan: Calon pengguna tidak jadi bergabung' });
  if (u.status === 'Kedaluwarsa') events.unshift({ id: `ev-${u.id}-6`, at: now - 2 * DAY, peristiwa: 'Undangan kedaluwarsa', pelaku: 'Sistem' });
  if (u.status === 'Ditangguhkan')
    events.unshift({ id: `ev-${u.id}-4`, at: now - 3 * DAY, peristiwa: 'Akun ditangguhkan', pelaku: 'Bagus Santoso', keterangan: 'Alasan: Investigasi internal' });
  if (u.status === 'Nonaktif' && pernahAktif)
    events.unshift({ id: `ev-${u.id}-5`, at: now - 10 * DAY, peristiwa: 'Akun dinonaktifkan', pelaku: 'Rina Wiyono', keterangan: 'Alasan: Perubahan penugasan' });
  return {
    ...structuredClone(u),
    loginFailures: 0,
    changePwFailures: 0,
    wilayahKerjaIds: u.wilayahKerjaIds ?? [],
    pernahAktif,
    invitedAt,
    inviteExpiresAt: u.status === 'Kedaluwarsa' ? now - 2 * DAY : invitedAt + 7 * DAY,
    resendTimes: [],
    events,
    kkksIds: [],
  };
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0';

/** Riwayat log akses contoh: kegagalan login beruntun (FR-LA-12) dan entri arsip > 12 bulan (FR-LA-18). */
function seedLogs(now: number): LogEntry[] {
  const L: LogEntry[] = [];
  const add = (daysAgo: number, e: Omit<LogEntry, 'id' | 'at' | 'ip' | 'userAgent'> & { ip?: string }) =>
    L.push({ id: `log-seed-${L.length + 1}`, at: now - daysAgo * DAY, ip: e.ip ?? '10.20.30.40', userAgent: UA, ...e });
  for (let i = 0; i < 6; i++)
    add(1 + i * 0.01, { log: 'akses', event: 'login_gagal', email: 'f.nugroho@andalas-energi.example', userId: 'u-12', orgId: 'org-andalas', result: 'gagal', reason: 'INVALID_CREDENTIALS', ip: '182.1.23.45' });
  add(2, { log: 'akses', event: 'login_gagal', email: 'tidak.dikenal@contoh.example', result: 'gagal', reason: 'INVALID_CREDENTIALS', ip: '45.13.8.200' });
  add(3, { log: 'akses', event: 'login_berhasil', email: 'r.wiyono@andalas-energi.example', userId: 'u-04', orgId: 'org-andalas', result: 'berhasil', sessionId: 'ses-seed-1' });
  add(3, { log: 'akses', event: 'otp_berhasil', email: 'r.wiyono@andalas-energi.example', userId: 'u-04', orgId: 'org-andalas', result: 'berhasil', sessionId: 'ses-seed-1' });
  add(2.9, { log: 'akses', event: 'sesi_berakhir:logout', userId: 'u-04', orgId: 'org-andalas', result: 'berhasil', sessionId: 'ses-seed-1' });
  add(4, { log: 'akses', event: 'login_ditolak', email: 'l.marlina@seram-energi.example', userId: 'u-15', orgId: 'org-seram', result: 'ditolak', reason: 'ORG_INACTIVE' });
  add(6, { log: 'akses', event: 'reset_diminta', email: 'd.pratama@andalas-energi.example', userId: 'u-05', orgId: 'org-andalas', result: 'berhasil' });
  add(400, { log: 'akses', event: 'login_berhasil', email: 'h.wibisono@skkmigas.example', userId: 'u-01', orgId: 'org-skk', result: 'berhasil' });
  add(410, { log: 'akses', event: 'login_gagal', email: 'h.wibisono@skkmigas.example', userId: 'u-01', orgId: 'org-skk', result: 'gagal', reason: 'INVALID_CREDENTIALS' });
  return L;
}

/** Jejak audit contoh, termasuk satu aksi massal (id korelasi sama, FR-JA-15) dan entri arsip (FR-JA-22). */
function seedAudit(now: number): DbAudit[] {
  const A: DbAudit[] = [];
  const base = { ip: '10.20.30.40', userAgent: UA, hasil: 'Berhasil' as const };
  const rina = { pelakuId: 'u-04', pelaku: 'Rina Wiyono', pelakuRole: 'R-04 PIC KKKS', pelakuOrganisasi: 'PT Andalas Energi Hulu' };
  const bagus = { pelakuId: 'u-03', pelaku: 'Bagus Santoso', pelakuRole: 'R-03 Administrator Bisnis', pelakuOrganisasi: 'SKK Migas' };
  const add = (daysAgo: number, e: Omit<DbAudit, 'id' | 'at' | 'ip' | 'userAgent' | 'hasil' | 'korelasi'> & Partial<Pick<DbAudit, 'hasil' | 'korelasi'>>) =>
    A.push({ ...base, id: `aud-seed-${A.length + 1}`, at: now - daysAgo * DAY, korelasi: e.korelasi ?? `kor-seed-${A.length + 1}`, ...e });
  // Aksi massal: tiga undangan dalam satu permintaan.
  for (const [id, nama] of [['u-10', 'Agus Pranoto'], ['u-11', 'Maya Kusuma'], ['u-17', 'Bayu Saputra']] as const)
    add(9, { ...rina, modul: 'M-15', aksi: 'create', objek: `pengguna #${id}`, orgObjekId: 'org-andalas', sesudah: { Nama: nama, Status: 'Diundang' }, kelompok: 'Identitas & akses', korelasi: 'kor-undang-massal-1' });
  add(4, { ...rina, modul: 'M-15', aksi: 'edit', objek: 'pengguna #u-17', orgObjekId: 'org-andalas', sebelum: { Status: 'Diundang' }, sesudah: { Status: 'Nonaktif', Keterangan: 'Undangan dibatalkan' }, alasan: 'Calon pengguna tidak jadi bergabung', kelompok: 'Identitas & akses' });
  add(3, { ...bagus, modul: 'M-15', aksi: 'edit', objek: 'pengguna #u-12', orgObjekId: 'org-andalas', sebelum: { Status: 'Aktif' }, sesudah: { Status: 'Ditangguhkan' }, alasan: 'Investigasi internal', kelompok: 'Identitas & akses' });
  add(2, { pelaku: 'Sistem', modul: 'M-15', aksi: 'edit', objek: 'pengguna #u-11', orgObjekId: 'org-andalas', sebelum: { Status: 'Diundang' }, sesudah: { Status: 'Kedaluwarsa' }, alasan: 'Masa berlaku undangan habis', kelompok: 'Identitas & akses' });
  add(5, { pelakuId: 'u-05', pelaku: 'Dimas Pratama', pelakuRole: 'R-05 Pelapor KKKS', pelakuOrganisasi: 'PT Andalas Energi Hulu', modul: 'M-15', aksi: 'view', objek: 'modul M-15', orgObjekId: 'org-andalas', hasil: 'Ditolak', alasan: 'Tidak punya izin', kelompok: 'Penolakan akses' });
  add(420, { ...bagus, modul: 'M-15', aksi: 'create', objek: 'pengguna #u-19', orgObjekId: 'org-mahakam', sesudah: { Nama: 'Eko Wijaya', Status: 'Diundang' }, kelompok: 'Identitas & akses' });
  return A;
}

function seed(): DbState {
  const now = Date.now();
  return {
    version: 8,
    roles: ROLE_IDS.map((id) => ({
      id,
      nama: DEFAULT_ROLE_NAMES[id],
      deskripsi: ROLE_R2[id].deskripsi,
      status: 'Aktif' as const,
      orgType: roleDef(id).orgType,
      cakupan: ROLE_R2[id].cakupan,
      sistem: true,
      izin: structuredClone(defaultGrants(id)),
    })),
    emailLinks: [],
    audit: seedAudit(now),
    retention: { aktifBulan: 12, totalTahun: 5 },
    wk: structuredClone(SEED_WK),
    clockOffset: 0,
    orgs: structuredClone(SEED_ORGS).map((o) => (o.nonaktif ? { ...o, nonaktif: { ...o.nonaktif, at: now - 20 * DAY } } : o)),
    users: SEED_USERS.map((u) => seedUser(u, now)),
    sessions: [],
    currentSessionId: null,
    preAuths: [],
    invites: [
      { token: 'undangan-agus-berlaku', userId: 'u-10', expiresAt: now + 5 * DAY },
      { token: 'undangan-maya-kedaluwarsa', userId: 'u-11', expiresAt: now - 2 * DAY },
      { token: 'undangan-nadia-berlaku', userId: 'u-18', expiresAt: now + 6 * DAY },
    ],
    resets: [],
    resetRequests: {},
    inbox: [],
    logs: seedLogs(now),
  };
}

let state: DbState | null = null;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function db(): DbState {
  if (state) return state;
  const raw = storage()?.getItem(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DbState;
      if (parsed.version === 8) {
        state = parsed;
        applyRoleCatalog(state.roles);
        return state;
      }
    } catch {
      /* data rusak: tanam ulang */
    }
  }
  state = seed();
  applyRoleCatalog(state.roles);
  return state;
}

export function commit(): void {
  if (!state) return;
  try {
    storage()?.setItem(KEY, JSON.stringify(state));
  } catch {
    /* penyimpanan penuh atau diblokir: tetap jalan di memori */
  }
}

export function resetDb(): void {
  state = seed();
  applyRoleCatalog(state.roles);
  commit();
}

export function now(): number {
  return Date.now() + db().clockOffset;
}

export function iso(ms: number): string {
  return new Date(ms).toISOString();
}

export function randomId(prefix: string): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `${prefix}-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export function randomOtp(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => String(b % 10)).join('');
}
