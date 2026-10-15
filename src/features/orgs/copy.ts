/**
 * Teks Kelola Organisasi KKKS — PRD ClickUp z8pmx9pc63, Design Brief D (Copy Deck) dan Tabel E-ORG.
 * Teks tanpa sumber PRD ditandai "usulan".
 */
export const orgCopy = {
  nav: 'Organisasi',
  judul: 'Organisasi',
  ringkasan: 'Kelola organisasi yang memakai PERISAI dan akses undangannya.',
  tambah: 'Tambah organisasi',
  cari: 'Cari nama, kode, atau domain',
  cariLabel: 'Cari organisasi',
  filterJenis: 'Jenis',
  semuaJenis: 'Semua jenis',
  filterStatus: 'Status',
  semuaStatus: 'Semua status',
  aktif: 'Aktif',
  nonaktif: 'Nonaktif',
  tanpaPic: 'Tanpa PIC',
  kosong: 'Belum ada organisasi.', // usulan
  kosongFilter: 'Tidak ada organisasi yang cocok dengan filter.', // DS pola Filter daftar
  hapusFilter: 'Hapus filter',
  gagalMuat: 'Daftar organisasi gagal dimuat.',
  cobaLagi: 'Coba lagi',
  memuat: 'Memuat…',
  tabelJudul: 'Organisasi', // tanpa jumlah (arahan PM 14 Okt 2026); total ada di paginasi
  tabel: 'Daftar organisasi',
  kolom: { nama: 'Nama', jenis: 'Jenis', domain: 'Domain email', email: 'Email', pengguna: 'Pengguna aktif', pic: 'PIC', status: 'Status' },
  tambahLainnya: (n: number) => `+${n}`,

  tambahDialog: {
    judul: 'Tambah organisasi',
    deskripsi: 'Organisasi baru langsung dapat dipakai untuk undangan.',
    nama: 'Nama organisasi',
    namaPlaceholder: 'Contoh: Pertamina Hulu Rokan',
    kode: 'Kode',
    kodeHint: 'Dipakai di nomor dokumen. Tidak dapat diubah setelah disimpan.',
    badanHukum: 'Nama badan hukum',
    badanHukumPlaceholder: 'Contoh: PT Pertamina Hulu Rokan',
    skema: 'Skema kontrak',
    skemaPlaceholder: 'Pilih skema kontrak',
    domain: 'Domain email',
    domainHint: 'Tanpa @. Subdomain ikut diterima.',
    domainPlaceholder: 'contoh-energi.co.id lalu Enter',
    hapusChip: 'Hapus',
    opsional: '(opsional)',
    batal: 'Batal',
    simpan: 'Tambah organisasi',
    menyimpan: 'Menyimpan…',
    sukses: 'Organisasi ditambahkan.',
    undangPic: 'Undang PIC KKKS',
  },

  panel: {
    tutup: 'Tutup panel',
    tabLabel: 'Bagian detail organisasi',
    tabProfil: 'Profil',
    tabAkses: 'Akses',
    tabWk: 'Wilayah Kerja',
    tabRiwayat: 'Riwayat',
    menu: 'Aksi organisasi',
    nonaktifkan: 'Nonaktifkan organisasi',
    aktifkan: 'Aktifkan kembali',
    bannerNonaktif: (tgl: string, alasan: string) => `Organisasi ini nonaktif sejak ${tgl} · ${alasan}`,
    bannerTanpaPic: 'Belum ada PIC KKKS aktif di organisasi ini.',
    undangPic: 'Undang PIC',
    field: { nama: 'Nama organisasi', kode: 'Kode', jenis: 'Jenis organisasi', badanHukum: 'Nama badan hukum', skema: 'Skema kontrak', status: 'Status' },
    kodeTerkunci: 'Kode dipakai di nomor dokumen dan tidak dapat diubah.',
    ubah: 'Ubah',
    simpan: 'Simpan',
    batal: 'Batal',
    toastUbah: 'Perubahan disimpan.',
    ringkasan: { pengguna: 'Pengguna aktif', pic: 'PIC KKKS', undangan: 'Undangan tertunda', sesi: 'Sesi aktif' },
    picAktif: 'PIC KKKS aktif',
    konflik: 'Organisasi ini baru saja diubah administrator lain. Kami memuat data terbaru; periksa lalu simpan lagi.',
    gagalUbah: 'Perubahan gagal disimpan. Silakan coba lagi.',
    tidakDitemukan: 'Organisasi tidak ditemukan',
    tidakDitemukanIsi: 'Halaman atau data yang Anda cari tidak tersedia.',
  },

  akses: {
    domainJudul: 'Domain email',
    domainCounter: (n: number) => `${n}/20`,
    domainPengguna: (n: number) => `${n} pengguna`,
    tambahDomain: 'Tambah domain',
    tambahSingkat: 'Tambah',
    alasanLabel: (a: string) => 'Alasan: ' + a,
    domainBaru: 'Domain baru',
    hapus: 'Hapus',
    hapusDomainJudul: (d: string) => `Hapus domain ${d}?`,
    hapusDomainIsi: (n: number, u: number) =>
      `${n} pengguna memakai domain ini. Mereka tetap dapat masuk. ${u} undangan tertunda ke domain ini dibatalkan, dan undangan baru akan ditolak.`,
    hapusDomain: 'Hapus domain',
    emailJudul: 'Email diizinkan',
    emailHelper: 'Untuk personel di luar domain organisasi, mis. staf BUJP atau konsultan. Email pribadi wajib punya tanggal berlaku.',
    emailKosong: 'Belum ada email diizinkan.', // usulan
    tambahEmail: 'Tambah email',
    pribadi: 'Pribadi',
    kedaluwarsa: 'Kedaluwarsa',
    tidakDiperlukan: 'Tidak diperlukan lagi',
    berlakuSampai: (t: string) => `Berlaku sampai ${t}`,
    tanpaBatas: 'Tanpa batas waktu',
    akunTerkait: (n: number) => `${n} akun aktif`,
    ubahTanggal: 'Ubah',
    emailDialogJudul: 'Tambah email diizinkan', // usulan
    emailUbahJudul: 'Ubah tanggal berlaku', // usulan
    email: 'Email',
    alasan: 'Alasan',
    berlaku: 'Berlaku sampai',
    berlakuHint: 'Wajib untuk email pribadi, paling lama 12 bulan.', // usulan dari FR-ORG-25
    ubahTanggalKonfirmasi: (n: number) => (n ? `Masa berlaku akses ${n} akun terkait ikut berubah.` : ''), // FR-ORG-28 (usulan)
    toastEmail: 'Email diizinkan ditambahkan.',
    toastUbahEmail: 'Tanggal berlaku diubah.', // usulan
    hapusEmailJudul: (e: string) => `Hapus ${e}?`,
    hapusEmailAktif: 'Email ini sudah menjadi pengguna aktif.',
    nonaktifkanAkun: 'Nonaktifkan juga akun ini',
    alasanNonaktif: 'Alasan penonaktifan akun',
    alasanNonaktifPlaceholder: 'Pilih alasan',
    akunTetapAktif: (t: string) => `Akunnya tetap aktif sampai ${t}.`,
    lihatPengguna: 'Lihat pengguna',
    hapusEmail: 'Hapus',
    ipCatatan: 'Pembatasan alamat IP belum termasuk Core Platform (Q-9).', // keputusan PM 14 Okt 2026
  },

  wk: {
    judul: 'Wilayah kerja',
    kosong: 'Belum ada wilayah kerja.', // usulan
    tambah: 'Tambah wilayah kerja',
    kolom: { nama: 'Nama', kode: 'Kode', status: 'Status', pelapor: 'Pelapor' },
    bersama: 'Dioperasikan bersama',
    nama: 'Nama WK',
    namaPlaceholder: 'Contoh: WK Rokan',
    kode: 'Kode WK',
    kodeHint: 'Kode tidak dapat diubah setelah disimpan.',
    ubah: 'Ubah nama',
    nonaktifkan: 'Nonaktifkan',
    aktifkan: 'Aktifkan kembali',
    nonaktifkanJudul: (n: string) => `Nonaktifkan ${n}?`,
    nonaktifkanIsi: (p: number) => `${p} Pelapor KKKS bercakupan wilayah kerja ini kehilangan akses ke datanya dalam 30 detik. Data dan riwayat tetap tersimpan.`, // FR-ORG-44 (usulan)
    alasan: 'Alasan',
    simpan: 'Simpan',
    toastTambah: 'Wilayah kerja ditambahkan.', // usulan
    toastUbah: 'Perubahan disimpan.',
  },

  riwayat: {
    kosong: 'Belum ada perubahan.', // usulan
    kolom: { waktu: 'Waktu', pelaku: 'Pelaku', perubahan: 'Perubahan', alasan: 'Alasan' },
  },

  nonaktifkan: {
    judul: (n: string) => `Nonaktifkan ${n}?`,
    dampak: (n: number, s: number, u: number) => [`${n} pengguna kehilangan akses seketika`, `${s} sesi aktif diakhiri dalam 30 detik`, `${u} undangan tertunda tidak dapat dipakai`],
    catatan: 'Status akun, grup, data, dan riwayat tetap tersimpan. Organisasi dapat diaktifkan kembali.',
    alasan: 'Alasan penonaktifan',
    alasanPlaceholder: 'Pilih alasan',
    penjelasan: 'Penjelasan',
    konfirmasi: (k: string) => `Ketik ${k} untuk mengonfirmasi`,
    kodeSalah: (k: string) => `Kode tidak cocok. Ketik ${k} untuk melanjutkan.`,
    tombol: 'Nonaktifkan organisasi',
    memproses: 'Memproses…',
    batal: 'Batal',
    sukses: (nama: string, n: number) => `${nama} dinonaktifkan. ${n} pengguna tidak lagi dapat masuk.`,
    aktifkanJudul: (n: string) => `Aktifkan kembali ${n}?`,
    aktifkanIsi: 'Pengguna berstatus Aktif dapat masuk lagi. Undangan yang sudah kedaluwarsa perlu dikirim ulang.',
    aktifkanSukses: (n: string) => `${n} aktif kembali.`,
  },

  // Tabel E-ORG
  e: {
    namaKosong: 'Nama organisasi wajib diisi.',
    namaPanjang: 'Nama organisasi harus 3–150 karakter.',
    namaDipakai: 'Nama ini sudah dipakai organisasi lain. Gunakan nama yang berbeda.',
    kodeKosong: 'Kode organisasi wajib diisi.',
    kodeFormat: 'Gunakan 2–20 huruf kapital, angka, atau tanda hubung. Contoh: KKKS-031.',
    kodeDipakai: 'Kode ini sudah dipakai organisasi lain.',
    domainKosong: 'Tambahkan minimal satu domain email organisasi.',
    domainFormat: 'Masukkan domain tanpa @, contoh: contoh-energi.co.id.',
    domainPribadi: 'Domain email pribadi tidak dapat dipakai. Gunakan domain kantor organisasi.',
    domainGanda: 'Domain ini sudah ada di daftar.',
    domainDipakaiLain: 'Domain ini telah dipakai di organisasi lain.',
    domainTerakhir: 'Organisasi KKKS harus punya minimal satu domain email.',
    domainBatas: 'Organisasi sudah punya 20 domain. Hapus domain yang tidak dipakai untuk menambah yang baru.',
    emailFormat: 'Masukkan alamat email lengkap, contoh: nama@perusahaan.co.id.',
    emailDomainTerdaftar: (d: string) => `Domain ${d} sudah terdaftar di organisasi ini. Email ini dapat diundang tanpa ditambahkan.`,
    emailOrgLain: 'Email ini sudah terdaftar di organisasi lain. Satu email hanya untuk satu organisasi.',
    emailPribadiTanggal: 'Email pribadi wajib punya tanggal berlaku, paling lama 12 bulan.',
    tanggalSalah: 'Tanggal berlaku harus hari ini atau paling lama 12 bulan lagi.', // usulan
    alasanKosong: 'Alasan wajib diisi.',
    gagalTambah: 'Organisasi gagal ditambahkan. Silakan coba lagi.',
    badanHukumPanjang: 'Nama badan hukum maksimal 200 karakter.', // usulan
    wkNamaPanjang: 'Nama wilayah kerja harus 3–150 karakter.', // usulan
    wkNamaDipakai: 'Nama ini sudah dipakai wilayah kerja lain.', // usulan
    wkKodeDipakai: 'Kode ini sudah dipakai wilayah kerja lain.', // usulan
  },
} as const;
