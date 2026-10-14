/**
 * Textarea — perluasan TextField untuk teks beberapa baris (NON-DS, DS_GAPS.md).
 * Dipakai untuk penjelasan alasan "Lainnya" (maks 200 karakter; FR-BU-08, FR-SA-10, FR-LO-16) dengan penghitung.
 */
import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Tampilkan penghitung "n/maxLength". */
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, showCount, id, className, maxLength, value, required, ...rest },
  ref,
) {
  const autoId = useId();
  const tid = id ?? autoId;
  const len = typeof value === 'string' ? value.length : 0;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={tid} className="text-label text-ink-muted">
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
        aria-describedby={error || hint ? `${tid}-hint` : undefined}
        rows={3}
        className={cn(
          'w-full resize-y rounded-md border bg-surface px-3 py-2 text-body text-ink placeholder:text-ink-subtle',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
          error ? 'border-error-ink' : 'border-border-control',
          className,
        )}
        {...rest}
      />
      <div className="flex justify-between gap-4">
        <p id={`${tid}-hint`} className={cn('text-caption', error ? 'text-error-ink' : 'text-ink-subtle')} aria-live={error ? 'polite' : undefined}>
          {error ?? hint}
        </p>
        {showCount && maxLength && (
          <span className="font-mono text-caption text-ink-subtle">
            {len}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
});
