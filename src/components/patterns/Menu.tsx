/**
 * Menu — komponen NON-DS (usulan di DS_GAPS.md). Menu tarik-turun untuk aksi akun
 * (Pengaturan akun, Keluar; FR-LO-01). Radix DropdownMenu: navigasi panah, Esc menutup.
 */
import * as RadixMenu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface MenuItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  onSelect: () => void;
  /** Item tampil tetapi tidak dapat dipilih (mis. "Akhiri semua sesi" tanpa sesi aktif). */
  disabled?: boolean;
}

export interface MenuProps {
  trigger: ReactNode;
  items: MenuItem[];
  side?: 'top' | 'bottom' | 'right';
  align?: 'start' | 'end';
  /** Judul kecil di atas daftar (mis. nama + email). */
  header?: ReactNode;
}

export function Menu({ trigger, items, side = 'bottom', align = 'start', header }: MenuProps) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content
          side={side}
          align={align}
          sideOffset={6}
          className="z-50 min-w-[220px] rounded-md border border-border bg-surface py-1 shadow-overlay"
        >
          {header && <div className="border-b border-border-subtle px-3 pb-2 pt-1">{header}</div>}
          {items.map((it) => (
            <RadixMenu.Item
              key={it.key}
              onSelect={it.onSelect}
              disabled={it.disabled}
              className={cn(
                'flex cursor-default select-none items-center gap-2 px-3 py-[10px] text-body-dense text-ink outline-none',
                'data-[highlighted]:bg-surface-sunken data-[disabled]:text-ink-subtle',
              )}
            >
              {it.icon}
              {it.label}
            </RadixMenu.Item>
          ))}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}
