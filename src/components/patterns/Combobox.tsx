/**
 * Combobox (pilih satu dengan pencarian) dan MultiSelect (pilih banyak dengan chip) — NON-DS (DS_GAPS.md).
 * DS Select menyebut "lebih dari 15 opsi: gunakan pencarian"; Figma 51:827 (Organisasi: cari, "Data tidak ditemukan")
 * dan 213:402 (Role/Wilayah Kerja: chip, radius penuh). Pola ARIA combobox + listbox; panah atas/bawah, Enter, Esc.
 */
import { Check, ChevronDown, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Option {
  value: string;
  label: string;
}

interface FieldShellProps {
  id: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}

function FieldShell({ id, label, required, hint, error, children, className }: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label id={`${id}-label`} htmlFor={id} className="text-label text-ink-muted">
        {label}
        {required && (
          <span aria-hidden className="ml-1 text-error-ink">
            *
          </span>
        )}
      </label>
      {children}
      {(error || hint) && (
        <p id={`${id}-hint`} className={cn('text-caption', error ? 'text-error-ink' : 'text-ink-subtle')} aria-live={error ? 'polite' : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

function useListNav(count: number, open: boolean) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (open) setActive(0);
  }, [open, count]);
  return { active, setActive };
}

const triggerCls = (error?: ReactNode, disabled?: boolean) =>
  cn(
    'flex min-h-control-md w-full items-center gap-2 rounded-md border bg-surface px-3 py-1 text-left text-body-dense text-ink',
    'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring',
    error ? 'border-error-ink' : 'border-border-control',
    disabled && 'cursor-not-allowed bg-surface-sunken opacity-60',
  );

const listCls = 'absolute left-0 right-0 top-full z-50 mt-1 max-h-[280px] overflow-y-auto rounded-md border border-border bg-surface py-1 shadow-overlay';

/* ---------- Combobox ---------- */

export interface ComboboxProps {
  label: ReactNode;
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Teks saat pencarian tidak menemukan apa pun, mis. "Data tidak ditemukan". */
  emptyText: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Combobox({ label, options, value, onChange, placeholder, emptyText, required, hint, error, disabled, className }: ComboboxProps) {
  const id = useId();
  const listId = `${id}-list`;
  const selected = options.find((o) => o.value === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query],
  );
  const { active, setActive } = useListNav(filtered.length, open);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !wrapRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function choose(o: Option) {
    onChange(o.value);
    setQuery('');
    setOpen(false);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      const o = filtered[active];
      if (o) choose(o);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  }

  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <div ref={wrapRef} className="relative">
        <div className={triggerCls(error, disabled)}>
          <input
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && filtered[active] ? `${listId}-${active}` : undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? `${id}-hint` : undefined}
            disabled={disabled}
            value={open ? query : (selected?.label ?? '')}
            placeholder={selected ? selected.label : placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onKeyDown={onKey}
            className="h-8 min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink-subtle disabled:cursor-not-allowed"
          />
          <ChevronDown aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-ink-muted" />
        </div>
        {open && !disabled && (
          <ul id={listId} role="listbox" aria-labelledby={`${id}-label`} className={listCls}>
            {filtered.length === 0 ? (
              <li role="option" aria-disabled aria-selected={false} className="px-3 py-2 text-body-dense text-ink-subtle">
                {emptyText}
              </li>
            ) : (
              filtered.map((o, i) => (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(o)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    'flex min-h-[38px] cursor-default items-center justify-between px-3 py-2 text-body-dense text-ink',
                    i === active && 'bg-surface-sunken',
                  )}
                >
                  {o.label}
                  {o.value === value && <Check aria-hidden size={16} strokeWidth={1.8} />}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </FieldShell>
  );
}

/* ---------- MultiSelect ---------- */

export interface MultiSelectProps {
  label: ReactNode;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  /** Teks saat tidak ada opsi. */
  emptyText: string;
  /** Label aksesibel tombol hapus chip: `${removeLabel} ${label}`. */
  removeLabel: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  emptyText,
  removeLabel,
  required,
  hint,
  error,
  disabled,
  className,
}: MultiSelectProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const { active, setActive } = useListNav(options.length, open);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !wrapRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const selected = options.filter((o) => value.includes(o.value));

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if ((e.key === 'Enter' || e.key === ' ') && open) {
      e.preventDefault();
      const o = options[active];
      if (o) toggle(o.value);
    } else if (e.key === 'Escape') setOpen(false);
  }

  return (
    <FieldShell id={id} label={label} required={required} hint={hint} error={error} className={className}>
      <div ref={wrapRef} className="relative">
        <div className={triggerCls(error, disabled)}>
          <div className="flex min-w-0 flex-1 flex-wrap gap-2 py-1">
            {selected.map((o) => (
              <span key={o.value} className="inline-flex items-center gap-1 rounded-full border border-border-control bg-surface-sunken px-2 py-0.5 text-body-dense">
                {o.label}
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`${removeLabel} ${o.label}`}
                    onClick={() => toggle(o.value)}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
                  >
                    <X aria-hidden size={10} strokeWidth={2} />
                  </button>
                )}
              </span>
            ))}
            <button
              id={id}
              type="button"
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-haspopup="listbox"
              aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
              aria-invalid={error ? true : undefined}
              aria-describedby={error || hint ? `${id}-hint` : undefined}
              disabled={disabled}
              onClick={() => setOpen((o) => !o)}
              onKeyDown={onKey}
              className="h-6 min-w-[80px] flex-1 text-left text-body-dense text-ink-subtle outline-none disabled:cursor-not-allowed"
            >
              {selected.length === 0 ? placeholder : ''}
            </button>
          </div>
          <ChevronDown aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-ink-muted" />
        </div>
        {open && !disabled && (
          <ul id={listId} role="listbox" aria-multiselectable aria-labelledby={`${id}-label`} className={listCls}>
            {options.length === 0 ? (
              <li role="option" aria-disabled aria-selected={false} className="px-3 py-2 text-body-dense text-ink-subtle">
                {emptyText}
              </li>
            ) : (
              options.map((o, i) => (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={value.includes(o.value)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(o.value)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    'flex min-h-[38px] cursor-default items-center justify-between px-3 py-2 text-body-dense text-ink',
                    i === active && 'bg-surface-sunken',
                  )}
                >
                  {o.label}
                  {value.includes(o.value) && <Check aria-hidden size={16} strokeWidth={1.8} />}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </FieldShell>
  );
}
