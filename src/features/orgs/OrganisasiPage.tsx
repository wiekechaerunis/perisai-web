/**
 * Organisasi — PRD Kelola Organisasi KKKS (ClickUp z8pmx9pc63, status scoping), FR-ORG-01..04, 08, 20, Design Brief B1.
 * Tidak ada Figma: pola Manajemen Pengguna (kartu filter, tabel, panel kanan) — PR-11.
 * Rute /organisasi dan /organisasi/:kode (keputusan PM 14 Okt 2026). R-03 & R-07: daftar + panel; R-04: langsung
 * detail organisasinya dalam mode baca (FR-ORG-20). Filter Status bawaan Aktif (FR-ORG-03); 25 baris per halaman.
 */
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { AccountStatusBadge } from '@/components/patterns/AccountStatusBadge';
import { DataTable } from '@/components/patterns/DataTable';
import { EmptyState } from '@/components/patterns/EmptyState';
import { Pagination } from '@/components/patterns/Pagination';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { inviterRoleOf } from '@/lib/user-rules';
import type { OrgDetail, OrgSummary, OrgType } from '@/services';
import { logsCopy } from '../logs/copy';
import { useSession } from '../session/SessionProvider';
import { InviteDialog } from '../users/components/InviteDialog';
import { AddOrgDialog } from './components/AddOrgDialog';
import { OrgDetailContent, OrgHeaderNotes, OrgPanel, OrgStatusBadge, type OrgLevel } from './components/OrgPanel';
import { orgCopy as c } from './copy';
import { useOrgDetail, useOrgList } from './hooks';

const SEMUA = 'semua';
const PAGE = 25;
const JENIS: OrgType[] = ['SKK Migas', 'KKKS', 'Kontraktor'];

export function OrganisasiPage() {
  const { session } = useSession();
  const roles = session?.user.roles ?? [];
  const level: OrgLevel = roles.includes('R-03') ? 'admin' : roles.includes('R-07') ? 'teknis' : 'baca';
  if (!session) return null;
  return level === 'baca' ? <OwnOrgPage kode={session.user.organisasi.id} /> : <OrgListPage level={level} />;
}

/** FR-ORG-20: PIC KKKS membuka langsung detail organisasinya (mode baca). */
function OwnOrgPage({ kode: orgId }: { kode: string }) {
  const list = useOrgList({});
  const own = list.data?.find((o) => o.id === orgId);
  const detail = useOrgDetail(own?.kode);
  const org = detail.data;
  return (
    <>
      <PageHeader title={org?.nama ?? c.judul} summary={org ? <span className="font-mono">{org.kode}</span> : undefined} actions={org ? <OrgStatusBadge status={org.status} /> : undefined} />
      <PageBody>
        <Section className="border border-border">
          {org ? (
            <div className="flex flex-col gap-4">
              <OrgHeaderNotes org={org} />
              <OrgDetailContent org={org} level="baca" />
            </div>
          ) : (
            <p role="status" className="text-body-dense text-ink-muted">{c.memuat}</p>
          )}
        </Section>
      </PageBody>
    </>
  );
}

