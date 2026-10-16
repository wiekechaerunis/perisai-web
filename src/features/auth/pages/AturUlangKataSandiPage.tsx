/**
 * Atur Ulang Kata Sandi — PRD Lupa Kata Sandi §4.3 (tab f014a7ff-c6e8, ClickUp z8pmx9n8p6).
 * FR-LP-10 (state Tabel L-3), FR-LP-11 (form + checklist + strength meter sama dengan aktivasi),
 * FR-LP-12 (validasi Tabel V-2 Aktivasi), FR-LP-13 (beda dari password berlaku),
 * FR-LP-14 (tautan terpakai, seluruh sesi dicabut, ke Login dengan pesan sukses).
 * Desain: "Design belum ada" → mengikuti look & feel Figma Login/Aktivasi (PR-11).
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Callout } from '@/components/patterns/Callout';
import { StatePanel } from '@/components/patterns/StatePanel';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { t } from '@/lib/i18n/id';
import { meetsPolicy } from '@/lib/password';
import type { ResetTokenState } from '@/lib/status';
import { isServiceError, services } from '@/services';
import type { LoginRedirectState } from '../../session/SessionProvider';
import { PublicFrame } from '../components/AuthFrame';
import { Illustration } from '../components/Illustration';
import { NewPasswordField } from '../components/NewPasswordFields';
import { aturUlangCopy as c, passwordCopy } from '../copy';

function TokenState({ state }: { state: Exclude<ResetTokenState, 'valid'> }) {
  const navigate = useNavigate();
  const map = {
    invalid: {
      title: c.tidakValidJudul,
      body: c.tidakValidIsi,
      cta: c.mintaBaru,
      to: '/lupa-kata-sandi',
    },
    used: { title: c.dipakaiJudul, body: c.dipakaiIsi, cta: c.masuk, to: '/masuk' },
    expired: {
      title: c.kedaluwarsaJudul,
      body: c.kedaluwarsaIsi,
      cta: c.mintaBaru,
      to: '/lupa-kata-sandi',
    },
  } as const;
  const s = map[state];
  return (
    <StatePanel
      align="center"
      media={<Illustration kind={state} />}
      title={s.title}
      description={s.body}
      actions={
        <Button variant="primary" block onClick={() => navigate(s.to)}>
          {s.cta}
        </Button>
      }
    />
  );
}

export function AturUlangKataSandiPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const check = useQuery({
    queryKey: ['reset-token', token],
    queryFn: () => services.password.checkResetToken(token),
    retry: false,
  });

  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ pw?: string; confirm?: string }>({});
  const [expiredDuringSubmit, setExpired] = useState<Exclude<ResetTokenState, 'valid'> | null>(
    null,
  );
  const pwRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: () => services.password.resetPassword(token, pw),
    onSuccess: () => {
      const state: LoginRedirectState = { notice: c.sukses };
      navigate('/masuk', { replace: true, state });
    },
    onError: (e) => {
      if (isServiceError(e, 'COMMON_PASSWORD')) setErrors({ pw: c.terlaluUmum });
      else if (isServiceError(e, 'SAME_AS_CURRENT')) setErrors({ pw: c.samaDenganLama });
      else if (isServiceError(e, 'TOKEN_EXPIRED')) setExpired('expired');
      else if (isServiceError(e, 'TOKEN_USED')) setExpired('used');
      else if (isServiceError(e, 'TOKEN_INVALID')) setExpired('invalid');
      else return;
      pwRef.current?.focus();
    },
  });

  const mismatch = confirm.length > 0 && confirm !== pw;
  const canSubmit = meetsPolicy(pw) && confirm.length > 0 && !mismatch;

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const fe: typeof errors = {};
    if (!pw) fe.pw = c.baruKosong;
    if (!confirm) fe.confirm = c.konfirmasiKosong;
    else if (mismatch) fe.confirm = c.konfirmasiTidakCocok;
    setErrors(fe);
    if (fe.pw) return pwRef.current?.focus();
    if (fe.confirm) return confirmRef.current?.focus();
    if (canSubmit) mutation.mutate();
  }

  let body;
  if (check.isPending)
    body = (
      <p role="status" className="text-body text-ink-muted">
        {t.app.memuat}
      </p>
    );
  else if (check.isError)
    body = (
      <Callout variant="error" title={c.kendalaJudul}>
        {c.kendalaIsi}
      </Callout>
    );
  else if (expiredDuringSubmit) body = <TokenState state={expiredDuringSubmit} />;
  else if (check.data !== 'valid') body = <TokenState state={check.data} />;
  else
    body = (
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-center text-page-title text-ink">{c.judul}</h1>
          <p className="text-center text-lead text-ink-subtle">{c.keterangan}</p>
        </div>
        {mutation.isError && !errors.pw && !expiredDuringSubmit && (
          <Callout variant="error" title={c.kendalaJudul}>
            {c.kendalaIsi}
          </Callout>
        )}
        <NewPasswordField
          ref={pwRef}
          label={c.baru}
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setErrors((p) => ({ ...p, pw: undefined }));
          }}
          error={errors.pw}
          required
        />
        <TextField
          size="lg"
          ref={confirmRef}
          label={c.konfirmasi}
          type="password"
          revealable
          revealLabels={passwordCopy.reveal}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setErrors((p) => ({ ...p, confirm: undefined }));
          }}
          onBlur={() => mismatch && setErrors((p) => ({ ...p, confirm: c.konfirmasiTidakCocok }))}
          error={errors.confirm}
          required
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          block
          disabled={!canSubmit}
          loading={mutation.isPending}
          loadingLabel={c.menyimpan}
        >
          {c.simpan}
        </Button>
      </form>
    );

  return (
    <PublicFrame
      width={expiredDuringSubmit || (check.data && check.data !== 'valid') ? 'state' : 'form'}
    >
      {body}
    </PublicFrame>
  );
}
