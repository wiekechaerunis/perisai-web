/**
 * Kontrak data layer Core Platform. UI hanya bergantung pada tipe dan interface di file ini;
 * adapter `mock` dan `api` mengimplementasikannya (services/index.ts memilih lewat VITE_DATA_SOURCE).
 * Kontrak API final perlu disepakati dengan Tech Lead (lihat README).
 */
import type { RoleId } from '@/lib/rbac';
import type { AccountStatus, InviteTokenState, ResetTokenState, SessionEndReason } from '@/lib/status';

/* ---------- Kode error terstruktur (PRD Login §7 Technical Notes) ---------- */

export type ServiceErrorCode =
  | 'VALIDATION'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_SUSPENDED'
  | 'ORG_INACTIVE'
  | 'IP_NOT_ALLOWED'
  | 'RATE_LIMITED'
  | 'OTP_INVALID'
  | 'OTP_EXPIRED'
  | 'OTP_LOCKED'
  | 'OTP_RESEND_LIMIT'
  | 'OTP_RESEND_TOO_SOON'
  | 'OTP_SESSION_INVALID'
  | 'SEND_FAILED'
  | 'TOKEN_INVALID'
  | 'TOKEN_USED'
  | 'TOKEN_EXPIRED'
  | 'COMMON_PASSWORD'
  | 'SAME_AS_CURRENT'
  | 'CURRENT_PASSWORD_WRONG'
  | 'CHANGE_PASSWORD_LOCKED'
  | 'SESSION_EXPIRED'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'NETWORK'
  // Undang Pengguna (Tabel V-1, sumber server)
  | 'EMAIL_DOMAIN_NOT_ALLOWED'
  | 'EMAIL_PERSONAL'
  | 'EMAIL_REGISTERED'
  | 'EMAIL_INVITED'
  | 'EMAIL_INACTIVE_ACCOUNT'
  | 'EMAIL_OWN'
  | 'ROLE_INACTIVE'
  | 'ROLE_NOT_ALLOWED'
  | 'SOD_VIOLATION'
  | 'ORG_NO_WK'
  // Kirim ulang / batalkan / status (K-5, B-1, A-2, FR-SA-06/24b)
  | 'NOT_ELIGIBLE'
  | 'RESEND_TOO_SOON'
  | 'RESEND_QUOTA'
  | 'SELF_ACTION'
  | 'PAST_DATE'
  // Akun Saya (FR-AS-009)
  | 'EMAIL_REQUEST_PENDING'
  // Ubah Data & Role Pengguna (Tabel E-UDR)
  | 'EMAIL_SAME'
  | 'EMAIL_TAKEN_ON_APPROVE'
  | 'NO_CHANGES'
  // Kelola Organisasi KKKS (Tabel E-ORG)
  | 'ORG_NAME_TAKEN'
  | 'ORG_CODE_TAKEN'
  | 'VERSION_CONFLICT'
  | 'CODE_MISMATCH'
  | 'DOMAIN_LAST'
  | 'DOMAIN_LIMIT'
  | 'DOMAIN_DUPLICATE'
  | 'EMAIL_DOMAIN_REGISTERED'
  | 'EMAIL_OTHER_ORG'
  | 'ALLOW_DATE_REQUIRED'
  // Katalog Role (FR-KR-09d)
  | 'ROLE_IN_USE';

export interface ServiceErrorMeta {
  /** OTP_INVALID: sisa percobaan (Tabel E-2). */
  remainingAttempts?: number;
  /** Error validasi server per field (Tabel V-1), mis. "email". */
  field?: string;
  /** Nilai untuk pesan, mis. nama organisasi pada EMAIL_DOMAIN_NOT_ALLOWED. */
  value?: string;
  /** CHANGE_PASSWORD_LOCKED, RATE_LIMITED: kapan boleh mencoba lagi (ISO UTC). */
  retryAt?: string;
}

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly meta: ServiceErrorMeta;
  constructor(code: ServiceErrorCode, meta: ServiceErrorMeta = {}) {
    super(code);
    this.name = 'ServiceError';
    this.code = code;
    this.meta = meta;
  }
}

export function isServiceError(e: unknown, code?: ServiceErrorCode): e is ServiceError {
  return e instanceof ServiceError && (code === undefined || e.code === code);
}

/* ---------- Entitas ---------- */

