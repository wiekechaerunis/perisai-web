/**
 * Peristiwa Log Akses (PRD Log Akses tab ac582539-7263, Tabel G-1) dan kelompok Jejak Audit (PRD Jejak Audit
 * tab 70911a9e-e9ed, Tabel J-2). Kode peristiwa internal dipetakan ke label; kode tidak pernah tampil (FR-PA-22).
 */

// PR-03 diputuskan PM (14 Okt 2026): penolakan akses (Tabel G-1 "Penolakan akses") dicatat di Jejak Audit saja.
// Penolakan saat login (organisasi nonaktif, IP tidak terdaftar) tetap upaya login → kelompok Masuk (disetujui PM 14 Okt 2026).
export const ACCESS_GROUPS = ['Masuk', 'Verifikasi OTP', 'Keluar', 'Pemulihan akun'] as const;
export type AccessGroup = (typeof ACCESS_GROUPS)[number];

export interface AccessEventDef {
  kelompok: AccessGroup;
  label: string;
}

/** Alasan → teks (Tabel G-1 "beserta alasannya"; kode P-1 tidak ditampilkan). */
export const REASON_LABEL: Record<string, string> = {
  INVALID_CREDENTIALS: 'Kredensial salah',
  ACCOUNT_SUSPENDED: 'Akun ditangguhkan',
  ACCOUNT_DEACTIVATED: 'Akun nonaktif',
  ACCOUNT_NOT_ACTIVATED: 'Akun belum aktivasi',
  RATE_LIMITED: 'Dibatasi karena lockout',
  ORG_INACTIVE: 'Organisasi nonaktif',
  IP_NOT_ALLOWED: 'Alamat IP tidak terdaftar',
  OTP_INVALID: 'Kode salah',
  OTP_EXPIRED: 'Kode kedaluwarsa',
  OTP_LOCKED: 'Batas salah input tercapai',
  PERMISSION_DENIED: 'Tidak punya izin',
  NOT_FOUND: 'Di luar cakupan',
  SEGREGATION_OF_DUTIES: 'Pemisahan tugas',
  SESSION_EXPIRED: 'Sesi kedaluwarsa',
  BATAS_PERMINTAAN: 'Batas permintaan tercapai',
  EMAIL_TIDAK_TERDAFTAR: 'Email tidak terdaftar',
  CURRENT_PASSWORD_WRONG: 'Kata sandi saat ini salah',
  logout: 'Logout oleh pengguna',
  timeout: 'Batas waktu sesi',
  revoked: 'Dicabut administrator atau status akun berubah',
  password_reset: 'Kata sandi diatur ulang',
  password_changed: 'Kata sandi diubah',
};

/** Kode peristiwa (adapter) → kelompok & label G-1. Kode yang tidak dikenal bukan peristiwa akses. */
export function accessEvent(code: string, reason?: string): AccessEventDef | null {
  switch (code) {
    case 'login_berhasil':
      return { kelompok: 'Masuk', label: 'Login berhasil' };
    case 'login_gagal':
      return reason === 'RATE_LIMITED'
        ? { kelompok: 'Masuk', label: 'Login dibatasi karena lockout' }
        : { kelompok: 'Masuk', label: 'Login gagal' };
    case 'login_ditolak':
      return { kelompok: 'Masuk', label: 'Login gagal' };
    case 'otp_dikirim':
      return { kelompok: 'Verifikasi OTP', label: 'Kode dikirim' };
    case 'otp_kirim_ulang':
      return { kelompok: 'Verifikasi OTP', label: 'Kirim ulang kode' };
    case 'otp_gagal':
      return reason === 'OTP_EXPIRED'
        ? { kelompok: 'Verifikasi OTP', label: 'Kode kedaluwarsa' }
        : { kelompok: 'Verifikasi OTP', label: 'Salah input kode' };
    case 'otp_berhasil':
      return { kelompok: 'Verifikasi OTP', label: 'Verifikasi berhasil' };
    case 'sesi_berakhir:logout':
      return { kelompok: 'Keluar', label: 'Logout oleh pengguna' };
    case 'sesi_berakhir:timeout':
      return { kelompok: 'Keluar', label: 'Sesi berakhir karena batas waktu' };
    case 'sesi_berakhir:org_inactive':
      return { kelompok: 'Keluar', label: 'Sesi berakhir karena organisasi dinonaktifkan' };
    case 'sesi_berakhir:revoked':
      return { kelompok: 'Keluar', label: 'Sesi berakhir karena pencabutan atau perubahan status akun' };
    case 'sesi_berakhir:password_reset':
    case 'sesi_berakhir:password_changed':
      return { kelompok: 'Keluar', label: 'Sesi berakhir karena perubahan password' };
    case 'sesi_dicabut_admin':
      return { kelompok: 'Keluar', label: 'Sesi dicabut admin' };
    case 'reset_diminta':
      return { kelompok: 'Pemulihan akun', label: 'Permintaan atur ulang kata sandi' };
    case 'reset_tautan_dibuka':
      return { kelompok: 'Pemulihan akun', label: 'Tautan reset dibuka' };
    case 'reset_berhasil':
      return { kelompok: 'Pemulihan akun', label: 'Kata sandi berhasil diatur ulang' };
    case 'ubah_sandi_berhasil':
      return { kelompok: 'Pemulihan akun', label: 'Kata sandi diubah dari dalam aplikasi' };
    case 'ubah_sandi_gagal':
      return { kelompok: 'Pemulihan akun', label: 'Ubah kata sandi gagal' };
    default:
      return null;
  }
}

/** Kelompok Jejak Audit (Tabel J-2). */
export const AUDIT_GROUPS = ['Data operasional', 'Identitas & akses', 'Konfigurasi', 'Penolakan akses', 'Pembagian data'] as const;
export type AuditGroup = (typeof AUDIT_GROUPS)[number];

/** Ambang "kegagalan login beruntun" = ambang lockout (FR-LA-12). */
export const FAILED_STREAK_THRESHOLD = 5;
