/**
 * DataTable — PERISAI DS v2 · Lime `DataTable`. Duduk di dalam kartu bersama toolbar dan pagination.
 * Kepala `surface-subtle`, teks `label` `ink-muted`, padding 10px, garis bawah `border`. Baris min. 52px, garis
 * `border-subtle`, hover `surface-subtle` + garis kiri 3px `action` (120ms). Kolom pertama/terakhir berjarak 16px dari tepi kartu. Angka rata kanan
 * tabular. Kolom pertama = judul `body-strong` + ID `data-id` (disusun pemakai).
 * Dibangun di atas TanStack Table; data, kolom, dan teks kosong disediakan pemakai.
 */
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface DataTableColumnMeta {
  align?: 'left' | 'right';
  mono?: boolean;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  /** Label aksesibel tabel. */
  caption: string;
  getRowId?: (row: T) => string;
  loading?: boolean;
  /** Teks/komponen saat loading (mis. Skeleton). */
  loadingContent?: ReactNode;
  /** Tampilan saat data kosong (EmptyState). */
  empty?: ReactNode;
  /** Pesan error (diberikan pemakai). */
  error?: ReactNode;
  initialSorting?: SortingState;
  /** Klik baris membuka detail (pola master-detail). Baris tetap punya tautan/tombol yang bisa difokus. */
  onRowClick?: (row: T) => void;
  /** Id baris yang sedang dipilih → `surface-subtle`. */
  selectedRowId?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  caption,
  getRowId,
  loading,
  loadingContent,
  empty,
  error,
  initialSorting = [],
  onRowClick,
  selectedRowId,
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (error) return <div role="alert" className="py-6 text-body text-ink">{error}</div>;
  if (loading) return <div aria-busy className="py-6">{loadingContent}</div>;
  if (data.length === 0 && empty) return <>{empty}</>;

  return (
    <div className={cn('p-scroll w-full overflow-x-auto', className)}>
      <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => {
                const meta = h.column.columnDef.meta as DataTableColumnMeta | undefined;
                const sorted = h.column.getIsSorted();
                return (
                  <th
                    key={h.id}
                    scope="col"
                    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                    className={cn(
                      'whitespace-nowrap border-b border-border bg-surface-subtle p-[10px] text-label text-ink-muted first:pl-4 last:pr-4',
                      meta?.align === 'right' && 'text-right',
                    )}
                  >
                    {h.isPlaceholder ? null : h.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={h.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 transition-colors duration-fast hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {sorted === 'asc' && <ArrowUp aria-hidden size={14} strokeWidth={2} />}
                        {sorted === 'desc' && <ArrowDown aria-hidden size={14} strokeWidth={2} />}
                      </button>
                    ) : (
                      flexRender(h.column.columnDef.header, h.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={cn(
                'group/row transition-colors duration-fast hover:bg-surface-subtle',
                onRowClick && 'cursor-pointer',
                row.id === selectedRowId && 'bg-surface-subtle',
              )}
            >
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;
                return (
                  <td
                    key={cell.id}
                    className={cn(
                      'h-row-min border-b border-border-subtle p-[10px] align-middle text-body text-ink first:pl-4 last:pr-4 group-last/row:border-b-0',
                      // Ekspresi E4: baris yang di-hover diberi garis kiri 3px `action`.
                      'first:group-hover/row:shadow-[inset_3px_0_0_var(--color-action)]',
                      meta?.align === 'right' && 'text-right',
                      meta?.mono && 'font-mono text-caption',
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
