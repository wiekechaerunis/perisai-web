/**
 * Log Akses (M-22) — PRD tab ac582539-7263, ClickUp z8pmx9n8pn. "Design belum ada" → pola Manajemen Pengguna (PR-11).
 * FR-LA-06/06a (R-02/R-03 semua, R-04 organisasinya, IP organisasi lain disembunyikan; R-07 tanpa akses),
 * FR-LA-07 (default 7 hari, jumlah hasil), FR-LA-08 (filter gabungan, "(Nonaktif)"), FR-LA-09 (urut waktu, paginasi
 * server), FR-LA-10 (detail + sesi), FR-LA-11 (tautan dari profil: ?pengguna=), FR-LA-12 (kegagalan login beruntun),
 * FR-LA-16 (ekspor CSV R-03), FR-LA-18 (penanda arsip). Tab Sesi aktif: FR-LA-13..15, FR-LO-14..16.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PAGE_SIZE_OPTIONS, PAGE_SIZE_PARAM, parsePageSize } from '@/lib/page-size';
import type { ColumnDef } from '@tanstack/react-table';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/patterns/DataTable';
import { ConfirmDialog } from '@/components/patterns/Dialog';
import { EmptyState } from '@/components/patterns/EmptyState';
import { KeyValueList } from '@/components/patterns/KeyValueList';
import { Pagination } from '@/components/patterns/Pagination';
import { SidePanel } from '@/components/patterns/SidePanel';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/Select';
import { Tabs } from '@/components/ui/Tabs';
import { TextField } from '@/components/ui/TextField';
import { formatRelatif, formatTanggalJam } from '@/lib/format';
import { ACCESS_GROUPS, FAILED_STREAK_THRESHOLD, type AccessGroup } from '@/lib/log-events';
import { REVOKE_REASONS } from '@/lib/status';
import {
  services,
  type AccessLogEntry,
  type AccessLogQuery,
  type AdminSession,
  type ReasonInput,
} from '@/services';
import { useSession } from '../session/SessionProvider';
import { reasonValid, ReasonField } from '../users/components/ReasonField';
import { usersCopy } from '../users/copy';
import { useOrganisasiFilter } from './hooks';
import { logsCopy as c } from './copy';
import {
  ArchiveTag,
  DEFAULT_PERIOD,
  PeriodFields,
  ResultTag,
  downloadCsv,
  formatRentang,
  isDefaultPeriod,
  wibDay,
} from './shared';
import {
  AppliedFilters,
  ChipGroup,
  FilterGroup,
  FilterPanel,
  type AppliedFilter,
} from '@/components/patterns/FilterPanel';
import { TableCard, TableSearch } from '@/components/patterns/TableCard';
import { t } from '@/lib/i18n/id';
import { Checkbox } from '@/components/ui/Checkbox';

const SEMUA = 'semua';

interface LogDraft {
  dari: string;
  sampai: string;
  organisasi: string;
  jenis: string;
  hasil: string;
  ip: string;
  beruntun: boolean;
}

function EntryPanel({
  id,
  onClose,
  onSession,
}: {
  id: string;
  onClose: () => void;
  onSession: (sid: string) => void;
}) {
  const q = useQuery({
    queryKey: ['access-entry', id],
    queryFn: () => services.logs.accessEntry(id),
    retry: false,
  });
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
              {
                key: 'p',
                label: d.pengguna,
                value: e.email ? `${e.pengguna} · ${e.email}` : e.pengguna,
              },
              {
                key: 'o',
                label: d.organisasi,
                value: e.organisasi
                  ? `${e.organisasi.nama}${e.organisasi.status === 'Nonaktif' ? ` ${c.nonaktif}` : ''}`
                  : '—',
              },
              { key: 'k', label: d.kelompok, value: e.kelompok },
              { key: 'j', label: d.peristiwa, value: e.peristiwa },
              { key: 'h', label: d.hasil, value: e.hasil },
              { key: 'a', label: d.alasan, value: e.alasan ?? '—' },
              ...(e.modul
                ? [{ key: 'm', label: d.modulAksi, value: `${e.modul} · ${e.aksi ?? '—'}` }]
                : []),
              { key: 'ip', label: d.ip, value: e.ip ?? '—', mono: true },
              {
                key: 'ua',
                label: d.userAgent,
                value: <span className="break-all">{e.userAgent ?? '—'}</span>,
              },
              { key: 'lok', label: d.lokasi, value: e.perkiraanLokasi ?? '—' },
              { key: 's', label: d.sesi, value: e.sesiId ?? '—', mono: true },
            ]}
          />
          {e.arsip && <p className="text-caption text-ink-muted">{c.arsipKeterangan}</p>}
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

/** Kueri Log akses dari URL (dipakai tabel dan tombol Ekspor di PageHeader). */
function useAccessLogQuery(params: URLSearchParams): AccessLogQuery {
  return useMemo(
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
      pageSize: parsePageSize(params.get(PAGE_SIZE_PARAM)),
    }),
    [params],
  );
}

