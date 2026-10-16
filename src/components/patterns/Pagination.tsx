/**
 * Pagination — PERISAI DS v2 · Lime `Pagination` (kaki kartu tabel). Paginasi server FR-LA-09, FR-JA-16.
 * - Kiri: "Tampilkan [25 ▾] per halaman" (opsional) + pemisah + rentang tebal "26–50 dari 132".
 * - Kanan: « pertama, ‹ sebelumnya, nomor halaman (maks. 7 slot), › berikutnya, » terakhir. Tombol 32px `radius-md`;
 *   halaman aktif `action` 700; tombol navigasi tanpa garis (chevron 16px `ink-subtle`, hover `surface-sunken`); yang tidak berlaku tetap di tempat dengan
 *   `ink-disabled` + `aria-disabled`.
 * - Total 0 → disembunyikan. Teks disediakan pemakai.
 */
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Select } from '../ui/Select';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Pilihan baris per halaman; pemilih tampil bila diisi bersama `onPageSizeChange`. */
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (size: number) => void;
  labels: {
    sebelumnya: string;
    berikutnya: string;
    label: string;
    ringkasan: (from: number, to: number, total: number) => string;
    barisPerHalaman?: string;
    pertama?: string;
    terakhir?: string;
    /** Kata sebelum dan sesudah pemilih jumlah ("Tampilkan" … "per halaman"). */
    tampilkan?: string;
    perHalaman?: string;
    halamanKe?: (n: number) => string;
  };
}

/** Nomor halaman dalam maks. 7 slot: 1 2 3 4 5 … 9 · 1 … 4 5 6 … 9 · 1 … 5 6 7 8 9. */
export function pageSlots(page: number, pages: number): (number | 'gap')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, 'gap', pages];
  if (page >= pages - 3) return [1, 'gap', pages - 4, pages - 3, pages - 2, pages - 1, pages];
  return [1, 'gap', page - 1, page, page + 1, 'gap', pages];
}

const pg =
  'inline-flex h-8 min-w-[32px] items-center justify-center rounded-md px-1 text-caption font-semibold text-ink transition-[background-color,transform] duration-fast ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring';

function NavButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      className={cn(
        pg,
        disabled
          ? 'cursor-not-allowed text-ink-disabled'
          : 'text-ink-subtle hover:bg-surface-sunken hover:text-ink active:scale-[.97]',
      )}
    >
      {children}
    </button>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  labels,
}: PaginationProps) {
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const showSize = !!pageSizeOptions?.length && !!onPageSizeChange;
  const ic = { size: 16, strokeWidth: 2, 'aria-hidden': true } as const;
  return (
    <nav
      aria-label={labels.label}
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-[10px] text-caption text-ink-muted"
    >
      <div className="flex flex-wrap items-center gap-2">
        {showSize && (
          <>
            <span aria-hidden>{labels.tampilkan ?? 'Tampilkan'}</span>
            <Select
              label={labels.barisPerHalaman}
              hideLabel
              size="sm"
              options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
              className="w-[72px]"
            />
            <span aria-hidden>{labels.perHalaman ?? 'per halaman'}</span>
            <span aria-hidden className="mx-1 h-[18px] w-px bg-border" />
          </>
        )}
        <span aria-live="polite" className="font-semibold text-ink">
          {labels.ringkasan(from, to, total)}
        </span>
      </div>
      {
        <div className="flex items-center gap-1">
          <NavButton
            label={labels.pertama ?? 'Halaman pertama'}
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft {...ic} />
          </NavButton>
          <NavButton
            label={labels.sebelumnya}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft {...ic} />
          </NavButton>
          {pageSlots(page, pages).map((s, i) =>
            s === 'gap' ? (
              <span key={`gap-${i}`} aria-hidden className={cn(pg, 'text-ink-muted')}>
                …
              </span>
            ) : (
              <button
                key={s}
                type="button"
                aria-label={labels.halamanKe ? labels.halamanKe(s) : `Halaman ${s}`}
                aria-current={s === page ? 'page' : undefined}
                onClick={() => s !== page && onPageChange(s)}
                className={cn(
                  pg,
                  s === page
                    ? 'bg-action font-bold text-on-action'
                    : 'hover:bg-surface-sunken active:scale-[.97]',
                )}
              >
                {s}
              </button>
            ),
          )}
          <NavButton
            label={labels.berikutnya}
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight {...ic} />
          </NavButton>
          <NavButton
            label={labels.terakhir ?? 'Halaman terakhir'}
            disabled={page >= pages}
            onClick={() => onPageChange(pages)}
          >
            <ChevronsRight {...ic} />
          </NavButton>
        </div>
      }
    </nav>
  );
}
