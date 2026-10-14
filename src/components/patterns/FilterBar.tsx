/**
 * FilterBar — kartu filter dengan satu baris utama dan filter tambahan yang dapat dibuka/ditutup (komponen non-DS,
 * dicatat di DS_GAPS). Baris utama: field paling sering dipakai (pencarian, periode) + tombol "Filter lainnya (n)" +
 * aksi. Filter tambahan terbuka otomatis bila ada yang aktif saat halaman dibuka. Teks lewat props.
 */
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Button } from '../ui/Button';

export interface FilterBarProps {
  /** Field utama (mis. pencarian dan periode). */
  primary: ReactNode;
  /** Filter tambahan yang dapat dilipat. */
  advanced?: ReactNode;
  /** Jumlah filter tambahan yang sedang aktif (ditampilkan di tombol). */
  activeCount: number;
  /** Aksi di ujung baris utama (mis. Tampilkan, Atur ulang filter). */
  actions?: ReactNode;
  /** Catatan di bawah filter (mis. keterangan filter cepat aktif). */
  footer?: ReactNode;
  labels: { more: (n: number) => string; less: string };
}

export function FilterBar({ primary, advanced, activeCount, actions, footer, labels }: FilterBarProps) {
  const id = useId();
  const [open, setOpen] = useState(activeCount > 0);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        {primary}
        {advanced && (
          <Button
            aria-expanded={open}
            aria-controls={id}
            icon={<SlidersHorizontal aria-hidden size={14} strokeWidth={1.8} />}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="flex items-center gap-1">
              {open ? labels.less : labels.more(activeCount)}
              {open ? <ChevronUp aria-hidden size={14} strokeWidth={1.8} /> : <ChevronDown aria-hidden size={14} strokeWidth={1.8} />}
            </span>
          </Button>
        )}
        {actions}
      </div>
      {advanced && open && (
        <div id={id} className="flex flex-wrap items-end gap-2 border-t border-border-subtle pt-3">
          {advanced}
        </div>
      )}
      {footer}
    </div>
  );
}
