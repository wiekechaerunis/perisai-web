/**
 * AccountStatusBadge — komponen NON-DS (K-5, usulan di DS_GAPS.md). Status akun Diundang/Aktif/Kedaluwarsa/
 * Ditangguhkan/Nonaktif. Bentuk mengikuti Figma (h20, px8, radius 4, label 11–12px, baris keterangan opsional di
 * bawahnya, mis. "Meminta undangan baru"). WARNA mengikuti Figma 109:16180 (arahan PM 14 Okt 2026, menggantikan F-20):
 * success (Aktif), strong (Diundang, Ditangguhkan), warning (Kedaluwarsa), danger (Nonaktif); `muted` untuk status redup
 * (mis. role Tidak Aktif, FR-AR-19). Variabel warna di styles/status.css.
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
  neutral: 'border-border-control bg-surface text-ink',
  muted: 'border-border bg-surface-sunken text-ink-subtle',
  caution: 'border-caution bg-caution-bg text-caution-ink',
  success: 'border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success-ink)]',
  warning: 'border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning-ink)]',
  danger: 'border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--status-danger-ink)]',
  strong: 'border-[var(--status-strong-border)] bg-[var(--status-strong-bg)] text-[var(--status-strong-ink)]',
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
