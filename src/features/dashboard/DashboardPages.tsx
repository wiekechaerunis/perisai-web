/**
 * Dasbor eksekutif (M-13, EKS-01) dan Peta panas (M-11, ANL-02) — PRD Garis Besar tab 11 & 13, alur demo 5 kick-off.
 * Hanya data terverifikasi (AB-17); insiden tinggi/kritis belum terverifikasi tampil terpisah dengan label
 * (BR-EKS-01). SKK lintas KKKS; KKKS hanya organisasinya (isolasi di data layer).
 * Peta panas: klik titik wilayah kerja → daftar insiden di area itu → detail insiden (drill-down).
 */
import { ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { EmptyState } from '@/components/patterns/EmptyState';
import { IndonesiaMap, type MapPoint, type MapPointLevel } from '@/components/patterns/IndonesiaMap';
import { MetricStrip } from '@/components/patterns/MetricStrip';
import { QueueItem } from '@/components/patterns/QueueItem';
import { ThresholdBar } from '@/components/patterns/ThresholdBar';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { WorkflowStatus } from '@/components/ui/WorkflowStatus';
import { formatRelatif, formatTanggalJam } from '@/lib/format';
import { INCIDENT_TONE } from '@/lib/ops-status';
import { SEVERITIES, type HeatPoint, type Incident } from '@/services';
import { rupiahRingkas, useExecutive, useHeatmap, useIncidents, persen } from '../ops/hooks';
import { useSession } from '../session/SessionProvider';

function levelOf(incidents: Incident[]): MapPointLevel {
  for (const s of SEVERITIES) if (incidents.some((i) => i.severity === s)) return s;
  return 'Kosong';
}

function usePoints(heat: HeatPoint[] | undefined, verified: Incident[] | undefined): MapPoint[] {
  return useMemo(
    () =>
      (heat ?? []).map((h) => {
        const rows = (verified ?? []).filter((i) => i.wkId === h.wkId);
        return { id: h.wkId, lat: h.lat, lng: h.lng, value: h.jumlah, level: levelOf(rows), label: `${h.wkNama}, ${h.orgNama}: ${h.jumlah} insiden terverifikasi, ${h.kritisTinggi} kritis atau tinggi`, caption: `${h.wkNama} · ${h.jumlah}` };
      }),
    [heat, verified],
  );
}

function MapLegend() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-muted">
      <span>Ukuran titik = jumlah insiden terverifikasi. Warna = keparahan tertinggi di area:</span>
      {SEVERITIES.map((s) => (
        <SeverityBadge key={s} level={s} />
      ))}
    </p>
  );
}

