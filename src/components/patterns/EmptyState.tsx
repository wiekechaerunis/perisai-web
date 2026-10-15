/**
 * EmptyState — PERISAI Design System `Perisai.EmptyState` (Umpan balik).
 * Rata tengah, lebar isi maks. 420px, judul `heading-2`, deskripsi 14px `ink-muted`, satu aksi opsional; padding
 * 32px × 24px di dalam Section. Judul menyatakan fakta; tanpa emoji. Bila kosong karena filter, pemakai menyediakan
 * aksi "Hapus filter" (tanpa ilustrasi). Ilustrasi opsional DS belum dipakai: aset resmi menyusul dari desainer.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div role="status" className={cn('mx-auto flex max-w-[420px] flex-col items-center gap-2 px-6 py-8 text-center', className)}>
      <p className="text-heading-2 text-ink">{title}</p>
      {description && <p className="text-body-dense text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
