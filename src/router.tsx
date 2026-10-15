/**
 * Peta rute. Lihat TRACEABILITY.md untuk FR ID per rute.
 */
import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AkunSayaKeamananPage, AkunSayaLayout, AkunSayaProfilPage } from './features/account/AkunSayaPages';
import { AturUlangKataSandiPage } from './features/auth/pages/AturUlangKataSandiPage';
import { LupaKataSandiPage } from './features/auth/pages/LupaKataSandiPage';
import { AktivasiOtpPage } from './features/auth/pages/AktivasiOtpPage';
import { AktivasiPage } from './features/auth/pages/AktivasiPage';
import { LoginOtpPage } from './features/auth/pages/LoginOtpPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { useSession } from './features/session/SessionProvider';
import { NotFoundPage } from './features/shell/ErrorPages';
import { DASHBOARD_ROLES, EMAIL_APPROVER_ROLES, landingPath, LOG_ROLES, ORG_ROLES, ROLE_ADMIN_ROLES } from './features/shell/navigation';
import { BuatRolePage } from './features/roles/BuatRolePage';
import { RoleDetailPage, RolePage } from './features/roles/RolePage';
import { OrganisasiDetailRoute, OrganisasiPage } from './features/orgs/OrganisasiPage';
import { JejakAuditPage } from './features/logs/JejakAuditPage';
import { LogAksesPage } from './features/logs/LogAksesPage';
import { ProtectedLayout } from './features/shell/ProtectedLayout';
import { RequireModule } from './features/shell/RequireModule';
import { PenggunaPage } from './features/users/PenggunaPage';
import { UserDetailPage } from './features/users/components/UserDetailPanel';
import { PermintaanEmailPage } from './features/users/PermintaanEmailPage';
import { UbahPenggunaPage } from './features/users/UbahPenggunaPage';
import { BukanSayaPage, VerifikasiEmailPage } from './features/email-links/EmailLinkPages';
import { RuangKerjaPage } from './features/workspace/RuangKerjaPage';
import { KontrakDetailPage, KontrakListPage } from './features/contracts/KontrakPages';
import { DasborEksekutifPage, PetaPanasPage } from './features/dashboard/DashboardPages';
import { InsidenDetailPage, InsidenListPage } from './features/incidents/InsidenPages';
import { LaporInsidenPage } from './features/incidents/LaporInsidenPage';
import { AnalitikPage, KonsepPage, LaporanPage, PeringatanDiniPage, PksPage, ProfilKkksPage, RisikoPage, TindakLanjutPage } from './features/modules/ModulePages';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { WpbDetailPage, WpbPage } from './features/wpb/WpbPages';
import { t } from './lib/i18n/id';

function RootRedirect() {
  const { state, session } = useSession();
  if (!state) return <p role="status" className="p-10 text-body text-ink-muted">{t.app.memuat}</p>;
  return <Navigate to={session ? landingPath(session.user.roles) : '/masuk'} replace />;
}

