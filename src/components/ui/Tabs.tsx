/**
 * Tabs — PERISAI DS v2 · Lime (tab di bawah PageHeader atau di dalam kartu).
 * Tab aktif (Ekspresi E1): teks 600 `ink` + garis bawah 3px `action`; tab lain 500 `ink-muted`. Jumlah item `ink-muted`.
 * Dua mode: `TabsNav` (tautan rute, untuk halaman bertab) dan `Tabs` (Radix, konten dalam halaman).
 */
import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

// Warna garis bawah dipisah (aktif vs tidak) karena `cn` tidak memakai tailwind-merge: `border-transparent` + `border-action`
// sekaligus membuat garis tab aktif hilang (urutan CSS).
const triggerBase =
  'relative -mb-px inline-flex h-control-height items-center gap-[6px] px-0.5 text-body transition-[color,box-shadow] duration-fast ' +
  'hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring';
const triggerIdle = 'font-medium text-ink-muted';
const triggerActive = 'font-semibold text-ink shadow-[inset_0_-3px_0_var(--color-action)]';

export interface TabItem {
  value: string;
  label: ReactNode;
  count?: number;
}

function Count({ n }: { n?: number }) {
  return n === undefined ? null : <span className="text-caption font-semibold text-ink-muted">{n}</span>;
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
            className={cn(triggerBase, 'font-medium text-ink-muted data-[state=active]:font-semibold data-[state=active]:text-ink data-[state=active]:shadow-[inset_0_-3px_0_var(--color-action)]')}
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
