/**
 * Undang Pengguna — PRD tab a7315f64-20f0, ClickUp z8pmx9n515. Figma 49:220 (kosong), 66:3502 (PIC KKKS, tanpa
 * Organisasi), 51:827 (Organisasi bisa dicari), 51:828 (Role per organisasi), 213:402/478/554/625 (Wilayah Kerja,
 * peringatan > 2 tahun, galat SoD, galat WK), 66:3994 (loading), 66:3553 (gagal kirim).
 * FR-UP-02..21: field per Tabel F-1, Role per Tabel R-1 (dinonaktifkan sampai Organisasi dipilih, reset saat
 * Organisasi berubah), Wilayah Kerja untuk R-05, Masa berlaku akses hanya R-03, validasi Tabel V-1, normalisasi email,
 * "Mengirim…", toast sukses, modal gagal kirim. FR-CD-04b: cakupan R-02 seluruh KKKS (default) atau KKKS tertentu.
 */
import { AlertCircle, AlertTriangle, Calendar } from 'lucide-react';
import { needsWk as needsWkFor } from '@/lib/role-catalog';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Combobox, MultiSelect } from '@/components/patterns/Combobox';
import { Dialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { formatTanggal } from '@/lib/format';
import { type RoleId, roleName } from '@/lib/rbac';
import { SECURITY_PARAMS } from '@/lib/security-params';
import {
  JABATAN_MAX,
  NAMA_MAX,
  durasiSampai,
  endOfDayWib,
  invitableRoles,
  isOverTwoYears,
  isPastDate,
  type InviterRole,
} from '@/lib/user-rules';
import { isServiceError, type InviteInput, type Organisasi } from '@/services';
import { EMAIL_PATTERN } from '../../auth/copy';
import { usersCopy } from '../copy';
import { useInvite, useOrganisasi, useWilayahKerja } from '../hooks';
import { SendFailedDialog } from './SendFailedDialog';

const c = usersCopy.undangModal;
const v = usersCopy.v;

export interface InvitePrefill {
  nama?: string;
  email?: string;
  jabatan?: string;
  organisasiId?: string;
  roles?: RoleId[];
}

export interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inviter: InviterRole;
  /** Organisasi PIC KKKS (Tabel F-1: otomatis, field tidak tampil). */
  ownOrg: Organisasi;
  /** Untuk "Kirim Undangan Baru" pada undangan yang dibatalkan (FR-BU-14). */
  prefill?: InvitePrefill;
}

type Errors = Partial<Record<'nama' | 'email' | 'jabatan' | 'organisasi' | 'role' | 'wilayahKerja' | 'aksesBerakhir' | 'cakupan', string>>;

export const roleOptionLabel = (r: RoleId) => `${r} ${roleName(r)}`;

