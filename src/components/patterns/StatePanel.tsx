/**
 * StatePanel — komponen NON-DS (usulan di DS_GAPS.md). Keadaan satu halaman penuh yang bukan daftar kosong:
 * "Tautan tidak valid", "Akun sudah aktif", "Undangan tidak berlaku lagi" (FR-AK-01 T-1, FR-LP-10 L-3),
 * kelak juga "Anda tidak memiliki akses" (FR-PA-19). EmptyState DS khusus untuk daftar kosong.
 *
 * - align `start` (default): ikon + judul rata kiri (halaman kerja).
 * - align `center` + `media`: tata letak Figma Aktivasi 66:2546/2569/2582 — ilustrasi di atas, teks dan CTA di tengah.
 *   Ilustrasi bertentangan dengan aturan DS "tanpa ilustrasi" untuk EmptyState (DS_GAPS F-11).
 */
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface StatePanelProps {
  icon?: LucideIcon;
  /** Gambar/ilustrasi di atas judul (dekoratif). */
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
  return (
    <div className={cn('flex flex-col gap-3', center ? 'items-center gap-10 text-center' : 'items-start', className)}>
      {media && <div aria-hidden>{media}</div>}
      <div className={cn('flex flex-col gap-3', center ? 'items-center gap-5' : 'items-start')}>
        {Icon && <Icon aria-hidden size={18} strokeWidth={1.8} className="text-ink-muted" />}
        <Heading className={cn('text-ink', center ? 'text-heading-1' : 'text-heading-1')}>{title}</Heading>
        {description && <div className={cn('text-body text-ink-muted', !center && 'max-w-content-max')}>{description}</div>}
        {actions && <div className={cn('mt-2 flex flex-col gap-3', center ? 'w-[318px] max-w-full' : 'w-full')}>{actions}</div>}
      </div>
    </div>
  );
}
