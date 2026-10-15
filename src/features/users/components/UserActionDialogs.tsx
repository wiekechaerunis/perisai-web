/**
 * Dialog aksi akun di panel detail pengguna. Tampilan Figma: konfirmasi 560px dengan InfoBlock data penerima
 * (109:14140, 257:8570, 257:9443, 265:11301, 270:12574), batas kirim ulang (253:6888).
 * - Kirim Ulang Undangan: FR-KU-07..12, -20a, -21 (Tabel K-5)
 * - Batalkan Undangan: FR-BU-06..11 (Tabel B-3)
 * - Tangguhkan / Nonaktifkan: FR-SA-07, -10, -11, -18, -19 (Tabel A-3, A-4)
 * - Aktifkan kembali: FR-SA-13, -14, -20
 * - Masa berlaku akses: FR-SA-22, -23, -23a, -26
 * - Cabut sesi (admin): FR-LO-14..16 (Tabel S-3)
 */
import { Calendar, Info } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Callout } from '@/components/patterns/Callout';
import { ConfirmDialog, Dialog } from '@/components/patterns/Dialog';
import { KeyValueList, type KeyValueItem } from '@/components/patterns/KeyValueList';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { formatJam, formatTanggal, formatTanggalJam } from '@/lib/format';
import { REVOKE_REASONS } from '@/lib/status';
import { ALASAN_BATAL, ALASAN_NONAKTIF, ALASAN_TANGGUH, durasiSampai, endOfDayWib, isOverTwoYears, isPastDate } from '@/lib/user-rules';
import { isServiceError, type ReasonInput, type UserDetail } from '@/services';
import { usersCopy as c } from '../copy';
import { useCancelInvite, useDeactivate, useReactivate, useResend, useRevokeSessions, useSetAccessEnd, useSuspend } from '../hooks';
import { roleOptionLabel } from './InviteDialog';
import { reasonValid, ReasonField } from './ReasonField';
import { SendFailedDialog } from './SendFailedDialog';

export type UserAction = 'kirimUlang' | 'batalkan' | 'tangguhkan' | 'nonaktifkan' | 'aktifkanKembali' | 'perpanjang' | 'cabutSesi';

interface BaseProps {
  user: UserDetail;
  onClose: () => void;
}

function info(user: UserDetail, extra: KeyValueItem[] = []): KeyValueItem[] {
  return [
    { key: 'nama', label: 'Nama', value: user.nama },
    { key: 'email', label: c.profil.field.email, value: user.email },
    { key: 'org', label: c.profil.field.organisasi, value: user.organisasi.nama },
    { key: 'role', label: c.profil.field.role, value: user.roles.map(roleOptionLabel).join(', ') },
    ...extra,
  ];
}

function useErrorText() {
  const [err, setErr] = useState<string | null>(null);
  const fail = (e: unknown) => {
    if (isServiceError(e, 'PERMISSION_DENIED') || isServiceError(e, 'SELF_ACTION')) setErr(c.tidakDiizinkan);
    else if (isServiceError(e, 'ORG_INACTIVE')) setErr(c.organisasiNonaktifTooltip);
    else if (isServiceError(e, 'PAST_DATE')) setErr(c.status.harusPerpanjang);
    else setErr(c.kendalaIsi);
  };
  return { err, setErr, fail };
}

function ErrorLine({ children }: { children: ReactNode }) {
  return (
    <Callout variant="error" size="compact">
      {children}
    </Callout>
  );
}

/* ---------- Kirim ulang ---------- */

