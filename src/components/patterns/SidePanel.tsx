/**
 * SidePanel — PERISAI DS v2 · Lime `SidePanel`: panel kanan 480px (`sidepanel-width`), tinggi penuh, `scrim` di
 * belakang, `shadow-floating`. Kepala menempel atas, isi scroll sendiri. Fokus terkunci; Esc dan tombol tutup menutup.
 */
import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Judul (nama item) — page-title-child. */
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
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-30 animate-fade-in bg-scrim" />
        <RadixDialog.Content
          className={cn(
            'p-scroll fixed bottom-0 right-0 top-0 z-30 flex w-[min(var(--sidepanel-width),100vw)] animate-fade-in flex-col gap-6 overflow-y-auto bg-surface p-6 shadow-floating focus-visible:outline-none',
            className,
          )}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4 pb-4">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-3">
                  <RadixDialog.Title className="break-words text-page-title-child text-ink">{title}</RadixDialog.Title>
                  {titleAside}
                </div>
                {subtitle ? (
                  <RadixDialog.Description className="break-all text-body text-ink-muted">{subtitle}</RadixDialog.Description>
                ) : (
                  <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
                )}
              </div>
              <RadixDialog.Close asChild>
                <button
                  type="button"
                  aria-label={closeLabel}
                  className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-md text-ink transition-colors duration-fast hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
                >
                  <X aria-hidden size={16} strokeWidth={2} />
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
