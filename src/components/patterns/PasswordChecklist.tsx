/**
 * PasswordChecklist — komponen NON-DS (usulan di DS_GAPS.md).
 * Syarat password tampil sebagai checklist sebelum pengguna mengetik dan tercentang saat terpenuhi
 * (FR-AK-04, FR-LP-11, FR-UK-05). Tidak ada pesan error terpisah selama syarat belum terpenuhi (Tabel U-1).
 * Aturan diberikan pemakai (lib/password.ts) agar satu sumber untuk tiga konteks.
 */
import { Check, Circle } from 'lucide-react';
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
    <ul id={id} aria-label={label} className={cn('flex flex-col gap-1', className)}>
      {rules.map((r) => (
        <li key={r.id} className={cn('flex items-center gap-2 text-caption', r.met ? 'text-ink' : 'text-ink-subtle')}>
          {r.met ? (
            <Check aria-hidden size={14} strokeWidth={1.8} />
          ) : (
            <Circle aria-hidden size={14} strokeWidth={1.8} />
          )}
          <span>{r.label}</span>
          <span className="sr-only">: {r.met ? srStatus.met : srStatus.unmet}</span>
        </li>
      ))}
    </ul>
  );
}
