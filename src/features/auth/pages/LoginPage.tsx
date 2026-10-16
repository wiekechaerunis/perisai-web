/**
 * Login PERISAI — PRD tab 7b7a3b46-65b2, ClickUp z8pmx9n50h. Figma 85:4794 (default), 85:4880 (error bawah
 * field), 85:4906 (alert di atas form).
 * FR-LG-01 (Email, Kata sandi, Masuk, Lupa kata sandi?), FR-LG-02 (toggle), FR-LG-03 (loading, tanpa klik ganda),
 * FR-LG-04 (Enter submit), FR-LG-05..07 (Tabel E-1; pesan identik; status setelah password benar — di service),
 * FR-LG-08 (tautan Support), FR-LG-09..10b (status akun/organisasi/IP — di service), FR-LG-22 (lockout),
 * FR-LO-03/08/17 + FR-LP-14 (pesan setelah logout/timeout/dicabut/reset).
 * NFR aksesibilitas: error diumumkan (aria-live/role=alert), fokus ke field/alert pertama yang error.
 */
import { useMutation } from '@tanstack/react-query';
import { Lock, Mail } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { isServiceError, services } from '@/services';
import { sessionCopy } from '../../session/copy';
import { useSession, type LoginRedirectState } from '../../session/SessionProvider';
import { landingPath } from '../../shell/navigation';
import { LoginFrame } from '../components/AuthFrame';
import { LoginAlert } from '../components/LoginAlert';
import { EMAIL_PATTERN, loginCopy as c, passwordCopy, type LoginAlertCode } from '../copy';
import { savePreAuth } from '../preauth';

/** State navigasi ke /masuk: pesan sesi (FR-LO), sukses reset (FR-LP-14), atau error dari langkah OTP. */
export interface LoginPageState extends LoginRedirectState {
  alert?: LoginAlertCode;
}

const ALERT_CODES = new Set<string>(Object.keys(c.alert));

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useSession();
  // Pesan tampil sekali, lalu state navigasi dibersihkan (FR-LO-03).
  const [incoming] = useState(() => (location.state ?? {}) as LoginPageState);
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [alert, setAlert] = useState<LoginAlertCode | null>(incoming.alert ?? null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const login = useMutation({
    mutationFn: () => services.auth.login({ email, password }),
    onSuccess: (challenge) => {
      savePreAuth(challenge.preAuthId);
      navigate('/masuk/verifikasi', { state: challenge });
    },
    onError: (e) => {
      setAlert(
        isServiceError(e) && ALERT_CODES.has(e.code) ? (e.code as LoginAlertCode) : 'NETWORK',
      );
      setPassword('');
    },
  });

  useEffect(() => {
    if (alert) alertRef.current?.querySelector<HTMLElement>('[role="alert"]')?.focus();
  }, [alert]);

  if (session) return <Navigate to={landingPath(session.user.roles)} replace />;

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (login.isPending) return; // FR-LG-03
    const fe: typeof errors = {};
    if (!email.trim()) fe.email = c.emailKosong;
    else if (!EMAIL_PATTERN.test(email.trim())) fe.email = c.emailFormat;
    if (!password) fe.password = c.sandiKosong;
    setErrors(fe);
    if (fe.email) return emailRef.current?.focus();
    if (fe.password) return passwordRef.current?.focus();
    setAlert(null);
    login.mutate();
  }

  const notice = incoming.reason ? sessionCopy.pesanAkhir[incoming.reason] : incoming.notice;

  return (
    <LoginFrame>
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-page-title text-ink">{c.judul}</h1>
          <p className="text-lead text-ink-subtle">{c.deskripsi}</p>
        </div>
        <div ref={alertRef} aria-live="assertive" className="empty:hidden">
          {alert ? (
            <LoginAlert
              title={c.alert[alert].judul}
              body={c.alert[alert].isi}
              linkText={c.tautanSupport}
            />
          ) : notice ? (
            <LoginAlert variant="info" title="" body={notice} />
          ) : null}
        </div>
        <div className="flex flex-col gap-4">
          <TextField
            ref={emailRef}
            label={c.email}
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder={c.emailPlaceholder}
            size="lg"
            leading={<Mail size={18} strokeWidth={1.9} />}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
            }}
            error={errors.email}
            required
          />
          <TextField
            ref={passwordRef}
            label={c.sandi}
            type="password"
            revealable
            revealLabels={passwordCopy.reveal}
            autoComplete="current-password"
            placeholder={c.sandiPlaceholder}
            size="lg"
            leading={<Lock size={18} strokeWidth={1.9} />}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
            }}
            error={errors.password}
            required
          />
          <Link
            to="/lupa-kata-sandi"
            className="self-end text-caption font-semibold text-ink underline-offset-[3px] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            {c.lupa}
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            loading={login.isPending}
            loadingLabel={c.memproses}
          >
            {c.masuk}
          </Button>
        </div>
      </form>
    </LoginFrame>
  );
}
