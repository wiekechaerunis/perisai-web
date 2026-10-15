/**
 * Nada badge status modul operasional (prototype kick-off). Status di luar daftar baku DS WorkflowStatus dicatat di
 * DS_GAPS.md (DS-07). Aturan: selesai/final = success, menunggu/berjalan = neutral/strong, perlu perbaikan atau
 * mendekati batas = warning, berakhir = danger, belum terverifikasi = caution (kondisi abnormal).
 */
import type { WorkflowTone } from '@/components/ui/WorkflowStatus';
import type { ContractStatus, FollowUpStatus, IncidentStatus, WpbStatus } from '@/services';

export const INCIDENT_TONE: Record<IncidentStatus, WorkflowTone> = {
  'Belum terverifikasi': 'caution',
  Dikembalikan: 'warning',
  Terverifikasi: 'strong',
  Ditangani: 'neutral',
  Ditutup: 'success',
};

export const WPB_TONE: Record<WpbStatus, WorkflowTone> = {
  Draft: 'muted',
  'Review Internal KKKS': 'neutral',
  'Perlu Perbaikan': 'warning',
  'Difinalisasi KKKS': 'strong',
  'Menunggu Dokumen Bertanda Tangan': 'strong',
  Final: 'success',
};

export const CONTRACT_TONE: Record<ContractStatus, WorkflowTone> = {
  Aktif: 'success',
  'Akan Berakhir': 'warning',
  Berakhir: 'danger',
  Diperpanjang: 'neutral',
};

export const FOLLOWUP_TONE: Record<FollowUpStatus, WorkflowTone> = {
  Terbuka: 'neutral',
  Dikerjakan: 'strong',
  'Menunggu Bukti': 'warning',
  Selesai: 'success',
};

/** Urutan tahap ProcessPath WP&B (BRD 3.4). */
export const WPB_STEPS = ['Draft', 'Review Internal KKKS', 'Difinalisasi KKKS', 'Menunggu Dokumen Bertanda Tangan', 'Final'] as const;
export function wpbStepIndex(s: WpbStatus): number {
  if (s === 'Perlu Perbaikan') return 0;
  if (s === 'Menunggu Dokumen Bertanda Tangan') return 3;
  if (s === 'Final') return WPB_STEPS.length;
  return WPB_STEPS.indexOf(s as (typeof WPB_STEPS)[number]);
}

/** Tahap ProcessPath insiden (ASSUMPTION; BRD belum menetapkan nama status insiden). */
export const INCIDENT_STEPS = ['Dilaporkan', 'Diverifikasi', 'Ditangani', 'Ditutup'] as const;
export function incidentStepIndex(s: IncidentStatus): number {
  return { 'Belum terverifikasi': 1, Dikembalikan: 0, Terverifikasi: 2, Ditangani: 3, Ditutup: 4 }[s];
}
