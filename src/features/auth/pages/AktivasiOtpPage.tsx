/**
 * Aktivasi Akun — Verifikasi email (OTP). PRD Aktivasi §4.3 (tab e34d9005-d913). Figma 116:144.
 * FR-AK-10 (email tersamar, "Aktifkan akun", hitung mundur), FR-AK-11 (aturan OTP sama dengan login, di service),
 * FR-AK-12 (Tabel E-2; batas salah → kembali ke Buat Password), FR-AK-14 (Diundang → Aktif, langsung masuk,
 * toast "Akun berhasil diaktifkan."), FR-AK-15 (meninggalkan halaman → ulang dari tautan).
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/components/patterns/Toast';
import { t } from '@/lib/i18n/id';
import { services } from '@/services';
import { SESSION_QUERY_KEY } from '../../session/SessionProvider';
import { landingPath } from '../../shell/navigation';
import { PublicFrame } from '../components/AuthFrame';
import { OtpForm } from '../components/OtpForm';
import { aktivasiCopy } from '../copy';
import type { AktivasiPageState } from './AktivasiPage';

export function AktivasiOtpPage() {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const back = `/aktivasi/${encodeURIComponent(token)}`;
  const challenge = useQuery({
    queryKey: ['activation-challenge', token],
    queryFn: () => services.activation.getActivationChallenge(token),
    staleTime: Infinity,
    retry: false,
  });

  if (challenge.isSuccess && !challenge.data) return <Navigate to={back} replace />;

  return (
    <PublicFrame>
      {challenge.data ? (
        <OtpForm
          context="aktivasi"
          challenge={challenge.data}
          verify={async (code) => {
            const session = await services.activation.verifyActivationOtp(token, code);
            await qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
            toast.show({ title: aktivasiCopy.sukses });
            navigate(landingPath(session.user.roles), { replace: true });
          }}
          resend={() => services.activation.resendActivationOtp(token)}
          onTerminalError={(e) => {
            // ASSUMPTION: batas kirim ulang di aktivasi diperlakukan sama dengan batas salah input (FR-AK-12).
            const state: AktivasiPageState =
              e.code === 'OTP_LOCKED' || e.code === 'OTP_RESEND_LIMIT' ? { otpTerkunci: true } : {};
            navigate(back, { replace: true, state });
          }}
          onBack={() => navigate(back)}
        />
      ) : (
        <p role="status" className="text-center text-body text-ink-muted">
          {t.app.memuat}
        </p>
      )}
    </PublicFrame>
  );
}
