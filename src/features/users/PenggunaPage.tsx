/**
 * Manajemen Pengguna (M-15) — Figma 66:3139 (Admin KKKS), 238:3000 (Admin SKK), 246:6340 (setelah batal).
 * FR-UP-01 (tombol Undang hanya R-03/R-04/R-07), FR-UP-22..24 (lima status, Kedaluwarsa otomatis, Admin KKKS hanya
 * organisasinya tanpa filter Organisasi), FR-KU-19a (penanda + filter "Minta undangan baru"), FR-SA-24b (penanda
 * organisasi nonaktif). Klik baris membuka halaman detail /pengguna/:id (arahan PM 15 Okt 2026; Figma 106:14009 memakai panel kanan).
 * PRD Daftar Pengguna (ClickUp z8pmx9n8nv): kolom Role (FR-DP-03), filter Role (FR-DP-14, -15), tombol Hapus filter,
 * "Belum pernah login" (FR-DP-05), Admin KKKS tanpa filter Organisasi (FR-DP-09). Email tampil di bawah nama (Figma 66:3139).
 * PRD Ekspor Daftar Pengguna (ClickUp z8pmx9n8nz): tombol Ekspor untuk R-03/R-04 (keputusan PM 14 Okt 2026).
 * Paginasi 25 baris (contoh US-ED-04 Ekspor; ASSUMPTION, Daftar Pengguna tidak menyebut ukuran halaman).
 */
