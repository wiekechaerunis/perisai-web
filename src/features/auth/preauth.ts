/**
 * Penanda pre-auth antara langkah password dan OTP (Technical Notes PRD Login).
 * Disimpan di sessionStorage (bukan URL) agar halaman OTP tidak bisa dibuka langsung (FR-LG-18).
 * Pre-auth token sebenarnya dipegang server; di sini hanya id-nya.
 */
const KEY = 'perisai.preAuth';

export function savePreAuth(id: string): void {
  try {
    sessionStorage.setItem(KEY, id);
  } catch {
    /* penyimpanan tidak tersedia */
  }
}

export function readPreAuth(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPreAuth(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* abaikan */
  }
}
