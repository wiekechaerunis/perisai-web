/**
 * Layar ringkas modul lain untuk prototype kick-off (PRD Garis Besar tab 03, 04, 05, 08, 11, 12, 13) dan layar
 * "Konsep" untuk modul yang cakupannya masih dibahas (tab 09, 10, 12, 13; KD-04, K-02, K-18).
 * Satu halaman per modul, data contoh lewat `services.ops` bila tersedia; sisanya ilustrasi statis bertanda.
 */
import { Lightbulb } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { Callout } from '@/components/patterns/Callout';
import { DataTable } from '@/components/patterns/DataTable';
import { IndonesiaMap } from '@/components/patterns/IndonesiaMap';
import { MetricStrip } from '@/components/patterns/MetricStrip';
import { ThresholdBar } from '@/components/patterns/ThresholdBar';
import { SeverityBadge, type SeverityLevel } from '@/components/ui/SeverityBadge';
import { WorkflowStatus } from '@/components/ui/WorkflowStatus';
import { formatTanggal, formatTanggalJam } from '@/lib/format';
import { CONTRACT_TONE, FOLLOWUP_TONE } from '@/lib/ops-status';
import { INCIDENT_TYPES, type FollowUp, type PksAgreement } from '@/services';
import { useFollowUps, useIncidents, useOpsRefs, usePks } from '../ops/hooks';
import { useSession } from '../session/SessionProvider';

function useSkk() {
  const { session } = useSession();
  return !!session?.user.roles.some((r) => r === 'R-01' || r === 'R-02' || r === 'R-03');
}

const Ilustrasi = () => (
  <Callout variant="info" size="compact">
    Layar ringkas untuk kick-off. Isi dan alurnya ditetapkan di PRD lengkap modul ini.
  </Callout>
);

/* ---------- Risiko & Kondisi Keamanan (M-04) ---------- */
const RISKS: { kode: string; judul: string; kkks: string; orgId: string; level: SeverityLevel; k: number; d: number; mitigasi: string }[] = [
  { kode: 'RSK-2026-014', judul: 'Pencurian material di gudang terbuka', kkks: 'PT Andalas Energi Hulu', orgId: 'org-andalas', level: 'Tinggi', k: 4, d: 3, mitigasi: 'Pagar ganda + CCTV, 3 langkah' },
  { kode: 'RSK-2026-019', judul: 'Gangguan unjuk rasa terkait tenaga kerja lokal', kkks: 'PT Andalas Energi Hulu', orgId: 'org-andalas', level: 'Sedang', k: 3, d: 3, mitigasi: 'Forum komunikasi warga, 2 langkah' },
  { kode: 'RSK-2026-021', judul: 'Sabotase jalur pipa di koridor permukiman', kkks: 'PT Mahakam Sejahtera Petroleum', orgId: 'org-mahakam', level: 'Kritis', k: 3, d: 5, mitigasi: 'Patroli gabungan aparat, 4 langkah' },
  { kode: 'RSK-2026-022', judul: 'Akses kapal tidak dikenal ke zona terbatas platform', kkks: 'PT Natuna Lepas Pantai', orgId: 'org-natuna', level: 'Tinggi', k: 3, d: 4, mitigasi: 'Koordinasi Lanal, 2 langkah' },
  { kode: 'RSK-2026-025', judul: 'Penyerobotan lahan koridor pipa', kkks: 'PT Andalas Energi Hulu', orgId: 'org-andalas', level: 'Sedang', k: 2, d: 3, mitigasi: 'Pemetaan ulang patok, 1 langkah' },
];

