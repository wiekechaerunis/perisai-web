/**
 * Akun Saya — PRD tab 4063d15e-cbad (ClickUp z8pmx9nb7u) + Figma 341:6300 (Profil) dan 341:6507 (Keamanan masuk).
 * - Profil: FR-AS-001..007, -009..011. Nama lengkap dan Jabatan bisa diubah langsung (PRD; Figma mengunci Jabatan, F-31),
 *   Email lewat permintaan (PRD; Figma read-only, F-31), Username/Organisasi/Role/Status read-only, cakupan WK (FR-CD-14).
 * - Keamanan masuk: kartu Kata sandi → dialog Ubah kata sandi (FR-UK-01..11), Sesi aktif (FR-LO-05, -11..13).
 *   Riwayat masuk sendiri 30 hari tanpa IP (FR-LA-15a..c).
 * - Profil juga menampilkan hak akses efektif sendiri (FR-HE-16) dan cakupan data (FR-CD-14).
 *   Kartu "Metode verifikasi masuk" (autentikator, passkey) DITAHAN: KD-02 / PR-01.
 * Menggantikan "Pengaturan akun" (K-8 diselesaikan oleh Figma: satu halaman Akun Saya).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fingerprint, KeyRound, Lock, Mail, Smartphone } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Outlet, useBlocker } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { ConfirmDialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { AccountStatusBadge } from '@/components/patterns/AccountStatusBadge';
import { Button } from '@/components/ui/Button';
import { TabsNav } from '@/components/ui/Tabs';
import { TextField } from '@/components/ui/TextField';
import { formatTanggal, formatTanggalJam } from '@/lib/format';
import { t } from '@/lib/i18n/id';
import { roleName } from '@/lib/rbac';
import { isServiceError, services } from '@/services';
import { DataTable } from '@/components/patterns/DataTable';
import { EmptyState } from '@/components/patterns/EmptyState';
import type { ColumnDef } from '@tanstack/react-table';
import type { AccessLogEntry } from '@/services';
import { EffectiveAccessView, ScopeList } from '../access/EffectiveAccessView';
import { accessCopy } from '../access/copy';
import { ResultTag } from '../logs/shared';
import { SESSION_QUERY_KEY } from '../session/SessionProvider';
import { StatusBadge } from '../users/components/UserDetailPanel';
import { akunSayaCopy as c } from './akunSayaCopy';
import { EmailChangeDialog } from './EmailChangeDialog';
import { SesiAktifSection } from './SesiAktifSection';
import { UbahKataSandiDialog } from './UbahKataSandiDialog';

const ME_KEY = ['me'] as const;

export function AkunSayaLayout() {
  return (
    <>
      <PageHeader
        title={c.judul}
        summary={c.ringkasan}
        tabs={
          <TabsNav
            label={c.tabLabel}
            items={[
              { value: 'profil', label: c.tabProfil, to: '/akun-saya' },
              { value: 'keamanan', label: c.tabKeamanan, to: '/akun-saya/keamanan' },
            ]}
          />
        }
      />
      <PageBody>
        <Outlet />
      </PageBody>
    </>
  );
}

function ReadOnly({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label text-ink-muted">{label}</span>
      <div className="flex min-h-control-md items-center justify-between gap-2 rounded-md border border-border bg-surface-sunken px-3 py-2 text-body-dense text-ink">
        <div className="min-w-0 break-words">{children}</div>
        <Lock aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-ink-subtle" />
      </div>
      {hint && <p className="text-caption text-ink-subtle">{hint}</p>}
    </div>
  );
}

export function AkunSayaProfilPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const me = useQuery({ queryKey: ME_KEY, queryFn: () => services.account.getMe() });
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [errors, setErrors] = useState<{ nama?: string; jabatan?: string }>({});
  const [emailOpen, setEmailOpen] = useState(false);

  useEffect(() => {
    if (me.data) {
      setNama(me.data.nama);
      setJabatan(me.data.jabatan ?? '');
    }
  }, [me.data]);

  const dirty = !!me.data && (nama !== me.data.nama || jabatan !== (me.data.jabatan ?? ''));
  // FR-AS-006: konfirmasi bila meninggalkan halaman dengan perubahan belum disimpan.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ME_KEY });
    void qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
  };

  const save = useMutation({
    mutationFn: () => services.account.updateProfile({ nama, jabatan: jabatan || undefined }),
    onSuccess: () => {
      refresh();
      toast.show({ title: c.profil.sukses });
    },
    onError: (e) => {
      if (isServiceError(e) && e.meta.field === 'nama') setErrors({ nama: c.profil.namaPanjang });
      else if (isServiceError(e) && e.meta.field === 'jabatan') setErrors({ jabatan: c.profil.jabatanPanjang });
    },
  });

  const cancelReq = useMutation({ mutationFn: () => services.account.cancelEmailChange(), onSuccess: refresh });
  const dismissReq = useMutation({ mutationFn: () => services.account.dismissEmailRejection(), onSuccess: refresh });
  const resendCode = useMutation({ mutationFn: () => services.account.resendEmailCode(), onSuccess: () => toast.show({ title: c.email.kodeTerkirim }) });

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const n = nama.trim();
    const fe: typeof errors = {};
    if (!n) fe.nama = c.profil.namaKosong;
    else if (n.length < 3 || n.length > 150) fe.nama = c.profil.namaPanjang;
    if (jabatan.length > 100) fe.jabatan = c.profil.jabatanPanjang;
    setErrors(fe);
    if (!fe.nama && !fe.jabatan) save.mutate();
  }

  if (!me.data) return <p role="status" className="text-body text-ink-muted">{t.app.memuat}</p>;
  const m = me.data;
  const req = m.permintaanEmail;

  return (
    <>
      <Section className="border border-border">
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-heading-2 text-ink">{c.profil.judul}</h2>
              <p className="text-body-dense text-ink-muted">{c.profil.keterangan}</p>
            </div>
            <StatusBadge user={{ status: m.status, organisasi: m.organisasi }} />
          </div>
          <hr className="border-border-subtle" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <TextField
                label={c.profil.nama}
                required
                showRequired
                value={nama}
                onChange={(e) => (setNama(e.target.value), setErrors((p) => ({ ...p, nama: undefined })))}
                hint={c.profil.namaHint}
                error={errors.nama}
              />
              <div className="flex flex-col gap-1">
                <span className="text-label text-ink-muted">{c.profil.email}</span>
                <div className="flex items-center gap-2">
                  <div className="flex min-h-control-md flex-1 items-center rounded-md border border-border bg-surface-sunken px-3 text-body-dense text-ink">
                    <span className="break-all">{m.email}</span>
                  </div>
                  {req?.status !== 'Menunggu Persetujuan' && (
                    <Button onClick={() => setEmailOpen(true)}>{c.profil.ubahEmail}</Button>
                  )}
                </div>
                {req?.status === 'Ditolak' && (
                  <div role="status" className="mt-1 flex flex-col gap-1 rounded-md bg-surface-sunken p-3 text-caption text-ink">
                    <span>
                      <strong className="font-semibold">{c.email.ditolak}</strong> · {req.emailBaru}
                    </span>
                    {req.alasan && <span className="text-ink-muted">{c.email.alasanDitolak(req.alasan)}</span>}
                    <span>
                      <button type="button" className="underline" onClick={() => dismissReq.mutate()}>
                        {c.email.tutup}
                      </button>
                    </span>
                  </div>
                )}
                {req && req.status !== 'Ditolak' && (
                  <div role="status" className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-muted">
                    <span>
                      <strong className="font-semibold text-ink">{req.status}</strong> · {req.emailBaru} · {c.email.diajukan(formatTanggalJam(req.diajukan))}
                    </span>
                    {req.status === 'Menunggu Verifikasi' && (
                      <>
                        <button type="button" className="underline" onClick={() => setEmailOpen(true)}>
                          {c.email.verifikasi}
                        </button>
                        <button type="button" className="underline" onClick={() => resendCode.mutate()}>
                          {c.email.kirimUlang}
                        </button>
                      </>
                    )}
                    <button type="button" className="underline" onClick={() => cancelReq.mutate()}>
                      {c.email.batalkanPermintaan}
                    </button>
                  </div>
                )}
              </div>
              <ReadOnly label={c.profil.username}>{m.username}</ReadOnly>
            </div>
            <div className="flex flex-col gap-4">
              <TextField
                label={c.profil.jabatan}
                value={jabatan}
                onChange={(e) => (setJabatan(e.target.value), setErrors((p) => ({ ...p, jabatan: undefined })))}
                hint={c.profil.jabatanHint}
                error={errors.jabatan}
              />
              <ReadOnly label={c.profil.organisasi}>{m.organisasi.nama}</ReadOnly>
            </div>
          </div>
          <hr className="border-border-subtle" />
          <h2 className="text-heading-2 text-ink">{c.profil.roleJudul}</h2>
          <div className="flex flex-col gap-2">
            <span className="text-label text-ink-muted" title={c.profil.roleTooltip}>
              {c.profil.role}
            </span>
            <ul className="flex flex-wrap gap-2" aria-describedby="role-tooltip">
              {m.roles.map((r) => (
                <li key={r} className="rounded-md border border-border bg-surface-selected px-3 py-1 text-caption text-ink">
                  {roleName(r)}
                </li>
              ))}
            </ul>
            <p id="role-tooltip" className="text-caption text-ink-subtle">
              {c.profil.roleTooltip}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <ReadOnly label={c.profil.cakupan}>
              <ScopeList cakupan={m.cakupan} />
            </ReadOnly>
            <ReadOnly label={c.profil.masaBerlaku}>
              {m.aksesBerakhir ? c.profil.berlakuSampai(formatTanggal(m.aksesBerakhir)) : c.profil.tanpaBatas}
            </ReadOnly>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setNama(m.nama);
                setJabatan(m.jabatan ?? '');
                setErrors({});
              }}
              disabled={!dirty || save.isPending}
            >
              {c.profil.batal}
            </Button>
            <Button type="submit" variant="primary" disabled={!dirty} loading={save.isPending} loadingLabel={c.profil.menyimpan}>
              {c.profil.simpan}
            </Button>
          </div>
        </form>
      </Section>
      <Section className="border border-border">
        <div className="flex flex-col gap-3">
          <h2 className="text-heading-2 text-ink">{accessCopy.judul}</h2>
          <p className="text-caption text-ink-subtle">{accessCopy.keterangan}</p>
          <EffectiveAccessView modules={m.hakAkses} />
        </div>
      </Section>
      <p className="text-caption text-ink-subtle">{c.profil.catatan}</p>
      <EmailChangeDialog open={emailOpen} onOpenChange={setEmailOpen} me={m} startAtCode={req?.status === 'Menunggu Verifikasi'} onChanged={refresh} />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(o) => !o && blocker.reset?.()}
        title={c.profil.tinggalkanJudul}
        description={c.profil.tinggalkanIsi}
        confirmLabel={c.profil.tinggalkan}
        cancelLabel={c.profil.tetap}
        onConfirm={() => blocker.proceed?.()}
      />
    </>
  );
}

export function AkunSayaKeamananPage() {
  const me = useQuery({ queryKey: ME_KEY, queryFn: () => services.account.getMe() });
  const [open, setOpen] = useState(false);
  return (
    <>
      <Section className="border border-border">
        <div className="flex flex-wrap items-center gap-4">
          <KeyRound aria-hidden size={20} strokeWidth={1.8} className="text-ink-muted" />
          <div className="flex min-w-0 flex-1 flex-col">
            <h2 className="text-heading-2 text-ink">{c.keamanan.sandiJudul}</h2>
            <p className="text-body-dense text-ink-muted">
              {me.data?.kataSandiDiubah ? c.keamanan.sandiDiubah(formatTanggalJam(me.data.kataSandiDiubah)) : c.keamanan.sandiBelum}
            </p>
          </div>
          <Button onClick={() => setOpen(true)}>{c.keamanan.ubahSandi}</Button>
        </div>
      </Section>
      <MetodeVerifikasi email={me.data?.email} />
      <SesiAktifSection />
      <RiwayatMasuk onUbahSandi={() => setOpen(true)} />
      <p className="text-caption text-ink-subtle">{c.keamanan.catatan}</p>
      <UbahKataSandiDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Batas passkey per akun (Figma 341:6507 "Batas lima passkey"). */
