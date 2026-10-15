/**
 * Dialog role — PRD Katalog Role FR-KR-08 (ubah nama & deskripsi) dan Aktif & Nonaktif Role FR-AR-04..18.
 * Nonaktifkan role yang masih dipakai: pilih "Pindahkan ke role lain" (role tujuan aktif, jenis organisasi sama, dengan
 * perbedaan hak akses) atau "Lewati" (keputusan PM 14 Okt 2026). Pindah massal dari role Tidak Aktif memakai alur sama.
 * Hasil pemindahan menyebut berapa dipindah dan berapa dilewati beserta alasannya (FR-AR-16).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Callout } from '@/components/patterns/Callout';
import { ConfirmDialog, Dialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { Textarea } from '@/components/ui/Textarea';
import { allRoleIds, type RoleId, roleName, roleDef } from '@/lib/rbac';
import { isRoleActive } from '@/lib/role-catalog';
import { isServiceError, services, type AccessDiffItem, type RoleEntry, type RoleMoveResult } from '@/services';
import { roleCopy as c } from '../copy';

export const ROLES_KEY = ['roles'] as const;

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ROLES_KEY });
    void qc.invalidateQueries({ queryKey: ['role-catalog'] });
    void qc.invalidateQueries({ queryKey: ['users'] });
  };
}

export function RenameRoleDialog({ role, onClose }: { role: RoleEntry; onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidate();
  const [nama, setNama] = useState(role.nama);
  const [deskripsi, setDeskripsi] = useState(role.deskripsi);
  const [errors, setErrors] = useState<Partial<Record<'nama' | 'deskripsi', string>>>({});
  const m = useMutation({ mutationFn: () => services.roles.rename(role.id, { nama, deskripsi }) });
  function submit() {
    const x: typeof errors = {};
    if (nama.trim().length < 3 || nama.trim().length > 60) x.nama = c.ubah.namaSalah;
    if (!deskripsi.trim()) x.deskripsi = c.ubah.deskripsiKosong;
    setErrors(x);
    if (Object.keys(x).length) return;
    m.mutate(undefined, {
      onSuccess: () => {
        invalidate();
        toast.show({ title: c.ubah.sukses });
        onClose();
      },
      onError: (err) => {
        if (isServiceError(err, 'NO_CHANGES')) onClose();
        else if (isServiceError(err, 'ORG_NAME_TAKEN')) setErrors({ nama: c.ubah.namaDipakai });
        else setErrors({ nama: c.ubah.namaSalah });
      },
    });
  }
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={c.ubah.judul}
      description={<span className="font-mono">{role.id}</span>}
      closeLabel={c.ubah.batal}
      footer={
        <>
          <Button onClick={onClose} disabled={m.isPending}>
            {c.ubah.batal}
          </Button>
          <Button variant="primary" onClick={submit} loading={m.isPending} loadingLabel={c.ubah.menyimpan}>
            {c.ubah.simpan}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField label={c.ubah.nama} required showRequired value={nama} onChange={(e) => (setNama(e.target.value), setErrors((p) => ({ ...p, nama: undefined })))} hint={c.ubah.namaHint} error={errors.nama} />
        <Textarea label={c.ubah.deskripsi} required maxLength={300} showCount value={deskripsi} onChange={(e) => (setDeskripsi(e.target.value), setErrors((p) => ({ ...p, deskripsi: undefined })))} error={errors.deskripsi} />
      </div>
    </Dialog>
  );
}

function DiffList({ title, icon, items }: { title: string; icon: ReactNode; items: AccessDiffItem[] }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="flex items-center gap-2 text-label text-ink">
        {icon}
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-body-dense text-ink-subtle">—</p>
      ) : (
        <ul className="flex flex-col gap-1 text-body-dense">
          {items.map((m) => (
            <li key={m.module}>
              <span className="font-mono text-caption text-ink-muted">{m.module}</span> {m.nama}
              <span className="block text-ink-muted">{m.aksi.join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Pilih role tujuan + perbedaan hak akses (FR-AR-04a, -14). */
