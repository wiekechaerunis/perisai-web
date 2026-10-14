/**
 * Aktivasi Akun — Buat Password. PRD tab e34d9005-d913, ClickUp z8pmx9n51n.
 * Figma: 66:2602 & 82:4627 (Buat Password + strength meter), 66:2546 (Tautan tidak valid),
 * 66:2569 (Akun sudah aktif), 66:2582 (Undangan tidak berlaku lagi + toast permintaan terkirim).
 * FR-AK-01 (state Tabel T-1), FR-AK-02 (Butuh Bantuan? Hubungi Support di header), FR-AK-03..07 (form, syarat,
 * strength meter, password umum, Tabel V-2), FR-AK-08 (email read-only), FR-AK-09 (simpan pending → OTP),
 * FR-AK-12 (kembali ke sini setelah batas salah OTP), FR-AK-15 (ulang dari tautan), FR-AK-16/17 (minta undangan baru).
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Callout } from '@/components/patterns/Callout';
import { StatePanel } from '@/components/patterns/StatePanel';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { t } from '@/lib/i18n/id';
import { meetsPolicy, PASSWORD_MIN_LENGTH } from '@/lib/password';
import type { InviteTokenState } from '@/lib/status';
import { isServiceError, services } from '@/services';
import { PublicFrame } from '../components/AuthFrame';
import { Illustration } from '../components/Illustration';
import { NewPasswordField } from '../components/NewPasswordFields';
import { aktivasiCopy as c, passwordCopy } from '../copy';

export interface AktivasiPageState {
  otpTerkunci?: boolean;
}

function TokenState({ state, token }: { state: Exclude<InviteTokenState, 'valid'>; token: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const request = useMutation({
    mutationFn: () => services.activation.requestNewInvite(token),
    onSuccess: () => toast.show({ title: c.mintaTerkirim }),
  });

  if (state === 'invalid') {
    return <StatePanel align="center" media={<Illustration kind="invalid" />} title={c.tidakValidJudul} description={c.tidakValidIsi} />;
  }
  if (state === 'used') {
    return (
      <StatePanel
        align="center"
        media={<Illustration kind="used" />}
        title={c.sudahAktifJudul}
        description={c.sudahAktifIsi}
        actions={
          <Button variant="primary" block onClick={() => navigate('/masuk')}>
            {c.masuk}
          </Button>
        }
      />
    );
  }
  return (
    <StatePanel
      align="center"
      media={<Illustration kind="expired" />}
      title={c.kedaluwarsaJudul}
      description={c.kedaluwarsaIsi.map((l) => (
        <span key={l} className="block">
          {l}
        </span>
      ))}
      actions={
        <>
          {request.isError && (
            <Callout variant="error" title={c.kendalaJudul}>
              {c.kendalaIsi}
            </Callout>
          )}
          <Button variant="primary" block loading={request.isPending} loadingLabel={c.mengirim} onClick={() => request.mutate()}>
            {c.mintaUndangan}
          </Button>
        </>
      }
    />
  );
}

export function AktivasiPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [incoming] = useState(() => (location.state ?? {}) as AktivasiPageState);
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const invite = useQuery({ queryKey: ['invite', token], queryFn: () => services.activation.checkInvite(token), retry: false });
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ pw?: string; confirm?: string }>({});
  const [lateState, setLateState] = useState<Exclude<InviteTokenState, 'valid'> | null>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const save = useMutation({
    mutationFn: () => services.activation.setPendingPassword(token, pw),
    onSuccess: (challenge) => navigate(`/aktivasi/${encodeURIComponent(token)}/verifikasi`, { state: challenge }),
    onError: (e) => {
      if (isServiceError(e, 'COMMON_PASSWORD')) setErrors({ pw: c.terlaluUmum });
      // Tabel V-2: token kedaluwarsa saat submit → state "Undangan tidak berlaku lagi" (halaman penuh).
      else if (isServiceError(e, 'TOKEN_EXPIRED')) setLateState('expired');
      else if (isServiceError(e, 'TOKEN_USED')) setLateState('used');
      else if (isServiceError(e, 'TOKEN_INVALID')) setLateState('invalid');
      else return;
      pwRef.current?.focus();
    },
  });

  const mismatch = confirm.length > 0 && confirm !== pw;
  const canSubmit = meetsPolicy(pw) && confirm.length > 0 && !mismatch;

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (save.isPending) return;
    const fe: typeof errors = {};
    if (!pw) fe.pw = c.baruKosong;
    else if (pw.length < PASSWORD_MIN_LENGTH) fe.pw = c.kurangDari8;
    if (!confirm) fe.confirm = c.konfirmasiKosong;
    else if (mismatch) fe.confirm = c.konfirmasiTidakCocok;
    setErrors(fe);
    if (fe.pw) return pwRef.current?.focus();
    if (fe.confirm) return confirmRef.current?.focus();
    if (canSubmit) save.mutate();
  }

  const state = lateState ?? (invite.data && invite.data.state !== 'valid' ? invite.data.state : null);

  let body;
  if (invite.isPending) body = <p role="status" className="text-center text-body text-ink-muted">{t.app.memuat}</p>;
  else if (invite.isError)
    body = (
      <Callout variant="error" title={c.kendalaJudul}>
        {c.kendalaIsi}
      </Callout>
    );
  else if (state) body = <TokenState state={state} token={token} />;
  else {
    const d = c.deskripsi(invite.data!.email ?? '');
    body = (
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-heading-1 text-ink">{c.judul}</h1>
          {/* FR-AK-08: email akun read-only */}
          <p className="text-body-dense text-ink-muted">
            {d.before}
            <strong className="font-semibold text-ink">{d.email}</strong>
            <br />
            {d.after.trim()}
          </p>
        </div>
        {incoming.otpTerkunci && (
          <Callout variant="error" title="">
            {c.otpTerkunci}
          </Callout>
        )}
        <div className="flex flex-col gap-[18px]">
          <NewPasswordField
            ref={pwRef}
            label={c.baru}
            placeholder={c.placeholder}
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setErrors((p) => ({ ...p, pw: undefined }));
            }}
            error={errors.pw}
            required
          />
          <TextField
            ref={confirmRef}
            label={c.konfirmasi}
            type="password"
            revealable
            revealLabels={passwordCopy.reveal}
            autoComplete="new-password"
            placeholder={c.placeholder}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setErrors((p) => ({ ...p, confirm: undefined }));
            }}
            onBlur={() => mismatch && setErrors((p) => ({ ...p, confirm: c.konfirmasiTidakCocok }))}
            error={errors.confirm}
            required
          />
        </div>
        {/* FR-AK-04: tombol aktif hanya bila semua syarat terpenuhi */}
        <Button type="submit" variant="primary" block disabled={!canSubmit} loading={save.isPending} loadingLabel={c.menyimpan}>
          {c.simpan}
        </Button>
      </form>
    );
  }

  return <PublicFrame width={state ? 'state' : 'form'}>{body}</PublicFrame>;
}
