/**
 * Data contoh modul operasional untuk prototype kick-off (FIKTIF: nama KKKS, BUJP, orang, dan lokasi bukan data nyata;
 * koordinat hanya perkiraan wilayah). KKKS memakai organisasi uji Core Platform (Andalas, Mahakam, Natuna, Seram).
 * Insiden ±30, kontrak BUJP 10 (2 akan berakhir), realisasi WP&B 6 bulan untuk 2 KKKS.
 */
import type {
  Contract,
  FollowUp,
  Incident,
  IncidentEvent,
  IncidentStatus,
  IncidentType,
  OpsLokasi,
  OpsNotification,
  OpsOrg,
  OpsWk,
  PksAgreement,
  Severity,
  WpbCategory,
  WpbLine,
  WpbPeriod,
  WpbStatus,
} from '../../ops-types';
import { WPB_CATEGORIES } from '../../ops-types';

export interface OpsDb {
  version: 1;
  incidents: Incident[];
  wpb: WpbPeriod[];
  /** Nilai disepakati tahunan per organisasi per kategori. */
  disepakati: Record<string, Record<WpbCategory, number>>;
  contracts: Omit<Contract, 'status' | 'sisaHari'>[];
  pks: Omit<PksAgreement, 'status'>[];
  followUps: Omit<FollowUp, 'terlambat'>[];
  notifications: OpsNotification[];
  seq: number;
}

export const OPS_ORGS: OpsOrg[] = [
  { id: 'org-andalas', kode: 'KKKS-001', nama: 'PT Andalas Energi Hulu', aktif: true },
  { id: 'org-mahakam', kode: 'KKKS-002', nama: 'PT Mahakam Sejahtera Petroleum', aktif: true },
  { id: 'org-natuna', kode: 'KKKS-003', nama: 'PT Natuna Lepas Pantai', aktif: true },
  { id: 'org-seram', kode: 'KKKS-004', nama: 'PT Seram Timur Energi', aktif: false },
];

export const OPS_WK: OpsWk[] = [
  { id: 'wk-andalas-1', kode: 'WK-ADL-01', nama: 'WK Andalas Darat', orgId: 'org-andalas', lat: 0.75, lng: 101.25, provinsi: 'Riau' },
  { id: 'wk-andalas-2', kode: 'WK-ADL-02', nama: 'WK Andalas Pesisir', orgId: 'org-andalas', lat: -1.05, lng: 103.75, provinsi: 'Jambi' },
  { id: 'wk-andalas-3', kode: 'WK-ADL-03', nama: 'WK Andalas Utara', orgId: 'org-andalas', lat: 2.35, lng: 99.85, provinsi: 'Sumatera Utara' },
  { id: 'wk-mahakam-1', kode: 'WK-MHK-01', nama: 'WK Mahakam Delta', orgId: 'org-mahakam', lat: -0.6, lng: 117.45, provinsi: 'Kalimantan Timur' },
  { id: 'wk-natuna-1', kode: 'WK-NTN-01', nama: 'WK Natuna Timur', orgId: 'org-natuna', lat: 3.85, lng: 108.35, provinsi: 'Kepulauan Riau' },
  // ASSUMPTION: WK keenam hanya ada di data contoh modul operasional (bukan data uji Core Platform).
  { id: 'wk-seram-1', kode: 'WK-SRM-01', nama: 'WK Seram Timur', orgId: 'org-seram', lat: -3.2, lng: 130.4, provinsi: 'Maluku' },
];

