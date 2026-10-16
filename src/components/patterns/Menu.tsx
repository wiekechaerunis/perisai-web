/**
 * Menu — PERISAI DS v2 · Lime `ActionMenu`: daftar `radius-lg` + `shadow-overlay`, padding 6px; item 36px
 * `radius-sm`, ikon 16px `ink` di kiri, hover `surface-sunken`; aksi destruktif paling bawah `error-ink` setelah pemisah.
 * Muncul fade + geser 4px (160ms). Radix DropdownMenu: navigasi panah, Esc menutup.
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
  /** Aksi destruktif: teks `error-ink`, ditaruh paling bawah setelah pemisah. */
  danger?: boolean;
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
          className="z-50 min-w-[220px] animate-pop-in rounded-lg bg-surface p-[6px] shadow-overlay"
        >
          {header && <div className="mb-1 border-b border-border-subtle px-[10px] pb-[10px] pt-1">{header}</div>}
          {items.map((it, i) => (
            <div key={it.key}>
              {it.danger && i > 0 && !items[i - 1]!.danger && <RadixMenu.Separator className="my-1 h-px bg-border-subtle" />}
              <RadixMenu.Item
                onSelect={it.onSelect}
                disabled={it.disabled}
                className={cn(
                  'flex min-h-control-sm cursor-default select-none items-center gap-[10px] rounded-sm px-[10px] text-body outline-none transition-colors duration-fast',
                  'data-[highlighted]:bg-surface-sunken data-[disabled]:text-ink-disabled',
                  it.danger ? 'text-error-ink' : 'text-ink',
                )}
              >
                {it.icon}
                {it.label}
              </RadixMenu.Item>
            </div>
          ))}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}
