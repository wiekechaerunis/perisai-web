/**
 * Modal Nonaktifkan / Aktifkan kembali organisasi — PRD Kelola Organisasi KKKS FR-ORG-14..17, Tabel O-2, O-3,
 * Design Brief B4/B5. Blok dampak memakai warna caution (kondisi abnormal; DS tidak memakai merah untuk ini).
 * Tombol "Nonaktifkan organisasi" nonaktif sampai alasan terisi dan kode cocok.
 */
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { Textarea } from '@/components/ui/Textarea';
import { ALASAN_NONAKTIF_ORG } from '@/lib/org-rules';
import { ALASAN_LAINNYA_MAX } from '@/lib/user-rules';
import { isServiceError, services, type OrgDetail } from '@/services';
import { orgCopy } from '../copy';
import { useOrgMutation } from '../hooks';

const c = orgCopy.nonaktifkan;

export function DeactivateOrgDialog({ org, onClose }: { org: OrgDetail; onClose: () => void }) {
  const toast = useToast();
  const impact = useQuery({ queryKey: ['orgs', 'impact', org.kode], queryFn: () => services.orgs.impact(org.kode) });
  const [alasan, setAlasan] = useState('');
  const [penjelasan, setPenjelasan] = useState('');
  const [konfirmasi, setKonfirmasi] = useState('');
  const [kodeErr, setKodeErr] = useState<string>();
  const m = useOrgMutation(async () => {
    const r = await services.orgs.deactivate(org.kode, { alasan, penjelasan: alasan === 'Lainnya' ? penjelasan : undefined }, konfirmasi);
    toast.show({ title: c.sukses(org.nama, r.pengguna) });
    return services.orgs.get(org.kode);
  });
  const lengkap = !!alasan && (alasan !== 'Lainnya' || (!!penjelasan.trim() && penjelasan.length <= ALASAN_LAINNYA_MAX)) && konfirmasi.trim() === org.kode;
  const dampak = impact.data ? c.dampak(impact.data.pengguna, impact.data.sesi, impact.data.undangan) : [];
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={c.judul(org.nama)}
      description={<span className="font-mono">{org.kode}</span>}
      closeLabel={c.batal}
      cancelLabel={c.batal}
      confirmLabel={c.tombol}
      loading={m.isPending}
      loadingLabel={c.memproses}
      destructive
      confirmDisabled={!lengkap}
      onConfirm={() =>
        m.mutate(undefined, {
          onSuccess: onClose,
          onError: (err) => (isServiceError(err, 'CODE_MISMATCH') ? setKodeErr(c.kodeSalah(org.kode)) : setKodeErr(orgCopy.panel.gagalUbah)),
        })
      }
    >
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-1 rounded-md bg-caution-bg p-3 text-body-dense text-caution-ink">
          {dampak.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <p className="text-body-dense text-ink-muted">{c.catatan}</p>
        <Select
          label={c.alasan}
          placeholder={c.alasanPlaceholder}
          value={alasan || undefined}
          onValueChange={setAlasan}
          options={ALASAN_NONAKTIF_ORG.map((x) => ({ value: x, label: x }))}
        />
        {alasan === 'Lainnya' && <Textarea label={c.penjelasan} required maxLength={ALASAN_LAINNYA_MAX} showCount value={penjelasan} onChange={(x) => setPenjelasan(x.target.value)} />}
        <TextField
          label={c.konfirmasi(org.kode)}
          className="font-mono"
          autoComplete="off"
          value={konfirmasi}
          onChange={(x) => (setKonfirmasi(x.target.value), setKodeErr(undefined))}
          onBlur={() => konfirmasi && konfirmasi.trim() !== org.kode && setKodeErr(c.kodeSalah(org.kode))}
          error={kodeErr}
        />
      </div>
    </ConfirmDialog>
  );
}

export function ReactivateOrgDialog({ org, onClose }: { org: OrgDetail; onClose: () => void }) {
  const toast = useToast();
  const m = useOrgMutation(() => services.orgs.reactivate(org.kode));
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={c.aktifkanJudul(org.nama)}
      description={c.aktifkanIsi}
      closeLabel={c.batal}
      cancelLabel={c.batal}
      confirmLabel={orgCopy.panel.aktifkan}
      loading={m.isPending}
      loadingLabel={c.memproses}
      onConfirm={() =>
        m.mutate(undefined, {
          onSuccess: () => {
            toast.show({ title: c.aktifkanSukses(org.nama) });
            onClose();
          },
        })
      }
    />
  );
}