export const OPS_LOKASI: OpsLokasi[] = [
  ['lok-01', 'Stasiun pengumpul Minas', 'wk-andalas-1', 0.78, 101.45],
  ['lok-02', 'Sumur MNS-12', 'wk-andalas-1', 0.92, 101.2],
  ['lok-03', 'Gudang material Duri', 'wk-andalas-1', 1.28, 101.2],
  ['lok-04', 'Jalur pipa Duri–Dumai', 'wk-andalas-1', 1.5, 101.35],
  ['lok-05', 'Base camp Kandis', 'wk-andalas-1', 0.55, 101.05],
  ['lok-06', 'Terminal Tanjung Jabung', 'wk-andalas-2', -0.95, 103.85],
  ['lok-07', 'Platform Pesisir-2', 'wk-andalas-2', -0.8, 104.2],
  ['lok-08', 'Dermaga Kuala Tungkal', 'wk-andalas-2', -0.82, 103.46],
  ['lok-09', 'Sumur ADL-U3', 'wk-andalas-3', 2.4, 99.7],
  ['lok-10', 'Pos jaga Labuhanbatu', 'wk-andalas-3', 2.1, 100.1],
  ['lok-11', 'Terminal Senipah', 'wk-mahakam-1', -1.05, 117.2],
  ['lok-12', 'Lapangan Tunu', 'wk-mahakam-1', -0.65, 117.65],
  ['lok-13', 'Lapangan Peciko', 'wk-mahakam-1', -0.45, 117.6],
  ['lok-14', 'Kantor lapangan Handil', 'wk-mahakam-1', -0.6, 117.3],
  ['lok-15', 'Jalur pipa Senipah–Bontang', 'wk-mahakam-1', -0.1, 117.45],
  ['lok-16', 'Platform NT-A', 'wk-natuna-1', 4.1, 108.5],
  ['lok-17', 'Kapal FSO Natuna', 'wk-natuna-1', 3.7, 108.6],
  ['lok-18', 'Pangkalan logistik Ranai', 'wk-natuna-1', 3.95, 108.38],
  ['lok-19', 'Lapangan Bula', 'wk-seram-1', -3.1, 130.45],
  ['lok-20', 'Terminal Bula', 'wk-seram-1', -3.12, 130.5],
].map(([id, nama, wkId, lat, lng]) => {
  const wk = OPS_WK.find((w) => w.id === wkId)!;
  return { id: id as string, nama: nama as string, wkId: wkId as string, orgId: wk.orgId, lat: lat as number, lng: lng as number };
});

/** Pelapor per organisasi (Dimas & Rudi = akun uji Core Platform; lainnya fiktif). */
const PELAPOR: Record<string, string[]> = {
  'org-andalas': ['Dimas Pratama', 'Teguh Hartono'],
  'org-mahakam': ['Rudi Hakim', 'Putri Ayuningtyas'],
  'org-natuna': ['Arif Setiawan'],
  'org-seram': ['Yohanis Latuconsina'],
};
export const PIC_PER_ORG: Record<string, string[]> = {
  'org-andalas': ['Teguh Hartono', 'Dimas Pratama', 'Komandan regu Satpam Minas'],
  'org-mahakam': ['Rudi Hakim', 'Koordinator keamanan Senipah'],
  'org-natuna': ['Arif Setiawan'],
  'org-seram': ['Yohanis Latuconsina'],
};
const PEJABAT: Record<string, string> = {
  'org-andalas': 'Sri Lestari',
  'org-mahakam': 'Hasan Basri',
  'org-natuna': 'Melati Sihombing',
  'org-seram': 'Johan Matulessy',
};

const DAY = 86_400_000;
let seq = 0;
const nid = (p: string) => `${p}-${String(++seq).padStart(3, '0')}`;

