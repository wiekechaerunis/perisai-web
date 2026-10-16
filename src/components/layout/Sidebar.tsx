/**
 * Sidebar — PERISAI DS v2 · Lime `Sidebar`: navigasi utama di kiri, bisa dilebarkan (240px) atau diciutkan (72px).
 *
 * Lebar: logo PERISAI lengkap 176px → garis identitas 2px 80:20 `brand-red` : `action` → label "Menu" → item 42px
 * (ikon 18px, `radius-lg`; aktif = blok `action` + `on-action` 600; lainnya `ink` 500 dengan ikon `ink-muted`; hover
 * `surface-sunken`) → badge jumlah `count-bg`. Kaki: garis atas `border-subtle`, logo SKK Migas 40px + hak cipta dan versi
 * 11px `ink-muted`.
 * Ciut: logo tanda 32×32 + garis identitas 32px, label grup disembunyikan, item 44×44 ikon saja dengan tooltip gelap di
 * kanan (nama + jumlah), badge menjadi titik merah 8px; kaki hanya logo SKK Migas (hak cipta + versi di tooltip).
 * Tombol bulat 26px di tepi kanan sejajar logo ("Perkecil sidebar" / "Perlebar sidebar", `aria-expanded`,
 * `aria-controls` ke nav). Transisi lebar 200ms. Bidang merek: gradasi lime lembut di kiri bawah (`p-wedge`, E6).
 *
 * Komponen ini tidak tahu role/modul: item yang tampil sudah disaring pemakai (item yang tidak diizinkan
 * DISEMBUNYIKAN, bukan dinonaktifkan — PU-04, FR-PA-10). Keadaan lebar/ciut dikendalikan pemakai (disimpan per browser).
 */
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
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
  /** Label kecil di atas item pertama (DS: "Menu"). */
  menuLabel?: string;
  /** Logo lengkap (mode lebar). */
  brand?: ReactNode;
  /** Logo tanda 32×32 (mode ciut). */
  brandMark?: ReactNode;
  /** Mode ciut 72px. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Teks tombol tepi: { collapse: "Perkecil sidebar", expand: "Perlebar sidebar" }. */
  toggleLabels?: { collapse: string; expand: string };
  /** Kaki: logo SKK Migas + teks (hak cipta, versi). */
  footerLogo?: ReactNode;
  footerText?: ReactNode;
  /** Teks kaki untuk tooltip mode ciut. */
  footerTitle?: string;
  /** Slot di atas kaki (mis. alat dev); disembunyikan saat ciut. */
  footer?: ReactNode;
  className?: string;
}

const groupLabel = 'px-2 pb-[6px] text-[11px] font-semibold leading-4 text-ink-muted';
const tip =
  'pointer-events-none invisible absolute left-[calc(100%+10px)] top-1/2 z-30 flex -translate-y-1/2 items-center gap-[6px] whitespace-nowrap rounded-md bg-ink px-[10px] py-[6px] text-caption font-semibold text-surface opacity-0 shadow-overlay transition-opacity duration-fast group-hover/nav:visible group-hover/nav:opacity-100 group-focus-visible/nav:visible group-focus-visible/nav:opacity-100';

function Count({ n, mini }: { n: number; mini?: boolean }) {
  return mini ? (
    <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-count-bg shadow-[0_0_0_2px_var(--color-surface)]" />
  ) : (
    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-sm bg-count-bg px-[6px] text-[11px] font-bold text-on-action-danger">{n}</span>
  );
}

