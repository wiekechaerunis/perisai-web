/**
 * Callout — Banner DS v2 · Lime (pesan di dalam halaman). Kalimat pertama menyebut masalah, kalimat kedua langkah berikutnya.
 *
 * Anatomi DS v2: kotak `radius-lg`, padding 12px 14px, ikon 16px, jarak ikon–teks 10px, TANPA garis kiri.
 * - info = Catatan tetap: `surface` + garis `border`, teks `ink-subtle` (tidak berwarna status).
 * - peringatan = Banner peristiwa: `caution-bg` / `caution-ink`.
 * - error = Banner gagal: `error-bg` / `error-ink` (kegagalan form atau server).
 * - kritis: `sev-critical-*`, hanya untuk sinyal/insiden Kritis.
 * Ukuran `compact` (12px) di dalam form dan Dialog.
 */
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, Info, OctagonAlert, XCircle } from 'lucide-react';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

const calloutVariants = cva('flex animate-fade-in gap-[10px] rounded-lg px-[14px] py-3', {
  variants: {
    variant: {
      info: 'border border-border bg-surface text-ink-subtle',
      peringatan: 'bg-caution-bg text-caution-ink',
      kritis: 'bg-sev-critical-bg text-sev-critical-ink',
      error: 'bg-error-bg text-error-ink',
    },
    size: {
      md: 'text-body',
      compact: 'text-caption',
    },
  },
  defaultVariants: { variant: 'info', size: 'md' },
});

const ICONS = { info: Info, peringatan: AlertTriangle, kritis: OctagonAlert, error: XCircle } as const;

export interface CalloutProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof calloutVariants> {
  /** Judul tebal (opsional), mis. "Kredensial tidak valid". */
  title?: ReactNode;
  /** Tindakan, mis. tautan "Hubungi Support". */
  action?: ReactNode;
}

export const Callout = forwardRef<HTMLDivElement, CalloutProps>(function Callout(
  { variant = 'info', size = 'md', title, action, children, className, role, ...rest },
  ref,
) {
  const Icon = ICONS[variant ?? 'info'];
  const live = variant === 'error' || variant === 'peringatan' || variant === 'kritis';
  return (
    <div
      ref={ref}
      role={role ?? (live ? 'alert' : 'status')}
      className={cn(calloutVariants({ variant, size }), className)}
      {...rest}
    >
      <Icon aria-hidden size={16} strokeWidth={2} className="mt-px shrink-0" />
      <div className="flex min-w-0 flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  );
});
