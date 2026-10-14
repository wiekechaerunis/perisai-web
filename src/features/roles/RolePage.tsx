/**
 * Role — PRD Katalog Role (ClickUp z8pmx9n8p0) FR-KR-01..08, 10, 11 dan Aktif & Nonaktif Role (ClickUp z8pmx9n8p1)
 * FR-AR-01..21. "Design belum ada": pola Manajemen Pengguna (tabel + panel kanan 480px, Figma 109:16236) — PR-11.
 * Rute /role dan /role/:kode, hanya R-03 (FR-KR-06). Role Tidak Aktif tetap tampil dengan penanda redup (FR-AR-19).
 * Tahap C2: Buat role (FR-KR-09, -09a, -09b), Ubah hak akses (FR-KR-09c, -09f), Hapus role buatan (FR-KR-09d).
 */
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { AccountStatusBadge } from '@/components/patterns/AccountStatusBadge';
import { DataTable } from '@/components/patterns/DataTable';
import { KeyValueList } from '@/components/patterns/KeyValueList';
import { Menu } from '@/components/patterns/Menu';
import { SidePanel } from '@/components/patterns/SidePanel';
import { Button } from '@/components/ui/Button';
import { effectiveAccess, scopeFor } from '@/lib/access';
import type { RoleId } from '@/lib/rbac';
import { services, type RoleEntry } from '@/services';
import { EffectiveAccessView } from '../access/EffectiveAccessView';
import { DeactivateRoleDialog, MoveUsersDialog, ReactivateRoleDialog, RenameRoleDialog, ROLES_KEY } from './components/RoleDialogs';
import { CreateRoleDialog, DeleteRoleDialog, EditPermissionsDialog } from './components/RolePermissionDialogs';
import { roleCopy as c } from './copy';

function StatusBadge({ status }: { status: RoleEntry['status'] }) {
  // FR-AR-19: penanda redup, bukan warna peringatan.
  return <AccountStatusBadge label={status === 'Aktif' ? c.aktif : c.tidakAktif} tone={status === 'Aktif' ? 'success' : 'muted'} />;
}

function RolePanel({ id, onClose }: { id: RoleId; onClose: () => void }) {
  const q = useQuery({ queryKey: [...ROLES_KEY, 'detail', id], queryFn: () => services.roles.get(id) });
  const [dialog, setDialog] = useState<'ubah' | 'izin' | 'hapus' | 'nonaktifkan' | 'aktifkan' | 'pindah' | null>(null);
  const r = q.data;
  if (!r) {
    return (
      <SidePanel open onOpenChange={(o) => !o && onClose()} title="…" closeLabel={c.panel.tutup}>
        <p role="status" className="text-body-dense text-ink-muted">{c.memuat}</p>
      </SidePanel>
    );
  }
  // Hak akses role dari katalog (semua modul, termasuk yang belum dirilis — definisi role, bukan akses efektif pengguna).
  const modules = effectiveAccess('Aktif', [r.id], scopeFor({ roles: [r.id], organisasi: '—', wilayahKerja: [], kkksDitugaskan: [] }), [], false);
  const items = [
    ...(r.status === 'Aktif'
      ? r.dapatDinonaktifkan
        ? [{ key: 'n', label: c.panel.nonaktifkan, onSelect: () => setDialog('nonaktifkan') }]
        : []
      : [{ key: 'a', label: c.panel.aktifkan, onSelect: () => setDialog('aktifkan') }, ...(r.pengguna > 0 ? [{ key: 'p', label: c.panel.pindahkan, onSelect: () => setDialog('pindah') }] : [])]),
    // FR-KR-09c: role sistem tidak dapat dihapus (aksi tidak tampil).
    ...(r.sistem ? [] : [{ key: 'h', label: c.izin.hapus, onSelect: () => setDialog('hapus') }]),
  ];
  return (
    <>
      <SidePanel
        open
        onOpenChange={(o) => !o && onClose()}
        title={r.nama}
        titleAside={<StatusBadge status={r.status} />}
        subtitle={<span className="font-mono">{r.id}</span>}
        closeLabel={c.panel.tutup}
        actions={
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setDialog('ubah')}>{c.panel.ubah}</Button>
              <Button onClick={() => setDialog('izin')}>{c.izin.ubah}</Button>
              {items.length > 0 && <Menu items={items} trigger={<Button aria-label={c.panel.menu} icon={<MoreHorizontal aria-hidden size={14} strokeWidth={1.8} />} className="px-2" />} />}
            </div>
            {!r.dapatDinonaktifkan && <p className="text-caption text-ink-subtle">{c.panel.tidakDapatNonaktif}</p>}
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <KeyValueList
            items={[
              { key: 'd', label: c.panel.deskripsi, value: r.deskripsi },
              { key: 'j', label: c.panel.jenis, value: r.jenisOrg },
              { key: 'c', label: c.panel.cakupan, value: r.cakupan },
              { key: 's', label: c.panel.status, value: r.status },
              {
                key: 'u',
                label: c.panel.pengguna,
                value: (
                  <Link to={`/pengguna?role=${r.id}`} className="font-mono underline">
                    {c.panel.penggunaLink(r.pengguna)}
                  </Link>
                ),
              },
            ]}
          />
          <section className="flex flex-col gap-2">
            <h3 className="text-heading-3 text-ink">{c.panel.hakAkses}</h3>
            <p className="text-caption text-ink-subtle">{c.panel.hakAksesKet}</p>
            <EffectiveAccessView modules={modules} showRoles={false} />
          </section>
        </div>
      </SidePanel>
      {dialog === 'ubah' && <RenameRoleDialog role={r} onClose={() => setDialog(null)} />}
      {dialog === 'izin' && <EditPermissionsDialog role={r} onClose={() => setDialog(null)} />}
      {dialog === 'hapus' && <DeleteRoleDialog role={r} onClose={() => setDialog(null)} onDeleted={onClose} />}
      {dialog === 'nonaktifkan' && <DeactivateRoleDialog role={r} onClose={() => setDialog(null)} />}
      {dialog === 'aktifkan' && <ReactivateRoleDialog role={r} onClose={() => setDialog(null)} />}
      {dialog === 'pindah' && <MoveUsersDialog role={r} onClose={() => setDialog(null)} />}
    </>
  );
}

export function RolePage() {
  const { kode } = useParams();
  const navigate = useNavigate();
  const list = useQuery({ queryKey: [...ROLES_KEY, 'list'], queryFn: () => services.roles.list() });
  const [createOpen, setCreateOpen] = useState(false);
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
          <Button variant="primary" icon={<Plus aria-hidden size={14} strokeWidth={1.8} />} onClick={() => setCreateOpen(true)}>
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
            selectedRowId={kode}
          />
        </Section>
      </PageBody>
      {kode && <RolePanel id={kode as RoleId} onClose={() => navigate('/role')} />}
      {createOpen && (
        <CreateRoleDialog
          onClose={() => setCreateOpen(false)}
          onCreated={(id) => {
            setCreateOpen(false);
            navigate(`/role/${id}`);
          }}
        />
      )}
    </>
  );
}
