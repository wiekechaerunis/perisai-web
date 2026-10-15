/**
 * Buat role — PRD Katalog Role FR-KR-09, -09a, -09b (ClickUp z8pmx9n8p0). Rute /role/baru, hanya R-03 (FR-KR-06).
 * "Design belum ada". Arahan PM 15 Okt 2026: halaman penuh (bukan dialog) karena isian berat; tombol kembali dan jejak
 * lokasi Role › Buat role. Isian: nama, deskripsi, jenis organisasi, cakupan bawaan, hak akses per modul × aksi
 * (FR-KR-09a/09b). Meninggalkan halaman dengan isian belum disimpan minta konfirmasi (pola FR-UDR-10).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLeaveGuard } from '@/lib/use-leave-guard';
import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { ConfirmDialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { Textarea } from '@/components/ui/Textarea';
import { MODULE_IDS, type CakupanBawaan, type OrgType } from '@/lib/rbac';
import { CAKUPAN_PILIHAN, JENIS_LABEL } from '@/lib/role-catalog';
import { isServiceError, services, type RolePermissionInput } from '@/services';
import { PermissionPicker } from './components/RolePermissionDialogs';
import { ROLES_KEY } from './components/RoleDialogs';
import { roleCopy } from './copy';

const c = roleCopy.izin;
const u = roleCopy.ubah;
type Field = 'nama' | 'deskripsi' | 'izin';

export function BuatRolePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [orgType, setOrgType] = useState<OrgType>('KKKS');
  const [cakupan, setCakupan] = useState<CakupanBawaan>('Organisasi sendiri');
  const [izin, setIzin] = useState<RolePermissionInput>({});
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const saved = useRef(false);
  const m = useMutation({ mutationFn: () => services.roles.create({ nama, deskripsi, orgType, cakupan, izin }) });

  const dirty = !!(nama.trim() || deskripsi.trim() || MODULE_IDS.some((mm) => izin[mm]?.length));
  const blocker = useLeaveGuard(dirty, saved);

  const clear = (k: Field) => setErrors((p) => ({ ...p, [k]: undefined }));

  function submit(ev: FormEvent) {
    ev.preventDefault();
    const x: typeof errors = {};
    if (nama.trim().length < 3 || nama.trim().length > 60) x.nama = u.namaSalah;
    if (!deskripsi.trim()) x.deskripsi = u.deskripsiKosong;
    if (!MODULE_IDS.some((mm) => izin[mm]?.length)) x.izin = c.minimal;
    setErrors(x);
    if (Object.keys(x).length) return;
    m.mutate(undefined, {
      onSuccess: (r) => {
        saved.current = true;
        void qc.invalidateQueries({ queryKey: ROLES_KEY });
        void qc.invalidateQueries({ queryKey: ['role-catalog'] });
        void qc.invalidateQueries({ queryKey: ['users'] });
        toast.show({ title: c.dibuat(r.id) });
        navigate(`/role/${r.id}`);
      },
      onError: (err) => {
        if (isServiceError(err, 'ORG_NAME_TAKEN')) setErrors({ nama: u.namaDipakai });
        else setErrors({ izin: c.gagal });
      },
    });
  }

  return (
    <>
      <PageHeader
        title={c.buatJudul}
        summary={c.buatDeskripsi}
        breadcrumbs={[{ label: c.crumbRole, to: '/role' }, { label: c.buatJudul }]}
        back={{ to: '/role', label: c.kembaliKe }}
      />
      <PageBody>
        <form noValidate onSubmit={submit} className="flex flex-col gap-5">
          <Section title={c.infoJudul} className="border border-border">
            <div className="flex flex-col gap-4">
              <TextField label={u.nama} required showRequired value={nama} onChange={(e) => (setNama(e.target.value), clear('nama'))} error={errors.nama} containerClassName="max-w-[560px]" />
              <Textarea label={u.deskripsi} required maxLength={300} showCount value={deskripsi} onChange={(e) => (setDeskripsi(e.target.value), clear('deskripsi'))} error={errors.deskripsi} />
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
            </div>
          </Section>
          <Section className="border border-border">
            <PermissionPicker orgType={orgType} value={izin} onChange={(v) => (setIzin(v), clear('izin'))} error={errors.izin} scroll={false} />
          </Section>
          <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={() => navigate('/role')} disabled={m.isPending}>
              {c.batal}
            </Button>
            <Button type="submit" variant="primary" loading={m.isPending} loadingLabel={u.menyimpan}>
              {c.buat}
            </Button>
          </div>
        </form>
      </PageBody>
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(o) => !o && blocker.reset?.()}
        title={c.tinggalkanJudul}
        description={c.tinggalkanIsi}
        confirmLabel={c.tinggalkan}
        cancelLabel={c.tetap}
        destructive
        onConfirm={() => blocker.proceed?.()}
      />
    </>
  );
}