export interface Organisasi {
  id: string;
  nama: string;
  jenis: 'SKK Migas' | 'KKKS' | 'Kontraktor';
  status: 'Aktif' | 'Nonaktif';
}

export interface SessionUser {
  id: string;
  nama: string;
  email: string;
  jabatan?: string;
  roles: RoleId[];
  organisasi: Organisasi;
  status: AccountStatus;
  /** FR-LG-27 */
  loginTerakhir?: string;
}

/** Waktu dalam ISO UTC; tampilan WIB lewat lib/format. */
export interface Session {
  sessionId: string;
  user: SessionUser;
  /** Waktu server saat respons dibuat; dipakai menghitung hitung mundur (FR-LO-09c). */
  serverNow: string;
  idleExpiresAt: string;
  absoluteExpiresAt: string;
}

export type SessionState =
  | { status: 'active'; session: Session }
  | { status: 'none' }
  | { status: 'ended'; reason: SessionEndReason };

/** Antara langkah password dan OTP (pre-auth, FR-LG-18). */
export interface OtpChallenge {
  maskedEmail: string;
  /** Kapan tombol kirim ulang aktif (ISO UTC, FR-LG-13). */
  resendAvailableAt: string;
  resendsLeft: number;
  serverNow: string;
}

export interface LoginChallenge extends OtpChallenge {
  preAuthId: string;
}

/** Satu sesi perangkat milik pengguna (FR-LO-11). IP penuh tidak dikirim (FR-LO-13). */
export interface DeviceSession {
  id: string;
  perangkat: string;
  browser: string;
  sistemOperasi: string;
  perkiraanLokasi: string;
  waktuMasuk: string;
  aktivitasTerakhir: string;
  perangkatIni: boolean;
}

export interface InviteInfo {
  state: InviteTokenState;
  email?: string;
  organisasi?: string;
}

/* ---------- Service interface ---------- */

export interface AuthService {
  /** FR-LG-01..10b, 22–24. Berhasil → challenge OTP; gagal → ServiceError. */
  login(input: { email: string; password: string }): Promise<LoginChallenge>;
  /** FR-LG-18: null bila pre-auth tidak ada/kedaluwarsa. */
  getLoginChallenge(preAuthId: string): Promise<LoginChallenge | null>;
  verifyLoginOtp(preAuthId: string, code: string): Promise<Session>;
  resendLoginOtp(preAuthId: string): Promise<LoginChallenge>;
  /** FR-LG-19 */
  cancelLoginOtp(preAuthId: string): Promise<void>;
  /** Tidak dihitung sebagai aktivitas (idle timeout dihitung dari permintaan pengguna, bukan polling). */
  getSession(): Promise<SessionState>;
  /** FR-LO-09 "Lanjutkan sesi": dihitung sebagai aktivitas. */
  keepAlive(): Promise<Session>;
  /** FR-LO-02, -04 */
  logout(): Promise<void>;
  /** FR-LO-05 */
  logoutAllDevices(): Promise<void>;
}

export interface PasswordService {
  /** FR-LP-02: selalu berhasil dengan respons seragam (pencegahan enumerasi). */
  requestReset(email: string): Promise<void>;
  checkResetToken(token: string): Promise<ResetTokenState>;
  /** FR-LP-13, -14 */
  resetPassword(token: string, newPassword: string): Promise<void>;
  /** FR-UK-04..09 */
  changePassword(input: { current: string; next: string }): Promise<{ revokedSessions: number }>;
}

export interface ActivationService {
  /** FR-AK-01 */
  checkInvite(token: string): Promise<InviteInfo>;
  /** FR-AK-09: password disimpan pending, OTP dikirim. */
  setPendingPassword(token: string, password: string): Promise<OtpChallenge>;
  getActivationChallenge(token: string): Promise<OtpChallenge | null>;
  resendActivationOtp(token: string): Promise<OtpChallenge>;
  /** FR-AK-14: Diundang → Aktif dan langsung masuk. */
  verifyActivationOtp(token: string, code: string): Promise<Session>;
  /** FR-AK-16/17 */
  requestNewInvite(token: string): Promise<void>;
}

export interface SessionService {
  /** FR-LO-11 */
  listMySessions(): Promise<DeviceSession[]>;
  /** FR-LO-12 */
  revokeMySession(sessionId: string): Promise<void>;
}

/* ---------- Manajemen pengguna (gelombang 2) ---------- */

