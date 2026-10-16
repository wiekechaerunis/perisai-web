/**
 * AccountStatusBadge — bentuk Tag / WorkflowStatus PERISAI DS v2 · Lime. Tinggi 24px, padding 9px, `radius-sm`,
 * teks `tag` 12/16 700, latar pastel TANPA garis (kecuali Draf: garis dalam 1,5px `border-control`), tanpa titik
 * (titik milik severitas). Ikon 12px opsional.
 *
 * Nada DS v2 → token:
 * - info (berjalan, `status-info-*`) · success (sah/selesai, `status-success-*`) · neutral (`status-neutral-*`)
 * - caution / warning (menunggu tindakan, tenggat; `caution-*`) · danger (gagal/macet, `error-*`)
 * - draft (Draf) · muted (berakhir/dibatalkan, `surface-sunken` + `ink-muted`) · selected (pilihan pengguna, mis.
 *   "Perangkat ini", `action-subtle-*`; bukan status)
 * - strong: nada v1 (Diundang, Ditangguhkan) → `status-neutral-*` sesuai keputusan 16 Okt 2026 (proses berjalan netral)
 *   sampai K4 dicatat di Decision Log.
 * Lime (`action`) tidak pernah dipakai untuk status. Nilai, ikon, dan nada diberikan pemakai (lib/status.ts).
 */
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type TagTone = 'neutral' | 'muted' | 'caution' | 'success' | 'warning' | 'danger' | 'strong' | 'info' | 'draft' | 'selected';

export interface AccountStatusBadgeProps {
  label: string;
  icon?: LucideIcon;
  tone?: TagTone;
  /** Keterangan di bawah badge (bukan status). */
  note?: ReactNode;
  className?: string;
}

export const TAG_TONE: Record<TagTone, string> = {
  info: 'bg-status-info-bg text-status-info-ink',
  success: 'bg-status-success-bg text-status-success-ink',
  neutral: 'bg-status-neutral-bg text-status-neutral-ink',
  strong: 'bg-status-neutral-bg text-status-neutral-ink',
  caution: 'bg-caution-bg text-caution-ink',
  warning: 'bg-caution-bg text-caution-ink',
  danger: 'bg-error-bg text-error-ink',
  draft: 'bg-surface text-ink-muted shadow-[inset_0_0_0_1.5px_var(--color-border-control)]',
  muted: 'bg-surface-sunken text-ink-muted',
  selected: 'bg-action-subtle-bg text-action-subtle-ink',
};

/** Kelas dasar Tag DS v2 (dipakai juga oleh badge kecil di fitur). */
export const TAG_BASE = 'inline-flex h-6 items-center gap-[5px] whitespace-nowrap rounded-sm px-[9px] text-tag';

export function AccountStatusBadge({ label, icon: Icon, tone = 'neutral', note, className }: AccountStatusBadgeProps) {
  return (
    <span className={cn('inline-flex flex-col items-start gap-1', className)}>
      <span className={cn(TAG_BASE, TAG_TONE[tone])}>
        {Icon && <Icon aria-hidden size={12} strokeWidth={2} />}
        {label}
      </span>
      {note && <span className="text-caption text-ink-muted">{note}</span>}
    </span>
  );
}
