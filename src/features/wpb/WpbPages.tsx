/**
 * Anggaran Pengamanan (WP&B, M-06) — PRD Garis Besar tab 07 (OPS-01..04, OPS-12; PLT-03), alur demo 3 kick-off.
 * Pelapor KKKS mengisi realisasi bulanan per kategori (atau unggah template) → kategori dengan deviasi > 10% wajib
 * dijelaskan (BR-WPB-04) → Pejabat Berwenang KKKS memfinalisasi → sistem menyusun draf berita acara → status
 * "Menunggu Dokumen Bertanda Tangan" → Pengawas SKK mengunggah PDF bertanda tangan → "Final" (BR-DOK-04).
 * SKK Migas tidak punya aksi persetujuan (KD-01); satu-satunya aksi tulisnya = unggah dokumen bertanda tangan.
 * ASSUMPTION: kategori anggaran contoh (Q-37); pencocokan angka dokumen selalu lolos di prototype.
 */
import { useMutation } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { FileText, FileUp, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { Callout } from '@/components/patterns/Callout';
import { DataTable } from '@/components/patterns/DataTable';
import { Dialog } from '@/components/patterns/Dialog';
import { KeyValueList } from '@/components/patterns/KeyValueList';
import { MetricStrip } from '@/components/patterns/MetricStrip';
import { ProcessPath } from '@/components/patterns/ProcessPath';
import { ThresholdBar } from '@/components/patterns/ThresholdBar';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Textarea } from '@/components/ui/Textarea';
import { WorkflowStatus } from '@/components/ui/WorkflowStatus';
import { cn } from '@/lib/cn';
import { formatRupiah, formatTanggalJam } from '@/lib/format';
import { WPB_STEPS, WPB_TONE, wpbStepIndex } from '@/lib/ops-status';
import { services, WPB_DEVIATION_THRESHOLD, type WpbLine, type WpbPeriod, type WpbSummary } from '@/services';
import { namaPeriode, rupiahRingkas, useInvalidateOps, useWpb, useWpbList, useWpbSummary, persen } from '../ops/hooks';
import { useSession } from '../session/SessionProvider';

const deviasi = (l: Pick<WpbLine, 'rencana' | 'realisasi'>) => (l.realisasi === null || !l.rencana ? 0 : l.realisasi / l.rencana - 1);
const lewatAmbang = (l: Pick<WpbLine, 'rencana' | 'realisasi'>) => Math.abs(deviasi(l)) > WPB_DEVIATION_THRESHOLD;
const signPct = (d: number) => `${d >= 0 ? '+' : '−'}${persen(Math.abs(d))}`;

function BudgetDashboard({ s }: { s: WpbSummary }) {
  const util = s.rencanaSampaiKini ? s.realisasiSampaiKini / s.rencanaSampaiKini : 0;
  const lewat = s.rows.filter((r) => Math.abs(r.deviasi) > WPB_DEVIATION_THRESHOLD);
  return (
    <Section className="border border-border" title={`${s.orgNama} · ${s.tahun}`} description="Anggaran disepakati vs realisasi s.d. periode terakhir yang diajukan.">
      <div className="flex flex-col gap-5">
        <MetricStrip
          metrics={[
            { key: 'sepakat', label: 'Nilai disepakati 2026', value: rupiahRingkas(s.disepakatiTahunan), context: 'Hasil pembahasan, dicatat KKKS' },
            { key: 'rencana', label: 'Rencana s.d. periode ini', value: rupiahRingkas(s.rencanaSampaiKini), context: `${persen(s.rencanaSampaiKini / s.disepakatiTahunan)} dari nilai disepakati` },
            { key: 'real', label: 'Realisasi', value: rupiahRingkas(s.realisasiSampaiKini), context: `Utilisasi ${persen(util)} terhadap rencana`, bad: Math.abs(util - 1) > WPB_DEVIATION_THRESHOLD },
            { key: 'sisa', label: 'Sisa anggaran tahun ini', value: rupiahRingkas(s.disepakatiTahunan - s.realisasiSampaiKini) },
            { key: 'dev', label: 'Kategori menyimpang > 10%', value: lewat.length, context: lewat.length ? lewat.map((r) => r.kategori).join(', ') : 'Semua dalam ambang', bad: lewat.length > 0 },
          ]}
        />
        <ThresholdBar
          legend="Persentase realisasi terhadap rencana per kategori. Garis tipis = 100% rencana. Batang berwarna = deviasi lebih dari 10%."
          threshold={100}
          max={130}
          rows={[...s.rows]
            .sort((a, b) => Math.abs(a.deviasi) - Math.abs(b.deviasi))
            .map((r) => ({
              key: r.kategori,
              label: r.kategori,
              value: (1 + r.deviasi) * 100,
              valueLabel: `${persen(1 + r.deviasi)} · ${rupiahRingkas(r.realisasi)}`,
              abnormal: Math.abs(r.deviasi) > WPB_DEVIATION_THRESHOLD,
            }))}
        />
      </div>
    </Section>
  );
}

