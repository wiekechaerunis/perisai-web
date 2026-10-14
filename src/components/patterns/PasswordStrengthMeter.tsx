/**
 * PasswordStrengthMeter — komponen NON-DS (usulan di DS_GAPS.md). Meter 4 bar, informatif (FR-AK-05).
 * Tata letak mengikuti Figma 82:4635: 4 bar 4px dengan jarak 10px, label di bawah bar.
 *
 * ASSUMPTION (K-1): PRD Tabel P-1 dan Figma 82:4635 memakai bar merah/kuning/hijau, sedangkan DS hanya
 * mengizinkan warna untuk severitas. Bar terisi memakai `ink` (netral), label kata selalu tampil, dan
 * "Lemah" memakai `caution`. Menunggu keputusan; lihat ASSUMPTIONS.md.
 */
import { cn } from '@/lib/cn';

export interface PasswordStrengthMeterProps {
  /** Jumlah bar terisi, 0–4. */
  bars: 0 | 1 | 2 | 3 | 4;
  /** Label kata ("Lemah", "Cukup", …) disediakan pemakai. */
  label: string;
  /** Prefiks aksesibel, mis. "Kekuatan kata sandi". */
  srPrefix: string;
  /** Tanda kondisi lemah → `caution`. */
  weak?: boolean;
  className?: string;
}

export function PasswordStrengthMeter({ bars, label, srPrefix, weak = false, className }: PasswordStrengthMeterProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div
        role="meter"
        aria-label={srPrefix}
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={bars}
        aria-valuetext={label}
        className="grid grid-cols-4 gap-[10px]"
      >
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn('h-1 rounded-sm', i <= bars ? (weak ? 'bg-caution' : 'bg-ink') : 'bg-border')}
          />
        ))}
      </div>
      <span aria-live="polite" className={cn('text-caption', weak ? 'text-caution-ink' : 'text-ink-subtle')}>
        {label}
      </span>
    </div>
  );
}
