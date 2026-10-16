/**
 * TextField — PERISAI DS v2 · Lime `TextField`.
 * Label 12/16 600 `ink` (+ `*` `error-ink`) → kotak 40px (48px layar publik) `radius-md` bergaris dalam 1px
 * `border-control`; hover garis `ink`; fokus garis 2px `action-line`; error garis 2px `error-ink` + pesan; baca saja
 * `surface-subtle` + garis `border`; nonaktif `surface-sunken` + `ink-disabled`.
 * Label selalu terlihat (sentence case), petunjuk di bawah, error memakai `error-ink`
 * dan diumumkan ke pembaca layar. Mendukung:
 * - `type="password"` + `revealable`: toggle tampil/sembunyikan (default tersembunyi)
 * - mode kode verifikasi: `inputMode="numeric"`, `autoComplete="one-time-code"`, `digitsOnly`
 */
import { Eye, EyeOff } from 'lucide-react';
import {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: ReactNode;
  /** Petunjuk format di bawah field. */
  hint?: ReactNode;
  /** Pesan error (menyebut cara memperbaiki). Menggantikan petunjuk. */
  error?: ReactNode;
  /** Hanya untuk `type="password"`: tampilkan tombol mata. */
  revealable?: boolean;
  /** Label aksesibel tombol mata (teks disediakan pemakai). */
  revealLabels?: { show: string; hide: string };
  /** Saring karakter non-angka saat mengetik dan menempel (FR-LG-16). */
  digitsOnly?: boolean;
  /** Ikon di kiri dalam field (Lucide 16px, dekoratif), mis. mail/lock di layar Login Figma. */
  leading?: ReactNode;
  /** md = control-height 40px (default), lg = control-lg 48px (layar publik). */
  size?: 'md' | 'lg';
  /** Elemen di kanan dalam field (selain tombol mata). */
  trailing?: ReactNode;
  /** Tampilkan tanda * pada field wajib (Figma modal Undang pengguna). */
  showRequired?: boolean;
  /** Sembunyikan label secara visual tetapi tetap tersedia untuk pembaca layar. */
  hideLabel?: boolean;
  containerClassName?: string;
}

/** Kelas state kotak isian DS v2 (dipakai juga oleh Select, Textarea, Combobox, ChipInput). */
export function inputStateClass({ error, disabled, readOnly }: { error?: boolean; disabled?: boolean; readOnly?: boolean }): string {
  if (disabled) return 'cursor-not-allowed bg-surface-sunken text-ink-disabled shadow-[inset_0_0_0_1px_var(--color-border)]';
  if (readOnly) return 'bg-surface-subtle text-ink shadow-[inset_0_0_0_1px_var(--color-border)]';
  if (error) return 'bg-surface text-ink shadow-[inset_0_0_0_2px_var(--color-error-ink)]';
  return 'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-border-control)] hover:shadow-[inset_0_0_0_1px_var(--color-ink)] focus:shadow-[inset_0_0_0_2px_var(--color-action-line)] focus-within:shadow-[inset_0_0_0_2px_var(--color-action-line)]';
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    hint,
    error,
    revealable = false,
    revealLabels = { show: 'Tampilkan', hide: 'Sembunyikan' },
    digitsOnly = false,
    trailing,
    leading,
    size = 'md',
    hideLabel = false,
    showRequired = false,
    id,
    type = 'text',
    className,
    containerClassName,
    onChange,
    disabled,
    readOnly,
    'aria-describedby': extraDescribedBy,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = `${inputId}-hint`;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword && revealable && revealed ? 'text' : type;
  const describedBy = [error || hint ? hintId : null, extraDescribedBy].filter(Boolean).join(' ') || undefined;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    if (digitsOnly) {
      const cleaned = e.target.value.replace(/\D+/g, '');
      if (cleaned !== e.target.value) e.target.value = cleaned;
    }
    onChange?.(e);
  }

  return (
    <div className={cn('flex flex-col gap-[6px]', containerClassName)}>
      <label htmlFor={inputId} className={cn('text-label text-ink', hideLabel && 'sr-only')}>
        {label}
        {rest.required && showRequired && (
          <span aria-hidden className="ml-1 text-error-ink">
            *
          </span>
        )}
      </label>
      <div className="relative">
        {leading && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          readOnly={readOnly}
          onChange={handleChange}
          className={cn(
            'w-full rounded-md border-0 px-3 outline-none transition-shadow duration-fast placeholder:text-ink-muted',
            size === 'lg' ? 'h-control-lg text-lead' : 'h-control-height text-body',
            leading ? 'pl-10' : '',
            inputStateClass({ error: !!error, disabled, readOnly }),
            (revealable && isPassword) || trailing ? 'pr-10' : '',
            digitsOnly && 'font-mono tracking-[0.3em]',
            className,
          )}
          {...rest}
        />
        {(trailing || (revealable && isPassword)) && (
          <div className="absolute inset-y-0 right-1 flex items-center">
            {trailing}
            {revealable && isPassword && (
              <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                disabled={disabled}
                aria-label={revealed ? revealLabels.hide : revealLabels.show}
                aria-pressed={revealed}
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted transition-colors duration-fast hover:bg-surface-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
              >
                {revealed ? <EyeOff size={18} strokeWidth={1.9} aria-hidden /> : <Eye size={18} strokeWidth={1.9} aria-hidden />}
              </button>
            )}
          </div>
        )}
      </div>
      {(error || hint) && (
        <p
          id={hintId}
          className={cn('text-caption', error ? 'font-medium text-error-ink' : 'text-ink-muted')}
          aria-live={error ? 'polite' : undefined}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
