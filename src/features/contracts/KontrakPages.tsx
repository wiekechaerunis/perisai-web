/**
 * Kontrak BUJP (M-07) — PRD Garis Besar tab 08 (OPS-05..08; pengingat ANL-01), alur demo 4 kick-off.
 * Register kontrak (nomor, BUJP, KKKS/aset, periode, nilai, status) → detail (dokumen, realisasi, insiden terkait) →
 * status otomatis dari tanggal: Aktif / Akan Berakhir (≤ 12 bulan) / Berakhir (AB-10) → pengingat 12/6/3/1 bulan.
 * KKKS mendaftarkan kontrak (Admin KKKS / Pelapor KKKS); SKK Migas memantau lintas KKKS.
 */
import { useMutation } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { BellRing, Paperclip, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { Callout } from '@/components/patterns/Callout';
import { DataTable } from '@/components/patterns/DataTable';
import { Dialog } from '@/components/patterns/Dialog';
import { KeyValueList } from '@/components/patterns/KeyValueList';
import { MetricStrip } from '@/components/patterns/MetricStrip';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { TextField } from '@/components/ui/TextField';
import { WorkflowStatus } from '@/components/ui/WorkflowStatus';
import { formatRupiah, formatTanggal } from '@/lib/format';
import { can } from '@/lib/rbac';
import { CONTRACT_TONE } from '@/lib/ops-status';
import { services, type Contract } from '@/services';
import { rupiahRingkas, useContract, useContracts, useIncidents, useInvalidateOps, useOpsRefs, persen } from '../ops/hooks';
import { useSession } from '../session/SessionProvider';

function sisa(c: Contract): string {
  if (c.sisaHari < 0) return `Berakhir ${Math.abs(c.sisaHari)} hari lalu`;
  if (c.sisaHari < 62) return `${c.sisaHari} hari lagi`;
  return `${Math.round(c.sisaHari / 30)} bulan lagi`;
}

function AddContractDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const refs = useOpsRefs();
  const invalidate = useInvalidateOps();
  const toast = useToast();
  const navigate = useNavigate();
  const [f, setF] = useState({ nomor: '', bujp: '', aset: '', wkId: '', mulai: '', berakhir: '', nilai: '', personel: '' });
  const [dok, setDok] = useState<string[]>([]);
  const [err, setErr] = useState<string>();
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const m = useMutation({
    mutationFn: () => services.ops.contracts.create({ ...f, nilai: Number(f.nilai) * 1_000_000, personel: Number(f.personel) || 0, dokumen: dok }),
    onSuccess: (c) => {
      invalidate();
      toast.show({ title: `Kontrak ${c.nomor} didaftarkan. Status: ${c.status}.` });
      onClose();
      navigate(`/kontrak/${c.id}`);
    },
    onError: () => setErr('Periksa isian: nomor, BUJP, wilayah kerja, dan tanggal berakhir setelah tanggal mulai.'),
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Daftarkan kontrak BUJP"
      description="Status dan pengingat masa berlaku dihitung otomatis dari tanggal berakhir."
      closeLabel="Batal"
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Batal</Button>
          <Button variant="primary" loading={m.isPending} onClick={() => m.mutate()}>
            Daftarkan
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {err && (
          <Callout variant="error" size="compact">
            {err}
          </Callout>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Nomor kontrak" value={f.nomor} onChange={(e) => set('nomor', e.target.value)} placeholder="SPK-BUJP/ADL/2026/030" className="font-mono" />
          <TextField label="Nama BUJP" value={f.bujp} onChange={(e) => set('bujp', e.target.value)} />
          <Select label="Wilayah kerja" placeholder="Pilih wilayah kerja" value={f.wkId || undefined} onValueChange={(v) => set('wkId', v)} options={(refs.data?.wk ?? []).map((w) => ({ value: w.id, label: w.nama }))} />
          <TextField label="Aset / lokasi yang diamankan" value={f.aset} onChange={(e) => set('aset', e.target.value)} />
          <TextField label="Tanggal mulai" type="date" value={f.mulai} onChange={(e) => set('mulai', e.target.value)} />
          <TextField label="Tanggal berakhir" type="date" value={f.berakhir} onChange={(e) => set('berakhir', e.target.value)} />
          <TextField label="Nilai kontrak (Rp juta)" inputMode="numeric" digitsOnly value={f.nilai} onChange={(e) => set('nilai', e.target.value)} className="font-mono" />
          <TextField label="Jumlah personel" inputMode="numeric" digitsOnly value={f.personel} onChange={(e) => set('personel', e.target.value)} className="font-mono" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-label text-ink-muted">Dokumen kontrak</span>
          <label className="flex h-control-md w-fit cursor-pointer items-center gap-2 rounded-md border border-border-control bg-surface px-4 text-body-dense font-medium text-ink hover:bg-surface-sunken">
            <Paperclip aria-hidden size={16} strokeWidth={1.8} />
            Lampirkan dokumen
            <input type="file" multiple className="sr-only" onChange={(e) => setDok((d) => [...d, ...Array.from(e.target.files ?? []).map((x) => x.name)])} />
          </label>
          {dok.length > 0 && <p className="font-mono text-caption text-ink-muted">{dok.join(', ')}</p>}
        </div>
      </div>
    </Dialog>
  );
}

export function KontrakListPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const q = useContracts();
  const [add, setAdd] = useState(false);
  const roles = session?.user.roles ?? [];
  const skk = roles.some((r) => r === 'R-01' || r === 'R-02' || r === 'R-03');
  const canAdd = roles.some((r) => r === 'R-04' || r === 'R-05') && can(roles, 'M-07', 'create');
  const rows = q.data ?? [];
  const columns: ColumnDef<Contract, unknown>[] = [
    {
      id: 'nomor',
      header: 'Kontrak',
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span className="font-mono text-caption text-ink">{row.original.nomor}</span>
          <span className="font-medium text-ink">{row.original.bujp}</span>
        </span>
      ),
    },
    ...(skk ? [{ id: 'org', header: 'KKKS', cell: ({ row }: { row: { original: Contract } }) => <span className="text-ink-muted">{row.original.orgNama}</span> }] : []),
    {
      id: 'aset',
      header: 'Aset',
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span>{row.original.aset}</span>
          <span className="text-caption text-ink-subtle">{row.original.wkNama}</span>
        </span>
      ),
    },
    { id: 'periode', header: 'Periode', cell: ({ row }) => <span className="whitespace-nowrap font-mono text-caption">{formatTanggal(row.original.mulai)} – {formatTanggal(row.original.berakhir)}</span> },
    { id: 'nilai', header: 'Nilai', meta: { align: 'right', mono: true }, cell: ({ row }) => rupiahRingkas(row.original.nilai) },
    { id: 'status', header: 'Status', cell: ({ row }) => <WorkflowStatus label={row.original.status} tone={CONTRACT_TONE[row.original.status]} note={sisa(row.original)} /> },
  ];
  return (
    <>
      <PageHeader
        title="Kontrak BUJP"
        summary="Register kontrak Badan Usaha Jasa Pengamanan. Pengingat dikirim 12, 6, 3, dan 1 bulan sebelum berakhir."
        actions={
          canAdd ? (
            <Button variant="primary" icon={<Plus aria-hidden size={16} strokeWidth={1.8} />} onClick={() => setAdd(true)}>
              Daftarkan kontrak
            </Button>
          ) : undefined
        }
      />
      <PageBody>
        <Section className="border border-border">
          <MetricStrip
            metrics={[
              { key: 'aktif', label: 'Aktif', value: rows.filter((c) => c.status === 'Aktif').length, context: 'Berakhir lebih dari 12 bulan lagi' },
              { key: 'akan', label: 'Akan berakhir', value: rows.filter((c) => c.status === 'Akan Berakhir').length, context: 'Dalam 12 bulan; siapkan persetujuan teknis perpanjangan', bad: rows.some((c) => c.status === 'Akan Berakhir') },
              { key: 'akhir', label: 'Berakhir', value: rows.filter((c) => c.status === 'Berakhir').length },
              { key: 'nilai', label: 'Nilai kontrak berjalan', value: rupiahRingkas(rows.filter((c) => c.status !== 'Berakhir').reduce((s, c) => s + c.nilai, 0)) },
            ]}
          />
        </Section>
        <Section className="border border-border" title="Register kontrak">
          <DataTable caption="Register kontrak BUJP" columns={columns} data={rows} getRowId={(c) => c.id} loading={q.isPending} onRowClick={(c) => navigate(`/kontrak/${c.id}`)} />
        </Section>
      </PageBody>
      {add && <AddContractDialog open onClose={() => setAdd(false)} />}
    </>
  );
}

