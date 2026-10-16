/**
 * OtpField — PERISAI DS v2 · Lime `OtpField`. Label → 6 sel 52px (Plex Mono 22px, jarak 8px) → baris bantuan/error.
 * Secara teknis SATU `<input>` (`inputmode="numeric"`, `autocomplete="one-time-code"`, `maxlength`, `pattern="[0-9]*"`);
 * sel hanya tampilan. Ini menjaga tempel kode, isi otomatis, dan pembaca layar. Hanya angka diterima; tempel
 * "482 913" / "482-913" dibersihkan. Sel aktif: garis 2px `action-line` + kursor. Error: semua sel bergaris `error-ink`.
 * Nonaktif (kedaluwarsa): sel `surface-sunken`. Tidak mengirim otomatis saat digit terakhir terisi.
 */
import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface OtpFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'> {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: ReactNode;
  hint?: ReactNode;
}

export const OtpField = forwardRef<HTMLInputElement, OtpFieldProps>(function OtpField(
  { label, value, onChange, length = 6, error, hint, disabled, id, className, onFocus, onBlur, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const [focused, setFocused] = useState(false);
  const cells = Array.from({ length }, (_, i) => value[i] ?? '');
  const cur = Math.min(value.length, length - 1);
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={inputId} className="text-label text-ink">
        {label}
      </label>
      <div className="relative">
        <div aria-hidden className="grid gap-2" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}>
          {cells.map((d, i) => {
            const active = focused && !disabled && i === cur && !error;
            return (
              <span
                key={i}
                className={cn(
                  'flex h-[52px] items-center justify-center rounded-md font-mono text-[22px] font-medium transition-shadow duration-fast',
                  disabled
                    ? 'bg-surface-sunken text-ink-disabled shadow-[inset_0_0_0_1px_var(--color-border)]'
                    : error
                      ? 'bg-surface text-ink shadow-[inset_0_0_0_2px_var(--color-error-ink)]'
                      : active
                        ? 'bg-surface text-ink shadow-[inset_0_0_0_2px_var(--color-action-line)]'
                        : 'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-border-control)]',
                )}
              >
                {d || (active ? <span className="h-[22px] w-[1.5px] animate-pulse bg-ink" /> : null)}
              </span>
            );
          })}
        </div>
        <input
          ref={ref}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={length}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? hintId : undefined}
          onChange={(e) => onChange(e.target.value.replace(/\D+/g, '').slice(0, length))}
          onFocus={(e) => (setFocused(true), onFocus?.(e))}
          onBlur={(e) => (setFocused(false), onBlur?.(e))}
          className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none"
          {...rest}
        />
      </div>
      {(error || hint) && (
        <p id={hintId} aria-live={error ? 'polite' : undefined} className={cn('text-caption', error ? 'font-medium text-error-ink' : 'text-ink-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
