/**
 * Isian langsung di halaman detail role (arahan PM 15 Okt 2026, menggantikan dialog "Ubah nama dan deskripsi" dan
 * "Ubah hak akses"):
 * - RoleInfoForm: nama dan deskripsi dapat diubah langsung (FR-KR-08); jenis organisasi, cakupan, status, dan jumlah
 *   pengguna tetap baca saja. Tombol Batal + Simpan muncul bila ada perubahan.
 * - RolePermissionsForm: matriks hak akses modul × aksi yang sama dengan Buat role (FR-KR-09a/09b). Simpan memunculkan
 *   konfirmasi jumlah pengguna terdampak (FR-KR-09f); berlaku pada permintaan berikutnya tanpa mencabut sesi.
 * Status "ada perubahan" dilaporkan ke halaman lewat `onDirtyChange` (konfirmasi tinggalkan halaman).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Section } from '@/components/layout/Section';
import { ConfirmDialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Textarea } from '@/components/ui/Textarea';
import { MODULE_IDS } from '@/lib/rbac';
import { isServiceError, services, type RoleEntry, type RolePermissionInput } from '@/services';
import { roleCopy as c } from '../copy';
import { ROLES_KEY } from './RoleDialogs';
import { PermissionPicker, toPermissionInput } from './RolePermissionDialogs';

function useInvalidateRoles() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ROLES_KEY });
    void qc.invalidateQueries({ queryKey: ['role-catalog'] });
    void qc.invalidateQueries({ queryKey: ['users'] });
  };
}

/**
 * Baris tombol Batal + Simpan di bawah isian, selalu tampil (masukan PM 15 Okt 2026); keduanya nonaktif selama belum ada
 * perubahan. Keterangan "Ada perubahan yang belum disimpan." hanya tampil bila ada perubahan.
 */
function SaveBar({ dirty, busy, onCancel, onSave, saveLabel }: { dirty: boolean; busy: boolean; onCancel: () => void; onSave: () => void; saveLabel: string }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-subtle pt-4">
      <span role="status" className="mr-auto text-caption text-ink-muted">
        {dirty ? c.inline.adaPerubahan : ''}
      </span>
      <Button onClick={onCancel} disabled={busy || !dirty}>
        {c.ubah.batal}
      </Button>
      <Button variant="primary" onClick={onSave} disabled={!dirty} loading={busy} loadingLabel={c.ubah.menyimpan}>
        {saveLabel}
      </Button>
    </div>
  );
}

function ReadRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-border-subtle py-3 last:border-b-0 md:grid-cols-[200px_1fr] md:gap-4">
      <dt className="text-body-dense text-ink-muted">{label}</dt>
      <dd className="text-body-dense text-ink">{children}</dd>
    </div>
  );
}

