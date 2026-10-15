/**
 * Toast — PERISAI Design System `Perisai.Toast`. Lebar 480px, lingkaran ikon 24px, pesan 14px medium, tutup x-circle.
 * Varian berhasil: lingkaran `ink` + centang, diumumkan sopan (Radix `background`), hilang sendiri (~5 detik).
 * Varian gagal: lingkaran `status-danger-ink` + x, diumumkan langsung (Radix `foreground`), tidak hilang sendiri.
 * DS: Toast tanpa tombol aksi. Pengecualian PRD Kelola Organisasi FR-ORG-08 ("Undang Admin KKKS") dicatat di
 * ASSUMPTIONS.md (DS-04) sampai diputuskan PM.
 */
import * as RadixToast from '@radix-ui/react-toast';
import { Check, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface ToastMessage {
  id: number;
  title: ReactNode;
  description?: ReactNode;
  /** `gagal`: lingkaran merah, diumumkan langsung, tidak hilang sendiri (DS). Bawaan `berhasil`. */
  variant?: 'berhasil' | 'gagal';
  /** Aksi lanjutan, mis. "Undang Admin KKKS" setelah organisasi ditambahkan (PRD Kelola Organisasi FR-ORG-08). */
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  show: (t: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
  /** Label aksesibel tombol tutup dan region (teks disediakan aplikasi). */
  closeLabel: string;
  regionLabel: string;
  duration?: number;
}

export function ToastProvider({ children, closeLabel, regionLabel, duration = 5000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const show = useCallback((t: Omit<ToastMessage, 'id'>) => {
    setToasts((prev) => [...prev, { ...t, id: Date.now() + Math.random() }]);
  }, []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      <RadixToast.Provider duration={duration} label={regionLabel}>
        {children}
        {toasts.map((t) => (
          <RadixToast.Root
            key={t.id}
            type={t.variant === 'gagal' ? 'foreground' : 'background'}
            duration={t.variant === 'gagal' ? Infinity : undefined}
            onOpenChange={(open) => !open && setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="flex w-[min(480px,calc(100vw-32px))] items-start gap-4 rounded-lg border border-border-subtle bg-surface py-4 pl-5 pr-6 text-body-dense text-ink shadow-overlay"
          >
            <span
              aria-hidden
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                t.variant === 'gagal' ? 'bg-status-danger-ink text-on-action-danger' : 'bg-action text-on-action',
              )}
            >
              {t.variant === 'gagal' ? <X size={12} strokeWidth={2.4} /> : <Check size={12} strokeWidth={2.4} />}
            </span>
            <div className="flex flex-1 flex-col gap-1 pt-0.5">
              <RadixToast.Title className="font-medium">{t.title}</RadixToast.Title>
              {t.description && <RadixToast.Description className="text-ink-muted">{t.description}</RadixToast.Description>}
              {t.action && (
                <RadixToast.Action altText={t.action.label} asChild>
                  <button type="button" onClick={t.action.onClick} className="self-start text-body-dense font-semibold text-ink underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring">
                    {t.action.label}
                  </button>
                </RadixToast.Action>
              )}
            </div>
            <RadixToast.Close
              aria-label={closeLabel}
              className="flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              <XCircle aria-hidden size={14} strokeWidth={1.8} />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed right-6 top-[72px] z-[60] flex flex-col gap-2 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return ctx;
}
