/**
 * EmptyState — PERISAI DS v2 · Lime `EmptyState`. Ilustrasi garis + judul `section-title` + satu kalimat `ink-muted`
 * + maks. satu aksi (sekunder untuk pemulihan; primer hanya bila itu aksi utama halaman). Rata tengah.
 * Kosong karena filter/pencarian di dalam tabel: ilustrasi kecil (`sm`) + "Hapus filter".
 * Ilustrasi dekoratif (aria-hidden); pesannya ada di teks. Teks dan aksi disediakan pemakai.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Illustration, type IllustrationName } from './Illustration';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** Ilustrasi DS v2. Bawaan `kosong`; `null` = tanpa ilustrasi. */
  illustration?: IllustrationName | null;
  illustrationSize?: 'sm' | 'md';
  className?: string;
}

export function EmptyState({ title, description, action, illustration = 'kosong', illustrationSize = 'md', className }: EmptyStateProps) {
  return (
    <div role="status" className={cn('il-host mx-auto flex max-w-[420px] flex-col items-center gap-2 px-6 py-8 text-center', className)}>
      {illustration && <Illustration name={illustration} size={illustrationSize} className="mb-1" />}
      <p className="text-section-title text-ink">{title}</p>
      {description && <p className="max-w-[320px] text-body text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