export interface WilayahKerja {
  id: string;
  nama: string;
  orgId: string;
  aktif: boolean;
}

/** Baris tabel / profil pengguna (Undang Pengguna S-1, Kelola Status Akun A-1). */
export interface UserSummary {
  id: string;
  nama: string;
  email: string;
  jabatan?: string;
  roles: RoleId[];
  organisasi: Organisasi;
  wilayahKerja: WilayahKerja[];
  status: AccountStatus;
  /** Alasan yang ditampilkan bersama status, mis. "Undangan dibatalkan" (Tabel B-2). Bukan status. */
  keteranganStatus?: string;
  /** Pernah berstatus Aktif (FR-SA-20/20a). */
  pernahAktif: boolean;
  /** Undangan berlaku sampai (Diundang/Kedaluwarsa). */
  undanganBerlakuSampai?: string;
  /** Masa berlaku akses (FR-SA-22), ISO UTC akhir hari WIB. */
  aksesBerakhir?: string;
  loginTerakhir?: string;
  /** PRD Profil Pengguna: waktu akun diaktifkan (Riwayat akun). */
  diaktifkanPada?: string;
  /** Penanda "Minta undangan baru" + tanggal (FR-KU-19a). Bukan status. */
  mintaUndanganBaru?: string;
  diundangOleh?: string;
  diundangPada?: string;
  /** Jumlah sesi aktif (modal Tangguhkan, FR-SA-10; cabut sesi FR-LO-16). */
  sesiAktif: number;
  /** PIC KKKS aktif terakhir di organisasinya (FR-SA-07). */
  picTerakhir: boolean;
  /** Cakupan data bertipe (FR-CD-04a). */
  cakupan: import('@/lib/access').ScopeEntry[];
  /** Wilayah kerja yang sudah dinonaktifkan di data induk (FR-CD-13). */
  wilayahKerjaNonaktif: WilayahKerja[];
  /** R-02: id KKKS yang ditugaskan; kosong = seluruh KKKS (FR-CD-04b). */
  kkksIds: string[];
}

/** Satu baris "Riwayat akun" (Tabel A-5). Pelaku: nama admin, "Pengguna", atau "Sistem" (FR-SA-29a). */
export interface AccountEvent {
  id: string;
  at: string;
  peristiwa: string;
  pelaku?: string;
  keterangan?: string;
}

export interface UserDetail extends UserSummary {
  riwayat: AccountEvent[];
  /** FR-UDR-06: perubahan email yang belum berlaku (diubah admin, atau permintaan pengguna sendiri). */
  emailTertunda?: { emailBaru: string; status: EmailRequestStatus; diajukan: string; olehAdmin: boolean };
}

/* ---------- Ubah Data & Role Pengguna (PRD tab ClickUp z8pmx9n8ny) ---------- */

/** FR-UDR-03, -05, -07, -08. Field yang tidak diisi tidak berubah. */
export interface UpdateUserInput {
  nama: string;
  jabatan?: string;
  /** Email baru; berlaku setelah pengguna memverifikasi tautan (FR-UDR-05). */
  email?: string;
  roles: RoleId[];
  wilayahKerjaIds?: string[];
  /** R-02: KKKS tertentu; kosong/undefined = seluruh KKKS (FR-CD-04b, FR-CD-07). */
  cakupanOrganisasiIds?: string[];
}

export interface FieldChange {
  field: 'nama' | 'jabatan' | 'email' | 'roles' | 'wilayahKerja' | 'cakupan';
  sebelum: string;
  sesudah: string;
}

/** FR-HE-17: izin yang bertambah/berkurang per modul (modul yang sudah dirilis saja, FR-HE-14a). */
export interface AccessDiffItem {
  module: import('@/lib/rbac').ModuleId;
  nama: string;
  aksi: string[];
}

/** FR-UDR-09: ringkasan sebelum konfirmasi. */
export interface UserChangePreview {
  perubahan: FieldChange[];
  aksesBertambah: AccessDiffItem[];
  aksesBerkurang: AccessDiffItem[];
}

/** FR-UDR-15: baris daftar Permintaan Ubah Email. */
export interface EmailRequestItem {
  userId: string;
  nama: string;
  organisasi: string;
  emailLama: string;
  emailBaru: string;
  diajukan: string;
}

