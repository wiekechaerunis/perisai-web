/**
 * Switch — PERISAI DS v2 · Lime `Switch`: saklar nyala/mati untuk pengaturan atau filter kondisi yang LANGSUNG berlaku.
 * Satu baris tombol `role="switch"` + `aria-checked`: label 600 + keterangan 12px `ink-muted` di kiri, saklar di kanan;
 * seluruh baris bisa diklik. Track 34×20 (mati `switch-off`, nyala `action-line`), knob 16px putih bergeser 160ms.
 * Pilihan yang baru berlaku setelah Simpan/Terapkan memakai Checkbox. Nonaktif: opasitas 45% + alasan di keterangan.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SwitchProps {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ label, description, checked, onCheckedChange, disabled, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-sm py-2 text-left text-body text-ink disabled:cursor-not-allowed disabled:opacity-[.45]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
        className,
      )}
    >
      <span className="flex min-w-0 flex-col">
        <span className="font-semibold">{label}</span>
        {description && <span className="text-caption text-ink-muted">{description}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          'relative h-5 w-[34px] shrink-0 rounded-[10px] transition-colors duration-appear',
          checked ? 'bg-action-line' : 'bg-switch-off',
        )}
      >
        <span
          className={cn(
            // Knob putih di kedua tema (DS v2 Switch).
            'absolute top-0.5 h-4 w-4 rounded-full bg-[#fff] shadow-[0_1px_2px_rgba(0,0,0,.2)] transition-[left] duration-appear',
            checked ? 'left-4' : 'left-0.5',
          )}
        />
      </span>
    </button>
  );
}
