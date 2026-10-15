/**
 * Navigasi role-aware. Item hanya tampil bila modul DIRILIS dan role punya izin `view`
 * (PU-04, FR-PA-10, FR-LG-26). Tidak ada item yang dinonaktifkan — disembunyikan.
 *
 * Struktur mengikuti Figma 238:3000: menu utama ("Ikhtisar", "Alur Kerja", "Tata Kelola", "Sistem") lalu seksi
 * "Administrasi" (Pengguna, Grup, Role, Log Akses). Yang belum dirilis tidak tampil (K-6): saat ini hanya Ikhtisar (M-01)
 * dan Pengguna (M-15). Grup (KD-03), Role (PRD Katalog Role belum ditarik), Log Akses (gelombang 3) menyusul.
 * Gelombang 3: Log Akses dan Jejak Audit (M-22) untuk R-02/R-03/R-04 (FR-LA-06, FR-JA-06).
 * Keputusan PM 14 Okt 2026 (PR-13): R-07 punya "view (log teknis)" di Matriks M-22, tetapi PRD Log Akses/Jejak Audit tidak
 * memberinya akses ke kedua halaman ini → disembunyikan; log teknis menjadi bagian M-19/M-23.
 */
import { Building2, History, KeySquare, LayoutDashboard, MailCheck, ScrollText, Settings, Users } from 'lucide-react';
import type { SidebarGroup } from '@/components/layout/Sidebar';
import { t } from '@/lib/i18n/id';
import { canSeeInNav, type ModuleId, type RoleId } from '@/lib/rbac';

interface NavEntry {
  module: ModuleId;
  label: string;
  to: string;
  icon?: JSX.Element;
  /** Bila diisi, hanya role ini yang boleh membuka halaman (di atas izin `view` modul). */
  roles?: readonly RoleId[];
}

export const LOG_ROLES: readonly RoleId[] = ['R-02', 'R-03', 'R-04'];
/** FR-UDR-15: penyetuju ubah email (Admin SKK, Admin KKKS). */
export const EMAIL_APPROVER_ROLES: readonly RoleId[] = ['R-03', 'R-04'];
/** PRD Kelola Organisasi KKKS (FR-ORG-01, -20, -40; keputusan PM 14 Okt 2026). Digerbangi M-15 karena PRD berada di
 * bawah User Management (BRD menaruh identitas KKKS di M-03 yang belum dirilis; disetujui PM 14 Okt 2026). */
export const ORG_ROLES: readonly RoleId[] = ['R-03', 'R-07', 'R-04'];
/** PRD Katalog Role FR-KR-06: halaman Role hanya Admin SKK. */
export const ROLE_ADMIN_ROLES: readonly RoleId[] = ['R-03'];

const ICON = { size: 18, strokeWidth: 1.8, 'aria-hidden': true } as const;

const NAV: { key: string; label?: string; icon?: JSX.Element; collapsible?: boolean; entries: NavEntry[] }[] = [
  {
    key: 'utama',
    // ASSUMPTION (K-7 → F-23): label "Ikhtisar" (Figma + PRD Login Goals) untuk M-01 Ruang Kerja.
    entries: [{ module: 'M-01', label: t.nav.ikhtisar, to: '/ruang-kerja', icon: <LayoutDashboard {...ICON} /> }],
  },
  {
    key: 'administrasi',
    label: t.nav.administrasi,
    icon: <Settings size={14} strokeWidth={1.8} aria-hidden />,
    collapsible: true,
    entries: [
      { module: 'M-15', label: t.nav.pengguna, to: '/pengguna', icon: <Users size={16} strokeWidth={1.8} aria-hidden /> },
      // FR-ORG-01: Organisasi di antara Pengguna dan Grup (Grup ditahan KD-03).
      { module: 'M-15', label: t.nav.organisasi, to: '/organisasi', roles: ORG_ROLES, icon: <Building2 size={16} strokeWidth={1.8} aria-hidden /> },
      // FR-KR-06: Role (Figma 238:3000 menyebut seksi Administrasi: Pengguna, Grup, Role, Log Akses).
      { module: 'M-15', label: t.nav.role, to: '/role', roles: ROLE_ADMIN_ROLES, icon: <KeySquare size={16} strokeWidth={1.8} aria-hidden /> },
      // FR-UDR-15: daftar Permintaan Ubah Email + badge jumlah menunggu ("User administration" = seksi Administrasi).
      { module: 'M-15', label: t.nav.permintaanEmail, to: '/permintaan-ubah-email', roles: EMAIL_APPROVER_ROLES, icon: <MailCheck size={16} strokeWidth={1.8} aria-hidden /> },
      { module: 'M-22', label: t.nav.logAkses, to: '/log-akses', roles: LOG_ROLES, icon: <History size={16} strokeWidth={1.8} aria-hidden /> },
      { module: 'M-22', label: t.nav.jejakAudit, to: '/jejak-audit', roles: LOG_ROLES, icon: <ScrollText size={16} strokeWidth={1.8} aria-hidden /> },
    ],
  },
];

function entryVisible(roles: readonly RoleId[], e: NavEntry): boolean {
  return canSeeInNav(roles, e.module) && (!e.roles || roles.some((r) => e.roles!.includes(r)));
}

/** `counts`: jumlah item menunggu per rute (badge), mis. permintaan ubah email. */
export function buildNav(roles: readonly RoleId[], counts: Record<string, number> = {}): SidebarGroup[] {
  return NAV.map((g) => ({
    key: g.key,
    label: g.label,
    icon: g.icon,
    collapsible: g.collapsible,
    items: g.entries
      .filter((e) => entryVisible(roles, e))
      .map((e) => ({ key: e.to, label: e.label, to: e.to, icon: e.icon, count: counts[e.to] || undefined })),
  })).filter((g) => g.items.length > 0);
}

/**
 * Halaman pendaratan setelah login (FR-LG-25, FR-AK-14).
 * ASSUMPTION (K-7, K-12): pendaratan = M-01. R-07 tidak punya izin M-01 di Matriks → mendarat di modul
 * pertama yang boleh ia lihat (Pengguna), selain itu Akun Saya.
 */
export function landingPath(roles: readonly RoleId[]): string {
  if (canSeeInNav(roles, 'M-01')) return '/ruang-kerja';
  if (canSeeInNav(roles, 'M-15')) return '/pengguna';
  return '/akun-saya';
}

/** Rute yang hanya butuh login (tanpa modul). */
const ACCOUNT_PATHS = ['/akun-saya'];

/**
 * Tujuan setelah login: halaman yang diingat (FR-LG-28, FR-LO-10) bila role mengizinkan, selain itu pendaratan.
 */
export function allowedReturnPath(path: string | null, roles: readonly RoleId[]): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return landingPath(roles);
  const pathname = path.split(/[?#]/)[0] ?? '';
  if (ACCOUNT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return path;
  for (const g of NAV) {
    for (const e of g.entries) {
      if (pathname === e.to || pathname.startsWith(`${e.to}/`)) return entryVisible(roles, e) ? path : landingPath(roles);
    }
  }
  return landingPath(roles);
}
