/**
 * Manajemen Pengguna (M-15) — Figma 66:3139 (Admin KKKS), 238:3000 (Admin Platform), 246:6340 (setelah batal).
 * FR-UP-01 (tombol Undang hanya R-03/R-04/R-07), FR-UP-22..24 (lima status, Kedaluwarsa otomatis, PIC hanya
 * organisasinya tanpa filter Organisasi), FR-KU-19a (penanda + filter "Minta undangan baru"), FR-SA-24b (penanda
 * organisasi nonaktif). Klik baris membuka panel detail di kanan (Figma 106:14009); URL /pengguna/:id.
 * PRD Daftar Pengguna (ClickUp z8pmx9n8nv): kolom Role (FR-DP-03), filter Role (FR-DP-14, -15), tombol Hapus filter,
 * "Belum pernah login" (FR-DP-05), PIC tanpa filter Organisasi (FR-DP-09). Email tampil di bawah nama (Figma 66:3139).
 * PRD Ekspor Daftar Pengguna (ClickUp z8pmx9n8nz): tombol Ekspor untuk R-03/R-04 (keputusan PM 14 Okt 2026).
 * Paginasi 25 baris (contoh US-ED-04 Ekspor; ASSUMPTION, Daftar Pengguna tidak menyebut ukuran halaman).
 */
