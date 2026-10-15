/**
 * Ubah hak akses role dan hapus role — PRD Katalog Role FR-KR-09, -09a..09f (Buat role: halaman BuatRolePage). "Design belum
 * ada": dialog lebar dengan pemilih hak akses per modul × aksi (daftar modul & aksi dari satu sumber,
 * FR-KR-09a; aksi dibatasi jenis organisasi, FR-KR-09b). Ubah hak akses menampilkan jumlah pengguna terdampak dan
 * berlaku pada permintaan berikutnya tanpa mencabut sesi (FR-KR-09f).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog, Dialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { ACTION_LABEL, ACTIONS, MODULE_IDS, MODULES, type Action, type ModuleId, type OrgType } from '@/lib/rbac';
import { allowedActions, JENIS_LABEL } from '@/lib/role-catalog';
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

/** Kolom tetap matriks: semua aksi yang dipakai minimal satu jenis organisasi (urutan ACTIONS), agar tata letak tidak
 * berubah saat jenis organisasi diganti. */
const PICKER_COLUMNS: Action[] = (() => {
  const used = new Set<Action>();
  for (const t of ['SKK Migas', 'KKKS', 'Kontraktor'] as OrgType[]) for (const acts of Object.values(allowedActions(t))) for (const x of acts ?? []) used.add(x);
  return ACTIONS.filter((x) => used.has(x));
})();

/** Pemilih hak akses: matriks modul × aksi; kotak centang hanya untuk aksi yang diizinkan jenis organisasi (FR-KR-09b). */
export function PermissionPicker({
  orgType,
  value,
  onChange,
  error,
  scroll = true,
}: {
  orgType: OrgType;
  value: RolePermissionInput;
  onChange: (v: RolePermissionInput) => void;
  error?: string;
  /** Batasi tinggi daftar (dalam dialog). Di halaman penuh: false. */
  scroll?: boolean;
}) {
  const allowed = allowedActions(orgType);
  const modules = MODULE_IDS.filter((m) => (allowed[m] ?? []).length > 0);
  const columns = PICKER_COLUMNS;
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
      {/* Matriks modul × aksi (masukan PM 15 Okt 2026). Kolom tetap (PICKER_COLUMNS); sel tanpa kotak
          centang (titik) = aksi tidak tersedia untuk modul itu (FR-KR-09b). */}
      <div className={cn('overflow-x-auto rounded-md border border-border', scroll && 'max-h-[360px] overflow-y-auto')}>
        <table className="w-full border-collapse text-left text-body-dense">
          <caption className="sr-only">{c.legend}</caption>
          <thead className={cn(scroll && 'sticky top-0 z-10')}>
            <tr className="border-b border-border bg-surface">
              <th scope="col" className="px-3 py-2 text-label font-medium text-ink-muted">
                {c.kolomModul}
              </th>
              {columns.map((act) => (
                <th key={act} scope="col" className="max-w-[112px] px-2 py-2 text-center align-bottom text-label font-medium leading-tight text-ink-muted">
                  {ACTION_LABEL[act]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr key={m} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-sunken">
                <th scope="row" className="whitespace-nowrap px-3 py-2 font-normal text-ink">
                  <span className="font-mono text-caption text-ink-subtle">{m}</span> {MODULES[m].name}
                </th>
                {columns.map((act) =>
                  (allowed[m] ?? []).includes(act) ? (
                    <td key={act} className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${ACTION_LABEL[act]} — ${m} ${MODULES[m].name}`}
                        checked={(value[m] ?? []).includes(act)}
                        onChange={() => toggle(m, act)}
                        className="h-4 w-4 align-middle accent-[var(--color-action)]"
                      />
                    </td>
                  ) : (
                    <td key={act} className="px-3 py-2 text-center text-ink-subtle">
                      <span aria-hidden>·</span>
                      <span className="sr-only">{c.tidakTersedia}</span>
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="text-caption text-error-ink">{error}</p>}
    </fieldset>
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
