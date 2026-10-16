/**
 * FormFooter — PERISAI DS v2 · Lime `FormFooter`: bar aksi form yang menempel di bawah, berisi tombol saja.
 * `surface`, garis atas `border`, padding 14px 24px, sticky di bawah. Kiri: "Sebelumnya" / "Batal"; kanan: aksi sekunder
 * lalu SATU tombol primer. Tanpa teks status, stempel waktu, atau "Draf disimpan".
 * Dipasang sebagai anak terakhir PageBody (menembus padding 24px agar selebar area konten).
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface FormFooterProps {
  /** Kiri: Batal / Sebelumnya. */
  start?: ReactNode;
  /** Kanan: sekunder lalu satu primer. */
  end: ReactNode;
  className?: string;
}

export function FormFooter({ start, end, className }: FormFooterProps) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 -mx-6 -mb-6 mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface px-6 py-[14px]',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">{start}</div>
      <div className="flex flex-wrap items-center gap-2">{end}</div>
    </div>
  );
}
