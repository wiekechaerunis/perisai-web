/** Query & mutasi Kelola Organisasi KKKS. UI hanya lewat services (adapter mock/api). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { services, type OrgDetail, type OrgQuery } from '@/services';

export const ORGS_KEY = ['orgs'] as const;

export function useOrgList(q: OrgQuery, enabled = true) {
  return useQuery({ queryKey: [...ORGS_KEY, 'list', q], queryFn: () => services.orgs.list(q), enabled });
}

export function useOrgDetail(kode: string | undefined) {
  return useQuery({ queryKey: [...ORGS_KEY, 'detail', kode], queryFn: () => services.orgs.get(kode!), enabled: !!kode, retry: false });
}

export function useOrgHistory(kode: string) {
  return useQuery({ queryKey: [...ORGS_KEY, 'history', kode], queryFn: () => services.orgs.history(kode) });
}

/** Mutasi organisasi: perbarui cache detail lalu segarkan daftar, organisasi untuk Undang, dan pengguna. */
export function useOrgMutation<TArgs>(fn: (args: TArgs) => Promise<OrgDetail>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (o) => {
      qc.setQueryData([...ORGS_KEY, 'detail', o.kode], o);
      void qc.invalidateQueries({ queryKey: ORGS_KEY });
      // FR-ORG-08: pilihan organisasi di Undang Pengguna diperbarui tanpa memuat ulang aplikasi.
      void qc.invalidateQueries({ queryKey: ['organisasi'] });
      void qc.invalidateQueries({ queryKey: ['wilayah-kerja'] });
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