export function WpbPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const sum = useWpbSummary();
  const list = useWpbList();
  const skk = !!session?.user.roles.some((r) => r === 'R-01' || r === 'R-02' || r === 'R-03');
  const total = (p: WpbPeriod) => p.lines.reduce((s, l) => s + (l.realisasi ?? 0), 0);
  const columns: ColumnDef<WpbPeriod, unknown>[] = [
    { id: 'periode', header: 'Periode', cell: ({ row }) => <span className="font-medium text-ink">{namaPeriode(row.original)}</span> },
    ...(skk ? [{ id: 'org', header: 'KKKS', cell: ({ row }: { row: { original: WpbPeriod } }) => <span className="text-ink-muted">{row.original.orgNama}</span> }] : []),
    { id: 'rencana', header: 'Rencana', meta: { align: 'right', mono: true }, cell: ({ row }) => rupiahRingkas(row.original.lines.reduce((s, l) => s + l.rencana, 0)) },
    { id: 'real', header: 'Realisasi', meta: { align: 'right', mono: true }, cell: ({ row }) => (row.original.status === 'Draft' ? '—' : rupiahRingkas(total(row.original))) },
    {
      id: 'dev',
      header: 'Deviasi > 10%',
      cell: ({ row }) => {
        const n = row.original.lines.filter(lewatAmbang).length;
        return row.original.status === 'Draft' ? <span className="text-ink-subtle">—</span> : <span className={n ? 'font-semibold text-caution-ink' : 'text-ink-muted'}>{n ? `${n} kategori` : 'Tidak ada'}</span>;
      },
    },
    { id: 'status', header: 'Status', cell: ({ row }) => <WorkflowStatus label={row.original.status} tone={WPB_TONE[row.original.status]} /> },
  ];
  return (
    <>
      <PageHeader title="Anggaran pengamanan (WP&B)" summary="Realisasi bulanan per kategori terhadap nilai disepakati. Deviasi di atas 10% wajib dijelaskan." />
      <PageBody>
        {sum.isPending ? <p className="text-body-dense text-ink-muted">Memuat…</p> : (sum.data ?? []).map((s) => <BudgetDashboard key={s.orgId} s={s} />)}
        <Section className="border border-border" title="Realisasi bulanan">
          <DataTable caption="Realisasi bulanan" columns={columns} data={list.data ?? []} getRowId={(p) => p.id} loading={list.isPending} onRowClick={(p) => navigate(`/wpb/${p.id}`)} />
        </Section>
      </PageBody>
    </>
  );
}

/** Contoh isi template realisasi (simulasi unggah): satu kategori sengaja di atas ambang agar aturan 10% terlihat. */
function templateLines(lines: WpbLine[]): WpbLine[] {
  const f = [0.97, 1.04, 1.18, 0.92, 1.01];
  return lines.map((l, i) => ({ ...l, realisasi: Math.round((l.rencana * (f[i] ?? 1)) / 1_000_000) * 1_000_000, penjelasan: undefined }));
}