function ResendDialog({ user, onClose }: BaseProps) {
  const toast = useToast();
  const resend = useResend();
  const [failed, setFailed] = useState(false);
  const [limit, setLimit] = useState<{ until: string } | null>(null);
  const { err, fail } = useErrorText();

  const run = () =>
    resend.mutate(user.id, {
      onSuccess: () => {
        toast.show({ title: c.kirimUlang.sukses(user.email) });
        onClose();
      },
      onError: (e) => {
        if (isServiceError(e, 'SEND_FAILED')) setFailed(true);
        else if (isServiceError(e, 'RESEND_TOO_SOON') || isServiceError(e, 'RESEND_QUOTA')) setLimit({ until: e.meta.retryAt ?? '' });
        else fail(e);
      },
    });

  if (failed) return <SendFailedDialog open email={user.email} onClose={onClose} onRetry={run} retrying={resend.isPending} />;
  if (limit)
    return (
      <Dialog
        open
        onOpenChange={(o) => !o && onClose()}
        title={c.kirimUlang.batasJudul}
        description={c.kirimUlang.batasIsi}
        closeLabel={c.kirimUlang.batal}
        footerNote={
          <span className="flex items-center gap-[6px] font-medium">
            <Info aria-hidden size={14} strokeWidth={1.8} />
            {c.kirimUlang.batasKapan(limit.until ? formatJam(limit.until) : '')}
          </span>
        }
        footer={
          <Button variant="primary" onClick={onClose}>
            {c.kirimUlang.tutup}
          </Button>
        }
      />
    );
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={c.kirimUlang.judulKonfirmasi}
      description={
        <>
          {c.kirimUlang.isiSebelum}
          <strong className="font-semibold text-ink">{user.email}</strong>.<br />
          {c.kirimUlang.isiSesudah}
        </>
      }
      closeLabel={c.kirimUlang.batal}
      footerNote={c.undangModal.masaBerlakuUndangan(7)}
      confirmLabel={c.kirimUlang.kirim}
      cancelLabel={c.kirimUlang.batal}
      loading={resend.isPending}
      loadingLabel={c.kirimUlang.mengirim}
      onConfirm={run}
    >
      <KeyValueList
        variant="block"
        items={info(user, [
          { key: 'status', label: c.profil.field.status, value: user.status },
          {
            key: 'exp',
            label: user.status === 'Kedaluwarsa' ? 'Kedaluwarsa' : c.profil.field.undanganBerlaku,
            value: user.undanganBerlakuSampai ? formatTanggalJam(user.undanganBerlakuSampai) : '—',
          },
        ])}
      />
      {err && <ErrorLine>{err}</ErrorLine>}
    </ConfirmDialog>
  );
}

/* ---------- Alasan (batal / tangguh / nonaktif / cabut sesi) ---------- */

interface ReasonDialogProps extends BaseProps {
  title: string;
  description: ReactNode;
  reasonLabel: string;
  placeholder: string;
  options: readonly string[];
  confirmLabel: string;
  loadingLabel: string;
  extraInfo?: KeyValueItem[];
  above?: ReactNode;
  footerNote?: ReactNode;
  run: (reason: ReasonInput, done: { onSuccess: () => void; onError: (e: unknown) => void }) => void;
  pending: boolean;
  successText: string;
}

function ReasonDialog(p: ReasonDialogProps) {
  const toast = useToast();
  const [reason, setReason] = useState<ReasonInput>({ alasan: '' });
  const { err, setErr, fail } = useErrorText();
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && p.onClose()}
      title={p.title}
      description={p.description}
      closeLabel={c.status.batal}
      confirmLabel={p.confirmLabel}
      cancelLabel={c.status.batal}
      destructive
      loading={p.pending}
      loadingLabel={p.loadingLabel}
      confirmDisabled={!reasonValid(reason)}
      footerNote={p.footerNote}
      onConfirm={() => {
        setErr(null);
        p.run(reason, {
          onSuccess: () => {
            toast.show({ title: p.successText });
            p.onClose();
          },
          onError: fail,
        });
      }}
    >
      {p.above}
      <KeyValueList variant="block" items={info(p.user, p.extraInfo)} />
      <ReasonField label={p.reasonLabel} placeholder={p.placeholder} options={p.options} value={reason} onChange={setReason} />
      {err && <ErrorLine>{err}</ErrorLine>}
    </ConfirmDialog>
  );
}

function CancelDialog({ user, onClose }: BaseProps) {
  const m = useCancelInvite();
  return (
    <ReasonDialog
      user={user}
      onClose={onClose}
      title={c.batal.judulKonfirmasi}
      description={
        <>
          <strong className="font-semibold text-ink">{c.batal.peringatanJudul}</strong> {c.batal.peringatanIsi}
        </>
      }
      reasonLabel={c.batal.alasan}
      placeholder={c.batal.alasanPlaceholder}
      options={ALASAN_BATAL}
      confirmLabel={c.batal.konfirmasi}
      loadingLabel={c.batal.memproses}
      extraInfo={[
        { key: 'status', label: c.profil.field.status, value: user.status },
        { key: 'exp', label: c.profil.field.undanganBerlaku, value: user.undanganBerlakuSampai ? formatTanggalJam(user.undanganBerlakuSampai) : '—' },
      ]}
      pending={m.isPending}
      successText={c.batal.sukses(user.email)}
      run={(reason, done) => m.mutate({ id: user.id, reason }, done)}
    />
  );
}

