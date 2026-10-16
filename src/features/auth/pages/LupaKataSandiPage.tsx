/**
 * Lupa Kata Sandi — permintaan reset. PRD tab f014a7ff-c6e8, ClickUp z8pmx9n8p6.
 * FR-LP-01 (field Email + "Kirim tautan", tanpa login), FR-LP-02 (pesan seragam, anti-enumerasi),
 * FR-LP-03/05 (penyaringan status & batas permintaan di service, pesan tetap sama),
 * FR-LP-04 (validasi Tabel L-2), FR-LP-06 (kembali ke Login).
 * Desain: "Design belum ada" → mengikuti look & feel Figma OTP/Aktivasi 118:235, 66:2602 (PR-11, keputusan 14 Okt 2026).
 */
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Callout } from '@/components/patterns/Callout';
import { StatePanel } from '@/components/patterns/StatePanel';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { services } from '@/services';
import { PublicFrame } from '../components/AuthFrame';
import { EMAIL_PATTERN, lupaCopy as c } from '../copy';

function validate(email: string): string | undefined {
  if (!email.trim()) return c.emailKosong;
  if (!EMAIL_PATTERN.test(email.trim())) return c.emailFormat;
  return undefined;
}

export function BackToLogin() {
  return (
    <Link
      to="/masuk"
      className="inline-flex items-center gap-1 text-body text-ink underline-offset-2 hover:underline"
    >
      <ArrowLeft aria-hidden size={16} strokeWidth={1.8} />
      {c.kembali}
    </Link>
  );
}

export function LupaKataSandiPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useMutation({ mutationFn: (e: string) => services.password.requestReset(e) });

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const err = validate(email);
    setError(err);
    if (err) {
      inputRef.current?.focus();
      return;
    }
    mutation.mutate(email);
  }

  if (mutation.isSuccess) {
    return (
      <PublicFrame>
        <StatePanel
          align="center"
          illustration="berhasil"
          title={c.terkirimJudul}
          description={c.terkirim}
          actions={<BackToLogin />}
        />
      </PublicFrame>
    );
  }

  return (
    <PublicFrame>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-center text-page-title text-ink">{c.judul}</h1>
          <p className="text-center text-lead text-ink-subtle">{c.keterangan}</p>
        </div>
        {mutation.isError && (
          <Callout variant="error" title={c.kendalaJudul}>
            {c.kendalaIsi}
          </Callout>
        )}
        <TextField
          size="lg"
          ref={inputRef}
          label={c.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(undefined);
          }}
          hint={c.emailHint}
          error={error}
          required
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          block
          loading={mutation.isPending}
          loadingLabel={c.mengirim}
        >
          {c.kirim}
        </Button>
        <BackToLogin />
      </form>
    </PublicFrame>
  );
}
