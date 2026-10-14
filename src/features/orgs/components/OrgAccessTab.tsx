/**
 * Tab Akses panel organisasi — PRD Kelola Organisasi KKKS 4.3 (FR-ORG-12), 4.7 (FR-ORG-24..30), Design Brief B2/B5.
 * Domain email: satu baris per domain (mono, jumlah pengguna, Hapus), penghitung n/20, tambah domain; domain terakhir
 * KKKS tidak dapat dihapus. Email diizinkan: badge Aktif/Kedaluwarsa/Pribadi/Tidak diperlukan lagi, tanggal berlaku,
 * alasan (tidak tampil untuk PIC), jumlah akun, Ubah tanggal dan Hapus. Pembatasan IP tidak dibangun (Q-9).
 * Mode baca untuk PIC KKKS (FR-ORG-20).
 */
import { Plus } from 'lucide-react';
import { AccountStatusBadge } from '@/components/patterns/AccountStatusBadge';
import type { StatusTone } from '@/lib/status';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmDialog, Dialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Textarea } from '@/components/ui/Textarea';
import { formatTanggal } from '@/lib/format';
import { DOMAIN_PATTERN, EMAIL_PATTERN, MAX_DOMAINS, emailDomainOf, isPersonalDomain, maxAllowDate, normDomain } from '@/lib/org-rules';
import { ALASAN_LAINNYA_MAX, ALASAN_NONAKTIF } from '@/lib/user-rules';
import { isServiceError, services, type AllowedEmail, type OrgDetail, type ReasonInput } from '@/services';
import { ReasonField, reasonValid } from '../../users/components/ReasonField';
import { orgCopy } from '../copy';
import { useOrgMutation } from '../hooks';

const c = orgCopy.akses;
const e = orgCopy.e;
const todayWib = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());

function Badge({ children, tone = 'muted' }: { children: string; tone?: StatusTone }) {
  return <AccountStatusBadge label={children} tone={tone} />;
}

/** Kepala seksi seragam: judul + angka di kanan (atau tombol aksi), keterangan di bawah. */
function SectionHeader({ title, meta, hint, action }: { title: string; meta?: string; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 pb-1">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-baseline gap-2 text-heading-3 text-ink">
          {title}
          {meta && <span className="font-mono text-caption font-normal text-ink-subtle">{meta}</span>}
        </h3>
        {action}
      </div>
      {hint && <p className="text-caption text-ink-subtle">{hint}</p>}
    </div>
  );
}

/** Aksi baris berupa tautan teks (pola "Ubah" di panel pengguna, Figma 109:16236). */
function LinkAction({ children, onClick, disabled, title, label }: { children: ReactNode; onClick: () => void; disabled?: boolean; title?: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
      className="shrink-0 text-body-dense font-semibold text-ink underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:text-ink-subtle disabled:no-underline"
    >
      {children}
    </button>
  );
}

