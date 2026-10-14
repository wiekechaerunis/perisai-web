import { useQuery } from '@tanstack/react-query';
import { services } from '@/services';
import { logsCopy as c } from './copy';

/** Opsi filter organisasi; organisasi nonaktif diberi label "(Nonaktif)" (FR-LA-08, FR-JA-13). */
export function useOrganisasiFilter(enabled: boolean) {
  const q = useQuery({ queryKey: ['organisasi', 'undangan'], queryFn: () => services.users.listOrganisasi(), enabled, staleTime: 60_000, retry: false });
  return (q.data ?? []).map((o) => ({ value: o.id, label: o.status === 'Nonaktif' ? `${o.nama} ${c.nonaktif}` : o.nama }));
}
