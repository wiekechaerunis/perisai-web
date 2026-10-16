/**
 * Teks Log Akses (PRD tab ac582539-7263) dan Jejak Audit (PRD tab 70911a9e-e9ed). Tidak ada frame Figma;
 * tata letak mengikuti pola Manajemen Pengguna (kartu filter, tabel, panel kanan) — PR-11.
 * Teks tanpa sumber PRD ditandai "usulan".
 */
export const logsCopy = {
  periode: 'Periode',
  dari: 'Dari tanggal',
  sampai: 'Sampai tanggal',
  semua: 'Semua',
  semuaOrganisasi: 'Semua organisasi',
  nonaktif: '(Nonaktif)', // FR-LA-08, FR-JA-13
  hasil: 'Hasil',
  terapkan: 'Tampilkan', // usulan
  reset: 'Hapus filter', // DS pola Filter daftar (15 Okt 2026)
  filterAktif: 'Filter aktif',
  hapusSatu: (label: string) => `Hapus filter ${label}`,
  // Preset periode — usulan desain 15 Okt 2026 (menunggu persetujuan PM).
  presetHariIni: 'Hari ini',
  preset7: '7 hari terakhir',
  preset30: '30 hari terakhir',
  presetKhusus: 'Rentang khusus',
  filterLainnya: (n: number) => (n ? `Filter lainnya (${n})` : 'Filter lainnya'), // usulan
  sembunyikanFilter: 'Sembunyikan filter', // usulan
  ekspor: 'Ekspor CSV', // FR-LA-16, FR-JA-18
  mengekspor: 'Mengekspor…',
  eksporSukses: (n: number) => `${n} baris diekspor.`, // usulan
  arsip: 'Arsip', // FR-LA-18, FR-JA-22 (penanda)
  arsipKeterangan: 'Sebagian hasil berasal dari arsip (lebih dari masa aktif).', // usulan
  memuat: 'Memuat…',
  gagal: 'Data gagal dimuat. Muat ulang halaman untuk mencoba lagi.',
  tutupPanel: 'Tutup panel',
  halaman: { sebelumnya: 'Sebelumnya', berikutnya: 'Berikutnya', label: 'Navigasi halaman', barisPerHalaman: 'Baris per halaman', ringkasan: (a: number, b: number, n: number) => `${a}–${b} dari ${n}` },

  log: {
    judul: 'Log akses',
    ringkasan: 'Riwayat masuk, keluar, verifikasi, pemulihan akun, dan penolakan akses.', // usulan
    tabLog: 'Log akses',
    tabSesi: 'Sesi aktif',
    tabLabel: 'Bagian log akses',
    pengguna: 'Pengguna',
    penggunaPlaceholder: 'Nama atau email',
    organisasi: 'Organisasi',
    jenis: 'Jenis peristiwa',
    ip: 'Alamat IP',
    berhasil: 'Berhasil',
    gagal: 'Gagal',
    gagalBeruntun: 'Hanya kegagalan login beruntun', // FR-LA-12 (Checkbox filter cepat)
    gagalBeruntunPil: 'Kegagalan login beruntun', // pil filter aktif DS v2 (usulan)
    kondisi: 'Kondisi', // legend panel filter DS v2
    eksporLabel: 'Ekspor log akses (CSV)', // FR-LA-16; tombol ikon + tooltip (DS v2 DataTable)
    entitas: 'entri', // "Terapkan · n entri" (DS v2 FilterPanel)
    gagalBeruntunAktif: (n: number) => `Menampilkan pengguna dengan ${n} kali atau lebih kegagalan login berturut-turut.`, // usulan
    kolom: { waktu: 'Waktu', pengguna: 'Pengguna', organisasi: 'Organisasi', peristiwa: 'Peristiwa', hasil: 'Hasil', sumber: 'Sumber' },
    tabel: 'Daftar log akses',
    kosong: 'Tidak ada peristiwa pada periode dan filter ini.',
    detail: {
      waktu: 'Waktu',
      pengguna: 'Pengguna',
      organisasi: 'Organisasi',
      kelompok: 'Kelompok',
      peristiwa: 'Jenis peristiwa',
      hasil: 'Hasil',
      alasan: 'Alasan',
      ip: 'Alamat IP',
      userAgent: 'User agent',
      lokasi: 'Perkiraan lokasi',
      sesi: 'Id sesi',
      modulAksi: 'Modul & aksi',
      lihatSesi: 'Lihat semua peristiwa dalam sesi ini', // FR-LA-10
    },
  },

  sesi: {
    kolom: { pengguna: 'Pengguna', organisasi: 'Organisasi', perangkat: 'Perangkat', lokasi: 'Perkiraan lokasi', masuk: 'Waktu masuk', aktivitas: 'Aktivitas terakhir', aksi: 'Aksi' },
    tabel: 'Daftar sesi aktif',
    kosong: 'Tidak ada sesi aktif.',
    cabut: 'Cabut sesi',
    cabutJudul: 'Cabut sesi?',
    cabutIsi: (nama: string, perangkat: string) => `Sesi ${nama} di ${perangkat} akan berakhir dalam 30 detik.`, // usulan
    sukses: 'Sesi dicabut.', // usulan
  },

  audit: {
    judul: 'Jejak audit',
    ringkasan: 'Catatan perubahan data, akses, dan konfigurasi. Tidak dapat diubah atau dihapus.', // FR-JA-07 (copy usulan)
    awalJudul: 'Pilih filter untuk menampilkan jejak audit', // FR-JA-12 (copy usulan)
    awalIsi: 'Periode wajib diisi. Default 7 hari terakhir.',
    pilihFilter: 'Pilih filter',
    eksporLabel: 'Ekspor jejak audit (CSV)', // FR-JA-18; tombol ikon + tooltip (DS v2 DataTable) // usulan (DS v2: satu aksi pemulihan di EmptyState)
    korelasi: 'Id korelasi', // FR-JA-15 (pil filter aktif)
    organisasi: 'Organisasi objek',
    modul: 'Modul',
    semuaModul: 'Semua modul',
    aksi: 'Aksi',
    semuaAksi: 'Semua aksi',
    pelaku: 'Pelaku',
    pelakuPlaceholder: 'Nama pelaku atau "Sistem"',
    objek: 'Objek',
    objekPlaceholder: 'Contoh: pengguna #u-10',
    berhasil: 'Berhasil',
    ditolak: 'Ditolak',
    kolom: { waktu: 'Waktu', pelaku: 'Pelaku', modul: 'Modul', aksi: 'Aksi', objek: 'Objek', hasil: 'Hasil' },
    tabel: 'Daftar jejak audit',
    kosong: 'Tidak ada entri pada periode dan filter ini.',
    detail: {
      waktu: 'Waktu',
      pelaku: 'Pelaku',
      role: 'Role pelaku',
      orgPelaku: 'Organisasi pelaku',
      modul: 'Modul',
      aksi: 'Aksi',
      objek: 'Objek',
      orgObjek: 'Organisasi objek',
      alasan: 'Alasan',
      hasil: 'Hasil',
      sumber: 'Sumber',
      korelasi: 'Id korelasi',
      perubahan: 'Perubahan nilai',
      field: 'Field',
      sebelum: 'Sebelum',
      sesudah: 'Sesudah',
      tanpaPerubahan: 'Tidak ada perubahan nilai.',
      kelompokJudul: 'Bagian dari aksi massal', // FR-JA-15
      lihatKelompok: (n: number) => `Lihat ${n} entri dengan id korelasi yang sama`,
      logPelaku: 'Buka log akses pelaku', // usulan (FR-JA cross-link)
    },
    retensi: {
      tombol: 'Kebijakan retensi', // FR-JA-21..25
      judul: 'Kebijakan retensi',
      keterangan: 'Berlaku untuk log akses dan jejak audit. Perubahan tidak berlaku surut.', // FR-LA-19, FR-JA-25
      aktif: 'Masa aktif (bulan)',
      aktifHint: 'Setelah masa aktif, entri diarsipkan dan tetap dapat dicari.',
      total: 'Masa simpan total (tahun)',
      // PR-06 diputuskan PM (14 Okt 2026): FR-JA-23 "5X" = 5 tahun (BRD K-10, FR-LA-18).
      totalHint: 'Setelah masa simpan total, entri dimusnahkan dan pemusnahannya dicatat.',
      tidakValid: 'Masa simpan total harus sama atau lebih panjang dari masa aktif.',
      terakhir: (oleh: string, waktu: string) => `Terakhir diubah oleh ${oleh} · ${waktu}`,
      simpan: 'Simpan',
      menyimpan: 'Menyimpan…',
      batal: 'Batal',
      sukses: 'Kebijakan retensi diperbarui.',
      lihat: 'Masa aktif {a} bulan · masa simpan total {t} tahun',
    },
  },
} as const;
