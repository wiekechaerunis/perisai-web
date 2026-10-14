/**
 * Button — PERISAI Design System `Perisai.Button` (Aksi).
 * Label diawali kata kerja, sentence case. Primer maksimal satu per area kerja.
 * Destruktif HANYA di dialog konfirmasi (DS). Tidak memakai brand-red.
 */
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md px-4 text-body-dense font-medium whitespace-nowrap ' +
    'transition-colors disabled:cursor-not-allowed disabled:opacity-60 ' +
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
  {
    variants: {
      variant: {
        primary: 'bg-action text-on-action hover:opacity-90',
        secondary: 'border border-border-control bg-surface text-ink hover:bg-surface-sunken',
        quiet: 'bg-transparent text-ink hover:bg-surface-sunken',
        destructive: 'bg-error-ink text-on-action hover:opacity-90',
      },
      size: {
        md: 'h-control-md',
        lg: 'h-control-lg px-5',
      },
      block: { true: 'w-full', false: '' },
    },
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
      {...rest}
    >
      {loading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={1.8} /> : icon}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
});

export { buttonVariants };
