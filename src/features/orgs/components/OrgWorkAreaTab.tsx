/**
 * Tab Wilayah Kerja — PRD Kelola Organisasi KKKS 4.9 (FR-ORG-41..45, Tabel O-4). Tabel nama, kode (mono), status,
 * jumlah Pelapor; WK yang juga dioperasikan KKKS lain ditandai "Dioperasikan bersama" tanpa menyebut KKKS lain.
 * Tambah/ubah/nonaktifkan hanya Admin SKK (FR-ORG-41); Admin KKKS mode baca (FR-ORG-45).
 * Disetujui PM 14 Okt 2026: KKKS operator bersama belum dapat dipilih dari layar ini (hanya operator = organisasi yang dibuka).
 */
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog, Dialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Textarea } from '@/components/ui/Textarea';
import { KODE_PATTERN, ORG_NAMA_MAX, ORG_NAMA_MIN } from '@/lib/org-rules';
import { ALASAN_LAINNYA_MAX } from '@/lib/user-rules';
import { isServiceError, services, type OrgDetail, type OrgWorkArea } from '@/services';
import { orgCopy } from '../copy';
import { useOrgMutation } from '../hooks';

const c = orgCopy.wk;
const e = orgCopy.e;

function WkDialog({ org, wk, onClose }: { org: OrgDetail; wk?: OrgWorkArea; onClose: () => void }) {
  const toast = useToast();
  const [nama, setNama] = useState(wk?.nama ?? '');
  const [kode, setKode] = useState('');
  const [errors, setErrors] = useState<Partial<Record<'nama' | 'kode', string>>>({});
  const m = useOrgMutation(() => (wk ? services.orgs.renameWorkArea(org.kode, wk.id, nama) : services.orgs.addWorkArea(org.kode, { kode, nama })));
  function submit() {
    const x: typeof errors = {};
    if (nama.trim().length < ORG_NAMA_MIN || nama.trim().length > ORG_NAMA_MAX) x.nama = e.wkNamaPanjang;
    if (!wk && !KODE_PATTERN.test(kode.trim().toUpperCase())) x.kode = e.kodeFormat;
    setErrors(x);
    if (Object.keys(x).length) return;
    m.mutate(undefined, {
      onSuccess: () => {
        toast.show({ title: wk ? c.toastUbah : c.toastTambah });
        onClose();
      },
      onError: (err) => {
        if (isServiceError(err, 'ORG_CODE_TAKEN')) setErrors({ kode: e.wkKodeDipakai });
        else if (isServiceError(err, 'ORG_NAME_TAKEN')) setErrors({ nama: e.wkNamaDipakai });
        else setErrors({ nama: orgCopy.panel.gagalUbah });
      },
    });
  }
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={wk ? c.ubah : c.tambah}
      description={wk ? <span className="font-mono">{wk.kode}</span> : org.nama}
      closeLabel={orgCopy.panel.batal}
      footer={
        <>
          <Button onClick={onClose} disabled={m.isPending}>
            {orgCopy.panel.batal}
          </Button>
          <Button variant="primary" onClick={submit} loading={m.isPending} loadingLabel={orgCopy.tambahDialog.menyimpan}>
            {c.simpan}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField label={c.nama} required showRequired placeholder={c.namaPlaceholder} value={nama} onChange={(x) => (setNama(x.target.value), setErrors((p) => ({ ...p, nama: undefined })))} error={errors.nama} />
        {!wk && (
          <TextField
            label={c.kode}
            required
            showRequired
            className="font-mono"
            value={kode}
            onChange={(x) => (setKode(x.target.value.toUpperCase()), setErrors((p) => ({ ...p, kode: undefined })))}
            hint={c.kodeHint}
            error={errors.kode}
          />
        )}
      </div>
    </Dialog>
  );
}