/** FR-LA-16: ekspor CSV hasil filter (R-03). DS v2 DataTable: tombol ikon Unduh di toolbar tabel (bukan PageHeader). */
function ExportAccessLogButton() {
  const toast = useToast();
  const [params] = useSearchParams();
  const query = useAccessLogQuery(params);
  const exp = useMutation({
    mutationFn: () => services.logs.exportAccessLog({ ...query, page: 1, pageSize: 100_000 }),
    onSuccess: (csv) => {
      downloadCsv(`log-akses-${query.dari}-${query.sampai}.csv`, csv);
      toast.show({ title: c.eksporSukses(csv.split('\n').length - 1) });
    },
  });
  return (
    <IconButton
      label={c.log.eksporLabel}
      icon={<Download strokeWidth={2} />}
      onClick={() => exp.mutate()}
      loading={exp.isPending}
    />
  );
}

function AccessLogTab() {
  const { session } = useSession();
  const isR03 = !!session?.user.roles.includes('R-03');
  const [params, setParams] = useSearchParams();
  const isPicOnly = !!session && !session.user.roles.some((r) => r === 'R-02' || r === 'R-03');
  const orgs = useOrganisasiFilter(!isPicOnly);
  const query = useAccessLogQuery(params);
  const list = useQuery({
    queryKey: ['access-log', query],
    queryFn: () => services.logs.accessLog(query),
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

  // Periode bawaan (7 hari terakhir) bukan filter aktif: tidak disimpan di URL (lihat onApply panel).
  // DS v2 AppliedFilter: periode bawaan (7 hari) dan pencarian teks bukan pil.
  const applied = [
    !isDefaultPeriod(query.dari, query.sampai) && {
      key: 'periode',
      label: c.periode,
      value: formatRentang(query.dari, query.sampai),
      onRemove: () => set({ dari: undefined, sampai: undefined }),
    },
    query.organisasiId && {
      key: 'organisasi',
      label: c.log.organisasi,
      value: orgs.find((o) => o.value === query.organisasiId)?.label ?? query.organisasiId,
      onRemove: () => set({ organisasi: undefined }),
    },
    query.kelompok && {
      key: 'jenis',
      label: c.log.jenis,
      value: query.kelompok,
      onRemove: () => set({ jenis: undefined }),
    },
    query.hasil && {
      key: 'hasil',
      label: c.hasil,
      value: query.hasil,
      onRemove: () => set({ hasil: undefined }),
    },
    query.ip && {
      key: 'ip',
      label: c.log.ip,
      value: query.ip,
      onRemove: () => set({ ip: undefined }),
    },
    query.gagalBeruntun && {
      key: 'beruntun',
      label: c.log.kondisi,
      value: c.log.gagalBeruntunPil,
      onRemove: () => set({ beruntun: undefined }),
    },
    query.sesiId && {
      key: 'sesi',
      label: c.log.detail.sesi,
      value: query.sesiId,
      onRemove: () => set({ sesi: undefined }),
    },
  ].filter(Boolean) as AppliedFilter[];
  const current: LogDraft = {
    dari: query.dari,
    sampai: query.sampai,
    organisasi: query.organisasiId ?? SEMUA,
    jenis: query.kelompok ?? SEMUA,
    hasil: query.hasil ?? SEMUA,
    ip: query.ip ?? '',
    beruntun: !!query.gagalBeruntun,
  };
  // Pratinjau jumlah hasil dari draf panel ("Terapkan · n entri").
  const [draft, setDraft] = useState<LogDraft | null>(null);
  const previewQuery: AccessLogQuery = draft
    ? {
        ...query,
        dari: draft.dari,
        sampai: draft.sampai,
        organisasiId: draft.organisasi !== SEMUA ? draft.organisasi : undefined,
        kelompok: draft.jenis !== SEMUA ? (draft.jenis as AccessGroup) : undefined,
        hasil: draft.hasil !== SEMUA ? (draft.hasil as 'Berhasil' | 'Gagal') : undefined,
        ip: draft.ip.trim() || undefined,
        gagalBeruntun: draft.beruntun,
        page: 1,
      }
    : query;
  const preview = useQuery({
    queryKey: ['access-log', previewQuery],
    queryFn: () => services.logs.accessLog(previewQuery),
  });
  // "Hapus filter" hanya tampil bila ada filter selain halaman/entri yang dibuka.
  const filtered = [...params.keys()].some((k) => !['hal', 'entri', 'tab'].includes(k));
  const columns: ColumnDef<AccessLogEntry, unknown>[] = [
    {
      id: 'w',
      header: c.log.kolom.waktu,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatTanggalJam(row.original.waktu)}
          {row.original.arsip && <ArchiveTag />}
        </span>
      ),
    },
    {
      id: 'p',
      header: c.log.kolom.pengguna,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={(e) => (e.stopPropagation(), set({ entri: row.original.id }))}
          className="text-left text-body-strong text-ink hover:underline"
        >
          {row.original.pengguna}
          {row.original.email && row.original.email !== row.original.pengguna && (
            <span className="block text-caption font-normal text-ink-muted">
              {row.original.email}
            </span>
          )}
        </button>
      ),
    },
    {
      id: 'o',
      header: c.log.kolom.organisasi,
      cell: ({ row }) => <span className="text-ink">{row.original.organisasi?.nama ?? '—'}</span>,
    },
    {
      id: 'e',
      header: c.log.kolom.peristiwa,
      cell: ({ row }) => (
        <span>
          {row.original.peristiwa}
          {row.original.alasan && (
            <span className="block text-caption text-ink-muted">{row.original.alasan}</span>
          )}
        </span>
      ),
    },
    {
      id: 'h',
      header: c.log.kolom.hasil,
      cell: ({ row }) => (
        <ResultTag ok={row.original.hasil === 'Berhasil'}>{row.original.hasil}</ResultTag>
      ),
    },
    {
      id: 's',
      header: c.log.kolom.sumber,
      cell: ({ row }) => (
        <span className="font-mono text-caption text-ink-muted">{row.original.ip ?? '—'}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <TableCard
        title={c.log.tabel}
        tools={
          <>
            <TableSearch
              label={c.log.pengguna}
              placeholder={c.log.penggunaPlaceholder}
              value={query.pengguna ?? ''}
              onChange={(e) => set({ pengguna: e.target.value })}
            />
            <FilterPanel<LogDraft>
              variant="panel"
              value={current}
              emptyValue={{
                dari: DEFAULT_PERIOD.dari(),
                sampai: DEFAULT_PERIOD.sampai(),
                organisasi: SEMUA,
                jenis: SEMUA,
                hasil: SEMUA,
                ip: '',
                beruntun: false,
              }}
              activeCount={applied.length}
              onApply={(d) =>
                set({
                  dari: isDefaultPeriod(d.dari, d.sampai) ? undefined : d.dari,
                  sampai: isDefaultPeriod(d.dari, d.sampai) ? undefined : d.sampai,
                  organisasi: d.organisasi,
                  jenis: d.jenis,
                  hasil: d.hasil,
                  ip: d.ip.trim() || undefined,
                  beruntun: d.beruntun ? '1' : undefined,
                })
              }
              onDraftChange={setDraft}
              applyLabel={() =>
                preview.data
                  ? t.filter.terapkanJumlah(preview.data.total, c.log.entitas)
                  : t.filter.terapkan
              }
              labels={t.filter}
            >
              {(d, setD) => (
                <>
                  <FilterGroup legend={c.periode}>
                    <PeriodFields
                      inPanel
                      dari={d.dari}
                      sampai={d.sampai}
                      onChange={(v) => setD({ ...d, ...v })}
                    />
                  </FilterGroup>
                  {!isPicOnly && (
                    <FilterGroup legend={c.log.organisasi}>
                      <Select
                        label={c.log.organisasi}
                        hideLabel
                        value={d.organisasi}
                        onValueChange={(v) => setD({ ...d, organisasi: v })}
                        options={[{ value: SEMUA, label: c.semuaOrganisasi }, ...orgs]}
                      />
                    </FilterGroup>
                  )}
                  <FilterGroup legend={c.log.jenis}>
                    <Select
                      label={c.log.jenis}
                      hideLabel
                      value={d.jenis}
                      onValueChange={(v) => setD({ ...d, jenis: v })}
                      options={[
                        { value: SEMUA, label: c.semua },
                        ...ACCESS_GROUPS.map((g) => ({ value: g, label: g })),
                      ]}
                    />
                  </FilterGroup>
                  <FilterGroup legend={c.hasil}>
                    <ChipGroup
                      label={c.hasil}
                      value={d.hasil}
                      onChange={(v) => setD({ ...d, hasil: v })}
                      options={[
                        { value: SEMUA, label: c.semua },
                        { value: 'Berhasil', label: c.log.berhasil },
                        { value: 'Gagal', label: c.log.gagal },
                      ]}
                    />
                  </FilterGroup>
                  <FilterGroup legend={c.log.ip}>
                    <TextField
                      label={c.log.ip}
                      hideLabel
                      value={d.ip}
                      onChange={(e) => setD({ ...d, ip: e.target.value })}
                      className="font-mono"
                    />
                  </FilterGroup>
                  <FilterGroup legend={c.log.kondisi}>
                    <Checkbox
                      label={c.log.gagalBeruntun}
                      checked={d.beruntun}
                      onChange={() => setD({ ...d, beruntun: !d.beruntun })}
                    />
                    <p className="pl-6 text-caption text-ink-muted">
                      {c.log.gagalBeruntunAktif(FAILED_STREAK_THRESHOLD)}
                    </p>
                  </FilterGroup>
                </>
              )}
            </FilterPanel>
            {isR03 && <ExportAccessLogButton />}
          </>
        }
        applied={
          <AppliedFilters
            filters={applied}
            onClear={() => setParams(new URLSearchParams(), { replace: true })}
            labels={t.filter}
          />
        }
        before={
          query.gagalBeruntun ? (
            <p className="px-4 pb-3 text-caption text-ink-muted">
              {c.log.gagalBeruntunAktif(FAILED_STREAK_THRESHOLD)}
            </p>
          ) : undefined
        }
        footer={
          list.data && (
            <Pagination
              page={list.data.page}
              pageSize={list.data.pageSize}
              total={list.data.total}
              onPageChange={(p) => set({ hal: String(p), entri: undefined })}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(n) => set({ [PAGE_SIZE_PARAM]: String(n), entri: undefined })}
              labels={c.halaman}
            />
          )
        }
      >
        <DataTable
          caption={c.log.tabel}
          columns={columns}
          data={list.data?.items ?? []}
          getRowId={(e) => e.id}
          loading={list.isPending}
          loadingContent={<p className="px-4 pb-4 text-body text-ink-muted">{c.memuat}</p>}
          error={list.isError ? c.gagal : undefined}
          onRowClick={(e) => set({ entri: e.id })}
          selectedRowId={entryId ?? undefined}
          empty={
            <EmptyState
              illustration={filtered ? 'filter-kosong' : 'kosong'}
              illustrationSize="sm"
              title={c.log.kosong}
              action={
                filtered ? (
                  <Button onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                    {c.reset}
                  </Button>
                ) : undefined
              }
            />
          }
        />
      </TableCard>
      {entryId && (
        <EntryPanel
          id={entryId}
          onClose={() => set({ entri: undefined })}
          onSession={(sid) => set({ sesi: sid, entri: undefined, dari: wibDay(-365) })}
        />
      )}
    </div>
  );
}

