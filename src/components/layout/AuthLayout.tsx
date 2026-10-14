/**
 * Kerangka layar publik (NON-DS, DS_GAPS.md). Dua varian mengikuti Figma CORE-PERISAI:
 *
 * - AuthSplitLayout — Login (85:4794): panel autentikasi 563px di kiri (logo atas, form di tengah, footer bawah),
 *   panel visual di kanan. Panel kanan disembunyikan di layar sempit (NFR PRD Login "Responsiveness").
 * - AuthPageLayout — OTP, Aktivasi, Lupa/Atur ulang kata sandi (118:235, 66:2546, 66:2602): header 80px
 *   (logo kiri, tautan bantuan kanan, garis bawah), isi satu kolom di tengah.
 *
 * Tema dipaksa `standar` karena logo hanya tampil di area terang (aturan Logo DS).
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
    <div data-theme="standar" className={cn('flex min-h-screen bg-surface', className)}>
      <div className="flex min-h-screen w-full flex-col px-6 pb-8 pt-10 md:px-[88px] lg:w-[563px] lg:shrink-0 lg:pr-[61px]">
        <div>{brand}</div>
        <main className="flex flex-1 items-center py-10">
          <div className="w-full max-w-[420px]">{children}</div>
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
    <div data-theme="standar" className={cn('flex min-h-screen flex-col bg-surface', className)}>
      <header className="flex h-[80px] shrink-0 items-center justify-between border-b border-[color:var(--figma-header-border)] px-6 md:px-[80px]">
        {brand}
        {headerAction}
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-[80px] pt-[60px]">
        <div className={cn('w-full', width === 'form' ? 'max-w-[400px]' : 'max-w-[640px]')}>{children}</div>
      </main>
    </div>
  );
}
