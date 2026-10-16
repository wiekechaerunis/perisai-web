/**
 * Kosakata status Core Platform. Komponen UI membaca label/ikon/nada dari sini, bukan string lepas.
 *
 * Status akun: PRD Login Tabel S-1, PRD Undang Pengguna S-1, Kelola Status Akun A-1/A-2 (BRD AB-14).
 * DS_GAPS (K-5): kelima status ini tidak ada di daftar baku WorkflowStatus DS; diusulkan komponen AccountStatus.
 */
import type { LucideIcon } from 'lucide-react';

export const ACCOUNT_STATUSES = ['Diundang', 'Aktif', 'Kedaluwarsa', 'Ditangguhkan', 'Nonaktif'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/**
 * Nada tampilan badge. Status akun berwarna mengikuti Figma 109:16180 (arahan PM 14 Okt 2026, menggantikan F-20/K-5
 * yang netral); `neutral`/`muted`/`caution` tetap tersedia untuk badge lain.
 */
export type StatusTone = 'neutral' | 'muted' | 'caution' | 'success' | 'warning' | 'danger' | 'strong' | 'info';

export interface StatusDisplay {
  label: string;
  icon?: LucideIcon;
  tone: StatusTone;
}

export const ACCOUNT_STATUS_DISPLAY: Record<AccountStatus, StatusDisplay> = {
  // Figma 109:16180 (arahan PM 14 Okt 2026): berwarna, tanpa ikon.
  // K4 (PM 16 Okt 2026, DS v2): proses berjalan = biru status-info; Ditangguhkan menunggu tindakan admin = caution.
  Diundang: { label: 'Diundang', tone: 'info' },
  Aktif: { label: 'Aktif', tone: 'success' },
  Kedaluwarsa: { label: 'Kedaluwarsa', tone: 'warning' },
  Ditangguhkan: { label: 'Ditangguhkan', tone: 'caution' },
  Nonaktif: { label: 'Nonaktif', tone: 'danger' },
};

/** Hanya akun Aktif yang boleh login (FR-LG-09) dan menerima email reset (FR-LP-03). */
export function canLogin(status: AccountStatus): boolean {
  return status === 'Aktif';
}

/* ---------- Pengakhiran sesi (PRD Logout & Sesi) ---------- */

/** Jenis pengakhiran sesi; menentukan pesan di halaman Login (FR-LO-03, -08, -17). */
export const SESSION_END_REASONS = [
  'logout',
  'timeout',
  'revoked',
  'password_reset',
  // ASSUMPTION (K-14): PRD tidak menetapkan pesan untuk perangkat lain yang keluar karena password diubah
  // (FR-UK-09); halaman Login memakai pesan sesi berakhir (FR-LO-08).
  'password_changed',
  // PRD Kelola Organisasi FR-ORG-15, EC-ORG-03: sesi berakhir karena organisasi dinonaktifkan.
  'org_inactive',
] as const;
export type SessionEndReason = (typeof SESSION_END_REASONS)[number];

/* ---------- State tautan (Aktivasi T-1, Atur Ulang L-3) ---------- */

export type InviteTokenState = 'valid' | 'invalid' | 'used' | 'expired';
export type ResetTokenState = 'valid' | 'invalid' | 'used' | 'expired';

/* ---------- Alasan pencabutan sesi oleh admin (Tabel S-3) — dipakai gelombang 2 ---------- */

export const REVOKE_REASONS = [
  'Perangkat hilang atau dicuri',
  'Dugaan akses tidak sah',
  'Permintaan pengguna',
  'Investigasi keamanan',
  'Lainnya',
] as const;
export type RevokeReason = (typeof REVOKE_REASONS)[number];