/** Generator semu-acak deterministik agar data demo sama setiap reset. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return s / 2 ** 31;
  };
}

const KRONOLOGI: Record<IncidentType, string> = {
  'Pencurian aset': 'Petugas patroli menemukan kabel tembaga dan valve kecil hilang dari area penyimpanan. Pagar sisi timur ditemukan rusak.',
  'Gangguan keamanan': 'Sekelompok orang tidak dikenal mencoba masuk area terbatas tanpa izin. Petugas jaga menghentikan dan meminta mereka meninggalkan lokasi.',
  'Unjuk rasa': 'Sekitar 40 warga berkumpul di gerbang utama menuntut rekrutmen tenaga kerja lokal. Aktivitas keluar-masuk kendaraan tertahan dua jam.',
  'Penyerobotan lahan': 'Ditemukan pemasangan patok dan pondok semi permanen di dalam koridor jalur pipa.',
  'Sabotase fasilitas': 'Ditemukan bekas pembukaan paksa pada katup jalur pipa. Tekanan turun sesaat sebelum petugas mengisolasi jalur.',
  'Ancaman terhadap personel': 'Personel survei menerima ancaman verbal dari orang tak dikenal saat pengambilan data lapangan.',
  'Pelanggaran akses': 'Kendaraan kontraktor masuk melalui gerbang tanpa pemeriksaan kartu akses. Petugas gerbang sedang tidak di pos.',
};

function event(at: number, jenis: IncidentEvent['jenis'], oleh: string, peran: string, catatan?: string): IncidentEvent {
  return { id: nid('ev'), at: new Date(at).toISOString(), jenis, oleh, peran, catatan };
}

function buildIncidents(now: number): Incident[] {
  const r = rng(20261021);
  const types = ['Pencurian aset', 'Gangguan keamanan', 'Unjuk rasa', 'Penyerobotan lahan', 'Sabotase fasilitas', 'Ancaman terhadap personel', 'Pelanggaran akses'] as IncidentType[];
  // Distribusi organisasi: Andalas 13, Mahakam 9, Natuna 5, Seram 3.
  const orgPlan = [...Array(13).fill('org-andalas'), ...Array(9).fill('org-mahakam'), ...Array(5).fill('org-natuna'), ...Array(3).fill('org-seram')] as string[];
  const out: Incident[] = [];
  orgPlan.forEach((orgId, i) => {
    const lokasiOrg = OPS_LOKASI.filter((l) => l.orgId === orgId);
    const lok = lokasiOrg[Math.floor(r() * lokasiOrg.length)]!;
    const wk = OPS_WK.find((w) => w.id === lok.wkId)!;
    const org = OPS_ORGS.find((o) => o.id === orgId)!;
    const jenis = types[Math.floor(r() * types.length)]!;
    const sevRoll = r();
    const severity: Severity = sevRoll < 0.12 ? 'Kritis' : sevRoll < 0.35 ? 'Tinggi' : sevRoll < 0.7 ? 'Sedang' : 'Rendah';
    // Seram (organisasi nonaktif) hanya punya insiden lama yang sudah ditutup.
    const umurHari = orgId === 'org-seram' ? 100 + Math.floor(r() * 60) : 2 + Math.floor(r() * 110);
    const waktu = now - umurHari * DAY - Math.floor(r() * 10) * 3_600_000;
    const statusRoll = r();
    let status: IncidentStatus =
      orgId === 'org-seram' || umurHari > 45 ? (statusRoll < 0.85 ? 'Ditutup' : 'Ditangani') : statusRoll < 0.3 ? 'Ditutup' : statusRoll < 0.65 ? 'Ditangani' : statusRoll < 0.9 ? 'Terverifikasi' : 'Belum terverifikasi';
    if (status === 'Belum terverifikasi' && (severity === 'Kritis' || severity === 'Tinggi')) status = 'Terverifikasi';
    const pelapor = PELAPOR[orgId]![i % PELAPOR[orgId]!.length]!;
    const pejabat = PEJABAT[orgId]!;
    const pic = PIC_PER_ORG[orgId]![i % PIC_PER_ORG[orgId]!.length]!;
    const lapor = waktu + 40 * 60_000;
    const timeline: IncidentEvent[] = [event(lapor, 'Dilaporkan', pelapor, 'Pelapor KKKS')];
    if (severity === 'Kritis' || severity === 'Tinggi') timeline.push(event(lapor + 60_000, 'Notifikasi SKK', 'Sistem', 'Otomatis', 'Dikirim ke Pengawas SKK dan Pimpinan SKK dengan label Belum terverifikasi'));
    if (status !== 'Belum terverifikasi') timeline.push(event(lapor + 3 * 3_600_000, 'Diverifikasi', pejabat, 'Pejabat Berwenang KKKS'));
    if (status === 'Ditangani' || status === 'Ditutup') {
      timeline.push(event(lapor + 4 * 3_600_000, 'Ditugaskan', pejabat, 'Pejabat Berwenang KKKS', `PIC: ${pic}`));
      timeline.push(event(lapor + DAY, 'Tindakan', pic, 'PIC', 'Pengamanan area diperketat dan koordinasi dengan Polsek setempat.'));
    }
    if (status === 'Ditutup') timeline.push(event(lapor + 4 * DAY, 'Ditutup', pejabat, 'Pejabat Berwenang KKKS', 'Penyebab dan bukti penanganan dicatat.'));
    out.push({
      id: `ins-${String(i + 1).padStart(3, '0')}`,
      kode: `INS-2026-${String(i + 101).padStart(4, '0')}`,
      orgId,
      orgNama: org.nama,
      jenis,
      severity,
      status,
      lokasiId: lok.id,
      lokasiNama: lok.nama,
      wkId: wk.id,
      wkNama: wk.nama,
      lat: lok.lat,
      lng: lok.lng,
      waktu: new Date(waktu).toISOString(),
      dilaporkanPada: new Date(lapor).toISOString(),
      pelapor,
      judul: `${jenis} di ${lok.nama}`,
      kronologi: KRONOLOGI[jenis],
      dampak: severity === 'Kritis' ? 'Operasi lokasi dihentikan sementara.' : severity === 'Tinggi' ? 'Gangguan operasi kurang dari 4 jam.' : 'Tidak ada gangguan operasi.',
      foto: ['foto-lokasi-1.jpg'],
      pic: status === 'Ditangani' || status === 'Ditutup' ? pic : undefined,
      penyebab: status === 'Ditutup' ? 'Celah pengamanan di perimeter; patroli malam belum terjadwal.' : undefined,
      bukti: status === 'Ditutup' ? ['berita-acara-penanganan.pdf'] : undefined,
      timeline,
    });
  });
  // Dua insiden tinggi/kritis yang baru dilaporkan dan BELUM terverifikasi (tampil terpisah di dasbor).
  const fresh: [string, string, IncidentType, Severity, number][] = [
    ['org-mahakam', 'lok-15', 'Sabotase fasilitas', 'Kritis', 5],
    ['org-andalas', 'lok-04', 'Penyerobotan lahan', 'Tinggi', 26],
  ];
  fresh.forEach(([orgId, lokId, jenis, severity, jamLalu], k) => {
    const lok = OPS_LOKASI.find((l) => l.id === lokId)!;
    const wk = OPS_WK.find((w) => w.id === lok.wkId)!;
    const org = OPS_ORGS.find((o) => o.id === orgId)!;
    const waktu = now - jamLalu * 3_600_000;
    const pelapor = PELAPOR[orgId]![0]!;
    out.push({
      id: `ins-${String(out.length + 1).padStart(3, '0')}`,
      kode: `INS-2026-${String(131 + k).padStart(4, '0')}`,
      orgId,
      orgNama: org.nama,
      jenis,
      severity,
      status: 'Belum terverifikasi',
      lokasiId: lok.id,
      lokasiNama: lok.nama,
      wkId: wk.id,
      wkNama: wk.nama,
      lat: lok.lat,
      lng: lok.lng,
      waktu: new Date(waktu).toISOString(),
      dilaporkanPada: new Date(waktu + 20 * 60_000).toISOString(),
      pelapor,
      judul: `${jenis} di ${lok.nama}`,
      kronologi: KRONOLOGI[jenis],
      dampak: severity === 'Kritis' ? 'Jalur pipa diisolasi; penyaluran berhenti sementara.' : 'Belum ada gangguan operasi.',
      foto: ['foto-lapangan-1.jpg', 'foto-lapangan-2.jpg'],
      timeline: [
        event(waktu + 20 * 60_000, 'Dilaporkan', pelapor, 'Pelapor KKKS'),
        event(waktu + 21 * 60_000, 'Notifikasi SKK', 'Sistem', 'Otomatis', 'Dikirim ke Pengawas SKK dan Pimpinan SKK dengan label Belum terverifikasi'),
      ],
    });
  });
  return out;
}

/** Nilai disepakati tahunan 2026 (Rp). */
const DISEPAKATI: Record<string, Record<WpbCategory, number>> = {
  'org-andalas': {
    'Personel pengamanan (BUJP)': 9_600_000_000,
    'Peralatan & sistem keamanan': 2_400_000_000,
    'Koordinasi aparat': 1_800_000_000,
    'Pelatihan & sertifikasi': 600_000_000,
    'Operasional & logistik': 1_200_000_000,
  },
  'org-mahakam': {
    'Personel pengamanan (BUJP)': 12_000_000_000,
    'Peralatan & sistem keamanan': 3_600_000_000,
    'Koordinasi aparat': 2_400_000_000,
    'Pelatihan & sertifikasi': 720_000_000,
    'Operasional & logistik': 1_560_000_000,
  },
};