export interface UserListQuery {
  search?: string;
  status?: AccountStatus;
  organisasiId?: string;
  /** Filter "punya permintaan aktif" (FR-KU-19a). */
  mintaUndanganBaru?: boolean;
  /** FR-DP-14, -15; FR-KR-07 (tautan jumlah pengguna per role). */
  role?: RoleId;
}

export interface InviteInput {
  nama: string;
  email: string;
  jabatan?: string;
  /** Kosong untuk PIC KKKS (otomatis organisasinya, Tabel F-1). */
  organisasiId?: string;
  roles: RoleId[];
  wilayahKerjaIds?: string[];
  /** "YYYY-MM-DD", hanya R-03 (FR-UP-14). */
  aksesBerakhir?: string;
  /** R-02: KKKS tertentu; kosong = seluruh KKKS (FR-CD-04b). */
  cakupanOrganisasiIds?: string[];
}

export interface ReasonInput {
  alasan: string;
  /** Wajib bila alasan "Lainnya", maks 200 karakter. */
  penjelasan?: string;
}

export interface UserService {
  /** R-03/R-07 semua organisasi; R-04 organisasinya saja (FR-UP-24). */
  listUsers(query?: UserListQuery): Promise<UserSummary[]>;
  getUser(id: string): Promise<UserDetail>;
  /** Organisasi aktif yang boleh dipilih pengundang (Tabel R-1). */
  listOrganisasi(): Promise<Organisasi[]>;
  listWilayahKerja(orgId: string): Promise<WilayahKerja[]>;
  /** FR-UP-03..21 */
  invite(input: InviteInput): Promise<UserSummary>;
  /** FR-KU-07..12 */
  resendInvite(userId: string): Promise<UserSummary>;
  /** FR-BU-06..12 */
  cancelInvite(userId: string, reason: ReasonInput): Promise<UserSummary>;
  /** FR-SA-09..11 */
  suspend(userId: string, reason: ReasonInput): Promise<UserSummary>;
  /** FR-SA-17..19 */
  deactivate(userId: string, reason: ReasonInput): Promise<UserSummary>;
  /** FR-SA-13, -20 */
  reactivate(userId: string): Promise<UserSummary>;
  /** FR-SA-22, -26: tanggal "YYYY-MM-DD" atau null untuk tanpa batas. */
  setAccessEnd(userId: string, date: string | null): Promise<UserSummary>;
  /** FR-LO-14..16 */
  revokeSessions(userId: string, reason: ReasonInput): Promise<{ revoked: number }>;
  /** FR-HE-14, -14a, -15 (dihitung backend, FR-HE-20). */
  effectiveAccess(userId: string): Promise<import('@/lib/access').EffectiveModule[]>;
  /** FR-UDR-09, FR-HE-17: validasi + ringkasan sebelum/sesudah, tanpa menyimpan. */
  previewUpdate(userId: string, input: UpdateUserInput): Promise<UserChangePreview>;
  /** FR-UDR-03, -05, -07, -08, -11. */
  updateUser(userId: string, input: UpdateUserInput): Promise<UserDetail>;
  /** PRD Ekspor Daftar Pengguna (US-ED-01..09): mengikuti cakupan, filter, dan pencarian; tanpa data sensitif. */
  exportUsers(q: UserListQuery, format: import('@/lib/export-file').ExportFormat): Promise<{ filename: string; blob: Blob; count: number }>;
  /** PRD Profil Pengguna: admin mengirim tautan atur ulang kata sandi (kata sandi tidak pernah ditampilkan). */
  resetPassword(userId: string): Promise<void>;
  /** PRD Profil Pengguna (tab Aktivitas): sesi aktif pengguna. */
  userSessions(userId: string): Promise<AdminSession[]>;
  /** PRD Profil Pengguna: akhiri satu sesi (FR-LO-14..16 untuk alasan). */
  revokeUserSession(userId: string, sessionId: string, reason: ReasonInput): Promise<void>;
  /** FR-UDR-15: permintaan yang menjadi kewenangan penyetuju yang sedang masuk. */
  listEmailRequests(): Promise<EmailRequestItem[]>;
  /** FR-UDR-16 */
  approveEmailRequest(userId: string): Promise<void>;
  rejectEmailRequest(userId: string, alasan: string): Promise<void>;
}

/* ---------- Gelombang 3: hak akses efektif, log akses, jejak audit ---------- */

