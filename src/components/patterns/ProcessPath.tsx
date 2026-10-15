/**
 * ProcessPath — PERISAI Design System `Perisai.ProcessPath`: tahapan proses bertingkat.
 * Tahap selesai `surface-sunken` + centang; tahap aktif isi `action`; tahap berikutnya garis `border`. Tanpa hijau.
 */
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ProcessPathProps {
  steps: string[];
  /** Indeks tahap aktif; `steps.length` = semua selesai. */
  current: number;
  label: string;
  className?: string;
}

export function ProcessPath({ steps, current, label, className }: ProcessPathProps) {
  return (
    <ol aria-label={label} className={cn('flex flex-wrap items-center gap-2', className)}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span
              className={cn(
                'inline-flex h-8 items-center gap-[6px] rounded-md px-3 text-caption font-medium',
                done && 'bg-surface-sunken text-ink-muted',
                active && 'bg-action text-on-action',
                !done && !active && 'border border-border text-ink-muted',
              )}
            >
              {done && <Check aria-hidden size={14} strokeWidth={1.8} />}
              {s}
            </span>
            {i < steps.length - 1 && <span aria-hidden className="h-px w-4 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
