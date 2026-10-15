/**
 * ChipInput — isian banyak nilai sebagai chip yang divalidasi satu per satu (komponen non-DS, dicatat di DS_GAPS).
 * Dibutuhkan PRD Kelola Organisasi KKKS (Design Brief B3): chip ditambah dengan Enter atau koma; tiga keadaan chip:
 * normal, error (pesan error form), dan peringatan (warna caution). Teks dan validasi diberikan pemakai lewat props.
 */
import { X } from 'lucide-react';
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface ChipItem {
  value: string;
  tone?: 'normal' | 'error' | 'warning';
  /** Pesan untuk chip error/peringatan (tampil di bawah isian). */
  message?: string;
}

export interface ChipInputProps {
  label: ReactNode;
  chips: ChipItem[];
  /** Dipanggil saat pengguna menekan Enter, koma, atau meninggalkan isian dengan teks. */
  onAdd: (raw: string) => void;
  onRemove: (value: string) => void;
  /** Label aksesibel tombol hapus chip: `${removeLabel} ${value}`. */
  removeLabel: string;
  placeholder?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  showRequired?: boolean;
  disabled?: boolean;
  /** Nilai teknis (domain, kode) memakai huruf mono (DS). */
  mono?: boolean;
  className?: string;
}

export function ChipInput({ label, chips, onAdd, onRemove, removeLabel, placeholder, hint, error, required, showRequired, disabled, mono, className }: ChipInputProps) {
  const id = useId();
  const [text, setText] = useState('');
  const describedId = `${id}-desc`;
  const notes = chips.filter((c) => c.message && c.tone && c.tone !== 'normal');

  function commit() {
    const raw = text.trim().replace(/,$/, '');
    if (raw) onAdd(raw);
    setText('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && !text && chips.length) {
      onRemove(chips[chips.length - 1]!.value);
    }
  }

  const hasError = !!error || chips.some((c) => c.tone === 'error');

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-label text-ink-muted">
        {label}
        {required && showRequired && (
          <span aria-hidden className="ml-1 text-error-ink">
            *
          </span>
        )}
      </label>
      <div
        className={cn(
          'flex min-h-control-md flex-wrap items-center gap-2 rounded-md border bg-surface px-3 py-2',
          'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring',
          hasError ? 'border-error-ink' : 'border-border-control',
          disabled && 'cursor-not-allowed bg-surface-sunken',
        )}
      >
        <ul className="contents">
          {chips.map((c) => (
            <li
              key={c.value}
              className={cn(
                'flex items-center gap-[6px] rounded-full border px-2 py-1 text-[13px] font-medium',
                mono && 'font-mono',
                c.tone === 'error' && 'border-error-ink text-error-ink',
                c.tone === 'warning' && 'border-caution bg-caution-bg text-caution-ink',
                (!c.tone || c.tone === 'normal') && 'border-border bg-surface-sunken text-ink',
              )}
            >
              {c.value}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onRemove(c.value)}
                aria-label={`${removeLabel} ${c.value}`}
                className="rounded-full p-0.5 text-current hover:bg-surface-selected focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
              >
                <X aria-hidden size={12} strokeWidth={1.8} />
              </button>
            </li>
          ))}
        </ul>
        <input
          id={id}
          value={text}
          disabled={disabled}
          placeholder={chips.length ? undefined : placeholder}
          aria-invalid={hasError || undefined}
          aria-describedby={describedId}
          onChange={(e) => {
            const v = e.target.value;
            if (v.endsWith(',')) {
              setText(v);
              const raw = v.slice(0, -1).trim();
              if (raw) onAdd(raw);
              setText('');
            } else setText(v);
          }}
          onKeyDown={onKeyDown}
          onBlur={commit}
          className={cn('h-8 min-w-[160px] flex-1 bg-transparent px-1 text-body text-ink outline-none placeholder:text-ink-subtle', mono && 'font-mono')}
        />
      </div>
      <div id={describedId} aria-live="polite" className="flex flex-col gap-0.5">
        {notes.map((c) => (
          <p key={c.value} className={cn('text-caption', c.tone === 'error' ? 'text-error-ink' : 'text-caution-ink')}>
            <span className="font-mono">{c.value}</span>: {c.message}
          </p>
        ))}
        {error ? <p className="text-caption text-error-ink">{error}</p> : hint ? <p className="text-caption text-ink-subtle">{hint}</p> : null}
      </div>
    </div>
  );
}