export function DasborEksekutifPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const ex = useExecutive();
  const heat = useHeatmap();
  const verified = useIncidents({ verifiedOnly: true });
  const points = usePoints(heat.data, verified.data);
  const skk = !!session?.user.roles.some((r) => r === 'R-01' || r === 'R-02');
  const e = ex.data;
  if (!e) {
    return (
      <>
        <PageHeader title="Dasbor eksekutif" />
        <PageBody>
          <p className="text-body-dense text-ink-muted">Memuat…</p>
        </PageBody>
      </>
    );
  }
  const kritisTerbuka = e.isuKritis.length;
  const finding = `${kritisTerbuka} insiden kritis/tinggi masih ditangani, ${e.belumTerverifikasi.length} menunggu verifikasi, dan ${e.kontrak.akanBerakhir} kontrak BUJP berakhir dalam 12 bulan.`;
  const maxOrg = Math.max(1, ...e.perOrg.map((o) => o.insiden));
  return (
    <>
      <PageHeader title="Dasbor eksekutif" summary={finding} />
      <PageBody>
        <Section className="border border-border" title="Keamanan" description={`${skk ? 'Lintas KKKS' : 'Organisasi Anda'} · hanya data terverifikasi Pejabat Berwenang KKKS.`}>
          <MetricStrip
            metrics={[
              { key: 'ins', label: 'Insiden terverifikasi', value: e.insidenTerverifikasi, context: `${e.insidenTerbuka} masih ditangani`, to: '/insiden' },
              { key: 'kt', label: 'Kritis & tinggi', value: e.insidenKritisTinggi, context: `${e.perSeverity.Kritis} kritis · ${e.perSeverity.Tinggi} tinggi`, bad: e.insidenKritisTinggi > 0, to: '/insiden' },
              { key: 'risk', label: 'Risiko tinggi & kritis', value: e.risiko.tinggi + e.risiko.kritis, context: `${e.risiko.kritis} kritis · ilustrasi modul Risiko`, to: '/risiko' },
              { key: 'tl', label: 'Tindak lanjut terlambat', value: e.tindakLanjut.terlambat, context: `${e.tindakLanjut.terbuka} masih terbuka`, bad: e.tindakLanjut.terlambat > 0, to: '/tindak-lanjut' },
            ]}
          />
        </Section>

        {e.belumTerverifikasi.length > 0 && (
          <Section className="border border-border" title="Belum terverifikasi" description="Insiden tinggi/kritis dari jalur cepat. Tidak dihitung di statistik sampai diverifikasi KKKS.">
            <div className="flex flex-col">
              {e.belumTerverifikasi.map((i) => (
                <QueueItem key={i.id} to={`/insiden/${i.id}`} severity={<SeverityBadge level={i.severity} />} source={i.orgNama} time={formatRelatif(i.dilaporkanPada)} title={`${i.kode} · ${i.judul}`} status={<WorkflowStatus label="Belum terverifikasi" tone="caution" />} />
              ))}
            </div>
          </Section>
        )}

        <div className="grid gap-5 xl:grid-cols-[3fr_2fr]">
          <Section
            className="border border-border"
            title="Peta panas insiden"
            action={
              <Link to="/peta-panas" className="flex items-center gap-1 text-body-dense font-semibold text-ink underline">
                Buka peta panas <ArrowRight aria-hidden size={14} strokeWidth={1.8} />
              </Link>
            }
          >
            <div className="flex flex-col gap-3">
              <IndonesiaMap label="Peta panas insiden terverifikasi per wilayah kerja" points={points} onSelect={(id) => navigate(`/peta-panas?wk=${id}`)} />
              <MapLegend />
            </div>
          </Section>
          <div className="flex flex-col gap-5">
            <Section className="border border-border" title="Isu kritis">
              {e.isuKritis.length === 0 ? (
                <p className="text-body-dense text-ink-muted">Tidak ada isu kritis terbuka.</p>
              ) : (
                <ul className="flex flex-col">
                  {e.isuKritis.map((x) => (
                    <li key={x.link} className="border-b border-border-subtle last:border-b-0">
                      <Link to={x.link} className="flex items-center gap-3 py-2 hover:underline">
                        <SeverityBadge level={x.severity} />
                        <span className="text-body-dense text-ink">{x.judul}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section className="border border-border" title="Peringatan dini">
              <ul className="flex flex-col">
                {e.peringatanDini.map((p) => (
                  <li key={p.judul} className="flex flex-col gap-1 border-b border-border-subtle py-2 last:border-b-0">
                    <span className="text-body-dense text-ink">{p.judul}</span>
                    <span className="text-caption text-ink-subtle">
                      {p.sumber} · <span className="font-mono">{formatRelatif(p.at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>

        {skk && (
          <Section className="border border-border" title="Insiden per KKKS" description="Insiden terverifikasi; panjang batang = jumlah, garis tipis = rata-rata.">
            <ThresholdBar
              legend="Garis tipis = rata-rata insiden per KKKS. Batang berwarna = KKKS dengan insiden kritis/tinggi di atas 2."
              threshold={e.perOrg.reduce((s, o) => s + o.insiden, 0) / Math.max(1, e.perOrg.length)}
              max={maxOrg * 1.15}
              rows={[...e.perOrg]
                .sort((a, b) => a.insiden - b.insiden)
                .map((o) => ({ key: o.orgId, label: o.orgNama, value: o.insiden, valueLabel: `${o.insiden} insiden · ${o.kritisTinggi} kritis/tinggi`, abnormal: o.kritisTinggi > 2 }))}
            />
          </Section>
        )}

        <div className="grid gap-5 xl:grid-cols-2">
          <Section className="border border-border" title="Anggaran pengamanan (WP&B)" action={<Link to="/wpb" className="text-body-dense font-semibold text-ink underline">Lihat rincian</Link>}>
            <MetricStrip
              metrics={[
                { key: 'ren', label: 'Rencana s.d. periode ini', value: rupiahRingkas(e.anggaran.disepakati) },
                { key: 'real', label: 'Realisasi', value: rupiahRingkas(e.anggaran.realisasi), context: `Utilisasi ${persen(e.anggaran.disepakati ? e.anggaran.realisasi / e.anggaran.disepakati : 0)}` },
                { key: 'dev', label: 'Kategori menyimpang > 10%', value: e.anggaran.deviasiKategori, bad: e.anggaran.deviasiKategori > 0 },
              ]}
            />
          </Section>
          <Section className="border border-border" title="Kemitraan" action={<Link to="/kontrak" className="text-body-dense font-semibold text-ink underline">Lihat kontrak</Link>}>
            <MetricStrip
              metrics={[
                { key: 'kon', label: 'Kontrak BUJP aktif', value: e.kontrak.aktif + e.kontrak.akanBerakhir, context: `${e.kontrak.akanBerakhir} berakhir dalam 12 bulan`, bad: e.kontrak.akanBerakhir > 0, to: '/kontrak' },
                { key: 'kon-end', label: 'Kontrak berakhir', value: e.kontrak.berakhir, to: '/kontrak' },
                { key: 'pks', label: 'PKS/PKT aktif', value: e.pks.aktif + e.pks.akanBerakhir, context: `${e.pks.akanBerakhir} berakhir dalam 12 bulan`, bad: e.pks.akanBerakhir > 0, to: '/pks-pkt' },
              ]}
            />
          </Section>
        </div>
      </PageBody>
    </>
  );
}

export function PetaPanasPage() {
  const [params, setParams] = useSearchParams();
  const heat = useHeatmap();
  const verified = useIncidents({ verifiedOnly: true });
  const points = usePoints(heat.data, verified.data);
  const wk = params.get('wk') ?? undefined;
  const sel = heat.data?.find((h) => h.wkId === wk);
  const rows = (verified.data ?? []).filter((i) => i.wkId === wk);
  return (
    <>
      <PageHeader title="Peta panas" summary="Sebaran insiden terverifikasi per wilayah kerja. Pilih titik untuk melihat insiden di area itu." />
      <PageBody>
        <div className="grid gap-5 xl:grid-cols-[3fr_2fr]">
          <Section className="border border-border">
            <div className="flex flex-col gap-3">
              <IndonesiaMap label="Peta panas insiden terverifikasi per wilayah kerja" points={points} selectedId={wk} onSelect={(id) => setParams({ wk: id }, { replace: true })} />
              <MapLegend />
              <p className="text-caption text-ink-subtle">Garis pulau disederhanakan; ilustrasi kick-off, bukan peta resmi.</p>
            </div>
          </Section>
          <Section className="border border-border" title={sel ? sel.wkNama : 'Pilih area di peta'} description={sel ? `${sel.orgNama} · ${sel.provinsi} · ${sel.jumlah} insiden terverifikasi` : 'Daftar insiden muncul di sini.'}>
            {!sel ? (
              <EmptyState title="Belum ada area yang dipilih." className="py-6" />
            ) : rows.length === 0 ? (
              <EmptyState title="Tidak ada insiden terverifikasi di area ini." className="py-6" />
            ) : (
              <div className="flex flex-col">
                {rows.map((i) => (
                  <QueueItem
                    key={i.id}
                    to={`/insiden/${i.id}`}
                    severity={<SeverityBadge level={i.severity} />}
                    source={i.lokasiNama}
                    time={formatTanggalJam(i.waktu)}
                    title={`${i.kode} · ${i.judul}`}
                    status={<WorkflowStatus label={i.status} tone={INCIDENT_TONE[i.status]} />}
                  />
                ))}
              </div>
            )}
          </Section>
        </div>
      </PageBody>
    </>
  );
}
