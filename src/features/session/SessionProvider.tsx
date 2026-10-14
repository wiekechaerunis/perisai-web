/**
 * Status sesi di sisi klien (PRD Logout & Sesi, FR-LO-02, -06..-10, -17..-19).
 * - Status sesi selalu dari server; polling tiap SECURITY_PARAMS.sessionPollMs agar pencabutan berlaku ≤ 30 detik.
 * - Sesi berakhir → ke Login dengan pesan sesuai jenis pengakhiran; halaman terakhir diingat (FR-LO-10).
 * - Perubahan role/cakupan tidak mengakhiri sesi; data sesi disegarkan (FR-LO-19).
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SECURITY_PARAMS } from '@/lib/security-params';
import type { SessionEndReason } from '@/lib/status';
import { activityBus, services, type Session, type SessionState } from '@/services';

export const SESSION_QUERY_KEY = ['session'] as const;
const RETURN_TO_KEY = 'perisai.returnTo';

interface SessionContextValue {
  state: SessionState | undefined;
  session: Session | null;
  /** serverNow − Date.now() saat data sesi terakhir diterima (FR-LO-09c). */
  serverOffsetMs: number;
  isLoading: boolean;
  refresh: () => Promise<unknown>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Simpan tujuan untuk diarahkan kembali setelah login (FR-LG-28, FR-LO-10). */
export function rememberReturnTo(path: string): void {
  try {
    sessionStorage.setItem(RETURN_TO_KEY, path);
  } catch {
    /* penyimpanan tidak tersedia */
  }
}

export function consumeReturnTo(): string | null {
  try {
    const v = sessionStorage.getItem(RETURN_TO_KEY);
    sessionStorage.removeItem(RETURN_TO_KEY);
    return v;
  } catch {
    return null;
  }
}

export interface LoginRedirectState {
  reason?: SessionEndReason;
  /** Pesan sukses lain, mis. reset kata sandi berhasil (FR-LP-14). */
  notice?: string;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const offsetRef = useRef(0);
  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const s = await services.auth.getSession();
      if (s.status === 'active') offsetRef.current = new Date(s.session.serverNow).getTime() - Date.now();
      return s;
    },
    refetchInterval: SECURITY_PARAMS.sessionPollMs,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Aktivitas ke server → segarkan sisa waktu sesi dan tutup peringatan idle (FR-LO-09b).
  useEffect(() => activityBus.subscribe(() => void qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY })), [qc]);

  const value = useMemo<SessionContextValue>(
    () => ({
      state: query.data,
      session: query.data?.status === 'active' ? query.data.session : null,
      serverOffsetMs: offsetRef.current,
      isLoading: query.isPending,
      refresh: () => query.refetch(),
    }),
    [query],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession harus dipakai di dalam SessionProvider');
  return ctx;
}

/**
 * Untuk rute yang butuh login: sesi berakhir/tidak ada → ke Login dengan pesan dan tujuan diingat.
 * Setiap pindah halaman dihitung aktivitas (permintaan ke server), sesuai FR-LO-09b.
 */
export function useSessionGuard(): Session | null {
  const { state, session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const here = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (!state || state.status === 'active') return;
    rememberReturnTo(here);
    const redirect: LoginRedirectState = state.status === 'ended' ? { reason: state.reason } : {};
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== SESSION_QUERY_KEY[0] });
    navigate('/masuk', { replace: true, state: redirect });
  }, [state, here, navigate, qc]);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (session) services.auth.keepAlive().catch(() => void qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY }));
    // hanya saat rute berubah
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return session;
}
