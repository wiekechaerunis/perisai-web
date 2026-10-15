/**
 * Dialog Tambah organisasi — PRD Kelola Organisasi KKKS FR-ORG-05..09, Tabel O-1, E-ORG, Design Brief B3 (lebar 560
 * seperti dialog Undang). Tidak ada Figma (PR-11). Kode terisi otomatis (KKKS-nnn) dan dapat diganti; domain sebagai
 * chip yang divalidasi satu per satu (merah: format/pribadi/ganda; kuning: dipakai organisasi lain, FR-ORG-07).
 * Penyimpanan bersifat utuh (FR-ORG-09): gagal → alert, isian tidak hilang.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Callout } from '@/components/patterns/Callout';
import { ChipInput, type ChipItem } from '@/components/patterns/ChipInput';
import { Dialog } from '@/components/patterns/Dialog';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import {
  BADAN_HUKUM_MAX,
  DOMAIN_PATTERN,
  KODE_PATTERN,
  MAX_DOMAINS,
  ORG_NAMA_MAX,
  ORG_NAMA_MIN,
  SKEMA_KONTRAK,
  isPersonalDomain,
  normDomain,
  type SkemaKontrak,
} from '@/lib/org-rules';
import { isServiceError, services, type OrgDetail } from '@/services';
import { orgCopy } from '../copy';
import { useOrgMutation } from '../hooks';

const c = orgCopy.tambahDialog;
const e = orgCopy.e;
type Errors = Partial<Record<'nama' | 'kode' | 'badanHukum' | 'domain', string>>;

export function AddOrgDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (o: OrgDetail) => void }) {
  const [nama, setNama] = useState('');
  const [kode, setKode] = useState('');
  const [badanHukum, setBadanHukum] = useState('');
  const [skema, setSkema] = useState<SkemaKontrak | undefined>();
  const [chips, setChips] = useState<ChipItem[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [alert, setAlert] = useState(false);
  const create = useOrgMutation(() =>
    services.orgs.create({ nama, kode, badanHukum: badanHukum || undefined, skema, domains: chips.filter((x) => x.tone !== 'error').map((x) => x.value) }),
  );

  useEffect(() => {
    if (!open) return;
    setNama('');
    setBadanHukum('');
    setSkema(undefined);
    setChips([]);
    setErrors({});
    setAlert(false);
    create.reset();
    void services.orgs.nextKode().then(setKode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function addDomain(raw: string) {
    const d = normDomain(raw);
    setErrors((p) => ({ ...p, domain: undefined }));
    if (chips.some((x) => x.value === d)) {
      setChips((p) => p.map((x) => (x.value === d ? { ...x, tone: 'error', message: e.domainGanda } : x)));
      return;
    }
    if (chips.length >= MAX_DOMAINS) return setErrors((p) => ({ ...p, domain: e.domainBatas }));
    if (!DOMAIN_PATTERN.test(d)) return setChips((p) => [...p, { value: d, tone: 'error', message: e.domainFormat }]);
    if (isPersonalDomain(d)) return setChips((p) => [...p, { value: d, tone: 'error', message: e.domainPribadi }]);
    setChips((p) => [...p, { value: d }]);
    // FR-ORG-07: peringatan kuning bila dipakai organisasi lain; penyimpanan tetap dapat dilanjutkan.
    if (await services.orgs.domainUsedElsewhere(d)) {
      setChips((p) => p.map((x) => (x.value === d ? { ...x, tone: 'warning', message: e.domainDipakaiLain } : x)));
    }
  }

  function validate(): Errors {
    const x: Errors = {};
    const n = nama.trim();
    if (!n) x.nama = e.namaKosong;
    else if (n.length < ORG_NAMA_MIN || n.length > ORG_NAMA_MAX) x.nama = e.namaPanjang;
    const k = kode.trim().toUpperCase();
    if (!k) x.kode = e.kodeKosong;
    else if (!KODE_PATTERN.test(k)) x.kode = e.kodeFormat;
    if (badanHukum.length > BADAN_HUKUM_MAX) x.badanHukum = e.badanHukumPanjang;
    if (!chips.some((y) => y.tone !== 'error')) x.domain = e.domainKosong;
    return x;
  }

  function submit(ev: FormEvent) {
    ev.preventDefault();
    const x = validate();
    setErrors(x);
    setAlert(false);
    if (Object.keys(x).length || chips.some((y) => y.tone === 'error')) return;
    create.mutate(undefined, {
      onSuccess: (o) => onCreated(o),
      onError: (err) => {
        if (isServiceError(err, 'ORG_NAME_TAKEN')) setErrors({ nama: e.namaDipakai });
        else if (isServiceError(err, 'ORG_CODE_TAKEN')) setErrors({ kode: e.kodeDipakai });
        else if (isServiceError(err, 'VALIDATION') && err.meta.field === 'kode') setErrors({ kode: e.kodeFormat });
        else setAlert(true);
      },
    });
  }

  const busy = create.isPending;
  const filled = nama.trim() && kode.trim() && chips.some((y) => y.tone !== 'error');

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      title={c.judul}
      description={c.deskripsi}
      closeLabel={c.batal}
      footer={
        <>
          <Button onClick={() => onOpenChange(false)} disabled={busy}>
            {c.batal}
          </Button>
          <Button variant="primary" type="submit" form="form-tambah-org" disabled={!filled} loading={busy} loadingLabel={c.menyimpan}>
            {c.simpan}
          </Button>
        </>
      }
    >
      <form id="form-tambah-org" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {alert && (
          <Callout variant="error" size="compact">
            {e.gagalTambah}
          </Callout>
        )}
        <fieldset disabled={busy} className="flex flex-col gap-4 disabled:opacity-60">
          <TextField label={c.nama} required showRequired placeholder={c.namaPlaceholder} value={nama} onChange={(x) => (setNama(x.target.value), setErrors((p) => ({ ...p, nama: undefined })))} error={errors.nama} />
          <TextField
            label={c.kode}
            required
            showRequired
            className="font-mono"
            value={kode}
            onChange={(x) => (setKode(x.target.value.toUpperCase()), setErrors((p) => ({ ...p, kode: undefined })))}
            hint={c.kodeHint}
            error={errors.kode}
          />
          <TextField
            label={
              <>
                {c.badanHukum} <span className="text-ink-subtle">{c.opsional}</span>
              </>
            }
            placeholder={c.badanHukumPlaceholder}
            value={badanHukum}
            onChange={(x) => (setBadanHukum(x.target.value), setErrors((p) => ({ ...p, badanHukum: undefined })))}
            error={errors.badanHukum}
          />
          <Select
            label={
              <>
                {c.skema} <span className="text-ink-subtle">{c.opsional}</span>
              </>
            }
            placeholder={c.skemaPlaceholder}
            value={skema}
            onValueChange={(v) => setSkema(v as SkemaKontrak)}
            options={SKEMA_KONTRAK.map((s) => ({ value: s, label: s }))}
          />
          <ChipInput
            label={c.domain}
            required
            showRequired
            mono
            chips={chips}
            onAdd={(raw) => void addDomain(raw)}
            onRemove={(v) => setChips((p) => p.filter((x) => x.value !== v))}
            removeLabel={c.hapusChip}
            placeholder={c.domainPlaceholder}
            hint={c.domainHint}
            error={errors.domain}
          />
        </fieldset>
      </form>
    </Dialog>
  );
}