export type { EffectiveModule, ScopeEntry } from '@/lib/access';

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Tabel G-2. Waktu ISO UTC (tampil WIB). IP hanya untuk admin berwenang (FR-LA-06a, -15b). */
export interface AccessLogEntry {
  id: string;
  waktu: string;
  /** Nama pengguna, atau email yang dimasukkan untuk login gagal. */
  pengguna: string;
  email?: string;
  userId?: string;
  organisasi?: Organisasi;
  kelompok: import('@/lib/log-events').AccessGroup;
  peristiwa: string;
  hasil: 'Berhasil' | 'Gagal';
  alasan?: string;
  ip?: string;
  userAgent?: string;
  perkiraanLokasi?: string;
  perangkat?: string;
  sesiId?: string;
  modul?: string;
  aksi?: string;
  /** Lebih tua dari masa aktif (12 bulan): dari arsip (FR-LA-18, FR-JA-22). */
  arsip: boolean;
}

export interface AccessLogQuery {
  /** "YYYY-MM-DD" (WIB). */
  dari: string;
  sampai: string;
  pengguna?: string;
  organisasiId?: string;
  kelompok?: import('@/lib/log-events').AccessGroup;
  hasil?: 'Berhasil' | 'Gagal';
  ip?: string;
  sesiId?: string;
  /** FR-LA-12: pengguna dengan ≥ ambang kegagalan login berturut-turut. */
  gagalBeruntun?: boolean;
  page: number;
  pageSize: number;
}

/** Sesi aktif untuk admin (FR-LA-13). */
export interface AdminSession {
  id: string;
  userId: string;
  nama: string;
  email: string;
  organisasi: Organisasi;
  perangkat: string;
  browser: string;
  sistemOperasi: string;
  perkiraanLokasi: string;
  waktuMasuk: string;
  aktivitasTerakhir: string;
}

/** Tabel J-1. */
export interface AuditEntry {
  id: string;
  waktu: string;
  pelaku: string;
  pelakuRole?: string;
  pelakuOrganisasi?: string;
  modul: ModuleIdRef;
  aksi: import('@/lib/rbac').Action;
  objek: string;
  organisasiObjek?: string;
  sebelum?: Record<string, string>;
  sesudah?: Record<string, string>;
  alasan?: string;
  hasil: 'Berhasil' | 'Ditolak';
  ip?: string;
  userAgent?: string;
  korelasi: string;
  kelompok: import('@/lib/log-events').AuditGroup;
  arsip: boolean;
}
type ModuleIdRef = import('@/lib/rbac').ModuleId;

export interface AuditQuery {
  dari: string;
  sampai: string;
  organisasiId?: string;
  modul?: ModuleIdRef;
  aksi?: import('@/lib/rbac').Action;
  pelaku?: string;
  objek?: string;
  hasil?: 'Berhasil' | 'Ditolak';
  korelasi?: string;
  page: number;
  pageSize: number;
}

/** FR-JA-21..25, FR-LA-18/19: satu kebijakan untuk Log Akses dan Jejak Audit. */
export interface RetentionPolicy {
  aktifBulan: number;
  totalTahun: number;
  diubah?: string;
  diubahOleh?: string;
}

export interface LogService {
  accessLog(q: AccessLogQuery): Promise<Page<AccessLogEntry>>;
  accessEntry(id: string): Promise<AccessLogEntry>;
  /** FR-LA-16: CSV (R-03). */
  exportAccessLog(q: AccessLogQuery): Promise<string>;
  activeSessions(q?: { organisasiId?: string; pengguna?: string }): Promise<AdminSession[]>;
  /** FR-LA-14 (Tabel S-3). */
  revokeSession(sessionId: string, reason: ReasonInput): Promise<void>;
  /** FR-LA-15a..c: 20 peristiwa terakhir atau 30 hari, tanpa IP. */
  myLoginHistory(): Promise<AccessLogEntry[]>;
  audit(q: AuditQuery): Promise<Page<AuditEntry>>;
  auditEntry(id: string): Promise<AuditEntry>;
  /** FR-JA-18 (R-03). */
  exportAudit(q: AuditQuery): Promise<string>;
  retention(): Promise<RetentionPolicy>;
  /** FR-JA-25 (R-03). */
  setRetention(p: Pick<RetentionPolicy, 'aktifBulan' | 'totalTahun'>): Promise<RetentionPolicy>;
}

