/**
 * Halaman publik dari tautan email (tanpa login) — PRD Ubah Data & Role Pengguna (ClickUp z8pmx9n8ny).
 * - /verifikasi-email/:token — FR-UDR-05: pengguna memverifikasi email baru yang diubah admin; setelah berlaku seluruh
 *   sesi dicabut, lalu diarahkan ke Login.
 * - /bukan-saya/:token — FR-UDR-13, -14: membatalkan permintaan ubah email dan mencabut seluruh sesi akun.
 * Tidak ada Figma: look & feel halaman tautan Aktivasi/Atur Ulang (Figma 66:2602, ilustrasi 78:4289/78:4323) — PR-11.
 * Kedua halaman meminta konfirmasi dulu agar pemindai tautan email tidak menjalankan aksi otomatis (disetujui PM 14 Okt 2026).
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Callout } from '@/components/patterns/Callout';
import { StatePanel } from '@/components/patterns/StatePanel';
import { Button } from '@/components/ui/Button';
import { services } from '@/services';
import { PublicFrame } from '../auth/components/AuthFrame';
import { Illustration } from '../auth/components/Illustration';
import type { LoginRedirectState } from '../session/SessionProvider';
import { emailLinkCopy as c } from './copy';

function LinkState({ state }: { state: 'invalid' | 'used' }) {
  const navigate = useNavigate();
  return (
    <StatePanel
      align="center"
      media={<Illustration kind={state} />}
      title={state === 'used' ? c.dipakaiJudul : c.tidakValidJudul}
      description={state === 'used' ? c.dipakaiIsi : c.tidakValidIsi}
      actions={
        <Button variant="primary" block onClick={() => navigate('/masuk')}>
          {c.masuk}
        </Button>
      }
    />
  );
}

export function VerifikasiEmailPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const check = useQuery({ queryKey: ['email-link', 'verify', token], queryFn: () => services.emailLinks.checkVerifyLink(token), retry: false });
  const confirm = useMutation({
    mutationFn: () => services.emailLinks.confirmVerifyLink(token),
    onSuccess: () => {
      const state: LoginRedirectState = { notice: c.verifikasiSukses };
      navigate('/masuk', { replace: true, state });
    },
  });

  return (
    <PublicFrame width="state">
      {check.isPending ? (
        <p role="status" className="text-body text-ink-muted">{c.memuat}</p>
      ) : check.data?.state !== 'valid' ? (
        <LinkState state={check.data?.state === 'used' ? 'used' : 'invalid'} />
      ) : (
        <StatePanel
          align="center"
          title={c.verifikasiJudul}
          description={c.verifikasiIsi(check.data.emailBaru ?? '')}
          actions={
            <div className="flex w-full flex-col gap-3">
              {confirm.isError && <Callout variant="error" title={c.gagalJudul}>{c.gagalIsi}</Callout>}
              <Button variant="primary" block onClick={() => confirm.mutate()} loading={confirm.isPending} loadingLabel={c.memproses}>
                {c.verifikasi}
              </Button>
            </div>
          }
        />
      )}
    </PublicFrame>
  );
}

export function BukanSayaPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const check = useQuery({ queryKey: ['email-link', 'notme', token], queryFn: () => services.emailLinks.checkNotMeLink(token), retry: false });
  const confirm = useMutation({
    mutationFn: () => services.emailLinks.confirmNotMe(token),
    onSuccess: () => {
      const state: LoginRedirectState = { notice: c.bukanSayaSukses };
      navigate('/masuk', { replace: true, state });
    },
  });

  return (
    <PublicFrame width="state">
      {check.isPending ? (
        <p role="status" className="text-body text-ink-muted">{c.memuat}</p>
      ) : check.data?.state !== 'valid' ? (
        <LinkState state={check.data?.state === 'used' ? 'used' : 'invalid'} />
      ) : (
        <StatePanel
          align="center"
          title={c.bukanSayaJudul}
          description={c.bukanSayaIsi}
          actions={
            <div className="flex w-full flex-col gap-3">
              {confirm.isError && <Callout variant="error" title={c.gagalJudul}>{c.gagalIsi}</Callout>}
              <Button variant="primary" block onClick={() => confirm.mutate()} loading={confirm.isPending} loadingLabel={c.memproses}>
                {c.bukanSayaAksi}
              </Button>
            </div>
          }
        />
      )}
    </PublicFrame>
  );
}
