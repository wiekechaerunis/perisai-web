/**
 * IconButton — tombol ikon PERISAI DS v2 · Lime (`p-ibtn`): 36px, `radius-md`, ikon 16px. Wajib `label` yang dipakai
 * sebagai `aria-label` DAN tooltip dengan kata yang sama (kata kerja + objek), tampil saat hover/fokus setelah 400ms.
 * Varian `outline` (surface + garis dalam `border-control`, mis. Unduh di toolbar tabel) dan `ghost` (tanpa garis, aksi
 * per baris). Hover `surface-sunken`, tekan mengecil.
 */
import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Kata kerja + objek, mis. "Unduh CSV". Dipakai untuk aria-label dan tooltip. */
  label: string;
  icon: ReactNode;
  variant?: 'outline' | 'ghost';
  loading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'outline', loading = false, disabled, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        'group/ib relative inline-flex h-control-sm w-control-sm shrink-0 items-center justify-center rounded-md text-ink transition-[background-color,box-shadow,transform] duration-fast',
        'enabled:hover:bg-surface-sunken enabled:active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-[.45]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
        variant === 'outline' ? 'bg-surface shadow-[inset_0_0_0_1px_var(--color-border-control)]' : 'bg-transparent',
        className,
      )}
      {...rest}
    >
      <span aria-hidden className="flex [&>svg]:h-4 [&>svg]:w-4">
        {loading ? <Loader2 className="animate-spin" strokeWidth={2} /> : icon}
      </span>
      <span
        aria-hidden
        className="pointer-events-none invisible absolute right-0 top-[calc(100%+6px)] z-40 whitespace-nowrap rounded-sm bg-ink px-2 py-1 text-[11px] font-semibold text-surface opacity-0 transition-opacity delay-0 duration-fast group-hover/ib:visible group-hover/ib:opacity-100 group-hover/ib:delay-[400ms] group-focus-visible/ib:visible group-focus-visible/ib:opacity-100"
      >
        {label}
      </span>
    </button>
  );
});
