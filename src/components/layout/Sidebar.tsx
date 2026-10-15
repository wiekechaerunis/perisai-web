/**
 * Sidebar — PERISAI Design System `Perisai.Sidebar` (Navigasi), tata letak mengikuti Figma 66:3139 / 238:3000.
 * Latar `sidebar-bg`, lebar `sidebar-width` (Figma 260px → token DS 232px, F-06).
 * - Brand: logo PERISAI untuk latar gelap (Figma) atau teks "PERISAI" (DS), lalu garis identitas merah → lime.
 * - Grup: label sentence case di `sidebar-muted`; grup bisa dilipat (Figma "Administrasi").
 * - Item aktif: latar `sidebar-active` + penanda lime 4×12 (Figma; DS_GAPS F-22).
 * - Badge jumlah (`count-bg`) hanya untuk antrian yang menunggu tindakan pengguna.
 *
 * Komponen ini tidak tahu role/modul: item yang tampil sudah disaring pemakai (item yang tidak diizinkan
 * DISEMBUNYIKAN, bukan dinonaktifkan — PU-04, FR-PA-10).
 */
import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

export interface SidebarItem {
  key: string;
  label: string;
  to: string;
  icon?: ReactNode;
  /** Jumlah item menunggu tindakan pengguna. */
  count?: number;
}

export interface SidebarGroup {
  key: string;
  label?: string;
  icon?: ReactNode;
  /** Grup bisa dilipat (default terbuka). */
  collapsible?: boolean;
  items: SidebarItem[];
}

export interface SidebarProps {
  groups: SidebarGroup[];
  /** Label aksesibel navigasi, mis. "Navigasi utama". */
  navLabel: string;
  /** Logo/brand di puncak. Default: teks "PERISAI". */
  brand?: ReactNode;
  /** Area akun (opsional; aplikasi memakai menu pengguna di header). */
  account?: ReactNode;
  /** Slot paling bawah (mis. hak cipta, alat dev). */
  footer?: ReactNode;
  className?: string;
}

function Group({ g }: { g: SidebarGroup }) {
  const [open, setOpen] = useState(true);
  const listId = `nav-${g.key}`;
  return (
    <div className="flex flex-col gap-1">
      {g.label &&
        (g.collapsible ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((o) => !o)}
            className="flex items-center justify-between rounded-md px-4 py-2 text-caption font-semibold text-sidebar-muted hover:text-sidebar-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            <span className="flex items-center gap-2">
              {g.icon}
              {g.label}
            </span>
            <ChevronDown aria-hidden size={12} strokeWidth={1.8} className={cn('transition-transform', !open && '-rotate-90')} />
          </button>
        ) : (
          <p className="flex items-center gap-2 px-4 py-2 text-caption font-semibold text-sidebar-muted">
            {g.icon}
            {g.label}
          </p>
        ))}
      {open && (
        <ul id={listId} className="flex flex-col gap-0.5">
          {g.items.map((it) => (
            <li key={it.key}>
              <NavLink
                to={it.to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-control-md items-center gap-2 rounded-md pl-8 pr-4 text-body-dense text-sidebar-muted',
                    'hover:bg-sidebar-active hover:text-sidebar-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring',
                    isActive && 'bg-sidebar-active font-semibold text-sidebar-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {it.icon}
                    <span className="flex-1">{it.label}</span>
                    {it.count !== undefined && it.count > 0 && (
                      <span className="rounded-sm bg-count-bg px-1 font-mono text-caption text-count-ink">{it.count}</span>
                    )}
                    {isActive && <span aria-hidden className="h-3 w-1 rounded-sm bg-brand-lime" />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Sidebar({ groups, navLabel, brand, account, footer, className }: SidebarProps) {
  return (
    <aside className={cn('flex h-full w-sidebar-width shrink-0 flex-col bg-sidebar-bg text-sidebar-ink', className)}>
      <div className="flex flex-col gap-[10px] pt-6">
        <div className="px-5">{brand ?? <span className="text-heading-2 font-semibold tracking-[0.04em]">PERISAI</span>}</div>
        <div aria-hidden className="flex h-0.5 w-full">
          <span className="h-full w-4/5 bg-brand-red" />
          <span className="h-full w-1/5 bg-brand-lime" />
        </div>
      </div>
      <nav aria-label={navLabel} className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pt-6">
        {groups.map((g) => (
          <Group key={g.key} g={g} />
        ))}
      </nav>
      {account && <div className="border-t border-sidebar-active px-3 py-3">{account}</div>}
      {footer && <div className="border-t border-sidebar-active px-4 py-4">{footer}</div>}
    </aside>
  );
}