export function RisikoPage() {
  const { session } = useSession();
  const skk = useSkk();
  const rows = RISKS.filter((r) => skk || r.orgId === session?.user.organisasi.id);
  return (
    <>
      <PageHeader title="Risiko & kondisi keamanan" summary="Register risiko dengan penilaian kemungkinan × dampak dari satu matriks. Risiko tinggi/kritis wajib punya rencana mitigasi." />
      <PageBody>
        <Ilustrasi />
        <Section className="border border-border" title="Register risiko">
          <DataTable
            caption="Register risiko"
            data={rows}
            getRowId={(r) => r.kode}
            columns={[
              { id: 'kode', header: 'Kode', cell: ({ row }) => <span className="font-mono text-caption">{row.original.kode}</span> },
              { id: 'judul', header: 'Risiko', cell: ({ row }) => <span className="font-medium">{row.original.judul}</span> },
              ...(skk ? [{ id: 'kkks', header: 'KKKS', cell: ({ row }: { row: { original: (typeof RISKS)[number] } }) => <span className="text-ink-muted">{row.original.kkks}</span> }] : []),
              { id: 'kd', header: 'K × D', meta: { mono: true }, cell: ({ row }) => `${row.original.k} × ${row.original.d}` },
              { id: 'level', header: 'Level', cell: ({ row }) => <SeverityBadge level={row.original.level} /> },
              { id: 'mit', header: 'Rencana mitigasi', cell: ({ row }) => <span className="text-ink-muted">{row.original.mitigasi}</span> },
            ]}
          />
        </Section>
      </PageBody>
    </>
  );
}

/* ---------- PKS/PKT (M-07) ---------- */
export function PksPage() {
  const skk = useSkk();
  const q = usePks();
  const columns: ColumnDef<PksAgreement, unknown>[] = [
    { id: 'nomor', header: 'Nomor', cell: ({ row }) => <span className="font-mono text-caption">{row.original.nomor}</span> },
    { id: 'jenis', header: 'Jenis', cell: ({ row }) => row.original.jenis },
    { id: 'mitra', header: 'Mitra', cell: ({ row }) => <span className="font-medium">{row.original.mitra}</span> },
    ...(skk ? [{ id: 'org', header: 'KKKS', cell: ({ row }: { row: { original: PksAgreement } }) => <span className="text-ink-muted">{row.original.orgNama}</span> }] : []),
    { id: 'akhir', header: 'Berakhir', cell: ({ row }) => <span className="font-mono text-caption">{formatTanggal(row.original.berakhir)}</span> },
    { id: 'status', header: 'Status', cell: ({ row }) => <WorkflowStatus label={row.original.status} tone={CONTRACT_TONE[row.original.status]} /> },
  ];
  return (
    <>
      <PageHeader title="PKS/PKT" summary="Perjanjian kerja sama dan pelaksanaan teknis pengamanan dengan aparat. Pengingat masa berlaku sama dengan kontrak BUJP." />
      <PageBody>
        <Ilustrasi />
        <Section className="border border-border" title="Register PKS/PKT">
          <DataTable caption="Register PKS/PKT" columns={columns} data={q.data ?? []} getRowId={(p) => p.id} loading={q.isPending} />
        </Section>
      </PageBody>
    </>
  );
}

