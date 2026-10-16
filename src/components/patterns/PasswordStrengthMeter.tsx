/**
 * PasswordStrengthMeter — bagian PasswordField PERISAI DS v2 · Lime: indikator 4 segmen 4px (jarak 4px), warna
 * `error-ink` (lemah) → `caution-ink` (sedang) → `status-success-ink` (kuat), SELALU dengan kata ("Kekuatan: Sedang"),
 * tidak hanya warna. Kosong: semua segmen kosong + "Masukkan kata sandi" (Tabel P-1). FR-AK-05.
 * Menggantikan ASSUMPTION K-1 (bar netral) karena DS v2 memberi warna pada meter kekuatan.
 */
import { cn } from '@/lib/cn';

export interface PasswordStrengthMeterProps {
  /** Jumlah bar terisi, 0–4. */
  bars: 0 | 1 | 2 | 3 | 4;
  /** Label kata ("Lemah", "Cukup", …) disediakan pemakai. */
  label: string;
  /** Prefiks, mis. "Kekuatan kata sandi" — tampil sebagai "Kekuatan kata sandi: Cukup". */
  srPrefix: string;
  /** Prefiks yang tampil sebelum label (DS v2: "Kekuatan"). Bawaan: srPrefix. */
  prefix?: string;
  /** Tanda kondisi lemah (bila tidak diisi: 1 bar = lemah). */
  weak?: boolean;
  className?: string;
}

export function PasswordStrengthMeter({ bars, label, srPrefix, prefix, weak, className }: PasswordStrengthMeterProps) {
  const isWeak = weak ?? bars <= 1;
  const tone = isWeak ? 'bg-error-ink' : bars === 2 ? 'bg-caution-ink' : 'bg-status-success-ink';
  return (
    <div className={cn('flex flex-col gap-[6px]', className)}>
      <div
        role="meter"
        aria-label={srPrefix}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={bars}
        aria-valuetext={label}
        className="grid grid-cols-4 gap-1"
      >
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn('h-1 rounded-[2px] transition-colors duration-appear', i <= bars ? tone : 'bg-surface-sunken')} />
        ))}
      </div>
      <span aria-live="polite" className="text-caption text-ink-muted">
        {bars > 0 ? (
          <>
            {prefix ?? srPrefix}: <b className="font-semibold text-ink">{label}</b>
          </>
        ) : (
          label
        )}
      </span>
    </div>
  );
}
