/**
 * Data uji FIKTIF untuk adapter mock. Bukan data KKKS nyata.
 * Semua akun uji memakai kata sandi MOCK_PASSWORD di bawah; kode OTP dan tautan dibaca di panel dev
 * "Kotak masuk mock". Nilai ini hanya berlaku di mode VITE_DATA_SOURCE=mock.
 */
import type { RoleId } from '@/lib/rbac';
import type { AccountStatus } from '@/lib/status';

export const MOCK_PASSWORD = 'Perisai#2026';

export interface SeedOrg {
  id: string;
  nama: string;
  jenis: 'SKK Migas' | 'KKKS' | 'Kontraktor';
  status: 'Aktif' | 'Nonaktif';
  /** Simulasi pembatasan IP organisasi (FR-LG-10b): login dari "IP" pengguna ini ditolak. */
  ipDibatasi?: boolean;
  /** Domain email organisasi (BR-IAM-11, AB-19). */
  domains: string[];
  /** Kode organisasi (Tabel O-1), tidak dapat diubah. */
  kode: string;
  badanHukum?: string;
  skema?: 'Cost Recovery' | 'Gross Split';
  /** Daftar email diizinkan (PRD Kelola Organisasi 4.7). */
  emailAllow?: SeedAllowedEmail[];
  /** Penonaktifan organisasi (FR-ORG-14). */
  nonaktif?: { at: number; alasan: string; oleh: string };
  /** Pemeriksaan versi untuk perubahan bersamaan (FR-ORG-11). */
  versi?: number;
}

export interface SeedAllowedEmail {
  id: string;
  email: string;
  alasan: string;
  /** "YYYY-MM-DD" (WIB); wajib untuk email pribadi (FR-ORG-25). */
  berlakuSampai?: string;
  dibuat?: number;
  oleh?: string;
}

export interface SeedWk {
  id: string;
  /** Kode WK (Tabel O-4), tidak dapat diubah. */
  kode: string;
  nama: string;
  /** KKKS operator utama. */
  orgId: string;
  /** KKKS operator lain untuk WK yang dioperasikan bersama (Tabel O-4). */
  operatorIds?: string[];
  aktif: boolean;
  /** Alasan penonaktifan (FR-ORG-44). */
  alasanNonaktif?: string;
}

/** WK dioperasikan organisasi ini (operator utama atau bersama). */
export function wkOperatedBy(w: SeedWk, orgId: string): boolean {
  return w.orgId === orgId || (w.operatorIds ?? []).includes(orgId);
}

export interface SeedUser {
  id: string;
  nama: string;
  email: string;
  jabatan?: string;
  roles: RoleId[];
  orgId: string;
  status: AccountStatus;
  /** null = belum punya password (Diundang/Kedaluwarsa). */
  password: string | null;
  /** Akses berbatas waktu yang sudah lewat (FR-LG-10). */
  aksesBerakhir?: string;
  /** Simulasi IP di luar daftar izin organisasi (FR-LG-10b). */
  ipTidakTerdaftar?: boolean;
  catatan?: string;
  /** Wilayah kerja (R-05, FR-UP-12). */
  wilayahKerjaIds?: string[];
  /** Id pengundang. */
  invitedBy?: string;
  /** Hari lalu saat diundang. */
  invitedDaysAgo?: number;
  /** Pernah berstatus Aktif (FR-SA-20a). Default: status bukan Diundang/Kedaluwarsa. */
  pernahAktif?: boolean;
  keteranganStatus?: string;
}

