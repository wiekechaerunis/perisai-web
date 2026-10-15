/**
 * Query & mutasi bersama modul operasional (prototype kick-off). Semua lewat `services.ops` (data layer bisa ditukar).
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatPersen } from '@/lib/format';
import { services } from '@/services';

export const OPS_KEY = ['ops'] as const;

export const useOpsRefs = () => useQuery({ queryKey: [...OPS_KEY, 'refs'], queryFn: () => services.ops.refs(), staleTime: 60_000 });
export const useWorkspace = () => useQuery({ queryKey: [...OPS_KEY, 'workspace'], queryFn: () => services.ops.workspace() });
export const useIncidents = (filter: { wkId?: string; verifiedOnly?: boolean } = {}) =>
  useQuery({ queryKey: [...OPS_KEY, 'incidents', filter], queryFn: () => services.ops.incidents.list(filter) });
export const useIncident = (id: string | undefined) => useQuery({ queryKey: [...OPS_KEY, 'incident', id], queryFn: () => services.ops.incidents.get(id!), enabled: !!id });
export const useWpbList = () => useQuery({ queryKey: [...OPS_KEY, 'wpb'], queryFn: () => services.ops.wpb.list() });
export const useWpb = (id: string | undefined) => useQuery({ queryKey: [...OPS_KEY, 'wpb', id], queryFn: () => services.ops.wpb.get(id!), enabled: !!id });
export const useWpbSummary = () => useQuery({ queryKey: [...OPS_KEY, 'wpb-summary'], queryFn: () => services.ops.wpb.summary() });
export const useContracts = () => useQuery({ queryKey: [...OPS_KEY, 'contracts'], queryFn: () => services.ops.contracts.list() });
export const useContract = (id: string | undefined) => useQuery({ queryKey: [...OPS_KEY, 'contract', id], queryFn: () => services.ops.contracts.get(id!), enabled: !!id });
export const useExecutive = () => useQuery({ queryKey: [...OPS_KEY, 'executive'], queryFn: () => services.ops.executive() });
export const useHeatmap = () => useQuery({ queryKey: [...OPS_KEY, 'heatmap'], queryFn: () => services.ops.heatmap() });
export const usePks = () => useQuery({ queryKey: [...OPS_KEY, 'pks'], queryFn: () => services.ops.pks() });
export const useFollowUps = () => useQuery({ queryKey: [...OPS_KEY, 'follow-ups'], queryFn: () => services.ops.followUps() });

/** Segarkan semua data operasional (dan notifikasi) setelah aksi. */
export function useInvalidateOps() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: OPS_KEY });
}

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const namaPeriode = (p: { bulan: number; tahun: number }) => `${NAMA_BULAN[p.bulan - 1]} ${p.tahun}`;

/** Rupiah ringkas untuk dasbor: "Rp 1,35 M" / "Rp 820 jt". */
export function rupiahRingkas(v: number): string {
  if (Math.abs(v) >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
  return `Rp ${Math.round(v / 1_000_000).toLocaleString('id-ID')} jt`;
}

/** Persen dari pecahan: 0.93 → "93%" (formatPersen menerima nilai persen). */
export function persen(fraction: number): string {
  return formatPersen(Math.round(fraction * 100));
}
