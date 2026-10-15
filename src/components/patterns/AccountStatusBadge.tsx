/**
 * AccountStatusBadge — PERISAI Design System `Perisai.AccountStatusBadge`. Bentuk badge status DS: tinggi 20px,
 * padding 8px, radius `radius-sm`, border 1px, 12px medium, tanpa titik; ikon 12px opsional. Nada DS: success (Aktif),
 * strong (Diundang, Ditangguhkan), warning (Kedaluwarsa, Belum ada admin), danger (Nonaktif akun), neutral, muted (entitas
 * nonaktif yang bukan akun, mis. role Tidak aktif), caution. Warna dari token `status-*` DS.
 * Nilai, ikon, dan nada diberikan pemakai (lib/status.ts), komponen tidak tahu modul.
 */
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface AccountStatusBadgeProps {
  label: string;
  icon?: LucideIcon;
  tone?: 'neutral' | 'muted' | 'caution' | 'success' | 'warning' | 'danger' | 'strong';
  /** Keterangan di bawah badge (bukan status). */
  note?: ReactNode;
  className?: string;
}

const TONE = {
  neutral: 'border-border bg-surface text-ink',
  muted: 'border-border bg-surface-sunken text-ink-muted',
  caution: 'border-caution bg-caution-bg text-caution-ink',
  success: 'border-status-success-border bg-status-success-bg text-status-success-ink',
  warning: 'border-status-warning-border bg-status-warning-bg text-status-warning-ink',
  danger: 'border-status-danger-border bg-status-danger-bg text-status-danger-ink',
  strong: 'border-status-strong-border bg-status-strong-bg text-status-strong-ink',
} as const;

export function AccountStatusBadge({ label, icon: Icon, tone = 'neutral', note, className }: AccountStatusBadgeProps) {
  return (
    <span className={cn('inline-flex flex-col items-start gap-1', className)}>
      <span className={cn('inline-flex h-5 items-center gap-1 rounded-sm border px-2 text-caption font-medium', TONE[tone])}>
        {Icon && <Icon aria-hidden size={12} strokeWidth={1.8} />}
        {label}
      </span>
      {note && <span className="text-caption text-ink-subtle">{note}</span>}
    </span>
  );
}