function buildWpb(): WpbPeriod[] {
  const r = rng(77);
  const out: WpbPeriod[] = [];
  const plan: [string, number, WpbStatus][] = [
    ['org-andalas', 4, 'Final'],
    ['org-andalas', 5, 'Final'],
    ['org-andalas', 6, 'Final'],
    ['org-andalas', 7, 'Final'],
    ['org-andalas', 8, 'Menunggu Dokumen Bertanda Tangan'],
    ['org-andalas', 9, 'Draft'],
    ['org-mahakam', 4, 'Final'],
    ['org-mahakam', 5, 'Final'],
    ['org-mahakam', 6, 'Final'],
    ['org-mahakam', 7, 'Final'],
    ['org-mahakam', 8, 'Final'],
    ['org-mahakam', 9, 'Menunggu Dokumen Bertanda Tangan'],
  ];
  for (const [orgId, bulan, status] of plan) {
    const org = OPS_ORGS.find((o) => o.id === orgId)!;
    const lines: WpbLine[] = WPB_CATEGORIES.map((kategori) => {
      const rencana = Math.round(DISEPAKATI[orgId]![kategori] / 12);
      if (status === 'Draft') return { kategori, rencana, realisasi: null };
      // Juli Andalas: koordinasi aparat melonjak (pengamanan unjuk rasa) → deviasi > 10% dengan penjelasan.
      const spike = orgId === 'org-andalas' && bulan === 7 && kategori === 'Koordinasi aparat';
      const faktor = spike ? 1.22 : 0.9 + r() * 0.16;
      return { kategori, rencana, realisasi: Math.round((rencana * faktor) / 1_000_000) * 1_000_000, penjelasan: spike ? 'Pengamanan tambahan bersama Polres selama unjuk rasa 12–14 Juli.' : undefined };
    });
    const pejabat = PEJABAT[orgId]!;
    const pelapor = PELAPOR[orgId]![0]!;
    const at = (hari: number) => new Date(Date.UTC(2026, bulan, hari, 3)).toISOString();
    const timeline =
      status === 'Draft'
        ? []
        : [
            { at: at(5), oleh: pelapor, peran: 'Pelapor KKKS', aksi: 'Mengajukan realisasi' },
            { at: at(8), oleh: pejabat, peran: 'Pejabat Berwenang KKKS', aksi: 'Memfinalisasi realisasi' },
            { at: at(8), oleh: 'Sistem', peran: 'Otomatis', aksi: 'Menyusun draf berita acara' },
            ...(status === 'Final' ? [{ at: at(20), oleh: 'Ratna Paramitha', peran: 'Pengawas SKK', aksi: 'Mengunggah berita acara bertanda tangan', catatan: 'Angka cocok dengan data terkunci. Status Final.' }] : []),
          ];
    const nomor = `BA-WPB/${org.kode}/2026/${String(bulan).padStart(2, '0')}`;
    out.push({
      id: `wpb-${orgId.replace('org-', '')}-2026-${String(bulan).padStart(2, '0')}`,
      orgId,
      orgNama: org.nama,
      tahun: 2026,
      bulan,
      status,
      lines,
      beritaAcara:
        status === 'Final' || status === 'Menunggu Dokumen Bertanda Tangan'
          ? {
              nomor,
              dibuatPada: at(8),
              dokumen: status === 'Final' ? { nama: `${nomor.replace(/\//g, '-')}-ttd.pdf`, diunggahOleh: 'Ratna Paramitha', diunggahPada: at(20) } : undefined,
            }
          : undefined,
      timeline,
    });
  }
  return out;
}

