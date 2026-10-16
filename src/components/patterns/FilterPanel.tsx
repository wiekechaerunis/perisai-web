/**
 * FilterPanel + AppliedFilters + ChipGroup — PERISAI DS v2 · Lime pola filter tabel.
 *
 * FilterPanel: semua filter tabel ada di panel, bukan berjajar di toolbar. Popover 360px (`popover-width`) rata kanan
 * pada tombol Filter (badge jumlah filter aktif), untuk ≤ 6 isian. Isi dikelompokkan dengan legend `label`.
 * Filter TIDAK langsung berlaku: pemakai mengisi draf; kaki berisi link "Atur ulang" (kiri) dan primer
 * "Terapkan · n {entitas}" (kanan, pratinjau jumlah). Esc/✕/klik di luar membuang perubahan yang belum diterapkan.
 *
 * AppliedFilters: baris di bawah toolbar, hanya bila ≥ 1 filter aktif. Pil 28px `radius-pill` `action-subtle-*`,
 * "Label: **nilai** ✕"; ✕ langsung mencabut filter (✕ berputar 90° saat hover). Maks. 5 pil, sisanya "+n filter lainnya".
 * Pencarian teks dan filter bawaan tidak menjadi pil. Lalu link "Hapus filter".
 *
 * ChipGroup: enum ≤ 5 opsi sebagai chip pilih 32px (`surface-sunken`; aktif `action` + `on-action` 700).
 * Komponen tidak tahu modul; teks lewat props.
 */
