/**
 * Buat role, ubah hak akses role, hapus role — PRD Katalog Role FR-KR-09, -09a..09f. "Design belum ada": dialog lebar
 * (pola dialog Undang, ukuran lg) dengan pemilih hak akses per modul × aksi (daftar modul & aksi dari satu sumber,
 * FR-KR-09a; aksi dibatasi jenis organisasi, FR-KR-09b). Ubah hak akses menampilkan jumlah pengguna terdampak dan
 * berlaku pada permintaan berikutnya tanpa mencabut sesi (FR-KR-09f).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog, Dialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { Textarea } from '@/components/ui/Textarea';
import { ACTION_LABEL, MODULE_IDS, MODULES, type Action, type CakupanBawaan, type ModuleId, type OrgType, type RoleId } from '@/lib/rbac';
import { allowedActions, CAKUPAN_PILIHAN, JENIS_LABEL } from '@/lib/role-catalog';
import { isServiceError, services, type RoleEntry, type RolePermissionInput } from '@/services';
import { roleCopy } from '../copy';
import { ROLES_KEY } from './RoleDialogs';

const c = roleCopy.izin;

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ROLES_KEY });
    void qc.invalidateQueries({ queryKey: ['role-catalog'] });
    void qc.invalidateQueries({ queryKey: ['users'] });
  };
}

export function toPermissionInput(izin: RoleEntry['izin']): RolePermissionInput {
  const out: RolePermissionInput = {};
  for (const m of MODULE_IDS) if (izin[m]?.length) out[m] = izin[m]!.map((g) => g.action);
  return out;
}

/** Pemilih hak akses: satu baris per modul, kotak centang per aksi yang diizinkan untuk jenis organisasi. */
export function PermissionPicker({ orgType, value, onChange, error }: { orgType: OrgType; value: RolePermissionInput; onChange: (v: RolePermissionInput) => void; error?: string }) {
  const allowed = allowedActions(orgType);
  const modules = MODULE_IDS.filter((m) => (allowed[m] ?? []).length > 0);
  const toggle = (m: ModuleId, a: Action) => {
    const cur = new Set(value[m] ?? []);
    if (cur.has(a)) cur.delete(a);
    else cur.add(a);
    onChange({ ...value, [m]: [...cur] });
  };
  const total = MODULE_IDS.reduce((n, m) => n + (value[m]?.length ?? 0), 0);
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby="izin-hint">
      <legend className="text-label text-ink-muted">{c.legend}</legend>
      <p id="izin-hint" className="text-caption text-ink-subtle">
        {c.hint(JENIS_LABEL[orgType])} · {c.terpilih(total)}
      </p>
      <div className="max-h-[320px] overflow-y-auto rounded-md border border-border">
        <table className="w-full border-collapse text-left text-body-dense">
          <caption className="sr-only">{c.legend}</caption>
          <tbody>
            {modules.map((m) => (
              <tr key={m} className="border-b border-border-subtle align-top last:border-b-0">
                <th scope="row" className="w-[45%] px-3 py-2 font-medium text-ink">
                  <span className="font-mono text-caption text-ink-subtle">{m}</span> {MODULES[m].name}
                </th>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {(allowed[m] ?? []).map((a) => (
                      <label key={a} className="flex items-center gap-[6px] text-body-dense text-ink">
                        <input type="checkbox" checked={(value[m] ?? []).includes(a)} onChange={() => toggle(m, a)} className="h-4 w-4 accent-[var(--color-action)]" />
                        {ACTION_LABEL[a]}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="text-caption text-error-ink">{error}</p>}
    </fieldset>
  );
}

export function CreateRoleDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: RoleId) => void }) {
  const toast = useToast();
  const invalidate = useInvalidate();
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [orgType, setOrgType] = useState<OrgType>('KKKS');
  const [cakupan, setCakupan] = useState<CakupanBawaan>('Organisasi sendiri');
  const [izin, setIzin] = useState<RolePermissionInput>({});
  const [errors, setErrors] = useState<Partial<Record<'nama' | 'deskripsi' | 'izin', string>>>({});
  const m = useMutation({ mutationFn: () => services.roles.create({ nama, deskripsi, orgType, cakupan, izin }) });
  function submit() {
    const x: typeof errors = {};
    if (nama.trim().length < 3 || nama.trim().length > 60) x.nama = roleCopy.ubah.namaSalah;
    if (!deskripsi.trim()) x.deskripsi = roleCopy.ubah.deskripsiKosong;
    if (!MODULE_IDS.some((mm) => izin[mm]?.length)) x.izin = c.minimal;
    setErrors(x);
    if (Object.keys(x).length) return;
    m.mutate(undefined, {
      onSuccess: (r) => {
        invalidate();
        toast.show({ title: c.dibuat(r.id) });
        onCreated(r.id);
      },
      onError: (err) => {
        if (isServiceError(err, 'ORG_NAME_TAKEN')) setErrors({ nama: roleCopy.ubah.namaDipakai });
        else setErrors({ izin: c.gagal });
      },
    });
  }
  return (
    <Dialog
      open
      size="lg"
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={c.buatJudul}
      description={c.buatDeskripsi}
      closeLabel={roleCopy.ubah.batal}
      footer={
        <>
          <Button onClick={onClose} disabled={m.isPending}>
            {roleCopy.ubah.batal}
          </Button>
          <Button variant="primary" onClick={submit} loading={m.isPending} loadingLabel={roleCopy.ubah.menyimpan}>
            {c.buat}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField label={roleCopy.ubah.nama} required showRequired value={nama} onChange={(e) => (setNama(e.target.value), setErrors((p) => ({ ...p, nama: undefined })))} error={errors.nama} />
        <Textarea label={roleCopy.ubah.deskripsi} required maxLength={300} showCount value={deskripsi} onChange={(e) => (setDeskripsi(e.target.value), setErrors((p) => ({ ...p, deskripsi: undefined })))} error={errors.deskripsi} />
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label={roleCopy.panel.jenis}
            value={orgType}
            onValueChange={(v) => (setOrgType(v as OrgType), setIzin({}))}
            options={(['SKK Migas', 'KKKS', 'Kontraktor'] as OrgType[]).map((t) => ({ value: t, label: JENIS_LABEL[t] }))}
            hint={c.jenisHint}
          />
          <Select label={roleCopy.panel.cakupan} value={cakupan} onValueChange={(v) => setCakupan(v as CakupanBawaan)} options={CAKUPAN_PILIHAN.map((x) => ({ value: x, label: x }))} />
        </div>
        <PermissionPicker orgType={orgType} value={izin} onChange={(v) => (setIzin(v), setErrors((p) => ({ ...p, izin: undefined })))} error={errors.izin} />
      </div>
    </Dialog>
  );
}

export function EditPermissionsDialog({ role, onClose }: { role: RoleEntry; onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidate();
  const [izin, setIzin] = useState<RolePermissionInput>(toPermissionInput(role.izin));
  const [err, setErr] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const m = useMutation({ mutationFn: () => services.roles.updatePermissions(role.id, izin) });
  function save() {
    m.mutate(undefined, {
      onSuccess: () => {
        invalidate();
        toast.show({ title: c.diubah(role.id) });
        onClose();
      },
      onError: (e) => {
        setConfirm(false);
        if (isServiceError(e, 'NO_CHANGES')) onClose();
        else setErr(isServiceError(e, 'VALIDATION') ? c.minimal : c.gagal);
      },
    });
  }
  if (confirm) {
    // FR-KR-09f: modal konfirmasi menampilkan jumlah pengguna terdampak.
    return (
      <ConfirmDialog
        open
        onOpenChange={(o) => !o && !m.isPending && setConfirm(false)}
        title={c.konfirmasiJudul(role.id, role.nama)}
        description={c.konfirmasiIsi(role.pengguna)}
        closeLabel={roleCopy.ubah.batal}
        cancelLabel={roleCopy.ubah.batal}
        confirmLabel={c.simpan}
        loading={m.isPending}
        loadingLabel={roleCopy.ubah.menyimpan}
        onConfirm={save}
      />
    );
  }
  return (
    <Dialog
      open
      size="lg"
      onOpenChange={(o) => !o && onClose()}
      title={c.ubahJudul}
      description={
        <>
          <span className="font-mono">{role.id}</span> {role.nama}
        </>
      }
      closeLabel={roleCopy.ubah.batal}
      footer={
        <>
          <Button onClick={onClose}>{roleCopy.ubah.batal}</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!MODULE_IDS.some((mm) => izin[mm]?.length)) return setErr(c.minimal);
              setConfirm(true);
            }}
          >
            {c.lanjut}
          </Button>
        </>
      }
    >
      <PermissionPicker orgType={role.orgType} value={izin} onChange={(v) => (setIzin(v), setErr(undefined))} error={err} />
    </Dialog>
  );
}

export function DeleteRoleDialog({ role, onClose, onDeleted }: { role: RoleEntry; onClose: () => void; onDeleted: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidate();
  const m = useMutation({ mutationFn: () => services.roles.remove(role.id) });
  const dipakai = role.pengguna > 0;
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={c.hapusJudul(role.id, role.nama)}
      // FR-KR-09d: masih dipakai → arahkan menonaktifkan.
      description={dipakai ? c.masihDipakai(role.pengguna) : c.hapusIsi}
      closeLabel={roleCopy.ubah.batal}
      cancelLabel={roleCopy.ubah.batal}
      confirmLabel={c.hapus}
      destructive
      confirmDisabled={dipakai}
      loading={m.isPending}
      loadingLabel={roleCopy.ubah.menyimpan}
      onConfirm={() =>
        m.mutate(undefined, {
          onSuccess: () => {
            invalidate();
            toast.show({ title: c.dihapus(role.id) });
            onDeleted();
          },
        })
      }
    />
  );
}
