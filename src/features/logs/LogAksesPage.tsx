/**
 * Log Akses (M-22) — PRD tab ac582539-7263, ClickUp z8pmx9n8pn. "Design belum ada" → pola Manajemen Pengguna (PR-11).
 * FR-LA-06/06a (R-02/R-03 semua, R-04 organisasinya, IP organisasi lain disembunyikan; R-07 tanpa akses),
 * FR-LA-07 (default 7 hari, jumlah hasil), FR-LA-08 (filter gabungan, "(Nonaktif)"), FR-LA-09 (urut waktu, paginasi
 * server), FR-LA-10 (detail + sesi), FR-LA-11 (tautan dari profil: ?pengguna=), FR-LA-12 (kegagalan login beruntun),
 * FR-LA-16 (ekspor CSV R-03), FR-LA-18 (penanda arsip). Tab Sesi aktif: FR-LA-13..15, FR-LO-14..16.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { DataTable } from '@/components/patterns/DataTable';
import { ConfirmDialog } from '@/components/patterns/Dialog';
import { EmptyState } from '@/components/patterns/EmptyState';
import { KeyValueList } from '@/components/patterns/KeyValueList';
import { Pagination } from '@/components/patterns/Pagination';
import { SidePanel } from '@/components/patterns/SidePanel';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { TextField } from '@/components/ui/TextField';
import { formatRelatif, formatTanggalJam } from '@/lib/format';
import { ACCESS_GROUPS, FAILED_STREAK_THRESHOLD, type AccessGroup } from '@/lib/log-events';
import { REVOKE_REASONS } from '@/lib/status';
import { services, type AccessLogEntry, type AccessLogQuery, type AdminSession, type ReasonInput } from '@/services';
import { useSession } from '../session/SessionProvider';
import { reasonValid, ReasonField } from '../users/components/ReasonField';
import { usersCopy } from '../users/copy';
import { useOrganisasiFilter } from './hooks';
import { logsCopy as c } from './copy';
import { ArchiveTag, PeriodFields, ResultTag, TableTitle, downloadCsv, wibDay } from './shared';
import { FilterBar } from '@/components/patterns/FilterBar';

const PAGE_SIZE = 20;
const SEMUA = 'semua';

function EntryPanel({ id, onClose, onSession }: { id: string; onClose: () => void; onSession: (sid: string) => void }) {
  const q = useQuery({ queryKey: ['access-entry', id], queryFn: () => services.logs.accessEntry(id), retry: false });
  const e = q.data;
  const d = c.log.detail;
  return (
    <SidePanel
      open
      onOpenChange={(o) => !o && onClose()}
      title={e?.peristiwa ?? c.memuat}
      titleAside={e && <ResultTag ok={e.hasil === 'Berhasil'}>{e.hasil}</ResultTag>}
      subtitle={e ? formatTanggalJam(e.waktu) : undefined}
      closeLabel={c.tutupPanel}
    >
      {e && (
        <>
          <KeyValueList
            items={[
              { key: 'w', label: d.waktu, value: formatTanggalJam(e.waktu) },
              { key: 'p', label: d.pengguna, value: e.email ? `${e.pengguna} · ${e.email}` : e.pengguna },
              { key: 'o', label: d.organisasi, value: e.organisasi ? `${e.organisasi.nama}${e.organisasi.status === 'Nonaktif' ? ` ${c.nonaktif}` : ''}` : '—' },
              { key: 'k', label: d.kelompok, value: e.kelompok },
              { key: 'j', label: d.peristiwa, value: e.peristiwa },
              { key: 'h', label: d.hasil, value: e.hasil },
              { key: 'a', label: d.alasan, value: e.alasan ?? '—' },
              ...(e.modul ? [{ key: 'm', label: d.modulAksi, value: `${e.modul} · ${e.aksi ?? '—'}` }] : []),
              { key: 'ip', label: d.ip, value: e.ip ?? '—', mono: true },
              { key: 'ua', label: d.userAgent, value: <span className="break-all">{e.userAgent ?? '—'}</span> },
              { key: 'lok', label: d.lokasi, value: e.perkiraanLokasi ?? '—' },
              { key: 's', label: d.sesi, value: e.sesiId ?? '—', mono: true },
            ]}
          />
          {e.arsip && <p className="text-caption text-ink-subtle">{c.arsipKeterangan}</p>}
          {e.sesiId && (
            <div>
              <Button onClick={() => onSession(e.sesiId!)}>{d.lihatSesi}</Button>
            </div>
          )}
        </>
      )}
    </SidePanel>
  );
}

function AccessLogTab() {
  const { session } = useSession();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const isR03 = !!session?.user.roles.includes('R-03');
  const isPicOnly = !!session && !session.user.roles.some((r) => r === 'R-02' || r === 'R-03');
  const orgs = useOrganisasiFilter(!isPicOnly);

  const query: AccessLogQuery = useMemo(
    () => ({
      dari: params.get('dari') ?? wibDay(-7),
      sampai: params.get('sampai') ?? wibDay(0),
      pengguna: params.get('pengguna') ?? undefined,
      organisasiId: params.get('organisasi') ?? undefined,
      kelompok: (params.get('jenis') as AccessGroup | null) ?? undefined,
      hasil: (params.get('hasil') as 'Berhasil' | 'Gagal' | null) ?? undefined,
      ip: params.get('ip') ?? undefined,
      sesiId: params.get('sesi') ?? undefined,
      gagalBeruntun: params.get('beruntun') === '1',
      page: Number(params.get('hal') ?? 1),
      pageSize: PAGE_SIZE,
    }),
    [params],
  );
  const list = useQuery({ queryKey: ['access-log', query], queryFn: () => services.logs.accessLog(query) });
  const exp = useMutation({
    mutationFn: () => services.logs.exportAccessLog({ ...query, page: 1, pageSize: 100_000 }),
    onSuccess: (csv) => {
      downloadCsv(`log-akses-${query.dari}-${query.sampai}.csv`, csv);
      toast.show({ title: c.eksporSukses(csv.split('\n').length - 1) });
    },
  });

  const set = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === SEMUA) next.delete(k);
      else next.set(k, v);
    }
    if (!('hal' in patch)) next.delete('hal');
    setParams(next, { replace: true });
  };
  const entryId = params.get('entri');

  // Tombol Atur ulang filter hanya tampil bila ada filter selain halaman/entri yang dibuka.
  const filtered = [...params.keys()].some((k) => !['hal', 'entri', 'tab'].includes(k));
  const columns: ColumnDef<AccessLogEntry, unknown>[] = [
    {
      id: 'w',
      header: c.log.kolom.waktu,
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-mono text-caption">
          {formatTanggalJam(row.original.waktu)}
          {row.original.arsip && <ArchiveTag />}
        </span>
      ),
    },
    {
      id: 'p',
      header: c.log.kolom.pengguna,
      cell: ({ row }) => (
        <button type="button" onClick={(e) => (e.stopPropagation(), set({ entri: row.original.id }))} className="text-left font-medium text-ink hover:underline">
          {row.original.pengguna}
          {row.original.email && row.original.email !== row.original.pengguna && <span className="block text-caption font-normal text-ink-muted">{row.original.email}</span>}
        </button>
      ),
    },
    { id: 'o', header: c.log.kolom.organisasi, cell: ({ row }) => <span className="text-ink-muted">{row.original.organisasi?.nama ?? '—'}</span> },
    {
      id: 'e',
      header: c.log.kolom.peristiwa,
      cell: ({ row }) => (
        <span>
          {row.original.peristiwa}
          {row.original.alasan && <span className="block text-caption text-ink-muted">{row.original.alasan}</span>}
        </span>
      ),
    },
    { id: 'h', header: c.log.kolom.hasil, cell: ({ row }) => <ResultTag ok={row.original.hasil === 'Berhasil'}>{row.original.hasil}</ResultTag> },
    { id: 's', header: c.log.kolom.sumber, cell: ({ row }) => <span className="font-mono text-caption text-ink-muted">{row.original.ip ?? '—'}</span> },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Section className="border border-border py-4">
        <FilterBar
          labels={{ more: c.filterLainnya, less: c.sembunyikanFilter }}
          activeCount={[query.organisasiId, query.kelompok, query.hasil, query.ip, query.gagalBeruntun].filter(Boolean).length}
          primary={
            <>
              <TextField
                label={c.log.pengguna}
                placeholder={c.log.penggunaPlaceholder}
                value={query.pengguna ?? ''}
                onChange={(e) => set({ pengguna: e.target.value })}
                leading={<Search size={16} strokeWidth={1.8} />}
                containerClassName="min-w-[220px] flex-1"
              />
              <PeriodFields dari={query.dari} sampai={query.sampai} onChange={(v) => set(v)} />
            </>
          }
          actions={
            filtered ? (
              <Button variant="quiet" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                {c.reset}
              </Button>
            ) : undefined
          }
          footer={query.gagalBeruntun ? <p className="text-caption text-ink-muted">{c.log.gagalBeruntunAktif(FAILED_STREAK_THRESHOLD)}</p> : undefined}
          advanced={
            <>
            {!isPicOnly && (
              <Select
                label={c.log.organisasi}
                value={query.organisasiId ?? SEMUA}
                onValueChange={(v) => set({ organisasi: v })}
                options={[{ value: SEMUA, label: c.semuaOrganisasi }, ...orgs]}
                className="w-[260px]"
              />
            )}
            <Select
              label={c.log.jenis}
              value={query.kelompok ?? SEMUA}
              onValueChange={(v) => set({ jenis: v })}
              options={[{ value: SEMUA, label: c.semua }, ...ACCESS_GROUPS.map((g) => ({ value: g, label: g }))]}
              className="w-[200px]"
            />
            <Select
              label={c.hasil}
              value={query.hasil ?? SEMUA}
              onValueChange={(v) => set({ hasil: v })}
              options={[
                { value: SEMUA, label: c.semua },
                { value: 'Berhasil', label: c.log.berhasil },
                { value: 'Gagal', label: c.log.gagal },
              ]}
              className="w-[150px]"
            />
            <TextField label={c.log.ip} value={query.ip ?? ''} onChange={(e) => set({ ip: e.target.value })} containerClassName="w-[160px]" className="font-mono" />
            <Button aria-pressed={query.gagalBeruntun} variant={query.gagalBeruntun ? 'primary' : 'secondary'} onClick={() => set({ beruntun: query.gagalBeruntun ? undefined : '1' })}>
              {c.log.gagalBeruntun}
            </Button>
            </>
          }
        />
      </Section>
      <Section
        className="border border-border"
        title={<TableTitle title={c.log.tabel} count={list.data?.total ?? 0} />}
        action={
          isR03 && (
            <Button icon={<Download aria-hidden size={14} strokeWidth={1.8} />} onClick={() => exp.mutate()} loading={exp.isPending} loadingLabel={c.mengekspor}>
              {c.ekspor}
            </Button>
          )
        }
      >
        <DataTable
          caption={c.log.tabel}
          columns={columns}
          data={list.data?.items ?? []}
          getRowId={(e) => e.id}
          loading={list.isPending}
          loadingContent={<p className="text-body-dense text-ink-muted">{c.memuat}</p>}
          error={list.isError ? c.gagal : undefined}
          onRowClick={(e) => set({ entri: e.id })}
          selectedRowId={entryId ?? undefined}
          empty={<EmptyState title={c.log.kosong} />}
        />
        {list.data && <Pagination page={list.data.page} pageSize={list.data.pageSize} total={list.data.total} onPageChange={(p) => set({ hal: String(p), entri: undefined })} labels={c.halaman} />}
      </Section>
      {entryId && <EntryPanel id={entryId} onClose={() => set({ entri: undefined })} onSession={(sid) => set({ sesi: sid, entri: undefined, dari: wibDay(-365) })} />}
    </div>
  );
}

function ActiveSessionsTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const list = useQuery({ queryKey: ['admin-sessions'], queryFn: () => services.logs.activeSessions() });
  const [target, setTarget] = useState<AdminSession | null>(null);
  const [reason, setReason] = useState<ReasonInput>({ alasan: '' });
  const revoke = useMutation({
    mutationFn: () => services.logs.revokeSession(target!.id, reason),
    onSuccess: () => {
      toast.show({ title: c.sesi.sukses });
      setTarget(null);
      void qc.invalidateQueries({ queryKey: ['admin-sessions'] });
    },
  });
  const k = c.sesi.kolom;
  const columns: ColumnDef<AdminSession, unknown>[] = [
    { id: 'p', header: k.pengguna, cell: ({ row }) => <span className="font-medium">{row.original.nama}<span className="block text-caption font-normal text-ink-muted">{row.original.email}</span></span> },
    { id: 'o', header: k.organisasi, cell: ({ row }) => <span className="text-ink-muted">{row.original.organisasi.nama}</span> },
    { id: 'd', header: k.perangkat, cell: ({ row }) => `${row.original.browser} · ${row.original.sistemOperasi}` },
    { id: 'l', header: k.lokasi, accessorKey: 'perkiraanLokasi' },
    { id: 'm', header: k.masuk, cell: ({ row }) => <span className="font-mono text-caption">{formatTanggalJam(row.original.waktuMasuk)}</span> },
    { id: 'a', header: k.aktivitas, cell: ({ row }) => formatRelatif(row.original.aktivitasTerakhir) },
    {
      id: 'x',
      header: () => <span className="sr-only">{k.aksi}</span>,
      cell: ({ row }) => (
        <Button variant="quiet" onClick={() => (setReason({ alasan: '' }), setTarget(row.original))}>
          {c.sesi.cabut}
        </Button>
      ),
      meta: { align: 'right' },
    },
  ];
  return (
    <Section className="border border-border" title={<TableTitle title={c.sesi.tabel} count={list.data?.length ?? 0} />}>
      <DataTable
        caption={c.sesi.tabel}
        columns={columns}
        data={list.data ?? []}
        getRowId={(s) => s.id}
        loading={list.isPending}
        loadingContent={<p className="text-body-dense text-ink-muted">{c.memuat}</p>}
        error={list.isError ? c.gagal : undefined}
        empty={<EmptyState title={c.sesi.kosong} />}
      />
      {target && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setTarget(null)}
          title={c.sesi.cabutJudul}
          description={c.sesi.cabutIsi(target.nama, `${target.browser} · ${target.sistemOperasi}`)}
          closeLabel={usersCopy.sesi.batal}
          confirmLabel={usersCopy.sesi.konfirmasi}
          cancelLabel={usersCopy.sesi.batal}
          destructive
          loading={revoke.isPending}
          loadingLabel={usersCopy.sesi.memproses}
          confirmDisabled={!reasonValid(reason)}
          onConfirm={() => revoke.mutate()}
        >
          <ReasonField label={usersCopy.sesi.alasan} placeholder={usersCopy.sesi.alasanPlaceholder} options={REVOKE_REASONS} value={reason} onChange={setReason} />
        </ConfirmDialog>
      )}
    </Section>
  );
}

export function LogAksesPage() {
  const [tab, setTab] = useState('log');
  return (
    <>
      <PageHeader title={c.log.judul} summary={c.log.ringkasan} />
      <PageBody>
        <Tabs
          label={c.log.tabLabel}
          value={tab}
          onValueChange={setTab}
          items={[
            { value: 'log', label: c.log.tabLog, content: <AccessLogTab /> },
            { value: 'sesi', label: c.log.tabSesi, content: <ActiveSessionsTab /> },
          ]}
        />
      </PageBody>
    </>
  );
}
