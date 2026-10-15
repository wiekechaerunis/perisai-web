/**
 * Dialog / ConfirmDialog — PERISAI Design System `Perisai.Dialog` / `Perisai.ConfirmDialog`.
 * Lebar `dialog-width-base` 560px (bawaan), `dialog-width-md` 480px, `dialog-width-lg` 720px; scrim `overlay-scrim`
 * (standar ink 40%, ruang kendali hitam 60%). Kepala dengan garis bawah, isi, kaki dengan garis atas. Varian `media` (Figma 66:3553 "Undangan Gagal Dikirim"): ilustrasi + teks rata tengah tanpa garis.
 * Overlay memakai `shadow-overlay` (satu-satunya bayangan yang diizinkan DS). Radix: fokus terkunci, Esc menutup.
 * Aksi destruktif hanya boleh tampil di dialog ini (aturan Button DS).
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
  /** `base` 560px (bawaan), `md` 480px untuk konfirmasi singkat, `lg` 720px untuk form atau isi panjang. */
  size?: 'md' | 'base' | 'lg';
  className?: string;
  /** Elemen yang menerima fokus saat dialog dibuka (DS: tombol Batal untuk konfirmasi destructive). */
  initialFocus?: RefObject<HTMLElement | null>;
}

const WIDTH = {
  md: 'w-[min(var(--dialog-width-md),calc(100vw-32px))]',
  base: 'w-[min(var(--dialog-width-base),calc(100vw-32px))]',
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
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-overlay-scrim" />
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
            'rounded-lg border border-border bg-surface shadow-overlay focus-visible:outline-none',
            className,
          )}
        >
          <div className={cn('relative flex flex-col gap-[6px] px-6 pb-4 pt-5', centered ? 'items-center text-center' : 'border-b border-border')}>
            {media && <div className="mb-3">{media}</div>}
            <RadixDialog.Title className={cn('text-heading-2 text-ink', !centered && 'pr-8')}>{title}</RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className="text-body-dense text-ink-muted">{description}</RadixDialog.Description>
            ) : (
              <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
            )}
            {closeLabel && (
              <RadixDialog.Close asChild>
                <button
                  type="button"
                  aria-label={closeLabel}
                  className="absolute right-5 top-5 flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
                >
                  <X aria-hidden size={16} strokeWidth={1.8} />
                </button>
              </RadixDialog.Close>
            )}
          </div>
          {children && <div className="flex min-h-0 flex-col gap-4 overflow-y-auto p-6">{children}</div>}
          {(footer || footerNote) && (
            <div
              className={cn(
                'flex items-center gap-3 px-6 pb-6 pt-4',
                centered ? 'justify-center' : 'justify-between border-t border-border',
              )}
            >
              {!centered && <span className="text-caption text-ink-muted">{footerNote}</span>}
              <div className="flex gap-3">{footer}</div>
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
