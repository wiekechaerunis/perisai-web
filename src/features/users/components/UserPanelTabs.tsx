/**
 * Tab "Akses" dan "Aktivitas" panel detail pengguna — PRD Profil Pengguna (ClickUp z8pmx9n8nx).
 * - Akses (Figma 109:16307): Role (+ Ubah), Cakupan data, "Izin efektif (n)" dikelompokkan per modul (FR-HE-14, -14a,
 *   -15; FR-CD-04a, -13).
 * - Aktivitas (Figma 109:16444): Sesi aktif (Browser · Perangkat · Lokasi, "Aktif … lalu", tombol Keluar per sesi) dan
 *   Riwayat perubahan (oleh siapa, kapan, alasan). Tautan ke Log Akses / Jejak Audit (FR-LA-11, FR-JA-17) hanya untuk
 *   role yang boleh membuka halaman log.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ConfirmDialog } from '@/components/patterns/Dialog';
import { KeyValueList } from '@/components/patterns/KeyValueList';
import { useToast } from '@/components/patterns/Toast';
import { formatRelatif, formatTanggalJam } from '@/lib/format';
import { roleName } from '@/lib/rbac';
import { isRoleActive } from '@/lib/role-catalog';
import { roleCopy } from '../../roles/copy';
import { REVOKE_REASONS } from '@/lib/status';
import { services, type AdminSession, type ReasonInput, type UserDetail } from '@/services';
import { accessCopy } from '../../access/copy';
import { countPermissions, EffectiveAccessView, ScopeList } from '../../access/EffectiveAccessView';
import { usersCopy as c } from '../copy';
import { USERS_KEY } from '../hooks';
import { ReasonField, reasonValid } from './ReasonField';
import { useState } from 'react';

const p = c.panel;

export function AksesTab({ user, onUbah }: { user: UserDetail; onUbah?: () => void }) {
  const q = useQuery({ queryKey: ['users', 'effective', user.id, user.roles.join(), user.status], queryFn: () => services.users.effectiveAccess(user.id) });
  return (
    <div className="flex flex-col gap-6">
      <KeyValueList
        items={[
          {
            key: 'role',
            label: p.role,
            value: (
              <span className="flex flex-col gap-0.5">
                {user.roles.map((r) => (
                  <span key={r}>
                    <span className="font-mono text-caption text-ink-subtle">{r}</span> <span className="font-semibold">{roleName(r)}</span>
                    {!isRoleActive(r) && <span className="text-caption text-ink-subtle"> {roleCopy.penandaTidakAktif}</span>}
                  </span>
                ))}
              </span>
            ),
            action: onUbah ? (
              <button type="button" onClick={onUbah} className="text-body-dense font-semibold text-ink underline">
                {p.ubah}
              </button>
            ) : undefined,
          },
          { key: 'cakupan', label: p.cakupanData, value: <ScopeList cakupan={user.cakupan} wkNonaktif={user.wilayahKerjaNonaktif} /> },
        ]}
      />
      <section className="flex flex-col gap-2">
        <h3 className="text-heading-3 text-ink">{accessCopy.izinEfektif(countPermissions(q.data))}</h3>
        <p className="text-caption text-ink-subtle">{accessCopy.berasalDari(user.roles.join(', '))}</p>
        <EffectiveAccessView modules={q.data} loading={q.isPending} error={q.isError} showRoles={user.roles.length > 1} />
      </section>
    </div>
  );
}

function SessionRevokeDialog({ user, session, onClose }: { user: UserDetail; session: AdminSession; onClose: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const [reason, setReason] = useState<ReasonInput>({ alasan: '' });
  const [touched, setTouched] = useState(false);
  const m = useMutation({
    mutationFn: () => services.users.revokeUserSession(user.id, session.id, reason),
    onSuccess: () => {
      toast.show({ title: p.keluarSukses });
      void qc.invalidateQueries({ queryKey: USERS_KEY });
      void qc.invalidateQueries({ queryKey: ['user-sessions', user.id] });
      onClose();
    },
  });
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={p.keluarJudul}
      description={p.keluarIsi(`${session.browser} · ${session.sistemOperasi} · ${session.perkiraanLokasi}`)}
      closeLabel={c.sesi.batal}
      confirmLabel={p.keluarKonfirmasi}
      cancelLabel={c.sesi.batal}
      loading={m.isPending}
      loadingLabel={c.sesi.memproses}
      onConfirm={() => {
        setTouched(true);
        if (reasonValid(reason)) m.mutate();
      }}
    >
      {m.isError && (
        <p role="alert" className="text-caption text-error-ink">
          {c.kendalaIsi}
        </p>
      )}
      <ReasonField label={c.sesi.alasan} placeholder={c.sesi.alasanPlaceholder} options={REVOKE_REASONS} value={reason} onChange={setReason} showErrors={touched} />
    </ConfirmDialog>
  );
}

export function AktivitasTab({ user, canManage, showLogLinks }: { user: UserDetail; canManage: boolean; showLogLinks: boolean }) {
  const sessions = useQuery({ queryKey: ['user-sessions', user.id, user.sesiAktif], queryFn: () => services.users.userSessions(user.id) });
  const [revoke, setRevoke] = useState<AdminSession | null>(null);
  const list = sessions.data ?? [];
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h3 className="text-heading-3 text-ink">{p.sesiAktif(sessions.isPending ? user.sesiAktif : list.length)}</h3>
        {sessions.isPending ? (
          <p role="status" className="text-body-dense text-ink-muted">{accessCopy.memuat}</p>
        ) : list.length === 0 ? (
          <p className="text-body-dense text-ink-muted">{p.tidakAdaSesi}</p>
        ) : (
          <ul className="flex flex-col">
            {list.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-4 border-b border-border-subtle py-3 last:border-b-0">
                <span className="flex flex-col gap-0.5">
                  <span className="text-body-dense font-medium text-ink">
                    {s.browser} · {s.sistemOperasi} · {s.perkiraanLokasi}
                  </span>
                  <span className="text-caption text-ink-muted">{p.aktifLalu(formatRelatif(s.aktivitasTerakhir))}</span>
                </span>
                {canManage && (
                  <button type="button" onClick={() => setRevoke(s)} className="text-body-dense font-semibold text-ink underline">
                    {p.keluar}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="text-heading-3 text-ink">{p.riwayatPerubahan}</h3>
        {user.riwayat.length === 0 ? (
          <p className="text-body-dense text-ink-muted">{c.profil.riwayatKosong}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {user.riwayat.map((e) => (
              <li key={e.id} className="flex flex-col gap-0.5">
                <span className="text-body-dense text-ink">{e.peristiwa}</span>
                <span className="text-caption text-ink-muted">
                  {[e.pelaku ? p.oleh(e.pelaku) : null, formatTanggalJam(e.at), e.keterangan].filter(Boolean).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {showLogLinks && (
        <div className="flex flex-wrap gap-4 text-body-dense">
          <Link to={`/log-akses?pengguna=${encodeURIComponent(user.email)}`} className="text-ink underline">
            {c.profil.bukaLogAkses}
          </Link>
          <Link to={`/jejak-audit?objek=${encodeURIComponent(`pengguna #${user.id}`)}&dari=2000-01-01`} className="text-ink underline">
            {c.profil.bukaJejakAudit}
          </Link>
        </div>
      )}
      {revoke && <SessionRevokeDialog user={user} session={revoke} onClose={() => setRevoke(null)} />}
    </div>
  );
}
