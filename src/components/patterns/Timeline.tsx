/**
 * Timeline — PERISAI DS v2 · Lime `Timeline`: riwayat kejadian satu objek (akun, laporan, risiko), terbaru di atas.
 * Per kejadian: simpul 24px dengan ikon 12px → judul 600 + jam di kanan (`ink-muted`, tabular) → pelaku (avatar inisial
 * 18px + nama, 12px) → catatan opsional (kotak `surface-subtle` bergaris kiri sewarna simpul). Garis penghubung 2px
 * `border`, membulat.
 * Warna simpul: `now` lime (kejadian terbaru, hanya satu) · `ok` status-success · `warn` caution · `err` error ·
 * `plain` garis `border` · `next` garis putus tanpa jam (langkah yang sedang ditunggu, penghubung juga putus-putus).
 * Lebih dari satu hari → kelompok berjudul hari. Waktu absolut WIB (catatan audit). Teks dan ikon dari pemakai.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type TimelineTone = 'now' | 'ok' | 'warn' | 'err' | 'plain' | 'next';

export interface TimelineEvent {
  key: string;
  title: ReactNode;
  /** Jam ("09:20 WIB"); kosong untuk `next`. */
  time?: string;
  /** Teks pembaca layar lengkap, mis. "Diundang oleh Rina Wiyono, 6 Sep 2026 20:14 WIB". */
  srLabel?: string;
  actor?: { name: string; initials: string };
  note?: ReactNode;
  icon: ReactNode;
  tone?: TimelineTone;
}

export interface TimelineGroup {
  key: string;
  /** Judul hari, mis. "Hari ini · 16 Okt 2026". */
  label?: string;
  events: TimelineEvent[];
}

export interface TimelineProps {
  groups: TimelineGroup[];
  label: string;
  className?: string;
}

const NODE: Record<TimelineTone, string> = {
  now: 'bg-action text-on-action shadow-[inset_0_0_0_1px_var(--color-action-line)]',
  ok: 'bg-status-success-bg text-status-success-ink',
  warn: 'bg-caution-bg text-caution-ink',
  err: 'bg-error-bg text-error-ink',
  plain: 'bg-surface text-ink-muted shadow-[inset_0_0_0_1.5px_var(--color-border)]',
  next: 'border-[1.5px] border-dashed border-border-control bg-transparent text-ink-muted',
};
const NOTE: Partial<Record<TimelineTone, string>> = {
  warn: 'shadow-[inset_2px_0_0_var(--color-caution-ink)]',
  err: 'shadow-[inset_2px_0_0_var(--color-error-ink)]',
};

export function Timeline({ groups, label, className }: TimelineProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {groups.map((g) => (
        <div key={g.key}>
          {g.label && <p className="mb-[10px] mt-1 text-caption font-semibold text-ink-muted">{g.label}</p>}
          <ol aria-label={label} className="flex flex-col">
            {g.events.map((e, i) => {
              const tone = e.tone ?? 'plain';
              const last = i === g.events.length - 1;
              return (
                <li key={e.key} aria-label={e.srLabel} className={cn('relative grid animate-rise grid-cols-[24px_minmax(0,1fr)] gap-x-3', !last && 'pb-[18px]')}>
                  {!last && (
                    <span
                      aria-hidden
                      className={cn(
                        'absolute bottom-1 left-[11px] top-7 w-0.5 rounded-[1px]',
                        tone === 'next' ? 'w-0 border-l-2 border-dashed border-border' : 'bg-border',
                      )}
                    />
                  )}
                  <span aria-hidden className={cn('flex h-6 w-6 items-center justify-center rounded-full [&>svg]:h-3 [&>svg]:w-3', NODE[tone])}>
                    {e.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex min-h-6 items-center justify-between gap-2">
                      <span className={tone === 'next' ? 'font-medium text-ink-subtle' : 'font-semibold text-ink'}>{e.title}</span>
                      {e.time && <time className="whitespace-nowrap text-caption tabular-nums text-ink-muted">{e.time}</time>}
                    </div>
                    {e.actor && (
                      <span className="flex items-center gap-[6px] text-caption text-ink-muted">
                        <span aria-hidden className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-surface-sunken text-[9px] font-bold text-ink-subtle">
                          {e.actor.initials}
                        </span>
                        {e.actor.name}
                      </span>
                    )}
                    {e.note && (
                      <div className={cn('mt-2 rounded-md bg-surface-subtle px-[10px] py-2 text-ink-subtle', NOTE[tone] ?? 'shadow-[inset_2px_0_0_var(--color-border-control)]')}>
                        {e.note}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