const MAKS_PASSKEY = 5;

/**
 * Figma 341:6507 kartu "Metode verifikasi masuk". Kode email = OTP login (PRD Login) dan selalu aktif.
 * ASSUMPTION (F-36, KD-02): aplikasi autentikator dan passkey ditampilkan sesuai Figma tetapi tombolnya nonaktif sampai
 * PRD Verifikasi Dua Langkah tersedia; banner "Login cadangan terakhir" Figma tidak ditampilkan (bergantung KD-02).
 */
function MetodeVerifikasi({ email }: { email?: string }) {
  const m = c.keamanan.metode;
  const row = (icon: ReactNode, judul: string, badge?: ReactNode, aside?: ReactNode) => (
    <div className="flex items-center gap-3">
      {icon}
      <h3 className="min-w-0 flex-1 text-body-dense font-medium text-ink">{judul}</h3>
      {badge}
      {aside}
    </div>
  );
  const ikon = 'shrink-0 text-ink-muted';
  return (
    <Section title={m.judul} description={m.keterangan} className="border border-border">
      <div className="flex flex-col">
        <div className="flex flex-col gap-2 border-t border-border-subtle py-4">
          {row(<Mail aria-hidden size={20} strokeWidth={1.8} className={ikon} />, m.emailJudul, <AccountStatusBadge label={m.aktif} tone="success" />)}
          <p className="text-body-dense text-ink">{m.emailIsi(email ?? '—')}</p>
        </div>
        <div className="flex flex-col items-start gap-3 border-t border-border-subtle py-4">
          <div className="w-full">{row(<Smartphone aria-hidden size={20} strokeWidth={1.8} className={ikon} />, m.autentikatorJudul, <AccountStatusBadge label={m.belumDiatur} tone="muted" />)}</div>
          <p className="text-body-dense text-ink-muted">{m.autentikatorIsi}</p>
          {/* ASSUMPTION: nonaktif sampai PRD Verifikasi Dua Langkah (KD-02). */}
          <Button disabled aria-describedby="metode-belum-tersedia">{m.atur}</Button>
        </div>
        <div className="flex flex-col items-start gap-3 border-t border-border-subtle pt-4">
          <div className="w-full">
            {row(
              <Fingerprint aria-hidden size={20} strokeWidth={1.8} className={ikon} />,
              m.passkeyJudul,
              undefined,
              <span className="font-mono text-caption text-ink-muted">{m.passkeyJumlah(0, MAKS_PASSKEY)}</span>,
            )}
          </div>
          <p className="text-body-dense text-ink-muted">{m.passkeyIsi}</p>
          <p className="text-caption text-ink-muted">{m.passkeyKosong}</p>
          <Button disabled aria-describedby="metode-belum-tersedia">{m.tambahPasskey}</Button>
          <p id="metode-belum-tersedia" className="text-caption text-ink-subtle">{m.belumTersedia}</p>
        </div>
      </div>
    </Section>
  );
}

