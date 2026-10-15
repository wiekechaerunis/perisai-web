/**
 * Panel detail pengguna — PRD Profil Pengguna (ClickUp z8pmx9n8nx), Figma 109:16236 (Profil), 109:16307 (Akses),
 * 109:16444 (Aktivitas); varian status Figma 106:14009, 246:5817, 251:6771, 257:8491; 480px.
 * Header: Reset kata sandi + menu ··· (Figma 109:16236). Aksi per status mengikuti PRD (Tabel K-1, B-1, A-2):
 * - Aktif: Reset kata sandi; menu ··· → Tangguhkan akun, Nonaktifkan akun, Akhiri semua sesi (nonaktif bila 0 sesi)
 * - Ditangguhkan: Aktifkan kembali; menu ··· → Nonaktifkan akun
 * - Diundang / Kedaluwarsa: Kirim ulang undangan, Batalkan undangan (FR-KU-04, FR-BU-04)
 * - Nonaktif (pernah aktif): Aktifkan kembali (FR-SA-20); dibatalkan: Kirim undangan baru (FR-BU-14, Figma 251:6771)
 * Aksi status disembunyikan untuk akun sendiri (FR-SA-06), organisasi nonaktif (FR-SA-24b), dan R-07.
 * Tab Profil: tautan "Ubah" per field → halaman /pengguna/:id/ubah (PRD Ubah Data & Role, keputusan PM 14 Okt 2026);
 * Masa berlaku → dialog Perpanjang (FR-SA-22). Riwayat akun: Diundang, Diaktifkan, Login terakhir.
 */
