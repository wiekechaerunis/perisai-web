/**
 * Checkbox — pilihan ya/tidak, mis. filter cepat "Hanya kegagalan login beruntun". Pola Filter daftar DS: filter
 * ya/tidak memakai Checkbox, bukan tombol toggle. DS v2 · Lime `Checkbox`: kotak 16px `radius-xs` garis 1,5px
 * `border-control`; tercentang latar `ink` + centang `surface` (bukan lime). Gaya kotak ada di styles/index.css
 * (berlaku untuk semua input checkbox/radio). Area klik mencakup label, jarak 8px.
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
    <label htmlFor={cid} className={cn('inline-flex min-h-6 cursor-pointer items-center gap-2 text-body text-ink', className)}>
      <input ref={ref} id={cid} type="checkbox" className="shrink-0" {...rest} />
      {label}
    </label>
  );
});
