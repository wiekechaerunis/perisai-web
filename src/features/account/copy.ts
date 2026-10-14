/**
 * Teks Pengaturan akun. Pesan validasi disalin persis dari PRD Ubah Kata Sandi Tabel U-1 (tab 3e073786-4ce5).
 * Label field memakai sentence case (K-3). Teks tanpa sumber PRD ditandai "usulan".
 */
export const accountCopy = {
  judul: 'Pengaturan akun',
  ringkasan: 'Kelola kata sandi dan perangkat yang sedang masuk ke akun Anda.',
  tabLabel: 'Bagian pengaturan akun',
  tabKataSandi: 'Ubah kata sandi',
  tabSesi: 'Sesi aktif',

  ubah: {
    judul: 'Ubah kata sandi',
    keterangan: 'Gunakan kata sandi yang unik untuk akun PERISAI.', // Figma 341:7112
    batal: 'Batal',
    saatIni: 'Kata sandi saat ini',
    baru: 'Kata sandi baru',
    konfirmasi: 'Konfirmasi kata sandi baru',
    simpan: 'Simpan kata sandi', // Figma 341:7112
    menyimpan: 'Menyimpan…',
    // Tabel U-1
    saatIniKosong: 'Kata sandi saat ini wajib diisi.',
    saatIniSalah: 'Kata sandi saat ini tidak sesuai.',
    baruKosong: 'Kata sandi baru wajib diisi.',
    terlaluUmum: 'Password ini terlalu umum. Gunakan kombinasi lain.',
    konfirmasiTidakCocok: 'Konfirmasi kata sandi tidak cocok.',
    samaDenganLama: 'Kata sandi baru harus berbeda dari kata sandi saat ini.',
    terkunciJudul: 'Terlalu banyak percobaan',
    terkunciIsi: (menit: number) => `Coba lagi dalam ${menit} menit.`,
    kendalaJudul: 'Terjadi kendala',
    kendalaIsi: 'Terjadi kendala. Silakan coba lagi.',
    // FR-UK-11
    sukses: 'Kata sandi berhasil diubah. Perangkat lain telah dikeluarkan.',
  },

  sesi: {
    judul: 'Sesi aktif',
    keterangan: 'Tinjau perangkat yang sedang masuk ke akun Anda. Keluarkan perangkat yang tidak Anda kenali.', // Figma + usulan
    aktivitasTerakhir: (v: string) => `Aktivitas terakhir: ${v}`, // Figma
    masuk: (v: string) => `Masuk ${v}`, // usulan
    kolomPerangkat: 'Perangkat',
    kolomLokasi: 'Perkiraan lokasi',
    kolomMasuk: 'Waktu masuk',
    kolomAktivitas: 'Aktivitas terakhir',
    kolomAksi: 'Aksi',
    perangkatIni: 'Perangkat ini', // FR-LO-11
    cabut: 'Keluarkan perangkat',
    cabutJudul: 'Keluarkan perangkat ini?',
    cabutIsi: (perangkat: string) => `${perangkat} akan kehilangan akses ke akun Anda dalam 30 detik.`,
    cabutKonfirmasi: 'Keluarkan perangkat',
    batal: 'Batal',
    memproses: 'Memproses…',
    cabutSukses: 'Perangkat telah dikeluarkan.',
    kosong: 'Hanya perangkat ini yang sedang masuk.',
    gagalMemuat: 'Daftar sesi gagal dimuat. Muat ulang halaman untuk mencoba lagi.',
    tabelLabel: 'Daftar sesi aktif',
    // FR-LO-05
    semuaJudul: 'Keluar dari semua perangkat',
    semuaKeterangan: 'Seluruh sesi Anda berakhir, termasuk di perangkat ini. Anda perlu masuk kembali.',
    semuaTombol: 'Keluar dari semua perangkat',
    semuaKonfirmasiJudul: 'Keluar dari semua perangkat?',
    semuaKonfirmasiIsi: 'Seluruh sesi Anda akan berakhir, termasuk sesi di perangkat ini.',
  },
} as const;
