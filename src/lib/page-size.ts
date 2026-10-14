/**
 * Jumlah baris per halaman untuk tabel berpaginasi (masukan PM 14 Okt 2026: pengguna dapat memilih).
 * ASSUMPTION: PRD tidak menetapkan ukuran halaman; pilihan 10/25/50/100, bawaan 25 untuk semua tabel. Disimpan di URL
 * (`baris`) agar ikut tersalin bersama filter.
 */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_PARAM = 'baris';

export function parsePageSize(v: string | null): number {
  const n = Number(v);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}
