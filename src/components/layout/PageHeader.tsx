/**
 * PageHeader — PERISAI DS v2 · Lime `PageHeader`. Dua bentuk:
 *
 * - **Tingkat atas** (item sidebar, Akun saya): judul `page-title` 24/32 700, di bawahnya SATU kalimat subjudul
 *   (`subtitle`, `ink-muted`, lebar maks. 560px). Tidak ada teks di atas judul (tanpa jejak lokasi). Aksi di kanan:
 *   maks. 1 primer + 1 sekunder. Duduk langsung di `surface-page`, padding 24px.
 * - **Turunan** (detail, form; aktif bila `back` atau `breadcrumbs` diisi): pita `surface` bergaris bawah `border`,
 *   padding 18px 24px, tombol kembali 40px; baris 1 judul `page-title-child` 20/28 + tag status sebaris (`titleAside`);
 *   baris 2 jejak lokasi 12px `ink-muted` dipisah "›" (boleh disambung meta singkat setelah "·" — `summary`).
 *
 * Keduanya tanpa ID dokumen, stempel draf, atau cap waktu. Tabs, bila ada, menempel di bawah header.
 */
import { ArrowLeft } from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export interface Crumb {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  title: ReactNode;
  /** Di samping judul, di luar h1 (mis. tag status di halaman detail). */
  titleAside?: ReactNode;
  /** Jejak lokasi — hanya untuk halaman turunan (ditampilkan di bawah judul). */
  breadcrumbs?: Crumb[];
  /** Tingkat atas: subjudul penjelasan. Turunan: meta singkat setelah jejak lokasi. */
  summary?: ReactNode;
  actions?: ReactNode;
  /** Tabs di bawah judul. */
  tabs?: ReactNode;
  /** Tombol kembali 40px di kiri judul: tujuan + label aksesibel (mis. "Kembali ke Role"). */
  back?: { to: string; label: string };
  className?: string;
}

export function PageHeader({ title, titleAside, breadcrumbs, summary, actions, tabs, back, className }: PageHeaderProps) {
  const child = !!back || (!!breadcrumbs && breadcrumbs.length > 0);

  if (child) {
    return (
      <header className={cn('border-b border-border bg-surface', className)}>
        <div className="flex items-center gap-3 px-6 py-[18px]">
          {back && (
            <Link
              to={back.to}
              aria-label={back.label}
              title={back.label}
              className="flex h-control-height w-control-height shrink-0 items-center justify-center rounded-md bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-border-control)] transition-[background-color,box-shadow,transform] duration-fast hover:bg-surface-subtle hover:shadow-[inset_0_0_0_1px_var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring active:scale-[.97]"
            >
              <ArrowLeft aria-hidden size={18} strokeWidth={1.9} />
            </Link>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-page-title-child text-ink">{title}</h1>
              {titleAside}
            </div>
            {(breadcrumbs?.length || summary) && (
              <div className="flex flex-wrap items-center gap-[6px] text-caption text-ink-muted">
                {breadcrumbs && breadcrumbs.length > 0 && (
                  <nav aria-label="Jejak lokasi">
                    <ol className="flex flex-wrap items-center gap-[6px]">
                      {breadcrumbs.map((c, i) => (
                        <Fragment key={`${c.label}-${i}`}>
                          {i > 0 && (
                            <li aria-hidden className="select-none">
                              ›
                            </li>
                          )}
                          <li>
                            {c.to ? (
                              <Link to={c.to} className="transition-colors duration-fast hover:text-ink hover:underline">
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
                {summary && (
                  <>
                    {breadcrumbs && breadcrumbs.length > 0 && <span aria-hidden>·</span>}
                    <span>{summary}</span>
                  </>
                )}
              </div>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        {tabs && <div className="px-6">{tabs}</div>}
      </header>
    );
  }

  return (
    <header className={cn('px-6 pt-6', !tabs && 'pb-1', className)}>
      {/* DS v2: aksi dan PageFilter selalu di kanan, sejajar tengah dengan blok judul, tidak turun ke bawah judul. */}
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-page-title text-ink">{title}</h1>
            {titleAside}
          </div>
          {summary && <p className="max-w-[560px] text-subtitle text-ink-muted">{summary}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="mt-5 border-b border-border">{tabs}</div>}
    </header>
  );
}