function DomainSection({ org, canEdit }: { org: OrgDetail; canEdit: boolean }) {
  const toast = useToast();
  const [baru, setBaru] = useState('');
  const [err, setErr] = useState<string>();
  const [warn, setWarn] = useState<string>();
  const [hapus, setHapus] = useState<OrgDetail['domainDetail'][number] | null>(null);
  const add = useOrgMutation((d: string) => services.orgs.addDomain(org.kode, d));
  const remove = useOrgMutation((d: string) => services.orgs.removeDomain(org.kode, d));
  const penuh = org.domains.length >= MAX_DOMAINS;
  const terakhir = org.jenis === 'KKKS' && org.domains.length === 1;

  async function submit() {
    const d = normDomain(baru);
    setWarn(undefined);
    if (!DOMAIN_PATTERN.test(d)) return setErr(e.domainFormat);
    if (isPersonalDomain(d)) return setErr(e.domainPribadi);
    if (org.domains.includes(d)) return setErr(e.domainGanda);
    const elsewhere = await services.orgs.domainUsedElsewhere(d, org.kode);
    add.mutate(d, {
      onSuccess: () => {
        setBaru('');
        if (elsewhere) setWarn(`${d}: ${e.domainDipakaiLain}`);
        toast.show({ title: orgCopy.panel.toastUbah });
      },
      onError: (x) => setErr(isServiceError(x, 'DOMAIN_LIMIT') ? e.domainBatas : isServiceError(x, 'DOMAIN_DUPLICATE') ? e.domainGanda : orgCopy.panel.gagalUbah),
    });
  }

  return (
    <section className="flex flex-col gap-2">
      <SectionHeader title={c.domainJudul} meta={c.domainCounter(org.domains.length)} hint={penuh ? e.domainBatas : orgCopy.tambahDialog.domainHint} />
      <ul className="flex flex-col border-t border-border-subtle">
        {org.domainDetail.map((d) => (
          <li key={d.domain} className="flex items-center gap-3 border-b border-border-subtle py-3">
            <span className="min-w-0 flex-1 break-all font-mono text-body-dense text-ink">{d.domain}</span>
            <span className="shrink-0 text-caption text-ink-muted">{c.domainPengguna(d.pengguna)}</span>
            {canEdit && (
              <LinkAction disabled={terakhir} title={terakhir ? e.domainTerakhir : undefined} label={terakhir ? `${c.hapus} ${d.domain}. ${e.domainTerakhir}` : `${c.hapus} ${d.domain}`} onClick={() => setHapus(d)}>
                {c.hapus}
              </LinkAction>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <div className="flex items-start gap-2 pt-1">
          <TextField
            label={c.domainBaru}
            hideLabel
            placeholder={orgCopy.tambahDialog.domainPlaceholder.replace(' lalu Enter', '')}
            className="font-mono"
            value={baru}
            disabled={penuh}
            onChange={(x) => (setBaru(x.target.value), setErr(undefined))}
            onKeyDown={(x) => x.key === 'Enter' && (x.preventDefault(), void submit())}
            error={err}
            containerClassName="flex-1"
          />
          <Button icon={<Plus aria-hidden size={14} strokeWidth={1.8} />} onClick={() => void submit()} disabled={penuh || !baru.trim()} loading={add.isPending} loadingLabel={orgCopy.tambahDialog.menyimpan}>
            {c.tambahSingkat}
          </Button>
        </div>
      )}
      {warn && <p className="text-caption text-caution-ink">{warn}</p>}
      {hapus && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && !remove.isPending && setHapus(null)}
          title={c.hapusDomainJudul(hapus.domain)}
          description={c.hapusDomainIsi(hapus.pengguna, hapus.undanganTertunda)}
          closeLabel={orgCopy.panel.batal}
          cancelLabel={orgCopy.panel.batal}
          confirmLabel={c.hapusDomain}
          destructive
          loading={remove.isPending}
          loadingLabel={orgCopy.tambahDialog.menyimpan}
          onConfirm={() => remove.mutate(hapus.domain, { onSuccess: () => setHapus(null) })}
        />
      )}
    </section>
  );
}

function AllowedEmailDialog({ org, entry, onClose }: { org: OrgDetail; entry?: AllowedEmail; onClose: () => void }) {
  const toast = useToast();
  const [email, setEmail] = useState(entry?.email ?? '');
  const [alasan, setAlasan] = useState('');
  const [tanggal, setTanggal] = useState(entry?.berlakuSampai ?? '');
  const [errors, setErrors] = useState<Partial<Record<'email' | 'alasan' | 'tanggal', string>>>({});
  const m = useOrgMutation(() =>
    entry ? services.orgs.updateAllowedEmail(org.kode, entry.id, tanggal || undefined) : services.orgs.addAllowedEmail(org.kode, { email, alasan, berlakuSampai: tanggal || undefined }),
  );
  const max = maxAllowDate();

  function submit() {
    const x: typeof errors = {};
    const em = email.trim().toLowerCase();
    if (!entry) {
      if (!EMAIL_PATTERN.test(em)) x.email = e.emailFormat;
      else if (org.domains.includes(emailDomainOf(em))) x.email = e.emailDomainTerdaftar(emailDomainOf(em));
      if (!alasan.trim()) x.alasan = e.alasanKosong;
    }
    if (isPersonalDomain(emailDomainOf(entry?.email ?? em)) && !tanggal) x.tanggal = e.emailPribadiTanggal;
    else if (tanggal && (tanggal < todayWib() || tanggal > max)) x.tanggal = e.tanggalSalah;
    setErrors(x);
    if (Object.keys(x).length) return;
    m.mutate(undefined, {
      onSuccess: () => {
        toast.show({ title: entry ? c.toastUbahEmail : c.toastEmail });
        onClose();
      },
      onError: (err) => {
        if (isServiceError(err, 'EMAIL_DOMAIN_REGISTERED')) setErrors({ email: e.emailDomainTerdaftar(err.meta.value ?? '') });
        else if (isServiceError(err, 'EMAIL_OTHER_ORG')) setErrors({ email: e.emailOrgLain });
        else if (isServiceError(err, 'ALLOW_DATE_REQUIRED')) setErrors({ tanggal: e.emailPribadiTanggal });
        else if (isServiceError(err, 'VALIDATION') && err.meta.field === 'berlakuSampai') setErrors({ tanggal: e.tanggalSalah });
        else setErrors({ email: orgCopy.panel.gagalUbah });
      },
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={entry ? c.emailUbahJudul : c.emailDialogJudul}
      description={entry ? <span className="font-mono">{entry.email}</span> : c.emailHelper}
      closeLabel={orgCopy.panel.batal}
      footer={
        <>
          <Button onClick={onClose} disabled={m.isPending}>
            {orgCopy.panel.batal}
          </Button>
          <Button variant="primary" onClick={submit} loading={m.isPending} loadingLabel={orgCopy.tambahDialog.menyimpan}>
            {entry ? orgCopy.panel.simpan : c.tambahEmail}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!entry && (
          <>
            <TextField label={c.email} required showRequired type="email" className="font-mono" value={email} onChange={(x) => (setEmail(x.target.value), setErrors((p) => ({ ...p, email: undefined })))} error={errors.email} />
            <Textarea label={c.alasan} required maxLength={ALASAN_LAINNYA_MAX} showCount value={alasan} onChange={(x) => (setAlasan(x.target.value), setErrors((p) => ({ ...p, alasan: undefined })))} error={errors.alasan} />
          </>
        )}
        <TextField
          label={c.berlaku}
          type="date"
          min={todayWib()}
          max={max}
          value={tanggal}
          onChange={(x) => (setTanggal(x.target.value), setErrors((p) => ({ ...p, tanggal: undefined })))}
          hint={entry ? c.ubahTanggalKonfirmasi(entry.akunAktif) || c.berlakuHint : c.berlakuHint}
          error={errors.tanggal}
        />
      </div>
    </Dialog>
  );
}

function RemoveAllowedEmailDialog({ org, entry, onClose }: { org: OrgDetail; entry: AllowedEmail; onClose: () => void }) {
  const [nonaktifkan, setNonaktifkan] = useState(true);
  const [reason, setReason] = useState<ReasonInput>({ alasan: '' });
  const [touched, setTouched] = useState(false);
  const m = useOrgMutation(() => services.orgs.removeAllowedEmail(org.kode, entry.id, { nonaktifkanAkun: entry.akunAktif > 0 && nonaktifkan, alasan: reason }));
  const needReason = entry.akunAktif > 0 && nonaktifkan;
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={c.hapusEmailJudul(entry.email)}
      description={entry.akunAktif > 0 ? c.hapusEmailAktif : undefined}
      closeLabel={orgCopy.panel.batal}
      cancelLabel={orgCopy.panel.batal}
      confirmLabel={c.hapusEmail}
      destructive
      loading={m.isPending}
      loadingLabel={orgCopy.tambahDialog.menyimpan}
      onConfirm={() => {
        setTouched(true);
        if (needReason && !reasonValid(reason)) return;
        m.mutate(undefined, { onSuccess: onClose });
      }}
    >
      {entry.akunAktif > 0 && (
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-body-dense text-ink">
            <input type="checkbox" checked={nonaktifkan} onChange={(x) => setNonaktifkan(x.target.checked)} className="h-4 w-4 accent-[var(--color-action)]" />
            {c.nonaktifkanAkun}
          </label>
          {nonaktifkan ? (
            <ReasonField label={c.alasanNonaktif} placeholder={c.alasanNonaktifPlaceholder} options={Object.keys(ALASAN_NONAKTIF)} value={reason} onChange={setReason} showErrors={touched} />
          ) : (
            <p className="text-body-dense text-ink-muted">
              {c.akunTetapAktif(entry.berlakuSampai ? formatTanggal(`${entry.berlakuSampai}T12:00:00+07:00`) : c.tanpaBatas)}{' '}
              <Link to={`/pengguna?cari=${encodeURIComponent(entry.email)}`} className="font-semibold text-ink underline">
                {c.lihatPengguna}
              </Link>
            </p>
          )}
        </div>
      )}
    </ConfirmDialog>
  );
}

function EmailSection({ org, canEdit }: { org: OrgDetail; canEdit: boolean }) {
  const [dialog, setDialog] = useState<{ kind: 'add' } | { kind: 'edit' | 'remove'; entry: AllowedEmail } | null>(null);
  return (
    <section className="flex flex-col gap-2">
      <SectionHeader
        title={orgCopy.akses.emailJudul}
        meta={String(org.emailDiizinkanDaftar.length)}
        hint={c.emailHelper}
        action={
          canEdit ? (
            <Button icon={<Plus aria-hidden size={14} strokeWidth={1.8} />} onClick={() => setDialog({ kind: 'add' })}>
              {c.tambahEmail}
            </Button>
          ) : undefined
        }
      />
      {org.emailDiizinkanDaftar.length === 0 ? (
        <p className="border-t border-border-subtle py-3 text-body-dense text-ink-muted">{c.emailKosong}</p>
      ) : (
        <ul className="flex flex-col border-t border-border-subtle">
          {org.emailDiizinkanDaftar.map((x) => (
            <li key={x.id} className="flex flex-col gap-1 border-b border-border-subtle py-3">
              <div className="flex items-start gap-3">
                <span className="min-w-0 flex-1 break-all font-mono text-body-dense text-ink">{x.email}</span>
                {canEdit && (
                  <span className="flex shrink-0 gap-3">
                    <LinkAction label={`${c.ubahTanggal} ${x.email}`} onClick={() => setDialog({ kind: 'edit', entry: x })}>
                      {c.ubahTanggal}
                    </LinkAction>
                    <LinkAction label={`${c.hapus} ${x.email}`} onClick={() => setDialog({ kind: 'remove', entry: x })}>
                      {c.hapus}
                    </LinkAction>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-ink-muted">
                {x.status === 'Aktif' ? <Badge tone="success">{orgCopy.aktif}</Badge> : <Badge tone={x.status === 'Kedaluwarsa' ? 'warning' : 'muted'}>{x.status}</Badge>}
                {x.pribadi && <Badge tone="muted">{c.pribadi}</Badge>}
                <span>{x.berlakuSampai ? c.berlakuSampai(formatTanggal(`${x.berlakuSampai}T12:00:00+07:00`)) : c.tanpaBatas}</span>
                <span aria-hidden>·</span>
                <span>{c.akunTerkait(x.akunAktif)}</span>
              </div>
              {x.alasan && <p className="text-caption text-ink-muted">{c.alasanLabel(x.alasan)}</p>}
            </li>
          ))}
        </ul>
      )}
      {dialog?.kind === 'add' && <AllowedEmailDialog org={org} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'edit' && <AllowedEmailDialog org={org} entry={dialog.entry} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'remove' && <RemoveAllowedEmailDialog org={org} entry={dialog.entry} onClose={() => setDialog(null)} />}
    </section>
  );
}

export function OrgAccessTab({ org, canEdit }: { org: OrgDetail; canEdit: boolean }) {
  return (
    <div className="flex flex-col gap-8">
      <DomainSection org={org} canEdit={canEdit} />
      <EmailSection org={org} canEdit={canEdit} />
      <p className="text-caption text-ink-subtle">{c.ipCatatan}</p>
    </div>
  );
}
