/**
 * Organisasi — PRD Kelola Organisasi KKKS (ClickUp z8pmx9pc63, status scoping), FR-ORG-01..04, 08, 20, Design Brief B1.
 * Tidak ada Figma: pola Manajemen Pengguna (kartu filter, tabel, panel kanan) — PR-11.
 * Rute /organisasi (daftar) dan /organisasi/:kode (halaman detail, arahan PM 15 Okt 2026). R-03 & R-07: daftar → detail; R-04: langsung
 * detail organisasinya dalam mode baca (FR-ORG-20). Filter Status bawaan Aktif (FR-ORG-03); 25 baris per halaman.
 */
import type { ColumnDef } from '@tanstack/react-table';
import { PAGE_SIZE_OPTIONS, PAGE_SIZE_PARAM, parsePageSize } from '@/lib/page-size';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { AccountStatusBadge } from '@/components/patterns/AccountStatusBadge';
import { DataTable } from '@/components/patterns/DataTable';
import { EmptyState } from '@/components/patterns/EmptyState';
import { AppliedFilters, ChipGroup, FilterGroup, FilterPanel, type AppliedFilter } from '@/components/patterns/FilterPanel';
import { TableCard, TableSearch } from '@/components/patterns/TableCard';
import { Pagination } from '@/components/patterns/Pagination';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n/id';
import { inviterRoleOf } from '@/lib/user-rules';
import type { OrgDetail, OrgSummary, OrgType } from '@/services';
import { logsCopy } from '../logs/copy';
import { useSession } from '../session/SessionProvider';
import { AddOrgDialog } from './components/AddOrgDialog';
import { OrgDetailContent, OrgDetailPage, OrgHeaderNotes, OrgStatusBadge, type OrgDetailNavState, type OrgLevel } from './components/OrgPanel';
import { orgCopy as c } from './copy';
import { useOrgDetail, useOrgList } from './hooks';

const SEMUA = 'semua';
const JENIS: OrgType[] = ['SKK Migas', 'KKKS', 'Kontraktor'];

/** /organisasi/:kode — R-03/R-07: halaman detail; Admin KKKS (mode baca) tetap melihat organisasinya sendiri. */
export function OrganisasiDetailRoute() {
  const { session } = useSession();
  const roles = session?.user.roles ?? [];
  const level: OrgLevel = roles.includes('R-03') ? 'admin' : roles.includes('R-07') ? 'teknis' : 'baca';
  if (!session) return null;
  return level === 'baca' ? <OwnOrgPage kode={session.user.organisasi.id} /> : <OrgDetailPage level={level} />;
}

export function OrganisasiPage() {
  const { session } = useSession();
  const roles = session?.user.roles ?? [];
  const level: OrgLevel = roles.includes('R-03') ? 'admin' : roles.includes('R-07') ? 'teknis' : 'baca';
  if (!session) return null;
  return level === 'baca' ? <OwnOrgPage kode={session.user.organisasi.id} /> : <OrgListPage />;
}

/** FR-ORG-20: Admin KKKS membuka langsung detail organisasinya (mode baca). */
function OwnOrgPage({ kode: orgId }: { kode: string }) {
  const list = useOrgList({});
  const own = list.data?.find((o) => o.id === orgId);
  const detail = useOrgDetail(own?.kode);
  const org = detail.data;
  return (
    <>
      <PageHeader title={org?.nama ?? c.judul} summary={org ? <span className="font-mono">{org.kode}</span> : undefined} actions={org ? <OrgStatusBadge status={org.status} /> : undefined} />
      <PageBody>
        <Section>
          {org ? (
            <div className="flex flex-col gap-4">
              <OrgHeaderNotes org={org} />
              <OrgDetailContent org={org} level="baca" />
            </div>
          ) : (
            <p role="status" className="text-body text-ink-muted">{c.memuat}</p>
          )}
        </Section>
      </PageBody>
    </>
  );
}

function OrgListPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);
  const inviter = session ? inviterRoleOf(session.user.roles) : null;

  const search = params.get('cari') ?? '';
  const jenis = params.get('jenis') ?? SEMUA;
  const status = params.get('status') ?? 'Aktif';
  const page = Math.max(1, Number(params.get('hal') ?? '1') || 1);
  const PAGE = parsePageSize(params.get(PAGE_SIZE_PARAM));
  const list = useOrgList({ search: search || undefined, jenis: jenis !== SEMUA ? (jenis as OrgType) : undefined, status: status !== SEMUA ? (status as 'Aktif' | 'Nonaktif') : undefined });
  const rows = list.data ?? [];
  const filtered = !!search || jenis !== SEMUA || status !== 'Aktif';
  // DS v2 FilterPanel: pratinjau jumlah dari draf; status bawaan "Aktif" bukan pil (filter bawaan).
  const [draft, setDraft] = useState<{ jenis: string; status: string } | null>(null);
  const preview = useOrgList(
    draft
      ? { search: search || undefined, jenis: draft.jenis !== SEMUA ? (draft.jenis as OrgType) : undefined, status: draft.status !== SEMUA ? (draft.status as 'Aktif' | 'Nonaktif') : undefined }
      : { search: search || undefined, jenis: jenis !== SEMUA ? (jenis as OrgType) : undefined, status: status !== SEMUA ? (status as 'Aktif' | 'Nonaktif') : undefined },
  );
  const applied: AppliedFilter[] = [
    jenis !== SEMUA && { key: 'jenis', label: c.filterJenis, value: jenis, onRemove: () => setParam('jenis', SEMUA) },
    status !== 'Aktif' && { key: 'status', label: c.filterStatus, value: status === SEMUA ? t.filter.semua : c.nonaktif, onRemove: () => setParam('status', 'Aktif') },
  ].filter(Boolean) as AppliedFilter[];

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (!v || (k === 'status' ? v === 'Aktif' : v === SEMUA)) next.delete(k);
    else next.set(k, v);
    if (k !== 'hal') next.delete('hal');
    setParams(next, { replace: true });
  };
  const open = (k: string, extra?: OrgDetailNavState) => navigate(`/organisasi/${k}`, { state: { from: location.search, ...extra } satisfies OrgDetailNavState });

  const dim = (o: OrgSummary) => (o.status === 'Nonaktif' ? 'text-ink-muted' : 'text-ink');
  const columns: ColumnDef<OrgSummary, unknown>[] = [
    {
      id: 'nama',
      header: c.kolom.nama,
      cell: ({ row }) => (
        <span className={`flex flex-col ${dim(row.original)}`}>
          <span className="text-body-strong">{row.original.nama}</span>
          <span className="font-mono text-caption text-ink-muted">{row.original.kode}</span>
        </span>
      ),
    },
    { id: 'jenis', header: c.kolom.jenis, cell: ({ row }) => <span className={dim(row.original)}>{row.original.jenis}</span> },
    {
      id: 'domain',
      header: c.kolom.domain,
      cell: ({ row }) => (
        <span className={`flex items-center gap-1 ${dim(row.original)}`}>
          <span className="font-mono text-caption">{row.original.domains[0] ?? '—'}</span>
          {row.original.domains.length > 1 && <span className="inline-flex h-5 items-center rounded-sm bg-surface-sunken px-[6px] text-caption font-semibold text-ink-muted">{c.tambahLainnya(row.original.domains.length - 1)}</span>}
        </span>
      ),
    },
    { id: 'email', header: c.kolom.email, cell: ({ row }) => <span className="text-ink">{row.original.emailDiizinkan ? c.tambahLainnya(row.original.emailDiizinkan) : '—'}</span> },
    { id: 'pengguna', header: c.kolom.pengguna, meta: { align: 'right' }, cell: ({ row }) => <span className={`tabular-nums ${dim(row.original)}`}>{row.original.penggunaAktif}</span> },
    {
      id: 'pic',
      header: c.kolom.pic,
      cell: ({ row }) =>
        row.original.tanpaPic ? <AccountStatusBadge label={c.tanpaPic} tone="warning" /> : <span className={`tabular-nums ${dim(row.original)}`}>{row.original.picAktif}</span>,
    },
    { id: 'status', header: c.kolom.status, cell: ({ row }) => <OrgStatusBadge status={row.original.status} /> },
  ];

  function created(o: OrgDetail) {
    setAddOpen(false);
    open(o.kode);
    // FR-ORG-08: toast dengan aksi Undang Admin KKKS.
    toast.show({ title: c.tambahDialog.sukses, action: inviter ? { label: c.tambahDialog.undangPic, onClick: () => open(o.kode, { undangPic: Date.now() }) } : undefined });
  }

  return (
    <>
      <PageHeader
        title={c.judul}
        summary={c.ringkasan}
        actions={
          <Button variant="primary" icon={<Plus aria-hidden size={14} strokeWidth={1.8} />} onClick={() => setAddOpen(true)}>
            {c.tambah}
          </Button>
        }
      />
      <PageBody>
        <TableCard
          title={c.tabelJudul}
          tools={
            <>
              <TableSearch label={c.cariLabel} placeholder={c.cari} value={search} onChange={(e) => setParam('cari', e.target.value)} />
              <FilterPanel<{ jenis: string; status: string }>
                value={{ jenis, status }}
                emptyValue={{ jenis: SEMUA, status: 'Aktif' }}
                activeCount={applied.length}
                onApply={(v) => {
                  const next = new URLSearchParams(params);
                  if (v.jenis === SEMUA) next.delete('jenis');
                  else next.set('jenis', v.jenis);
                  if (v.status === 'Aktif') next.delete('status');
                  else next.set('status', v.status);
                  next.delete('hal');
                  setParams(next, { replace: true });
                }}
                onDraftChange={setDraft}
                applyLabel={() => (preview.data ? t.filter.terapkanJumlah(preview.data.length, c.entitas) : t.filter.terapkan)}
                labels={t.filter}
              >
                {(d, set) => (
                  <>
                    <FilterGroup legend={c.filterJenis}>
                      <ChipGroup label={c.filterJenis} value={d.jenis} onChange={(v) => set({ ...d, jenis: v })} options={[{ value: SEMUA, label: t.filter.semua }, ...JENIS.map((j) => ({ value: j, label: j }))]} />
                    </FilterGroup>
                    <FilterGroup legend={c.filterStatus}>
                      <ChipGroup
                        label={c.filterStatus}
                        value={d.status}
                        onChange={(v) => set({ ...d, status: v })}
                        options={[
                          { value: 'Aktif', label: c.aktif },
                          { value: 'Nonaktif', label: c.nonaktif },
                          { value: SEMUA, label: t.filter.semua },
                        ]}
                      />
                    </FilterGroup>
                  </>
                )}
              </FilterPanel>
            </>
          }
          applied={<AppliedFilters filters={applied} onClear={() => setParams(new URLSearchParams(search ? { cari: search } : {}), { replace: true })} labels={t.filter} />}
          footer={
            <Pagination page={page} pageSize={PAGE} total={rows.length} onPageChange={(n) => setParam('hal', String(n))} pageSizeOptions={PAGE_SIZE_OPTIONS} onPageSizeChange={(n) => setParam(PAGE_SIZE_PARAM, String(n))} labels={logsCopy.halaman} />
          }
        >
          <DataTable
            caption={c.tabel}
            columns={columns}
            data={rows.slice((page - 1) * PAGE, page * PAGE)}
            getRowId={(o) => o.kode}
            loading={list.isPending}
            loadingContent={<p className="px-4 text-body text-ink-muted">{c.memuat}</p>}
            error={list.isError ? c.gagalMuat : undefined}
            onRowClick={(o) => open(o.kode)}
            empty={
              <EmptyState
                illustration={filtered ? 'filter-kosong' : 'kosong'}
                illustrationSize={filtered ? 'sm' : 'md'}
                title={filtered ? c.kosongFilter : c.kosong}
                action={filtered ? <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>{c.hapusFilter}</Button> : undefined}
              />
            }
          />
        </TableCard>
      </PageBody>
      <AddOrgDialog open={addOpen} onOpenChange={setAddOpen} onCreated={created} />
    </>
  );
}
