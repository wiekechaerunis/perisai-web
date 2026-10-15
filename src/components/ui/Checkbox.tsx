/**
 * Checkbox — pilihan ya/tidak, mis. filter cepat "Hanya kegagalan login beruntun". Pola Filter daftar DS: filter
 * ya/tidak memakai Checkbox, bukan tombol toggle. Kotak 16px berwarna `action` saat dicentang; label 13px `ink`;
 * area klik mencakup label.
 */
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, id, className, ...rest }, ref) {
  const autoId = useId();
  const cid = id ?? autoId;
  return (
    <label htmlFor={cid} className={cn('inline-flex min-h-6 cursor-pointer items-center gap-2 text-[13px] text-ink', className)}>
      <input ref={ref} id={cid} type="checkbox" className="h-4 w-4 shrink-0 cursor-pointer accent-action" {...rest} />
      {label}
    </label>
  );
});
