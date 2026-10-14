/**
 * FR-LO-09, -09a, -09b, -09c (Penting): peringatan 2 menit sebelum idle timeout.
 * Hitung mundur memakai waktu server (idleExpiresAt + offset); saat habis, status sesi diambil ulang dari
 * server sehingga pengguna diarahkan ke Login dengan pesan FR-LO-08.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/patterns/Dialog';
import { formatHitungMundur } from '@/lib/format';
import { SECURITY_PARAMS } from '@/lib/security-params';
import { services } from '@/services';
import { sessionCopy as c } from './copy';
import { SESSION_QUERY_KEY, useSession } from './SessionProvider';

export function IdleWarning({ onLogout }: { onLogout: () => void }) {
  const { session, serverOffsetMs, refresh } = useSession();
  const qc = useQueryClient();
  const [leftMs, setLeftMs] = useState<number | null>(null);

  useEffect(() => {
    if (!session) {
      setLeftMs(null);
      return;
    }
    const expires = new Date(session.idleExpiresAt).getTime();
    const tick = () => setLeftMs(expires - (Date.now() + serverOffsetMs));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session, serverOffsetMs]);

  // Habis → minta status dari server (server yang memutuskan sesi berakhir).
  useEffect(() => {
    if (leftMs !== null && leftMs <= 0) void refresh();
  }, [leftMs, refresh]);

  const keepAlive = useMutation({
    mutationFn: () => services.auth.keepAlive(),
    onSettled: () => qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY }),
  });

  const open = leftMs !== null && leftMs > 0 && leftMs <= SECURITY_PARAMS.idleWarningMs;

  return (
    <Dialog
      open={open}
      onOpenChange={() => undefined}
      dismissible={false}
      title={c.peringatan.judul}
      description={c.peringatan.isi(formatHitungMundur((leftMs ?? 0) / 1000))}
      footer={
        <>
          <Button variant="quiet" onClick={onLogout}>
            {c.peringatan.keluar}
          </Button>
          <Button variant="primary" size="lg" onClick={() => keepAlive.mutate()} loading={keepAlive.isPending} loadingLabel={c.peringatan.memproses}>
            {c.peringatan.lanjutkan}
          </Button>
        </>
      }
    />
  );
}
