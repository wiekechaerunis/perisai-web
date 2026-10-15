/**
 * SeverityBadge — PERISAI Design System `Perisai.SeverityBadge`.
 * Satu-satunya elemen bertitik warna: kata + titik `sev-*`, tanpa border. Empat tingkat baku: Kritis, Tinggi, Sedang,
 * Rendah (skala menunggu pengesahan klien, K-05).
 */
import { cn } from '@/lib/cn';

export type SeverityLevel = 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah';

const DOT: Record<SeverityLevel, string> = {
  Kritis: 'bg-sev-kritis',
  Tinggi: 'bg-sev-tinggi',
  Sedang: 'bg-sev-sedang',
  Rendah: 'bg-sev-rendah',
};
const INK: Record<SeverityLevel, string> = {
  Kritis: 'text-sev-kritis-ink',
  Tinggi: 'text-sev-tinggi-ink',
  Sedang: 'text-sev-sedang-ink',
  Rendah: 'text-sev-rendah-ink',
};

export interface SeverityBadgeProps {
  level: SeverityLevel;
  className?: string;
}

export function SeverityBadge({ level, className }: SeverityBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-[6px] text-caption font-semibold', INK[level], className)}>
      <span aria-hidden className={cn('h-2 w-2 shrink-0 rounded-full', DOT[level])} />
      {level}
    </span>
  );
}
