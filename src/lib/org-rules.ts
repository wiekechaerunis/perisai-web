/**
 * Aturan Kelola Organisasi KKKS (PRD ClickUp z8pmx9pc63, Tabel O-1, O-3, O-4, E-ORG). Dipakai UI (validasi browser)
 * dan adapter mock (validasi "backend").
 */
import { PERSONAL_EMAIL_DOMAINS } from './user-rules';

/** Tabel O-1: kode 2–20 huruf kapital, angka, tanda hubung. */
export const KODE_PATTERN = /^[A-Z0-9-]{2,20}$/;
/** Tabel O-1: domain tanpa "@", huruf kecil (IDN tidak didukung prototype; EC-ORG-07). */
export const DOMAIN_PATTERN = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ORG_NAMA_MIN = 3;
export const ORG_NAMA_MAX = 150;
export const BADAN_HUKUM_MAX = 200;
export const MAX_DOMAINS = 20;
export const MAX_ALLOWED_EMAILS = 200;
/** FR-ORG-25: tanggal berlaku email pribadi paling lama 12 bulan. */
export const ALLOW_MAX_MONTHS = 12;
export const SKEMA_KONTRAK = ['Cost Recovery', 'Gross Split'] as const;
export type SkemaKontrak = (typeof SKEMA_KONTRAK)[number];

/** Tabel O-3. */
export const ALASAN_NONAKTIF_ORG = [
  'Kontrak kerja sama berakhir',
  'Wilayah kerja dialihkan',
  'Organisasi bergabung atau berganti badan hukum',
  'Dibuat karena kesalahan',
  'Lainnya',
] as const;

export function normDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/^@/, '');
}

export function isPersonalDomain(domain: string): boolean {
  return PERSONAL_EMAIL_DOMAINS.includes(domain);
}

/** Tabel O-1: subdomain ikut cocok (hq.contoh.co.id cocok dengan contoh.co.id). */
export function domainMatches(emailDomain: string, orgDomain: string): boolean {
  return emailDomain === orgDomain || emailDomain.endsWith(`.${orgDomain}`);
}

export function emailDomainOf(email: string): string {
  return email.split('@')[1] ?? '';
}

/** Kode otomatis berikutnya, mis. KKKS-031 (Tabel O-1). */
export function nextKkksKode(existing: readonly string[]): string {
  const n = existing.map((k) => /^KKKS-(\d+)$/.exec(k)?.[1]).filter(Boolean).map(Number);
  return `KKKS-${String((n.length ? Math.max(...n) : 0) + 1).padStart(3, '0')}`;
}

/** "YYYY-MM-DD" paling lambat 12 bulan dari hari ini (zona WIB). */
export function maxAllowDate(now = new Date()): string {
  const d = new Date(now);
  d.setMonth(d.getMonth() + ALLOW_MAX_MONTHS);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(d);
}
