/**
 * FilterBar — PERISAI Design System `Perisai.FilterBar` (pola Filter daftar).
 * Di area filter hanya isian yang berbentuk kotak bergaris; aksi berupa teks berikon (Button `quiet`), filter ya/tidak
 * berupa Checkbox, filter aktif berupa pil.
 *
 * - Baris utama: field paling sering dipakai (pencarian, periode), tombol "Filter lainnya (n)" (`quiet`, chevron,
 *   `aria-expanded`), lalu aksi tambahan bila ada.
 * - Baris filter tambahan: dibuka/ditutup; terbuka otomatis bila ada filter tambahan aktif saat halaman dibuka.
 * - Baris status (di bawah garis `border-subtle`): pil filter tambahan yang aktif (hanya saat baris tambahan tertutup),
 *   "Hapus filter", dan filter cepat (`quick`, mis. Checkbox) rata kanan.
 * Teks lewat props.
 */
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Button } from '../ui/Button';

export interface ActiveFilter {
  key: string;
  /** Mis. "Organisasi: PT Andalas Energi Hulu". */
  label: string;
  onRemove: () => void;
}

export interface FilterBarProps {
  /** Field utama (mis. pencarian dan periode). */
  primary: ReactNode;
  /** Filter tambahan yang dapat dilipat. */
  advanced?: ReactNode;
  /** Filter tambahan yang sedang aktif; jumlahnya tampil di tombol, isinya tampil sebagai pil saat tertutup. */
  activeFilters?: ActiveFilter[];
  /** Aksi di ujung baris utama (mis. "Tampilkan" untuk filter yang diterapkan manual). */
  actions?: ReactNode;
  /** Filter cepat ya/tidak di kanan baris status (Checkbox). */
  quick?: ReactNode;
  /** Ada filter aktif (termasuk field utama) → tampilkan "Hapus filter". */
  onClear?: () => void;
  /** Catatan di bawah filter (mis. keterangan filter cepat aktif). */
  footer?: ReactNode;
  labels: { more: (n: number) => string; less: string; clear: string; remove: (label: string) => string; active: string };
}

export function FilterBar({ primary, advanced, activeFilters = [], actions, quick, onClear, footer, labels }: FilterBarProps) {
  const id = useId();
  const [open, setOpen] = useState(activeFilters.length > 0);
  const chips = open ? [] : activeFilters;
  const statusRow = chips.length > 0 || !!onClear || !!quick;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        {primary}
        {advanced && (
          <Button
            variant="quiet"
            aria-expanded={open}
            aria-controls={id}
            icon={<SlidersHorizontal aria-hidden size={16} strokeWidth={1.8} />}
            onClick={() => setOpen((o) => !o)}
            className="font-semibold"
          >
            <span className="flex items-center gap-1">
              {open ? labels.less : labels.more(activeFilters.length)}
              {open ? <ChevronUp aria-hidden size={14} strokeWidth={1.8} /> : <ChevronDown aria-hidden size={14} strokeWidth={1.8} />}
            </span>
          </Button>
        )}
        {actions}
      </div>
      {advanced && open && (
        <div id={id} className="flex flex-wrap items-end gap-2">
          {advanced}
        </div>
      )}
      {statusRow && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3">
          {chips.length > 0 && (
            <ul aria-label={labels.active} className="flex flex-wrap items-center gap-2">
              {chips.map((f) => (
                <li key={f.key} className="inline-flex h-7 items-center gap-[6px] rounded-full border border-border bg-surface-sunken pl-3 pr-1 text-[13px] font-medium text-ink">
                  {f.label}
                  <button
                    type="button"
                    aria-label={labels.remove(f.label)}
                    onClick={f.onRemove}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-ink-muted hover:bg-surface-selected hover:text-ink"
                  >
                    <X aria-hidden size={12} strokeWidth={1.8} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {onClear && (
            <Button variant="link" onClick={onClear}>
              {labels.clear}
            </Button>
          )}
          {quick && <div className="ml-auto">{quick}</div>}
        </div>
      )}
      {footer}
    </div>
  );
}
