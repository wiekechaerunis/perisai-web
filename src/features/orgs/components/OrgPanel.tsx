/**
 * Detail organisasi — PRD Kelola Organisasi KKKS FR-ORG-10..13, 20, 40, Design Brief B2. Tidak ada Figma.
 * Halaman penuh /organisasi/:kode (arahan PM 15 Okt 2026; sebelumnya panel samping).
 * Header: nama, badge status, kode mono, tombol Nonaktifkan / Aktifkan kembali (R-03; tidak untuk SKK Migas dan
 * Kontraktor). Tab Profil (ubah inline nama/badan hukum/skema untuk R-03; kode terkunci; ringkasan angka bertaut ke
 * Daftar Pengguna; Admin KKKS aktif atau banner Belum ada admin + Undang Admin KKKS), Akses, Wilayah Kerja, Riwayat (Jejak Audit).
 * Jumlah grup tidak ditampilkan (fitur Grup ditahan KD-03).
 */
import { useQueryClient } from '@tanstack/react-query';
import { Ban, Lock, RotateCcw } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { AccountStatusBadge } from '@/components/patterns/AccountStatusBadge';
import { Callout } from '@/components/patterns/Callout';
import { EmptyState } from '@/components/patterns/EmptyState';
import { KeyValueList, type KeyValueItem } from '@/components/patterns/KeyValueList';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { TextField } from '@/components/ui/TextField';
import { formatTanggal, formatTanggalJam } from '@/lib/format';
import { BADAN_HUKUM_MAX, ORG_NAMA_MAX, ORG_NAMA_MIN, SKEMA_KONTRAK, type SkemaKontrak } from '@/lib/org-rules';
import { inviterRoleOf } from '@/lib/user-rules';
import { isServiceError, services, type OrgDetail } from '@/services';
import { useSession } from '../../session/SessionProvider';
import { InviteDialog } from '../../users/components/InviteDialog';
import { orgCopy } from '../copy';
import { ORGS_KEY, useOrgDetail, useOrgHistory, useOrgMutation } from '../hooks';
import { OrgAccessTab } from './OrgAccessTab';
import { DeactivateOrgDialog, ReactivateOrgDialog } from './OrgStatusDialogs';
import { OrgWorkAreaTab } from './OrgWorkAreaTab';

const p = orgCopy.panel;
export type OrgLevel = 'admin' | 'teknis' | 'baca';

export function OrgStatusBadge({ status }: { status: 'Aktif' | 'Nonaktif' }) {
  // Arahan PM 14 Okt 2026: status berwarna (Figma 109:16180); Design Brief B1: Aktif hijau, Nonaktif abu.
  return <AccountStatusBadge label={status === 'Aktif' ? orgCopy.aktif : orgCopy.nonaktif} tone={status === 'Aktif' ? 'success' : 'muted'} />;
}

type Field = 'nama' | 'badanHukum' | 'skema';

