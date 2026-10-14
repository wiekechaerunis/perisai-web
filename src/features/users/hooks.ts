/** Query & mutation Manajemen Pengguna. UI hanya lewat services (adapter mock/api). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { services, type InviteInput, type ReasonInput, type UserListQuery } from '@/services';

export const USERS_KEY = ['users'] as const;

export function useUserList(q: UserListQuery) {
  return useQuery({ queryKey: [...USERS_KEY, 'list', q], queryFn: () => services.users.listUsers(q) });
}

export function useUserDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...USERS_KEY, 'detail', id],
    queryFn: () => services.users.getUser(id!),
    enabled: !!id,
    retry: false,
  });
}

export function useOrganisasi(enabled = true) {
  return useQuery({ queryKey: ['organisasi', 'undangan'], queryFn: () => services.users.listOrganisasi(), enabled, staleTime: 60_000 });
}

export function useWilayahKerja(orgId: string | undefined) {
  return useQuery({
    queryKey: ['wilayah-kerja', orgId],
    queryFn: () => services.users.listWilayahKerja(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

/** Mutasi yang menyegarkan daftar & detail setelah berhasil. */
function useUserMutation<TArgs>(fn: (args: TArgs) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export const useInvite = () => useUserMutation((input: InviteInput) => services.users.invite(input));
export const useResend = () => useUserMutation((id: string) => services.users.resendInvite(id));
export const useCancelInvite = () => useUserMutation(({ id, reason }: { id: string; reason: ReasonInput }) => services.users.cancelInvite(id, reason));
export const useSuspend = () => useUserMutation(({ id, reason }: { id: string; reason: ReasonInput }) => services.users.suspend(id, reason));
export const useDeactivate = () => useUserMutation(({ id, reason }: { id: string; reason: ReasonInput }) => services.users.deactivate(id, reason));
export const useReactivate = () => useUserMutation((id: string) => services.users.reactivate(id));
export const useSetAccessEnd = () => useUserMutation(({ id, date }: { id: string; date: string | null }) => services.users.setAccessEnd(id, date));
export const useRevokeSessions = () => useUserMutation(({ id, reason }: { id: string; reason: ReasonInput }) => services.users.revokeSessions(id, reason));