/* ---------- Tindak lanjut (M-09) ---------- */
export function TindakLanjutPage() {
  const q = useFollowUps();
  const rows = q.data ?? [];
  const columns: ColumnDef<FollowUp, unknown>[] = [
    { id: 'kode', header: 'Kode', cell: ({ row }) => <span className="font-mono text-caption">{row.original.kode}</span> },
    {
      id: 'judul',
      header: 'Tindak lanjut',
      cell: ({ row }) => (
        <span className="flex flex-col">
          <span className="font-medium">{row.original.judul}</span>
          <span className="text-caption text-ink-subtle">
            Sumber: {row.original.sumberId ? <Link to={`/insiden/${row.original.sumberId}`} className="underline">{row.original.sumber}</Link> : row.original.sumber}
          </span>
        </span>
      ),
    },
    { id: 'pic', header: 'PIC', cell: ({ row }) => row.original.pic },
    {
      id: 'tenggat',
      header: 'Tenggat',
      cell: ({ row }) => (
        <span className="flex flex-col items-start gap-1">
          <span className="font-mono text-caption">{formatTanggal(row.original.tenggat)}</span>
          {row.original.terlambat && <WorkflowStatus label="Terlambat" tone="caution" />}
        </span>
      ),
    },
    { id: 'status', header: 'Status', cell: ({ row }) => <WorkflowStatus label={row.original.status} tone={FOLLOWUP_TONE[row.original.status]} /> },
  ];
  return (
    <>
      <PageHeader title="Tindak lanjut" summary="Tugas dari insiden, risiko, evaluasi, dan arahan SKK. Selesai setelah bukti diperiksa pemberi tugas." />
      <PageBody>
        <Section className="border border-border">
          <MetricStrip
            metrics={[
              { key: 'buka', label: 'Terbuka', value: rows.filter((r) => r.status !== 'Selesai').length },
              { key: 'telat', label: 'Terlambat', value: rows.filter((r) => r.terlambat).length, context: 'Dieskalasi ke pemberi tugas', bad: rows.some((r) => r.terlambat) },
              { key: 'bukti', label: 'Menunggu bukti', value: rows.filter((r) => r.status === 'Menunggu Bukti').length },
            ]}
          />
        </Section>
        <Section className="border border-border" title="Daftar tindak lanjut">
          <DataTable caption="Daftar tindak lanjut" columns={columns} data={rows} getRowId={(r) => r.id} loading={q.isPending} />
        </Section>
      </PageBody>
    </>
  );
}

/* ---------- Profil KKKS & Wilayah Kerja (M-03) ---------- */
export function ProfilKkksPage() {
  const refs = useOpsRefs();
  const d = refs.data;
  return (
    <>
      <PageHeader title="Profil KKKS & wilayah kerja" summary="Organisasi, wilayah kerja, aset, dan lokasi berkoordinat. Lokasi laporan dipilih dari profil ini." />
      <PageBody>
        <Ilustrasi />
        {d && (
          <div className="grid gap-5 xl:grid-cols-[3fr_2fr]">
            <Section className="border border-border" title="Lokasi">
              <IndonesiaMap label="Lokasi aset KKKS" points={d.lokasi.map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, value: 1, level: 'Kosong' as const, label: l.nama }))} />
            </Section>
            <Section className="border border-border" title="Wilayah kerja">
              <ul className="flex flex-col">
                {d.wk.map((w) => (
                  <li key={w.id} className="flex flex-col gap-1 border-b border-border-subtle py-3 last:border-b-0">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-caption text-ink-muted">{w.kode}</span>
                      <span className="font-medium text-ink">{w.nama}</span>
                    </span>
                    <span className="text-caption text-ink-muted">
                      {d.orgs.find((o) => o.id === w.orgId)?.nama} · {w.provinsi} · {d.lokasi.filter((l) => l.wkId === w.id).length} lokasi
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        )}
      </PageBody>
    </>
  );
}

/* ---------- Analitik (M-10) ---------- */
export function AnalitikPage() {
  const q = useIncidents({ verifiedOnly: true });
  const rows = q.data ?? [];
  const perJenis = INCIDENT_TYPES.map((j) => ({ jenis: j, n: rows.filter((i) => i.jenis === j).length }));
  const max = Math.max(1, ...perJenis.map((x) => x.n));
  const avg = rows.length / INCIDENT_TYPES.length;
  return (
    <>
      <PageHeader title="Analitik" summary="Analitik deskriptif dan diagnostik dari data terverifikasi. Prediktif dirilis setelah ada data pilot." />
      <PageBody>
        <Ilustrasi />
        <Section className="border border-border" title="Insiden terverifikasi per jenis">
          <ThresholdBar
            legend="Garis tipis = rata-rata per jenis. Batang berwarna = jenis dengan frekuensi di atas 1,5× rata-rata."
            threshold={avg}
            max={max * 1.15}
            rows={[...perJenis].sort((a, b) => b.n - a.n).map((x) => ({ key: x.jenis, label: x.jenis, value: x.n, valueLabel: `${x.n} insiden`, abnormal: x.n > avg * 1.5 }))}
          />
        </Section>
      </PageBody>
    </>
  );
}

