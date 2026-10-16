/**
 * AppShell — kerangka aplikasi setelah login. DS: Sidebar `sidebar-width` + area konten (`surface-page`).
 * Figma 66:3139 menambahkan header 56px di atas konten (menu pengguna di kanan; FR-AS-001, FR-LO-01).
 */
import type { ReactNode } from 'react';

export interface AppShellProps {
  sidebar: ReactNode;
  /** Header di atas konten (opsional). */
  header?: ReactNode;
  children: ReactNode;
  /** Lompat ke konten (aksesibilitas). */
  skipLinkLabel: string;
}

export function AppShell({ sidebar, header, children, skipLinkLabel }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
      >
        {skipLinkLabel}
      </a>
      <div className="sticky top-0 h-screen">{sidebar}</div>
      <div className="flex min-w-0 flex-1 flex-col bg-surface-page">
        {header}
        <main id="konten" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}

export interface AppHeaderProps {
  /** Kiri (mis. pencarian global — belum ada di Core Platform). */
  start?: ReactNode;
  /** Kanan (menu pengguna). */
  end?: ReactNode;
}

/** Header 56px (Figma 66:3139). */
export function AppHeader({ start, end }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-[56px] shrink-0 items-center gap-3 border-b border-border bg-surface px-6">
      <div className="flex min-w-0 flex-1 items-center">{start}</div>
      <div className="flex items-center gap-2">{end}</div>
    </header>
  );
}

/** Area isi halaman: padding `space-6` (Figma 24px), jarak antar Section `space-5`. */
export function PageBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-5 px-6 py-5">{children}</div>;
}
