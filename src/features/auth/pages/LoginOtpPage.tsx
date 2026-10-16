/**
 * Verifikasi OTP login — PRD Login §4.4 (tab 7b7a3b46-65b2). Figma 118:235.
 * FR-LG-11 (email tersamar), FR-LG-12..16 (aturan OTP, di service; field angka + one-time-code),
 * FR-LG-17 (tombol "Verifikasi"), FR-LG-18 (hanya setelah langkah password), FR-LG-19 (kembali, batalkan sesi OTP),
 * FR-LG-20 (Tabel E-2), FR-LG-10b (IP diperiksa setelah OTP), FR-LG-25/28 (pendaratan / kembali ke tujuan).
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n/id';
import { services, type LoginChallenge } from '@/services';
import { consumeReturnTo, SESSION_QUERY_KEY } from '../../session/SessionProvider';
import { allowedReturnPath } from '../../shell/navigation';
import { PublicFrame } from '../components/AuthFrame';
import { OtpForm } from '../components/OtpForm';
import type { LoginAlertCode } from '../copy';
import { clearPreAuth, readPreAuth } from '../preauth';
import type { LoginPageState } from './LoginPage';

const TERMINAL: Partial<Record<string, LoginAlertCode>> = {
  OTP_LOCKED: 'OTP_LOCKED',
  OTP_RESEND_LIMIT: 'OTP_RESEND_LIMIT',
  IP_NOT_ALLOWED: 'IP_NOT_ALLOWED',
};

export function LoginOtpPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const preAuthId = readPreAuth();
  const challenge = useQuery({
    queryKey: ['login-challenge', preAuthId],
    queryFn: () => services.auth.getLoginChallenge(preAuthId!),
    enabled: !!preAuthId,
    staleTime: Infinity,
    retry: false,
  });

  // FR-LG-18: tanpa langkah password → kembali ke Login.
  if (!preAuthId || (challenge.isSuccess && !challenge.data))
    return <Navigate to="/masuk" replace />;

  const backToLogin = (alert?: LoginAlertCode) => {
    clearPreAuth();
    const state: LoginPageState = alert ? { alert } : {};
    navigate('/masuk', { replace: true, state });
  };

  return (
    <PublicFrame>
      {challenge.data ? (
        <OtpForm
          context="login"
          challenge={challenge.data}
          verify={async (code) => {
            const session = await services.auth.verifyLoginOtp(preAuthId, code);
            clearPreAuth();
            await qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
            navigate(allowedReturnPath(consumeReturnTo(), session.user.roles), { replace: true });
          }}
          resend={async () => {
            const next: LoginChallenge = await services.auth.resendLoginOtp(preAuthId);
            return next;
          }}
          onTerminalError={(e) => backToLogin(TERMINAL[e.code])}
          onBack={() => {
            void services.auth.cancelLoginOtp(preAuthId);
            backToLogin();
          }}
        />
      ) : (
        <p role="status" className="text-center text-body text-ink-muted">
          {t.app.memuat}
        </p>
      )}
    </PublicFrame>
  );
}
