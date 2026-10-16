/**
 * StatePanel — PERISAI DS v2 · Lime `StatusPage` (isi): halaman status penuh di luar menu (tautan tidak valid, akun
 * sudah aktif, undangan kedaluwarsa, sesi habis) dan di dalam AppShell (404, 403). FR-AK-01 T-1, FR-LP-10 L-3, FR-PA-19.
 *
 * - align `center` (StatusPage): ilustrasi 200×140 → judul `page-title-child` (20/28 700) → satu-dua kalimat `ink-muted`
 *   maks. 420px → satu tombol (primer bila satu-satunya jalan lanjut, sekunder bila hanya jalan keluar).
 * - align `start`: ikon + judul rata kiri (state di dalam halaman kerja).
 * Ilustrasi dekoratif aria-hidden; judul adalah h1 halaman.
 */
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Illustration, type IllustrationName } from './Illustration';

export interface StatePanelProps {
  icon?: LucideIcon;
  /** Ilustrasi DS v2 (dipakai bila `media` kosong). */
  illustration?: IllustrationName;
  /** Gambar/ilustrasi lain di atas judul (dekoratif). */
  media?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** CTA utama (Button) dan/atau tautan sekunder. */
  actions?: ReactNode;
  align?: 'start' | 'center';
  className?: string;
  /** Tingkat heading judul (halaman penuh = 1). */
  headingLevel?: 1 | 2;
}

export function StatePanel({
  icon: Icon,
  illustration,
  media,
  title,
  description,
  actions,
  align = 'start',
  className,
  headingLevel = 1,
}: StatePanelProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const center = align === 'center';
  const art = media ?? (illustration ? <Illustration name={illustration} size="lg" /> : null);
  return (
    <div className={cn('il-host flex flex-col', center ? 'items-center gap-2 text-center' : 'items-start gap-3', className)}>
      {art && (
        <div aria-hidden className={center ? 'mb-3' : ''}>
          {art}
        </div>
      )}
      {Icon && !art && <Icon aria-hidden size={20} strokeWidth={1.9} className="text-ink-muted" />}
      <Heading className="text-page-title-child text-ink">{title}</Heading>
      {description && <div className={cn('text-body text-ink-muted', center ? 'max-w-[420px]' : 'max-w-content-max')}>{description}</div>}
      {actions && <div className={cn('mt-3 flex flex-col gap-3', center ? 'w-[320px] max-w-full' : 'w-full')}>{actions}</div>}
    </div>
  );
}
