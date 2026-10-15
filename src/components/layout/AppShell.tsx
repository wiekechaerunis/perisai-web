/**
 * AppShell — kerangka aplikasi setelah login. DS: Sidebar `sidebar-width` + area konten (`surface-page`).
 * Figma 66:3139 menambahkan header 56px di atas konten (menu pengguna di kanan; FR-AS-001, FR-LO-01).
 * Layar sempit (< 1024px, mis. pelapor lapangan di ponsel): Sidebar disembunyikan dan dibuka sebagai laci dari
 * tombol menu di header (komponen non-DS, DS_GAPS).
 */
import { Menu as MenuIcon } from 'lucide-react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

const ShellContext = createContext<{ openNav: () => void } | null>(null);

export interface AppShellProps {
  sidebar: ReactNode;
  /** Header di atas konten (opsional). */
  header?: ReactNode;
  children: ReactNode;
  /** Lompat ke konten (aksesibilitas). */
  skipLinkLabel: string;
  /** Teks di bawah konten di setiap halaman (mis. penanda prototype). */
  footer?: ReactNode;
}

export function AppShell({ sidebar, header, children, skipLinkLabel, footer }: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setNavOpen(false), [location.pathname]);
  return (
    <ShellContext.Provider value={{ openNav: () => setNavOpen(true) }}>
      <div className="flex min-h-screen">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
        >
          {skipLinkLabel}
        </a>
        <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>
        {navOpen && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <div className="h-full">{sidebar}</div>
            <button type="button" aria-label="Tutup menu" className="flex-1 bg-overlay-scrim" onClick={() => setNavOpen(false)} />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col bg-surface-page">
          {header}
          <main id="konten" className="min-w-0 flex-1">
            {children}
          </main>
          {footer}
        </div>
      </div>
    </ShellContext.Provider>
  );
}

export interface AppHeaderProps {
  /** Kiri (mis. pencarian global — belum ada di Core Platform). */
  start?: ReactNode;
  /** Kanan (menu pengguna). */
  end?: ReactNode;
  /** Label tombol menu di layar sempit. */
  menuLabel?: string;
}

/** Header 56px (Figma 66:3139). */
export function AppHeader({ start, end, menuLabel = 'Buka menu' }: AppHeaderProps) {
  const shell = useContext(ShellContext);
  return (
    <header className="sticky top-0 z-20 flex h-[56px] shrink-0 items-center gap-3 border-b border-border bg-surface px-4 lg:px-6">
      {shell && (
        <button
          type="button"
          aria-label={menuLabel}
          onClick={shell.openNav}
          className="flex h-control-md w-control-md items-center justify-center rounded-md text-ink hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring lg:hidden"
        >
          <MenuIcon aria-hidden size={18} strokeWidth={1.8} />
        </button>
      )}
      <div className="flex min-w-0 flex-1 items-center">{start}</div>
      <div className="flex items-center gap-2">{end}</div>
    </header>
  );
}

/** Area isi halaman: padding `space-6` (Figma 24px), jarak antar Section `space-5`. Lebih rapat di layar sempit. */
export function PageBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-5 px-4 py-5 lg:px-6">{children}</div>;
}