function ProfilTab({ org, level, onInvitePic }: { org: OrgDetail; level: OrgLevel; onInvitePic?: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [edit, setEdit] = useState<Field | null>(null);
  const [value, setValue] = useState('');
  const [err, setErr] = useState<string>();
  const [alert, setAlert] = useState<string>();
  const save = useOrgMutation(() =>
    services.orgs.update(org.kode, {
      nama: edit === 'nama' ? value : org.nama,
      badanHukum: edit === 'badanHukum' ? value : org.badanHukum,
      skema: edit === 'skema' ? ((value || undefined) as SkemaKontrak | undefined) : org.skema,
      versi: org.versi,
    }),
  );
  const canEdit = level === 'admin';

  function start(f: Field) {
    setEdit(f);
    setErr(undefined);
    setAlert(undefined);
    setValue(f === 'nama' ? org.nama : f === 'badanHukum' ? (org.badanHukum ?? '') : (org.skema ?? ''));
  }

  function submit() {
    if (edit === 'nama' && !value.trim()) return setErr(orgCopy.e.namaKosong);
    if (edit === 'nama' && (value.trim().length < ORG_NAMA_MIN || value.trim().length > ORG_NAMA_MAX)) return setErr(orgCopy.e.namaPanjang);
    if (edit === 'badanHukum' && value.length > BADAN_HUKUM_MAX) return setErr(orgCopy.e.badanHukumPanjang);
    save.mutate(undefined, {
      onSuccess: () => {
        setEdit(null);
        toast.show({ title: p.toastUbah });
      },
      onError: (x) => {
        if (isServiceError(x, 'VERSION_CONFLICT')) {
          // FR-ORG-11: data terbaru dimuat.
          setAlert(p.konflik);
          setEdit(null);
          void qc.invalidateQueries({ queryKey: ORGS_KEY });
        } else if (isServiceError(x, 'ORG_NAME_TAKEN')) setErr(orgCopy.e.namaDipakai);
        else if (isServiceError(x, 'NO_CHANGES')) setEdit(null);
        else setErr(p.gagalUbah);
      },
    });
  }

  const editor = (f: Field, label: string): ReactNode =>
    f === 'skema' ? (
      <Select label={label} hideLabel placeholder={orgCopy.tambahDialog.skemaPlaceholder} value={value || undefined} onValueChange={setValue} options={SKEMA_KONTRAK.map((s) => ({ value: s, label: s }))} />
    ) : (
      <TextField label={label} hideLabel value={value} onChange={(x) => (setValue(x.target.value), setErr(undefined))} error={err} autoFocus />
    );

  const row = (f: Field, label: string, shown: ReactNode): KeyValueItem =>
    edit === f
      ? {
          key: f,
          label,
          value: (
            <div className="flex flex-col gap-2">
              {editor(f, label)}
              <div className="flex gap-2">
                <Button size="md" variant="primary" onClick={submit} loading={save.isPending} loadingLabel={orgCopy.tambahDialog.menyimpan}>
                  {p.simpan}
                </Button>
                <Button size="md" onClick={() => setEdit(null)} disabled={save.isPending}>
                  {p.batal}
                </Button>
              </div>
            </div>
          ),
        }
      : {
          key: f,
          label,
          value: shown,
          action: canEdit ? (
            <Button variant="link" onClick={() => start(f)}>
              {p.ubah}
            </Button>
          ) : undefined,
        };

  const usersLink = (q: string) => `/pengguna?organisasi=${encodeURIComponent(org.id)}${q}`;
  const stats = [
    { label: p.ringkasan.pengguna, n: org.penggunaAktif, to: usersLink('&status=Aktif') },
    { label: p.ringkasan.pic, n: org.picAktif, to: usersLink('&role=R-04') },
    { label: p.ringkasan.undangan, n: org.undanganTertunda, to: usersLink('&status=Diundang') },
  ];

  return (
    <div className="flex flex-col gap-6">
      {alert && (
        <Callout variant="peringatan">
          {alert}
        </Callout>
      )}
      <KeyValueList
        fullWidth
        items={[
          row('nama', p.field.nama, org.nama),
          {
            key: 'kode',
            label: p.field.kode,
            value: (
              <span className="flex flex-col">
                <span className="font-mono">{org.kode}</span>
                <span className="text-caption font-normal text-ink-muted">{p.kodeTerkunci}</span>
              </span>
            ),
            action: <Lock aria-label={p.kodeTerkunci} size={14} strokeWidth={1.8} className="text-ink-muted" />,
          },
          { key: 'jenis', label: p.field.jenis, value: org.jenis },
          row('badanHukum', p.field.badanHukum, org.badanHukum ?? '—'),
          row('skema', p.field.skema, org.skema ?? '—'),
        ]}
      />
      {level !== 'baca' && (
        <dl className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 rounded-lg bg-surface-subtle p-3 shadow-[inset_0_0_0_1px_var(--color-border-subtle)]">
              <dt className="text-caption text-ink-muted">{s.label}</dt>
              <dd>
                <Link to={s.to} className="text-metric tabular-nums text-ink underline-offset-2 hover:underline">
                  {s.n}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      )}
      <section className="flex flex-col gap-2">
        <h3 className="text-body-strong text-ink">{p.picAktif}</h3>
        {org.picNama.length ? (
          <ul className="flex flex-col gap-1 text-body text-ink">
            {org.picNama.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : org.jenis === 'KKKS' ? (
          // Masukan PM 15 Okt 2026: EmptyState dengan tombol, bukan Callout peringatan.
          <EmptyState
            title={p.bannerTanpaPic}
            description={p.tanpaAdminIsi}
            action={onInvitePic && org.status === 'Aktif' ? <Button onClick={onInvitePic}>{p.undangPic}</Button> : undefined}
            className="py-6"
          />
        ) : (
          <p className="text-body text-ink-muted">—</p>
        )}
      </section>
    </div>
  );
}

function RiwayatTab({ kode }: { kode: string }) {
  const h = useOrgHistory(kode);
  if (h.isPending) return <p role="status" className="text-body text-ink-muted">{orgCopy.memuat}</p>;
  if (!h.data?.length) return <p className="text-body text-ink-muted">{orgCopy.riwayat.kosong}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {h.data.map((e) => (
        <li key={e.id} className="flex flex-col gap-0.5">
          <span className="text-body text-ink">{e.perubahan}</span>
          <span className="text-caption text-ink-muted">{[e.pelaku, formatTanggalJam(e.waktu), e.alasan ? `Alasan: ${e.alasan}` : null].filter(Boolean).join(' · ')}</span>
        </li>
      ))}
    </ul>
  );
}

export function OrgDetailContent({ org, level, onInvitePic }: { org: OrgDetail; level: OrgLevel; onInvitePic?: () => void }) {
  return (
    <Tabs
      label={p.tabLabel}
      items={[
        { value: 'profil', label: p.tabProfil, content: <ProfilTab org={org} level={level} onInvitePic={onInvitePic} /> },
        { value: 'akses', label: p.tabAkses, content: <OrgAccessTab org={org} canEdit={level !== 'baca'} /> },
        { value: 'wk', label: p.tabWk, content: <OrgWorkAreaTab org={org} canEdit={level === 'admin'} /> },
        ...(level !== 'baca' ? [{ value: 'riwayat', label: p.tabRiwayat, content: <RiwayatTab kode={org.kode} /> }] : []),
      ]}
    />
  );
}

export function OrgHeaderNotes({ org }: { org: OrgDetail }) {
  if (org.status !== 'Nonaktif' || !org.nonaktif) return null;
  return <p className="rounded-md bg-surface-sunken p-3 text-body text-ink">{p.bannerNonaktif(formatTanggal(org.nonaktif.sejak), org.nonaktif.alasan)}</p>;
}

/** State navigasi ke halaman detail: query string daftar (tombol kembali memulihkan filter) dan permintaan membuka
 * dialog Undang Admin KKKS (dari Toast "Organisasi ditambahkan.", FR-ORG-08). */
export interface OrgDetailNavState {
  from?: string;
  undangPic?: number;
}

/**
 * Halaman detail organisasi /organisasi/:kode (R-03 admin, R-07 teknis). Arahan PM 15 Okt 2026: halaman penuh, bukan
 * panel samping; pola halaman turunan DS (tombol kembali ke daftar, jejak lokasi "Organisasi › {nama}"). Aksi status
 * satu tombol di kanan PageHeader.
 */
export function OrgDetailPage({ level }: { level: Exclude<OrgLevel, 'baca'> }) {
  const { kode } = useParams();
  const { session } = useSession();
  const location = useLocation();
  const state = (location.state as OrgDetailNavState | null) ?? {};
  const backTo = `/organisasi${state.from ?? ''}`;
  const detail = useOrgDetail(kode);
  const [dialog, setDialog] = useState<'nonaktifkan' | 'aktifkan' | null>(null);
  const [invite, setInvite] = useState(false);
  const inviter = session ? inviterRoleOf(session.user.roles) : null;
  useEffect(() => {
    if (state.undangPic) setInvite(true);
  }, [state.undangPic]);
  const org = detail.data;
  const crumbs = (nama: string) => [{ label: p.crumb, to: backTo }, { label: nama }];
  const back = { to: backTo, label: p.kembali };
  if (!org) {
    const judul = detail.isError ? p.tidakDitemukan : orgCopy.memuat;
    return (
      <>
        <PageHeader title={judul} breadcrumbs={crumbs(detail.isError ? p.tidakDitemukan : '…')} back={back} />
        <PageBody>
          <p role="status" className="text-body text-ink-muted">
            {detail.isError ? p.tidakDitemukanIsi : orgCopy.memuat}
          </p>
        </PageBody>
      </>
    );
  }
  // Hanya satu aksi (Nonaktifkan / Aktifkan kembali) → tombol langsung, bukan menu "⋯" (masukan PM 15 Okt 2026).
  const statusAction =
    level === 'admin' && (org.dapatDinonaktifkan || org.status === 'Nonaktif') ? (
      // Gaya tombol (masukan PM 15 Okt 2026): Aktifkan kembali = aksi utama (primer); Nonaktifkan = sekunder berikon
      // (destructive hanya di ConfirmDialog, DS Button).
      org.status === 'Aktif' ? (
        <Button icon={<Ban aria-hidden size={16} strokeWidth={1.8} />} onClick={() => setDialog('nonaktifkan')}>
          {p.nonaktifkan}
        </Button>
      ) : (
        <Button variant="primary" icon={<RotateCcw aria-hidden size={16} strokeWidth={1.8} />} onClick={() => setDialog('aktifkan')}>
          {p.aktifkan}
        </Button>
      )
    ) : undefined;
  return (
    <>
      <PageHeader
        title={org.nama}
        titleAside={<OrgStatusBadge status={org.status} />}
        summary={<span className="font-mono">{org.kode}</span>}
        breadcrumbs={crumbs(org.nama)}
        back={back}
        actions={statusAction}
      />
      <PageBody>
        {org.nonaktif && (
          <div className="max-w-[720px]">
            <OrgHeaderNotes org={org} />
          </div>
        )}
        <Section>
          <OrgDetailContent org={org} level={level} onInvitePic={() => setInvite(true)} />
        </Section>
      </PageBody>
      {dialog === 'nonaktifkan' && <DeactivateOrgDialog org={org} onClose={() => setDialog(null)} />}
      {dialog === 'aktifkan' && <ReactivateOrgDialog org={org} onClose={() => setDialog(null)} />}
      {inviter && session && invite && (
        <InviteDialog
          open
          onOpenChange={(o) => !o && setInvite(false)}
          inviter={inviter}
          ownOrg={session.user.organisasi}
          prefill={{ organisasiId: org.id, roles: inviter === 'R-04' ? undefined : ['R-04'] }}
        />
      )}
    </>
  );
}
