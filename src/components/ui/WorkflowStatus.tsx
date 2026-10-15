/**
 * WorkflowStatus — PERISAI Design System `Perisai.WorkflowStatus`: posisi item di alur kerja sebagai badge status
 * (border 1px, tanpa titik). Nada mengikuti tabel DS; status di luar daftar baku DS dicatat di DS_GAPS.md.
 * Label dan nada disediakan pemakai (peta nada per modul ada di lib).
 */
import { AccountStatusBadge, type AccountStatusBadgeProps } from '../patterns/AccountStatusBadge';

export type WorkflowTone = NonNullable<AccountStatusBadgeProps['tone']>;

export interface WorkflowStatusProps {
  label: string;
  tone?: WorkflowTone;
  note?: AccountStatusBadgeProps['note'];
  className?: string;
}

export function WorkflowStatus({ label, tone = 'neutral', note, className }: WorkflowStatusProps) {
  return <AccountStatusBadge label={label} tone={tone} note={note} className={className} />;
}
