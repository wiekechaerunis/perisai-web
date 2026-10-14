/**
 * Field password baru + konfirmasi dengan checklist syarat dan strength meter.
 * Satu komponen untuk tiga konteks (Technical Notes PRD Lupa/Ubah Kata Sandi, Aktivasi):
 * FR-AK-03..05, FR-LP-11, FR-UK-04..05. Aturan dari lib/password.ts.
 */
import { forwardRef, useId } from 'react';
import { PasswordChecklist } from '@/components/patterns/PasswordChecklist';
import { PasswordStrengthMeter } from '@/components/patterns/PasswordStrengthMeter';
import { TextField, type TextFieldProps } from '@/components/ui/TextField';
import { PASSWORD_RULES, passwordStrength } from '@/lib/password';
import { passwordCopy as c } from '../copy';

export interface NewPasswordFieldProps extends Omit<TextFieldProps, 'type' | 'revealable' | 'value'> {
  value: string;
}

/** Field password baru: checklist tampil sejak awal (sebelum mengetik), strength meter real-time. */
export const NewPasswordField = forwardRef<HTMLInputElement, NewPasswordFieldProps>(function NewPasswordField(
  { value, ...rest },
  ref,
) {
  const checklistId = useId();
  const strength = passwordStrength(value);
  return (
    <div className="flex flex-col gap-2">
      <TextField
        ref={ref}
        type="password"
        revealable
        revealLabels={c.reveal}
        autoComplete="new-password"
        value={value}
        aria-describedby={checklistId}
        {...rest}
      />
      <PasswordStrengthMeter bars={strength.bars} label={strength.label} weak={strength.label === 'Lemah'} srPrefix={c.kekuatan} />
      <PasswordChecklist
        id={checklistId}
        label={c.syarat}
        srStatus={c.syaratStatus}
        rules={PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, met: r.test(value) }))}
      />
    </div>
  );
});
