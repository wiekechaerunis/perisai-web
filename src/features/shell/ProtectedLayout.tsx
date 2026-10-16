/**
 * Kerangka halaman setelah login, mengikuti Figma 66:3139 / 238:3000: Sidebar (logo, Ikhtisar, seksi Administrasi,
 * hak cipta) + header 56px dengan menu pengguna (Akun Saya / Keluar; Figma 341:6720).
 * FR-LG-26 (menu dibatasi role), FR-LO-01..04 (Keluar dari setiap halaman), FR-AS-001 (Akun Saya dari menu profil
 * di header), FR-LO-09 (peringatan idle), FR-PA-18a (toast saat role/hak akses berubah di tengah sesi; menu ikut
 * diperbarui karena dibangun dari sesi yang di-poll).
 * Header Figma juga memuat pencarian global, "Tanya PERISAI", bahasa, dan notifikasi — modul itu (M-02, M-20,
 * NFR-07) belum dirilis sehingga tidak ditampilkan (K-6, F-24).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applyRoleCatalog } from '@/lib/role-catalog';
import { ChevronDown, LogOut, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/patterns/Toast';
import { accessCopy } from '../access/copy';
import logoSidebar from '@/assets/figma/perisai-logo-sidebar.png';
import { AppHeader, AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { Menu } from '@/components/patterns/Menu';
import { t } from '@/lib/i18n/id';
import { roleName } from '@/lib/rbac';
import { services } from '@/services';
import { DevTools } from '../dev/DevTools';
import { IdleWarning } from '../session/IdleWarning';
import { SESSION_QUERY_KEY, useSessionGuard, type LoginRedirectState } from '../session/SessionProvider';
import { useEmailRequests } from '../users/PermintaanEmailPage';
import { buildNav, EMAIL_APPROVER_ROLES } from './navigation';

function initials(nama: string): string {
  return nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export function ProtectedLayout() {
  const session = useSessionGuard();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  // FR-UDR-15: badge jumlah permintaan ubah email yang menunggu penyetuju ini.
  const isApprover = !!session?.user.roles.some((r) => EMAIL_APPROVER_ROLES.includes(r));
  // PRD Katalog Role FR-KR-03: seluruh tampilan role membaca katalog yang sama (nama + status).
  const catalog = useQuery({ queryKey: ['role-catalog'], queryFn: () => services.roles.catalog(), enabled: !!session, staleTime: 60_000 });
  if (catalog.data) applyRoleCatalog(catalog.data);
  const emailRequests = useEmailRequests(isApprover);

  // FR-PA-18a: hak akses berubah di tengah sesi → beri tahu dan segarkan data yang bergantung pada role.
  const rolesKey = session ? [...session.user.roles].sort().join(',') : null;
  const prevRoles = useRef<string | null>(null);
  useEffect(() => {
    if (!rolesKey) return;
    if (prevRoles.current && prevRoles.current !== rolesKey) {
      toast.show({ title: accessCopy.hakBerubah });
      void qc.invalidateQueries({ predicate: (q) => q.queryKey[0] !== SESSION_QUERY_KEY[0] });
    }
    prevRoles.current = rolesKey;
  }, [rolesKey, toast, qc]);

  const logout = useMutation({
    mutationFn: () => services.auth.logout(),
    onSettled: () => {
      qc.clear();
      const state: LoginRedirectState = { reason: 'logout' };
      navigate('/masuk', { replace: true, state });
      void qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    },
  });

  if (!session) {
    return (
      <div role="status" className="p-10 text-body text-ink-muted">
        {t.app.memuat}
      </div>
    );
  }

  const { user } = session;
  const roleLabel = user.roles.map((r) => roleName(r)).join(', ');

  const userMenu = (
    <Menu
      align="end"
      header={
        <div className="flex flex-col gap-0.5">
          <span className="text-caption font-medium text-ink">{user.nama}</span>
          <span className="text-caption text-ink-subtle">{user.email}</span>
        </div>
      }
      items={[
        { key: 'akun', label: t.akun.akunSaya, icon: <User aria-hidden size={16} strokeWidth={1.8} />, onSelect: () => navigate('/akun-saya') },
        { key: 'keluar', label: t.akun.keluar, icon: <LogOut aria-hidden size={16} strokeWidth={1.8} />, onSelect: () => logout.mutate() },
      ]}
      trigger={
        <button
          type="button"
          aria-label={`${t.akun.menu}: ${user.nama}`}
          className="flex h-control-md items-center gap-2 rounded-sm border border-border bg-surface px-2 hover:bg-surface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-action text-caption font-semibold text-on-action">
            {initials(user.nama)}
          </span>
          <span className="hidden flex-col text-left sm:flex">
            <span className="text-caption font-medium leading-4 text-ink">{user.nama}</span>
            <span className="text-caption leading-4 text-ink-muted">{roleLabel}</span>
          </span>
          <ChevronDown aria-hidden size={14} strokeWidth={1.8} className="text-ink-muted" />
        </button>
      }
    />
  );

  return (
    <AppShell
      skipLinkLabel={t.app.lompatKeKonten}
      header={<AppHeader end={userMenu} />}
      sidebar={
        <Sidebar
          navLabel={t.app.navUtama}
          brand={<img src={logoSidebar} alt="PERISAI" className="h-[48px] w-[143px] object-contain object-left" />}
          groups={buildNav(user.roles, { '/permintaan-ubah-email': emailRequests.data?.length ?? 0 })}
          footer={
            <div className="flex flex-col gap-3">
              {services.dev && <DevTools />}
              <p className="text-caption text-sidebar-muted">{t.akun.hakCipta}</p>
            </div>
          }
        />
      }
    >
      <Outlet />
      <IdleWarning onLogout={() => logout.mutate()} />
    </AppShell>
  );
}