function buildContracts(now: number): OpsDb['contracts'] {
  const iso = (offsetHari: number) => new Date(now + offsetHari * DAY).toISOString().slice(0, 10);
  const rows: [string, string, string, string, string, number, number, number, number][] = [
    // nomor, bujp, orgId, aset, wk, mulai(hari), berakhir(hari), nilai, personel
    ['SPK-BUJP/ADL/2024/017', 'PT Garda Satria Nusantara', 'org-andalas', 'Stasiun pengumpul Minas & Gudang Duri', 'WK Andalas Darat', -700, 38, 18_400_000_000, 96],
    ['SPK-BUJP/MHK/2025/004', 'PT Perisai Bumi Sentosa', 'org-mahakam', 'Terminal Senipah', 'WK Mahakam Delta', -560, 160, 21_000_000_000, 120],
    ['SPK-BUJP/ADL/2023/009', 'PT Bhakti Wira Pengamanan', 'org-andalas', 'Terminal Tanjung Jabung', 'WK Andalas Pesisir', -900, -24, 6_200_000_000, 34],
    ['SPK-BUJP/ADL/2025/022', 'PT Sentinel Khatulistiwa', 'org-andalas', 'Jalur pipa Duri–Dumai', 'WK Andalas Darat', -200, 530, 9_800_000_000, 52],
    ['SPK-BUJP/ADL/2026/003', 'PT Garda Satria Nusantara', 'org-andalas', 'Platform Pesisir-2', 'WK Andalas Pesisir', -120, 610, 7_300_000_000, 40],
    ['SPK-BUJP/MHK/2026/011', 'PT Rajawali Jaga Utama', 'org-mahakam', 'Lapangan Tunu & Peciko', 'WK Mahakam Delta', -90, 640, 15_600_000_000, 88],
    ['SPK-BUJP/MHK/2025/019', 'PT Sentinel Khatulistiwa', 'org-mahakam', 'Jalur pipa Senipah–Bontang', 'WK Mahakam Delta', -300, 430, 8_900_000_000, 46],
    ['SPK-BUJP/NTN/2025/002', 'PT Perisai Bumi Sentosa', 'org-natuna', 'Pangkalan logistik Ranai', 'WK Natuna Timur', -330, 400, 5_400_000_000, 28],
    ['SPK-BUJP/NTN/2026/006', 'PT Bahari Jaga Samudra', 'org-natuna', 'Platform NT-A & FSO Natuna', 'WK Natuna Timur', -60, 700, 11_200_000_000, 44],
    ['SPK-BUJP/SRM/2023/001', 'PT Rajawali Jaga Utama', 'org-seram', 'Lapangan Bula', 'WK Seram Timur', -1100, -180, 4_100_000_000, 22],
  ];
  return rows.map(([nomor, bujp, orgId, aset, wkNama, mulai, berakhir, nilai, personel], i) => {
    const org = OPS_ORGS.find((o) => o.id === orgId)!;
    const durasi = berakhir - mulai;
    const jalan = Math.min(1, Math.max(0, -mulai / durasi));
    return {
      id: `kon-${String(i + 1).padStart(2, '0')}`,
      nomor,
      bujp,
      orgId,
      orgNama: org.nama,
      aset,
      wkNama,
      mulai: iso(mulai),
      berakhir: iso(berakhir),
      nilai,
      realisasi: Math.round((nilai * jalan * 0.97) / 1_000_000) * 1_000_000,
      personel,
      dokumen: ['kontrak-ditandatangani.pdf', 'lampiran-sop-pengamanan.pdf'],
      insidenIds: [],
      pengingat: ([12, 6, 3, 1] as const).map((b) => {
        const t = new Date(new Date(iso(berakhir)).getTime() - b * 30 * DAY);
        return { bulanSebelum: b, tanggal: t.toISOString().slice(0, 10), terkirim: t.getTime() <= now };
      }),
    };
  });
}