export function InviteDialog({ open, onOpenChange, inviter, ownOrg, prefill }: InviteDialogProps) {
  const toast = useToast();
  const isPic = inviter === 'R-04';
  const orgs = useOrganisasi(open && !isPic);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [orgId, setOrgId] = useState<string | undefined>(isPic ? ownOrg.id : undefined);
  const [roles, setRoles] = useState<RoleId[]>([]);
  const [wk, setWk] = useState<string[]>([]);
  const [akses, setAkses] = useState('');
  const [cakupanMode, setCakupanMode] = useState<'semua' | 'sebagian'>('semua');
  const [kkks, setKkks] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [topAlert, setTopAlert] = useState<{ msg: string; tone: 'error' } | null>(null);
  const [emailRegistered, setEmailRegistered] = useState(false);
  const [failed, setFailed] = useState(false);
  const invite = useInvite();
  const namaRef = useRef<HTMLInputElement>(null);

  // Reset setiap kali dibuka.
  useEffect(() => {
    if (!open) return;
    setNama(prefill?.nama ?? '');
    setEmail(prefill?.email ?? '');
    setJabatan(prefill?.jabatan ?? '');
    setOrgId(isPic ? ownOrg.id : prefill?.organisasiId);
    setRoles(prefill?.roles ?? []);
    setWk([]);
    setAkses('');
    setCakupanMode('semua');
    setKkks([]);
    setErrors({});
    setTopAlert(null);
    setEmailRegistered(false);
    invite.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const activeOrgs = useMemo(() => (orgs.data ?? []).filter((o) => o.status === 'Aktif'), [orgs.data]);
  const org: Organisasi | undefined = isPic ? ownOrg : activeOrgs.find((o) => o.id === orgId);
  const roleOptions = org ? invitableRoles(inviter, org.jenis) : [];
  const needsWk = needsWkFor(roles);
  const needsCakupan = roles.includes('R-02');
  const kkksOptions = (orgs.data ?? []).filter((o) => o.jenis === 'KKKS' && o.status === 'Aktif');
  const wkQuery = useWilayahKerja(needsWk ? org?.id : undefined);
  const wkEmpty = needsWk && wkQuery.isSuccess && wkQuery.data.length === 0;
  const showAkses = inviter === 'R-03';
  const now = new Date();
  const aksesWarn = akses && !isPastDate(akses, now) && isOverTwoYears(akses, now);

  function validate(): Errors {
    const e: Errors = {};
    if (!nama.trim()) e.nama = v.namaKosong;
    else if (nama.trim().length > NAMA_MAX) e.nama = v.namaMaks;
    if (!email.trim()) e.email = v.emailKosong;
    else if (!EMAIL_PATTERN.test(email.trim())) e.email = v.emailFormat;
    if (jabatan.length > JABATAN_MAX) e.jabatan = v.jabatanMaks;
    if (!org) e.organisasi = v.organisasiKosong;
    if (roles.length === 0) e.role = v.roleKosong;
    if (needsWk && wkEmpty) e.wilayahKerja = v.tanpaWk;
    else if (needsWk && wk.length === 0) e.wilayahKerja = v.wkKosong;
    if (akses && isPastDate(akses, now)) e.aksesBerakhir = v.tanggalLampau;
    if (needsCakupan && cakupanMode === 'sebagian' && kkks.length === 0) e.cakupan = c.cakupanKkksKosong;
    return e;
  }

  const input = (): InviteInput => ({
    nama,
    email,
    jabatan: jabatan || undefined,
    organisasiId: isPic ? undefined : orgId,
    roles,
    wilayahKerjaIds: needsWk ? wk : undefined,
    aksesBerakhir: showAkses && akses ? akses : undefined,
    cakupanOrganisasiIds: needsCakupan && cakupanMode === 'sebagian' ? kkks : undefined,
  });

  function send() {
    setTopAlert(null);
    setEmailRegistered(false);
    invite.mutate(input(), {
      onSuccess: () => {
        setFailed(false);
        onOpenChange(false);
        toast.show({ title: c.sukses });
      },
      onError: (err) => {
        if (!isServiceError(err)) return setTopAlert({ msg: usersCopy.kendalaIsi, tone: 'error' });
        const map: Partial<Record<string, Errors>> = {
          EMAIL_DOMAIN_NOT_ALLOWED: { email: v.emailDomain(err.meta.value ?? org?.nama ?? '') },
          EMAIL_PERSONAL: { email: v.emailPribadi },
          EMAIL_REGISTERED: { email: v.emailTerdaftar },
          EMAIL_INVITED: { email: v.emailDiundang },
          EMAIL_OWN: { email: v.emailSendiri },
          ROLE_INACTIVE: { role: v.roleNonaktif },
          ROLE_NOT_ALLOWED: { role: v.roleNonaktif },
          ORG_NO_WK: { wilayahKerja: v.tanpaWk },
          PAST_DATE: { aksesBerakhir: v.tanggalLampau },
        };
        if (err.code === 'SEND_FAILED') return setFailed(true);
        if (err.code === 'EMAIL_INACTIVE_ACCOUNT') return setTopAlert({ msg: v.emailNonaktif, tone: 'error' });
        if (err.code === 'SOD_VIOLATION') return setTopAlert({ msg: v.sod, tone: 'error' });
        if (err.code === 'EMAIL_REGISTERED') setEmailRegistered(true);
        const fe = map[err.code];
        if (fe) setErrors(fe);
        else setTopAlert({ msg: usersCopy.kendalaIsi, tone: 'error' });
      },
    });
  }

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (invite.isPending) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      if (e.nama) namaRef.current?.focus();
      return;
    }
    send();
  }

  const busy = invite.isPending;
  const clear = (k: keyof Errors) => setErrors((p) => ({ ...p, [k]: undefined }));

  return (
    <>
      <Dialog
        open={open && !failed}
        onOpenChange={(o) => !busy && onOpenChange(o)}
        title={c.judul}
        description={c.deskripsi}
        closeLabel={c.batal}
        footerNote={c.masaBerlakuUndangan(SECURITY_PARAMS.inviteValidityDays)}
        footer={
          <>
            <Button onClick={() => onOpenChange(false)} disabled={busy}>
              {c.batal}
            </Button>
            <Button variant="primary" type="submit" form="form-undang" loading={busy} loadingLabel={c.mengirim}>
              {c.kirim}
            </Button>
          </>
        }
      >
        <form id="form-undang" noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          {topAlert && (
            <p role="alert" className="flex items-start gap-[10px] rounded-md bg-sev-kritis-bg p-3 text-caption text-error-ink">
              <AlertCircle aria-hidden size={16} strokeWidth={1.8} className="shrink-0" />
              {topAlert.msg}
            </p>
          )}
          <fieldset disabled={busy} className="flex flex-col gap-4 disabled:opacity-60">
            <TextField
              ref={namaRef}
              label={c.nama}
              required
              showRequired
              placeholder={c.namaPlaceholder}
              value={nama}
              onChange={(e) => (setNama(e.target.value), clear('nama'))}
              error={errors.nama}
            />
            <TextField
              label={c.email}
              required
              showRequired
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder={c.emailPlaceholder}
              value={email}
              onChange={(e) => (setEmail(e.target.value), clear('email'), setEmailRegistered(false))}
              onBlur={() => setEmail((x) => x.trim().toLowerCase())}
              hint={c.emailHint}
              error={
                errors.email &&
                (emailRegistered ? (
                  <>
                    {v.emailTerdaftar.split(v.emailTerdaftarLink)[0]}
                    <Link to={`/pengguna?cari=${encodeURIComponent(email.trim().toLowerCase())}`} onClick={() => onOpenChange(false)} className="underline">
                      {v.emailTerdaftarLink}
                    </Link>
                    {v.emailTerdaftar.split(v.emailTerdaftarLink)[1]}
                  </>
                ) : (
                  errors.email
                ))
              }
            />
            <TextField
              label={
                <>
                  {c.jabatan} <span className="text-ink-subtle">{c.opsional}</span>
                </>
              }
              placeholder={c.jabatanPlaceholder}
              value={jabatan}
              onChange={(e) => (setJabatan(e.target.value), clear('jabatan'))}
              error={errors.jabatan}
            />
            {!isPic && (
              <Combobox
                label={c.organisasi}
                required
                placeholder={c.organisasiPlaceholder}
                emptyText={c.dataTidakDitemukan}
                options={activeOrgs.map((o) => ({ value: o.id, label: o.nama }))}
                value={orgId}
                onChange={(id) => {
                  // FR-UP-08: ganti organisasi → Role dan Wilayah Kerja direset.
                  if (id !== orgId) {
                    setRoles([]);
                    setWk([]);
                  }
                  setOrgId(id);
                  clear('organisasi');
                }}
                error={errors.organisasi}
              />
            )}
            <MultiSelect
              label={c.role}
              required
              placeholder={org ? c.rolePlaceholder : c.roleDisabled}
              disabled={!org}
              emptyText={c.dataTidakDitemukan}
              removeLabel={c.hapusChip}
              options={roleOptions.map((r) => ({ value: r, label: roleOptionLabel(r) }))}
              value={roles}
              onChange={(r) => {
                setRoles(r as RoleId[]);
                clear('role');
                if (!needsWkFor(r as RoleId[])) setWk([]);
              }}
              error={errors.role}
            />
            {needsWk && (
              <MultiSelect
                label={c.wk}
                required
                placeholder={c.wkPlaceholder}
                disabled={wkEmpty}
                emptyText={v.tanpaWk}
                removeLabel={c.hapusChip}
                options={(wkQuery.data ?? []).map((w) => ({ value: w.id, label: w.nama }))}
                value={wk}
                onChange={(x) => (setWk(x), clear('wilayahKerja'))}
                error={errors.wilayahKerja ?? (wkEmpty ? v.tanpaWk : undefined)}
              />
            )}
            {needsCakupan && (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1 text-label text-ink-muted">{c.cakupanR02}</legend>
                {(['semua', 'sebagian'] as const).map((m) => (
                  <label key={m} className="flex items-center gap-2 text-body-dense text-ink">
                    <input
                      type="radio"
                      name="cakupan-r02"
                      value={m}
                      checked={cakupanMode === m}
                      onChange={() => (setCakupanMode(m), clear('cakupan'))}
                      className="h-4 w-4 accent-[var(--color-action)]"
                    />
                    {m === 'semua' ? c.cakupanSemua : c.cakupanSebagian}
                  </label>
                ))}
                {cakupanMode === 'sebagian' && (
                  <MultiSelect
                    label={c.cakupanKkks}
                    required
                    placeholder={c.cakupanKkksPlaceholder}
                    emptyText={c.dataTidakDitemukan}
                    removeLabel={c.hapusChip}
                    options={kkksOptions.map((o) => ({ value: o.id, label: o.nama }))}
                    value={kkks}
                    onChange={(x) => (setKkks(x), clear('cakupan'))}
                    error={errors.cakupan}
                  />
                )}
              </fieldset>
            )}
            {showAkses && (
              <div className="flex flex-col gap-2">
                <TextField
                  label={
                    <>
                      {c.aksesBerakhir} <span className="text-ink-subtle">{c.opsional}</span>
                    </>
                  }
                  type="date"
                  placeholder={c.tanggalPlaceholder}
                  value={akses}
                  min={new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now)}
                  onChange={(e) => (setAkses(e.target.value), clear('aksesBerakhir'))}
                  trailing={<Calendar aria-hidden size={16} strokeWidth={1.8} className="mr-2 text-ink-muted" />}
                  hint={c.aksesHint}
                  error={errors.aksesBerakhir}
                />
                {aksesWarn && (
                  <p role="status" className="flex items-start gap-[10px] rounded-md bg-caution-bg p-3 text-caption text-caution-ink">
                    <AlertTriangle aria-hidden size={16} strokeWidth={1.8} className="shrink-0" />
                    {c.berlaku(durasiSampai(akses, now), formatTanggal(endOfDayWib(akses)))}
                  </p>
                )}
              </div>
            )}
          </fieldset>
        </form>
      </Dialog>
      <SendFailedDialog
        open={open && failed}
        email={email.trim().toLowerCase()}
        onClose={() => {
          setFailed(false);
          onOpenChange(false);
        }}
        onRetry={send}
        retrying={busy}
      />
    </>
  );
}
