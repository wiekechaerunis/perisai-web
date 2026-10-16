/**
 * Panel alat dev (hanya adapter mock): RoleSwitcher, Kotak masuk mock (kode OTP, tautan reset/aktivasi),
 * simulasi kejadian sesi (Tabel S-2), dan majukan jam server mock (uji FR-LO-06..09).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlaskConical, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/patterns/Dialog';
import { formatTanggalJam } from '@/lib/format';
import { roleName } from '@/lib/rbac';
import { services } from '@/services';
import { SESSION_QUERY_KEY, useSession } from '../session/SessionProvider';
import { devCopy as c } from './copy';

export function DevRoleSwitcher({ inverse = false }: { inverse?: boolean }) {
  const dev = services.dev;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { session } = useSession();
  const users = useQuery({ queryKey: ['dev', 'users'], queryFn: () => dev!.listUsers(), enabled: !!dev });
  const signIn = useMutation({
    mutationFn: (id: string) => dev!.signInAs(id),
    onSuccess: async () => {
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== SESSION_QUERY_KEY[0] });
      await qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      navigate('/');
    },
  });
  if (!dev) return null;
  const options = (users.data ?? [])
    .filter((u) => u.status === 'Aktif' && !u.catatan)
    // Satu role bisa dipegang beberapa akun uji (mis. Admin KKKS dua organisasi) → sertakan nama dan organisasi.
    .map((u) => ({ id: u.id, label: `${u.roles.join(', ')} ${u.roles.map((r) => roleName(r)).join(', ')} · ${u.nama}, ${u.organisasi}` }));
  return (
    <div>
      <RoleSwitcher
        tone={inverse ? 'inverse' : 'default'}
        users={options}
        currentUserId={session?.user.id}
        onSelect={(id) => signIn.mutate(id)}
        label={c.masukSebagai}
        placeholder={c.pilihRole}
      />
    </div>
  );
}

export function DevTools() {
  const dev = services.dev;
  const qc = useQueryClient();
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const inbox = useQuery({ queryKey: ['dev', 'inbox'], queryFn: () => dev!.inbox(), enabled: !!dev && open, refetchInterval: open ? 2000 : false });
  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: ['dev'] });
      void qc.invalidateQueries({ queryKey: ['users'] });
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
  const [links, setLinks] = useState<string[]>([]);
  if (!dev) return null;
  const run = (fn: () => Promise<unknown>) => act.mutate(fn);
  const issue = (kind: 'aktivasi' | 'reset', state: 'valid' | 'used' | 'expired') =>
    act.mutate(async () => {
      const link = await dev.issueTestLink(kind, state);
      setLinks((prev) => [`${link}`, ...prev].slice(0, 6));
    });

  return (
    <>
      <Button
        variant="quiet"
        icon={<FlaskConical aria-hidden size={16} strokeWidth={1.8} />}
        onClick={() => setOpen(true)}
        className="w-full justify-start"
      >
        {c.judul}
      </Button>
      <Dialog open={open} onOpenChange={setOpen} title={c.judul} description={c.keterangan} closeLabel={c.tutup} size="lg">
        <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto">
          <section className="flex flex-col gap-2">
            <h3 className="text-body-strong text-ink-muted">{c.simulasi}</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => run(() => dev.advanceClock(28 * 60_000))}>{c.majukan28}</Button>
              <Button onClick={() => run(() => dev.advanceClock(11 * 60_000))}>{c.majukan11}</Button>
              <Button onClick={() => run(() => dev.simulateAdminRevoke())}>{c.cabutAdmin}</Button>
              <Button onClick={() => run(() => dev.simulateStatusChange('Ditangguhkan'))}>{c.tangguhkan}</Button>
              <Button onClick={() => run(() => dev.simulateRoleChange())}>{c.ubahRole}</Button>
              <Button onClick={() => run(() => dev.failNextEmail())}>{c.gagalEmail}</Button>
              {session && <Button onClick={() => run(() => dev.decideEmailRequest(session.user.id, true))}>{c.setujuiEmail}</Button>}
              {session && <Button onClick={() => run(() => dev.decideEmailRequest(session.user.id, false))}>{c.tolakEmail}</Button>}
              <Button variant="quiet" onClick={() => run(() => dev.reset())}>{c.resetData}</Button>
            </div>
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="text-body-strong text-ink-muted">{c.tautanUji}</h3>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => issue('reset', 'valid')}>{c.resetValid}</Button>
              <Button onClick={() => issue('reset', 'used')}>{c.resetDipakai}</Button>
              <Button onClick={() => issue('reset', 'expired')}>{c.resetKedaluwarsa}</Button>
              <Button onClick={() => issue('aktivasi', 'valid')}>{c.aktivasiValid}</Button>
              <Button onClick={() => issue('aktivasi', 'used')}>{c.aktivasiDipakai}</Button>
              <Button onClick={() => issue('aktivasi', 'expired')}>{c.aktivasiKedaluwarsa}</Button>
            </div>
            {links.length > 0 && (
              <ul className="flex flex-col gap-1 text-body">
                {links.map((l) => (
                  <li key={l}>
                    <Link to={l} onClick={() => setOpen(false)} className="font-mono text-caption text-ink underline-offset-[3px] hover:underline">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-body-strong text-ink-muted">{c.kotakMasuk}</h3>
              <Button variant="quiet" onClick={() => run(() => dev.clearInbox())}>{c.kosongkan}</Button>
            </div>
            {(inbox.data ?? []).length === 0 ? (
              <p className="text-body text-ink-muted">{c.kotakMasukKosong}</p>
            ) : (
              <ul className="flex flex-col">
                {inbox.data!.map((m) => (
                  <li key={m.id} className="flex flex-col gap-1 border-b border-border-subtle py-3 last:border-b-0">
                    <div className="flex items-center gap-2 text-body font-semibold text-ink">
                      <Mail aria-hidden size={14} strokeWidth={1.8} />
                      {m.subject}
                    </div>
                    <p className="text-caption text-ink-muted">
                      {m.to} · {formatTanggalJam(m.sentAt)}
                    </p>
                    <p className="text-body text-ink">{m.body}</p>
                    {m.link && (
                      <Link to={m.link} onClick={() => setOpen(false)} className="font-mono text-caption text-ink underline-offset-[3px] hover:underline">
                        {m.link}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </Dialog>
    </>
  );
}
