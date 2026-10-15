/**
 * Insiden — PRD Garis Besar tab 06 (INS-02..08), alur demo 2 kick-off.
 * - Daftar: KKKS hanya organisasinya; SKK lintas KKKS (isolasi di data layer).
 * - Detail: linimasa tindakan. Pejabat Berwenang KKKS: Verifikasi / Kembalikan → Tugaskan PIC → Catat tindakan →
 *   Tutup (wajib penyebab + bukti, BR-INS-08). SKK Migas hanya memantau: tanpa tombol apa pun (KD-01).
 * ASSUMPTION: nama status insiden (BRD belum menetapkan) — lihat ASSUMPTIONS.md.
 */
import { useMutation } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Paperclip, Siren } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { Callout } from '@/components/patterns/Callout';
import { DataTable } from '@/components/patterns/DataTable';
import { Dialog } from '@/components/patterns/Dialog';
import { EmptyState } from '@/components/patterns/EmptyState';
import { KeyValueList } from '@/components/patterns/KeyValueList';
import { ProcessPath } from '@/components/patterns/ProcessPath';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { Textarea } from '@/components/ui/Textarea';
import { WorkflowStatus } from '@/components/ui/WorkflowStatus';
import { formatTanggalJam } from '@/lib/format';
import { INCIDENT_STEPS, INCIDENT_TONE, incidentStepIndex } from '@/lib/ops-status';
import { services, SEVERITIES, type Incident, type IncidentStatus } from '@/services';
import { useIncident, useIncidents, useInvalidateOps, useOpsRefs } from '../ops/hooks';
import { useSession } from '../session/SessionProvider';

const SEMUA = 'semua';
const STATUSES: IncidentStatus[] = ['Belum terverifikasi', 'Dikembalikan', 'Terverifikasi', 'Ditangani', 'Ditutup'];

export function InsidenListPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const q = useIncidents();
  const [status, setStatus] = useState(SEMUA);
  const [sev, setSev] = useState(SEMUA);
  const roles = session?.user.roles ?? [];
  const skk = roles.some((r) => r === 'R-01' || r === 'R-02' || r === 'R-03');
  const rows = (q.data ?? []).filter((i) => (status === SEMUA || i.status === status) && (sev === SEMUA || i.severity === sev));
  const columns: ColumnDef<Incident, unknown>[] = [
    { id: 'kode', header: 'Kode', cell: ({ row }) => <span className="whitespace-nowrap font-mono text-caption">{row.original.kode}</span> },
    {
      id: 'judul',
      header: 'Insiden',
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span className="font-medium text-ink">{row.original.judul}</span>
          <span className="text-caption text-ink-subtle">{row.original.wkNama}</span>
        </span>
      ),
    },
    ...(skk ? [{ id: 'org', header: 'KKKS', cell: ({ row }: { row: { original: Incident } }) => <span className="text-ink-muted">{row.original.orgNama}</span> }] : []),
    { id: 'sev', header: 'Keparahan', cell: ({ row }) => <SeverityBadge level={row.original.severity} /> },
    { id: 'status', header: 'Status', cell: ({ row }) => <WorkflowStatus label={row.original.status} tone={INCIDENT_TONE[row.original.status]} /> },
    { id: 'waktu', header: 'Waktu kejadian', cell: ({ row }) => <span className="whitespace-nowrap font-mono text-caption">{formatTanggalJam(row.original.waktu)}</span> },
  ];
  return (
    <>
      <PageHeader
        title="Insiden"
        summary={skk ? 'Insiden lintas KKKS sesuai cakupan Anda. SKK Migas memantau; verifikasi dan penutupan oleh Pejabat Berwenang KKKS.' : 'Insiden di organisasi Anda.'}
        actions={
          roles.includes('R-05') ? (
            <Button variant="primary" icon={<Siren aria-hidden size={16} strokeWidth={1.8} />} onClick={() => navigate('/lapor')}>
              Lapor insiden
            </Button>
          ) : undefined
        }
      />
      <PageBody>
        <Section className="border border-border py-4">
          <div className="flex flex-wrap items-end gap-2">
            <Select label="Status" hideLabel value={status} onValueChange={setStatus} options={[{ value: SEMUA, label: 'Semua status' }, ...STATUSES.map((s) => ({ value: s, label: s }))]} className="w-[220px]" />
            <Select label="Keparahan" hideLabel value={sev} onValueChange={setSev} options={[{ value: SEMUA, label: 'Semua keparahan' }, ...SEVERITIES.map((s) => ({ value: s, label: s }))]} className="w-[200px]" />
            {(status !== SEMUA || sev !== SEMUA) && (
              <Button variant="link" onClick={() => (setStatus(SEMUA), setSev(SEMUA))}>
                Hapus filter
              </Button>
            )}
          </div>
        </Section>
        <Section className="border border-border" title="Daftar insiden">
          <DataTable
            caption="Daftar insiden"
            columns={columns}
            data={rows}
            getRowId={(i) => i.id}
            loading={q.isPending}
            loadingContent={<p className="text-body-dense text-ink-muted">Memuat…</p>}
            onRowClick={(i) => navigate(`/insiden/${i.id}`)}
            empty={<EmptyState title="Tidak ada insiden yang cocok dengan filter." />}
          />
        </Section>
      </PageBody>
    </>
  );
}

