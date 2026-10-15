/**
 * Tipe domain modul operasional untuk prototype kick-off 21 Okt 2026 (PRD Garis Besar, BRD v0.5):
 * Insiden (M-05), Anggaran Pengamanan WP&B (M-06), Kemitraan BUJP & PKS/PKT (M-07), Tindak Lanjut (M-09),
 * Notifikasi (M-20), Dasbor Eksekutif & Peta Panas (M-11, M-13).
 *
 * ILUSTRASI KICK-OFF, bukan kontrak API final. Nama status yang tidak didefinisikan PRD/BRD ditandai ASSUMPTION.
 */
import type { RoleId } from '@/lib/rbac';

/** DS SeverityBadge: empat tingkat baku (K-05 belum disahkan). */
export type Severity = 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah';
export const SEVERITIES: Severity[] = ['Kritis', 'Tinggi', 'Sedang', 'Rendah'];

/** ASSUMPTION (BRD 3.4.3 terbuka): insiden direview Pejabat Berwenang KKKS sebelum resmi. */
export type IncidentStatus = 'Belum terverifikasi' | 'Dikembalikan' | 'Terverifikasi' | 'Ditangani' | 'Ditutup';
/** Hanya status ini yang dihitung di dasbor, peta panas, dan laporan (AB-17). */
export const VERIFIED_STATUSES: IncidentStatus[] = ['Terverifikasi', 'Ditangani', 'Ditutup'];

export const INCIDENT_TYPES = ['Pencurian aset', 'Gangguan keamanan', 'Unjuk rasa', 'Penyerobotan lahan', 'Sabotase fasilitas', 'Ancaman terhadap personel', 'Pelanggaran akses'] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

export interface OpsOrg {
  id: string;
  kode: string;
  nama: string;
  aktif: boolean;
}

export interface OpsWk {
  id: string;
  kode: string;
  nama: string;
  orgId: string;
  /** Titik tengah untuk peta panas. */
  lat: number;
  lng: number;
  provinsi: string;
}

export interface OpsLokasi {
  id: string;
  nama: string;
  wkId: string;
  orgId: string;
  lat: number;
  lng: number;
}

export type IncidentEventType = 'Dilaporkan' | 'Notifikasi SKK' | 'Diverifikasi' | 'Dikembalikan' | 'Ditugaskan' | 'Tindakan' | 'Ditutup';

export interface IncidentEvent {
  id: string;
  at: string;
  jenis: IncidentEventType;
  oleh: string;
  peran: string;
  catatan?: string;
}

export interface Incident {
  id: string;
  kode: string;
  orgId: string;
  orgNama: string;
  jenis: IncidentType;
  severity: Severity;
  status: IncidentStatus;
  lokasiId: string;
  lokasiNama: string;
  wkId: string;
  wkNama: string;
  lat: number;
  lng: number;
  /** Waktu kejadian. */
  waktu: string;
  dilaporkanPada: string;
  pelapor: string;
  judul: string;
  kronologi: string;
  dampak?: string;
  foto: string[];
  pic?: string;
  penyebab?: string;
  bukti?: string[];
  alasanDikembalikan?: string;
  timeline: IncidentEvent[];
}

export interface ReportIncidentInput {
  jenis: IncidentType;
  severity: Severity;
  lokasiId: string;
  waktu: string;
  kronologi: string;
  foto: string[];
}

/** WP&B — BRD 3.4: siklus dokumen KKKS + berita acara bertanda tangan. */
export type WpbStatus = 'Draft' | 'Review Internal KKKS' | 'Perlu Perbaikan' | 'Difinalisasi KKKS' | 'Menunggu Dokumen Bertanda Tangan' | 'Final';

/** ASSUMPTION (Q-37/AB-07 belum ditetapkan): kategori anggaran pengamanan contoh. */
export const WPB_CATEGORIES = ['Personel pengamanan (BUJP)', 'Peralatan & sistem keamanan', 'Koordinasi aparat', 'Pelatihan & sertifikasi', 'Operasional & logistik'] as const;
export type WpbCategory = (typeof WPB_CATEGORIES)[number];

/** AB-07: ambang deviasi awal 10% per kategori. */
export const WPB_DEVIATION_THRESHOLD = 0.1;

export interface WpbLine {
  kategori: WpbCategory;
  /** Rencana bulanan dari nilai disepakati tahunan / 12. */
  rencana: number;
  realisasi: number | null;
  penjelasan?: string;
}

export interface WpbEvent {
  at: string;
  oleh: string;
  peran: string;
  aksi: string;
  catatan?: string;
}

export interface BeritaAcara {
  nomor: string;
  dibuatPada: string;
  dokumen?: { nama: string; diunggahOleh: string; diunggahPada: string };
}

export interface WpbPeriod {
  id: string;
  orgId: string;
  orgNama: string;
  tahun: number;
  /** 1–12. */
  bulan: number;
  status: WpbStatus;
  lines: WpbLine[];
  beritaAcara?: BeritaAcara;
  timeline: WpbEvent[];
}

export interface WpbBudgetRow {
  kategori: WpbCategory;
  disepakati: number;
  realisasi: number;
  /** realisasi / anggaran sampai periode berjalan − 1. */
  deviasi: number;
}

export interface WpbSummary {
  orgId: string;
  orgNama: string;
  tahun: number;
  disepakatiTahunan: number;
  rencanaSampaiKini: number;
  realisasiSampaiKini: number;
  rows: WpbBudgetRow[];
}