function Group({ g, first, menuLabel, mini }: { g: SidebarGroup; first: boolean; menuLabel?: string; mini: boolean }) {
  const [open, setOpen] = useState(true);
  const listId = `nav-${g.key}`;
  const label = g.label ?? (first ? menuLabel : undefined);
  const expanded = open || mini;
  return (
    <div className={cn('flex flex-col', mini && 'items-center')}>
      {label &&
        !mini &&
        (g.collapsible ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => setOpen((o) => !o)}
            className={cn(
              groupLabel,
              'flex items-center justify-between rounded-sm transition-colors duration-fast hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring',
            )}
          >
            {label}
            <ChevronDown aria-hidden size={12} strokeWidth={2} className={cn('transition-transform duration-fast', !open && '-rotate-90')} />
          </button>
        ) : (
          <p className={groupLabel}>{label}</p>
        ))}
      {mini && !first && <span aria-hidden className="my-1 h-px w-8 bg-border-subtle" />}
      {expanded && (
        <ul id={listId} className={cn('flex flex-col gap-0.5', mini && 'items-center')}>
          {g.items.map((it) => {
            const hasCount = it.count !== undefined && it.count > 0;
            return (
              <li key={it.key}>
                <NavLink
                  to={it.to}
                  aria-label={mini ? (hasCount ? `${it.label} (${it.count})` : it.label) : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group/nav relative flex items-center text-body transition-colors duration-fast',
                      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring',
                      mini ? 'h-[44px] w-[44px] justify-center rounded-lg' : 'h-[42px] gap-3 rounded-lg px-3',
                      isActive ? 'bg-action font-semibold text-on-action' : 'font-medium text-ink hover:bg-surface-sunken',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span aria-hidden className={cn('flex shrink-0 [&>svg]:h-[18px] [&>svg]:w-[18px]', isActive ? 'text-on-action' : 'text-ink-muted group-hover/nav:text-ink')}>
                        {it.icon}
                      </span>
                      {mini ? (
                        <>
                          {hasCount && <Count n={it.count!} mini />}
                          <span aria-hidden className={tip}>
                            {it.label}
                            {hasCount && <Count n={it.count!} />}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 truncate">{it.label}</span>
                          {hasCount && <Count n={it.count!} />}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Sidebar({
  groups,
  navLabel,
  menuLabel = 'Menu',
  brand,
  brandMark,
  collapsed = false,
  onCollapsedChange,
  toggleLabels = { collapse: 'Perkecil sidebar', expand: 'Perlebar sidebar' },
  footerLogo,
  footerText,
  footerTitle,
  footer,
  className,
}: SidebarProps) {
  const navId = useId();
  const mini = collapsed;
  const toggleLabel = mini ? toggleLabels.expand : toggleLabels.collapse;
  return (
    <aside
      className={cn(
        'sidebar-wedge relative flex h-full shrink-0 flex-col border-r border-border bg-surface text-ink transition-[width] duration-200 ease-in-out',
        mini ? 'w-[72px]' : 'w-sidebar-width',
        className,
      )}
    >
      {onCollapsedChange && (
        <button
          type="button"
          aria-expanded={!mini}
          aria-controls={navId}
          aria-label={toggleLabel}
          title={toggleLabel}
          onClick={() => onCollapsedChange(!mini)}
          className="absolute -right-[13px] top-[30px] z-30 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-surface text-ink-subtle shadow-[inset_0_0_0_1px_var(--color-border),var(--shadow-overlay)] transition-[color,box-shadow,transform] duration-fast hover:text-ink hover:shadow-[inset_0_0_0_1px_var(--color-border-control),var(--shadow-overlay)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring active:scale-[.94]"
        >
          {mini ? <PanelLeftOpen aria-hidden size={14} strokeWidth={2} /> : <PanelLeftClose aria-hidden size={14} strokeWidth={2} />}
        </button>
      )}
      <div className={cn('flex flex-col gap-[14px] pb-4 pt-5', mini ? 'items-center px-3' : 'px-5')}>
        {mini ? (brandMark ?? <span className="text-section-title">P</span>) : (brand ?? <span className="text-section-title tracking-[0.04em]">PERISAI</span>)}
        <div aria-hidden className={cn('flex h-0.5 overflow-hidden rounded-[1px]', mini ? 'w-8' : 'w-full')}>
          <span className="h-full flex-[4] bg-brand-red" />
          <span className="h-full flex-1 bg-action" />
        </div>
      </div>
      <nav id={navId} aria-label={navLabel} className={cn('p-scroll flex flex-1 flex-col gap-4 pb-4', mini ? 'items-center overflow-visible px-3' : 'overflow-y-auto px-[14px]')}>
        {groups.map((g, i) => (
          <Group key={g.key} g={g} first={i === 0} menuLabel={menuLabel} mini={mini} />
        ))}
      </nav>
      {footer && !mini && <div className="relative z-[1] px-[14px] pb-2">{footer}</div>}
      {(footerLogo || footerText) && (
        <div
          title={mini ? footerTitle : undefined}
          className={cn('relative z-[1] mx-[14px] mb-3 flex items-center gap-[10px] border-t border-border-subtle pt-[14px] text-[11px] leading-[15px] text-ink-muted', mini && 'mx-3 justify-center [&_img]:w-[34px]')}
        >
          {footerLogo}
          {!mini && footerText && <span>{footerText}</span>}
        </div>
      )}
    </aside>
  );
}
