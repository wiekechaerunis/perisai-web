/**
 * Parameter keamanan. PRD menyebut nilai-nilai ini "parameter keamanan" yang dapat diubah tanpa deploy ulang;
 * di produksi nilainya datang dari backend. Prototype memakai nilai usulan PRD (BRD AB-15).
 */
export const SECURITY_PARAMS = {
  /** FR-LG-12, FR-AK-11 */
  otpValidityMs: 10 * 60_000,
  /** FR-LG-13, FR-AK-10 */
  otpResendCooldownMs: 45_000,
  /** FR-LG-14, FR-AK-11 */
  otpMaxResends: 5,
  /** FR-LG-15, FR-AK-11 */
  otpMaxWrongAttempts: 5,
  otpLength: 6,
  /** FR-LG-22 */
  loginMaxFailures: 5,
  loginLockMs: 30 * 60_000,
  /** FR-LO-06 */
  idleTimeoutMs: 30 * 60_000,
  /** FR-LO-07 */
  absoluteTimeoutMs: 12 * 60 * 60_000,
  /** FR-LO-09: peringatan 2 menit sebelum idle timeout */
  idleWarningMs: 2 * 60_000,
  /** FR-LO-12, FR-LO-14: pencabutan berlaku ≤ 30 detik → interval cek sesi */
  sessionPollMs: 15_000,
  /** FR-LP-09 */
  resetLinkValidityMs: 60 * 60_000,
  /** Tabel L-4 */
  resetRequestCooldownMs: 60_000,
  resetRequestsPerHour: 3,
  /** FR-UK-08 */
  changePasswordMaxFailures: 5,
  changePasswordLockMs: 15 * 60_000,
  /** FR-AK-17 */
  inviteRequestCooldownMs: 24 * 60 * 60_000,
  /** BRD AB-14: undangan berlaku 7 hari (sampai 23:59 WIB hari terakhir) */
  inviteValidityDays: 7,
} as const;

export type SecurityParams = typeof SECURITY_PARAMS;