function WkStatusDialog({ org, wk, onClose }: { org: OrgDetail; wk: OrgWorkArea; onClose: () => void }) {
  const toast = useToast();
  const [alasan, setAlasan] = useState('');
  const [err, setErr] = useState<string>();
  const m = useOrgMutation(() => services.orgs.setWorkAreaStatus(org.kode, wk.id, !wk.aktif, alasan || undefined));
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={wk.aktif ? c.nonaktifkanJudul(wk.nama) : `${c.aktifkan} ${wk.nama}?`}
      description={wk.aktif ? c.nonaktifkanIsi(wk.pelapor) : undefined}
      closeLabel={orgCopy.panel.batal}
      cancelLabel={orgCopy.panel.batal}
      confirmLabel={wk.aktif ? c.nonaktifkan : c.aktifkan}
      destructive={wk.aktif}
      loading={m.isPending}
      loadingLabel={orgCopy.tambahDialog.menyimpan}
      onConfirm={() => {
        if (wk.aktif && !alasan.trim()) return setErr(e.alasanKosong);
        m.mutate(undefined, {
          onSuccess: () => {
            toast.show({ title: c.toastUbah });
            onClose();
          },
        });
      }}
    >
      {wk.aktif && <Textarea label={c.alasan} required maxLength={ALASAN_LAINNYA_MAX} showCount value={alasan} onChange={(x) => (setAlasan(x.target.value), setErr(undefined))} error={err} />}
    </ConfirmDialog>
  );
}

export function OrgWorkAreaTab({ org, canEdit }: { org: OrgDetail; canEdit: boolean }) {
  const [dialog, setDialog] = useState<{ kind: 'add' } | { kind: 'rename' | 'status'; wk: OrgWorkArea } | null>(null);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-heading-3 text-ink">{c.judul}</h3>
        {canEdit && (
          <Button icon={<Plus aria-hidden size={14} strokeWidth={1.8} />} onClick={() => setDialog({ kind: 'add' })}>
            {c.tambah}
          </Button>
        )}
      </div>
      {org.wilayahKerja.length === 0 ? (
        <p className="text-body-dense text-ink-muted">{c.kosong}</p>
      ) : (
        <table className="w-full border-collapse text-left text-body-dense">
          <caption className="sr-only">{c.judul}</caption>
          <thead>
            <tr className="bg-surface-sunken text-label text-ink">
              <th scope="col" className="py-2 pr-3 font-semibold">{c.kolom.nama}</th>
              <th scope="col" className="py-2 pr-3 font-semibold">{c.kolom.status}</th>
              <th scope="col" className="py-2 text-right font-semibold">{c.kolom.pelapor}</th>
            </tr>
          </thead>
          <tbody>
            {org.wilayahKerja.map((w) => (
              <tr key={w.id} className={`border-b border-border-subtle align-top last:border-b-0 ${w.aktif ? '' : 'text-ink-subtle'}`}>
                <td className="py-3 pr-3">
                  <span className="font-medium text-ink">{w.nama}</span>
                  <span className="block font-mono text-caption text-ink-subtle">{w.kode}</span>
                  {w.dioperasikanBersama && <span className="block text-caption text-ink-muted">{c.bersama}</span>}
                  {canEdit && (
                    <span className="mt-1 flex gap-4">
                      <Button variant="link" onClick={() => setDialog({ kind: 'rename', wk: w })}>
                        {c.ubah}
                      </Button>
                      <Button variant="link" onClick={() => setDialog({ kind: 'status', wk: w })}>
                        {w.aktif ? c.nonaktifkan : c.aktifkan}
                      </Button>
                    </span>
                  )}
                </td>
                <td className="py-3 pr-3">{w.aktif ? orgCopy.aktif : orgCopy.nonaktif}</td>
                <td className="py-3 text-right font-mono tabular-nums">{w.pelapor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {dialog?.kind === 'add' && <WkDialog org={org} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'rename' && <WkDialog org={org} wk={dialog.wk} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'status' && <WkStatusDialog org={org} wk={dialog.wk} onClose={() => setDialog(null)} />}
    </section>
  );
}
