/**
 * Ubah email lewat permintaan — FR-AS-009 (konfirmasi kata sandi → email baru → kode verifikasi 10 menit),
 * FR-AS-010 (status permintaan). PRD menyebut frame ini belum ada di Figma ("Perlu frame tambahan"); tampilan
 * mengikuti pola dialog Akun Saya (Figma 341:6741, "Verifikasi ulang identitas") — PR-11.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Dialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { SECURITY_PARAMS } from '@/lib/security-params';
import { isServiceError, services, type MyAccount } from '@/services';
import { EMAIL_PATTERN, otpCopy, passwordCopy } from '../auth/copy';
import { akunSayaCopy } from './akunSayaCopy';

const c = akunSayaCopy.email;

export interface EmailChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  me: MyAccount;
  /** Langsung ke langkah kode (permintaan sudah ada, status Menunggu Verifikasi). */
  startAtCode?: boolean;
  onChanged: () => void;
}

type Step = 'sandi' | 'email' | 'kode';

export function EmailChangeDialog({ open, onOpenChange, me, startAtCode, onChanged }: EmailChangeDialogProps) {
  const toast = useToast();
  const [step, setStep] = useState<Step>('sandi');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(startAtCode ? 'kode' : 'sandi');
    setPassword('');
    setEmail(me.permintaanEmail?.emailBaru ?? '');
    setCode('');
    setError(undefined);
  }, [open, startAtCode, me.permintaanEmail?.emailBaru]);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setError(undefined);
    if (step === 'sandi') {
      if (!password) return setError(c.sandiKosong);
      return setStep('email');
    }
    if (step === 'email') {
      const e = email.trim().toLowerCase();
      if (!e) return setError(c.emailKosong);
      if (!EMAIL_PATTERN.test(e)) return setError(c.emailFormat);
      setBusy(true);
      try {
        await services.account.requestEmailChange({ password, emailBaru: e });
        setStep('kode');
        onChanged();
      } catch (err) {
        if (isServiceError(err, 'CURRENT_PASSWORD_WRONG')) {
          setStep('sandi');
          setError(c.sandiSalah);
        } else if (isServiceError(err, 'EMAIL_PERSONAL') || isServiceError(err, 'EMAIL_DOMAIN_NOT_ALLOWED')) setError(c.emailDomain);
        else if (isServiceError(err, 'EMAIL_SAME')) setError(c.emailSama);
        else if (isServiceError(err, 'RATE_LIMITED')) setError(c.batasPermintaan);
        else if (isServiceError(err, 'EMAIL_REGISTERED')) setError(c.emailDipakai);
        else if (isServiceError(err, 'EMAIL_REQUEST_PENDING')) setError(c.sedangDiproses);
        else setError(otpCopy.kendalaIsi);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!code) return setError(otpCopy.kosong);
    if (code.length < SECURITY_PARAMS.otpLength) return setError(otpCopy.kurang);
    setBusy(true);
    try {
      const after = await services.account.verifyEmailChange(code);
      onChanged();
      onOpenChange(false);
      toast.show({ title: after.permintaanEmail?.status === 'Menunggu Persetujuan' ? c.menungguPersetujuan : c.langsungBerlaku });
    } catch (err) {
      if (isServiceError(err, 'OTP_INVALID')) setError(c.kodeSalah);
      else if (isServiceError(err, 'OTP_EXPIRED')) setError(c.kodeKedaluwarsa);
      else if (isServiceError(err, 'OTP_LOCKED') || isServiceError(err, 'OTP_SESSION_INVALID')) {
        onChanged();
        onOpenChange(false);
      } else setError(otpCopy.kendalaIsi);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError(undefined);
    try {
      await services.account.resendEmailCode();
      toast.show({ title: c.kodeTerkirim });
    } catch {
      setError(otpCopy.kendalaIsi);
    }
  }

  const desc = step === 'sandi' ? c.langkahSandi : step === 'email' ? c.langkahEmail : c.langkahKode(email || me.permintaanEmail?.emailBaru || '');
  const primary = step === 'sandi' ? c.lanjutkan : step === 'email' ? c.kirimKode : c.verifikasi;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title={c.judul}
      description={desc}
      closeLabel={c.batal}
      footer={
        <>
          {step === 'kode' && (
            <Button variant="quiet" onClick={resend} disabled={busy}>
              {c.kirimUlang}
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} disabled={busy}>
            {c.batal}
          </Button>
          <Button variant="primary" type="submit" form="form-ubah-email" loading={busy} loadingLabel={c.memproses}>
            {primary}
          </Button>
        </>
      }
    >
      <form id="form-ubah-email" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        {step === 'sandi' && (
          <TextField
            label={c.sandi}
            type="password"
            revealable
            revealLabels={passwordCopy.reveal}
            autoComplete="current-password"
            placeholder={c.sandiPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            autoFocus
          />
        )}
        {step === 'email' && (
          <TextField label={c.emailBaru} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} autoFocus />
        )}
        {step === 'kode' && (
          <TextField
            label={c.kode}
            size="lg"
            digitsOnly
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={SECURITY_PARAMS.otpLength}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={error}
            autoFocus
          />
        )}
      </form>
    </Dialog>
  );
}