export const routes: RouteObject[] = [
  { path: '/', element: <RootRedirect /> },
  // Publik
  { path: '/masuk', element: <LoginPage /> },
  { path: '/masuk/verifikasi', element: <LoginOtpPage /> },
  { path: '/aktivasi/:token', element: <AktivasiPage /> },
  { path: '/aktivasi/:token/verifikasi', element: <AktivasiOtpPage /> },
  { path: '/lupa-kata-sandi', element: <LupaKataSandiPage /> },
  { path: '/atur-ulang-kata-sandi/:token', element: <AturUlangKataSandiPage /> },
  // PRD Ubah Data & Role Pengguna: tautan email publik (FR-UDR-05, -13, -14)
  { path: '/verifikasi-email/:token', element: <VerifikasiEmailPage /> },
  { path: '/bukan-saya/:token', element: <BukanSayaPage /> },
  // Setelah login
  {
    element: <ProtectedLayout />,
    children: [
      // Prototype kick-off 21 Okt 2026: modul di luar Core Platform.
      { path: '/lapor', element: <RequireModule module="M-05" roles={['R-05']}><LaporInsidenPage /></RequireModule> },
      { path: '/insiden', element: <RequireModule module="M-05"><InsidenListPage /></RequireModule> },
      { path: '/insiden/:id', element: <RequireModule module="M-05"><InsidenDetailPage /></RequireModule> },
      { path: '/wpb', element: <RequireModule module="M-06"><WpbPage /></RequireModule> },
      { path: '/wpb/:id', element: <RequireModule module="M-06"><WpbDetailPage /></RequireModule> },
      { path: '/kontrak', element: <RequireModule module="M-07"><KontrakListPage /></RequireModule> },
      { path: '/kontrak/:id', element: <RequireModule module="M-07"><KontrakDetailPage /></RequireModule> },
      { path: '/pks-pkt', element: <RequireModule module="M-07"><PksPage /></RequireModule> },
      { path: '/dasbor', element: <RequireModule module="M-13" roles={DASHBOARD_ROLES}><DasborEksekutifPage /></RequireModule> },
      { path: '/peta-panas', element: <RequireModule module="M-11"><PetaPanasPage /></RequireModule> },
      { path: '/risiko', element: <RequireModule module="M-04"><RisikoPage /></RequireModule> },
      { path: '/tindak-lanjut', element: <RequireModule module="M-09"><TindakLanjutPage /></RequireModule> },
      { path: '/peringatan-dini', element: <RequireModule module="M-12"><PeringatanDiniPage /></RequireModule> },
      { path: '/profil-kkks', element: <RequireModule module="M-03"><ProfilKkksPage /></RequireModule> },
      { path: '/analitik', element: <RequireModule module="M-10"><AnalitikPage /></RequireModule> },
      { path: '/laporan', element: <RequireModule module="M-13"><LaporanPage /></RequireModule> },
      { path: '/konsep/bahan-peledak', element: <RequireModule module="M-08"><KonsepPage slug="bahan-peledak" /></RequireModule> },
      { path: '/konsep/layanan-infrastruktur', element: <RequireModule module="M-25"><KonsepPage slug="layanan-infrastruktur" /></RequireModule> },
      { path: '/konsep/k3', element: <RequireModule module="M-24"><KonsepPage slug="k3" /></RequireModule> },
      { path: '/konsep/asisten', element: <RequireModule module="M-02"><KonsepPage slug="asisten" /></RequireModule> },
      { path: '/konsep/informasi-eksternal', element: <RequireModule module="M-14"><KonsepPage slug="informasi-eksternal" /></RequireModule> },
      { path: '/notifikasi', element: <NotificationsPage /> },
      {
        path: '/ruang-kerja',
        element: (
          <RequireModule module="M-01">
            <RuangKerjaPage />
          </RequireModule>
        ),
      },
      {
        path: '/pengguna',
        element: (
          <RequireModule module="M-15">
            <PenggunaPage />
          </RequireModule>
        ),
      },
      {
        // Detail pengguna sebagai halaman penuh (arahan PM 15 Okt 2026).
        path: '/pengguna/:id',
        element: (
          <RequireModule module="M-15">
            <UserDetailPage />
          </RequireModule>
        ),
      },
      // PRD Katalog Role & Aktif/Nonaktif Role
      {
        path: '/role',
        element: (
          <RequireModule module="M-15" roles={ROLE_ADMIN_ROLES}>
            <RolePage />
          </RequireModule>
        ),
      },
      {
        // FR-KR-09: Buat role sebagai halaman penuh (arahan PM 15 Okt 2026).
        path: '/role/baru',
        element: (
          <RequireModule module="M-15" roles={ROLE_ADMIN_ROLES}>
            <BuatRolePage />
          </RequireModule>
        ),
      },
      {
        // Detail role sebagai halaman penuh (arahan PM 15 Okt 2026).
        path: '/role/:kode',
        element: (
          <RequireModule module="M-15" roles={ROLE_ADMIN_ROLES}>
            <RoleDetailPage />
          </RequireModule>
        ),
      },
      // PRD Kelola Organisasi KKKS (FR-ORG-01..30, 40..45)
      {
        path: '/organisasi',
        element: (
          <RequireModule module="M-15" roles={ORG_ROLES}>
            <OrganisasiPage />
          </RequireModule>
        ),
      },
      {
        // Detail organisasi sebagai halaman penuh (arahan PM 15 Okt 2026).
        path: '/organisasi/:kode',
        element: (
          <RequireModule module="M-15" roles={ORG_ROLES}>
            <OrganisasiDetailRoute />
          </RequireModule>
        ),
      },
      // PRD Ubah Data & Role Pengguna (FR-UDR-01..10, -15, -16)
      {
        path: '/pengguna/:id/ubah',
        element: (
          <RequireModule module="M-15">
            <UbahPenggunaPage />
          </RequireModule>
        ),
      },
      {
        path: '/permintaan-ubah-email',
        element: (
          <RequireModule module="M-15" roles={EMAIL_APPROVER_ROLES}>
            <PermintaanEmailPage />
          </RequireModule>
        ),
      },
      // Gelombang 3: PRD Log Akses (FR-LA-*) dan Jejak Audit (FR-JA-*)
      {
        path: '/log-akses',
        element: (
          <RequireModule module="M-22" roles={LOG_ROLES}>
            <LogAksesPage />
          </RequireModule>
        ),
      },
      {
        path: '/jejak-audit',
        element: (
          <RequireModule module="M-22" roles={LOG_ROLES}>
            <JejakAuditPage />
          </RequireModule>
        ),
      },
      {
        path: '/akun-saya',
        element: <AkunSayaLayout />,
        children: [
          { index: true, element: <AkunSayaProfilPage /> },
          { path: 'keamanan', element: <AkunSayaKeamananPage /> },
        ],
      },
      // Rute lama gelombang 1 (Pengaturan akun) → Akun Saya (K-8).
      { path: '/pengaturan-akun/*', element: <Navigate to="/akun-saya/keamanan" replace /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes, {
    future: { v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true },
  });
}
