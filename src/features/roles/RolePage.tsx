/**
 * Role — PRD Katalog Role (ClickUp z8pmx9n8p0) FR-KR-01..08, 10, 11 dan Aktif & Nonaktif Role (ClickUp z8pmx9n8p1)
 * FR-AR-01..21. "Design belum ada": pola Manajemen Pengguna — PR-11.
 * Rute /role (daftar) dan /role/:kode (halaman detail, arahan PM 15 Okt 2026), hanya R-03 (FR-KR-06). Role Tidak Aktif tetap tampil dengan penanda redup (FR-AR-19).
 * Tahap C2: Buat role (FR-KR-09, -09a, -09b), Ubah hak akses (FR-KR-09c, -09f), Hapus role buatan (FR-KR-09d).
 */
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus, RotateCcw } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { AccountStatusBadge } from '@/components/patterns/AccountStatusBadge';
import { DataTable } from '@/components/patterns/DataTable';
import { ConfirmDialog } from '@/components/patterns/Dialog';
import { Menu } from '@/components/patterns/Menu';
import { Button } from '@/components/ui/Button';
import type { RoleId } from '@/lib/rbac';
import { services, type RoleEntry } from '@/services';
import { useLeaveGuard } from '@/lib/use-leave-guard';
import { DeactivateRoleDialog, MoveUsersDialog, ReactivateRoleDialog, ROLES_KEY } from './components/RoleDialogs';
import { RoleInfoForm, RolePermissionsForm } from './components/RoleInlineForms';
import { DeleteRoleDialog } from './components/RolePermissionDialogs';
import { roleCopy as c } from './copy';

function StatusBadge({ status }: { status: RoleEntry['status'] }) {
  // FR-AR-19: penanda redup, bukan warna peringatan.
  return <AccountStatusBadge label={status === 'Aktif' ? c.aktif : c.tidakAktif} tone={status === 'Aktif' ? 'success' : 'muted'} />;
}

/**
 * Halaman detail role /role/:kode (arahan PM 15 Okt 2026: halaman penuh, pola halaman turunan DS; sebelumnya panel
 * samping). Nama/deskripsi dan hak akses diubah langsung di halaman (RoleInlineForms; Simpan muncul bila ada perubahan,
 * konfirmasi tinggalkan halaman bila belum disimpan). Tombol header: Tidak aktif → "Aktifkan kembali" (primer); aksi lain
 * (Nonaktifkan, Pindahkan pengguna, Hapus) di menu "Aksi lainnya".
 */