function SuspendDialog({ user, onClose }: BaseProps) {
  const m = useSuspend();
  return (
    <ReasonDialog
      user={user}
      onClose={onClose}
      title={c.status.tangguhkanJudul}
      description={c.status.tangguhkanKeterangan}
      reasonLabel={c.status.alasanTangguh}
      placeholder={c.status.alasanTangguhPlaceholder}
      options={Object.keys(ALASAN_TANGGUH)}
      confirmLabel={c.status.tangguhkan}
      loadingLabel={c.status.memproses}
      extraInfo={[{ key: 'sesi', label: c.status.sesiAktif, value: c.status.nSesi(user.sesiAktif) }]}
      pending={m.isPending}
      successText={c.status.suksesTangguh(user.nama)}
      run={(reason, done) => m.mutate({ id: user.id, reason }, done)}
    />
  );
}

function DeactivateDialog({ user, onClose }: BaseProps) {
  const m = useDeactivate();
  // FR-SA-07: peringatan Admin KKKS aktif terakhir sebelum dialog alasan.
  const [ack, setAck] = useState(!user.picTerakhir);
  if (!ack)
    return (
      <ConfirmDialog
        open
        onOpenChange={(o) => !o && onClose()}
        title={c.status.picTerakhirJudul}
        description={c.status.picTerakhirIsi(user.organisasi.nama)}
        closeLabel={c.status.batal}
        confirmLabel={c.status.tetapNonaktifkan}
        cancelLabel={c.status.batal}
        destructive
        onConfirm={() => setAck(true)}
      />
    );
  return (
    <ReasonDialog
      user={user}
      onClose={onClose}
      title={c.status.nonaktifkanJudul}
      description={c.status.nonaktifkanKeterangan}
      reasonLabel={c.status.alasanNonaktif}
      placeholder={c.status.alasanNonaktifPlaceholder}
      options={Object.keys(ALASAN_NONAKTIF)}
      confirmLabel={c.status.nonaktifkan}
      loadingLabel={c.status.memproses}
      extraInfo={[{ key: 'sesi', label: c.status.sesiAktif, value: c.status.nSesi(user.sesiAktif) }]}
      pending={m.isPending}
      successText={c.status.suksesNonaktif(user.nama)}
      run={(reason, done) => m.mutate({ id: user.id, reason }, done)}
    />
  );
}

function RevokeDialog({ user, onClose }: BaseProps) {
  const m = useRevokeSessions();
  return (
    <ReasonDialog
      user={user}
      onClose={onClose}
      title={c.sesi.judul}
      description={c.sesi.keterangan(user.sesiAktif)}
      reasonLabel={c.sesi.alasan}
      placeholder={c.sesi.alasanPlaceholder}
      options={REVOKE_REASONS}
      confirmLabel={c.sesi.konfirmasi}
      loadingLabel={c.sesi.memproses}
      extraInfo={[{ key: 'sesi', label: c.status.sesiAktif, value: c.status.nSesi(user.sesiAktif) }]}
      pending={m.isPending}
      successText={c.sesi.sukses(user.sesiAktif)}
      run={(reason, done) => m.mutate({ id: user.id, reason }, done)}
    />
  );
}

/* ---------- Aktifkan kembali ---------- */

function ReactivateDialog({ user, onClose }: BaseProps) {
  const toast = useToast();
  const m = useReactivate();
  const { err, fail } = useErrorText();
  const last = user.riwayat.find((e) => e.peristiwa === 'Akun ditangguhkan' || e.peristiwa === 'Akun dinonaktifkan' || e.peristiwa === 'Masa berlaku akses berakhir');
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={c.status.aktifkanJudul}
      description={c.status.aktifkanKeterangan}
      closeLabel={c.status.batal}
      confirmLabel={c.status.aktifkan}
      cancelLabel={c.status.batal}
      loading={m.isPending}
      loadingLabel={c.status.memproses}
      onConfirm={() =>
        m.mutate(user.id, {
          onSuccess: () => {
            toast.show({ title: c.status.suksesAktif(user.nama) });
            onClose();
          },
          onError: fail,
        })
      }
    >
      <KeyValueList variant="block" items={info(user)} />
      {last && (
        <div className="flex flex-col gap-2">
          <p className="text-label text-ink-muted">{c.status.statusSebelumnya}</p>
          <KeyValueList
            variant="block"
            items={[
              { key: 'tgl', label: c.status.tanggal, value: formatTanggalJam(last.at) },
              { key: 'peristiwa', label: c.profil.field.status, value: last.peristiwa },
              ...(last.keterangan ? [{ key: 'ket', label: c.status.keterangan, value: last.keterangan }] : []),
            ]}
          />
        </div>
      )}
      {err && <ErrorLine>{err}</ErrorLine>}
    </ConfirmDialog>
  );
}

