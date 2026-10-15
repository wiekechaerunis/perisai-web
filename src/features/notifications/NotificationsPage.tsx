/**
 * Notifikasi (M-20, PLT notifikasi) — prototype kick-off. Tombol lonceng di header + halaman pusat notifikasi.
 * Isi per peran dari data layer: insiden tinggi/kritis "Belum terverifikasi" ke Pengawas & Pimpinan SKK (BR-INS-04),
 * pengingat kontrak 12/6/3/1 bulan (AB-09), berita acara menunggu dokumen bertanda tangan (BR-DOK-04).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { EmptyState } from '@/components/patterns/EmptyState';
import { Button } from '@/components/ui/Button';
import { SeverityBadge } from '@/components/ui/SeverityBadge';
import { formatRelatif, formatTanggalJam } from '@/lib/format';
import { cn } from '@/lib/cn';
import { services } from '@/services';

export const NOTIF_KEY = ['ops', 'notifications'] as const;

export function useNotifications(enabled = true) {
  return useQuery({ queryKey: NOTIF_KEY, queryFn: () => services.ops.notifications.list(), enabled, refetchInterval: 15_000 });
}

export function NotificationBell() {
  const q = useNotifications();
  const unread = (q.data ?? []).filter((n) => !n.dibaca).length;
  return (
    <Link
      to="/notifikasi"
      aria-label={unread ? `Notifikasi, ${unread} belum dibaca` : 'Notifikasi'}
      className="relative flex h-control-md w-control-md items-center justify-center rounded-md border border-border bg-surface text-ink hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
    >
      <Bell aria-hidden size={18} strokeWidth={1.8} />
      {unread > 0 && (
        <span aria-hidden className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-count-bg px-1 text-center font-mono text-caption leading-[18px] text-count-ink">
          {unread}
        </span>
      )}
    </Link>
  );
}

export function NotificationsPage() {
  const qc = useQueryClient();
  const q = useNotifications();
  const read = useMutation({ mutationFn: () => services.ops.notifications.markAllRead(), onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEY }) });
  const rows = q.data ?? [];
  return (
    <>
      <PageHeader
        title="Notifikasi"
        summary="Pemberitahuan sesuai peran dan cakupan Anda. Notifikasi eskalasi dan persetujuan tidak dapat dimatikan."
        actions={rows.some((n) => !n.dibaca) ? <Button onClick={() => read.mutate()} loading={read.isPending}>Tandai semua dibaca</Button> : undefined}
      />
      <PageBody>
        <Section className="border border-border">
          {q.isPending ? (
            <p className="text-body-dense text-ink-muted">Memuat…</p>
          ) : rows.length === 0 ? (
            <EmptyState title="Belum ada notifikasi." />
          ) : (
            <ul className="flex flex-col">
              {rows.map((n) => (
                <li key={n.id} className="border-b border-border-subtle last:border-b-0">
                  <Link to={n.link} className={cn('flex items-start gap-3 px-1 py-3 hover:bg-surface-sunken', !n.dibaca && 'font-medium')}>
                    <span aria-hidden className={cn('mt-[6px] h-2 w-2 shrink-0 rounded-full', n.dibaca ? 'bg-transparent' : 'bg-action')} />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-2 text-body-dense text-ink">
                        {n.judul}
                        {n.kritis && <SeverityBadge level="Kritis" />}
                      </span>
                      <span className="text-caption font-normal text-ink-muted">{n.isi}</span>
                    </span>
                    <span className="shrink-0 font-mono text-caption font-normal text-ink-subtle" title={formatTanggalJam(n.at)}>
                      {formatRelatif(n.at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </PageBody>
    </>
  );
}
