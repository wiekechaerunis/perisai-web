/**
 * Teks Manajemen Pengguna (gelombang 2). Pesan disalin PERSIS dari PRD:
 * Undang Pengguna (a7315f64-20f0) Tabel V-1 & copy; Kirim Ulang (46a985a6-102b); Batalkan (97283c3a-9515);
 * Kelola Status Akun (aa87a27a-ee88); Logout & Sesi Tabel S-3 (a61955db-ba08).
 * Label/tombol sentence case (K-3). Teks tanpa sumber PRD ditandai "usulan".
 */
export const usersCopy = {
  judul: 'Manajemen pengguna',
  ringkasan: 'Kelola akun, organisasi, status, dan izin efektif pengguna.', // Figma 66:3139
  // Figma 66:3139 menampilkan "Manajemen pengguna · n"; jumlah dihapus dari judul (arahan PM 14 Okt 2026), total ada di paginasi.
  tabelJudul: 'Manajemen pengguna',
  undang: 'Undang pengguna',
  cari: 'Cari nama atau email', // Figma 66:3139
  cariLabel: 'Cari pengguna',
  semuaStatus: 'Semua status',
  semuaOrganisasi: 'Semua organisasi',
  filterStatus: 'Status',
  filterOrganisasi: 'Organisasi',
  filterPermintaan: 'Punya permintaan aktif', // FR-KU-19a
  kolom: { nama: 'Nama', organisasi: 'Organisasi', role: 'Role', status: 'Status', loginTerakhir: 'Login terakhir', aksi: 'Aksi' },
  belumPernah: 'Belum pernah',
  kosong: 'Belum ada pengguna.',
  kosongFilter: 'Tidak ada pengguna yang cocok dengan filter.',
  hapusFilter: 'Hapus filter',
  gagalMemuat: 'Daftar pengguna gagal dimuat. Muat ulang halaman untuk mencoba lagi.',
  tabelLabel: 'Daftar pengguna',
  aksiMenu: 'Aksi untuk',
  mintaUndanganBaru: 'Minta undangan baru', // FR-KU-19a
  organisasiNonaktif: 'Organisasi nonaktif', // FR-SA-24b
  organisasiNonaktifTooltip: 'Aktifkan kembali organisasinya lebih dulu.',
  lihatProfil: 'Lihat profil',

  aksi: {
    kirimUlang: 'Kirim ulang undangan',
    batalkan: 'Batalkan undangan',
    tangguhkan: 'Tangguhkan',
    nonaktifkan: 'Nonaktifkan',
    aktifkanKembali: 'Aktifkan kembali',
    perpanjang: 'Ubah masa berlaku akses',
    tangguhkanAkun: 'Tangguhkan akun', // Figma 257:8562
    nonaktifkanAkun: 'Nonaktifkan akun',
    lainnya: 'Aksi lainnya',
    cabutSesi: 'Akhiri semua sesi', // Figma 257:8562 (FR-LO-14)
  },

  undangModal: {
    judul: 'Undang pengguna',
    deskripsi: 'Pengguna akan menerima email untuk mengaktifkan akun.', // Figma 49:220
    namaPlaceholder: 'Contoh: Andi Pratama',
    emailPlaceholder: 'nama@perusahaan.co.id',
    jabatanPlaceholder: 'Contoh: Security Superintendent',
    tanggalPlaceholder: 'Pilih tanggal',
    hapusChip: 'Hapus',
    nama: 'Nama lengkap',
    email: 'Email',
    emailHint: 'Gunakan email kantor dengan domain organisasi, atau email yang sudah ada di daftar email diizinkan organisasi.',
    jabatan: 'Jabatan',
    opsional: '(opsional)',
    organisasi: 'Organisasi',
    organisasiPlaceholder: 'Pilih organisasi',
    cariOrganisasi: 'Cari organisasi',
    dataTidakDitemukan: 'Data tidak ditemukan',
    role: 'Role',
    rolePlaceholder: 'Pilih role',
    roleDisabled: 'Pilih organisasi terlebih dahulu',
    wk: 'Wilayah Kerja', // FR-CD-09a (PR-04)
    wkPlaceholder: 'Pilih wilayah kerja',
    // FR-CD-04b (copy usulan)
    cakupanR02: 'Cakupan Pengawas',
    cakupanSemua: 'Seluruh KKKS',
    cakupanSebagian: 'Beberapa KKKS tertentu',
    cakupanKkks: 'KKKS yang ditugaskan',
    cakupanKkksPlaceholder: 'Pilih KKKS',
    cakupanKkksKosong: 'Pilih minimal satu KKKS.',
    aksesBerakhir: 'Masa berlaku akses',
    aksesHint: 'Kosongkan bila akses tidak dibatasi waktu.', // Figma 49:220
    berlaku: (durasi: string, tanggal: string) => `Akses berlaku ${durasi}, sampai ${tanggal}. Pastikan tanggal ini sesuai kebutuhan.`, // FR-UP-14 + Figma 213:478
    masaBerlakuUndangan: (hari: number) => `Undangan berlaku ${hari} hari`, // FR-UP-05, Figma 49:220
    batal: 'Batal',
    kirim: 'Undang', // Figma 49:220
    mengirim: 'Mengirim…',
    sukses: 'Undangan dibuat. Pengguna perlu mengaktifkan akun melalui tautan.',
    gagalJudul: 'Undangan Gagal Dikirim',
    gagalIsi: (email: string) => `Terjadi kendala saat mengirim undangan ke ${email}. Silakan coba lagi.`,
    cobaLagi: 'Coba Lagi',
    tutup: 'Tutup',
  },
  // Tabel V-1
  v: {
    namaKosong: 'Nama lengkap wajib diisi.',
    namaMaks: 'Nama lengkap maksimal 100 karakter.',
    emailKosong: 'Email wajib diisi.',
    emailFormat: 'Masukkan email yang valid, contoh: nama@perusahaan.co.id.',
    emailDomain: (org: string) =>
      `Email ini tidak memakai domain ${org} dan tidak ada di daftar email diizinkan. Hubungi Administrator Bisnis SKK Migas.`,
    emailPribadi: 'Email pribadi tidak dapat digunakan. Gunakan email kantor.',
    emailTerdaftar: 'Email ini sudah terdaftar. Buka profil pengguna untuk mengubah role atau status.',
    emailTerdaftarLink: 'Buka profil pengguna', // FR-UP-17
    emailDiundang: 'Email ini sudah diundang dan menunggu aktivasi.',
    emailNonaktif: 'Email ini milik akun yang tidak aktif. Aktifkan kembali dari profil pengguna.',
    emailSendiri: 'Anda tidak dapat mengundang email Anda sendiri.', // FR-UP-11a (copy usulan)
    jabatanMaks: 'Jabatan maksimal 100 karakter.',
    organisasiKosong: 'Pilih organisasi pengguna.',
    roleKosong: 'Pilih role pengguna.',
    roleNonaktif: 'Role ini sudah tidak aktif. Pilih role lain.',
    sod: 'Kombinasi role ini melanggar pemisahan tugas.',
    tanpaWk: 'Organisasi ini belum punya wilayah kerja aktif.',
    wkKosong: 'Pilih wilayah kerja pengguna.', // Figma 213:625
    tanggalLampau: 'Tanggal berakhir tidak boleh di masa lalu.',
    lebihDuaTahun:
      'Masa berlaku akses lebih dari 2 tahun. Pastikan tanggal ini sesuai kebutuhan, karena akses tidak akan ditinjau ulang sampai tanggal tersebut.',
  },

  kirimUlang: {
    judul: 'Kirim ulang undangan',
    // Figma 109:14140 (Title Case → sentence case, K-3)
    judulKonfirmasi: 'Kirim ulang undangan?',
    isiSebelum: 'Undangan baru akan dikirim ke ',
    isiSesudah: 'Tautan sebelumnya tidak berlaku lagi.',
    // Figma 253:6888 (FR-KU-21: tampilkan kapan boleh lagi)
    batasJudul: 'Batas kirim ulang tercapai',
    batasIsi:
      'Undangan sudah dikirim ulang beberapa kali, tapi sepertinya belum berhasil sampai. Untuk menghindari pengiriman berlebihan, kirim ulang baru dapat dilakukan lagi nanti.',
    batasKapan: (jam: string) => `Dapat mengirim ulang kembali pada ${jam}`,
    tutup: 'Tutup',
    keterangan: 'Tautan lama tidak berlaku lagi setelah undangan baru dikirim.', // usulan (FR-KU-10)
    kirim: 'Kirim ulang',
    mengirim: 'Mengirim…',
    batal: 'Batal',
    sukses: (email: string) => `Undangan berhasil dikirim ulang ke ${email}.`,
    gagalJudul: 'Undangan Gagal Dikirim',
    gagalIsi: (email: string) => `Terjadi kendala saat mengirim undangan ke ${email}. Silakan coba lagi.`,
    cobaLagi: 'Coba Lagi',
    // FR-KU-21: tampilkan kapan boleh lagi (copy usulan)
    terlaluCepat: (waktu: string) => `Undangan baru saja dikirim. Coba lagi pada ${waktu}.`,
    kuotaHabis: (waktu: string) => `Batas kirim ulang hari ini tercapai. Coba lagi pada ${waktu}.`,
  },

  batal: {
    judul: 'Batalkan undangan',
    judulKonfirmasi: 'Batalkan undangan?', // Figma 221:2272
    peringatanJudul: 'Link aktivasi yang sudah dikirim tidak akan berlaku lagi.',
    peringatanIsi: 'Pengguna ini tidak dapat mengaktifkan akun kecuali Anda mengundangnya kembali.',
    alasan: 'Alasan pembatalan', // Figma 221:2272
    alasanPlaceholder: 'Pilih alasan pembatalan',
    penjelasan: 'Penjelasan',
    konfirmasi: 'Batalkan undangan',
    memproses: 'Membatalkan…',
    kembali: 'Kembali', // usulan (tombol tutup)
    sukses: (email: string) => `Undangan untuk ${email} dibatalkan.`,
  },

  status: {
    // Figma 257:8570
    tangguhkanJudul: 'Tangguhkan akun?',
    tangguhkanKeterangan: 'Akun berikut akan ditangguhkan. Pengguna tidak akan dapat mengakses sistem selama penangguhan.',
    // Figma 257:9443 (FR-SA-18 meminta peringatan pencabutan permanen; lihat ASSUMPTIONS F-29)
    nonaktifkanJudul: 'Nonaktifkan akun?',
    nonaktifkanKeterangan: 'Akun berikut akan dinonaktifkan. Pengguna tidak akan dapat mengakses sistem selama penonaktifan.',
    // Figma 265:11301
    aktifkanJudul: 'Reaktivasi akun?',
    aktifkanKeterangan: 'Akun berikut akan diaktifkan kembali. Pengguna akan dapat mengakses sistem setelah reaktivasi.',
    statusSebelumnya: 'Riwayat perubahan status',
    tanggal: 'Tanggal',
    keterangan: 'Keterangan',
    alasanTangguh: 'Alasan penangguhan',
    alasanTangguhPlaceholder: 'Pilih alasan penangguhan',
    alasanNonaktif: 'Alasan penonaktifan',
    alasanNonaktifPlaceholder: 'Pilih alasan penonaktifan',
    nSesi: (n: number) => `${n} sesi`,
    alasanPlaceholder: 'Pilih alasan',
    penjelasan: 'Penjelasan',
    sesiAktif: 'Sesi aktif',
    tangguhkan: 'Tangguhkan',
    nonaktifkan: 'Nonaktifkan',
    aktifkan: 'Aktifkan kembali',
    memproses: 'Memproses…',
    batal: 'Batal',
    picTerakhirJudul: 'Ini PIC KKKS aktif terakhir', // FR-SA-07 (judul usulan)
    picTerakhirIsi: (org: string) =>
      `Setelah dinonaktifkan, ${org} tidak lagi memiliki PIC KKKS aktif. Administrator Bisnis akan diberi tahu.`,
    tetapNonaktifkan: 'Tetap Nonaktifkan', // FR-SA-07
    suksesTangguh: (nama: string) => `Akun ${nama} ditangguhkan.`,
    suksesNonaktif: (nama: string) => `Akun ${nama} dinonaktifkan.`,
    suksesAktif: (nama: string) => `Akun ${nama} diaktifkan kembali.`, // Figma 269:11432 (typo diperbaiki, F-30)
    // Masa berlaku (FR-SA-22..26)
    // Figma 270:12574 dan varian 271:100..319
    masaJudul: 'Ubah masa berlaku akses',
    masaLabel: 'Berlaku sampai',
    masaHint: 'Akses berakhir pukul 23:59 WIB pada tanggal ini.',
    berlakuSaatIni: (v: string) => `Berlaku sampai saat ini: ${v}`,
    tidakDibatasi: 'Tidak dibatasi waktu',
    hapusBatas: 'Hapus batas waktu',
    infoNonaktif: 'Akun ini nonaktif. Memperpanjang masa berlaku tidak mengaktifkannya kembali.',
    infoDitangguhkan: 'Akun ini ditangguhkan. Masa berlaku tetap berjalan selama penangguhan.',
    tanpaBatas: 'Tanpa batas waktu',
    simpan: 'Simpan',
    menyimpan: 'Menyimpan…',
    masaSukses: 'Masa berlaku diperpanjang',
    harusPerpanjang: 'Masa berlaku akses sudah lewat. Ubah masa berlaku akses lebih dulu.', // usulan
  },

  sesi: {
    // FR-LO-16, Tabel S-3
    judul: 'Cabut sesi',
    keterangan: (n: number) => `Seluruh ${n} sesi aktif pengguna ini akan berakhir dalam 30 detik.`, // usulan
    alasan: 'Alasan pencabutan',
    alasanPlaceholder: 'Pilih alasan pencabutan',
    penjelasan: 'Penjelasan',
    konfirmasi: 'Cabut Sesi', // FR-LO-16 menyebut tombol "Cabut Sesi"
    memproses: 'Memproses…',
    batal: 'Batal',
    sukses: (n: number) => `${n} sesi dicabut.`, // usulan
  },

  profil: {
    kembali: 'Manajemen pengguna',
    tutup: 'Tutup panel',
    memuat: 'Memuat…',
    tidakDitemukan: 'Pengguna tidak ditemukan',
    tidakDitemukanIsi: 'Halaman atau data yang Anda cari tidak tersedia.',
    ubah: 'Ubah',
    tidakDapatDiubah: 'Tidak dapat diubah',
    // Figma 106:14009, 106:14074, 246:5817, 251:6771
    berlakuSampai: (v: string) => `Undangan berlaku sampai ${v}`,
    kedaluwarsaPada: (v: string) => `Undangan kedaluwarsa pada ${v}. Kirim ulang agar pengguna dapat mengaktifkan akun.`,
    permintaanJudul: 'Permintaan undangan baru',
    diajukan: (v: string) => `Diajukan pada ${v}`,
    sebelumnyaKedaluwarsa: (v: string) => `Undangan sebelumnya kedaluwarsa pada ${v}`,
    belumSelesaiJudul: 'Aktivasi akun belum selesai',
    belumSelesaiIsi: 'Pengguna belum pernah mengaktifkan akun dari undangan sebelumnya.',
    kirimUndanganBaru: 'Kirim undangan baru',
    // Figma 106:14009: tab Profil / Akses / Aktivitas
    tabLabel: 'Bagian detail pengguna',
    tabProfil: 'Profil',
    tabAkses: 'Akses',
    tabAktivitas: 'Aktivitas',
    bukaLogAkses: 'Buka di Log Akses', // FR-LA-11 (copy usulan)
    bukaJejakAudit: 'Buka di Jejak Audit', // FR-JA-17 (copy usulan)
    aktivitasKosong: 'Tidak ada aktivitas dalam 30 hari terakhir.',
    wkNonaktif: '(Nonaktif)', // FR-CD-13
    informasi: 'Informasi pengguna',
    riwayat: 'Riwayat akun',
    riwayatKosong: 'Belum ada riwayat.',
    oleh: (p: string) => `oleh ${p}`,
    field: {
      nama: 'Nama lengkap',
      email: 'Email',
      jabatan: 'Jabatan',
      organisasi: 'Organisasi',
      role: 'Role',
      wk: 'Wilayah Kerja',
      status: 'Status',
      aksesBerakhir: 'Masa berlaku akses',
      undanganBerlaku: 'Undangan berlaku sampai',
      diundang: 'Diundang',
      loginTerakhir: 'Login terakhir',
      sesiAktif: 'Sesi aktif',
    },
    // FR-UDR-06
    emailTertunda: (status: string, email: string) => `${status}: ${email}`,
    emailTertundaAdmin: 'Diubah admin, menunggu verifikasi pengguna.',
    emailTertundaSendiri: 'Diajukan pengguna.',
    tanpaBatas: 'Tanpa batas waktu',
  },

  // PRD Profil Pengguna (ClickUp z8pmx9n8nx) — Figma 109:16236 (Profil), 109:16307 (Akses), 109:16444 (Aktivitas).
  panel: {
    resetSandi: 'Reset kata sandi', // Figma 109:16236
    resetJudul: 'Kirim tautan atur ulang kata sandi?', // usulan
    resetIsi: (email: string) => `Tautan atur ulang dikirim ke ${email} dan berlaku 1 jam. Anda tidak akan melihat kata sandi pengguna.`, // usulan
    resetKirim: 'Kirim tautan', // usulan
    resetSukses: 'Tautan atur ulang kata sandi dikirim.', // usulan
    ubah: 'Ubah', // Figma 109:16236
    tidakDapatDiubah: 'Tidak dapat diubah',
    masaBerlaku: 'Masa berlaku', // Figma 109:16236
    riwayatAkun: 'Riwayat akun', // Figma 109:16236
    diundang: 'Diundang',
    diaktifkan: 'Diaktifkan',
    loginTerakhir: 'Login terakhir',
    belumPernahLogin: 'Belum pernah login', // FR-DP-05
    role: 'Role', // Figma 109:16307
    cakupanData: 'Cakupan data', // Figma 109:16307
    sesiAktif: (n: number) => `Sesi aktif (${n})`, // Figma 109:16444
    tidakAdaSesi: 'Tidak ada sesi aktif', // PRD Profil Pengguna
    keluar: 'Keluar', // Figma 109:16444
    aktifLalu: (rel: string) => `Aktif ${rel}`, // Figma 109:16444 ("Aktif 5 menit lalu")
    riwayatPerubahan: 'Riwayat perubahan', // Figma 109:16444
    oleh: (p: string) => `Oleh ${p}`,
    keluarJudul: 'Akhiri sesi ini?', // usulan
    keluarIsi: (perangkat: string) => `${perangkat}. Pengguna harus masuk kembali dari perangkat ini.`, // usulan
    keluarKonfirmasi: 'Akhiri sesi', // usulan
    keluarSukses: 'Sesi diakhiri.', // usulan
    akhiriSemuaNonaktif: 'Tidak ada sesi aktif.', // PRD Profil Pengguna (tombol disabled)
    eksporJudul: 'Ekspor daftar pengguna', // US-ED-01
    ekspor: 'Ekspor', // US-ED-01
    eksporKeterangan: (n: number) => `${n} pengguna sesuai pencarian dan filter saat ini akan diekspor. Kata sandi dan token tidak pernah ikut.`, // usulan
    eksporFormat: 'Format file',
    eksporCsv: 'CSV (.csv)',
    eksporXlsx: 'Excel (.xlsx)',
    eksporKirim: 'Unduh file',
    eksporMemproses: 'Menyiapkan file…',
    eksporSukses: (n: number) => `File berisi ${n} pengguna berhasil diunduh.`, // US-ED-09 (copy usulan)
    eksporGagal: 'File gagal dibuat. Silakan coba lagi.', // US-ED-07 (copy usulan)
    eksporKosong: 'Tidak ada pengguna untuk diekspor.', // US-ED-08 (copy usulan)
    filterRole: 'Role',
    semuaRole: 'Semua role',
    kolomRole: 'Role',
  },
  // PRD Ubah Data & Role Pengguna (ClickUp z8pmx9n8ny). Tabel E-UDR ditulis dengan sapaan "Anda" (keputusan PM 14 Okt 2026).
  ubah: {
    tombol: 'Ubah data', // usulan
    judul: 'Ubah data pengguna', // usulan
    ringkasan: 'Perubahan baru tersimpan setelah Anda meninjau ringkasan dan mengonfirmasi.', // FR-UDR-09 (copy usulan)
    crumbPengguna: 'Pengguna',
    // Tata letak & judul seksi mengikuti Figma 341:6300 (Akun Saya — Profil), atas arahan PM 14 Okt 2026.
    seksiData: 'Informasi profil',
    seksiDataKeterangan: 'Organisasi tidak dapat diubah. Email baru berlaku setelah diverifikasi pengguna.', // usulan
    seksiRole: 'Role dan cakupan akses',
    nama: 'Nama lengkap',
    namaHint: '3–150 karakter.', // FR-UDR-03 (Figma 341:6300: 3–100, F-31)
    cakupan: 'Cakupan akses', // Figma 341:6300
    masaBerlaku: 'Masa berlaku akses', // Figma 341:6300
    masaBerlakuSampai: (v: string) => `Berlaku sampai ${v}`, // Figma 341:6300
    masaBerlakuHint: 'Ubah lewat panel pengguna (Masa berlaku akses › Ubah).', // FR-SA-22 (copy usulan)
    jabatan: 'Jabatan',
    jabatanHint: 'Maksimal 100 karakter. Tidak memengaruhi akses.', // FR-UDR-04
    email: 'Email',
    emailHint: 'Email baru berlaku setelah pengguna memverifikasi tautan yang dikirim ke email baru.', // FR-UDR-05 (copy usulan)
    emailSendiri: 'Ubah email Anda sendiri lewat Akun Saya.', // FR-UDR-12 (copy usulan)
    emailBelumAktif: 'Email akun yang belum aktif diganti dengan membatalkan undangan lalu mengundang ulang.', // disetujui PM 14 Okt 2026 (copy usulan)
    bukaAkunSaya: 'Buka Akun Saya',
    organisasi: 'Organisasi',
    organisasiHint: 'Organisasi tidak dapat diubah. Pindah organisasi = nonaktifkan akun lalu undang ulang.', // FR-UDR-03
    role: 'Role',
    roleSendiri: 'Anda tidak dapat mengubah role akun Anda sendiri.', // Tabel E-UDR
    rolePlaceholder: 'Pilih role',
    batal: 'Batal',
    tinjau: 'Tinjau perubahan', // usulan
    memeriksa: 'Memeriksa…',
    ringkasanJudul: 'Ringkasan perubahan', // FR-UDR-09
    ringkasanKeterangan: 'Periksa nilai sebelum dan sesudah. Perubahan belum tersimpan.', // usulan
    kolom: { field: 'Data', sebelum: 'Sebelum', sesudah: 'Sesudah' },
    fieldLabel: { nama: 'Nama lengkap', jabatan: 'Jabatan', email: 'Email', roles: 'Role', wilayahKerja: 'Wilayah Kerja', cakupan: 'Cakupan Pengawas' },
    emailTertundaCatatan: 'Berlaku setelah pengguna memverifikasi email baru. Seluruh sesinya akan dicabut.', // FR-UDR-05 (copy usulan)
    aksesJudul: 'Perbedaan hak akses', // FR-HE-17
    aksesKeterangan: 'Hanya modul yang sudah tersedia. Role baru berlaku pada permintaan berikutnya tanpa mengakhiri sesi pengguna.', // FR-HE-14a, FR-UDR-07 (copy usulan)
    aksesBertambah: 'Bertambah',
    aksesBerkurang: 'Berkurang',
    aksesSama: 'Hak akses tidak berubah.', // usulan
    kembali: 'Kembali mengubah', // FR-UDR-09
    simpan: 'Simpan perubahan',
    menyimpan: 'Menyimpan…',
    sukses: 'Perubahan pengguna berhasil disimpan', // FR-UDR-09
    gagal: 'Gagal menyimpan data, harap coba lagi', // FR-UDR-09
    tanpaPerubahan: 'Belum ada perubahan.', // usulan
    tinggalkanJudul: 'Tinggalkan halaman?', // FR-UDR-10 (copy usulan)
    tinggalkanIsi: 'Perubahan yang belum disimpan akan hilang.',
    tinggalkan: 'Tinggalkan',
    tetap: 'Tetap di sini',
    tidakDapat: 'Data pengguna ini tidak dapat diubah.', // usulan (akun nonaktif / organisasi nonaktif)
  },
  // Tabel E-UDR
  e: {
    namaKosong: 'Nama wajib diisi.',
    namaPanjang: 'Nama harus 3–150 karakter.',
    jabatanPanjang: 'Jabatan maksimal 100 karakter.',
    emailFormat: 'Masukkan alamat email lengkap, contoh: nama@perusahaan.co.id.',
    emailDipakai: 'Email ini sudah terdaftar di akun lain.',
    emailDomain: 'Email ini belum diizinkan untuk organisasi Anda. Hubungi Administrator Bisnis SKK Migas.',
    emailDomainPengguna: 'Email ini belum diizinkan untuk organisasi pengguna.', // usulan (diubah admin)
    keburuDipakai: 'Email ini sudah dipakai akun lain. Permintaan tidak dapat disetujui.',
  },
  // FR-UDR-15, -16
  permintaanEmail: {
    nav: 'Permintaan ubah email',
    judul: 'Permintaan ubah email',
    ringkasan: 'Permintaan yang menunggu persetujuan Anda. Email baru sudah diverifikasi pengguna.', // usulan
    tabel: 'Daftar permintaan ubah email',
    kolom: { pengguna: 'Pengguna', emailLama: 'Email lama', emailBaru: 'Email baru', diajukan: 'Diajukan', aksi: 'Aksi' },
    kosong: 'Tidak ada permintaan yang menunggu persetujuan.', // usulan
    setujui: 'Setujui',
    tolak: 'Tolak',
    setujuiJudul: 'Setujui perubahan email?',
    setujuiIsi: (nama: string, email: string) => `Email ${nama} akan berganti menjadi ${email}. Sesi lain pengguna dicabut.`, // FR-UDR-16 (copy usulan)
    tolakJudul: 'Tolak perubahan email?',
    alasan: 'Alasan penolakan',
    alasanHint: 'Alasan dikirim ke pengguna.', // FR-UDR-16
    alasanKosong: 'Alasan wajib diisi.',
    memproses: 'Memproses…',
    batal: 'Batal',
    disetujui: 'Perubahan email disetujui.', // usulan
    ditolak: 'Perubahan email ditolak.', // usulan
    domainBerubah: 'Email baru tidak lagi diizinkan untuk organisasi pengguna. Permintaan ditolak otomatis.', // EC-UDR-07 (copy usulan)
  },

  lainnyaMaks: 'Penjelasan maksimal 200 karakter.',
  lainnyaKosong: 'Penjelasan wajib diisi.',
  alasanKosong: 'Pilih alasan.', // usulan
  kendalaJudul: 'Terjadi kendala',
  kendalaIsi: 'Terjadi kendala. Silakan coba lagi.',
  tidakDiizinkan: 'Anda tidak berwenang melakukan aksi ini. Hubungi administrator organisasi Anda bila Anda merasa seharusnya berwenang.', // Tabel P-1 (FR-PA-20)
} as const;
