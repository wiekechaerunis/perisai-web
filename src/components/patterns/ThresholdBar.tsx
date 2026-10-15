/**
 * ThresholdBar — PERISAI Design System `Perisai.ThresholdBar`: batang horizontal terhadap batas/target (ISA-101):
 * normal `ink-subtle`, abnormal `caution` dengan nama dan angka tebal `caution-ink`. Garis batas 1px `ink`,
 * dijelaskan dalam kalimat di atas grafik (`legend`).
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ThresholdRow {
  key: string;
  label: string;
  /** Nilai 0..max (mis. persen realisasi terhadap rencana). */
  value: number;
  /** Teks nilai di kanan, mis. "112% · Rp 1.350 jt". */
  valueLabel: string;
  abnormal?: boolean;
}

export interface ThresholdBarProps {
  rows: ThresholdRow[];
  /** Posisi garis batas (satuan sama dengan `value`). */
  threshold: number;
  max: number;
  legend: ReactNode;
  className?: string;
}

export function ThresholdBar({ rows, threshold, max, legend, className }: ThresholdBarProps) {
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / max) * 100))}%`;
  return (
    <figure className={cn('flex flex-col gap-3', className)}>
      <figcaption className="text-caption text-ink-muted">{legend}</figcaption>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.key} className="grid grid-cols-1 gap-1 sm:grid-cols-[220px_1fr_150px] sm:items-center sm:gap-3">
            <span className={cn('text-body-dense', r.abnormal ? 'font-semibold text-caution-ink' : 'text-ink')}>{r.label}</span>
            <span className="relative h-3 rounded-sm bg-surface-sunken">
              <span className={cn('absolute inset-y-0 left-0 rounded-sm', r.abnormal ? 'bg-caution' : 'bg-ink-subtle')} style={{ width: pct(r.value) }} />
              <span aria-hidden className="absolute -inset-y-1 w-px bg-ink" style={{ left: pct(threshold) }} />
            </span>
            <span className={cn('font-mono text-caption tabular-nums sm:text-right', r.abnormal ? 'font-semibold text-caution-ink' : 'text-ink-muted')}>{r.valueLabel}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