/* ---------- Peringatan dini (M-12) ---------- */
const ALERTS: { judul: string; aturan: string; status: 'Baru' | 'Ditanggapi' | 'Selesai' | 'Diabaikan'; at: number; orgId: string }[] = [
  { judul: 'Frekuensi pencurian di WK Andalas Darat naik 2× rata-rata 3 bulan', aturan: 'Frekuensi insiden', status: 'Baru', at: 2, orgId: 'org-andalas' },
  { judul: 'Kontrak BUJP SPK-BUJP/ADL/2024/017 berakhir kurang dari 2 bulan', aturan: 'Masa berlaku', status: 'Ditanggapi', at: 5, orgId: 'org-andalas' },
  { judul: 'Deviasi koordinasi aparat Juli 22% di atas rencana', aturan: 'Deviasi anggaran', status: 'Selesai', at: 70, orgId: 'org-andalas' },
  { judul: 'Risiko kritis RSK-2026-021 tanpa progres mitigasi 14 hari', aturan: 'Level risiko', status: 'Baru', at: 1, orgId: 'org-mahakam' },
];
export function PeringatanDiniPage() {
  const { session } = useSession();
  const skk = useSkk();
  const rows = ALERTS.filter((a) => skk || a.orgId === session?.user.organisasi.id);
  return (
    <>
      <PageHeader title="Peringatan dini" summary={skk ? 'SKK Migas menerima peringatan tanpa aksi tanggapan. KKKS menanggapi: Ditanggapi, Selesai, atau Diabaikan dengan alasan.' : 'Tanggapi setiap peringatan. Yang tidak ditanggapi dieskalasi otomatis.'} />
      <PageBody>
        <Ilustrasi />
        <Section className="border border-border" title="Daftar peringatan">
          <ul className="flex flex-col">
            {rows.map((a) => (
              <li key={a.judul} className="flex flex-wrap items-start gap-3 border-b border-border-subtle py-3 last:border-b-0">
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-body-dense font-medium text-ink">{a.judul}</span>
                  <span className="text-caption text-ink-subtle">
                    Aturan pemicu: {a.aturan} · <span className="font-mono">{formatTanggalJam(Date.now() - a.at * 86_400_000)}</span>
                  </span>
                </span>
                <WorkflowStatus label={a.status} tone={a.status === 'Baru' ? 'caution' : a.status === 'Selesai' ? 'success' : 'neutral'} />
              </li>
            ))}
          </ul>
        </Section>
      </PageBody>
    </>
  );
}

/* ---------- Laporan (M-13) ---------- */
const REPORTS = ['Laporan operasional', 'Laporan insiden keamanan', 'Laporan risiko', 'Laporan anggaran pengamanan', 'Laporan kontrak & kemitraan', 'Laporan eksekutif', 'Laporan berkala'];
export function LaporanPage() {
  const skk = useSkk();
  return (
    <>
      <PageHeader title="Laporan" summary={skk ? 'Laporan otomatis lintas KKKS dari template, hanya dari data terverifikasi.' : 'Laporan organisasi Anda, hanya dari data terverifikasi.'} />
      <PageBody>
        <Ilustrasi />
        <Section className="border border-border" title="Jenis laporan (SOW B.12)">
          <ul className="flex flex-col">
            {REPORTS.map((r) => (
              <li key={r} className="flex items-center gap-3 border-b border-border-subtle py-3 last:border-b-0">
                <span className="flex-1 text-body-dense text-ink">{r}</span>
                <span className="text-caption text-ink-muted">PDF · XLSX</span>
              </li>
            ))}
          </ul>
        </Section>
      </PageBody>
    </>
  );
}