export const SEED_ORGS: SeedOrg[] = [
  { id: 'org-skk', kode: 'SKKMIGAS', nama: 'SKK Migas', jenis: 'SKK Migas', status: 'Aktif', domains: ['skkmigas.example'] },
  {
    id: 'org-andalas',
    kode: 'KKKS-001',
    nama: 'PT Andalas Energi Hulu',
    badanHukum: 'PT Andalas Energi Hulu Tbk',
    skema: 'Gross Split',
    jenis: 'KKKS',
    status: 'Aktif',
    domains: ['andalas-energi.example'],
    emailAllow: [
      { id: 'alw-1', email: 'konsultan.andalas@mitra.example', alasan: 'Konsultan keamanan kontrak 2026', berlakuSampai: '2027-06-30' },
      { id: 'alw-2', email: 'andi.lapangan@gmail.com', alasan: 'Pelapor lapangan BUJP (kontrak 6 bulan)', berlakuSampai: '2026-12-31' },
    ],
  },
  { id: 'org-mahakam', kode: 'KKKS-002', nama: 'PT Mahakam Sejahtera Petroleum', skema: 'Cost Recovery', jenis: 'KKKS', status: 'Aktif', ipDibatasi: true, domains: ['mahakam-petro.example'] },
  { id: 'org-natuna', kode: 'KKKS-003', nama: 'PT Natuna Lepas Pantai', jenis: 'KKKS', status: 'Aktif', domains: ['natuna-offshore.example'] },
  { id: 'org-seram', kode: 'KKKS-004', nama: 'PT Seram Timur Energi', jenis: 'KKKS', status: 'Nonaktif', domains: ['seram-energi.example'], nonaktif: { at: 0, alasan: 'Kontrak kerja sama berakhir', oleh: 'Bagus Santoso' } },
  { id: 'org-skyletica', kode: 'KONTRAKTOR', nama: 'PT Skyletica Labs Indonesia', jenis: 'Kontraktor', status: 'Aktif', domains: ['skyletica.example'] },
];

/** Wilayah kerja fiktif (FR-UP-12, FR-CD-09a). PT Natuna belum punya WK aktif (uji "Organisasi ini belum punya wilayah kerja aktif."). */
export const SEED_WK: SeedWk[] = [
  { id: 'wk-andalas-1', kode: 'WK-ADL-01', nama: 'WK Andalas Darat', orgId: 'org-andalas', aktif: true },
  { id: 'wk-andalas-2', kode: 'WK-ADL-02', nama: 'WK Andalas Pesisir', orgId: 'org-andalas', operatorIds: ['org-mahakam'], aktif: true },
  { id: 'wk-andalas-3', kode: 'WK-ADL-03', nama: 'WK Andalas Utara', orgId: 'org-andalas', aktif: false, alasanNonaktif: 'Dialihkan ke operator lain' },
  { id: 'wk-mahakam-1', kode: 'WK-MHK-01', nama: 'WK Mahakam Delta', orgId: 'org-mahakam', aktif: true },
  { id: 'wk-natuna-1', kode: 'WK-NTN-01', nama: 'WK Natuna Timur', orgId: 'org-natuna', aktif: false },
];