/* ---------- Akun Saya (gelombang 2) ---------- */

/** Tabel S-UDR (status aktif + Ditolak; Berlaku/Dibatalkan tidak disimpan sebagai permintaan). */
export type EmailRequestStatus = 'Menunggu Verifikasi' | 'Menunggu Persetujuan' | 'Ditolak';

export interface EmailRequest {
  emailBaru: string;
  status: EmailRequestStatus;
  diajukan: string;
  /** Kapan kirim ulang kode tersedia (ISO UTC). */
  resendAvailableAt?: string;
  /** FR-AS-010: alasan penolakan (status Ditolak). */
  alasan?: string;
}

export interface MyAccount {
  nama: string;
  email: string;
  username: string;
  jabatan?: string;
  roles: RoleId[];
  organisasi: Organisasi;
  status: AccountStatus;
  wilayahKerja: WilayahKerja[];
  aksesBerakhir?: string;
  cakupan: import('@/lib/access').ScopeEntry[];
  /** FR-HE-16 */
  hakAkses: import('@/lib/access').EffectiveModule[];
  /** FR-UK: "Terakhir diubah" di kartu Kata sandi (Figma 341:6507). */
  kataSandiDiubah?: string;
  permintaanEmail?: EmailRequest;
}

export interface AccountService {
  getMe(): Promise<MyAccount>;
  /** FR-AS-003: Nama Lengkap (3–150) dan Jabatan (≤100). */
  updateProfile(input: { nama: string; jabatan?: string }): Promise<MyAccount>;
  /** FR-AS-009: konfirmasi kata sandi + email baru → kode ke email baru. */
  requestEmailChange(input: { password: string; emailBaru: string }): Promise<EmailRequest>;
  verifyEmailChange(code: string): Promise<MyAccount>;
  resendEmailCode(): Promise<EmailRequest>;
  cancelEmailChange(): Promise<MyAccount>;
  /** FR-AS-010: tutup pemberitahuan penolakan. */
  dismissEmailRejection(): Promise<MyAccount>;
}

/** Tautan publik dari email (tanpa login): verifikasi email baru (FR-UDR-05) dan "Bukan saya" (FR-UDR-13, -14). */
export type EmailLinkState = 'valid' | 'invalid' | 'used';
export interface EmailLinkService {
  checkVerifyLink(token: string): Promise<{ state: EmailLinkState; emailBaru?: string }>;
  confirmVerifyLink(token: string): Promise<void>;
  checkNotMeLink(token: string): Promise<{ state: EmailLinkState }>;
  confirmNotMe(token: string): Promise<void>;
}

/* ---------- Kelola Organisasi KKKS (PRD ClickUp z8pmx9pc63) ---------- */

export type OrgType = Organisasi['jenis'];

export interface OrgQuery {
  search?: string;
  jenis?: OrgType;
  /** Bawaan Aktif (FR-ORG-03). */
  status?: 'Aktif' | 'Nonaktif';
}

/** FR-ORG-02 */
export interface OrgSummary {
  id: string;
  kode: string;
  nama: string;
  jenis: OrgType;
  status: 'Aktif' | 'Nonaktif';
  domains: string[];
  emailDiizinkan: number;
  penggunaAktif: number;
  picAktif: number;
  /** FR-ORG-04 */
  tanpaPic: boolean;
}

export interface OrgDomain {
  domain: string;
  pengguna: number;
  undanganTertunda: number;
}

/** 4.7 Email diizinkan. Alasan tidak dikirim ke PIC KKKS (FR-ORG-20). */
export interface AllowedEmail {
  id: string;
  email: string;
  alasan?: string;
  berlakuSampai?: string;
  status: 'Aktif' | 'Kedaluwarsa' | 'Tidak diperlukan lagi';
  pribadi: boolean;
  /** Jumlah akun pengguna aktif dengan email ini. */
  akunAktif: number;
}

/** 4.9 Wilayah kerja (minimum). */
export interface OrgWorkArea {
  id: string;
  kode: string;
  nama: string;
  aktif: boolean;
  /** FR-ORG-42: tanpa menyebut KKKS lain. */
  dioperasikanBersama: boolean;
  pelapor: number;
}

