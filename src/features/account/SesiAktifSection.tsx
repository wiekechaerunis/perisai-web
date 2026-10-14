/**
 * Sesi aktif — PRD Logout & Sesi (tab a61955db-ba08, ClickUp z8pmx9n8p8).
 * FR-LO-11 (daftar sesi milik pengguna + penanda "Perangkat ini"), FR-LO-12 (cabut sesi lain ≤ 30 detik),
 * FR-LO-13 (tanpa IP penuh), FR-LO-05 (Keluar dari semua perangkat). Prioritas: Penting.
 * Desain: kartu "Sesi aktif" di tab Keamanan masuk Akun Saya (Figma 341:6507): daftar perangkat (ikon, perangkat,
 * lokasi, aktivitas terakhir, badge "Perangkat ini") dan satu tombol di bawah. IP penuh tidak ditampilkan (FR-LO-13),
 * berbeda dari Figma (F-34); tombol "Keluar dari semua perangkat" mengikuti FR-LO-05, bukan "… perangkat lain" (F-35).
 * Aksi "Keluarkan perangkat" per baris (FR-LO-12) memakai gaya tautan seperti aksi baris passkey di Figma.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Monitor, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Section } from '@/components/layout/Section';
import { AccountStatusBadge } from '@/components/patterns/AccountStatusBadge';
import { ConfirmDialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n/id';
import { formatTanggalJam } from '@/lib/format';
import { services, type DeviceSession } from '@/services';
import { SESSION_QUERY_KEY, type LoginRedirectState } from '../session/SessionProvider';
import { accountCopy } from './copy';

const c = accountCopy.sesi;
const QUERY_KEY = ['me', 'sessions'] as const;

function deviceLabel(s: DeviceSession): string {
  return `${s.browser} · ${s.sistemOperasi}`;
}

export function SesiAktifSection() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const [target, setTarget] = useState<DeviceSession | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const list = useQuery({ queryKey: QUERY_KEY, queryFn: () => services.sessions.listMySessions() });

  const revoke = useMutation({
    mutationFn: (id: string) => services.sessions.revokeMySession(id),
    onSuccess: () => {
      setTarget(null);
      toast.show({ title: c.cabutSukses });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const logoutAll = useMutation({
    mutationFn: () => services.auth.logoutAllDevices(),
    onSettled: () => {
      qc.clear();
      const state: LoginRedirectState = { reason: 'logout' };
      navigate('/masuk', { replace: true, state });
      void qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });

  const sessions = list.data ?? [];
  const others = sessions.filter((s) => !s.perangkatIni);

  return (
    <Section title={c.judul} description={c.keterangan} className="border border-border">
      <div className="flex flex-col gap-4">
        {list.isPending ? (
          <p className="text-body-dense text-ink-muted">{t.app.memuat}</p>
        ) : list.isError ? (
          <p role="alert" className="text-body-dense text-ink">{c.gagalMemuat}</p>
        ) : (
          <ul aria-label={c.tabelLabel} className="flex flex-col">
            {sessions.map((s) => {
              const Icon = s.perangkat === 'Ponsel' ? Smartphone : Monitor;
              return (
                <li key={s.id} className="flex items-start gap-3 border-b border-border-subtle py-3">
                  <Icon aria-hidden size={20} strokeWidth={1.8} className="mt-px shrink-0 text-ink-muted" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-body-dense font-medium text-ink">{deviceLabel(s)}</span>
                    <span className="text-caption text-ink-muted">{s.perkiraanLokasi}</span>
                    <span className="text-caption text-ink-muted">
                      {c.aktivitasTerakhir(formatTanggalJam(s.aktivitasTerakhir))} · {c.masuk(formatTanggalJam(s.waktuMasuk))}
                    </span>
                  </div>
                  {s.perangkatIni ? (
                    <AccountStatusBadge label={c.perangkatIni} tone="success" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTarget(s)}
                      aria-label={`${c.cabut}: ${deviceLabel(s)}`}
                      className="shrink-0 text-body-dense font-semibold text-ink underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
                    >
                      {c.cabut}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {list.isSuccess && others.length === 0 && <p className="text-caption text-ink-muted">{c.kosong}</p>}
        <div className="flex flex-col items-start gap-1">
          <Button onClick={() => setConfirmAll(true)}>{c.semuaTombol}</Button>
          <p className="text-caption text-ink-muted">{c.semuaKeterangan}</p>
        </div>
      </div>

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={c.cabutJudul}
        description={target ? c.cabutIsi(deviceLabel(target)) : undefined}
        confirmLabel={c.cabutKonfirmasi}
        cancelLabel={c.batal}
        loading={revoke.isPending}
        loadingLabel={c.memproses}
        onConfirm={() => target && revoke.mutate(target.id)}
      />
      <ConfirmDialog
        open={confirmAll}
        onOpenChange={setConfirmAll}
        title={c.semuaKonfirmasiJudul}
        description={c.semuaKonfirmasiIsi}
        confirmLabel={c.semuaTombol}
        cancelLabel={c.batal}
        loading={logoutAll.isPending}
        loadingLabel={c.memproses}
        onConfirm={() => logoutAll.mutate()}
      />
    </Section>
  );
}