export const SEED_USERS: SeedUser[] = [
  { id: 'u-01', nama: 'Hendra Wibisono', email: 'h.wibisono@skkmigas.example', jabatan: 'Kepala Divisi Pengamanan', roles: ['R-01'], orgId: 'org-skk', status: 'Aktif', password: MOCK_PASSWORD },
  { id: 'u-02', nama: 'Ratna Paramitha', email: 'r.paramitha@skkmigas.example', jabatan: 'Pengawas Keamanan', roles: ['R-02'], orgId: 'org-skk', status: 'Aktif', password: MOCK_PASSWORD },
  { id: 'u-03', nama: 'Bagus Santoso', email: 'b.santoso@skkmigas.example', jabatan: 'Administrator Sistem', roles: ['R-03'], orgId: 'org-skk', status: 'Aktif', password: MOCK_PASSWORD },
  { id: 'u-04', nama: 'Rina Wiyono', email: 'r.wiyono@andalas-energi.example', jabatan: 'Security Manager', roles: ['R-04'], orgId: 'org-andalas', status: 'Aktif', password: MOCK_PASSWORD },
  { id: 'u-05', nama: 'Dimas Pratama', email: 'd.pratama@andalas-energi.example', jabatan: 'Security Officer Lapangan', roles: ['R-05'], orgId: 'org-andalas', status: 'Aktif', password: MOCK_PASSWORD, wilayahKerjaIds: ['wk-andalas-1'], invitedBy: 'u-04', invitedDaysAgo: 40 },
  { id: 'u-06', nama: 'Sri Lestari', email: 's.lestari@andalas-energi.example', jabatan: 'VP Security', roles: ['R-06'], orgId: 'org-andalas', status: 'Aktif', password: MOCK_PASSWORD },
  { id: 'u-07', nama: 'Yoga Prasetyo', email: 'y.prasetyo@skyletica.example', jabatan: 'DevOps Engineer', roles: ['R-07'], orgId: 'org-skyletica', status: 'Aktif', password: MOCK_PASSWORD },
  // Skenario status akun (Tabel S-1)
  { id: 'u-10', nama: 'Agus Pranoto', email: 'a.pranoto@andalas-energi.example', roles: ['R-05'], orgId: 'org-andalas', status: 'Diundang', password: null, catatan: 'Diundang, belum aktivasi', wilayahKerjaIds: ['wk-andalas-2'], invitedBy: 'u-04', invitedDaysAgo: 2 },
  { id: 'u-11', nama: 'Maya Kusuma', email: 'm.kusuma@andalas-energi.example', roles: ['R-05'], orgId: 'org-andalas', status: 'Kedaluwarsa', password: null, catatan: 'Undangan kedaluwarsa', wilayahKerjaIds: ['wk-andalas-1'], invitedBy: 'u-04', invitedDaysAgo: 9 },
  { id: 'u-17', nama: 'Bayu Saputra', email: 'b.saputra@andalas-energi.example', roles: ['R-06'], orgId: 'org-andalas', status: 'Nonaktif', password: null, catatan: 'Undangan dibatalkan', invitedBy: 'u-04', invitedDaysAgo: 5, pernahAktif: false, keteranganStatus: 'Undangan dibatalkan' },
  { id: 'u-18', nama: 'Nadia Rahmawati', email: 'n.rahmawati@skkmigas.example', jabatan: 'Analis Keamanan', roles: ['R-02'], orgId: 'org-skk', status: 'Diundang', password: null, catatan: 'Diundang oleh R-03', invitedBy: 'u-03', invitedDaysAgo: 1 },
  { id: 'u-19', nama: 'Eko Wijaya', email: 'e.wijaya@mahakam-petro.example', jabatan: 'Security Manager', roles: ['R-04'], orgId: 'org-mahakam', status: 'Aktif', password: MOCK_PASSWORD, invitedBy: 'u-03', invitedDaysAgo: 60 },
  { id: 'u-12', nama: 'Fajar Nugroho', email: 'f.nugroho@andalas-energi.example', roles: ['R-05'], orgId: 'org-andalas', status: 'Ditangguhkan', password: MOCK_PASSWORD, catatan: 'Ditangguhkan' },
  { id: 'u-13', nama: 'Wulan Sari', email: 'w.sari@andalas-energi.example', roles: ['R-06'], orgId: 'org-andalas', status: 'Nonaktif', password: MOCK_PASSWORD, catatan: 'Nonaktif' },
  { id: 'u-14', nama: 'Teguh Hartono', email: 't.hartono@andalas-energi.example', roles: ['R-05'], orgId: 'org-andalas', status: 'Aktif', password: MOCK_PASSWORD, aksesBerakhir: '2026-09-30T16:59:59.000Z', catatan: 'Masa berlaku akses sudah lewat', wilayahKerjaIds: ['wk-andalas-3'] },
  { id: 'u-15', nama: 'Lina Marlina', email: 'l.marlina@seram-energi.example', roles: ['R-04'], orgId: 'org-seram', status: 'Aktif', password: MOCK_PASSWORD, catatan: 'Organisasi nonaktif' },
  { id: 'u-16', nama: 'Rudi Hakim', email: 'r.hakim@mahakam-petro.example', roles: ['R-05'], orgId: 'org-mahakam', status: 'Aktif', password: MOCK_PASSWORD, ipTidakTerdaftar: true, catatan: 'IP tidak terdaftar' },
];

/** Daftar password umum (FR-AK-06). Produksi memakai daftar yang jauh lebih besar di backend. */
export const COMMON_PASSWORDS = new Set(
  ['Password1', 'Password123', 'Perisai123', 'Qwerty123', 'Admin123', 'Welcome1', 'Indonesia1', 'Jakarta123'].map((p) =>
    p.toLowerCase(),
  ),
);

/** Sesi perangkat lain yang ditanam agar daftar sesi aktif (FR-LO-11) tidak kosong. */
export const SEED_OTHER_DEVICES = [
  { perangkat: 'Laptop', browser: 'Edge 129', sistemOperasi: 'Windows 11', perkiraanLokasi: 'Jakarta, Indonesia', jamLalu: 3 },
  { perangkat: 'Ponsel', browser: 'Chrome 129', sistemOperasi: 'Android 14', perkiraanLokasi: 'Pekanbaru, Indonesia', jamLalu: 9 },
];
