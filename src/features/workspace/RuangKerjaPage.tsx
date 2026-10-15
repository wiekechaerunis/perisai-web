/**
 * Ruang Kerja (M-01) — PRD Garis Besar tab 04 (RKJ-01..03), alur demo 1 kick-off 21 Okt 2026.
 * - KKKS: "Tugas saya", "Kotak persetujuan" (Pejabat Berwenang KKKS), ringkasan organisasi sendiri.
 * - SKK Migas: ringkasan lintas KKKS + antrean "Menunggu Dokumen Bertanda Tangan" (BR-RKJ-02: Pengawas SKK hanya
 *   antrean dokumen bertanda tangan, tanpa aksi persetujuan). Insiden tinggi/kritis belum terverifikasi terpisah.
 * - Admin SKK / Admin Teknis: ringkasan akses (Core Platform FR-LG-25).
 */
import { Siren } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { EmptyState } from '@/components/patterns/EmptyState';
import { KeyValueList } from '@/components/patterns/KeyValueList';
import { MetricStrip } from '@/components/patterns/MetricStrip';
import { QueueItem } from '@/components/patterns/QueueItem';
import { Button } from '@/components/ui/Button';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { WorkflowStatus } from '@/components/ui/WorkflowStatus';
import { formatRelatif, formatTanggalJam } from '@/lib/format';
import { INCIDENT_TONE, WPB_TONE } from '@/lib/ops-status';
import { roleDef, roleName } from '@/lib/rbac';
import type { WorkItem, WpbStatus } from '@/services';
import { rupiahRingkas, useExecutive, useWorkspace, persen } from '../ops/hooks';
import { useSession } from '../session/SessionProvider';
import { workspaceCopy as c } from './copy';

function statusBadge(w: WorkItem) {
  if (w.jenis === 'Insiden') return <WorkflowStatus label={w.status} tone={INCIDENT_TONE[w.status as keyof typeof INCIDENT_TONE] ?? 'neutral'} />;
  if (w.jenis === 'WP&B') return <WorkflowStatus label={w.status} tone={WPB_TONE[w.status as WpbStatus] ?? 'neutral'} />;
  return <WorkflowStatus label={w.status} tone="warning" />;
}

function Queue({ items, empty }: { items: WorkItem[]; empty: string }) {
  if (items.length === 0) return <EmptyState title={empty} className="py-6" />;
  return (
    <div className="flex flex-col">
      {items.map((w) => (
        <QueueItem
          key={`${w.jenis}-${w.id}`}
          to={w.link}
          severity={w.severity ? <SeverityBadge level={w.severity} /> : undefined}
          source={w.jenis}
          time={formatRelatif(w.at)}
          title={w.judul}
          detail={w.keterangan}
          status={statusBadge(w)}
        />
      ))}
    </div>
  );
}

