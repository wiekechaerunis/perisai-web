/**
 * Ubah data & role pengguna lain — PRD Ubah Data & Role Pengguna (ClickUp z8pmx9n8ny). Tidak ada Design Reference /
 * Figma: tata letak mengikuti look & feel Akun Saya (Figma 341:6300) dan Manajemen Pengguna (PR-11).
 * - FR-UDR-01, -02: R-03/R-07 seluruh organisasi, R-04 organisasinya (lainnya 404 dari service).
 * - FR-UDR-03: nama 3–150, jabatan ≤ 100; organisasi read-only.
 * - FR-UDR-05: email baru berlaku setelah pengguna memverifikasi tautan.
 * - FR-UDR-07, -08: role per kewenangan, SoD, Wilayah Kerja untuk R-05, cakupan R-02 (FR-CD-07).
 * - FR-UDR-09 + FR-HE-17: ringkasan sebelum/sesudah dan perbedaan hak akses sebelum disimpan.
 * - FR-UDR-10: konfirmasi saat meninggalkan halaman dengan perubahan belum disimpan.
 * - FR-UDR-11: role read-only untuk akun sendiri.
 * Tata letak satu kartu mengikuti Figma 341:6300 (Akun Saya — Profil): judul + status, Nama/Email | Jabatan/Organisasi,
 * lalu "Role dan cakupan akses" (arahan PM 14 Okt 2026).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLeaveGuard } from '@/lib/use-leave-guard';
import { Lock, Minus, Plus } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { Callout } from '@/components/patterns/Callout';
import { MultiSelect } from '@/components/patterns/Combobox';
import { ConfirmDialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { formatTanggal } from '@/lib/format';
import { JABATAN_MAX, NAMA_EDIT_MAX, NAMA_EDIT_MIN, editableRoles, inviterRoleOf } from '@/lib/user-rules';
import type { RoleId } from '@/lib/rbac';
import { needsWk as needsWkFor } from '@/lib/role-catalog';
import { isServiceError, services, type UpdateUserInput, type UserChangePreview, type UserDetail } from '@/services';
import { ScopeList } from '../access/EffectiveAccessView';
import { EMAIL_PATTERN } from '../auth/copy';
import { useSession } from '../session/SessionProvider';
import { roleOptionLabel } from './components/InviteDialog';
import { StatusBadge } from './components/UserDetailPanel';
import { usersCopy } from './copy';
import { USERS_KEY, useOrganisasi, useUserDetail, useWilayahKerja } from './hooks';

const c = usersCopy.ubah;
const e = usersCopy.e;

type Field = 'nama' | 'jabatan' | 'email' | 'role' | 'wilayahKerja' | 'cakupan';
type Errors = Partial<Record<Field, string>>;

interface FormState {
  nama: string;
  jabatan: string;
  email: string;
  roles: RoleId[];
  wk: string[];
  cakupanMode: 'semua' | 'sebagian';
  kkks: string[];
}

function initial(u: UserDetail): FormState {
  return {
    nama: u.nama,
    jabatan: u.jabatan ?? '',
    email: u.email,
    roles: [...u.roles],
    wk: [...u.wilayahKerja, ...u.wilayahKerjaNonaktif].map((w) => w.id),
    cakupanMode: u.kkksIds.length ? 'sebagian' : 'semua',
    kkks: [...u.kkksIds],
  };
}

function ReadOnly({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label text-ink-muted">{label}</span>
      <div className="flex min-h-control-md items-center justify-between gap-2 rounded-md border border-border bg-surface-sunken px-3 py-2 text-body-dense text-ink">
        <div className="min-w-0 break-words">{children}</div>
        <Lock aria-hidden size={16} strokeWidth={1.8} className="shrink-0 text-ink-subtle" />
      </div>
      {hint && <p className="text-caption text-ink-subtle">{hint}</p>}
    </div>
  );
}

export function UbahPenggunaPage() {
  const { id } = useParams();
  const detail = useUserDetail(id);
  const u = detail.data;
  if (!u) {
    return (
      <PageBody>
        <p role="status" className="text-body-dense text-ink-muted">
          {detail.isError ? usersCopy.profil.tidakDitemukanIsi : usersCopy.profil.memuat}
        </p>
      </PageBody>
    );
  }
  return <UbahForm key={u.id} user={u} />;
}

function UbahForm({ user: u }: { user: UserDetail }) {
  const { session } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const editor = session ? inviterRoleOf(session.user.roles) : null;
  const self = session?.user.id === u.id;
  const emailEditable = !self && (u.status === 'Aktif' || u.status === 'Ditangguhkan');
  const editable = !!editor && u.status !== 'Nonaktif' && u.organisasi.status === 'Aktif';

  const start = useMemo(() => initial(u), [u]);
  const [f, setF] = useState<FormState>(start);
  const [errors, setErrors] = useState<Errors>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [preview, setPreview] = useState<UserChangePreview | null>(null);
  const saved = useRef(false);
  const namaRef = useRef<HTMLInputElement>(null);

  const needsWk = needsWkFor(f.roles);
  const needsCakupan = f.roles.includes('R-02');
  const wkQuery = useWilayahKerja(needsWk ? u.organisasi.id : undefined);
  const orgs = useOrganisasi(needsCakupan);
  const kkksOptions = (orgs.data ?? []).filter((o) => o.jenis === 'KKKS' && o.status === 'Aktif');
  const roleOptions = editor ? [...new Set([...u.roles, ...editableRoles(editor, u.organisasi.jenis)])] : u.roles;

  const dirty = JSON.stringify(f) !== JSON.stringify(start);
  // FR-UDR-10
  const blocker = useLeaveGuard(dirty, saved);

  const set = <K extends keyof FormState>(k: K, val: FormState[K], err?: Field) => {
    setF((p) => ({ ...p, [k]: val }));
    if (err) setErrors((p) => ({ ...p, [err]: undefined }));
    setAlert(null);
  };

  const input = (): UpdateUserInput => ({
    nama: f.nama,
    jabatan: f.jabatan,
    email: emailEditable ? f.email : undefined,
    roles: f.roles,
    wilayahKerjaIds: needsWk ? f.wk : undefined,
    cakupanOrganisasiIds: needsCakupan ? (f.cakupanMode === 'sebagian' ? f.kkks : []) : undefined,
  });

  function validate(): Errors {
    const x: Errors = {};
    const n = f.nama.trim();
    if (!n) x.nama = e.namaKosong;
    else if (n.length < NAMA_EDIT_MIN || n.length > NAMA_EDIT_MAX) x.nama = e.namaPanjang;
    if (f.jabatan.length > JABATAN_MAX) x.jabatan = e.jabatanPanjang;
    if (emailEditable && !EMAIL_PATTERN.test(f.email.trim())) x.email = e.emailFormat;
    if (f.roles.length === 0) x.role = usersCopy.v.roleKosong;
    if (needsWk && f.wk.length === 0) x.wilayahKerja = usersCopy.v.wkKosong;
    if (needsCakupan && f.cakupanMode === 'sebagian' && f.kkks.length === 0) x.cakupan = usersCopy.undangModal.cakupanKkksKosong;
    return x;
  }

  const mapError = (err: unknown): boolean => {
    if (!isServiceError(err)) return false;
    const fieldErr: Partial<Record<string, Errors>> = {
      EMAIL_REGISTERED: { email: e.emailDipakai },
      EMAIL_DOMAIN_NOT_ALLOWED: { email: e.emailDomainPengguna },
      EMAIL_PERSONAL: { email: e.emailDomainPengguna },
    };
    if (err.code === 'VALIDATION') {
      const fld = err.meta.field as Field | undefined;
      if (fld === 'nama') setErrors({ nama: err.meta.value === 'kosong' ? e.namaKosong : e.namaPanjang });
      else if (fld === 'jabatan') setErrors({ jabatan: e.jabatanPanjang });
      else if (fld === 'email') setErrors({ email: e.emailFormat });
      else if (fld === 'wilayahKerja') setErrors({ wilayahKerja: usersCopy.v.wkKosong });
      else if (fld === 'cakupan') setErrors({ cakupan: usersCopy.undangModal.cakupanKkksKosong });
      else setErrors({ role: usersCopy.v.roleKosong });
      return true;
    }
    if (fieldErr[err.code]) return setErrors(fieldErr[err.code]!), true;
    if (err.code === 'SOD_VIOLATION') return setAlert(usersCopy.v.sod), true;
    if (err.code === 'NO_CHANGES') return setAlert(c.tanpaPerubahan), true;
    if (err.code === 'PERMISSION_DENIED' || err.code === 'ROLE_NOT_ALLOWED') return setAlert(usersCopy.tidakDiizinkan), true;
    return false;
  };

  const check = useMutation({ mutationFn: () => services.users.previewUpdate(u.id, input()) });
  const save = useMutation({ mutationFn: () => services.users.updateUser(u.id, input()) });

  function onReview(ev: FormEvent) {
    ev.preventDefault();
    const x = validate();
    setErrors(x);
    if (Object.keys(x).length) {
      if (x.nama) namaRef.current?.focus();
      return;
    }
    check.mutate(undefined, {
      onSuccess: (p) => setPreview(p),
      onError: (err) => {
        if (!mapError(err)) setAlert(usersCopy.kendalaIsi);
      },
    });
  }

  function onSave() {
    save.mutate(undefined, {
      onSuccess: () => {
        saved.current = true;
        void qc.invalidateQueries({ queryKey: USERS_KEY });
        toast.show({ title: c.sukses });
        navigate(`/pengguna/${u.id}`);
      },
      onError: (err) => {
        setPreview(null);
        if (!mapError(err)) toast.show({ title: c.gagal, variant: 'gagal' });
      },
    });
  }

  const header = (
    <PageHeader
      title={c.judul}
      breadcrumbs={[{ label: c.crumbPengguna, to: '/pengguna' }, { label: u.nama, to: `/pengguna/${u.id}` }, { label: c.judul }]}
      summary={c.ringkasan}
    />
  );

  if (!editable) {
    return (
      <>
        {header}
        <PageBody>
          <p role="status" className="rounded-md bg-surface-sunken p-3 text-body-dense text-ink">
            {c.tidakDapat}
          </p>
        </PageBody>
      </>
    );
  }

  return (
    <>
      {header}
      <PageBody>
        {preview ? (
          <Ringkasan preview={preview} busy={save.isPending} onBack={() => setPreview(null)} onCancel={() => navigate(`/pengguna/${u.id}`)} onSave={onSave} />
        ) : (
          <form noValidate onSubmit={onReview} className="flex flex-col gap-6">
            {alert && (
              <Callout variant="error" size="compact">
                {alert}
              </Callout>
            )}
            <Section className="border border-border">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-heading-2 text-ink">{c.seksiData}</h2>
                    <p className="text-body-dense text-ink-muted">{c.seksiDataKeterangan}</p>
                  </div>
                  <StatusBadge user={u} />
                </div>
                <hr className="border-border-subtle" />
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-4">
                    <TextField ref={namaRef} label={c.nama} required showRequired value={f.nama} onChange={(ev) => set('nama', ev.target.value, 'nama')} hint={c.namaHint} error={errors.nama} />
                    {emailEditable ? (
                      <TextField
                        label={c.email}
                        type="email"
                        inputMode="email"
                        autoComplete="off"
                        value={f.email}
                        onChange={(ev) => set('email', ev.target.value, 'email')}
                        onBlur={() => set('email', f.email.trim().toLowerCase())}
                        hint={c.emailHint}
                        error={errors.email}
                      />
                    ) : (
                      <ReadOnly
                        label={c.email}
                        hint={
                          self ? (
                            <>
                              {c.emailSendiri}{' '}
                              <Link to="/akun-saya" className="font-semibold text-ink underline">
                                {c.bukaAkunSaya}
                              </Link>
                            </>
                          ) : (
                            c.emailBelumAktif
                          )
                        }
                      >
                        {u.email}
                      </ReadOnly>
                    )}
                  </div>
                  <div className="flex flex-col gap-4">
                    <TextField label={c.jabatan} value={f.jabatan} onChange={(ev) => set('jabatan', ev.target.value, 'jabatan')} hint={c.jabatanHint} error={errors.jabatan} />
                    <ReadOnly label={c.organisasi} hint={c.organisasiHint}>
                      {u.organisasi.nama}
                    </ReadOnly>
                  </div>
                </div>
                <hr className="border-border-subtle" />
                <h2 className="text-heading-2 text-ink">{c.seksiRole}</h2>
                {self ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-label text-ink-muted" title={c.roleSendiri}>
                      {c.role}
                    </span>
                    <ul className="flex flex-wrap gap-2" aria-describedby="role-sendiri">
                      {u.roles.map((r) => (
                        <li key={r} className="rounded-md border border-border bg-surface-selected px-3 py-1 text-caption text-ink">
                          {roleOptionLabel(r)}
                        </li>
                      ))}
                    </ul>
                    <p id="role-sendiri" className="text-caption text-ink-subtle">
                      {c.roleSendiri}
                    </p>
                  </div>
                ) : (
                  <MultiSelect
                    label={c.role}
                    required
                    placeholder={c.rolePlaceholder}
                    emptyText={usersCopy.undangModal.dataTidakDitemukan}
                    removeLabel={usersCopy.undangModal.hapusChip}
                    options={roleOptions.map((r) => ({ value: r, label: roleOptionLabel(r) }))}
                    value={f.roles}
                    onChange={(r) => set('roles', r as RoleId[], 'role')}
                    error={errors.role}
                  />
                )}
                {needsWk && !self && (
                  <MultiSelect
                    label={usersCopy.undangModal.wk}
                    required
                    placeholder={usersCopy.undangModal.wkPlaceholder}
                    emptyText={usersCopy.undangModal.dataTidakDitemukan}
                    removeLabel={usersCopy.undangModal.hapusChip}
                    options={[
                      ...(wkQuery.data ?? []).map((w) => ({ value: w.id, label: w.nama })),
                      ...u.wilayahKerjaNonaktif.map((w) => ({ value: w.id, label: `${w.nama} ${usersCopy.profil.wkNonaktif}` })),
                    ]}
                    value={f.wk}
                    onChange={(x) => set('wk', x, 'wilayahKerja')}
                    error={errors.wilayahKerja}
                  />
                )}
                {needsCakupan && !self && (
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1 text-label text-ink-muted">{usersCopy.undangModal.cakupanR02}</legend>
                    {(['semua', 'sebagian'] as const).map((m) => (
                      <label key={m} className="flex items-center gap-2 text-body-dense text-ink">
                        <input
                          type="radio"
                          name="cakupan-r02"
                          value={m}
                          checked={f.cakupanMode === m}
                          onChange={() => set('cakupanMode', m, 'cakupan')}
                          className="h-4 w-4 accent-[var(--color-action)]"
                        />
                        {m === 'semua' ? usersCopy.undangModal.cakupanSemua : usersCopy.undangModal.cakupanSebagian}
                      </label>
                    ))}
                    {f.cakupanMode === 'sebagian' && (
                      <MultiSelect
                        label={usersCopy.undangModal.cakupanKkks}
                        required
                        placeholder={usersCopy.undangModal.cakupanKkksPlaceholder}
                        emptyText={usersCopy.undangModal.dataTidakDitemukan}
                        removeLabel={usersCopy.undangModal.hapusChip}
                        options={kkksOptions.map((o) => ({ value: o.id, label: o.nama }))}
                        value={f.kkks}
                        onChange={(x) => set('kkks', x, 'cakupan')}
                        error={errors.cakupan}
                      />
                    )}
                  </fieldset>
                )}
                <div className="grid gap-6 md:grid-cols-2">
                  <ReadOnly label={c.cakupan}>
                    <ScopeList cakupan={u.cakupan} wkNonaktif={u.wilayahKerjaNonaktif} />
                  </ReadOnly>
                  <ReadOnly label={c.masaBerlaku} hint={c.masaBerlakuHint}>
                    {u.aksesBerakhir ? c.masaBerlakuSampai(formatTanggal(u.aksesBerakhir)) : usersCopy.profil.tanpaBatas}
                  </ReadOnly>
                </div>
                <div className="flex justify-end gap-2">
                  <Button onClick={() => navigate(`/pengguna/${u.id}`)}>{c.batal}</Button>
                  <Button type="submit" variant="primary" disabled={!dirty} loading={check.isPending} loadingLabel={c.memeriksa}>
                    {c.tinjau}
                  </Button>
                </div>
              </div>
            </Section>
          </form>
        )}
      </PageBody>
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(o) => !o && blocker.reset?.()}
        title={c.tinggalkanJudul}
        description={c.tinggalkanIsi}
        confirmLabel={c.tinggalkan}
        cancelLabel={c.tetap}
        destructive
        onConfirm={() => blocker.proceed?.()}
      />
    </>
  );
}

/** FR-UDR-09 + FR-HE-17. */
function Ringkasan({
  preview,
  busy,
  onBack,
  onCancel,
  onSave,
}: {
  preview: UserChangePreview;
  busy: boolean;
  onBack: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const noAccessChange = !preview.aksesBertambah.length && !preview.aksesBerkurang.length;
  return (
    <div className="flex flex-col gap-6">
      <Section className="border border-border">
        <div className="flex flex-col gap-3">
          <h2 className="text-heading-2 text-ink">{c.ringkasanJudul}</h2>
          <p className="text-caption text-ink-subtle">{c.ringkasanKeterangan}</p>
          <table className="w-full border-collapse text-left text-body-dense">
            <caption className="sr-only">{c.ringkasanJudul}</caption>
            <thead>
              <tr className="border-b border-border text-label text-ink-muted">
                <th scope="col" className="py-2 pr-4 font-medium">{c.kolom.field}</th>
                <th scope="col" className="py-2 pr-4 font-medium">{c.kolom.sebelum}</th>
                <th scope="col" className="py-2 font-medium">{c.kolom.sesudah}</th>
              </tr>
            </thead>
            <tbody>
              {preview.perubahan.map((p) => (
                <tr key={p.field} className="border-b border-border-subtle align-top">
                  <th scope="row" className="py-3 pr-4 font-medium text-ink">{c.fieldLabel[p.field]}</th>
                  <td className="py-3 pr-4 text-ink-muted">{p.sebelum}</td>
                  <td className="py-3 text-ink">
                    <span className="font-semibold">{p.sesudah}</span>
                    {p.field === 'email' && <span className="block text-caption text-ink-subtle">{c.emailTertundaCatatan}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Section className="border border-border">
        <div className="flex flex-col gap-3">
          <h2 className="text-heading-2 text-ink">{c.aksesJudul}</h2>
          <p className="text-caption text-ink-subtle">{c.aksesKeterangan}</p>
          {noAccessChange ? (
            <p className="text-body-dense text-ink-muted">{c.aksesSama}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <AccessList title={c.aksesBertambah} icon={<Plus aria-hidden size={14} strokeWidth={1.8} />} items={preview.aksesBertambah} />
              <AccessList title={c.aksesBerkurang} icon={<Minus aria-hidden size={14} strokeWidth={1.8} />} items={preview.aksesBerkurang} />
            </div>
          )}
        </div>
      </Section>
      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={onBack} disabled={busy}>
          {c.kembali}
        </Button>
        <Button onClick={onCancel} disabled={busy}>
          {c.batal}
        </Button>
        <Button variant="primary" onClick={onSave} loading={busy} loadingLabel={c.menyimpan}>
          {c.simpan}
        </Button>
      </div>
    </div>
  );
}

function AccessList({ title, icon, items }: { title: string; icon: ReactNode; items: UserChangePreview['aksesBertambah'] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 text-heading-3 text-ink">
        {icon}
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-body-dense text-ink-subtle">—</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((m) => (
            <li key={m.module} className="text-body-dense text-ink">
              <span className="font-mono text-caption text-ink-muted">{m.module}</span> {m.nama}
              <span className="block text-ink-muted">{m.aksi.join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
