/**
 * KeyValueList — daftar label–nilai. Tiga kolom: label (`label` 12/16 600 `ink-muted`, 160px), nilai 13px `ink`, aksi
 * opsional; dipisah `border-subtle`. Varian `block` = kotak isi DS v2 (`p-kv`): `surface-subtle`, garis dalam
 * `border-subtle`, `radius-lg`, label 120px, nilai 600 — dipakai di ConfirmDialog varian Ringkasan.
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
    <dl className={cn(!fullWidth && 'max-w-content-max', block && 'rounded-lg bg-surface-subtle px-[14px] py-1 shadow-[inset_0_0_0_1px_var(--color-border-subtle)]', className)}>
      {items.map((it) => (
        <div
          key={it.key}
          className={cn('grid items-baseline gap-3', block ? 'grid-cols-[120px_1fr_auto] py-[6px]' : 'grid-cols-[160px_1fr_auto] border-b border-border-subtle py-3 last:border-b-0')}
        >
          <dt className="text-label text-ink-muted">{it.label}</dt>
          <dd className={cn('min-w-0 break-words text-body text-ink', block && 'font-semibold', it.mono && 'font-mono font-normal')}>{it.value}</dd>
          <dd>{it.action}</dd>
        </div>
      ))}
    </dl>
  );
}
