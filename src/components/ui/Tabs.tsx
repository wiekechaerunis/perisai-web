/**
 * Tabs — PERISAI Design System `Perisai.Tabs` (Navigasi).
 * Tab aktif: teks tebal `ink` + garis bawah 2px `action`, tanpa latar berwarna. Jumlah item di `ink-subtle`.
 * Dua mode: `TabsNav` (tautan rute, untuk halaman bertab) dan `Tabs` (Radix, konten dalam halaman).
 */
import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

// Warna garis bawah dipisah (aktif vs tidak) karena `cn` tidak memakai tailwind-merge: `border-transparent` + `border-action`
// sekaligus membuat garis tab aktif hilang (urutan CSS).
const triggerBase =
  'relative -mb-px inline-flex h-control-md items-center gap-2 border-b-2 px-1 text-body-dense ' +
  'hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring';
const triggerIdle = 'border-transparent text-ink-muted';
const triggerActive = 'border-action font-semibold text-ink';

export interface TabItem {
  value: string;
  label: ReactNode;
  count?: number;
}

function Count({ n }: { n?: number }) {
  return n === undefined ? null : <span className="font-mono text-caption text-ink-subtle">{n}</span>;
}

export interface TabsNavProps {
  items: (TabItem & { to: string })[];
  label: string;
  className?: string;
}

/** Tab berbasis rute (setiap tab punya URL sendiri). */
export function TabsNav({ items, label, className }: TabsNavProps) {
  return (
    <nav aria-label={label} className={cn('flex gap-6', className)}>
      {items.map((it) => (
        <NavLink key={it.value} to={it.to} end className={({ isActive }) => cn(triggerBase, isActive ? triggerActive : triggerIdle)}>
          {it.label}
          <Count n={it.count} />
        </NavLink>
      ))}
    </nav>
  );
}

export interface TabsProps {
  items: (TabItem & { content: ReactNode })[];
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

/** Tab dalam halaman (Radix: panah kiri/kanan, Home/End). */
export function Tabs({ items, label, value, defaultValue, onValueChange, className }: TabsProps) {
  return (
    <RadixTabs.Root
      value={value}
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={onValueChange}
      className={className}
    >
      <RadixTabs.List aria-label={label} className="flex gap-6 border-b border-border">
        {items.map((it) => (
          <RadixTabs.Trigger
            key={it.value}
            value={it.value}
            className={cn(triggerBase, 'border-transparent text-ink-muted data-[state=active]:border-action data-[state=active]:font-semibold data-[state=active]:text-ink')}
          >
            {it.label}
            <Count n={it.count} />
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((it) => (
        <RadixTabs.Content key={it.value} value={it.value} className="pt-5 focus-visible:outline-none">
          {it.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
