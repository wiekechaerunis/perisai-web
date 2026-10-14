/**
 * Pagination — komponen NON-DS (DS_GAPS.md). Navigasi halaman untuk paginasi server (FR-LA-09, FR-JA-16).
 * Kiri: pilihan baris per halaman (opsional) dan ringkasan "1–25 dari 132"; kanan: Sebelumnya/Berikutnya.
 * Teks disediakan pemakai.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
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
  };
}

export function Pagination({ page, pageSize, total, onPageChange, pageSizeOptions, onPageSizeChange, labels }: PaginationProps) {
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const showSize = !!pageSizeOptions?.length && !!onPageSizeChange;
  return (
    <nav aria-label={labels.label} className="flex flex-wrap items-center justify-between gap-4 pt-4">
      <div className="flex items-center gap-4">
        {showSize && (
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-caption text-ink-muted">{labels.barisPerHalaman}</span>
            <Select
              label={labels.barisPerHalaman}
              hideLabel
              options={pageSizeOptions.map((n) => ({ value: String(n), label: String(n) }))}
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
              className="w-[88px]"
            />
          </div>
        )}
        <span className="font-mono text-caption text-ink-subtle">{labels.ringkasan(from, to, total)}</span>
      </div>
      <div className="flex gap-2">
        <Button variant="quiet" onClick={() => onPageChange(page - 1)} disabled={page <= 1} icon={<ChevronLeft aria-hidden size={16} strokeWidth={1.8} />}>
          {labels.sebelumnya}
        </Button>
        <Button variant="quiet" onClick={() => onPageChange(page + 1)} disabled={page >= pages}>
          {labels.berikutnya}
          <ChevronRight aria-hidden size={16} strokeWidth={1.8} />
        </Button>
      </div>
    </nav>
  );
}