import type { ColumnDef } from '@tanstack/react-table';
import { PAGE_SIZE_OPTIONS, PAGE_SIZE_PARAM, parsePageSize } from '@/lib/page-size';
import { Download, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/patterns/DataTable';
import {
  AppliedFilters,
  FilterGroup,
  FilterPanel,
  type AppliedFilter,
} from '@/components/patterns/FilterPanel';
import { TableCard, TableSearch } from '@/components/patterns/TableCard';
import { EmptyState } from '@/components/patterns/EmptyState';
import { Pagination } from '@/components/patterns/Pagination';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/Select';
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
import { StatusBadge, type FromListState } from './components/UserDetailPanel';
import { usersCopy as c } from './copy';
import { useOrganisasi, useUserList } from './hooks';

const SEMUA = 'semua';

interface PanelValue {
  status: string;
  org: string;
  role: string;
}
const PERMINTAAN = 'permintaan';

export function PenggunaPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const isPic =
    session?.user.roles.includes('R-04') &&
    !session.user.roles.some((r) => r === 'R-03' || r === 'R-07');
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
  // DS v2 FilterPanel: filter tidak langsung berlaku; tombol Terapkan menampilkan pratinjau jumlah dari draf.
  const [draft, setDraft] = useState<PanelValue | null>(null);
  const preview = useUserList(
    draft
      ? {
          ...query,
          status:
            draft.status !== SEMUA && draft.status !== PERMINTAAN
              ? (draft.status as AccountStatus)
              : undefined,
          mintaUndanganBaru: draft.status === PERMINTAAN || undefined,
          organisasiId: draft.org !== SEMUA ? draft.org : undefined,
          role: draft.role !== SEMUA ? (draft.role as RoleId) : undefined,
        }
      : query,
  );
  const orgs = useOrganisasi(!isPic);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (!v || v === SEMUA) next.delete(k);
    else next.set(k, v);
    if (k !== 'hal') next.delete('hal');
    setParams(next, { replace: true });
  };
  const filtered = !!(search || status !== SEMUA || org !== SEMUA || role !== SEMUA);
  const applyPanel = (v: PanelValue) => {
    const next = new URLSearchParams(params);
    for (const [k, val] of [
      ['status', v.status],
      ['organisasi', v.org],
      ['role', v.role],
    ] as const) {
      if (val === SEMUA) next.delete(k);
      else next.set(k, val);
    }
    next.delete('hal');
    setParams(next, { replace: true });
  };
  const canExport = !!session?.user.roles.some((r) => r === 'R-03' || r === 'R-04');
  // FR-DP-15: Admin KKKS hanya memfilter role organisasinya (role KKKS).
  // FR-AR-06: role Tidak Aktif tidak muncul di filter.
  const roleOptions: RoleId[] = (isPic ? rolesByOrgType('KKKS') : allRoleIds()).filter(
    isRoleActive,
  );
  const rows = list.data ?? [];
  const PAGE = parsePageSize(params.get(PAGE_SIZE_PARAM));
  const pageRows = rows.slice((page - 1) * PAGE, page * PAGE);
  const statusLabel = (s: string) => (s === PERMINTAAN ? c.filterPermintaan : s);
  const applied: AppliedFilter[] = [
    status !== SEMUA && {
      key: 'status',
      label: c.filterStatus,
      value: statusLabel(status),
      onRemove: () => setParam('status', SEMUA),
    },
    org !== SEMUA && {
      key: 'org',
      label: c.filterOrganisasi,
      value: orgs.data?.find((o) => o.id === org)?.nama ?? org,
      onRemove: () => setParam('organisasi', SEMUA),
    },
    role !== SEMUA && {
      key: 'role',
      label: c.panel.filterRole,
      value: `${role} ${roleName(role as RoleId)}`,
      onRemove: () => setParam('role', SEMUA),
    },
  ].filter(Boolean) as AppliedFilter[];
  const openUser = (uid: string) =>
    navigate(`/pengguna/${uid}`, { state: { from: location.search } satisfies FromListState });

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
            className="text-body-strong text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            {row.original.nama}
          </Link>
          <span className="text-caption text-ink-muted">{row.original.email}</span>
        </div>
      ),
    },
    {
      id: 'org',
      header: c.kolom.organisasi,
      accessorFn: (u) => u.organisasi.nama,
      cell: ({ getValue }) => <span className="text-ink">{getValue() as string}</span>,
    },
    {
      id: 'role',
      header: c.kolom.role,
      accessorFn: (u) => u.roles.join(','),
      cell: ({ row }) => (
        <span className="flex flex-col text-ink">
          {row.original.roles.map((r) => (
            <span key={r}>
              <span className="font-mono text-caption text-ink-muted">{r}</span> {roleName(r)}
              {!isRoleActive(r) && (
                <span className="text-caption text-ink-muted"> {roleCopy.penandaTidakAktif}</span>
              )}
            </span>
          ))}
        </span>
      ),
    },
    {
      id: 'status',
      header: c.kolom.status,
      accessorKey: 'status',
      cell: ({ row }) => <StatusBadge user={row.original} />,
    },
    {
      id: 'login',
      header: c.kolom.loginTerakhir,
      accessorKey: 'loginTerakhir',
      cell: ({ getValue }) => (
        <span className="text-caption text-ink-muted">
          {getValue() ? formatTanggalJam(getValue() as string) : c.panel.belumPernahLogin}
        </span>
      ),
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
            {inviter && (
              <Button
                variant="primary"
                icon={<UserPlus aria-hidden size={14} strokeWidth={1.8} />}
                onClick={() => setInviteOpen(true)}
              >
                {c.undang}
              </Button>
            )}
          </div>
        }
      />
      <PageBody>
        <TableCard
          title={c.tabelJudul}
          tools={
            <>
              <TableSearch
                label={c.cariLabel}
                placeholder={c.cari}
                value={search}
                onChange={(e) => setParam('cari', e.target.value)}
              />
              <FilterPanel<PanelValue>
                value={{ status, org, role }}
                emptyValue={{ status: SEMUA, org: SEMUA, role: SEMUA }}
                activeCount={applied.length}
                onApply={applyPanel}
                onDraftChange={setDraft}
                applyLabel={() =>
                  preview.data
                    ? t.filter.terapkanJumlah(preview.data.length, c.entitas)
                    : t.filter.terapkan
                }
                labels={t.filter}
              >
                {(d, set) => (
                  <>
                    <FilterGroup legend={c.filterStatus}>
                      <Select
                        label={c.filterStatus}
                        hideLabel
                        value={d.status}
                        onValueChange={(v) => set({ ...d, status: v })}
                        options={[
                          { value: SEMUA, label: c.semuaStatus },
                          ...ACCOUNT_STATUSES.map((s) => ({ value: s, label: s })),
                          { value: PERMINTAAN, label: c.filterPermintaan },
                        ]}
                      />
                    </FilterGroup>
                    {!isPic && (
                      <FilterGroup legend={c.filterOrganisasi}>
                        <Select
                          label={c.filterOrganisasi}
                          hideLabel
                          value={d.org}
                          onValueChange={(v) => set({ ...d, org: v })}
                          options={[
                            { value: SEMUA, label: c.semuaOrganisasi },
                            ...(orgs.data ?? []).map((o) => ({ value: o.id, label: o.nama })),
                          ]}
                        />
                      </FilterGroup>
                    )}
                    <FilterGroup legend={c.panel.filterRole}>
                      <Select
                        label={c.panel.filterRole}
                        hideLabel
                        value={d.role}
                        onValueChange={(v) => set({ ...d, role: v })}
                        options={[
                          { value: SEMUA, label: c.panel.semuaRole },
                          ...roleOptions.map((r) => ({ value: r, label: `${r} ${roleName(r)}` })),
                        ]}
                      />
                    </FilterGroup>
                  </>
                )}
              </FilterPanel>
              {/* DS v2 DataTable: aksi milik tabel (Unduh) = tombol ikon di toolbar, bukan di PageHeader. */}
              {canExport && (
                <IconButton
                  label={c.panel.eksporJudul}
                  icon={<Download strokeWidth={2} />}
                  onClick={() => setExportOpen(true)}
                  disabled={!rows.length}
                />
              )}
            </>
          }
          applied={
            <AppliedFilters
              filters={applied}
              onClear={() =>
                setParams(new URLSearchParams(search ? { cari: search } : {}), { replace: true })
              }
              labels={t.filter}
            />
          }
          footer={
            <Pagination
              page={page}
              pageSize={PAGE}
              total={rows.length}
              onPageChange={(n) => setParam('hal', String(n))}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(n) => setParam(PAGE_SIZE_PARAM, String(n))}
              labels={logsCopy.halaman}
            />
          }
        >
          <DataTable
            caption={c.tabelLabel}
            columns={columns}
            data={pageRows}
            getRowId={(u) => u.id}
            loading={list.isPending}
            loadingContent={<p className="px-4 text-body text-ink-muted">{t.app.memuat}</p>}
            error={list.isError ? c.gagalMemuat : undefined}
            onRowClick={(u) => openUser(u.id)}
            empty={
              <EmptyState
                illustration={filtered ? 'filter-kosong' : 'kosong'}
                illustrationSize={filtered ? 'sm' : 'md'}
                title={filtered ? c.kosongFilter : c.kosong}
                action={
                  filtered ? (
                    <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                      {c.hapusFilter}
                    </Button>
                  ) : undefined
                }
              />
            }
          />
        </TableCard>
      </PageBody>
      {exportOpen && (
        <ExportDialog query={query} count={rows.length} onClose={() => setExportOpen(false)} />
      )}
      {inviter && (
        <InviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          inviter={inviter}
          ownOrg={session.user.organisasi}
        />
      )}
    </>
  );
}
