/**
 * Ubah Kata Sandi — PRD tab 3e073786-4ce5, ClickUp z8pmx9n8p7.
 * FR-UK-01 (menu di Pengaturan akun, semua role), FR-UK-02/03 (akun sendiri, sesi berlaku — ditegakkan service),
 * FR-UK-04..08 (form, syarat identik aktivasi, validasi U-1, beda dari lama, kunci 15 menit),
 * FR-UK-09..11 (sesi lain dicabut, tautan reset dibatalkan, toast sukses tanpa login ulang).
 * Desain: dialog "Ubah kata sandi" dari tab Keamanan masuk Akun Saya (Figma 341:7112). Syarat password mengikuti PRD
 * (8 karakter, FR-UK-05), bukan usulan Figma "Minimal 12 karakter" (F-33).
 */
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Dialog } from '@/components/patterns/Dialog';
import { Callout } from '@/components/patterns/Callout';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { meetsPolicy } from '@/lib/password';
import { isServiceError, services } from '@/services';
import { NewPasswordField } from '../auth/components/NewPasswordFields';
import { passwordCopy } from '../auth/copy';
import { accountCopy } from './copy';

const c = accountCopy.ubah;

type FieldErrors = Partial<Record<'current' | 'next' | 'confirm', string>>;

export function UbahKataSandiDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<{ title: string; body: string } | null>(null);
  const refs = { current: useRef<HTMLInputElement>(null), next: useRef<HTMLInputElement>(null), confirm: useRef<HTMLInputElement>(null) };

  const confirmMismatch = confirm.length > 0 && confirm !== next;
  // FR-UK-04: tombol nonaktif sampai seluruh field terisi dan syarat terpenuhi.
  const canSubmit = current.length > 0 && meetsPolicy(next) && confirm.length > 0 && !confirmMismatch;

  const focusFirst = (e: FieldErrors) => {
    const first = (['current', 'next', 'confirm'] as const).find((k) => e[k]);
    if (first) refs[first].current?.focus();
  };

  const mutation = useMutation({
    mutationFn: () => services.password.changePassword({ current, next }),
    onSuccess: () => {
      setCurrent('');
      setNext('');
      setConfirm('');
      setErrors({});
      setAlert(null);
      onOpenChange(false);
      toast.show({ title: c.sukses });
    },
    onError: (e) => {
      setAlert(null);
      let fe: FieldErrors = {};
      if (isServiceError(e, 'CURRENT_PASSWORD_WRONG')) fe = { current: c.saatIniSalah };
      else if (isServiceError(e, 'COMMON_PASSWORD')) fe = { next: c.terlaluUmum };
      else if (isServiceError(e, 'SAME_AS_CURRENT')) fe = { next: c.samaDenganLama };
      else if (isServiceError(e, 'CHANGE_PASSWORD_LOCKED')) {
        const menit = e.meta.retryAt ? Math.max(1, Math.ceil((new Date(e.meta.retryAt).getTime() - Date.now()) / 60_000)) : 15;
        setAlert({ title: c.terkunciJudul, body: c.terkunciIsi(menit) });
      } else if (isServiceError(e, 'SESSION_EXPIRED')) {
        return; // SessionProvider mengarahkan ke Login (FR-UK-03)
      } else setAlert({ title: c.kendalaJudul, body: c.kendalaIsi });
      setErrors(fe);
      focusFirst(fe);
    },
  });

  useEffect(() => {
    if (!open) return;
    setCurrent('');
    setNext('');
    setConfirm('');
    setErrors({});
    setAlert(null);
  }, [open]);

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const fe: FieldErrors = {};
    if (!current) fe.current = c.saatIniKosong;
    if (!next) fe.next = c.baruKosong;
    if (confirm && confirm !== next) fe.confirm = c.konfirmasiTidakCocok;
    if (Object.keys(fe).length) {
      setErrors(fe);
      focusFirst(fe);
      return;
    }
    if (!canSubmit) return;
    mutation.mutate();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}
      title={c.judul}
      description={c.keterangan}
      closeLabel={c.batal}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            {c.batal}
          </Button>
          <Button type="submit" form="form-ubah-sandi" variant="primary" disabled={!canSubmit} loading={mutation.isPending} loadingLabel={c.menyimpan}>
            {c.simpan}
          </Button>
        </>
      }
    >
      <form id="form-ubah-sandi" noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        {alert && (
          <Callout variant="error" size="compact" title={alert.title}>
            {alert.body}
          </Callout>
        )}
        <TextField
          ref={refs.current}
          label={c.saatIni}
          type="password"
          revealable
          revealLabels={passwordCopy.reveal}
          autoComplete="current-password"
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value);
            setErrors((p) => ({ ...p, current: undefined }));
          }}
          onBlur={() => !current && setErrors((p) => ({ ...p, current: c.saatIniKosong }))}
          error={errors.current}
          required
        />
        <NewPasswordField
          ref={refs.next}
          label={c.baru}
          value={next}
          onChange={(e) => {
            setNext(e.target.value);
            setErrors((p) => ({ ...p, next: undefined }));
          }}
          onBlur={() => !next && setErrors((p) => ({ ...p, next: c.baruKosong }))}
          error={errors.next}
          required
        />
        <TextField
          ref={refs.confirm}
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
          onBlur={() => confirmMismatch && setErrors((p) => ({ ...p, confirm: c.konfirmasiTidakCocok }))}
          error={errors.confirm ?? (confirmMismatch && confirm.length >= next.length ? c.konfirmasiTidakCocok : undefined)}
          required
        />
      </form>
    </Dialog>
  );
}