function OrgListPage({ level }: { level: OrgLevel }) {
  const { session } = useSession();
  const { kode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);
  const [invite, setInvite] = useState<OrgDetail | null>(null);
  const inviter = session ? inviterRoleOf(session.user.roles) : null;

  const search = params.get('cari') ?? '';
  const jenis = params.get('jenis') ?? SEMUA;
  const status = params.get('status') ?? 'Aktif';
  const page = Math.max(1, Number(params.get('hal') ?? '1') || 1);
  const list = useOrgList({ search: search || undefined, jenis: jenis !== SEMUA ? (jenis as OrgType) : undefined, status: status !== SEMUA ? (status as 'Aktif' | 'Nonaktif') : undefined });
  const rows = list.data ?? [];
  const filtered = !!search || jenis !== SEMUA || status !== 'Aktif';

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (!v || (k === 'status' ? v === 'Aktif' : v === SEMUA)) next.delete(k);
    else next.set(k, v);
    if (k !== 'hal') next.delete('hal');
    setParams(next, { replace: true });
  };
  const open = (k: string) => navigate({ pathname: `/organisasi/${k}`, search: location.search });

  const dim = (o: OrgSummary) => (o.status === 'Nonaktif' ? 'text-ink-subtle' : 'text-ink');
  const columns: ColumnDef<OrgSummary, unknown>[] = [
    {
      id: 'nama',
      header: c.kolom.nama,
      cell: ({ row }) => (
        <span className={`flex flex-col ${dim(row.original)}`}>
          <span className="font-medium">{row.original.nama}</span>
          <span className="font-mono text-caption text-ink-subtle">{row.original.kode}</span>
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
          {row.original.domains.length > 1 && <span className="rounded-sm border border-border px-1 text-caption">{c.tambahLainnya(row.original.domains.length - 1)}</span>}
        </span>
      ),
    },
    { id: 'email', header: c.kolom.email, cell: ({ row }) => <span className="font-mono text-caption text-ink-muted">{row.original.emailDiizinkan ? c.tambahLainnya(row.original.emailDiizinkan) : '—'}</span> },
    { id: 'pengguna', header: c.kolom.pengguna, meta: { align: 'right', mono: true }, cell: ({ row }) => <span className={`tabular-nums ${dim(row.original)}`}>{row.original.penggunaAktif}</span> },
    {
      id: 'pic',
      header: c.kolom.pic,
      cell: ({ row }) =>
        row.original.tanpaPic ? <AccountStatusBadge label={c.tanpaPic} tone="warning" /> : <span className={`font-mono tabular-nums ${dim(row.original)}`}>{row.original.picAktif}</span>,
    },
    { id: 'status', header: c.kolom.status, cell: ({ row }) => <OrgStatusBadge status={row.original.status} /> },
  ];

  function created(o: OrgDetail) {
    setAddOpen(false);
    open(o.kode);
    // FR-ORG-08: toast dengan aksi Undang PIC KKKS.
    toast.show({ title: c.tambahDialog.sukses, action: inviter ? { label: c.tambahDialog.undangPic, onClick: () => setInvite(o) } : undefined });
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
        <Section className="border border-border py-4">
          <div className="flex flex-wrap items-end gap-2">
            <TextField label={c.cariLabel} hideLabel placeholder={c.cari} value={search} onChange={(e) => setParam('cari', e.target.value)} leading={<Search size={16} strokeWidth={1.8} />} containerClassName="min-w-[220px] flex-1" />
            <Select label={c.filterJenis} hideLabel value={jenis} onValueChange={(v) => setParam('jenis', v)} options={[{ value: SEMUA, label: c.semuaJenis }, ...JENIS.map((j) => ({ value: j, label: j }))]} className="w-[180px]" />
            <Select
              label={c.filterStatus}
              hideLabel
              value={status}
              onValueChange={(v) => setParam('status', v)}
              options={[
                { value: 'Aktif', label: c.aktif },
                { value: 'Nonaktif', label: c.nonaktif },
                { value: SEMUA, label: c.semuaStatus },
              ]}
              className="w-[180px]"
            />
            {filtered && <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>{c.hapusFilter}</Button>}
          </div>
        </Section>
        <Section className="border border-border" title={c.tabelJudul(rows.length)}>
          <DataTable
            caption={c.tabel}
            columns={columns}
            data={rows.slice((page - 1) * PAGE, page * PAGE)}
            getRowId={(o) => o.kode}
            loading={list.isPending}
            loadingContent={<p className="text-body-dense text-ink-muted">{c.memuat}</p>}
            error={list.isError ? c.gagalMuat : undefined}
            onRowClick={(o) => open(o.kode)}
            selectedRowId={kode}
            empty={<EmptyState title={c.kosongFilter} action={filtered ? <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>{c.hapusFilter}</Button> : undefined} />}
          />
          <Pagination page={page} pageSize={PAGE} total={rows.length} onPageChange={(n) => setParam('hal', String(n))} labels={logsCopy.halaman} />
        </Section>
      </PageBody>
      {kode && <OrgPanel kode={kode} level={level} onClose={() => navigate({ pathname: '/organisasi', search: location.search })} onInvitePic={(o) => setInvite(o)} />}
      <AddOrgDialog open={addOpen} onOpenChange={setAddOpen} onCreated={created} />
      {inviter && session && invite && (
        <InviteDialog
          open
          onOpenChange={(o) => !o && setInvite(null)}
          inviter={inviter}
          ownOrg={session.user.organisasi}
          prefill={{ organisasiId: invite.id, roles: inviter === 'R-04' ? undefined : ['R-04'] }}
        />
      )}
    </>
  );
}
