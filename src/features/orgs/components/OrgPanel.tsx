/**
 * Panel detail organisasi — PRD Kelola Organisasi KKKS FR-ORG-10..13, 20, 40, Design Brief B2. Tidak ada Figma:
 * pola panel samping Manajemen Pengguna (SidePanel 480px; Figma 109:16236) — PR-11.
 * Header: nama, badge status, kode mono, menu ··· Nonaktifkan / Aktifkan kembali (R-03; tidak untuk SKK Migas dan
 * Kontraktor). Tab Profil (ubah inline nama/badan hukum/skema untuk R-03; kode terkunci; ringkasan angka bertaut ke
 * Daftar Pengguna; PIC aktif atau banner Tanpa PIC + Undang PIC), Akses, Wilayah Kerja, Riwayat (Jejak Audit).
 * Jumlah grup tidak ditampilkan (fitur Grup ditahan KD-03).
 */
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Lock, MoreHorizontal } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AccountStatusBadge } from '@/components/patterns/AccountStatusBadge';
import { KeyValueList, type KeyValueItem } from '@/components/patterns/KeyValueList';
import { Menu } from '@/components/patterns/Menu';
import { SidePanel } from '@/components/patterns/SidePanel';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { TextField } from '@/components/ui/TextField';
import { formatTanggal, formatTanggalJam } from '@/lib/format';
import { BADAN_HUKUM_MAX, ORG_NAMA_MAX, ORG_NAMA_MIN, SKEMA_KONTRAK, type SkemaKontrak } from '@/lib/org-rules';
import { isServiceError, services, type OrgDetail } from '@/services';
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
            <button type="button" onClick={() => start(f)} className="text-body-dense font-semibold text-ink underline">
              {p.ubah}
            </button>
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
        <p role="alert" className="flex items-start gap-[10px] rounded-md bg-caution-bg p-3 text-caption text-caution-ink">
          <AlertCircle aria-hidden size={16} strokeWidth={1.8} className="shrink-0" />
          {alert}
        </p>
      )}
      <KeyValueList
        items={[
          row('nama', p.field.nama, org.nama),
          {
            key: 'kode',
            label: p.field.kode,
            value: (
              <span className="flex flex-col">
                <span className="font-mono">{org.kode}</span>
                <span className="text-caption font-normal text-ink-subtle">{p.kodeTerkunci}</span>
              </span>
            ),
            action: <Lock aria-label={p.kodeTerkunci} size={14} strokeWidth={1.8} className="text-ink-subtle" />,
          },
          { key: 'jenis', label: p.field.jenis, value: org.jenis },
          row('badanHukum', p.field.badanHukum, org.badanHukum ?? '—'),
          row('skema', p.field.skema, org.skema ?? '—'),
        ]}
      />
      {level !== 'baca' && (
        <dl className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 rounded-md border border-border p-3">
              <dt className="text-caption text-ink-muted">{s.label}</dt>
              <dd>
                <Link to={s.to} className="font-mono text-heading-2 tabular-nums text-ink underline-offset-2 hover:underline">
                  {s.n}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      )}
      <section className="flex flex-col gap-2">
        <h3 className="text-heading-3 text-ink">{p.picAktif}</h3>
        {org.picNama.length ? (
          <ul className="flex flex-col gap-1 text-body-dense text-ink">
            {org.picNama.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : org.jenis === 'KKKS' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-caution-bg p-3 text-body-dense text-caution-ink">
            <span>{p.bannerTanpaPic}</span>
            {onInvitePic && org.status === 'Aktif' && <Button onClick={onInvitePic}>{p.undangPic}</Button>}
          </div>
        ) : (
          <p className="text-body-dense text-ink-muted">—</p>
        )}
      </section>
    </div>
  );
}

function RiwayatTab({ kode }: { kode: string }) {
  const h = useOrgHistory(kode);
  if (h.isPending) return <p role="status" className="text-body-dense text-ink-muted">{orgCopy.memuat}</p>;
  if (!h.data?.length) return <p className="text-body-dense text-ink-muted">{orgCopy.riwayat.kosong}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {h.data.map((e) => (
        <li key={e.id} className="flex flex-col gap-0.5">
          <span className="text-body-dense text-ink">{e.perubahan}</span>
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
  return <p className="rounded-md bg-surface-sunken p-3 text-body-dense text-ink">{p.bannerNonaktif(formatTanggal(org.nonaktif.sejak), org.nonaktif.alasan)}</p>;
}

export function OrgPanel({ kode, level, onClose, onInvitePic }: { kode: string; level: OrgLevel; onClose: () => void; onInvitePic: (org: OrgDetail) => void }) {
  const detail = useOrgDetail(kode);
  const [dialog, setDialog] = useState<'nonaktifkan' | 'aktifkan' | null>(null);
  const org = detail.data;
  if (!org) {
    return (
      <SidePanel open onOpenChange={(o) => !o && onClose()} title={detail.isError ? p.tidakDitemukan : '…'} closeLabel={p.tutup}>
        <p role="status" className="text-body-dense text-ink-muted">
          {detail.isError ? p.tidakDitemukanIsi : orgCopy.memuat}
        </p>
      </SidePanel>
    );
  }
  const menu =
    level === 'admin' && org.dapatDinonaktifkan ? (
      <Menu
        items={[org.status === 'Aktif' ? { key: 'n', label: p.nonaktifkan, onSelect: () => setDialog('nonaktifkan') } : { key: 'a', label: p.aktifkan, onSelect: () => setDialog('aktifkan') }]}
        trigger={<Button aria-label={p.menu} icon={<MoreHorizontal aria-hidden size={14} strokeWidth={1.8} />} className="px-2" />}
      />
    ) : null;
  return (
    <>
      <SidePanel
        open
        onOpenChange={(o) => !o && onClose()}
        title={org.nama}
        titleAside={<OrgStatusBadge status={org.status} />}
        subtitle={<span className="font-mono">{org.kode}</span>}
        actions={
          menu || org.nonaktif ? (
            <div className="flex flex-col gap-3">
              <OrgHeaderNotes org={org} />
              {org.status === 'Nonaktif' && level === 'admin' ? <div><Button onClick={() => setDialog('aktifkan')}>{p.aktifkan}</Button></div> : menu}
            </div>
          ) : undefined
        }
        closeLabel={p.tutup}
      >
        <OrgDetailContent org={org} level={level} onInvitePic={() => onInvitePic(org)} />
      </SidePanel>
      {dialog === 'nonaktifkan' && <DeactivateOrgDialog org={org} onClose={() => setDialog(null)} />}
      {dialog === 'aktifkan' && <ReactivateOrgDialog org={org} onClose={() => setDialog(null)} />}
    </>
  );
}