function TargetPicker({ role, target, onTarget, error }: { role: RoleEntry; target: RoleId | ''; onTarget: (r: RoleId) => void; error?: string }) {
  const options = allRoleIds().filter((r) => r !== role.id && isRoleActive(r) && roleDef(r).orgType === roleDef(role.id).orgType);
  const preview = useQuery({ queryKey: ['roles', 'preview', role.id, target], queryFn: () => services.roles.previewMove(role.id, target as RoleId), enabled: !!target });
  return (
    <div className="flex flex-col gap-3">
      <Select
        label={c.nonaktifkan.tujuan}
        placeholder={c.nonaktifkan.tujuanPlaceholder}
        value={target || undefined}
        onValueChange={(v) => onTarget(v as RoleId)}
        options={options.map((r) => ({ value: r, label: `${r} ${roleName(r)}` }))}
        error={error}
      />
      {preview.data && (
        <div className="flex flex-col gap-2 rounded-md bg-surface-sunken p-3">
          <p className="text-body-dense text-ink">{c.pindah.pratinjau(preview.data.pengguna, role.id, target)}</p>
          <h4 className="text-label text-ink-muted">{c.pindah.aksesJudul}</h4>
          {!preview.data.aksesBertambah.length && !preview.data.aksesBerkurang.length ? (
            <p className="text-body-dense text-ink-muted">{c.pindah.sama}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <DiffList title={c.pindah.bertambah} icon={<Plus aria-hidden size={14} strokeWidth={1.8} />} items={preview.data.aksesBertambah} />
              <DiffList title={c.pindah.berkurang} icon={<Minus aria-hidden size={14} strokeWidth={1.8} />} items={preview.data.aksesBerkurang} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultNote({ result }: { result: RoleMoveResult }) {
  if (!result.dilewati.length) return null;
  return (
    <Callout variant="peringatan" size="compact" role="note" title={c.pindah.dilewatiJudul}>
      <ul className="flex flex-col gap-0.5">
        {result.dilewati.map((d) => (
          <li key={d.userId}>
            {d.nama}: {d.alasan}
          </li>
        ))}
      </ul>
    </Callout>
  );
}

export function DeactivateRoleDialog({ role, onClose }: { role: RoleEntry; onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidate();
  const [mode, setMode] = useState<'pindah' | 'lewati'>('pindah');
  const [target, setTarget] = useState<RoleId | ''>('');
  const [err, setErr] = useState<string>();
  const [result, setResult] = useState<RoleMoveResult | null>(null);
  const dipakai = role.pengguna > 0;
  const m = useMutation({ mutationFn: () => services.roles.deactivate(role.id, dipakai && mode === 'pindah' ? { pindahKe: target as RoleId } : {}) });
  if (result) {
    return (
      <Dialog open onOpenChange={(o) => !o && onClose()} title={c.pindah.hasilJudul} description={c.nonaktifkan.hasil(result.dipindah, result.dilewati.length)} closeLabel={c.nonaktifkan.batal} footer={<Button onClick={onClose}>{c.tutup}</Button>}>
        <ResultNote result={result} />
      </Dialog>
    );
  }
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={c.nonaktifkan.judul(role.id, role.nama)}
      description={dipakai ? c.nonaktifkan.peringatan(role.pengguna) : c.nonaktifkan.tanpaPengguna}
      closeLabel={c.nonaktifkan.batal}
      cancelLabel={c.nonaktifkan.batal}
      confirmLabel={c.nonaktifkan.tombol}
      destructive
      loading={m.isPending}
      loadingLabel={c.nonaktifkan.memproses}
      confirmDisabled={dipakai && mode === 'pindah' && !target}
      onConfirm={() => {
        if (dipakai && mode === 'pindah' && !target) return setErr(c.nonaktifkan.tujuanKosong);
        m.mutate(undefined, {
          onSuccess: (r) => {
            invalidate();
            toast.show({ title: c.nonaktifkan.sukses(role.id), description: dipakai && mode === 'pindah' ? c.nonaktifkan.hasil(r.dipindah, r.dilewati.length) : undefined });
            if (r.dilewati.length) setResult(r);
            else onClose();
          },
        });
      }}
    >
      <div className="flex flex-col gap-4">
        {dipakai && (
          <>
            <Link to={`/pengguna?role=${role.id}`} className="self-start text-body-dense font-semibold text-ink underline">
              {c.nonaktifkan.lihatPengguna}
            </Link>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-label text-ink-muted">{c.nonaktifkan.pilihan}</legend>
              {(['pindah', 'lewati'] as const).map((x) => (
                <label key={x} className="flex items-center gap-2 text-body-dense text-ink">
                  <input type="radio" name="mode-nonaktif-role" checked={mode === x} onChange={() => setMode(x)} className="h-4 w-4 accent-[var(--color-action)]" />
                  {x === 'pindah' ? c.nonaktifkan.pindah : c.nonaktifkan.lewati}
                </label>
              ))}
            </fieldset>
            {mode === 'pindah' && <TargetPicker role={role} target={target} onTarget={(r) => (setTarget(r), setErr(undefined))} error={err} />}
          </>
        )}
        <p className="text-caption text-ink-subtle">{c.nonaktifkan.catatan}</p>
      </div>
    </ConfirmDialog>
  );
}

export function ReactivateRoleDialog({ role, onClose }: { role: RoleEntry; onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidate();
  const m = useMutation({ mutationFn: () => services.roles.reactivate(role.id) });
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={c.aktifkan.judul(role.id, role.nama)}
      description={c.aktifkan.isi}
      closeLabel={c.nonaktifkan.batal}
      cancelLabel={c.nonaktifkan.batal}
      confirmLabel={c.panel.aktifkan}
      loading={m.isPending}
      loadingLabel={c.nonaktifkan.memproses}
      onConfirm={() =>
        m.mutate(undefined, {
          onSuccess: () => {
            invalidate();
            toast.show({ title: c.aktifkan.sukses(role.id) });
            onClose();
          },
        })
      }
    />
  );
}

/** FR-AR-13..18: pindah massal dari role Tidak Aktif. */
export function MoveUsersDialog({ role, onClose }: { role: RoleEntry; onClose: () => void }) {
  const toast = useToast();
  const invalidate = useInvalidate();
  const [target, setTarget] = useState<RoleId | ''>('');
  const [result, setResult] = useState<RoleMoveResult | null>(null);
  const m = useMutation({ mutationFn: () => services.roles.moveUsers(role.id, target as RoleId) });
  if (result) {
    return (
      <Dialog open onOpenChange={(o) => !o && onClose()} title={c.pindah.hasilJudul} description={c.nonaktifkan.hasil(result.dipindah, result.dilewati.length)} closeLabel={c.nonaktifkan.batal} footer={<Button onClick={onClose}>{c.tutup}</Button>}>
        <ResultNote result={result} />
      </Dialog>
    );
  }
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={c.pindah.judul(role.id)}
      closeLabel={c.nonaktifkan.batal}
      cancelLabel={c.nonaktifkan.batal}
      confirmLabel={c.pindah.tombol}
      loading={m.isPending}
      loadingLabel={c.nonaktifkan.memproses}
      confirmDisabled={!target}
      onConfirm={() =>
        m.mutate(undefined, {
          onSuccess: (r) => {
            invalidate();
            toast.show({ title: c.nonaktifkan.hasil(r.dipindah, r.dilewati.length) });
            if (r.dilewati.length) setResult(r);
            else onClose();
          },
        })
      }
    >
      <TargetPicker role={role} target={target} onTarget={setTarget} />
    </ConfirmDialog>
  );
}
