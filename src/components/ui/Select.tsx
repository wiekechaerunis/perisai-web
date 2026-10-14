/**
 * Select — PERISAI Design System `Perisai.Select` (Form).
 * Pilihan dari daftar tetap; opsi diberikan pemakai (dari master data, bukan diketik ulang).
 * Lebih dari 15 opsi: gunakan varian dengan pencarian (belum dibutuhkan di gelombang 1).
 */
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

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
  /** Tampilan di latar gelap (Sidebar/panel dev). */
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
  tone = 'default',
  className,
  name,
}: SelectProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label id={`${id}-label`} htmlFor={id} className={cn('text-label', tone === 'inverse' ? 'text-sidebar-muted' : 'text-ink-muted', hideLabel && 'sr-only')}>
        {label}
      </label>
      <RadixSelect.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled} name={name}>
        <RadixSelect.Trigger
          id={id}
          aria-labelledby={`${id}-label`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? hintId : undefined}
          className={cn(
            'flex h-control-md w-full items-center justify-between gap-2 rounded-md border px-3 text-body-dense',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
            'disabled:cursor-not-allowed disabled:opacity-60 data-[placeholder]:text-ink-subtle',
            tone === 'inverse'
              ? 'border-sidebar-muted bg-sidebar-active text-sidebar-ink data-[placeholder]:text-sidebar-muted'
              : 'bg-surface text-ink',
            tone === 'default' && (error ? 'border-error-ink' : 'border-border-control'),
          )}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown aria-hidden size={16} strokeWidth={1.8} />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className="z-50 max-h-[320px] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-surface shadow-overlay"
          >
            <RadixSelect.Viewport className="p-1">
              {options.map((o) => (
                <RadixSelect.Item
                  key={o.value}
                  value={o.value}
                  disabled={o.disabled}
                  className={cn(
                    'relative flex min-h-control-md cursor-default select-none items-center rounded-md py-2 pl-8 pr-3 text-body-dense text-ink outline-none',
                    'data-[highlighted]:bg-surface-sunken data-[state=checked]:font-semibold data-[disabled]:opacity-50',
                  )}
                >
                  <RadixSelect.ItemIndicator className="absolute left-2 inline-flex">
                    <Check aria-hidden size={16} strokeWidth={1.8} />
                  </RadixSelect.ItemIndicator>
                  <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {(error || hint) && (
        <p id={hintId} className={cn('text-caption', error ? 'text-error-ink' : 'text-ink-subtle')}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
