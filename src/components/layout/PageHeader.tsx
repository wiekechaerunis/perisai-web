/**
 * PageHeader — PERISAI Design System `Perisai.PageHeader` (Navigasi).
 * Jejak lokasi, judul (nama tempat untuk halaman kerja), ringkasan satu baris, maks. dua aksi di kanan.
 * Tabs, bila ada, menempel di bawah dan berbagi garis `border`. Tata letak Figma 66:3139: judul langsung di atas
 * `surface-page` (tanpa latar putih), padding 24px.
 */
import { ChevronRight } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export interface Crumb {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  title: ReactNode;
  breadcrumbs?: Crumb[];
  summary?: ReactNode;
  actions?: ReactNode;
  /** Tabs di bawah judul. */
  tabs?: ReactNode;
  className?: string;
}

export function PageHeader({ title, breadcrumbs, summary, actions, tabs, className }: PageHeaderProps) {
  return (
    <header className={cn('px-6 pt-6', !tabs && 'pb-1', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Jejak lokasi" className="mb-2">
          <ol className="flex items-center gap-1 text-caption text-ink-subtle">
            {breadcrumbs.map((c, i) => (
              <Fragment key={`${c.label}-${i}`}>
                {i > 0 && <ChevronRight aria-hidden size={14} strokeWidth={1.8} />}
                <li>
                  {c.to ? (
                    <Link to={c.to} className="hover:text-ink hover:underline">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{c.label}</span>
                  )}
                </li>
              </Fragment>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading-1 text-ink">{title}</h1>
          {summary && <p className="text-body-dense text-ink-muted">{summary}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="mt-6 border-b border-border">{tabs}</div>}
    </header>
  );
}
