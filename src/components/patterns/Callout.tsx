/**
 * Callout — PERISAI Design System `Perisai.Callout` (Umpan balik).
 * Kalimat pertama menyebut masalah, kalimat kedua langkah berikutnya.
 *
 * Anatomi DS (Figma CORE-PERISAI): latar berwarna penuh + garis kiri 4px, radius `radius-sm` hanya di sudut kanan,
 * padding 12px, ikon 16px, jarak ikon–teks 10px. Ini satu-satunya pengecualian aturan "tanpa garis tebal di sisi kiri".
 * Varian: info (`surface-sunken`/`ink-subtle`), peringatan (`caution`), kritis (`sev-kritis`, hanya untuk sinyal/insiden
 * Kritis), error (`error-bg`/`error-ink`, kegagalan form atau server). Ukuran `compact` (12px) di dalam form dan Dialog.
 */
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, Info, OctagonAlert, XCircle } from 'lucide-react';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

const calloutVariants = cva('flex gap-[10px] rounded-r-sm border-l-4 p-3', {
  variants: {
    variant: {
      info: 'border-ink-subtle bg-surface-sunken text-ink',
      peringatan: 'border-caution bg-caution-bg text-caution-ink',
      kritis: 'border-sev-kritis bg-sev-kritis-bg text-sev-kritis-ink',
      error: 'border-error-ink bg-error-bg text-error-ink',
    },
    size: {
      md: 'text-body-dense',
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
      <Icon aria-hidden size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" />
      <div className="flex min-w-0 flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  );
});
