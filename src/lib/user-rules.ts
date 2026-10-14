/**
 * Aturan bisnis manajemen pengguna yang dipakai bersama UI (untuk menampilkan pilihan) dan adapter mock
 * (untuk menegakkan). Backend tetap memvalidasi ulang (FR-UP-11, FR-KU-06, FR-BU-05, FR-SA-08).
 *
 * Sumber: PRD Undang Pengguna Tabel F-1, R-1 (tab a7315f64-20f0); Kirim Ulang Tabel K-1, K-5 (46a985a6-102b);
 * Batalkan Tabel B-1, B-3 (97283c3a-9515); Kelola Status Akun Tabel A-2, A-3, A-4 (aa87a27a-ee88).
 */
import { isSystemRole, type OrgType, type RoleId } from './rbac';
import { isRoleActive, rolesByOrgType } from './role-catalog';
import type { AccountStatus } from './status';

/* ---------- Siapa mengundang siapa (Tabel R-1) ---------- */

export type InviterRole = 'R-03' | 'R-04' | 'R-07';

export const ROLES_BY_ORG_TYPE: Record<OrgType, RoleId[]> = {
  'SKK Migas': ['R-01', 'R-02', 'R-03'],
  KKKS: ['R-04', 'R-05', 'R-06'],
  Kontraktor: ['R-07'],
};

/** Role yang boleh diberikan pengundang untuk jenis organisasi tujuan (Tabel R-1). */
export function invitableRoles(inviter: InviterRole, orgType: OrgType): RoleId[] {
  return invitableRolesAll(inviter, orgType).filter(isRoleActive); // FR-AR-06
}

function invitableRolesAll(inviter: InviterRole, orgType: OrgType): RoleId[] {
  // Role buatan (FR-KR-09) ikut tersedia sesuai jenis organisasinya (disetujui PM 14 Okt 2026).
  const custom = rolesByOrgType(orgType).filter((r) => !isSystemRole(r));
  if (inviter === 'R-07') return rolesByOrgType(orgType);
  if (inviter === 'R-04') return orgType === 'KKKS' ? ['R-04', 'R-05', 'R-06', ...custom] : [];
  // R-03
  if (orgType === 'SKK Migas') return ['R-01', 'R-02', 'R-03', ...custom];
  if (orgType === 'KKKS') return ['R-04', ...custom];
  return ['R-07', ...custom];
}

/** Peran pengundang efektif dari role pengguna yang sedang masuk (R-03 > R-07 > R-04). */
export function inviterRoleOf(roles: readonly RoleId[]): InviterRole | null {
  if (roles.includes('R-03')) return 'R-03';
  if (roles.includes('R-07')) return 'R-07';
  if (roles.includes('R-04')) return 'R-04';
  return null;
}

/**
 * Role yang boleh diberikan saat MENGUBAH role pengguna (PRD Ubah Data & Role, FR-UDR-07, -08).
 * R-03 dan R-07 mengubah seluruh organisasi (Matriks Ubah Pengguna Lain); R-04 hanya R-04/R-05/R-06.
 * Pilihan dibatasi role sesuai jenis organisasi (BRD 6.2); Katalog Role belum ditarik (R-01..R-07 saja, disetujui PM 14 Okt 2026).
 */
export function editableRoles(editor: InviterRole, orgType: OrgType): RoleId[] {
  const custom = rolesByOrgType(orgType).filter((r) => !isSystemRole(r));
  const all: RoleId[] = editor === 'R-04' ? (orgType === 'KKKS' ? ['R-04', 'R-05', 'R-06', ...custom] : []) : rolesByOrgType(orgType);
  return all.filter(isRoleActive); // FR-AR-06
}

/**
 * Penyetuju ubah email sendiri (FR-UDR-13, -14, EC-UDR-04, D-10). null = langsung berlaku setelah verifikasi.
 * PIC KKKS (termasuk yang juga punya role anggota), Pimpinan, Pengawas → Administrator Bisnis;
 * anggota KKKS (Pelapor, Pejabat Berwenang) → PIC KKKS organisasinya.
 */
export function emailApproverRole(roles: readonly RoleId[]): 'R-03' | 'R-04' | null {
  if (roles.includes('R-03') || roles.includes('R-07')) return null;
  if (roles.includes('R-04') || roles.includes('R-01') || roles.includes('R-02')) return 'R-03';
  return 'R-04';
}

/** FR-UDR-03 / Tabel E-UDR: Nama 3–150, Jabatan ≤ 100. */
export const NAMA_EDIT_MIN = 3;
export const NAMA_EDIT_MAX = 150;
/** FR-UDR-12: maksimal 10 permintaan kode ubah email per jam (AB-15). */
export const EMAIL_REQUESTS_PER_HOUR = 10;

/** Role yang butuh field Wilayah kerja (FR-UP-12, FR-CD-09a). */
export const ROLES_WITH_WK: readonly RoleId[] = ['R-05'];

/**
 * Kombinasi role terlarang (FR-UP-13, BRD AB-20). Daftar resmi ada di Role & Permission Matrix yang belum dibagikan.
 * ASSUMPTION: R-05 Pelapor + R-06 Pejabat Berwenang (pembuat tidak boleh menyetujui, FR-MX-05).
 */
