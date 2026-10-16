/**
 * Halaman penolakan (Tabel P-1 PRD Penegakan Hak Akses) dan 404 — DS v2 StatusPage di dalam AppShell: ilustrasi
 * il-akses-ditolak / il-tidak-ditemukan, judul 20px, satu tombol sekunder (jalan keluar).
 * FR-PA-19 diputuskan PM (14 Okt 2026): tautan kembali ke Ruang Kerja (M-01, label navigasi "Ikhtisar", K-7).
 * Disetujui PM 14 Okt 2026: R-07 tidak punya izin M-01 → tautan ke halaman pendaratannya (K-12) agar tidak berputar di 403.
 */
import { useNavigate } from 'react-router-dom';
import { canSeeInNav } from '@/lib/rbac';
import { useSession } from '../session/SessionProvider';
import { landingPath } from './navigation';
import { StatePanel } from '@/components/patterns/StatePanel';
import { Button } from '@/components/ui/Button';
import { t } from '@/lib/i18n/id';

function BackButton() {
  const navigate = useNavigate();
  const roles = useSession().session?.user.roles ?? [];
  const target = canSeeInNav(roles, 'M-01') ? '/ruang-kerja' : landingPath(roles);
  return (
    <div className="flex justify-center">
      <Button variant="secondary" onClick={() => navigate(target)}>
        {t.galat.kembaliKeRuangKerja}
      </Button>
    </div>
  );
}

export function ForbiddenPage({ moduleName }: { moduleName: string }) {
  return (
    <div className="flex min-h-[calc(100vh-var(--topbar-height))] items-center justify-center p-6">
      <StatePanel align="center" illustration="akses-ditolak" title={t.galat.tidakBerwenangJudul} description={t.galat.tidakBerwenangIsi(moduleName)} actions={<BackButton />} />
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-var(--topbar-height))] items-center justify-center p-6">
      <StatePanel align="center" illustration="tidak-ditemukan" title={t.galat.tidakDitemukanJudul} description={t.galat.tidakDitemukanIsi} actions={<BackButton />} />
    </div>
  );
}
