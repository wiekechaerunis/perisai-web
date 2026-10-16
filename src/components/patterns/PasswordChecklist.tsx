/**
 * PasswordChecklist — daftar syarat PasswordField PERISAI DS v2 · Lime: tiap syarat bertanda strip saat belum
 * terpenuhi (2 kolom, tampil sebelum mengetik), centang `status-success-ink` 600 saat terpenuhi; diumumkan `aria-live="polite"` (FR-AK-04, FR-LP-11,
 * FR-UK-05). Tidak ada pesan error terpisah selama syarat belum terpenuhi (Tabel U-1). Aturan dari lib/password.ts.
 */
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ChecklistRule {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordChecklistProps {
  rules: ChecklistRule[];
  /** Label aksesibel daftar, mis. "Syarat kata sandi". */
  label: string;
  /** Teks pembaca layar untuk status, mis. { met: 'terpenuhi', unmet: 'belum terpenuhi' }. */
  srStatus: { met: string; unmet: string };
  className?: string;
  id?: string;
}

export function PasswordChecklist({ rules, label, srStatus, className, id }: PasswordChecklistProps) {
  return (
    <ul id={id} aria-label={label} aria-live="polite" className={cn('grid grid-cols-2 gap-x-3 gap-y-1', className)}>
      {rules.map((r) => (
        <li key={r.id} className={cn('flex items-center gap-[6px] text-caption', r.met ? 'font-semibold text-status-success-ink' : 'text-ink-muted')}>
          {r.met ? <Check aria-hidden size={14} strokeWidth={2} /> : <Minus aria-hidden size={14} strokeWidth={2} />}
          <span>{r.label}</span>
          <span className="sr-only">: {r.met ? srStatus.met : srStatus.unmet}</span>
        </li>
      ))}
    </ul>
  );
}
