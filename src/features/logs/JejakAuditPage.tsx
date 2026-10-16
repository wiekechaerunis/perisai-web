/**
 * Jejak Audit (M-22) — PRD tab 70911a9e-e9ed, ClickUp z8pmx9n8pe. "Design belum ada" → pola Manajemen Pengguna (PR-11).
 * FR-JA-11 (R-02/R-03 semua, R-04 organisasinya), FR-JA-12 (dibuka kosong dengan filter, default 7 hari), FR-JA-13
 * (filter, "(Nonaktif)"), FR-JA-14 (detail nilai sebelum/sesudah), FR-JA-15 (kelompok id korelasi), FR-JA-16 (paginasi
 * server), FR-JA-17 (tautan dari profil: ?objek=), FR-JA-18/19 (ekspor CSV R-03, tercatat), FR-JA-21..25 (retensi).
 * FR-JA-20 (ekspor besar di latar belakang) belum dibangun — data mock kecil.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PAGE_SIZE_OPTIONS, PAGE_SIZE_PARAM, parsePageSize } from '@/lib/page-size';
import type { ColumnDef } from '@tanstack/react-table';
import { Download } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/patterns/DataTable';
import { Dialog } from '@/components/patterns/Dialog';
import { EmptyState } from '@/components/patterns/EmptyState';
import { KeyValueList } from '@/components/patterns/KeyValueList';
import { Pagination } from '@/components/patterns/Pagination';
import { SidePanel } from '@/components/patterns/SidePanel';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { formatTanggalJam } from '@/lib/format';
import { ACTIONS, ACTION_LABEL, MODULES, MODULE_IDS, type Action, type ModuleId } from '@/lib/rbac';
import { isServiceError, services, type AuditEntry, type AuditQuery } from '@/services';
import { useSession } from '../session/SessionProvider';
import { logsCopy as c } from './copy';
import { useOrganisasiFilter } from './hooks';
import {
  ArchiveTag,
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
import { TableCard } from '@/components/patterns/TableCard';
import { t } from '@/lib/i18n/id';

const SEMUA = 'semua';
type AuditDraft = Omit<AuditQuery, 'page' | 'pageSize'>;
const a = c.audit;

function Diff({ e }: { e: AuditEntry }) {
  const keys = [...new Set([...Object.keys(e.sebelum ?? {}), ...Object.keys(e.sesudah ?? {})])];
  if (!keys.length) return <p className="text-body text-ink-muted">{a.detail.tanpaPerubahan}</p>;
  return (
    <table className="w-full border-collapse text-left text-body">
      <caption className="sr-only">{a.detail.perubahan}</caption>
      <thead>
        <tr className="border-b border-border text-label text-ink-muted">
          <th scope="col" className="py-2 pr-3">
            {a.detail.field}
          </th>
          <th scope="col" className="py-2 pr-3">
            {a.detail.sebelum}
          </th>
          <th scope="col" className="py-2">
            {a.detail.sesudah}
          </th>
        </tr>
      </thead>
      <tbody>
        {keys.map((k) => (
          <tr key={k} className="border-b border-border-subtle last:border-b-0 align-top">
            <th scope="row" className="py-2 pr-3 font-normal text-ink-muted">
              {k}
            </th>
            <td className="py-2 pr-3 text-ink">{e.sebelum?.[k] ?? '—'}</td>
            <td className="py-2 font-medium text-ink">{e.sesudah?.[k] ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EntryPanel({
  id,
  onClose,
  onGroup,
}: {
  id: string;
  onClose: () => void;
  onGroup: (k: string) => void;
}) {
  const q = useQuery({
    queryKey: ['audit-entry', id],
    queryFn: () => services.logs.auditEntry(id),
    retry: false,
  });
  const e = q.data;
  const group = useQuery({
    queryKey: ['audit-group', e?.korelasi],
    queryFn: () =>
      services.logs.audit({
        dari: '2000-01-01',
        sampai: wibDay(0),
        korelasi: e!.korelasi,
        page: 1,
        pageSize: 100,
      }),
    enabled: !!e,
  });
  const d = a.detail;
  return (
    <SidePanel
      open
      onOpenChange={(o) => !o && onClose()}
      title={e ? `${ACTION_LABEL[e.aksi]} · ${e.objek}` : c.memuat}
      titleAside={e && <ResultTag ok={e.hasil === 'Berhasil'}>{e.hasil}</ResultTag>}
      subtitle={e ? formatTanggalJam(e.waktu) : undefined}
      closeLabel={c.tutupPanel}
    >
      {e && (
        <>
          <KeyValueList
            items={[
              { key: 'w', label: d.waktu, value: formatTanggalJam(e.waktu) },
              { key: 'p', label: d.pelaku, value: e.pelaku },
              { key: 'r', label: d.role, value: e.pelakuRole ?? '—' },
              { key: 'op', label: d.orgPelaku, value: e.pelakuOrganisasi ?? '—' },
              { key: 'm', label: d.modul, value: `${e.modul} ${MODULES[e.modul].name}` },
              { key: 'a', label: d.aksi, value: `${ACTION_LABEL[e.aksi]} (${e.aksi})` },
              { key: 'o', label: d.objek, value: e.objek, mono: true },
              { key: 'oo', label: d.orgObjek, value: e.organisasiObjek ?? '—' },
              { key: 'al', label: d.alasan, value: e.alasan ?? '—' },
              { key: 'h', label: d.hasil, value: e.hasil },
              {
                key: 's',
                label: d.sumber,
                value: (
                  <span className="break-all">
                    {e.ip} · {e.userAgent}
                  </span>
                ),
              },
              { key: 'k', label: d.korelasi, value: e.korelasi, mono: true },
            ]}
          />
          {e.arsip && <p className="text-caption text-ink-muted">{c.arsipKeterangan}</p>}
          <section className="flex flex-col gap-3">
            <h3 className="text-body-strong text-ink">{d.perubahan}</h3>
            <Diff e={e} />
          </section>
          {group.data && group.data.total > 1 && (
            <section className="flex flex-col gap-2 rounded-md bg-surface-sunken p-4">
              <h3 className="text-body-strong text-ink">{d.kelompokJudul}</h3>
              <div>
                <Button onClick={() => onGroup(e.korelasi)}>
                  {d.lihatKelompok(group.data.total)}
                </Button>
              </div>
            </section>
          )}
          {e.pelaku !== 'Sistem' && (
            <Link
              to={`/log-akses?pengguna=${encodeURIComponent(e.pelaku)}`}
              className="self-start text-body text-ink font-semibold underline-offset-[3px] hover:underline"
            >
              {d.logPelaku}
            </Link>
          )}
        </>
      )}
    </SidePanel>
  );
}

function RetentionDialog({
  open,
  onOpenChange,
  canEdit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  canEdit: boolean;
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const r = useQuery({
    queryKey: ['retention'],
    queryFn: () => services.logs.retention(),
    enabled: open,
  });
  const [aktif, setAktif] = useState('12');
  const [total, setTotal] = useState('5');
  const [err, setErr] = useState<string>();
  useEffect(() => {
    if (r.data) {
      setAktif(String(r.data.aktifBulan));
      setTotal(String(r.data.totalTahun));
    }
  }, [r.data, open]);
  const save = useMutation({
    mutationFn: () =>
      services.logs.setRetention({ aktifBulan: Number(aktif), totalTahun: Number(total) }),
    onSuccess: () => {
      toast.show({ title: a.retensi.sukses });
      void qc.invalidateQueries({ queryKey: ['retention'] });
      onOpenChange(false);
    },
    onError: (e) => setErr(isServiceError(e, 'VALIDATION') ? a.retensi.tidakValid : c.gagal),
  });
  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setErr(undefined);
    if (Number(total) * 12 < Number(aktif)) return setErr(a.retensi.tidakValid);
    save.mutate();
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !save.isPending && onOpenChange(o)}
      title={a.retensi.judul}
      description={a.retensi.keterangan}
      closeLabel={a.retensi.batal}
      footerNote={
        r.data?.diubahOleh && r.data.diubah
          ? a.retensi.terakhir(r.data.diubahOleh, formatTanggalJam(r.data.diubah))
          : undefined
      }
      footer={
        canEdit ? (
          <>
            <Button onClick={() => onOpenChange(false)} disabled={save.isPending}>
              {a.retensi.batal}
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="form-retensi"
              loading={save.isPending}
              loadingLabel={a.retensi.menyimpan}
            >
              {a.retensi.simpan}
            </Button>
          </>
        ) : undefined
      }
    >
      <form id="form-retensi" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <fieldset disabled={!canEdit} className="flex flex-col gap-4">
          <TextField
            label={a.retensi.aktif}
            type="number"
            min={1}
            value={aktif}
            onChange={(e) => setAktif(e.target.value)}
            hint={a.retensi.aktifHint}
            className="font-mono"
          />
          <TextField
            label={a.retensi.total}
            type="number"
            min={1}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            hint={a.retensi.totalHint}
            error={err}
            className="font-mono"
          />
        </fieldset>
      </form>
    </Dialog>
  );
}

const emptyQuery = (): Omit<AuditQuery, 'page' | 'pageSize'> => ({
  dari: wibDay(-7),
  sampai: wibDay(0),
});

export function JejakAuditPage() {
  const { session } = useSession();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const isR03 = !!session?.user.roles.includes('R-03');
  const isPicOnly = !!session && !session.user.roles.some((r) => r === 'R-02' || r === 'R-03');
  const orgs = useOrganisasiFilter(!isPicOnly);
  const [retensi, setRetensi] = useState(false);

  // Filter yang sedang disusun (belum diterapkan) vs filter yang diterapkan (di URL). FR-JA-12: halaman dibuka kosong.
  const applied = params.get('terapkan') === '1' || params.has('objek') || params.has('korelasi');
  const fromUrl = useMemo(
    (): Omit<AuditQuery, 'page' | 'pageSize'> => ({
      ...emptyQuery(),
      dari: params.get('dari') ?? wibDay(-7),
      sampai: params.get('sampai') ?? wibDay(0),
      organisasiId: params.get('organisasi') ?? undefined,
      modul: (params.get('modul') as ModuleId | null) ?? undefined,
      aksi: (params.get('aksi') as Action | null) ?? undefined,
      pelaku: params.get('pelaku') ?? undefined,
      objek: params.get('objek') ?? undefined,
      hasil: (params.get('hasil') as 'Berhasil' | 'Ditolak' | null) ?? undefined,
      korelasi: params.get('korelasi') ?? undefined,
    }),
    [params],
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const page = Number(params.get('hal') ?? 1);
  const query: AuditQuery = {
    ...fromUrl,
    page,
    pageSize: parsePageSize(params.get(PAGE_SIZE_PARAM)),
  };
  const list = useQuery({
    queryKey: ['audit', query],
    queryFn: () => services.logs.audit(query),
    enabled: applied,
  });
  const exp = useMutation({
    mutationFn: () => services.logs.exportAudit({ ...query, page: 1, pageSize: 100_000 }),
    onSuccess: (csv) => {
      downloadCsv(`jejak-audit-${query.dari}-${query.sampai}.csv`, csv);
      toast.show({ title: c.eksporSukses(csv.split('\n').length - 1) });
    },
  });

  function apply(q: AuditDraft) {
    const next = new URLSearchParams();
    next.set('terapkan', '1');
    for (const [k, v] of Object.entries({
      dari: q.dari,
      sampai: q.sampai,
      organisasi: q.organisasiId,
      modul: q.modul,
      aksi: q.aksi,
      pelaku: q.pelaku,
      objek: q.objek,
      hasil: q.hasil,
      korelasi: q.korelasi,
    })) {
      if (v) next.set(k, v);
    }
    setParams(next, { replace: true });
  }
  const setParam = (k: string, v?: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };
  const entryId = params.get('entri');
  const clearAll = () => setParams(new URLSearchParams(), { replace: true });
  // Pil = filter tambahan yang sudah diterapkan (bukan draf); menghapus pil langsung menerapkan ulang tanpa filter itu.
  const drop = (patch: Partial<typeof fromUrl>) => apply({ ...fromUrl, ...patch });
  const activeFilters = (
    applied
      ? [
          !isDefaultPeriod(fromUrl.dari, fromUrl.sampai) &&
            !fromUrl.korelasi && {
              key: 'periode',
              label: c.periode,
              value: formatRentang(fromUrl.dari, fromUrl.sampai),
              onRemove: () => drop({ dari: wibDay(-7), sampai: wibDay(0) }),
            },
          fromUrl.pelaku && {
            key: 'pelaku',
            label: a.pelaku,
            value: fromUrl.pelaku,
            onRemove: () => drop({ pelaku: undefined }),
          },
          fromUrl.objek && {
            key: 'objek',
            label: a.objek,
            value: fromUrl.objek,
            onRemove: () => drop({ objek: undefined }),
          },
          fromUrl.organisasiId && {
            key: 'organisasi',
            label: a.organisasi,
            value:
              orgs.find((o) => o.value === fromUrl.organisasiId)?.label ?? fromUrl.organisasiId,
            onRemove: () => drop({ organisasiId: undefined }),
          },
          fromUrl.modul && {
            key: 'modul',
            label: a.modul,
            value: `${fromUrl.modul} ${MODULES[fromUrl.modul].name}`,
            onRemove: () => drop({ modul: undefined }),
          },
          fromUrl.aksi && {
            key: 'aksi',
            label: a.aksi,
            value: ACTION_LABEL[fromUrl.aksi],
            onRemove: () => drop({ aksi: undefined }),
          },
          fromUrl.hasil && {
            key: 'hasil',
            label: c.hasil,
            value: fromUrl.hasil,
            onRemove: () => drop({ hasil: undefined }),
          },
          fromUrl.korelasi && {
            key: 'korelasi',
            label: a.korelasi,
            value: fromUrl.korelasi,
            onRemove: () => drop({ korelasi: undefined, dari: wibDay(-7) }),
          },
        ]
      : []
  ).filter(Boolean) as AppliedFilter[];

  const columns: ColumnDef<AuditEntry, unknown>[] = [
    {
      id: 'w',
      header: a.kolom.waktu,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatTanggalJam(row.original.waktu)}
          {row.original.arsip && <ArchiveTag />}
        </span>
      ),
    },
    {
      id: 'p',
      header: a.kolom.pelaku,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={(ev) => (ev.stopPropagation(), setParam('entri', row.original.id))}
          className="text-left text-body-strong text-ink hover:underline"
        >
          {row.original.pelaku}
          {row.original.pelakuOrganisasi && (
            <span className="block text-caption font-normal text-ink-muted">
              {row.original.pelakuOrganisasi}
            </span>
          )}
        </button>
      ),
    },
    {
      id: 'm',
      header: a.kolom.modul,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {row.original.modul} {MODULES[row.original.modul].name}
        </span>
      ),
    },
    { id: 'a', header: a.kolom.aksi, cell: ({ row }) => ACTION_LABEL[row.original.aksi] },
    {
      id: 'o',
      header: a.kolom.objek,
      cell: ({ row }) => <span className="font-mono text-caption">{row.original.objek}</span>,
    },
    {
      id: 'h',
      header: a.kolom.hasil,
      cell: ({ row }) => (
        <ResultTag ok={row.original.hasil === 'Berhasil'}>{row.original.hasil}</ResultTag>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={a.judul}
        summary={a.ringkasan}
        // Pengaturan retensi = aksi halaman (sekunder). Ekspor = aksi milik tabel → tombol ikon di toolbar (DS v2 DataTable).
        actions={<Button onClick={() => setRetensi(true)}>{a.retensi.tombol}</Button>}
      />
      <PageBody>
        <TableCard
          title={a.tabel}
          tools={
            <>
              {/* FR-JA-12: filter disusun di panel lalu diterapkan dengan tombol "Tampilkan" (pengecualian FilterPanel DS v2). */}
              <FilterPanel<AuditDraft>
                variant="panel"
                open={panelOpen}
                onOpenChange={setPanelOpen}
                value={fromUrl}
                emptyValue={emptyQuery()}
                activeCount={activeFilters.length}
                onApply={(q) => apply(q)}
                applyLabel={() => c.terapkan}
                labels={t.filter}
              >
                {(d, setD) => (
                  <>
                    <FilterGroup legend={a.pelaku}>
                      <TextField
                        label={a.pelaku}
                        hideLabel
                        placeholder={a.pelakuPlaceholder}
                        value={d.pelaku ?? ''}
                        onChange={(e) => setD({ ...d, pelaku: e.target.value || undefined })}
                      />
                    </FilterGroup>
                    <FilterGroup legend={c.periode}>
                      <PeriodFields
                        inPanel
                        dari={d.dari}
                        sampai={d.sampai}
                        onChange={(v) => setD({ ...d, ...v, korelasi: undefined })}
                      />
                    </FilterGroup>
                    <FilterGroup legend={a.objek}>
                      <TextField
                        label={a.objek}
                        hideLabel
                        placeholder={a.objekPlaceholder}
                        value={d.objek ?? ''}
                        onChange={(e) => setD({ ...d, objek: e.target.value || undefined })}
                      />
                    </FilterGroup>
                    {!isPicOnly && (
                      <FilterGroup legend={a.organisasi}>
                        <Select
                          label={a.organisasi}
                          hideLabel
                          value={d.organisasiId ?? SEMUA}
                          onValueChange={(v) =>
                            setD({ ...d, organisasiId: v === SEMUA ? undefined : v })
                          }
                          options={[{ value: SEMUA, label: c.semuaOrganisasi }, ...orgs]}
                        />
                      </FilterGroup>
                    )}
                    <FilterGroup legend={a.modul}>
                      <Select
                        label={a.modul}
                        hideLabel
                        value={d.modul ?? SEMUA}
                        onValueChange={(v) =>
                          setD({ ...d, modul: v === SEMUA ? undefined : (v as ModuleId) })
                        }
                        options={[
                          { value: SEMUA, label: a.semuaModul },
                          ...MODULE_IDS.map((m) => ({
                            value: m,
                            label: `${m} ${MODULES[m].name}`,
                          })),
                        ]}
                      />
                    </FilterGroup>
                    <FilterGroup legend={a.aksi}>
                      <Select
                        label={a.aksi}
                        hideLabel
                        value={d.aksi ?? SEMUA}
                        onValueChange={(v) =>
                          setD({ ...d, aksi: v === SEMUA ? undefined : (v as Action) })
                        }
                        options={[
                          { value: SEMUA, label: a.semuaAksi },
                          ...ACTIONS.map((x) => ({ value: x, label: ACTION_LABEL[x] })),
                        ]}
                      />
                    </FilterGroup>
                    <FilterGroup legend={c.hasil}>
                      <ChipGroup
                        label={c.hasil}
                        value={d.hasil ?? SEMUA}
                        onChange={(v) =>
                          setD({
                            ...d,
                            hasil: v === SEMUA ? undefined : (v as 'Berhasil' | 'Ditolak'),
                          })
                        }
                        options={[
                          { value: SEMUA, label: c.semua },
                          { value: 'Berhasil', label: a.berhasil },
                          { value: 'Ditolak', label: a.ditolak },
                        ]}
                      />
                    </FilterGroup>
                  </>
                )}
              </FilterPanel>
              {applied && isR03 && (
                <IconButton
                  label={a.eksporLabel}
                  icon={<Download strokeWidth={2} />}
                  onClick={() => exp.mutate()}
                  loading={exp.isPending}
                />
              )}
            </>
          }
          applied={
            applied ? (
              <AppliedFilters filters={activeFilters} onClear={clearAll} labels={t.filter} />
            ) : undefined
          }
          footer={
            applied && list.data ? (
              <Pagination
                page={list.data.page}
                pageSize={list.data.pageSize}
                total={list.data.total}
                onPageChange={(p) => setParam('hal', String(p))}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageSizeChange={(n) => {
                  const next = new URLSearchParams(params);
                  next.set(PAGE_SIZE_PARAM, String(n));
                  next.delete('hal');
                  setParams(next, { replace: true });
                }}
                labels={c.halaman}
              />
            ) : undefined
          }
        >
          {!applied ? (
            <EmptyState
              illustration="filter-kosong"
              title={a.awalJudul}
              description={a.awalIsi}
              action={<Button onClick={() => setPanelOpen(true)}>{a.pilihFilter}</Button>}
            />
          ) : (
            <DataTable
              caption={a.tabel}
              columns={columns}
              data={list.data?.items ?? []}
              getRowId={(e) => e.id}
              loading={list.isPending}
              loadingContent={<p className="px-4 pb-4 text-body text-ink-muted">{c.memuat}</p>}
              error={list.isError ? c.gagal : undefined}
              onRowClick={(e) => setParam('entri', e.id)}
              selectedRowId={entryId ?? undefined}
              empty={
                <EmptyState
                  illustration="filter-kosong"
                  illustrationSize="sm"
                  title={a.kosong}
                  action={<Button onClick={clearAll}>{c.reset}</Button>}
                />
              }
            />
          )}
        </TableCard>
      </PageBody>
      {entryId && (
        <EntryPanel
          id={entryId}
          onClose={() => setParam('entri')}
          onGroup={(k) => apply({ ...emptyQuery(), dari: '2000-01-01', korelasi: k })}
        />
      )}
      <RetentionDialog open={retensi} onOpenChange={setRetensi} canEdit={isR03} />
    </>
  );
}