import * as RadixDialog from '@radix-ui/react-dialog';
import * as RadixPopover from '@radix-ui/react-popover';
import { SlidersHorizontal, X } from 'lucide-react';
import { forwardRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '../ui/Button';

/* ---------- FilterPanel ---------- */

export interface FilterPanelProps<T> {
  /** Nilai filter yang sedang berlaku. */
  value: T;
  /** Dipanggil saat "Terapkan" ditekan. */
  onApply: (next: T) => void;
  /** Nilai kosong untuk "Atur ulang". */
  emptyValue: T;
  /** Jumlah filter aktif (badge tombol). */
  activeCount: number;
  /** Isi panel: menerima draf dan pengubahnya. */
  children: (draft: T, setDraft: (next: T) => void) => ReactNode;
  /** Label tombol terapkan untuk draf (mis. "Terapkan · 12 pengguna"). */
  applyLabel: (draft: T) => string;
  labels: { trigger: string; title: string; close: string; reset: string };
  /** Rata panel terhadap tombol (bawaan kanan). */
  align?: 'start' | 'end';
  /** Draf berubah (null = panel ditutup) — untuk pratinjau jumlah hasil. */
  onDraftChange?: (draft: T | null) => void;
  /** popover 360px (≤ 6 isian, bawaan) atau panel kanan 480px (> 6 isian / rentang tanggal). */
  variant?: 'popover' | 'panel';
  /** Kendali buka/tutup dari luar (mis. tombol "Pilih filter" di EmptyState Jejak audit). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FilterPanel<T>({
  value,
  onApply,
  emptyValue,
  activeCount,
  children,
  applyLabel,
  labels,
  align = 'end',
  onDraftChange,
  variant = 'popover',
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: FilterPanelProps<T>) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (o: boolean) => {
    setOpenState(o);
    onOpenChangeProp?.(o);
  };
  const [draft, setDraftState] = useState<T>(value);
  const setDraft = (next: T) => {
    setDraftState(next);
    onDraftChange?.(next);
  };
  const onOpenChange = (o: boolean) => {
    // Membuka = mulai dari nilai yang berlaku; menutup tanpa Terapkan = buang draf.
    if (o) setDraft(value);
    else onDraftChange?.(null);
    setOpen(o);
  };
  // Dibuka dari luar: mulai dari nilai yang berlaku.
  const [seen, setSeen] = useState(open);
  if (open !== seen) {
    setSeen(open);
    if (open) setDraftState(value);
  }
  const head = (Close: typeof RadixPopover.Close | typeof RadixDialog.Close, Title: 'p' | typeof RadixDialog.Title) => (
    <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-[14px] py-3">
      <Title className="text-lead font-bold text-ink">{labels.title}</Title>
      <Close
        aria-label={labels.close}
        className="flex h-[28px] w-[28px] items-center justify-center rounded-md text-ink transition-colors duration-fast hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
      >
        <X aria-hidden size={14} strokeWidth={2} />
      </Close>
    </div>
  );
  const foot = (
    <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-3 py-[10px]">
      <Button variant="link" onClick={() => setDraft(emptyValue)}>
        {labels.reset}
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          onApply(draft);
          onOpenChange(false);
        }}
      >
        {applyLabel(draft)}
      </Button>
    </div>
  );
  const trigger = <FilterButton label={labels.trigger} count={activeCount} />;

  if (variant === 'panel') {
    // > 6 isian atau ada rentang tanggal → SidePanel 480px (DS v2 FilterPanel).
    return (
      <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
        <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-40 animate-fade-in bg-scrim" />
          <RadixDialog.Content
            aria-describedby={undefined}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-[min(var(--sidepanel-width),100vw)] animate-fade-in flex-col bg-surface shadow-floating focus-visible:outline-none"
          >
            {head(RadixDialog.Close, RadixDialog.Title)}
            <div className="p-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">{children(draft, setDraft)}</div>
            {foot}
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    );
  }

  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          align={align}
          sideOffset={6}
          aria-label={labels.title}
          className="z-50 flex w-[min(var(--popover-width),calc(100vw-32px))] animate-pop-in flex-col rounded-xl bg-surface shadow-overlay focus-visible:outline-none"
        >
          {head(RadixPopover.Close, 'p')}
          <div className="p-scroll flex max-h-[min(60vh,480px)] flex-col gap-4 overflow-y-auto px-4 py-[14px]">{children(draft, setDraft)}</div>
          {foot}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

/** Kelompok isian di panel filter: legend `label` + isi. */
export function FilterGroup({ legend, children }: { legend: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-label text-ink-muted">{legend}</legend>
      {children}
    </fieldset>
  );
}

/** Tombol "Filter" 36px; bila ada filter aktif: latar `action-subtle-bg`, garis `action-line`, badge jumlah `ink`. */
export const FilterButton = forwardRef<
  HTMLButtonElement,
  { label: string; count: number } & ButtonHTMLAttributes<HTMLButtonElement>
>(function FilterButton({ label, count, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={cn(
        'inline-flex h-control-sm items-center gap-[6px] rounded-md px-3 text-body font-semibold text-ink transition-[background-color,box-shadow,transform] duration-fast active:scale-[.97]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
        count > 0
          ? 'bg-action-subtle-bg shadow-[inset_0_0_0_1.5px_var(--color-action-line)]'
          : 'bg-surface shadow-[inset_0_0_0_1px_var(--color-border-control)] hover:bg-surface-subtle hover:shadow-[inset_0_0_0_1px_var(--color-ink)]',
      )}
    >
      <SlidersHorizontal aria-hidden size={16} strokeWidth={2} />
      {label}
      {count > 0 && (
        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] bg-ink px-[5px] text-[11px] font-bold text-surface">
          {count}
        </span>
      )}
    </button>
  );
});

/* ---------- AppliedFilters ---------- */

export interface AppliedFilter {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export interface AppliedFiltersProps {
  filters: AppliedFilter[];
  onClear: () => void;
  labels: {
    region: string;
    clear: string;
    remove: (label: string, value: string) => string;
    more: (n: number) => string;
  };
}

export function AppliedFilters({ filters, onClear, labels }: AppliedFiltersProps) {
  if (filters.length === 0) return null;
  const shown = filters.slice(0, 5);
  const rest = filters.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
      <ul aria-label={labels.region} className="flex flex-wrap items-center gap-2">
        {shown.map((f) => (
          <li key={f.key}>
            <button
              type="button"
              aria-label={labels.remove(f.label, f.value)}
              onClick={f.onRemove}
              className="group/pill inline-flex h-[28px] items-center gap-[6px] rounded-pill bg-action-subtle-bg pl-[10px] pr-2 text-caption text-action-subtle-ink transition-shadow duration-fast hover:shadow-[inset_0_0_0_1px_var(--color-action-line)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <span>
                {f.label}: <b className="font-semibold">{f.value}</b>
              </span>
              <X
                aria-hidden
                size={11}
                strokeWidth={2}
                className="transition-transform duration-appear group-hover/pill:rotate-90"
              />
            </button>
          </li>
        ))}
        {rest > 0 && (
          <li className="inline-flex h-[28px] items-center rounded-pill bg-surface-sunken px-[10px] text-caption font-semibold text-ink">
            {labels.more(rest)}
          </li>
        )}
      </ul>
      <Button variant="link" className="text-caption" onClick={onClear}>
        {labels.clear}
      </Button>
    </div>
  );
}

/* ---------- ChipGroup ---------- */

export interface ChipOption {
  value: string;
  label: ReactNode;
  /** Titik severitas (warna CSS var) — hanya untuk chip level. */
  dot?: string;
}

export interface ChipGroupProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}

export function ChipGroup({ options, value, onChange, label }: ChipGroupProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-[6px]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-8 items-center gap-[6px] rounded-md px-3 text-body transition-[background-color,transform] duration-fast active:scale-[.97]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
              on
                ? 'bg-action font-bold text-on-action hover:bg-action-hover'
                : 'bg-surface-sunken font-semibold text-ink hover:bg-border',
            )}
          >
            {o.dot && (
              <span
                aria-hidden
                className="h-[7px] w-[7px] rounded-[4px]"
                style={{ background: o.dot }}
              />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
