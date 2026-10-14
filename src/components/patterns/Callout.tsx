/**
 * Callout — PERISAI Design System `Perisai.Callout` (Umpan balik).
 * Kalimat pertama menyebut masalah, kalimat kedua langkah berikutnya. Tanpa garis tebal di sisi kiri.
 *
 * Varian DS: info (`surface-sunken`), peringatan (`caution-bg`), kritis (`sev-kritis-bg`, hanya untuk
 * sinyal/insiden Kritis). Varian `error` adalah USULAN (DS_GAPS K-2): alert server di atas form
 * memakai `error-ink`, satu-satunya merah di luar severitas.
 */
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, Info, OctagonAlert, XCircle } from 'lucide-react';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

const calloutVariants = cva('flex gap-3 rounded-md px-4 py-3 text-body-dense', {
  variants: {
    variant: {
      info: 'bg-surface-sunken text-ink',
      peringatan: 'bg-caution-bg text-caution-ink',
      kritis: 'bg-sev-kritis-bg text-sev-kritis-ink',
      error: 'border border-error-ink bg-surface text-error-ink',
    },
  },
  defaultVariants: { variant: 'info' },
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
  { variant = 'info', title, action, children, className, role, ...rest },
  ref,
) {
  const Icon = ICONS[variant ?? 'info'];
  const live = variant === 'error' || variant === 'peringatan' || variant === 'kritis';
  return (
    <div
      ref={ref}
      role={role ?? (live ? 'alert' : 'status')}
      className={cn(calloutVariants({ variant }), className)}
      {...rest}
    >
      <Icon aria-hidden size={18} strokeWidth={1.8} className="mt-0.5 shrink-0" />
      <div className="flex min-w-0 flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(variant === 'error' ? 'text-ink' : undefined)}>{children}</div>}
        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  );
});
