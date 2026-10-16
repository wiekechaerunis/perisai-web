/**
 * Button — PERISAI DS v2 · Lime `Button`.
 * - primary: `action` (lime) + `on-action`; hover `action-hover` + garis bawah 2px `action-line`. Satu per layar
 *   (bar aksi form dan dialog punya primernya sendiri).
 * - secondary: `surface` + garis dalam 1px `border-control`; hover `surface-subtle` + garis `ink`.
 * - subtle: `surface-sunken` (aksi ringan). quiet: tanpa latar (tombol ikon ghost, "Filter lainnya").
 * - destructive: `action-danger` HANYA di ConfirmDialog. link / link-danger: teks 600 tanpa garis bawah (link aksi berdiri
 *   sendiri); danger `error-ink`. Link di dalam kalimat memakai kelas `link-inline`.
 * Tinggi 40px (sm 36px toolbar/panel, lg 48px layar publik), `radius-md`, 13px/600. Nonaktif 45%. Tekan mengecil 97%
 * (gerak 120ms, mati saat prefers-reduced-motion).
 */
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap ' +
    'transition-[background-color,box-shadow,color,transform,opacity] duration-fast ease-in-out ' +
    'disabled:cursor-not-allowed disabled:opacity-[.45] ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
  {
    variants: {
      variant: {
        primary:
          'bg-action text-on-action enabled:hover:bg-action-hover enabled:hover:shadow-[0_2px_0_0_var(--color-action-line)] enabled:active:scale-[.97]',
        secondary:
          'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-border-control)] enabled:hover:bg-surface-subtle enabled:hover:shadow-[inset_0_0_0_1px_var(--color-ink)] enabled:active:scale-[.97]',
        subtle: 'bg-surface-sunken text-ink enabled:hover:bg-border enabled:active:scale-[.97]',
        quiet: 'bg-transparent text-ink enabled:hover:bg-surface-sunken enabled:active:scale-[.97]',
        destructive: 'bg-action-danger text-on-action-danger enabled:hover:brightness-90 enabled:active:scale-[.97]',
        // Link aksi berdiri sendiri: tanpa garis bawah (README Tipografi DS v2); garis tipis muncul saat hover.
        link: 'min-h-6 min-w-6 text-body font-semibold text-ink decoration-border-control underline-offset-[3px] hover:underline',
        'link-danger': 'min-h-6 min-w-6 text-body font-semibold text-error-ink underline-offset-[3px] hover:underline',
      },
      // Ukuran hanya berlaku untuk tombol berbentuk kotak; link mengikuti tinggi teks (area klik min 24px).
      size: { sm: '', md: '', lg: '' },
      block: { true: 'w-full', false: '' },
    },
    compoundVariants: [
      { variant: ['primary', 'secondary', 'subtle', 'quiet', 'destructive'], size: 'sm', class: 'h-control-sm px-3 text-body' },
      { variant: ['primary', 'secondary', 'subtle', 'quiet', 'destructive'], size: 'md', class: 'h-control-height px-4 text-body' },
      { variant: ['primary', 'secondary', 'subtle', 'quiet', 'destructive'], size: 'lg', class: 'h-control-lg px-5 text-lead' },
    ],
    defaultVariants: { variant: 'secondary', size: 'md', block: false },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Menampilkan indikator proses dan menonaktifkan tombol agar tidak terkirim ganda. */
  loading?: boolean;
  /** Teks pengganti selama loading, mis. "Memproses…". Default: label tetap. */
  loadingLabel?: ReactNode;
  /** Ikon di kiri label (Lucide, 16px). Tombol ikon saja wajib memberi `aria-label`. */
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, block, loading = false, loadingLabel, icon, disabled, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={2} /> : icon}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
});

export { buttonVariants };