/* ---------- Konsep ---------- */
const CONCEPTS: Record<string, { judul: string; ringkas: string; poin: string[]; keputusan: string }> = {
  'bahan-peledak': {
    judul: 'Bahan peledak',
    ringkas: 'Register gudang dan izin, laporan stok dan pemakaian per periode, saldo nasional per jenis.',
    poin: ['Gudang dan izin beserta dokumennya', 'Laporan stok & pemakaian per gudang dan jenis', 'Saldo dihitung sistem; saldo negatif ditolak', 'Pengingat izin akan berakhir dan laporan terlambat'],
    keputusan: 'Cakupan dikonfirmasi saat kick-off (KD-04); visibilitas lokasi gudang (K-19).',
  },
  'layanan-infrastruktur': {
    judul: 'Layanan infrastruktur',
    ringkas: 'Katalog layanan pengamanan dengan SLA, tiket kendala, pemantauan SLA, dan log pemeliharaan.',
    poin: ['Katalog layanan & SLA', 'Tiket kendala dan eskalasi', 'Log pemeliharaan perangkat', 'Tidak menggantikan ITSM/NOC'],
    keputusan: 'Infrastruktur fisik atau TI, dan siapa penggunanya (K-02).',
  },
  k3: {
    judul: 'Keselamatan kerja (K3)',
    ringkas: 'K3 sebagai lapisan terpisah di peta panas dan ringkasan di dasbor eksekutif, tidak dicampur statistik keamanan.',
    poin: ['Lapisan K3 di peta panas', 'Ringkasan K3 di dasbor eksekutif', 'Sumber data: input PERISAI atau sistem lain'],
    keputusan: 'Sumber data K3 (K-02).',
  },
  asisten: {
    judul: 'Asisten PERISAI',
    ringkas: 'Tanya jawab atas data PERISAI dalam cakupan pengguna, dengan rujukan sumber dan penanda "Hasil AI".',
    poin: ['Jawaban hanya dari data dalam cakupan Anda', 'Setiap jawaban menyebut rujukan', 'Selalu bertanda Hasil AI · belum diverifikasi', 'AI tidak pernah mengambil keputusan'],
    keputusan: 'Kebijakan AI pihak ketiga (K-18).',
  },
  'informasi-eksternal': {
    judul: 'Informasi eksternal',
    ringkas: 'Info media, cuaca, dan bencana ditampilkan dengan sumbernya; dapat diangkat menjadi observasi.',
    poin: ['Feed media, BMKG, dan kebencanaan', 'Setiap item menyebut sumber', 'Angkat menjadi observasi risiko'],
    keputusan: 'Sumber data dan analisis sentimen (Q-64, K-18).',
  },
};

export function KonsepPage({ slug }: { slug: keyof typeof CONCEPTS }) {
  const k = CONCEPTS[slug]!;
  return (
    <>
      <PageHeader title={k.judul} titleAside={<WorkflowStatus label="Konsep" tone="muted" />} summary={k.ringkas} />
      <PageBody>
        <Callout variant="info" size="compact" title="Konsep">
          Cakupan modul ini masih dibahas. Layar final dibuat setelah keputusan kick-off.
        </Callout>
        <Section className="border border-border" title="Yang direncanakan">
          <ul className="flex flex-col gap-2">
            {k.poin.map((p) => (
              <li key={p} className="flex items-start gap-2 text-body-dense text-ink">
                <Lightbulb aria-hidden size={16} strokeWidth={1.8} className="mt-[2px] shrink-0 text-ink-muted" />
                {p}
              </li>
            ))}
          </ul>
        </Section>
        <Section className="border border-border" title="Keputusan terbuka">
          <p className="text-body-dense text-ink">{k.keputusan}</p>
        </Section>
      </PageBody>
    </>
  );
}
