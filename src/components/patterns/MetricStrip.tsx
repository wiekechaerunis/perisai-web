/**
 * MetricStrip — PERISAI Design System `Perisai.MetricStrip`: 3–5 angka ringkasan dalam satu strip, dipisah garis
 * tipis. Setiap angka punya konteks; delta buruk memakai `caution-ink`, delta baik tetap `ink-muted`.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export interface Metric {
  key: string;
  label: string;
  value: ReactNode;
  /** Konteks angka (perbandingan, rencana, tenggat). */
  context?: ReactNode;
  /** Konteks menunjukkan kondisi buruk → `caution-ink`. */
  bad?: boolean;
  /** Tautan drill-down. */
  to?: string;
}

export interface MetricStripProps {
  metrics: Metric[];
  className?: string;
}

export function MetricStrip({ metrics, className }: MetricStripProps) {
  return (
    <dl className={cn('grid divide-y divide-border-subtle sm:grid-cols-2 sm:divide-y-0 lg:flex lg:divide-x', className)}>
      {metrics.slice(0, 5).map((m) => {
        const body = (
          <>
            <dt className="text-caption text-ink-muted">{m.label}</dt>
            <dd className="font-mono text-heading-1 tabular-nums text-ink">{m.value}</dd>
            {m.context && <dd className={cn('text-caption', m.bad ? 'font-medium text-caution-ink' : 'text-ink-muted')}>{m.context}</dd>}
          </>
        );
        return (
          <div key={m.key} className="flex min-w-0 flex-1 flex-col gap-1 py-3 lg:px-5 lg:py-1 lg:first:pl-0">
            {m.to ? (
              <Link to={m.to} className="flex flex-col gap-1 rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring">
                {body}
              </Link>
            ) : (
              body
            )}
          </div>
        );
      })}
    </dl>
  );
}