import type { ColumnDef } from '@tanstack/react-table';
import { Download, Search, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { DataTable } from '@/components/patterns/DataTable';
import { EmptyState } from '@/components/patterns/EmptyState';
import { Pagination } from '@/components/patterns/Pagination';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { formatTanggalJam } from '@/lib/format';
import { t } from '@/lib/i18n/id';
import { ACCOUNT_STATUSES, type AccountStatus } from '@/lib/status';
import { allRoleIds, type RoleId, roleName } from '@/lib/rbac';
import { inviterRoleOf } from '@/lib/user-rules';
import { logsCopy } from '../logs/copy';
import { isRoleActive, rolesByOrgType } from '@/lib/role-catalog';
import { roleCopy } from '../roles/copy';
import { ExportDialog } from './components/ExportDialog';
import type { UserSummary } from '@/services';
import { useSession } from '../session/SessionProvider';
import { InviteDialog } from './components/InviteDialog';
import { StatusBadge, UserDetailPanel } from './components/UserDetailPanel';
import { usersCopy as c } from './copy';
import { useOrganisasi, useUserList } from './hooks';

const SEMUA = 'semua';
const PERMINTAAN = 'permintaan';

export function PenggunaPage() {
  const { session } = useSession();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const isPic = session?.user.roles.includes('R-04') && !session.user.roles.some((r) => r === 'R-03' || r === 'R-07');
  const inviter = session ? inviterRoleOf(session.user.roles) : null;

  const search = params.get('cari') ?? '';
  const status = params.get('status') ?? SEMUA;
  const org = params.get('organisasi') ?? SEMUA;
  const role = params.get('role') ?? SEMUA;
  const page = Math.max(1, Number(params.get('hal') ?? '1') || 1);
  const query = useMemo(
    () => ({
      search: search || undefined,
      status: status !== SEMUA && status !== PERMINTAAN ? (status as AccountStatus) : undefined,
      mintaUndanganBaru: status === PERMINTAAN || undefined,
      organisasiId: org !== SEMUA ? org : undefined,
      role: role !== SEMUA ? (role as RoleId) : undefined,
    }),
    [search, status, org, role],
  );
  const list = useUserList(query);
  const orgs = useOrganisasi(!isPic);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (!v || v === SEMUA) next.delete(k);
    else next.set(k, v);
    if (k !== 'hal') next.delete('hal');
    setParams(next, { replace: true });
  };
  const filtered = !!(search || status !== SEMUA || org !== SEMUA || role !== SEMUA);
  const canExport = !!session?.user.roles.some((r) => r === 'R-03' || r === 'R-04');
  // FR-DP-15: PIC hanya memfilter role organisasinya (role KKKS).
  // FR-AR-06: role Tidak Aktif tidak muncul di filter.
  const roleOptions: RoleId[] = (isPic ? rolesByOrgType('KKKS') : allRoleIds()).filter(isRoleActive);
  const rows = list.data ?? [];
  const PAGE = 25;
  const pageRows = rows.slice((page - 1) * PAGE, page * PAGE);
  const openUser = (uid: string) => navigate({ pathname: `/pengguna/${uid}`, search: location.search });

  const columns: ColumnDef<UserSummary, unknown>[] = [
    {
      id: 'nama',
      header: c.kolom.nama,
      accessorKey: 'nama',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <Link
            to={{ pathname: `/pengguna/${row.original.id}`, search: location.search }}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            {row.original.nama}
          </Link>
          <span className="text-caption text-ink-muted">{row.original.email}</span>
        </div>
      ),
    },
    { id: 'org', header: c.kolom.organisasi, accessorFn: (u) => u.organisasi.nama, cell: ({ getValue }) => <span className="text-ink-muted">{getValue() as string}</span> },
    {
      id: 'role',
      header: c.kolom.role,
      accessorFn: (u) => u.roles.join(','),
      cell: ({ row }) => (
        <span className="flex flex-col text-ink-muted">
          {row.original.roles.map((r) => (
            <span key={r}>
              <span className="font-mono text-caption">{r}</span> {roleName(r)}
              {!isRoleActive(r) && <span className="text-caption text-ink-subtle"> {roleCopy.penandaTidakAktif}</span>}
            </span>
          ))}
        </span>
      ),
    },
    { id: 'status', header: c.kolom.status, accessorKey: 'status', cell: ({ row }) => <StatusBadge user={row.original} /> },
    {
      id: 'login',
      header: c.kolom.loginTerakhir,
      accessorKey: 'loginTerakhir',
      cell: ({ getValue }) => <span className="text-caption text-ink-muted">{getValue() ? formatTanggalJam(getValue() as string) : c.panel.belumPernahLogin}</span>,
    },
  ];

  if (!session) return null;

  return (
    <>
      <PageHeader
        title={c.judul}
        summary={c.ringkasan}
        actions={
          <div className="flex gap-2">
            {canExport && (
              <Button icon={<Download aria-hidden size={14} strokeWidth={1.8} />} onClick={() => setExportOpen(true)} disabled={!rows.length}>
                {c.panel.ekspor}
              </Button>
            )}
            {inviter && (
              <Button variant="primary" icon={<UserPlus aria-hidden size={14} strokeWidth={1.8} />} onClick={() => setInviteOpen(true)}>
                {c.undang}
              </Button>
            )}
          </div>
        }
      />
      <PageBody>
        <Section className="border border-border py-4">
          <div className="flex flex-wrap items-end gap-2">
            <TextField
              label={c.cariLabel}
              hideLabel
              placeholder={c.cari}
              value={search}
              onChange={(e) => setParam('cari', e.target.value)}
              leading={<Search size={16} strokeWidth={1.8} />}
              containerClassName="min-w-[220px] flex-1"
            />
            <Select
              label={c.filterStatus}
              hideLabel
              value={status}
              onValueChange={(v) => setParam('status', v)}
              options={[
                { value: SEMUA, label: c.semuaStatus },
                ...ACCOUNT_STATUSES.map((s) => ({ value: s, label: s })),
                { value: PERMINTAAN, label: c.filterPermintaan },
              ]}
              className="w-[200px]"
            />
            {!isPic && (
              <Select
                label={c.filterOrganisasi}
                hideLabel
                value={org}
                onValueChange={(v) => setParam('organisasi', v)}
                options={[{ value: SEMUA, label: c.semuaOrganisasi }, ...(orgs.data ?? []).map((o) => ({ value: o.id, label: o.nama }))]}
                className="w-[240px]"
              />
            )}
            <Select
              label={c.panel.filterRole}
              hideLabel
              value={role}
              onValueChange={(v) => setParam('role', v)}
              options={[{ value: SEMUA, label: c.panel.semuaRole }, ...roleOptions.map((r) => ({ value: r, label: `${r} ${roleName(r)}` }))]}
              className="w-[220px]"
            />
            {filtered && <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>{c.hapusFilter}</Button>}
          </div>
        </Section>
        <Section className="border border-border" title={c.tabelJudul(list.data?.length ?? 0)}>
          <DataTable
            caption={c.tabelLabel}
            columns={columns}
            data={pageRows}
            getRowId={(u) => u.id}
            loading={list.isPending}
            loadingContent={<p className="text-body-dense text-ink-muted">{t.app.memuat}</p>}
            error={list.isError ? c.gagalMemuat : undefined}
            onRowClick={(u) => openUser(u.id)}
            selectedRowId={id}
            empty={
              <EmptyState
                title={filtered ? c.kosongFilter : c.kosong}
                action={filtered ? <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>{c.hapusFilter}</Button> : undefined}
              />
            }
          />
          <Pagination page={page} pageSize={PAGE} total={rows.length} onPageChange={(n) => setParam('hal', String(n))} labels={logsCopy.halaman} />
        </Section>
      </PageBody>
      <UserDetailPanel userId={id} session={session} onClose={() => navigate({ pathname: '/pengguna', search: location.search })} />
      {exportOpen && <ExportDialog query={query} count={rows.length} onClose={() => setExportOpen(false)} />}
      {inviter && <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} inviter={inviter} ownOrg={session.user.organisasi} />}
    </>
  );
}
