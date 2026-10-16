/**
 * Form kode verifikasi — satu komponen untuk dua konteks (Technical Notes PRD Aktivasi: "satu service OTP,
 * dua konteks: activation dan login"). Tampilan Figma 118:235 (login) dan 116:144 (aktivasi).
 * FR-LG-11..17, -19, -20 (Tabel E-2); FR-AK-10..12.
 * Error terminal (batas salah input, batas kirim ulang, IP) diteruskan ke halaman lewat `onTerminalError`.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Callout } from '@/components/patterns/Callout';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { OtpField } from '@/components/patterns/OtpField';
import { formatHitungMundur } from '@/lib/format';
import { SECURITY_PARAMS } from '@/lib/security-params';
import { isServiceError, ServiceError, type OtpChallenge } from '@/services';
import { otpCopy as c } from '../copy';

export interface OtpFormProps {
  context: 'login' | 'aktivasi';
  challenge: OtpChallenge;
  verify: (code: string) => Promise<unknown>;
  resend: () => Promise<OtpChallenge>;
  /** Error yang mengakhiri langkah OTP (OTP_LOCKED, OTP_RESEND_LIMIT, OTP_SESSION_INVALID, IP_NOT_ALLOWED, TOKEN_*). */
  onTerminalError: (e: ServiceError) => void;
  /** Tautan kembali (FR-LG-19 / FR-AK-15). */
  onBack: () => void;
}

const FIELD_ERRORS = new Set(['VALIDATION', 'OTP_INVALID', 'OTP_EXPIRED']);

function useSecondsLeft(targetIso: string, serverNow: string): number {
  const offset = useRef(new Date(serverNow).getTime() - Date.now());
  useEffect(() => {
    offset.current = new Date(serverNow).getTime() - Date.now();
  }, [serverNow]);
  const calc = () => Math.max(0, (new Date(targetIso).getTime() - (Date.now() + offset.current)) / 1000);
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    setLeft(calc());
    const id = setInterval(() => setLeft(calc()), 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIso, serverNow]);
  return left;
}

export function OtpForm({ context, challenge: initial, verify, resend, onTerminalError, onBack }: OtpFormProps) {
  const toast = useToast();
  const copy = c[context];
  const [challenge, setChallenge] = useState(initial);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [alert, setAlert] = useState<{ title: string; body: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const secondsLeft = useSecondsLeft(challenge.resendAvailableAt, challenge.serverNow);
  const menit = Math.round(SECURITY_PARAMS.otpValidityMs / 60_000);

  useEffect(() => inputRef.current?.focus(), []);

  function fail(e: unknown) {
    if (!isServiceError(e)) {
      setAlert({ title: c.kendalaJudul, body: c.kendalaIsi });
      return;
    }
    if (e.code === 'OTP_INVALID') setError(c.salah(e.meta.remainingAttempts ?? 0));
    else if (e.code === 'OTP_EXPIRED') setError(c.kedaluwarsa);
    else if (e.code === 'VALIDATION') setError(c.kurang);
    else if (e.code === 'SEND_FAILED') setAlert({ title: c.gagalKirimJudul, body: c.gagalKirimIsi });
    else if (e.code === 'NETWORK') setAlert({ title: c.kendalaJudul, body: c.kendalaIsi });
    else if (e.code === 'OTP_RESEND_TOO_SOON') return;
    else return onTerminalError(e);
    if (FIELD_ERRORS.has(e.code)) {
      setCode('');
      inputRef.current?.focus();
    }
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (verifying) return;
    setAlert(null);
    if (!code) return (setError(c.kosong), inputRef.current?.focus());
    if (code.length < SECURITY_PARAMS.otpLength) return (setError(c.kurang), inputRef.current?.focus());
    setVerifying(true);
    try {
      await verify(code);
    } catch (e) {
      fail(e);
    } finally {
      setVerifying(false);
    }
  }

  async function onResend() {
    setAlert(null);
    setResending(true);
    try {
      const next = await resend();
      setChallenge(next);
      setError(undefined);
      setCode('');
      toast.show({ title: c.terkirimUlang });
      inputRef.current?.focus();
    } catch (e) {
      fail(e);
    } finally {
      setResending(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-center text-page-title text-ink">{copy.judul}</h1>
        <p className="text-center text-lead text-ink-subtle">{copy.isi(challenge.maskedEmail, menit)}</p>
      </div>
      {alert && (
        <Callout variant="error" title={alert.title}>
          {alert.body}
        </Callout>
      )}
      <OtpField
        ref={inputRef}
        label={c.label}
        length={SECURITY_PARAMS.otpLength}
        value={code}
        onChange={(v) => {
          setCode(v);
          if (error) setError(undefined);
        }}
        error={error}
        required
      />
      <Button type="submit" variant="primary" size="lg" block loading={verifying} loadingLabel={c.memproses} className="mt-2">
        {copy.tombol}
      </Button>
      <p className="text-center text-caption text-ink-muted" aria-live="polite">
        {c.belumMenerima}{' '}
        {secondsLeft > 0 ? (
          <span>
            {c.kirimUlangDalam.replace('{waktu}', '')}
            <strong className="font-semibold tabular-nums text-ink">{formatHitungMundur(secondsLeft)}</strong>
          </span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="link-inline disabled:opacity-[.45] focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            {c.kirimUlang}
          </button>
        )}
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mx-auto text-caption font-semibold text-ink underline-offset-[3px] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
      >
        {copy.kembali}
      </button>
    </form>
  );
}
