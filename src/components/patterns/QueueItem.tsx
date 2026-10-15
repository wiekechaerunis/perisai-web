/**
 * QueueItem — PERISAI Design System `Perisai.QueueItem`: satu item antrian (verifikasi, persetujuan, tugas).
 * Isi dari atas: severitas (bila ada) + sumber + waktu, cuplikan maks. dua baris, ID mono. Item berupa tautan
 * (pindah ke detail); urutan severitas lalu terbaru diatur pemakai.
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export interface QueueItemProps {
  to: string;
  /** SeverityBadge, bila ada. */
  severity?: ReactNode;
  source: string;
  time: string;
  title: string;
  detail?: string;
  /** Badge status di kanan. */
  status?: ReactNode;
  className?: string;
}

export function QueueItem({ to, severity, source, time, title, detail, status, className }: QueueItemProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-start gap-3 border-b border-border-subtle px-1 py-3 last:border-b-0 hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring',
        className,
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-muted">
          {severity}
          <span>{source}</span>
          <span className="font-mono">{time}</span>
        </span>
        <span className="line-clamp-2 text-body-dense font-medium text-ink">{title}</span>
        {detail && <span className="text-caption text-ink-muted">{detail}</span>}
      </span>
      {status && <span className="shrink-0">{status}</span>}
    </Link>
  );
}
