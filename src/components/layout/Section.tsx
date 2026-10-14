/**
 * Section — PERISAI Design System `Perisai.Section` (Tata letak).
 * Satu-satunya tingkat wadah: `surface` di atas `surface-page`, `radius-lg`, tanpa border dan bayangan.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  /** Ringkasan di bawah judul. */
  description?: ReactNode;
  /** Aksi/tautan di kanan judul, mis. "Lihat semua". */
  action?: ReactNode;
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { title, description, action, children, className, ...rest },
  ref,
) {
  return (
    <section ref={ref} className={cn('rounded-lg bg-surface px-6 py-5', className)} {...rest}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {title && <h2 className="text-heading-2 text-ink">{title}</h2>}
            {description && <p className="text-body-dense text-ink-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
});