function buildPks(now: number): OpsDb['pks'] {
  const iso = (h: number) => new Date(now + h * DAY).toISOString().slice(0, 10);
  return [
    { id: 'pks-1', nomor: 'PKS/ADL/POLDA-RIAU/2025', mitra: 'Polda Riau', jenis: 'PKS', orgId: 'org-andalas', orgNama: 'PT Andalas Energi Hulu', berakhir: iso(420) },
    { id: 'pks-2', nomor: 'PKT/ADL/KODIM-0303/2025', mitra: 'Kodim 0303 Bengkalis', jenis: 'PKT', orgId: 'org-andalas', orgNama: 'PT Andalas Energi Hulu', berakhir: iso(75) },
    { id: 'pks-3', nomor: 'PKS/MHK/POLDA-KALTIM/2024', mitra: 'Polda Kalimantan Timur', jenis: 'PKS', orgId: 'org-mahakam', orgNama: 'PT Mahakam Sejahtera Petroleum', berakhir: iso(210) },
    { id: 'pks-4', nomor: 'PKT/MHK/LANAL-BALIKPAPAN/2025', mitra: 'Lanal Balikpapan', jenis: 'PKT', orgId: 'org-mahakam', orgNama: 'PT Mahakam Sejahtera Petroleum', berakhir: iso(500) },
    { id: 'pks-5', nomor: 'PKS/NTN/LANAL-RANAI/2025', mitra: 'Lanal Ranai', jenis: 'PKS', orgId: 'org-natuna', orgNama: 'PT Natuna Lepas Pantai', berakhir: iso(380) },
  ];
}

