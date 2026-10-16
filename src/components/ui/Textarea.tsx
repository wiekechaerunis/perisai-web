/**
 * Textarea — PERISAI DS v2 · Lime `Textarea`: tinggi awal 96px, bertambah mengikuti isi sampai 240px lalu bergulir;
 * penghitung "104/1.000" 12px di kanan bawah, jadi `ink` tebal saat penuh (teks bantu diganti `limitLabel`). Batas keras
 * lewat `maxLength`; penghitung diumumkan hanya saat sisa ≤ 20 karakter. State lain sama dengan TextField.
 * Dipakai untuk penjelasan alasan "Lainnya" (maks 200 karakter; FR-BU-08, FR-SA-10, FR-LO-16) dengan penghitung.
 */
import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { inputStateClass } from './TextField';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Tampilkan penghitung "n/maxLength". */
  showCount?: boolean;
  /** Teks bantu saat batas tercapai, mis. (n) => `Batas ${n} karakter tercapai.` */
  limitLabel?: (max: number) => string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, showCount, limitLabel, id, className, maxLength, value, required, onInput, ...rest },
  ref,
) {
  const autoId = useId();
  const tid = id ?? autoId;
  const len = typeof value === 'string' ? value.length : 0;
  const full = !!maxLength && len >= maxLength;
  const near = !!maxLength && maxLength - len <= 20;
  const help = error ?? (full && limitLabel ? limitLabel(maxLength!) : hint);
  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={tid} className="text-label text-ink">
        {label}
        {required && (
          <span aria-hidden className="ml-1 text-error-ink">
            *
          </span>
        )}
      </label>
      <textarea
        ref={ref}
        id={tid}
        value={value}
        maxLength={maxLength}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={help ? `${tid}-hint` : undefined}
        rows={4}
        onInput={(e) => {
          // Tinggi mengikuti isi sampai 240px, lalu bergulir.
          const el = e.currentTarget;
          el.style.height = 'auto';
          el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
          onInput?.(e);
        }}
        className={cn(
          'max-h-[240px] min-h-[96px] w-full resize-none rounded-md border-0 px-3 py-[10px] text-body outline-none transition-shadow duration-fast placeholder:text-ink-muted',
          inputStateClass({ error: !!error, disabled: rest.disabled, readOnly: rest.readOnly }),
          className,
        )}
        {...rest}
      />
      <div className="flex justify-between gap-4">
        <p id={`${tid}-hint`} className={cn('text-caption', error ? 'font-medium text-error-ink' : 'text-ink-muted')} aria-live={error ? 'polite' : undefined}>
          {help}
        </p>
        {showCount && maxLength && (
          <span aria-live={near ? 'polite' : undefined} className={cn('shrink-0 text-caption tabular-nums', full ? 'font-semibold text-ink' : 'text-ink-muted')}>
            {len}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
});