import { KeyRound, Lock, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import { services } from '@/services';
import { LOG_ROLES } from '../../shell/navigation';
import { AccountStatusBadge } from '@/components/patterns/AccountStatusBadge';
import { Callout } from '@/components/patterns/Callout';
import { KeyValueList, type KeyValueItem } from '@/components/patterns/KeyValueList';
import { Menu } from '@/components/patterns/Menu';
import { SidePanel } from '@/components/patterns/SidePanel';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { formatTanggal, formatTanggalJam } from '@/lib/format';
import { ACCOUNT_STATUS_DISPLAY } from '@/lib/status';
import { actionsForStatus } from '@/lib/user-rules';
import type { Session, UserDetail } from '@/services';
import { usersCopy as c } from '../copy';

const p = c.panel;
import { USERS_KEY, useUserDetail } from '../hooks';
import { InviteDialog } from './InviteDialog';
import { UserActionDialog, type UserAction } from './UserActionDialogs';
import { AksesTab, AktivitasTab } from './UserPanelTabs';
import { inviterRoleOf } from '@/lib/user-rules';

export function statusNote(u: Pick<UserDetail, 'mintaUndanganBaru' | 'keteranganStatus' | 'organisasi'>): string | undefined {
  if (u.organisasi.status === 'Nonaktif') return c.organisasiNonaktif;
  if (u.mintaUndanganBaru) return `${c.mintaUndanganBaru} · ${formatTanggal(u.mintaUndanganBaru)}`;
  return u.keteranganStatus;
}

export function StatusBadge({ user }: { user: Pick<UserDetail, 'status' | 'mintaUndanganBaru' | 'keteranganStatus' | 'organisasi'> }) {
  const d = ACCOUNT_STATUS_DISPLAY[user.status];
  return <AccountStatusBadge label={d.label} icon={d.icon} tone={d.tone} note={statusNote(user)} />;
}

function canManage(session: Session, u: UserDetail): boolean {
  const roles = session.user.roles;
  if (session.user.id === u.id) return false; // FR-SA-06
  if (roles.includes('R-03')) return true;
  return roles.includes('R-04') && session.user.organisasi.id === u.organisasi.id;
}

export interface UserDetailPanelProps {
  userId: string | undefined;
  session: Session;
  onClose: () => void;
}

export function UserDetailPanel({ userId, session, onClose }: UserDetailPanelProps) {
  const detail = useUserDetail(userId);
  const [action, setAction] = useState<UserAction | null>(null);
  const [reinvite, setReinvite] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const u = detail.data;
  const inviter = inviterRoleOf(session.user.roles);
  const navigate = useNavigate();

  if (!userId) return null;
  if (!u) {
    return (
      <SidePanel open onOpenChange={(o) => !o && onClose()} title={detail.isError ? c.profil.tidakDitemukan : '…'} closeLabel={c.profil.tutup}>
        <p role="status" className="text-body-dense text-ink-muted">
          {detail.isError ? c.profil.tidakDitemukanIsi : c.profil.memuat}
        </p>
      </SidePanel>
    );
  }

  const manage = canManage(session, u) && u.organisasi.status === 'Aktif';
  // FR-UDR-01, -02 (R-07 boleh mengubah data & role, D-7); akun Nonaktif tidak diubah (disetujui PM 14 Okt 2026).
  const canEdit = !!inviter && u.organisasi.status === 'Aktif' && u.status !== 'Nonaktif';
  const self = session.user.id === u.id;
  const goEdit = canEdit ? () => navigate(`/pengguna/${u.id}/ubah`) : undefined;
  const a = actionsForStatus(u.status, u.pernahAktif);
  const cancelled = u.status === 'Nonaktif' && !u.pernahAktif;

  const actions = manage ? (
    <>
      {u.status === 'Kedaluwarsa' &&
        (u.mintaUndanganBaru ? (
          <Callout variant="peringatan" role="note" title={c.profil.permintaanJudul}>
            <p className="text-caption">{c.profil.diajukan(formatTanggalJam(u.mintaUndanganBaru))}</p>
            {u.undanganBerlakuSampai && <p className="text-caption">{c.profil.sebelumnyaKedaluwarsa(formatTanggalJam(u.undanganBerlakuSampai))}</p>}
          </Callout>
        ) : (
          <Callout variant="peringatan" role="note">
            {c.profil.kedaluwarsaPada(u.undanganBerlakuSampai ? formatTanggal(u.undanganBerlakuSampai) : '—')}
          </Callout>
        ))}
      {cancelled && (
        <div className="flex flex-col gap-1 rounded-md bg-surface-sunken p-4">
          <p className="text-body-dense font-semibold text-ink">{c.profil.belumSelesaiJudul}</p>
          <p className="text-caption text-ink-muted">{c.profil.belumSelesaiIsi}</p>
          <div className="mt-2">
            <Button onClick={() => setReinvite(true)}>{c.profil.kirimUndanganBaru}</Button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {u.status === 'Aktif' && (
          <Button icon={<KeyRound aria-hidden size={14} strokeWidth={1.8} />} onClick={() => setResetOpen(true)}>
            {p.resetSandi}
          </Button>
        )}
        {a.kirimUlang && <Button onClick={() => setAction('kirimUlang')}>{c.aksi.kirimUlang}</Button>}
        {a.batalkan && <Button onClick={() => setAction('batalkan')}>{c.aksi.batalkan}</Button>}
        {a.aktifkanKembali && <Button onClick={() => setAction('aktifkanKembali')}>{c.aksi.aktifkanKembali}</Button>}
        {(u.status === 'Aktif' || u.status === 'Ditangguhkan') && (
          <Menu
            items={[
              ...(u.status === 'Aktif' ? [{ key: 't', label: c.aksi.tangguhkanAkun, onSelect: () => setAction('tangguhkan') }] : []),
              { key: 'n', label: c.aksi.nonaktifkanAkun, onSelect: () => setAction('nonaktifkan') },
              ...(u.status === 'Aktif' ? [{ key: 's', label: c.aksi.cabutSesi, onSelect: () => setAction('cabutSesi'), disabled: u.sesiAktif === 0 }] : []),
            ]}
            trigger={<Button aria-label={c.aksi.lainnya} icon={<MoreHorizontal aria-hidden size={14} strokeWidth={1.8} />} className="px-2" />}
          />
        )}
      </div>
      {u.status === 'Diundang' && u.undanganBerlakuSampai && (
        <p className="text-caption text-ink-subtle">{c.profil.berlakuSampai(formatTanggalJam(u.undanganBerlakuSampai))}</p>
      )}
    </>
  ) : u.organisasi.status === 'Nonaktif' ? (
    <p role="status" className="rounded-md bg-surface-sunken p-3 text-body-dense text-ink">
      <strong className="font-semibold">{c.organisasiNonaktif}.</strong> {c.organisasiNonaktifTooltip}
    </p>
  ) : null;

  const lock = <Lock aria-label={p.tidakDapatDiubah} size={14} strokeWidth={1.8} className="text-ink-subtle" />;
  const ubah = (onClick?: () => void) =>
    onClick ? (
      <button type="button" onClick={onClick} className="text-body-dense font-semibold text-ink underline">
        {p.ubah}
      </button>
    ) : (
      lock
    );
  // Email pengguna lain dapat diubah admin (FR-UDR-05); Figma 109:16236 masih menggembok email (versi PRD lama).
  const emailEditable = canEdit && !self && (u.status === 'Aktif' || u.status === 'Ditangguhkan');
  const items: KeyValueItem[] = [
    { key: 'nama', label: c.profil.field.nama, value: u.nama, action: ubah(goEdit) },
    {
      key: 'email',
      label: c.profil.field.email,
      value: (
        <span className="flex flex-col gap-0.5">
          <span className="break-all">{u.email}</span>
          {u.emailTertunda && (
            <span className="break-all text-caption text-caution-ink">
              {c.profil.emailTertunda(u.emailTertunda.status, u.emailTertunda.emailBaru)} ·{' '}
              {u.emailTertunda.olehAdmin ? c.profil.emailTertundaAdmin : c.profil.emailTertundaSendiri}
            </span>
          )}
        </span>
      ),
      action: ubah(emailEditable ? goEdit : undefined),
    },
    { key: 'jabatan', label: c.profil.field.jabatan, value: u.jabatan ?? '—', action: ubah(goEdit) },
    { key: 'org', label: c.profil.field.organisasi, value: u.organisasi.nama, action: lock },
    {
      key: 'masa',
      label: p.masaBerlaku,
      value: u.aksesBerakhir ? formatTanggal(u.aksesBerakhir) : c.profil.tanpaBatas,
      action: manage && a.perpanjang ? ubah(() => setAction('perpanjang')) : undefined,
    },
  ];
  const riwayatAkun: KeyValueItem[] = [
    ...(u.diundangPada
      ? [
          {
            key: 'diundang',
            label: p.diundang,
            value: (
              <span className="flex flex-col">
                <span>{formatTanggalJam(u.diundangPada)}</span>
                {u.diundangOleh && <span className="font-normal text-ink-muted">{c.profil.oleh(u.diundangOleh)}</span>}
              </span>
            ),
          },
        ]
      : []),
    ...(u.diaktifkanPada ? [{ key: 'aktif', label: p.diaktifkan, value: formatTanggalJam(u.diaktifkanPada) }] : []),
    { key: 'login', label: p.loginTerakhir, value: u.loginTerakhir ? formatTanggalJam(u.loginTerakhir) : p.belumPernahLogin },
  ];

  return (
    <>
      <SidePanel
        open
        onOpenChange={(o) => !o && onClose()}
        title={u.nama}
        titleAside={<StatusBadge user={u} />}
        subtitle={u.email}
        actions={actions}
        closeLabel={c.profil.tutup}
      >
        <Tabs
          label={c.profil.tabLabel}
          items={[
            {
              value: 'profil',
              label: c.profil.tabProfil,
              content: (
                <div className="flex flex-col gap-6">
                  <KeyValueList items={items} />
                  <section className="flex flex-col gap-3">
                    <h3 className="text-heading-3 text-ink">{p.riwayatAkun}</h3>
                    <KeyValueList items={riwayatAkun} />
                  </section>
                </div>
              ),
            },
            { value: 'akses', label: c.profil.tabAkses, content: <AksesTab user={u} onUbah={self ? undefined : goEdit} /> },
            {
              value: 'aktivitas',
              label: c.profil.tabAktivitas,
              content: <AktivitasTab user={u} canManage={manage} showLogLinks={session.user.roles.some((r) => LOG_ROLES.includes(r))} />,
            },
          ]}
        />
      </SidePanel>
      {action && <UserActionDialog action={action} user={u} onClose={() => setAction(null)} />}
      {resetOpen && <ResetPasswordDialog user={u} onClose={() => setResetOpen(false)} />}
      {inviter && (
        <InviteDialog
          open={reinvite}
          onOpenChange={setReinvite}
          inviter={inviter}
          ownOrg={session.user.organisasi}
          prefill={{ nama: u.nama, email: u.email, jabatan: u.jabatan, organisasiId: u.organisasi.id, roles: u.roles }}
        />
      )}
    </>
  );
}

/** PRD Profil Pengguna: admin mengirim tautan atur ulang kata sandi; kata sandi tidak pernah ditampilkan. */
function ResetPasswordDialog({ user, onClose }: { user: UserDetail; onClose: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => services.users.resetPassword(user.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.show({ title: p.resetSukses });
      onClose();
    },
  });
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={p.resetJudul}
      description={p.resetIsi(user.email)}
      closeLabel={c.sesi.batal}
      confirmLabel={p.resetKirim}
      cancelLabel={c.sesi.batal}
      loading={m.isPending}
      loadingLabel={c.sesi.memproses}
      onConfirm={() => m.mutate()}
    >
      {m.isError && (
        <p role="alert" className="text-caption text-error-ink">
          {c.kendalaIsi}
        </p>
      )}
    </ConfirmDialog>
  );
}
