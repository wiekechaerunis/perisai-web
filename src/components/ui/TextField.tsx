/**
 * TextField — PERISAI Design System `Perisai.TextField` (Form).
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
  /** md = control-md 36px (default), lg = control-lg 44px (aksi utama / kode verifikasi). */
  size?: 'md' | 'lg';
  /** Elemen di kanan dalam field (selain tombol mata). */
  trailing?: ReactNode;
  /** Tampilkan tanda * pada field wajib (Figma modal Undang pengguna). */
  showRequired?: boolean;
  /** Sembunyikan label secara visual tetapi tetap tersedia untuk pembaca layar. */
  hideLabel?: boolean;
  containerClassName?: string;
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
    <div className={cn('flex flex-col gap-1', containerClassName)}>
      <label htmlFor={inputId} className={cn('text-label text-ink-muted', hideLabel && 'sr-only')}>
        {label}
        {rest.required && showRequired && (
          <span aria-hidden className="ml-1 text-error-ink">
            *
          </span>
        )}
      </label>
      <div className="relative">
        {leading && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-subtle">
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
            'w-full rounded-md border bg-surface px-3 text-body text-ink',
            size === 'lg' ? 'h-control-lg' : 'h-control-md',
            leading ? 'pl-10' : '',
            'placeholder:text-ink-subtle disabled:cursor-not-allowed disabled:bg-surface-sunken',
            'read-only:bg-surface-sunken read-only:border-border',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
            error ? 'border-error-ink' : 'border-border-control',
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
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
              >
                {revealed ? <EyeOff size={16} strokeWidth={1.8} aria-hidden /> : <Eye size={16} strokeWidth={1.8} aria-hidden />}
              </button>
            )}
          </div>
        )}
      </div>
      {(error || hint) && (
        <p
          id={hintId}
          className={cn('text-caption', error ? 'text-error-ink' : 'text-ink-subtle')}
          aria-live={error ? 'polite' : undefined}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