export function WpbDetailPage() {
  const { id } = useParams();
  const { session } = useSession();
  const q = useWpb(id);
  const invalidate = useInvalidateOps();
  const toast = useToast();
  const [lines, setLines] = useState<WpbLine[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [dialog, setDialog] = useState<'kembalikan' | 'ba' | null>(null);
  const [alasan, setAlasan] = useState('');
  const [file, setFile] = useState('');
  const p = q.data;
  useEffect(() => {
    if (p) setLines(p.lines);
  }, [p]);
  const act = useMutation({
    mutationFn: (fn: () => Promise<WpbPeriod>) => fn(),
    onSuccess: () => {
      invalidate();
      setDialog(null);
    },
  });
  const back = { to: '/wpb', label: 'Kembali ke Anggaran pengamanan' };
  if (!p) {
    return (
      <>
        <PageHeader title={q.isError ? 'Periode tidak ditemukan' : 'Memuat…'} breadcrumbs={[{ label: 'Anggaran pengamanan', to: '/wpb' }, { label: '…' }]} back={back} />
        <PageBody>
          <p className="text-body-dense text-ink-muted">{q.isError ? 'Periode ini tidak ada atau di luar cakupan Anda.' : 'Memuat…'}</p>
        </PageBody>
      </>
    );
  }
  const roles = session?.user.roles ?? [];
  const ownOrg = session?.user.organisasi.id === p.orgId;
  const editable = roles.includes('R-05') && ownOrg && (p.status === 'Draft' || p.status === 'Perlu Perbaikan');
  const reviewer = roles.includes('R-06') && ownOrg && p.status === 'Review Internal KKKS';
  const uploader = roles.includes('R-02') && p.status === 'Menunggu Dokumen Bertanda Tangan';
  const run = (fn: () => Promise<WpbPeriod>, pesan: string) => act.mutate(fn, { onSuccess: () => toast.show({ title: pesan }) });
  const missing = lines.filter((l) => l.realisasi === null || (lewatAmbang(l) && !l.penjelasan?.trim()));
  const setLine = (i: number, patch: Partial<WpbLine>) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const totalRencana = lines.reduce((s, l) => s + l.rencana, 0);
  const totalReal = lines.reduce((s, l) => s + (l.realisasi ?? 0), 0);

  return (
    <>
      <PageHeader
        title={`Realisasi WP&B ${namaPeriode(p)}`}
        titleAside={<WorkflowStatus label={p.status} tone={WPB_TONE[p.status]} />}
        summary={p.orgNama}
        breadcrumbs={[{ label: 'Anggaran pengamanan', to: '/wpb' }, { label: namaPeriode(p) }]}
        back={back}
        actions={
          reviewer ? (
            <>
              <Button onClick={() => setDialog('kembalikan')}>Kembalikan</Button>
              <Button variant="primary" loading={act.isPending} onClick={() => run(() => services.ops.wpb.finalize(p.id), 'Realisasi difinalisasi. Draf berita acara disusun.')}>
                Finalisasi
              </Button>
            </>
          ) : undefined
        }
      />
      <PageBody>
        <ProcessPath label="Tahap realisasi WP&B" steps={[...WPB_STEPS]} current={wpbStepIndex(p.status)} />
        {p.status === 'Perlu Perbaikan' && (
          <Callout variant="peringatan" size="compact" title="Dikembalikan untuk perbaikan">
            {p.timeline.at(-1)?.catatan}
          </Callout>
        )}

        <Section
          className="border border-border"
          title="Realisasi per kategori"
          description={editable ? 'Isi realisasi bulan ini (dalam juta rupiah) atau unggah template. Kategori dengan deviasi lebih dari 10% wajib diberi penjelasan.' : 'Angka terkunci setelah difinalisasi KKKS.'}
          action={
            editable ? (
              <label className="flex h-control-md cursor-pointer items-center gap-2 rounded-md border border-border-control bg-surface px-4 text-body-dense font-medium text-ink hover:bg-surface-sunken">
                <FileUp aria-hidden size={16} strokeWidth={1.8} />
                Unggah template
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="sr-only"
                  onChange={(e) => {
                    if (!e.target.files?.length) return;
                    setLines(templateLines(lines));
                    toast.show({ title: `Template ${e.target.files[0]!.name} dibaca. Periksa angkanya sebelum diajukan.` });
                  }}
                />
              </label>
            ) : undefined
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-body-dense">
              <caption className="sr-only">Realisasi per kategori</caption>
              <thead>
                <tr className="border-b border-border text-label text-ink-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">Kategori</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Rencana (Rp)</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Realisasi (Rp)</th>
                  <th scope="col" className="py-2 text-right font-medium">Deviasi</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => {
                  const over = lewatAmbang(l);
                  const err = showErrors && (l.realisasi === null || (over && !l.penjelasan?.trim()));
                  return (
                    <tr key={l.kategori} className="border-b border-border-subtle align-top last:border-b-0">
                      <th scope="row" className={cn('py-3 pr-3 font-medium', over ? 'text-caution-ink' : 'text-ink')}>
                        {l.kategori}
                        {(editable && over) || (!editable && l.penjelasan) ? (
                          editable ? (
                            <div className="mt-2 font-normal">
                              <Textarea
                                label="Penjelasan deviasi"
                                rows={2}
                                maxLength={300}
                                value={l.penjelasan ?? ''}
                                onChange={(e) => setLine(i, { penjelasan: e.target.value })}
                                error={err && over && !l.penjelasan?.trim() ? 'Wajib dijelaskan karena deviasi lebih dari 10%.' : undefined}
                              />
                            </div>
                          ) : (
                            <p className="mt-1 text-caption font-normal text-ink-muted">Penjelasan: {l.penjelasan}</p>
                          )
                        ) : null}
                      </th>
                      <td className="py-3 pr-3 text-right font-mono tabular-nums text-ink-muted">{formatRupiah(l.rencana)}</td>
                      <td className="py-3 pr-3 text-right font-mono tabular-nums">
                        {editable ? (
                          <TextField
                            label={`Realisasi ${l.kategori} (Rp juta)`}
                            hideLabel
                            inputMode="numeric"
                            digitsOnly
                            value={l.realisasi === null ? '' : String(Math.round(l.realisasi / 1_000_000))}
                            onChange={(e) => setLine(i, { realisasi: e.target.value === '' ? null : Number(e.target.value) * 1_000_000 })}
                            error={err && l.realisasi === null ? 'Isi realisasi.' : undefined}
                            containerClassName="ml-auto w-[140px]"
                            className="text-right font-mono"
                          />
                        ) : l.realisasi === null ? (
                          '—'
                        ) : (
                          formatRupiah(l.realisasi)
                        )}
                      </td>
                      <td className={cn('py-3 text-right font-mono tabular-nums', over ? 'font-semibold text-caution-ink' : 'text-ink-muted')}>{l.realisasi === null ? '—' : signPct(deviasi(l))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <th scope="row" className="py-3 pr-3 text-left font-semibold text-ink">Total</th>
                  <td className="py-3 pr-3 text-right font-mono font-semibold tabular-nums">{formatRupiah(totalRencana)}</td>
                  <td className="py-3 pr-3 text-right font-mono font-semibold tabular-nums">{totalReal ? formatRupiah(totalReal) : '—'}</td>
                  <td className="py-3 text-right font-mono tabular-nums text-ink-muted">{totalReal ? signPct(totalReal / totalRencana - 1) : '—'}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {editable && (
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-border-subtle pt-4">
              {showErrors && missing.length > 0 && <span className="mr-auto text-caption text-error-ink">{missing.length} kategori belum lengkap.</span>}
              <Button loading={act.isPending} onClick={() => run(() => services.ops.wpb.save(p.id, lines), 'Draf disimpan.')}>
                Simpan draf
              </Button>
              <Button
                variant="primary"
                loading={act.isPending}
                onClick={() => {
                  setShowErrors(true);
                  if (missing.length) return;
                  run(() => services.ops.wpb.submit(p.id, lines), 'Realisasi diajukan ke Pejabat Berwenang KKKS.');
                }}
              >
                Ajukan
              </Button>
            </div>
          )}
        </Section>

        {p.beritaAcara && (
          <Section className="border border-border" title="Berita acara">
            <div className="flex flex-col gap-4">
              <KeyValueList
                fullWidth
                items={[
                  { key: 'no', label: 'Nomor', value: p.beritaAcara.nomor, mono: true },
                  { key: 'draf', label: 'Draf disusun', value: `${formatTanggalJam(p.beritaAcara.dibuatPada)} · angka dari data terkunci` },
                  {
                    key: 'dok',
                    label: 'Dokumen bertanda tangan',
                    value: p.beritaAcara.dokumen ? `${p.beritaAcara.dokumen.nama} · diunggah ${p.beritaAcara.dokumen.diunggahOleh}, ${formatTanggalJam(p.beritaAcara.dokumen.diunggahPada)}` : 'Belum diunggah',
                  },
                ]}
              />
              <div className="flex flex-wrap gap-2">
                <Button icon={<FileText aria-hidden size={16} strokeWidth={1.8} />} onClick={() => setDialog('ba')}>
                  Lihat draf berita acara
                </Button>
              </div>
              {p.status === 'Menunggu Dokumen Bertanda Tangan' &&
                (uploader ? (
                  <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
                    <p className="text-body-dense text-ink">Berita acara ditandatangani kedua pihak di luar sistem. Unggah PDF bertanda tangan; status otomatis menjadi Final bila angkanya cocok.</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex h-control-md cursor-pointer items-center gap-2 rounded-md border border-border-control bg-surface px-4 text-body-dense font-medium text-ink hover:bg-surface-sunken">
                        <Upload aria-hidden size={16} strokeWidth={1.8} />
                        {file || 'Pilih PDF'}
                        <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0]?.name ?? '')} />
                      </label>
                      <Button variant="primary" disabled={!file} loading={act.isPending} onClick={() => run(() => services.ops.wpb.uploadSigned(p.id, file), 'Dokumen bertanda tangan diunggah. Status Final.')}>
                        Unggah dokumen bertanda tangan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-caption text-ink-muted">Menunggu Pengawas SKK mengunggah berita acara bertanda tangan.</p>
                ))}
            </div>
          </Section>
        )}

        <Section className="border border-border" title="Riwayat">
          {p.timeline.length === 0 ? (
            <p className="text-body-dense text-ink-muted">Belum ada aktivitas.</p>
          ) : (
            <ol className="flex flex-col">
              {[...p.timeline].reverse().map((e, i) => (
                <li key={`${e.at}-${i}`} className="flex flex-col gap-1 border-b border-border-subtle py-3 last:border-b-0">
                  <span className="text-body-dense font-medium text-ink">{e.aksi}</span>
                  {e.catatan && <span className="text-body-dense text-ink-muted">{e.catatan}</span>}
                  <span className="text-caption text-ink-subtle">
                    {e.oleh} · {e.peran} · <span className="font-mono">{formatTanggalJam(e.at)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Section>
      </PageBody>

      <Dialog
        open={dialog === 'kembalikan'}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Kembalikan untuk perbaikan?"
        description="Pelapor menerima realisasi ini kembali beserta catatan Anda."
        closeLabel="Batal"
        size="md"
        footer={
          <>
            <Button onClick={() => setDialog(null)}>Batal</Button>
            <Button variant="primary" disabled={!alasan.trim()} loading={act.isPending} onClick={() => run(() => services.ops.wpb.sendBack(p.id, alasan), 'Realisasi dikembalikan ke pelapor.')}>
              Kembalikan
            </Button>
          </>
        }
      >
        <Textarea label="Catatan perbaikan" rows={3} maxLength={300} showCount value={alasan} onChange={(e) => setAlasan(e.target.value)} />
      </Dialog>

      <Dialog
        open={dialog === 'ba'}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Draf berita acara ${p.beritaAcara?.nomor ?? ''}`}
        description="Draf disusun sistem dari data yang terkunci. Ditandatangani kedua pihak di luar sistem."
        closeLabel="Tutup"
        size="lg"
        footer={<Button onClick={() => setDialog(null)}>Tutup</Button>}
      >
        <div className="flex flex-col gap-3 text-body-dense text-ink">
          <p>
            Pada {p.beritaAcara ? formatTanggalJam(p.beritaAcara.dibuatPada) : '—'}, telah dibahas realisasi anggaran pengamanan {p.orgNama} periode {namaPeriode(p)} dengan rincian sebagai berikut:
          </p>
          <table className="w-full border-collapse text-left">
            <tbody>
              {p.lines.map((l) => (
                <tr key={l.kategori} className="border-b border-border-subtle">
                  <th scope="row" className="py-2 pr-3 font-normal">{l.kategori}</th>
                  <td className="py-2 text-right font-mono tabular-nums">{l.realisasi === null ? '—' : formatRupiah(l.realisasi)}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="py-2 pr-3 font-semibold">Total realisasi</th>
                <td className="py-2 text-right font-mono font-semibold tabular-nums">{formatRupiah(p.lines.reduce((s, l) => s + (l.realisasi ?? 0), 0))}</td>
              </tr>
            </tbody>
          </table>
          <div className="grid grid-cols-2 gap-6 pt-6 text-center text-caption text-ink-muted">
            <span>Pejabat Berwenang KKKS<br /><br /><br />(tanda tangan)</span>
            <span>Perwakilan SKK Migas<br /><br /><br />(tanda tangan)</span>
          </div>
        </div>
      </Dialog>
    </>
  );
}