function Timeline({ inc }: { inc: Incident }) {
  return (
    <ol className="flex flex-col">
      {[...inc.timeline].reverse().map((e) => (
        <li key={e.id} className="flex gap-3 border-b border-border-subtle py-3 last:border-b-0">
          <span aria-hidden className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-ink-subtle" />
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-body-dense font-medium text-ink">{e.jenis}</span>
            {e.catatan && <span className="text-body-dense text-ink-muted">{e.catatan}</span>}
            <span className="text-caption text-ink-subtle">
              {e.oleh} · {e.peran} · <span className="font-mono">{formatTanggalJam(e.at)}</span>
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function InsidenDetailPage() {
  const { id } = useParams();
  const { session } = useSession();
  const q = useIncident(id);
  const refs = useOpsRefs();
  const invalidate = useInvalidateOps();
  const toast = useToast();
  const [pic, setPic] = useState('');
  const [catatan, setCatatan] = useState('');
  const [dialog, setDialog] = useState<'kembalikan' | 'tutup' | null>(null);
  const [alasan, setAlasan] = useState('');
  const [penyebab, setPenyebab] = useState('');
  const [bukti, setBukti] = useState<string[]>([]);
  const act = useMutation({
    mutationFn: (fn: () => Promise<Incident>) => fn(),
    onSuccess: () => {
      invalidate();
      setDialog(null);
    },
  });
  const inc = q.data;
  const back = { to: '/insiden', label: 'Kembali ke Insiden' };
  if (!inc) {
    return (
      <>
        <PageHeader title={q.isError ? 'Insiden tidak ditemukan' : 'Memuat…'} breadcrumbs={[{ label: 'Insiden', to: '/insiden' }, { label: '…' }]} back={back} />
        <PageBody>
          <p role="status" className="text-body-dense text-ink-muted">{q.isError ? 'Insiden ini tidak ada atau di luar cakupan Anda.' : 'Memuat…'}</p>
        </PageBody>
      </>
    );
  }
  const roles = session?.user.roles ?? [];
  // Hanya Pejabat Berwenang KKKS organisasi insiden; SKK Migas tidak pernah melihat tombol aksi (KD-01).
  const reviewer = roles.includes('R-06') && session?.user.organisasi.id === inc.orgId;
  const skk = roles.some((r) => r === 'R-01' || r === 'R-02' || r === 'R-03');
  const run = (fn: () => Promise<Incident>, pesan: string) => act.mutate(fn, { onSuccess: () => toast.show({ title: pesan }) });

  const actions = reviewer
    ? inc.status === 'Belum terverifikasi'
      ? (
          <>
            <Button variant="primary" onClick={() => run(() => services.ops.incidents.verify(inc.id), 'Insiden diverifikasi.')} loading={act.isPending}>
              Verifikasi
            </Button>
            <Button onClick={() => setDialog('kembalikan')}>Kembalikan</Button>
          </>
        )
      : inc.status === 'Ditangani'
        ? (
            <Button variant="primary" onClick={() => setDialog('tutup')}>
              Tutup insiden
            </Button>
          )
        : undefined
    : undefined;

  return (
    <>
      <PageHeader
        title={inc.kode}
        titleAside={
          <span className="flex items-center gap-3">
            <SeverityBadge level={inc.severity} />
            <WorkflowStatus label={inc.status} tone={INCIDENT_TONE[inc.status]} />
          </span>
        }
        summary={inc.judul}
        breadcrumbs={[{ label: 'Insiden', to: '/insiden' }, { label: inc.kode }]}
        back={back}
        actions={actions}
      />
      <PageBody>
        <ProcessPath label="Tahap penanganan insiden" steps={[...INCIDENT_STEPS]} current={incidentStepIndex(inc.status)} />
        {inc.status === 'Belum terverifikasi' && (
          <Callout variant="peringatan" size="compact" title="Belum terverifikasi">
            Laporan awal dari lapangan. Belum masuk statistik, dasbor, dan laporan resmi sampai diverifikasi Pejabat Berwenang KKKS.
          </Callout>
        )}
        {inc.status === 'Dikembalikan' && inc.alasanDikembalikan && (
          <Callout variant="peringatan" size="compact" title="Dikembalikan ke pelapor">
            {inc.alasanDikembalikan}
          </Callout>
        )}
        {skk && (
          <Callout variant="info" size="compact">
            SKK Migas memantau insiden ini. Verifikasi, penugasan, dan penutupan dilakukan Pejabat Berwenang KKKS.
          </Callout>
        )}
        <div className="grid gap-5 xl:grid-cols-[3fr_2fr]">
          <div className="flex flex-col gap-5">
            <Section className="border border-border" title="Informasi insiden">
              <KeyValueList
                fullWidth
                items={[
                  { key: 'jenis', label: 'Jenis', value: inc.jenis },
                  { key: 'kkks', label: 'KKKS', value: inc.orgNama },
                  { key: 'lokasi', label: 'Lokasi', value: `${inc.lokasiNama} · ${inc.wkNama}` },
                  { key: 'koordinat', label: 'Koordinat', value: `${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)}`, mono: true },
                  { key: 'waktu', label: 'Waktu kejadian', value: formatTanggalJam(inc.waktu), mono: true },
                  { key: 'pelapor', label: 'Pelapor', value: `${inc.pelapor} · dilaporkan ${formatTanggalJam(inc.dilaporkanPada)}` },
                  { key: 'dampak', label: 'Dampak', value: inc.dampak ?? '—' },
                  { key: 'pic', label: 'PIC penanganan', value: inc.pic ?? '—' },
                  ...(inc.penyebab ? [{ key: 'penyebab', label: 'Penyebab', value: inc.penyebab }] : []),
                ]}
              />
            </Section>
            <Section className="border border-border" title="Kronologi">
              <div className="flex flex-col gap-3">
                <p className="text-body text-ink">{inc.kronologi}</p>
                <ul className="flex flex-wrap gap-2">
                  {[...inc.foto, ...(inc.bukti ?? [])].map((f) => (
                    <li key={f} className="flex items-center gap-1 rounded-sm border border-border bg-surface-sunken px-2 py-1 font-mono text-caption text-ink-muted">
                      <Paperclip aria-hidden size={12} strokeWidth={1.8} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Section>
          </div>
          <div className="flex flex-col gap-5">
            {reviewer && inc.status === 'Terverifikasi' && (
              <Section className="border border-border" title="Tugaskan PIC" description="Satu penanggung jawab penanganan.">
                <div className="flex flex-col gap-3">
                  <Select label="PIC" placeholder="Pilih PIC" value={pic || undefined} onValueChange={setPic} options={(refs.data?.pic ?? []).map((p) => ({ value: p, label: p }))} />
                  <div>
                    <Button variant="primary" disabled={!pic} loading={act.isPending} onClick={() => run(() => services.ops.incidents.assign(inc.id, pic), `Insiden ditugaskan ke ${pic}.`)}>
                      Tugaskan
                    </Button>
                  </div>
                </div>
              </Section>
            )}
            {reviewer && inc.status === 'Ditangani' && (
              <Section className="border border-border" title="Catat tindakan">
                <div className="flex flex-col gap-3">
                  <Textarea label="Tindakan yang dilakukan" rows={3} maxLength={500} showCount value={catatan} onChange={(e) => setCatatan(e.target.value)} />
                  <div>
                    <Button disabled={!catatan.trim()} loading={act.isPending} onClick={() => {
                        run(() => services.ops.incidents.addAction(inc.id, catatan), 'Tindakan dicatat.');
                        setCatatan('');
                      }}>
                      Catat tindakan
                    </Button>
                  </div>
                </div>
              </Section>
            )}
            <Section className="border border-border" title="Linimasa">
              <Timeline inc={inc} />
            </Section>
          </div>
        </div>
      </PageBody>

      <Dialog
        open={dialog === 'kembalikan'}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Kembalikan laporan?"
        description="Pelapor menerima laporan ini kembali beserta alasan Anda."
        closeLabel="Batal"
        size="md"
        footer={
          <>
            <Button onClick={() => setDialog(null)}>Batal</Button>
            <Button variant="primary" disabled={!alasan.trim()} loading={act.isPending} onClick={() => run(() => services.ops.incidents.sendBack(inc.id, alasan), 'Laporan dikembalikan ke pelapor.')}>
              Kembalikan
            </Button>
          </>
        }
      >
        <Textarea label="Alasan" rows={3} maxLength={300} showCount value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="Mis. lokasi kurang tepat, foto belum ada." />
      </Dialog>

      <Dialog
        open={dialog === 'tutup'}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Tutup insiden?"
        description="Insiden ditutup setelah penyebab dan bukti penanganan dicatat."
        closeLabel="Batal"
        footer={
          <>
            <Button onClick={() => setDialog(null)}>Batal</Button>
            <Button
              variant="primary"
              disabled={!penyebab.trim() || bukti.length === 0}
              loading={act.isPending}
              onClick={() => run(() => services.ops.incidents.close(inc.id, { penyebab, bukti }), inc.severity === 'Kritis' || inc.severity === 'Tinggi' ? 'Insiden ditutup. Pengawas SKK dan Pimpinan SKK diberi tahu.' : 'Insiden ditutup.')}
            >
              Tutup insiden
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Textarea label="Penyebab" required rows={3} maxLength={500} showCount value={penyebab} onChange={(e) => setPenyebab(e.target.value)} />
          <div className="flex flex-col gap-2">
            <span className="text-label text-ink-muted">Bukti penanganan</span>
            <label className="flex h-control-md w-fit cursor-pointer items-center gap-2 rounded-md border border-border-control bg-surface px-4 text-body-dense font-medium text-ink hover:bg-surface-sunken">
              <Paperclip aria-hidden size={16} strokeWidth={1.8} />
              Lampirkan bukti
              <input type="file" multiple className="sr-only" onChange={(e) => setBukti((b) => [...b, ...Array.from(e.target.files ?? []).map((f) => f.name)])} />
            </label>
            {bukti.length > 0 ? <p className="font-mono text-caption text-ink-muted">{bukti.join(', ')}</p> : <p className="text-caption text-ink-subtle">Wajib minimal satu berkas (foto, berita acara, atau laporan penanganan).</p>}
          </div>
        </div>
      </Dialog>
    </>
  );
}