export function RuangKerjaPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const roles = session?.user.roles ?? [];
  const skk = roles.some((r) => r === 'R-01' || r === 'R-02');
  const kkks = roles.some((r) => r === 'R-04' || r === 'R-05' || r === 'R-06');
  const ws = useWorkspace();
  const ex = useExecutive();
  if (!session) return null;
  const { user } = session;
  const e = ex.data;
  const w = ws.data;

  const metrics = e
    ? [
        { key: 'ins', label: skk ? 'Insiden terverifikasi (lintas KKKS)' : 'Insiden terverifikasi', value: e.insidenTerverifikasi, context: `${e.insidenTerbuka} masih ditangani`, to: '/insiden' },
        { key: 'krit', label: 'Kritis & tinggi', value: e.insidenKritisTinggi, context: e.belumTerverifikasi.length ? `+${e.belumTerverifikasi.length} belum terverifikasi` : 'Semua sudah diverifikasi', bad: e.belumTerverifikasi.length > 0, to: '/insiden' },
        {
          key: 'wpb',
          label: 'Realisasi WP&B 2026',
          value: e.anggaran.disepakati ? persen(e.anggaran.realisasi / e.anggaran.disepakati) : '—',
          context: `${rupiahRingkas(e.anggaran.realisasi)} dari rencana ${rupiahRingkas(e.anggaran.disepakati)}`,
          to: '/wpb',
        },
        { key: 'kon', label: 'Kontrak BUJP akan berakhir', value: e.kontrak.akanBerakhir, context: `${e.kontrak.aktif} aktif · ${e.kontrak.berakhir} berakhir`, bad: e.kontrak.akanBerakhir > 0, to: '/kontrak' },
        { key: 'tl', label: 'Tindak lanjut terlambat', value: e.tindakLanjut.terlambat, context: `${e.tindakLanjut.terbuka} masih terbuka`, bad: e.tindakLanjut.terlambat > 0, to: '/tindak-lanjut' },
      ]
    : [];

  return (
    <>
      <PageHeader
        title={c.judul}
        summary={skk ? `Selamat datang, ${user.nama}. Ringkasan lintas KKKS sesuai cakupan Anda.` : kkks ? `Selamat datang, ${user.nama}. Ringkasan ${user.organisasi.nama}.` : c.ringkasan(user.nama)}
        actions={
          roles.includes('R-05') ? (
            <Button variant="primary" icon={<Siren aria-hidden size={16} strokeWidth={1.8} />} onClick={() => navigate('/lapor')}>
              Lapor insiden
            </Button>
          ) : undefined
        }
      />
      <PageBody>
        {(skk || kkks) && (
          <Section className="border border-border" title={skk ? 'Ringkasan lintas KKKS' : 'Ringkasan organisasi'} description="Hanya data yang sudah diverifikasi Pejabat Berwenang KKKS.">
            {ex.isPending ? <p className="text-body-dense text-ink-muted">{c.memuat}</p> : <MetricStrip metrics={metrics} />}
          </Section>
        )}

        {skk && e && e.belumTerverifikasi.length > 0 && (
          <Section className="border border-border" title="Insiden tinggi/kritis · Belum terverifikasi" description="Diterima lewat jalur cepat sebelum verifikasi KKKS. Belum masuk statistik resmi.">
            <div className="flex flex-col">
              {e.belumTerverifikasi.map((i) => (
                <QueueItem key={i.id} to={`/insiden/${i.id}`} severity={<SeverityBadge level={i.severity} />} source={i.orgNama} time={formatRelatif(i.dilaporkanPada)} title={`${i.kode} · ${i.judul}`} status={<WorkflowStatus label="Belum terverifikasi" tone="caution" />} />
              ))}
            </div>
          </Section>
        )}

        {skk && (
          <Section
            className="border border-border"
            title="Menunggu dokumen bertanda tangan"
            description={roles.includes('R-02') ? 'Berita acara yang sudah difinalisasi KKKS dan ditandatangani di luar sistem. Unggah dokumennya agar status menjadi Final.' : 'Diunggah oleh Pengawas SKK setelah ditandatangani di luar sistem.'}
          >
            {ws.isPending ? <p className="text-body-dense text-ink-muted">{c.memuat}</p> : <Queue items={w?.menungguDokumen ?? []} empty="Tidak ada dokumen yang menunggu." />}
          </Section>
        )}

        {kkks && (
          <div className="grid gap-5 xl:grid-cols-2">
            <Section className="border border-border" title={`Tugas saya${w ? ` · ${w.tugasSaya.length}` : ''}`}>
              {ws.isPending ? <p className="text-body-dense text-ink-muted">{c.memuat}</p> : <Queue items={w?.tugasSaya ?? []} empty="Tidak ada tugas untuk Anda." />}
            </Section>
            {roles.includes('R-06') && (
              <Section className="border border-border" title={`Kotak persetujuan${w ? ` · ${w.kotakPersetujuan.length}` : ''}`} description="Laporan dan pengajuan yang menunggu review Anda.">
                {ws.isPending ? <p className="text-body-dense text-ink-muted">{c.memuat}</p> : <Queue items={w?.kotakPersetujuan ?? []} empty="Tidak ada yang menunggu persetujuan." />}
              </Section>
            )}
          </div>
        )}

        {!skk && !kkks && (
          <Section title={c.aksesAnda} description={c.aksesKeterangan}>
            <KeyValueList
              items={[
                { key: 'role', label: c.role, value: user.roles.map((r) => `${r} ${roleName(r)}`).join(', ') },
                { key: 'org', label: c.organisasi, value: user.organisasi.nama },
                { key: 'cakupan', label: c.cakupan, value: user.roles.map((r) => roleDef(r).scope).join('; ') },
                { key: 'login', label: c.loginTerakhir, value: user.loginTerakhir ? formatTanggalJam(user.loginTerakhir) : '—', mono: true },
              ]}
            />
          </Section>
        )}
      </PageBody>
    </>
  );
}