export const FORBIDDEN_ROLE_COMBOS: readonly RoleId[][] = [['R-05', 'R-06']];

export function violatesSod(roles: readonly RoleId[]): boolean {
  return FORBIDDEN_ROLE_COMBOS.some((combo) => combo.every((r) => roles.includes(r)));
}

/* ---------- Batas field (Tabel V-1) ---------- */

export const NAMA_MAX = 100;
export const JABATAN_MAX = 100;
export const ALASAN_LAINNYA_MAX = 200;
/** Domain email pribadi (BRD AB-19: domain pribadi ditolak). Contoh; daftar lengkap di backend. */
export const PERSONAL_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'yahoo.co.id', 'hotmail.com', 'outlook.com', 'icloud.com'];

/* ---------- Aksi per status (Tabel K-1, B-1, A-2) ---------- */

export interface StatusActions {
  kirimUlang: boolean;
  batalkan: boolean;
  tangguhkan: boolean;
  nonaktifkan: boolean;
  aktifkanKembali: boolean;
  perpanjang: boolean;
}

export function actionsForStatus(status: AccountStatus, pernahAktif: boolean): StatusActions {
  return {
    kirimUlang: status === 'Diundang' || status === 'Kedaluwarsa',
    batalkan: status === 'Diundang' || status === 'Kedaluwarsa',
    tangguhkan: status === 'Aktif',
    nonaktifkan: status === 'Aktif' || status === 'Ditangguhkan',
    // FR-SA-13, FR-SA-20, FR-SA-20a
    aktifkanKembali: status === 'Ditangguhkan' || (status === 'Nonaktif' && pernahAktif),
    // FR-SA-26: perpanjang sebelum atau sesudah berakhir (akun yang pernah aktif)
    perpanjang: (status === 'Aktif' || status === 'Ditangguhkan' || status === 'Nonaktif') && pernahAktif,
  };
}

/* ---------- Alasan (dropdown) ---------- */

/** Tabel B-3. "Role atau area tidak sesuai" disalin persis (PR-04: istilah Area vs Wilayah Kerja belum diputuskan). */
export const ALASAN_BATAL = [
  'Alamat email salah',
  'Role atau area tidak sesuai',
  'Orang yang diundang keliru',
  'Calon pengguna tidak jadi bergabung',
  'Undangan ganda',
  'Permintaan organisasi',
  'Lainnya',
] as const;

/** Tabel A-3: label audit → teks untuk pengguna. */
export const ALASAN_TANGGUH: Record<string, string> = {
  'Dugaan penyalahgunaan akses': 'Akses Anda ditangguhkan sementara atas keputusan administrator organisasi.',
  'Investigasi internal': 'Akses Anda ditangguhkan sementara atas keputusan administrator organisasi.',
  'Cuti panjang atau penugasan sementara': 'Akses Anda ditangguhkan sementara karena Anda sedang tidak bertugas.',
  'Permintaan organisasi': 'Akses Anda ditangguhkan sementara atas permintaan organisasi Anda.',
  Lainnya: 'Akses Anda ditangguhkan sementara atas keputusan administrator organisasi.',
};

/** Tabel A-4: label audit → teks untuk pengguna. */
export const ALASAN_NONAKTIF: Record<string, string> = {
  'Pengguna tidak lagi bekerja di organisasi': 'Akses Anda dihentikan karena Anda tidak lagi terdaftar pada organisasi ini.',
  'Pindah organisasi': 'Akses Anda dihentikan karena Anda tidak lagi terdaftar pada organisasi ini.',
  'Perubahan penugasan': 'Akses Anda dihentikan karena perubahan penugasan.',
  'Kontrak berakhir': 'Akses Anda dihentikan karena masa kerja sama telah berakhir.',
  'Pelanggaran kebijakan': 'Akses Anda dihentikan atas keputusan administrator organisasi.',
  Lainnya: 'Akses Anda dihentikan atas keputusan administrator organisasi.',
};

/* ---------- Masa berlaku akses (FR-SA-22..23a) ---------- */

/** Akhir hari WIB (23:59:59) untuk tanggal "YYYY-MM-DD" (FR-SA, berlaku sampai 23:59 WIB). */
export function endOfDayWib(date: string): Date {
  return new Date(`${date}T23:59:59+07:00`);
}

export function isPastDate(date: string, now = new Date()): boolean {
  return endOfDayWib(date).getTime() < now.getTime();
}

export function isOverTwoYears(date: string, now = new Date()): boolean {
  const limit = new Date(now);
  limit.setFullYear(limit.getFullYear() + 2);
  return endOfDayWib(date).getTime() > limit.getTime();
}

/** "10 tahun 3 bulan" dari sekarang sampai tanggal (contoh FR-UP-14). */
export function durasiSampai(date: string, now = new Date()): string {
  const end = endOfDayWib(date);
  let months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
  if (end.getDate() < now.getDate()) months -= 1;
  months = Math.max(0, months);
  const th = Math.floor(months / 12);
  const bl = months % 12;
  return [th ? `${th} tahun` : '', bl ? `${bl} bulan` : ''].filter(Boolean).join(' ') || 'kurang dari 1 bulan';
}

/* ---------- Kirim ulang (Tabel K-5) ---------- */

export const RESEND_GAP_MS = 5 * 60_000;
export const RESEND_PER_DAY = 3;