/** AB-10: status kontrak dihitung dari tanggal. */
export type ContractStatus = 'Aktif' | 'Akan Berakhir' | 'Berakhir' | 'Diperpanjang';

export interface ContractReminder {
  bulanSebelum: 12 | 6 | 3 | 1;
  tanggal: string;
  terkirim: boolean;
}

export interface Contract {
  id: string;
  nomor: string;
  bujp: string;
  orgId: string;
  orgNama: string;
  aset: string;
  wkNama: string;
  mulai: string;
  berakhir: string;
  nilai: number;
  realisasi: number;
  status: ContractStatus;
  sisaHari: number;
  personel: number;
  dokumen: string[];
  insidenIds: string[];
  pengingat: ContractReminder[];
}

export interface CreateContractInput {
  nomor: string;
  bujp: string;
  aset: string;
  wkId: string;
  mulai: string;
  berakhir: string;
  nilai: number;
  personel: number;
  dokumen: string[];
}

export type FollowUpStatus = 'Terbuka' | 'Dikerjakan' | 'Menunggu Bukti' | 'Selesai';

export interface FollowUp {
  id: string;
  kode: string;
  orgId: string;
  judul: string;
  sumber: string;
  sumberId?: string;
  pic: string;
  tenggat: string;
  status: FollowUpStatus;
  terlambat: boolean;
}

export interface OpsNotification {
  id: string;
  at: string;
  judul: string;
  isi: string;
  link: string;
  kritis: boolean;
  /** Penerima per role; `orgId` membatasi penerima KKKS ke organisasinya. */
  untukRoles: RoleId[];
  orgId?: string;
  dibaca: boolean;
}

/** Tugas/antrian di Ruang Kerja. */
export interface WorkItem {
  id: string;
  jenis: 'Insiden' | 'WP&B' | 'Kontrak' | 'Tindak lanjut';
  judul: string;
  keterangan: string;
  status: string;
  link: string;
  severity?: Severity;
  at: string;
}

export interface Workspace {
  tugasSaya: WorkItem[];
  kotakPersetujuan: WorkItem[];
  menungguDokumen: WorkItem[];
}

export interface ExecutiveSummary {
  insidenTerverifikasi: number;
  insidenKritisTinggi: number;
  insidenTerbuka: number;
  belumTerverifikasi: Incident[];
  perSeverity: Record<Severity, number>;
  perOrg: { orgId: string; orgNama: string; insiden: number; kritisTinggi: number }[];
  anggaran: { disepakati: number; realisasi: number; deviasiKategori: number };
  kontrak: { aktif: number; akanBerakhir: number; berakhir: number };
  pks: { aktif: number; akanBerakhir: number };
  risiko: { tinggi: number; kritis: number };
  tindakLanjut: { terbuka: number; terlambat: number };
  peringatanDini: { judul: string; at: string; sumber: string }[];
  isuKritis: { judul: string; link: string; severity: Severity }[];
}

export interface HeatPoint {
  wkId: string;
  wkNama: string;
  orgNama: string;
  provinsi: string;
  lat: number;
  lng: number;
  jumlah: number;
  kritisTinggi: number;
}

export interface PksAgreement {
  id: string;
  nomor: string;
  mitra: string;
  jenis: 'PKS' | 'PKT';
  orgId: string;
  orgNama: string;
  berakhir: string;
  status: ContractStatus;
}

export interface OpsService {
  /** `pic`: penanggung jawab yang dapat ditugaskan di organisasi pengguna (ilustrasi). */
  refs(): Promise<{ orgs: OpsOrg[]; wk: OpsWk[]; lokasi: OpsLokasi[]; pic: string[] }>;
  workspace(): Promise<Workspace>;
  incidents: {
    list(filter?: { wkId?: string; verifiedOnly?: boolean }): Promise<Incident[]>;
    get(id: string): Promise<Incident>;
    report(input: ReportIncidentInput): Promise<Incident>;
    verify(id: string): Promise<Incident>;
    sendBack(id: string, alasan: string): Promise<Incident>;
    assign(id: string, pic: string): Promise<Incident>;
    addAction(id: string, catatan: string): Promise<Incident>;
    close(id: string, input: { penyebab: string; bukti: string[] }): Promise<Incident>;
  };
  wpb: {
    list(): Promise<WpbPeriod[]>;
    get(id: string): Promise<WpbPeriod>;
    summary(): Promise<WpbSummary[]>;
    save(id: string, lines: WpbLine[]): Promise<WpbPeriod>;
    submit(id: string, lines: WpbLine[]): Promise<WpbPeriod>;
    sendBack(id: string, alasan: string): Promise<WpbPeriod>;
    finalize(id: string): Promise<WpbPeriod>;
    uploadSigned(id: string, namaFile: string): Promise<WpbPeriod>;
  };
  contracts: {
    list(): Promise<Contract[]>;
    get(id: string): Promise<Contract>;
    create(input: CreateContractInput): Promise<Contract>;
  };
  pks(): Promise<PksAgreement[]>;
  followUps(): Promise<FollowUp[]>;
  notifications: {
    list(): Promise<OpsNotification[]>;
    markAllRead(): Promise<void>;
  };
  executive(): Promise<ExecutiveSummary>;
  heatmap(): Promise<HeatPoint[]>;
  /** Kembalikan data demo ke kondisi awal (untuk mengulang demo). */
  resetDemo(): Promise<void>;
}
