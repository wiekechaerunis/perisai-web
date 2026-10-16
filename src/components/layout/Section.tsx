/**
 * Section — kartu PERISAI DS v2 · Lime: `surface` bergaris `border`, `radius-xl`, padding 20px, TANPA bayangan.
 * Satu tingkat wadah: di dalam kartu hanya jarak, garis tipis, dan kotak isi bergaris.
 * Judul `section-title` 15/22 700; deskripsi `ink-muted`; aksi/tautan di kanan judul.
 * `flush`: tanpa padding (kartu tabel: toolbar, tabel, dan pagination mengatur jaraknya sendiri).
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  /** Ringkasan di bawah judul. */
  description?: ReactNode;
  /** Aksi/tautan di kanan judul, mis. "Lihat semua". */
  action?: ReactNode;
  /** Tanpa padding (kartu tabel). */
  flush?: boolean;
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { title, description, action, flush = false, children, className, ...rest },
  ref,
) {
  return (
    <section ref={ref} className={cn('rounded-xl border border-border bg-surface', flush ? 'overflow-hidden' : 'p-5', className)} {...rest}>
      {(title || action) && (
        <header className={cn('flex items-start justify-between gap-4', flush ? 'px-4 pb-3 pt-4' : 'mb-4')}>
          <div className="flex flex-col gap-1">
            {title && <h2 className="text-section-title text-ink">{title}</h2>}
            {description && <p className="text-body text-ink-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
});
