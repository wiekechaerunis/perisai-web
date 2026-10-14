/**
 * Penjaga rute per modul (FR-LG-26). Membuka URL modul di luar hak akses → halaman "Anda tidak memiliki akses".
 * Versi lengkap (kode penolakan, alert dalam halaman, pencatatan) dibangun di gelombang 3 (PRD Penegakan Hak Akses).
 * ASSUMPTION (PR-03): penolakan navigasi belum dicatat di klien; pencatatan adalah tugas backend.
 */
import type { ReactNode } from 'react';
import { can, MODULES, RELEASED_MODULES, type ModuleId, type RoleId } from '@/lib/rbac';
import { useSession } from '../session/SessionProvider';
import { ForbiddenPage, NotFoundPage } from './ErrorPages';

export function RequireModule({ module, roles, children }: { module: ModuleId; roles?: readonly RoleId[]; children: ReactNode }) {
  const { session } = useSession();
  if (!session) return null;
  // Modul belum dirilis → 404, sama dengan data yang tidak ada (Tabel P-1 MODULE_UNAVAILABLE).
  if (!RELEASED_MODULES.has(module)) return <NotFoundPage />;
  const roleOk = !roles || session.user.roles.some((r) => roles.includes(r));
  if (!can(session.user.roles, module, 'view') || !roleOk) return <ForbiddenPage moduleName={MODULES[module].name} />;
  return <>{children}</>;
}