export function RoleInfoForm({ role, onDirtyChange }: { role: RoleEntry; onDirtyChange: (dirty: boolean) => void }) {
  const toast = useToast();
  const invalidate = useInvalidateRoles();
  const [nama, setNama] = useState(role.nama);
  const [deskripsi, setDeskripsi] = useState(role.deskripsi);
  const [errors, setErrors] = useState<Partial<Record<'nama' | 'deskripsi', string>>>({});
  const dirty = nama !== role.nama || deskripsi !== role.deskripsi;
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  // Data role diperbarui dari server (mis. setelah simpan) → isian mengikuti.
  useEffect(() => {
    setNama(role.nama);
    setDeskripsi(role.deskripsi);
  }, [role.nama, role.deskripsi]);
  const m = useMutation({ mutationFn: () => services.roles.rename(role.id, { nama, deskripsi }) });
  function save() {
    const x: typeof errors = {};
    if (nama.trim().length < 3 || nama.trim().length > 60) x.nama = c.ubah.namaSalah;
    if (!deskripsi.trim()) x.deskripsi = c.ubah.deskripsiKosong;
    setErrors(x);
    if (Object.keys(x).length) return;
    m.mutate(undefined, {
      onSuccess: () => {
        invalidate();
        toast.show({ title: c.ubah.sukses });
      },
      onError: (err) => {
        if (isServiceError(err, 'ORG_NAME_TAKEN')) setErrors({ nama: c.ubah.namaDipakai });
        else if (!isServiceError(err, 'NO_CHANGES')) setErrors({ nama: c.ubah.namaSalah });
      },
    });
  }
  function cancel() {
    setNama(role.nama);
    setDeskripsi(role.deskripsi);
    setErrors({});
  }
  return (
    <Section className="border border-border" title={c.panel.infoJudul}>
      <div className="flex flex-col gap-4">
        <div className="flex max-w-[640px] flex-col gap-4">
          <TextField label={c.ubah.nama} required showRequired value={nama} onChange={(e) => (setNama(e.target.value), setErrors((p) => ({ ...p, nama: undefined })))} hint={c.ubah.namaHint} error={errors.nama} />
          <Textarea label={c.ubah.deskripsi} required maxLength={300} showCount value={deskripsi} onChange={(e) => (setDeskripsi(e.target.value), setErrors((p) => ({ ...p, deskripsi: undefined })))} error={errors.deskripsi} />
        </div>
        <dl className="max-w-[640px]">
          <ReadRow label={c.panel.jenis}>{role.jenisOrg}</ReadRow>
          <ReadRow label={c.panel.cakupan}>{role.cakupan}</ReadRow>
          <ReadRow label={c.panel.status}>{role.status}</ReadRow>
          <ReadRow label={c.panel.pengguna}>
            <Link to={`/pengguna?role=${role.id}`} className="font-mono underline">
              {c.panel.penggunaLink(role.pengguna)}
            </Link>
          </ReadRow>
        </dl>
        <SaveBar dirty={dirty} busy={m.isPending} onCancel={cancel} onSave={save} saveLabel={c.ubah.simpan} />
      </div>
    </Section>
  );
}

export function RolePermissionsForm({ role, onDirtyChange }: { role: RoleEntry; onDirtyChange: (dirty: boolean) => void }) {
  const toast = useToast();
  const invalidate = useInvalidateRoles();
  const base = toPermissionInput(role.izin);
  const baseKey = JSON.stringify(base);
  const [izin, setIzin] = useState<RolePermissionInput>(base);
  const [err, setErr] = useState<string>();
  const [confirm, setConfirm] = useState(false);
  const norm = (v: RolePermissionInput) =>
    JSON.stringify(MODULE_IDS.flatMap((m) => [...(v[m] ?? [])].sort().map((act) => `${m}.${act}`)));
  const dirty = norm(izin) !== norm(base);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- baseKey mewakili isi `base`
  useEffect(() => setIzin(base), [baseKey]);
  const m = useMutation({ mutationFn: () => services.roles.updatePermissions(role.id, izin) });
  function save() {
    m.mutate(undefined, {
      onSuccess: () => {
        setConfirm(false);
        invalidate();
        toast.show({ title: c.izin.diubah(role.id) });
      },
      onError: (e) => {
        setConfirm(false);
        if (!isServiceError(e, 'NO_CHANGES')) setErr(isServiceError(e, 'VALIDATION') ? c.izin.minimal : c.izin.gagal);
      },
    });
  }
  return (
    <Section className="border border-border" title={c.panel.hakAkses} description={c.panel.hakAksesKet}>
      <div className="flex flex-col gap-4">
        <PermissionPicker orgType={role.orgType} value={izin} onChange={(v) => (setIzin(v), setErr(undefined))} error={err} scroll={false} />
        <SaveBar
          dirty={dirty}
          busy={m.isPending}
          onCancel={() => (setIzin(base), setErr(undefined))}
          onSave={() => {
            if (!MODULE_IDS.some((mm) => izin[mm]?.length)) return setErr(c.izin.minimal);
            setConfirm(true);
          }}
          saveLabel={c.izin.simpan}
        />
      </div>
      {/* FR-KR-09f: konfirmasi menampilkan jumlah pengguna terdampak. */}
      <ConfirmDialog
        open={confirm}
        onOpenChange={(o) => !o && !m.isPending && setConfirm(false)}
        title={c.izin.konfirmasiJudul(role.id, role.nama)}
        description={c.izin.konfirmasiIsi(role.pengguna)}
        cancelLabel={c.ubah.batal}
        confirmLabel={c.izin.simpan}
        loading={m.isPending}
        loadingLabel={c.ubah.menyimpan}
        onConfirm={save}
      />
    </Section>
  );
}