function buildFollowUps(now: number, incidents: Incident[]): OpsDb['followUps'] {
  const iso = (h: number) => new Date(now + h * DAY).toISOString();
  const fromIncidents = incidents
    .filter((i) => i.status === 'Ditangani')
    .slice(0, 6)
    .map((i, k) => ({
      id: `tl-${k + 1}`,
      kode: `TL-2026-${String(k + 41).padStart(4, '0')}`,
      orgId: i.orgId,
      judul: `Perbaiki perimeter dan jadwalkan patroli malam — ${i.lokasiNama}`,
      sumber: 'Insiden',
      sumberId: i.id,
      pic: i.pic ?? '—',
      tenggat: iso(k % 3 === 0 ? -3 : 7 + k),
      status: (k % 3 === 0 ? 'Dikerjakan' : k % 3 === 1 ? 'Terbuka' : 'Menunggu Bukti') as FollowUp['status'],
    }));
  return [
    ...fromIncidents,
    { id: 'tl-90', kode: 'TL-2026-0090', orgId: 'org-andalas', judul: 'Tindak lanjuti deviasi koordinasi aparat Juli', sumber: 'WP&B', pic: 'Dimas Pratama', tenggat: iso(10), status: 'Terbuka' },
    { id: 'tl-91', kode: 'TL-2026-0091', orgId: 'org-mahakam', judul: 'Siapkan persetujuan teknis perpanjangan kontrak BUJP Senipah', sumber: 'Kontrak BUJP', pic: 'Rudi Hakim', tenggat: iso(30), status: 'Dikerjakan' },
    { id: 'tl-92', kode: 'TL-2026-0092', orgId: 'org-andalas', judul: 'Perkuat pengawasan koridor pipa (arahan rapat koordinasi)', sumber: 'Arahan SKK', pic: 'Teguh Hartono', tenggat: iso(-6), status: 'Terbuka' },
  ];
}

