/**
 * Dialog / ConfirmDialog — PERISAI DS v2 · Lime `Dialog` / `ConfirmDialog`.
 * Lebar 480px (`md`, bawaan) atau 640px (`lg`); `surface`, `radius-xl`, `shadow-floating`, di atas `scrim`.
 * Kepala: judul 17/24 700 + tombol tutup 28px, padding 20px 24px (tanpa garis). Isi: 13px `ink-subtle`, padding
 * 8px 24px 20px, jarak 12px. Kaki: garis atas `border-subtle`, padding 14px 24px, tombol rata kanan (Batal sekunder lalu
 * aksi), catatan opsional rata kiri. Varian Hasil (`media`): ilustrasi + teks rata tengah tanpa garis kepala/kaki.
 * Muncul fade + geser 4px dalam 160ms. Radix: fokus terkunci, Esc menutup. Aksi destruktif hanya di dialog ini.
 */
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useRef, type ReactNode, type RefObject } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '../ui/Button';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Baris tombol di kanan bawah. */
  footer?: ReactNode;
  /** Teks kecil di kiri kaki dialog (mis. "Undangan berlaku 7 hari"). */
  footerNote?: ReactNode;
  /** Label aksesibel tombol tutup; tanpa nilai = tidak ada tombol tutup (mis. peringatan sesi). */
  closeLabel?: string;
  /** false = tidak bisa ditutup lewat klik luar / Esc (dialog yang menuntut keputusan). */
  dismissible?: boolean;
  /** Ilustrasi di atas judul; tata letak rata tengah (Figma 66:3553). */
  media?: ReactNode;
  /** `md`/`base` 480px (bawaan DS v2), `lg` 640px untuk isi berisi tabel atau form panjang. */
  size?: 'md' | 'base' | 'lg';
  className?: string;
  /** Elemen yang menerima fokus saat dialog dibuka (DS: tombol Batal untuk konfirmasi destructive). */
  initialFocus?: RefObject<HTMLElement | null>;
}

const WIDTH = {
  md: 'w-[min(var(--dialog-width-md),calc(100vw-32px))]',
  base: 'w-[min(var(--dialog-width-md),calc(100vw-32px))]',
  lg: 'w-[min(var(--dialog-width-lg),calc(100vw-32px))]',
} as const;

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  footerNote,
  closeLabel,
  dismissible = true,
  media,
  size = 'base',
  className,
  initialFocus,
}: DialogProps) {
  const centered = !!media;
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 animate-fade-in bg-scrim" />
        <RadixDialog.Content
          onOpenAutoFocus={(e) => {
            if (initialFocus?.current) {
              e.preventDefault();
              initialFocus.current.focus();
            }
          }}
          onEscapeKeyDown={dismissible ? undefined : (e) => e.preventDefault()}
          onPointerDownOutside={dismissible ? undefined : (e) => e.preventDefault()}
          onInteractOutside={dismissible ? undefined : (e) => e.preventDefault()}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100vh-48px)] -translate-x-1/2 -translate-y-1/2 flex-col',
            WIDTH[size],
            'animate-pop-in rounded-xl bg-surface shadow-floating focus-visible:outline-none',
            className,
          )}
        >
          <div className={cn('relative flex flex-col gap-2 px-6 pt-5', centered ? 'items-center pb-2 pt-[28px] text-center' : 'pb-2')}>
            {media && <div className="mb-2">{media}</div>}
            <RadixDialog.Title className={cn('text-dialog-title text-ink', !centered && 'pr-[36px]')}>{title}</RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="text-body text-ink-subtle">{description}</RadixDialog.Description>
            ) : (
              <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
            )}
            {closeLabel && (
              <RadixDialog.Close asChild>
                <button
                  type="button"
                  aria-label={closeLabel}
                  className="absolute right-4 top-4 flex h-[28px] w-[28px] items-center justify-center rounded-md text-ink transition-colors duration-fast hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
                >
                  <X aria-hidden size={16} strokeWidth={2} />
                </button>
              </RadixDialog.Close>
            )}
          </div>
          {children && <div className="p-scroll flex min-h-0 flex-col gap-3 overflow-y-auto px-6 pb-5 pt-2 text-body text-ink-subtle">{children}</div>}
          {(footer || footerNote) && (
            <div
              className={cn(
                'flex items-center gap-2 px-6',
                centered ? 'justify-center pb-6 pt-2' : 'justify-between border-t border-border-subtle py-[14px]',
              )}
            >
              {!centered && <span className="text-caption text-ink-muted">{footerNote}</span>}
              <div className="flex gap-2">{footer}</div>
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export interface ConfirmDialogProps extends Omit<DialogProps, 'footer'> {
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  loading?: boolean;
  loadingLabel?: string;
  destructive?: boolean;
  confirmDisabled?: boolean;
}

export function ConfirmDialog({
  confirmLabel,
  cancelLabel,
  onConfirm,
  loading,
  loadingLabel,
  destructive,
  confirmDisabled,
  onOpenChange,
  ...rest
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      {...rest}
      initialFocus={destructive ? cancelRef : rest.initialFocus}
      onOpenChange={(o) => !loading && onOpenChange(o)}
      footer={
        <>
          <Button ref={cancelRef} onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            loadingLabel={loadingLabel}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