export function KontrakDetailPage() {
  const { id } = useParams();
  const q = useContract(id);
  const inc = useIncidents();
  const back = { to: '/kontrak', label: 'Kembali ke Kontrak BUJP' };
  const c = q.data;
  if (!c) {
    return (
      <>
        <PageHeader title={q.isError ? 'Kontrak tidak ditemukan' : 'Memuat…'} breadcrumbs={[{ label: 'Kontrak BUJP', to: '/kontrak' }, { label: '…' }]} back={back} />
        <PageBody>
          <p className="text-body-dense text-ink-muted">{q.isError ? 'Kontrak ini tidak ada atau di luar cakupan Anda.' : 'Memuat…'}</p>
        </PageBody>
      </>
    );
  }
  const related = (inc.data ?? []).filter((i) => c.insidenIds.includes(i.id));
  return (
    <>
      <PageHeader
        title={c.bujp}
        titleAside={<WorkflowStatus label={c.status} tone={CONTRACT_TONE[c.status]} />}
        summary={<span className="font-mono">{c.nomor}</span>}
        breadcrumbs={[{ label: 'Kontrak BUJP', to: '/kontrak' }, { label: c.nomor }]}
        back={back}
      />
      <PageBody>
        {c.status === 'Akan Berakhir' && (
          <Callout variant="peringatan" size="compact" title={`Berakhir ${formatTanggal(c.berakhir)} · ${sisa(c)}`}>
            Siapkan persetujuan teknis perpanjangan. Pengingat berhenti setelah perpanjangan tercatat.
          </Callout>
        )}
        <div className="grid gap-5 xl:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-5">
            <Section className="border border-border" title="Informasi kontrak">
              <KeyValueList
                fullWidth
                items={[
                  { key: 'org', label: 'KKKS', value: c.orgNama },
                  { key: 'aset', label: 'Aset / lokasi', value: `${c.aset} · ${c.wkNama}` },
                  { key: 'periode', label: 'Periode', value: `${formatTanggal(c.mulai)} – ${formatTanggal(c.berakhir)}`, mono: true },
                  { key: 'nilai', label: 'Nilai kontrak', value: formatRupiah(c.nilai), mono: true },
                  { key: 'personel', label: 'Personel', value: `${c.personel} orang` },
                ]}
              />
            </Section>
            <Section className="border border-border" title="Realisasi" description="Ilustrasi; sumber realisasi agar tidak dobel dengan WP&B masih dibahas (Q-47).">
              <MetricStrip
                metrics={[
                  { key: 'real', label: 'Realisasi pembayaran', value: rupiahRingkas(c.realisasi), context: `${persen(c.nilai ? c.realisasi / c.nilai : 0)} dari nilai kontrak` },
                  { key: 'sisa', label: 'Sisa nilai', value: rupiahRingkas(c.nilai - c.realisasi) },
                ]}
              />
            </Section>
            <Section className="border border-border" title={`Insiden terkait · ${related.length}`} description="Insiden terverifikasi di aset yang diamankan kontrak ini.">
              {related.length === 0 ? (
                <p className="text-body-dense text-ink-muted">Tidak ada insiden terkait.</p>
              ) : (
                <ul className="flex flex-col">
                  {related.map((i) => (
                    <li key={i.id} className="border-b border-border-subtle last:border-b-0">
                      <Link to={`/insiden/${i.id}`} className="flex flex-wrap items-center gap-3 py-3 hover:underline">
                        <SeverityBadge level={i.severity} />
                        <span className="font-mono text-caption text-ink-muted">{i.kode}</span>
                        <span className="text-body-dense text-ink">{i.judul}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
          <div className="flex flex-col gap-5">
            <Section className="border border-border" title="Pengingat masa berlaku" description="Dikirim ke Admin KKKS, Pelapor KKKS, dan Pejabat Berwenang KKKS; Pengawas SKK menerima salinan.">
              <ol className="flex flex-col">
                {c.pengingat.map((p) => (
                  <li key={p.bulanSebelum} className="flex items-center gap-3 border-b border-border-subtle py-3 last:border-b-0">
                    <BellRing aria-hidden size={16} strokeWidth={1.8} className={p.terkirim ? 'text-ink' : 'text-ink-subtle'} />
                    <span className="flex-1 text-body-dense text-ink">{p.bulanSebelum} bulan sebelum berakhir</span>
                    <span className="font-mono text-caption text-ink-muted">{formatTanggal(p.tanggal)}</span>
                    <WorkflowStatus label={p.terkirim ? 'Terkirim' : 'Terjadwal'} tone={p.terkirim ? 'strong' : 'muted'} />
                  </li>
                ))}
              </ol>
            </Section>
            <Section className="border border-border" title="Dokumen">
              <ul className="flex flex-wrap gap-2">
                {c.dokumen.map((d) => (
                  <li key={d} className="flex items-center gap-1 rounded-sm border border-border bg-surface-sunken px-2 py-1 font-mono text-caption text-ink-muted">
                    <Paperclip aria-hidden size={12} strokeWidth={1.8} />
                    {d}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      </PageBody>
    </>
  );
}