function buildNotifications(now: number, incidents: Incident[], contracts: OpsDb['contracts']): OpsNotification[] {
  const out: OpsNotification[] = [];
  for (const i of incidents.filter((x) => x.status === 'Belum terverifikasi' && (x.severity === 'Kritis' || x.severity === 'Tinggi'))) {
    out.push({
      id: nid('ntf'),
      at: i.dilaporkanPada,
      judul: `Insiden ${i.severity.toLowerCase()} · Belum terverifikasi`,
      isi: `${i.judul} (${i.orgNama}). Menunggu verifikasi Pejabat Berwenang KKKS.`,
      link: `/insiden/${i.id}`,
      kritis: i.severity === 'Kritis',
      untukRoles: ['R-01', 'R-02'],
      dibaca: false,
    });
    out.push({ id: nid('ntf'), at: i.dilaporkanPada, judul: 'Insiden baru menunggu verifikasi', isi: i.judul, link: `/insiden/${i.id}`, kritis: i.severity === 'Kritis', untukRoles: ['R-06'], orgId: i.orgId, dibaca: false });
  }
  for (const c of contracts) {
    const terakhir = [...c.pengingat].reverse().find((p) => p.terkirim);
    if (!terakhir || new Date(c.berakhir).getTime() < now) continue;
    out.push({
      id: nid('ntf'),
      at: new Date(terakhir.tanggal).toISOString(),
      judul: `Kontrak BUJP berakhir ${terakhir.bulanSebelum} bulan lagi`,
      isi: `${c.nomor} · ${c.bujp} untuk ${c.aset} berakhir ${c.berakhir}. Siapkan persetujuan teknis perpanjangan.`,
      link: `/kontrak/${c.id}`,
      kritis: false,
      untukRoles: ['R-04', 'R-05', 'R-06'],
      orgId: c.orgId,
      dibaca: false,
    });
    out.push({ id: nid('ntf'), at: new Date(terakhir.tanggal).toISOString(), judul: `Kontrak BUJP ${c.orgNama} berakhir ${terakhir.bulanSebelum} bulan lagi`, isi: `${c.nomor} · ${c.bujp}`, link: `/kontrak/${c.id}`, kritis: false, untukRoles: ['R-02'], dibaca: true });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

export function seedOps(now: number): OpsDb {
  seq = 0;
  const incidents = buildIncidents(now);
  const contracts = buildContracts(now);
  // Insiden terkait kontrak: insiden terverifikasi di WK yang sama dengan aset kontrak.
  for (const c of contracts) c.insidenIds = incidents.filter((i) => i.orgId === c.orgId && i.wkNama === c.wkNama && i.status !== 'Belum terverifikasi').slice(0, 3).map((i) => i.id);
  return {
    version: 1,
    incidents,
    wpb: buildWpb(),
    disepakati: DISEPAKATI,
    contracts,
    pks: buildPks(now),
    followUps: buildFollowUps(now, incidents),
    notifications: buildNotifications(now, incidents, contracts),
    seq: 1000,
  };
}
