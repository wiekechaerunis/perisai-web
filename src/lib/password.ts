/**
 * Satu sumber aturan password untuk tiga konteks: aktivasi (FR-AK-04/05), atur ulang (FR-LP-11/12),
 * dan ubah kata sandi (FR-UK-05). Backend tetap memvalidasi ulang (FR-AK-04).
 */

export interface PasswordRule {
  id: 'length' | 'upper' | 'lower' | 'digit';
  /** Teks checklist; pesan Tabel V-2 / U-1. */
  label: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: 'length', label: `Minimal ${PASSWORD_MIN_LENGTH} karakter`, test: (pw) => pw.length >= PASSWORD_MIN_LENGTH },
  { id: 'upper', label: 'Minimal 1 huruf besar', test: (pw) => /[A-Z]/.test(pw) },
  { id: 'lower', label: 'Minimal 1 huruf kecil', test: (pw) => /[a-z]/.test(pw) },
  { id: 'digit', label: 'Minimal 1 angka', test: (pw) => /[0-9]/.test(pw) },
];

export function meetsPolicy(pw: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(pw));
}

/* ---------- Strength meter (Tabel P-1) ---------- */

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface Strength {
  /** Jumlah bar terisi (0–4). */
  bars: StrengthLevel;
  label: 'Masukkan password' | 'Lemah' | 'Cukup' | 'Kuat' | 'Sangat kuat';
}

/**
 * Skor: panjang ≥ 8, huruf besar, angka, simbol (+1 masing-masing).
 * Panjang < 8 selalu "Lemah" berapa pun skornya (FR-AK-05).
 */
export function passwordStrength(pw: string): Strength {
  if (pw.length === 0) return { bars: 0, label: 'Masukkan password' };
  const score =
    Number(pw.length >= PASSWORD_MIN_LENGTH) +
    Number(/[A-Z]/.test(pw)) +
    Number(/[0-9]/.test(pw)) +
    Number(/[^A-Za-z0-9]/.test(pw));
  if (pw.length < PASSWORD_MIN_LENGTH || score <= 1) return { bars: 1, label: 'Lemah' };
  if (score === 2) return { bars: 2, label: 'Cukup' };
  if (score === 3) return { bars: 3, label: 'Kuat' };
  return { bars: 4, label: 'Sangat kuat' };
}