export interface OrgDetail extends OrgSummary {
  badanHukum?: string;
  skema?: import('@/lib/org-rules').SkemaKontrak;
  versi: number;
  picNama: string[];
  undanganTertunda: number;
  sesiAktif: number;
  domainDetail: OrgDomain[];
  emailDiizinkanDaftar: AllowedEmail[];
  wilayahKerja: OrgWorkArea[];
  nonaktif?: { sejak: string; alasan: string };
  /** FR-ORG-13: SKK Migas & Kontraktor tidak dapat dinonaktifkan. */
  dapatDinonaktifkan: boolean;
}

export interface OrgInput {
  nama: string;
  kode: string;
  badanHukum?: string;
  skema?: import('@/lib/org-rules').SkemaKontrak;
  domains: string[];
}

export interface OrgImpact {
  pengguna: number;
  sesi: number;
  undangan: number;
}

export interface OrgHistoryEntry {
  id: string;
  waktu: string;
  pelaku: string;
  perubahan: string;
  alasan?: string;
}

export interface OrgService {
  list(q?: OrgQuery): Promise<OrgSummary[]>;
  get(kode: string): Promise<OrgDetail>;
  /** Kode otomatis berikutnya (Tabel O-1). */
  nextKode(): Promise<string>;
  /** FR-ORG-07: peringatan bila domain dipakai organisasi lain. */
  domainUsedElsewhere(domain: string, kode?: string): Promise<boolean>;
  create(input: OrgInput): Promise<OrgDetail>;
  update(kode: string, input: { nama: string; badanHukum?: string; skema?: import('@/lib/org-rules').SkemaKontrak; versi: number }): Promise<OrgDetail>;
  addDomain(kode: string, domain: string): Promise<OrgDetail>;
  domainImpact(kode: string, domain: string): Promise<OrgDomain>;
  removeDomain(kode: string, domain: string): Promise<OrgDetail>;
  impact(kode: string): Promise<OrgImpact>;
  deactivate(kode: string, reason: ReasonInput, konfirmasiKode: string): Promise<OrgImpact>;
  reactivate(kode: string): Promise<OrgDetail>;
  addAllowedEmail(kode: string, input: { email: string; alasan: string; berlakuSampai?: string }): Promise<OrgDetail>;
  updateAllowedEmail(kode: string, id: string, berlakuSampai: string | undefined): Promise<OrgDetail>;
  removeAllowedEmail(kode: string, id: string, opsi: { nonaktifkanAkun: boolean; alasan?: ReasonInput }): Promise<OrgDetail>;
  addWorkArea(kode: string, input: { kode: string; nama: string }): Promise<OrgDetail>;
  renameWorkArea(kode: string, wkId: string, nama: string): Promise<OrgDetail>;
  setWorkAreaStatus(kode: string, wkId: string, aktif: boolean, alasan?: string): Promise<OrgDetail>;
  history(kode: string): Promise<OrgHistoryEntry[]>;
}

/* ---------- Katalog Role & Aktif/Nonaktif Role (PRD ClickUp z8pmx9n8p0, z8pmx9n8p1) ---------- */

export type RoleCatalogItem = import('@/lib/role-catalog').CatalogRole;

/** FR-KR-07 */
export interface RoleEntry {
  id: RoleId;
  nama: string;
  status: import('@/lib/role-catalog').RoleStatus;
  deskripsi: string;
  jenisOrg: string;
  cakupan: import('@/lib/rbac').CakupanBawaan;
  /** FR-KR-09c: tujuh role bawaan adalah role sistem. */
  sistem: boolean;
  pengguna: number;
  /** FR-AR-03 */
  dapatDinonaktifkan: boolean;
  orgType: import('@/lib/rbac').OrgType;
  /** Hak akses per modul (FR-KR-09, -09c). */
  izin: Partial<Record<import('@/lib/rbac').ModuleId, import('@/lib/rbac').Grant[]>>;
}

/** FR-KR-09: hak akses dipilih per modul dan aksi. */
export type RolePermissionInput = Partial<Record<import('@/lib/rbac').ModuleId, import('@/lib/rbac').Action[]>>;

/** FR-AR-04a, FR-AR-14: pratinjau pemindahan pengguna. */
export interface RoleMovePreview {
  pengguna: number;
  aksesBertambah: AccessDiffItem[];
  aksesBerkurang: AccessDiffItem[];
}

/** FR-AR-16: hasil pemindahan (dilewati beserta alasan). */
export interface RoleMoveResult {
  dipindah: number;
  dilewati: { userId: string; nama: string; alasan: string }[];
}

