/**
 * Kerangka layar publik — DS v2 · Lime (AuthForm, StatusPage):
 *
 * - AuthSplitLayout — Login: susunan AuthSplitLayout DS v1 tetap (panel form 563px kiri: logo 120px di atas, form
 *   di tengah maks. 400px, footer bawah; panel foto di kanan, disembunyikan di layar sempit).
 * - AuthPageLayout — OTP, Aktivasi, Lupa/Atur ulang kata sandi, halaman status tautan email: bar atas `surface` 56px
 *   (logo PERISAI 26px kiri; "Butuh bantuan?" + link "Hubungi support" kanan), isi satu kolom di tengah.
 *
 * Tema dipaksa `light` karena logo hanya untuk latar terang (aturan Logo DS v2).
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface AuthSplitLayoutProps {
  /** Logo di kiri atas. */
  brand: ReactNode;
  /** Form (lebar maksimal 420px). */
  children: ReactNode;
  /** Teks kecil di kiri bawah (hak cipta). */
  footer?: ReactNode;
  /** Panel visual kanan. */
  aside?: ReactNode;
  className?: string;
}

export function AuthSplitLayout({ brand, children, footer, aside, className }: AuthSplitLayoutProps) {
  return (
    <div data-theme="light" className={cn('flex min-h-screen bg-surface', className)}>
      <div className="flex min-h-screen w-full flex-col items-center px-6 pb-8 pt-10 md:px-[80px] lg:w-auth-panel-width lg:shrink-0">
        <div className="flex w-full max-w-[400px] justify-center">{brand}</div>
        <main className="flex w-full flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>
        {footer}
      </div>
      {aside && <div className="relative hidden min-h-screen flex-1 overflow-hidden lg:block">{aside}</div>}
    </div>
  );
}

export interface AuthPageLayoutProps {
  brand: ReactNode;
  /** Tautan di kanan header, mis. "Butuh Bantuan? Hubungi Support" (FR-AK-02). */
  headerAction?: ReactNode;
  children: ReactNode;
  /** Lebar kolom isi: form (400px) atau state halaman (640px). */
  width?: 'form' | 'state';
  className?: string;
}

export function AuthPageLayout({ brand, headerAction, children, width = 'form', className }: AuthPageLayoutProps) {
  return (
    <div data-theme="light" className={cn('flex min-h-screen flex-col bg-surface', className)}>
      <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-border px-6">
        {brand}
        {headerAction}
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-[80px] pt-[60px]">
        <div className={cn('w-full', width === 'form' ? 'max-w-[400px]' : 'max-w-[420px]')}>{children}</div>
      </main>
    </div>
  );
}
