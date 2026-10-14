/**
 * EmptyState — PERISAI Design System `Perisai.EmptyState` (Umpan balik).
 * Judul menyatakan fakta dengan kalimat biasa; tanpa ilustrasi, emoji, atau perayaan.
 * Bila kosong karena filter, pemakai menyediakan aksi "Hapus filter".
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
    <div role="status" className={cn('flex flex-col items-start gap-2 py-8', className)}>
      <p className="text-body font-semibold text-ink">{title}</p>
      {description && <p className="max-w-content-max text-body-dense text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