export interface RoleService {
  /** Katalog ringkas untuk semua pengguna yang masuk (nama + status; FR-KR-03, FR-AR-06). */
  catalog(): Promise<RoleCatalogItem[]>;
  /** FR-KR-06, -07: hanya R-03. */
  list(): Promise<RoleEntry[]>;
  get(id: RoleId): Promise<RoleEntry>;
  /** FR-KR-08 */
  rename(id: RoleId, input: { nama: string; deskripsi: string }): Promise<RoleEntry>;
  previewMove(from: RoleId, to: RoleId): Promise<RoleMovePreview>;
  /** FR-AR-04..04c: pindahKe = pindahkan pemakai lalu nonaktifkan; tanpa pindahKe = "Lewati" (keputusan PM 14 Okt 2026). */
  deactivate(id: RoleId, opsi: { pindahKe?: RoleId }): Promise<RoleMoveResult>;
  /** FR-AR-10, -11 */
  reactivate(id: RoleId): Promise<RoleEntry>;
  /** FR-AR-13..18: pindah massal dari role Tidak Aktif. */
  moveUsers(from: RoleId, to: RoleId): Promise<RoleMoveResult>;
  /** FR-KR-09, -09a, -09b: buat role baru (hanya R-03). */
  create(input: { nama: string; deskripsi: string; orgType: import('@/lib/rbac').OrgType; cakupan: import('@/lib/rbac').CakupanBawaan; izin: RolePermissionInput }): Promise<RoleEntry>;
  /** FR-KR-09c, -09f: ubah hak akses role (termasuk role sistem); berlaku pada permintaan berikutnya. */
  updatePermissions(id: RoleId, izin: RolePermissionInput): Promise<RoleEntry>;
  /** FR-KR-09d: hapus role buatan yang tidak dipakai. */
  remove(id: RoleId): Promise<void>;
}

/* ---------- Alat dev (hanya adapter mock) ---------- */

export interface MockEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  /** Tautan yang bisa dibuka dari panel dev (mis. /atur-ulang-kata-sandi/xxx). */
  link?: string;
  sentAt: string;
}

export interface DevUserSummary {
  id: string;
  nama: string;
  email: string;
  roles: RoleId[];
  organisasi: string;
  status: AccountStatus;
  catatan?: string;
}

export interface DevService {
  listUsers(): Promise<DevUserSummary[]>;
  /** Masuk langsung sebagai pengguna (RoleSwitcher), melewati password + OTP. */
  signInAs(userId: string): Promise<Session>;
  inbox(): Promise<MockEmail[]>;
  clearInbox(): Promise<void>;
  /** Majukan jam server mock (uji idle/absolute timeout, kedaluwarsa OTP). */
  advanceClock(ms: number): Promise<void>;
  /** Simulasikan admin mencabut seluruh sesi pengguna yang sedang masuk (FR-LO-14). */
  simulateAdminRevoke(): Promise<void>;
  /** Simulasikan perubahan status akun pengguna yang sedang masuk (Tabel S-2). */
  simulateStatusChange(status: 'Ditangguhkan' | 'Nonaktif'): Promise<void>;
  /** Buat tautan uji: aktivasi atau reset dalam state tertentu. */
  issueTestLink(kind: 'aktivasi' | 'reset', state: 'valid' | 'used' | 'expired'): Promise<string>;
  /** Simulasikan keputusan atas permintaan ubah email yang menunggu persetujuan (PRD Ubah Data & Role belum ditarik). */
  decideEmailRequest(userId: string, approve: boolean): Promise<void>;
  /** Simulasikan kegagalan pengiriman email berikutnya (FR-UP-20, FR-KU-11). */
  failNextEmail(): Promise<void>;
  /** Simulasikan admin mengubah role pengguna yang sedang masuk (FR-PA-18a, FR-HE-18). */
  simulateRoleChange(): Promise<void>;
  reset(): Promise<void>;
}

export interface Services {
  auth: AuthService;
  password: PasswordService;
  activation: ActivationService;
  sessions: SessionService;
  users: UserService;
  account: AccountService;
  logs: LogService;
  /** Ada hanya pada adapter mock. */
  dev?: DevService;
  emailLinks: EmailLinkService;
  orgs: OrgService;
  roles: RoleService;
}
