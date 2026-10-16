/**
 * TableCard — kerangka DataTable PERISAI DS v2 · Lime: satu tabel dalam satu kartu bersama toolbar, filter aktif,
 * dan pagination.
 * - Toolbar (padding 12px 16px): kiri judul tabel `section-title` SAJA (jumlah hasil tidak ditulis di toolbar); kanan kotak
 *   cari 220–300px, tombol Filter, lalu tombol ikon opsional (Unduh, Atur kolom).
 * - Baris filter aktif (AppliedFilters) di bawah toolbar.
 * - Tabel; pagination di kaki kartu.
 * TableSearch: kotak cari 36px berikon, placeholder menyebut yang dicari.
 */
import { Search } from 'lucide-react';
import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Section } from '../layout/Section';
import { inputStateClass } from '../ui/TextField';

export interface TableCardProps {
  title: ReactNode;
  /** Kanan toolbar: TableSearch, FilterPanel, tombol ikon. */
  tools?: ReactNode;
  /** Baris AppliedFilters. */
  applied?: ReactNode;
  /** Isi di antara toolbar dan tabel (mis. catatan, tab). */
  before?: ReactNode;
  children: ReactNode;
  /** Kaki kartu (Pagination). */
  footer?: ReactNode;
  className?: string;
}

export function TableCard({ title, tools, applied, before, children, footer, className }: TableCardProps) {
  return (
    <Section flush className={className}>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <h2 className="mr-auto text-section-title text-ink">{title}</h2>
        {tools}
      </div>
      {applied}
      {before}
      {children}
      {footer && <div className="border-t border-border-subtle">{footer}</div>}
    </Section>
  );
}

export interface TableSearchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label aksesibel (tersembunyi). */
  label: string;
}

export const TableSearch = forwardRef<HTMLInputElement, TableSearchProps>(function TableSearch({ label, className, ...rest }, ref) {
  return (
    <label className={cn('relative block w-[260px] max-w-full', className)}>
      <span className="sr-only">{label}</span>
      <Search aria-hidden size={15} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
      <input
        ref={ref}
        type="search"
        className={cn('h-control-sm w-full rounded-md border-0 pl-[34px] pr-3 text-body outline-none transition-shadow duration-fast placeholder:text-ink-muted', inputStateClass({}))}
        {...rest}
      />
    </label>
  );
});
