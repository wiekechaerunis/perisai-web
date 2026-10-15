/**
 * Lapor insiden — PRD Garis Besar tab 06, INS-01 (deliverable Mobile/Field Reporting). Alur demo 2 kick-off.
 * Tampilan ponsel diutamakan: satu kolom, kontrol besar (`control-lg`), foto dari kamera. Field: jenis, tingkat
 * keparahan, lokasi dari daftar profil, waktu, kronologi, foto. Hanya Pelapor KKKS (M-05 create).
 * Tinggi/kritis langsung diberitahukan ke Pengawas & Pimpinan SKK dengan label "Belum terverifikasi" (BR-INS-04).
 * Di luar cakupan prototype: validasi lengkap, offline, GPS.
 */
import { useMutation } from '@tanstack/react-query';
import { Camera, CheckCircle2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { Callout } from '@/components/patterns/Callout';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { TextField } from '@/components/ui/TextField';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/cn';
import { INCIDENT_TYPES, SEVERITIES, services, type Incident, type IncidentType, type Severity } from '@/services';
import { useInvalidateOps, useOpsRefs } from '../ops/hooks';

function localNow(): string {
  const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

export function LaporInsidenPage() {
  const refs = useOpsRefs();
  const invalidate = useInvalidateOps();
  const navigate = useNavigate();
  const [jenis, setJenis] = useState<IncidentType>(INCIDENT_TYPES[0]);
  const [severity, setSeverity] = useState<Severity>('Sedang');
  const [lokasiId, setLokasiId] = useState('');
  const [waktu, setWaktu] = useState(localNow);
  const [kronologi, setKronologi] = useState('');
  const [foto, setFoto] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<Incident | null>(null);
  const m = useMutation({
    mutationFn: () => services.ops.incidents.report({ jenis, severity, lokasiId, waktu: new Date(waktu).toISOString(), kronologi, foto }),
    onSuccess: (inc) => {
      invalidate();
      setDone(inc);
    },
    onError: () => setError('Laporan belum terkirim. Periksa isian lalu kirim lagi.'),
  });

  function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!lokasiId || !kronologi.trim()) return setError('Pilih lokasi dan isi kronologi singkat.');
    setError(undefined);
    m.mutate();
  }

  if (done) {
    const cepat = done.severity === 'Kritis' || done.severity === 'Tinggi';
    return (
      <>
        <PageHeader title="Laporan terkirim" back={{ to: '/ruang-kerja', label: 'Kembali ke Ruang kerja' }} />
        <PageBody>
          <Section className="mx-auto w-full max-w-[560px] border border-border">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 aria-hidden size={40} strokeWidth={1.8} className="text-status-success-ink" />
              <p className="font-mono text-body-dense text-ink-muted">{done.kode}</p>
              <p className="text-heading-2 text-ink">{done.judul}</p>
              <SeverityBadge level={done.severity} />
              <p className="text-body-dense text-ink-muted">
                Laporan menunggu verifikasi Pejabat Berwenang KKKS.
                {cepat && ' Karena tingkatnya ' + done.severity.toLowerCase() + ', Pengawas SKK dan Pimpinan SKK sudah diberi tahu dengan label "Belum terverifikasi".'}
              </p>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                <Button size="lg" onClick={() => navigate(`/insiden/${done.id}`)}>
                  Lihat laporan
                </Button>
                <Button size="lg" variant="quiet" onClick={() => (setDone(null), setKronologi(''), setFoto([]), setLokasiId(''))}>
                  Lapor insiden lain
                </Button>
              </div>
            </div>
          </Section>
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Lapor insiden" summary="Laporkan segera dari lokasi. Detail dapat dilengkapi saat verifikasi." back={{ to: '/ruang-kerja', label: 'Kembali ke Ruang kerja' }} />
      <PageBody>
        <form noValidate onSubmit={submit} className="mx-auto flex w-full max-w-[560px] flex-col gap-5">
          {error && (
            <Callout variant="error" size="compact">
              {error}
            </Callout>
          )}
          <Section className="border border-border">
            <div className="flex flex-col gap-5">
              <Select label="Jenis insiden" value={jenis} onValueChange={(v) => setJenis(v as IncidentType)} options={INCIDENT_TYPES.map((t) => ({ value: t, label: t }))} />
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-label text-ink-muted">Tingkat keparahan</legend>
                <div className="grid grid-cols-2 gap-2">
                  {SEVERITIES.map((s) => (
                    <label
                      key={s}
                      className={cn(
                        'flex h-control-lg cursor-pointer items-center gap-2 rounded-md border px-3',
                        severity === s ? 'border-action bg-surface-selected' : 'border-border-control bg-surface',
                      )}
                    >
                      <input type="radio" name="severity" value={s} checked={severity === s} onChange={() => setSeverity(s)} className="h-4 w-4 accent-[var(--color-action)]" />
                      <SeverityBadge level={s} />
                    </label>
                  ))}
                </div>
                {(severity === 'Kritis' || severity === 'Tinggi') && <p className="text-caption text-ink-muted">Pengawas SKK dan Pimpinan SKK langsung diberi tahu setelah laporan terkirim.</p>}
              </fieldset>
              <Select
                label="Lokasi"
                placeholder="Pilih lokasi dari profil KKKS"
                value={lokasiId || undefined}
                onValueChange={setLokasiId}
                options={(refs.data?.lokasi ?? []).map((l) => ({ value: l.id, label: `${l.nama} · ${refs.data?.wk.find((w) => w.id === l.wkId)?.nama ?? ''}` }))}
              />
              <TextField label="Waktu kejadian" type="datetime-local" value={waktu} onChange={(e) => setWaktu(e.target.value)} />
              <Textarea label="Kronologi singkat" maxLength={1000} showCount rows={5} value={kronologi} onChange={(e) => setKronologi(e.target.value)} placeholder="Apa yang terjadi, siapa yang terlibat, tindakan awal yang sudah dilakukan." />
              <div className="flex flex-col gap-2">
                <span className="text-label text-ink-muted">Foto</span>
                <label className="flex h-control-lg cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border-control bg-surface text-body-dense font-medium text-ink hover:bg-surface-sunken">
                  <Camera aria-hidden size={18} strokeWidth={1.8} />
                  Ambil atau pilih foto
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="sr-only"
                    onChange={(e) => setFoto((prev) => [...prev, ...Array.from(e.target.files ?? []).map((f) => f.name)])}
                  />
                </label>
                {foto.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {foto.map((f, i) => (
                      <li key={`${f}-${i}`} className="rounded-sm border border-border bg-surface-sunken px-2 py-1 font-mono text-caption text-ink-muted">
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Section>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link to="/ruang-kerja" className="flex h-control-lg items-center justify-center rounded-md px-5 text-body font-medium text-ink hover:bg-surface-sunken">
              Batal
            </Link>
            <Button type="submit" variant="primary" size="lg" loading={m.isPending} loadingLabel="Mengirim…">
              Kirim laporan
            </Button>
          </div>
        </form>
      </PageBody>
    </>
  );
}
