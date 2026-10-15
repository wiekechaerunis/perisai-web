/**
 * KeyValueList — PERISAI Design System `Perisai.KeyValueList` (Data).
 * Tiga kolom: label (`ink-muted`, 160px), nilai, aksi opsional. Dipisah `border-subtle`, maks. `content-max`.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface KeyValueItem {
  key: string;
  label: ReactNode;
  value: ReactNode;
  action?: ReactNode;
  /** Nilai berupa angka/ID → mono. */
  mono?: boolean;
}

export interface KeyValueListProps {
  items: KeyValueItem[];
  /** block = blok ringkas berlatar `surface-sunken` di dialog konfirmasi (Figma InfoBlock 109:14140). */
  variant?: 'default' | 'block';
  /** Isi selebar wadah (halaman detail penuh), bukan lebar baca `content-max`. */
  fullWidth?: boolean;
  className?: string;
}

export function KeyValueList({ items, variant = 'default', fullWidth = false, className }: KeyValueListProps) {
  const block = variant === 'block';
  return (
    <dl className={cn(!fullWidth && 'max-w-content-max', block && 'rounded-md bg-surface-sunken px-5 py-2', className)}>
      {items.map((it) => (
        <div
          key={it.key}
          className={cn('grid items-baseline gap-4 border-b border-border-subtle last:border-b-0', block ? 'grid-cols-[120px_1fr_auto] py-2' : 'grid-cols-[160px_1fr_auto] py-3')}
        >
          <dt className="text-label text-ink-muted">{it.label}</dt>
          <dd className={cn('min-w-0 break-words text-body-dense text-ink', it.mono && 'font-mono')}>{it.value}</dd>
          <dd>{it.action}</dd>
        </div>
      ))}
    </dl>
  );
}