/* ---------- Masa berlaku akses ---------- */

function toYmd(iso?: string): string {
  return iso ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(iso)) : '';
}

function AccessEndDialog({ user, onClose }: BaseProps) {
  const toast = useToast();
  const m = useSetAccessEnd();
  const [date, setDate] = useState(toYmd(user.aksesBerakhir));
  const [error, setError] = useState<string>();
  const { err, fail } = useErrorText();
  const now = new Date();
  useEffect(() => setError(undefined), [date]);
  const warn = date && !isPastDate(date, now) && isOverTwoYears(date, now);

  function save() {
    if (date && isPastDate(date, now)) return setError(c.v.tanggalLampau);
    m.mutate(
      { id: user.id, date: date || null },
      {
        onSuccess: () => {
          toast.show({ title: c.status.masaSukses });
          onClose();
        },
        onError: (e) => (isServiceError(e, 'PAST_DATE') ? setError(c.v.tanggalLampau) : fail(e)),
      },
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={c.status.masaJudul}
      closeLabel={c.status.batal}
      footer={
        <>
          <Button onClick={onClose} disabled={m.isPending}>
            {c.status.batal}
          </Button>
          <Button variant="primary" onClick={save} loading={m.isPending} loadingLabel={c.status.menyimpan}>
            {c.status.simpan}
          </Button>
        </>
      }
    >
      <KeyValueList variant="block" items={info(user).filter((i) => i.key !== 'status')} />
      <p className="text-body-dense text-ink-muted">
        {c.status.berlakuSaatIni(user.aksesBerakhir ? formatTanggal(user.aksesBerakhir) : c.status.tidakDibatasi)}
      </p>
      {(user.status === 'Nonaktif' || user.status === 'Ditangguhkan') && (
        <p role="status" className="flex items-start gap-[10px] rounded-md bg-surface-sunken p-3 text-body-dense text-ink">
          <Info aria-hidden size={16} strokeWidth={1.8} className="mt-0.5 shrink-0" />
          {user.status === 'Nonaktif' ? c.status.infoNonaktif : c.status.infoDitangguhkan}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <TextField
          label={c.status.masaLabel}
          type="date"
          value={date}
          min={toYmd(now.toISOString())}
          onChange={(e) => setDate(e.target.value)}
          trailing={<Calendar aria-hidden size={16} strokeWidth={1.8} className="mr-2 text-ink-muted" />}
          hint={c.status.masaHint}
          error={error}
        />
        {date && (
          <button type="button" onClick={() => setDate('')} className="self-start text-caption text-ink underline">
            {c.status.hapusBatas}
          </button>
        )}
        {warn && (
          <Callout variant="peringatan" size="compact" role="status">
            {c.undangModal.berlaku(durasiSampai(date, now), formatTanggal(endOfDayWib(date)))}
          </Callout>
        )}
      </div>
      {err && <ErrorLine>{err}</ErrorLine>}
    </Dialog>
  );
}

/* ---------- penentu ---------- */

export function UserActionDialog({ action, user, onClose }: { action: UserAction | null; user: UserDetail; onClose: () => void }) {
  switch (action) {
    case 'kirimUlang':
      return <ResendDialog user={user} onClose={onClose} />;
    case 'batalkan':
      return <CancelDialog user={user} onClose={onClose} />;
    case 'tangguhkan':
      return <SuspendDialog user={user} onClose={onClose} />;
    case 'nonaktifkan':
      return <DeactivateDialog user={user} onClose={onClose} />;
    case 'aktifkanKembali':
      return <ReactivateDialog user={user} onClose={onClose} />;
    case 'perpanjang':
      return <AccessEndDialog user={user} onClose={onClose} />;
    case 'cabutSesi':
      return <RevokeDialog user={user} onClose={onClose} />;
    default:
      return null;
  }
}
