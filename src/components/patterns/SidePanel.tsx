/**
 * SidePanel — komponen NON-DS (usulan di DS_GAPS.md). Panel detail di kanan (Figma 106:14009, 480px):
 * membuka detail baris tabel tanpa meninggalkan daftar. Sejalan dengan pola master-detail DS.
 * Radix Dialog non-modal tanpa scrim (Figma tidak menggambar scrim); Esc dan tombol tutup menutup panel.
 */
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Judul (nama item) — heading-1. */
  title: ReactNode;
  /** Di samping judul, mis. badge status. */
  titleAside?: ReactNode;
  subtitle?: ReactNode;
  /** Baris aksi di bawah judul. */
  actions?: ReactNode;
  children: ReactNode;
  closeLabel: string;
  className?: string;
}

export function SidePanel({ open, onOpenChange, title, titleAside, subtitle, actions, children, closeLabel, className }: SidePanelProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <RadixDialog.Portal>
        <RadixDialog.Content
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            'fixed bottom-0 right-0 top-0 z-30 flex w-[min(480px,100vw)] flex-col gap-6 overflow-y-auto border-l border-border bg-surface p-6 shadow-overlay focus-visible:outline-none',
            className,
          )}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4 pb-4">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-3">
                  <RadixDialog.Title className="break-words text-heading-1 text-ink">{title}</RadixDialog.Title>
                  {titleAside}
                </div>
                {subtitle ? (
                  <RadixDialog.Description className="break-all text-body-dense text-ink-muted">{subtitle}</RadixDialog.Description>
                ) : (
                  <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
                )}
              </div>
              <RadixDialog.Close asChild>
                <button
                  type="button"
                  aria-label={closeLabel}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
                >
                  <X aria-hidden size={16} strokeWidth={1.8} />
                </button>
              </RadixDialog.Close>
            </div>
            {actions && <div className="flex flex-col gap-3">{actions}</div>}
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
