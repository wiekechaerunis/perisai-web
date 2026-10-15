/**
 * Pengganti peran untuk demo kick-off (hanya adapter mock). Masuk sebagai akun uji per peran tanpa kata sandi + OTP,
 * agar presenter dapat berpindah sudut pandang SKK ↔ KKKS di tengah alur. Daftar persona di `DEMO_PERSONAS`.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { RoleSwitcher } from '@/components/layout/RoleSwitcher';
import { roleName, type RoleId } from '@/lib/rbac';
import { services } from '@/services';
import { SESSION_QUERY_KEY, useSession } from '../session/SessionProvider';

/** Persona demo (akun uji Core Platform). Label role dibaca dari peta role tunggal (`lib/rbac`). */
export const DEMO_PERSONAS: { userId: string; role: RoleId; nama: string; organisasi: string }[] = [
  { userId: 'u-01', role: 'R-01', nama: 'Hendra Wibisono', organisasi: 'SKK Migas' },
  { userId: 'u-02', role: 'R-02', nama: 'Ratna Paramitha', organisasi: 'SKK Migas' },
  { userId: 'u-05', role: 'R-05', nama: 'Dimas Pratama', organisasi: 'PT Andalas Energi Hulu' },
  { userId: 'u-06', role: 'R-06', nama: 'Sri Lestari', organisasi: 'PT Andalas Energi Hulu' },
  { userId: 'u-04', role: 'R-04', nama: 'Rina Wiyono', organisasi: 'PT Andalas Energi Hulu' },
];

export function DemoRoleSwitcher() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { session } = useSession();
  const switchTo = useMutation({
    mutationFn: (id: string) => services.dev!.signInAs(id),
    onSuccess: async () => {
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== SESSION_QUERY_KEY[0] });
      await qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      navigate('/');
    },
  });
  if (!services.dev) return null;
  return (
    <div className="w-full max-w-[340px]">
      <RoleSwitcher
        tone="default"
        hideLabel
        label="Ganti peran (demo)"
        placeholder="Ganti peran (demo)"
        currentUserId={session?.user.id}
        onSelect={(id) => switchTo.mutate(id)}
        users={DEMO_PERSONAS.map((p) => ({ id: p.userId, label: `${roleName(p.role)} · ${p.nama}` }))}
      />
    </div>
  );
}