/** FR-LA-15a..c: riwayat masuk sendiri, 30 hari, tanpa alamat IP. */
function RiwayatMasuk({ onUbahSandi }: { onUbahSandi: () => void }) {
  const q = useQuery({ queryKey: ['me', 'login-history'], queryFn: () => services.logs.myLoginHistory() });
  const k = c.keamanan.kolom;
  return (
    <Section className="border border-border">
      <div className="flex flex-col gap-3">
        <h2 className="text-heading-2 text-ink">{c.keamanan.riwayatJudul}</h2>
        <p className="text-caption text-ink-subtle">{c.keamanan.riwayatKeterangan}</p>
        {q.isError ? (
          <p role="alert" className="text-body-dense text-ink">{c.keamanan.riwayatGagal}</p>
        ) : (
          <DataTable
            caption={c.keamanan.riwayatJudul}
            columns={[
              { id: 'w', header: k.waktu, cell: ({ row }) => <span className="whitespace-nowrap font-mono text-caption">{formatTanggalJam(row.original.waktu)}</span> },
              { id: 'p', header: k.peristiwa, cell: ({ row }) => row.original.peristiwa },
              { id: 'h', header: k.hasil, cell: ({ row }) => <ResultTag ok={row.original.hasil === 'Berhasil'}>{row.original.hasil}</ResultTag> },
              { id: 'd', header: k.perangkat, cell: ({ row }) => row.original.perangkat ?? '—' },
              { id: 'l', header: k.lokasi, cell: ({ row }) => row.original.perkiraanLokasi ?? '—' },
            ] satisfies ColumnDef<AccessLogEntry, unknown>[]}
            data={q.data ?? []}
            getRowId={(e) => e.id}
            loading={q.isPending}
            loadingContent={<p className="text-body-dense text-ink-muted">{t.app.memuat}</p>}
            empty={<EmptyState title={c.keamanan.riwayatKosong} />}
          />
        )}
        <p className="text-body-dense text-ink-muted">
          {c.keamanan.tidakMengenali}{' '}
          <button type="button" onClick={onUbahSandi} className="font-semibold text-ink underline">
            {c.keamanan.ubahSandi}
          </button>
        </p>
      </div>
    </Section>
  );
}
