/**
 * Select — PERISAI DS v2 · Lime `Select` (6–15 opsi).
 * Pemicu = kotak isian 40px + chevron; terbuka = garis 2px `action-line`. Daftar menempel 4px, `radius-lg`,
 * `shadow-overlay`, tinggi maks. 320px; baris 36px `radius-sm`: hover `surface-sunken`, terpilih `action-subtle-*`
 * + centang + 700. Muncul fade + geser 4px (160ms).
 * Pilihan dari daftar tetap; opsi diberikan pemakai (dari master data, bukan diketik ulang).
 * Lebih dari 15 opsi: gunakan varian dengan pencarian (belum dibutuhkan di gelombang 1).
 */
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { inputStateClass } from './TextField';

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  label: ReactNode;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Teks saat belum ada pilihan, mis. "Pilih alasan pencabutan". */
  placeholder?: string;
  hint?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  hideLabel?: boolean;
  /** sm = 32px (pemilih jumlah baris Pagination), md = 40px (bawaan). */
  size?: 'sm' | 'md';
  /** @deprecated Sidebar v2 berlatar terang; tidak lagi mengubah tampilan. */
  tone?: 'default' | 'inverse';
  className?: string;
  name?: string;
}

export function Select({
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  hint,
  error,
  disabled,
  hideLabel,
  size = 'md',
  className,
  name,
}: SelectProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={cn('flex flex-col gap-[6px]', className)}>
      <label id={`${id}-label`} htmlFor={id} className={cn('text-label text-ink', hideLabel && 'sr-only')}>
        {label}
      </label>
      <RadixSelect.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled} name={name}>
        <RadixSelect.Trigger
          id={id}
          aria-labelledby={`${id}-label`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? hintId : undefined}
          className={cn(
            'group flex w-full items-center justify-between gap-2 rounded-md border-0 text-left text-body outline-none transition-shadow duration-fast',
            size === 'sm' ? 'h-8 pl-[10px] pr-2 font-semibold' : 'h-control-height px-3',
            'data-[placeholder]:text-ink-muted',
            inputStateClass({ error: !!error, disabled }),
            !error && !disabled && 'data-[state=open]:shadow-[inset_0_0_0_2px_var(--color-action-line)]',
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown aria-hidden size={16} strokeWidth={2} className="text-ink-muted transition-transform duration-fast group-data-[state=open]:rotate-180" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className="z-50 max-h-[320px] min-w-[max(var(--radix-select-trigger-width),200px)] animate-pop-in overflow-hidden rounded-lg bg-surface shadow-overlay"
          >
            <RadixSelect.Viewport className="p-scroll p-[6px]">
              {options.map((o) => (
                <RadixSelect.Item
                  key={o.value}
                  value={o.value}
                  disabled={o.disabled}
                  className={cn(
                    'relative flex min-h-control-sm cursor-default select-none items-center gap-[10px] rounded-sm py-2 pl-[10px] pr-8 text-body text-ink outline-none transition-colors duration-fast',
                    'data-[highlighted]:bg-surface-sunken data-[state=checked]:bg-action-subtle-bg data-[state=checked]:font-semibold data-[state=checked]:text-action-subtle-ink data-[disabled]:text-ink-disabled',
                  )}
                >
                  <RadixSelect.ItemIndicator className="absolute right-[10px] inline-flex">
                    <Check aria-hidden size={16} strokeWidth={2} />
                  </RadixSelect.ItemIndicator>
                  <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {(error || hint) && (
        <p id={hintId} className={cn('text-caption', error ? 'font-medium text-error-ink' : 'text-ink-muted')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
