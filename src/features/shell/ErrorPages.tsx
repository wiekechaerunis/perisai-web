/**
 * Halaman penolakan minimal (Tabel P-1 PRD Penegakan Hak Akses). Desain lengkap di gelombang 3.
 * FR-PA-19 diputuskan PM (14 Okt 2026): tautan kembali ke Ruang Kerja (M-01, label navigasi "Ikhtisar", K-7).
 * Disetujui PM 14 Okt 2026: R-07 tidak punya izin M-01 → tautan ke halaman pendaratannya (K-12) agar tidak berputar di 403.
 */
import { Ban, FileQuestion } from 'lucide-react';
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
    <div>
      <Button variant="primary" onClick={() => navigate(target)}>
        {t.galat.kembaliKeRuangKerja}
      </Button>
    </div>
  );
}

export function ForbiddenPage({ moduleName }: { moduleName: string }) {
  return (
    <div className="px-10 py-10">
      <StatePanel icon={Ban} title={t.galat.tidakBerwenangJudul} description={t.galat.tidakBerwenangIsi(moduleName)} actions={<BackButton />} />
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="px-10 py-10">
      <StatePanel icon={FileQuestion} title={t.galat.tidakDitemukanJudul} description={t.galat.tidakDitemukanIsi} actions={<BackButton />} />
    </div>
  );
}
