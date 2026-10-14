/**
 * DataTable — PERISAI Design System `Perisai.DataTable` (Data).
 * Baris min. `row-min` (44px), garis `border-subtle`, tanpa zebra; nama kolom `label` di `ink-muted`;
 * angka rata kanan `mono`. Duduk langsung di Section tanpa kotak tambahan.
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
  /** Id baris yang sedang dipilih → `surface-selected`. */
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

  if (error) return <div role="alert" className="py-6 text-body-dense text-ink">{error}</div>;
  if (loading) return <div aria-busy className="py-6">{loadingContent}</div>;
  if (data.length === 0 && empty) return <>{empty}</>;

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-border">
              {hg.headers.map((h) => {
                const meta = h.column.columnDef.meta as DataTableColumnMeta | undefined;
                const sorted = h.column.getIsSorted();
                return (
                  <th
                    key={h.id}
                    scope="col"
                    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                    className={cn('px-3 py-2 text-label text-ink-muted', meta?.align === 'right' && 'text-right')}
                  >
                    {h.isPlaceholder ? null : h.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={h.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {sorted === 'asc' && <ArrowUp aria-hidden size={14} strokeWidth={1.8} />}
                        {sorted === 'desc' && <ArrowDown aria-hidden size={14} strokeWidth={1.8} />}
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
                'border-b border-border-subtle last:border-b-0 hover:bg-surface-sunken',
                onRowClick && 'cursor-pointer',
                row.id === selectedRowId && 'bg-surface-selected',
              )}
            >
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta as DataTableColumnMeta | undefined;
                return (
                  <td
                    key={cell.id}
                    className={cn(
                      'h-row-min px-3 py-3 align-middle text-body-dense text-ink',
                      meta?.align === 'right' && 'text-right',
                      meta?.mono && 'font-mono',
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