function ActiveSessionsTab() {
  const qc = useQueryClient();
  const toast = useToast();
  const list = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: () => services.logs.activeSessions(),
  });
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
    {
      id: 'p',
      header: k.pengguna,
      cell: ({ row }) => (
        <span className="text-body-strong">
          {row.original.nama}
          <span className="block text-caption font-normal text-ink-muted">
            {row.original.email}
          </span>
        </span>
      ),
    },
    {
      id: 'o',
      header: k.organisasi,
      cell: ({ row }) => <span className="text-ink">{row.original.organisasi.nama}</span>,
    },
    {
      id: 'd',
      header: k.perangkat,
      cell: ({ row }) => `${row.original.browser} · ${row.original.sistemOperasi}`,
    },
    { id: 'l', header: k.lokasi, accessorKey: 'perkiraanLokasi' },
    {
      id: 'm',
      header: k.masuk,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{formatTanggalJam(row.original.waktuMasuk)}</span>
      ),
    },
    {
      id: 'a',
      header: k.aktivitas,
      cell: ({ row }) => formatRelatif(row.original.aktivitasTerakhir),
    },
    {
      id: 'x',
      header: () => <span className="sr-only">{k.aksi}</span>,
      cell: ({ row }) => (
        <Button
          variant="link-danger"
          onClick={() => (setReason({ alasan: '' }), setTarget(row.original))}
        >
          {c.sesi.cabut}
        </Button>
      ),
      meta: { align: 'right' },
    },
  ];
  return (
    <TableCard title={c.sesi.tabel}>
      <DataTable
        caption={c.sesi.tabel}
        columns={columns}
        data={list.data ?? []}
        getRowId={(s) => s.id}
        loading={list.isPending}
        loadingContent={<p className="px-4 pb-4 text-body text-ink-muted">{c.memuat}</p>}
        error={list.isError ? c.gagal : undefined}
        empty={<EmptyState illustration="kosong" title={c.sesi.kosong} />}
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
          <ReasonField
            label={usersCopy.sesi.alasan}
            placeholder={usersCopy.sesi.alasanPlaceholder}
            options={REVOKE_REASONS}
            value={reason}
            onChange={setReason}
          />
        </ConfirmDialog>
      )}
    </TableCard>
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