export function RoleDetailPage() {
  const { kode } = useParams();
  const navigate = useNavigate();
  const id = kode as RoleId;
  const q = useQuery({ queryKey: [...ROLES_KEY, 'detail', id], queryFn: () => services.roles.get(id) });
  const [dialog, setDialog] = useState<'hapus' | 'nonaktifkan' | 'aktifkan' | 'pindah' | null>(null);
  const [infoDirty, setInfoDirty] = useState(false);
  const [izinDirty, setIzinDirty] = useState(false);
  const saved = useRef(false);
  const blocker = useLeaveGuard(infoDirty || izinDirty, saved);
  const r = q.data;
  const back = { to: '/role', label: c.panel.kembali };
  const crumbs = (nama: string) => [{ label: c.panel.crumb, to: '/role' }, { label: nama }];
  if (!r) {
    const judul = q.isError ? c.panel.tidakDitemukan : c.memuat;
    return (
      <>
        <PageHeader title={judul} breadcrumbs={crumbs(q.isError ? judul : '…')} back={back} />
        <PageBody>
          <p role="status" className="text-body-dense text-ink-muted">{q.isError ? c.panel.tidakDitemukanIsi : c.memuat}</p>
        </PageBody>
      </>
    );
  }
  const aktif = r.status === 'Aktif';
  const more = [
    ...(aktif
      ? r.dapatDinonaktifkan
        ? [{ key: 'n', label: c.panel.nonaktifkan, onSelect: () => setDialog('nonaktifkan') }]
        : []
      : r.pengguna > 0
        ? [{ key: 'p', label: c.panel.pindahkan, onSelect: () => setDialog('pindah') }]
        : []),
    // FR-KR-09c: role sistem tidak dapat dihapus (aksi tidak tampil).
    ...(r.sistem ? [] : [{ key: 'h', label: c.izin.hapus, onSelect: () => setDialog('hapus') }]),
  ];
  return (
    <>
      <PageHeader
        title={r.nama}
        titleAside={<StatusBadge status={r.status} />}
        summary={<span className="font-mono">{r.id}</span>}
        breadcrumbs={crumbs(r.nama)}
        back={back}
        actions={
          <>
            {!aktif && (
              <Button variant="primary" icon={<RotateCcw aria-hidden size={16} strokeWidth={1.8} />} onClick={() => setDialog('aktifkan')}>
                {c.panel.aktifkan}
              </Button>
            )}
            {more.length > 0 && <Menu align="end" items={more} trigger={<Button aria-label={c.panel.menu} icon={<MoreHorizontal aria-hidden size={16} strokeWidth={1.8} />} className="px-2" />} />}
          </>
        }
      />
      <PageBody>
        {!r.dapatDinonaktifkan && <p className="text-caption text-ink-subtle">{c.panel.tidakDapatNonaktif}</p>}
        <RoleInfoForm role={r} onDirtyChange={setInfoDirty} />
        <RolePermissionsForm role={r} onDirtyChange={setIzinDirty} />
      </PageBody>
      {dialog === 'hapus' && <DeleteRoleDialog role={r} onClose={() => setDialog(null)} onDeleted={() => navigate('/role')} />}
      {dialog === 'nonaktifkan' && <DeactivateRoleDialog role={r} onClose={() => setDialog(null)} />}
      {dialog === 'aktifkan' && <ReactivateRoleDialog role={r} onClose={() => setDialog(null)} />}
      {dialog === 'pindah' && <MoveUsersDialog role={r} onClose={() => setDialog(null)} />}
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(o) => !o && blocker.reset?.()}
        title={c.izin.tinggalkanJudul}
        description={c.inline.tinggalkanIsi}
        confirmLabel={c.izin.tinggalkan}
        cancelLabel={c.izin.tetap}
        destructive
        onConfirm={() => blocker.proceed?.()}
      />
    </>
  );
}

export function RolePage() {
  const navigate = useNavigate();
  const list = useQuery({ queryKey: [...ROLES_KEY, 'list'], queryFn: () => services.roles.list() });
  const columns: ColumnDef<RoleEntry, unknown>[] = [
    { id: 'kode', header: c.kolom.kode, cell: ({ row }) => <span className="font-mono text-caption">{row.original.id}</span> },
    {
      id: 'nama',
      header: c.kolom.nama,
      cell: ({ row }) => (
        <span className={`flex flex-col ${row.original.status === 'Aktif' ? 'text-ink' : 'text-ink-subtle'}`}>
          <span className="font-medium">{row.original.nama}</span>
          <span className="text-caption text-ink-subtle">{row.original.sistem ? c.sistem : c.buatan}</span>
        </span>
      ),
    },
    { id: 'jenis', header: c.kolom.jenis, cell: ({ row }) => row.original.jenisOrg },
    { id: 'cakupan', header: c.kolom.cakupan, cell: ({ row }) => <span className="text-ink-muted">{row.original.cakupan}</span> },
    { id: 'status', header: c.kolom.status, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      id: 'pengguna',
      header: c.kolom.pengguna,
      meta: { align: 'right', mono: true },
      // FR-KR-07: jumlah pengguna dapat diklik → daftar pengguna terfilter role.
      cell: ({ row }) => (
        <Link to={`/pengguna?role=${row.original.id}`} onClick={(e) => e.stopPropagation()} className="tabular-nums underline">
          {row.original.pengguna}
        </Link>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title={c.judul}
        summary={c.ringkasan}
        actions={
          <Button variant="primary" icon={<Plus aria-hidden size={14} strokeWidth={1.8} />} onClick={() => navigate('/role/baru')}>
            {c.buatRole}
          </Button>
        }
      />
      <PageBody>
        <Section className="border border-border">
          <DataTable
            caption={c.tabel}
            columns={columns}
            data={list.data ?? []}
            getRowId={(r) => r.id}
            loading={list.isPending}
            loadingContent={<p className="text-body-dense text-ink-muted">{c.memuat}</p>}
            error={list.isError ? c.gagal : undefined}
            onRowClick={(r) => navigate(`/role/${r.id}`)}
          />
        </Section>
      </PageBody>
    </>
  );
}
