/**
 * Teks Akun Saya — PRD tab 4063d15e-cbad (FR-AS-001..011) + Figma 341:6300 (Profil), 341:6507 (Keamanan masuk).
 * Status permintaan email: Tabel S-UDR; pesan galat: Tabel E-UDR (PRD Ubah Data & Role Pengguna, ClickUp z8pmx9n8ny),
 * ditulis dengan sapaan "Anda" (keputusan PM 14 Okt 2026).
 */
export const akunSayaCopy = {
  judul: 'Akun saya',
  ringkasan: 'Kelola profil dan keamanan akses Anda ke PERISAI.', // Figma 341:6300
  tabLabel: 'Bagian akun saya',
  tabProfil: 'Profil',
  tabKeamanan: 'Keamanan masuk', // Figma 341:6507 (Akun Saya PRD menyebut "Keamanan Akun", PR-01 / F-36)

  profil: {
    judul: 'Informasi profil',
    keterangan: 'Informasi organisasi dan akses dikelola oleh admin.', // Figma
    nama: 'Nama lengkap',
    namaHint: '3–150 karakter.', // FR-AS-003 (Figma: 3–100, F-31)
    namaKosong: 'Nama wajib diisi.', // Tabel E-UDR
    namaPanjang: 'Nama harus 3–150 karakter.', // Tabel E-UDR
    jabatan: 'Jabatan',
    jabatanHint: 'Maksimal 100 karakter. Tidak memengaruhi akses.', // FR-AS-003
    jabatanPanjang: 'Jabatan maksimal 100 karakter.',
    email: 'Email',
    ubahEmail: 'Ubah',
    username: 'Username',
    organisasi: 'Organisasi',
    roleJudul: 'Role dan cakupan akses', // Figma
    role: 'Role',
    // Tooltip Role PRD memakai "Kamu … akunmu" (F-32); ditulis dengan sapaan "Anda" (DS).
    roleTooltip: 'Anda tidak dapat mengubah role akun Anda sendiri.',
    cakupan: 'Cakupan akses',
    masaBerlaku: 'Masa berlaku akses',
    berlakuSampai: (v: string) => `Berlaku sampai ${v}`,
    tanpaBatas: 'Tidak dibatasi waktu',
    status: 'Status akun',
    simpan: 'Simpan',
    menyimpan: 'Menyimpan…',
    batal: 'Batal',
    sukses: 'Profil berhasil diperbarui.', // FR-AS-005 (copy usulan)
    catatan: 'Perlu memperbarui role atau cakupan akses? Hubungi admin organisasi Anda.', // Figma (tanpa "jabatan": FR-AS-003)
    tinggalkanJudul: 'Tinggalkan halaman?', // FR-AS-006 (copy usulan)
    tinggalkanIsi: 'Perubahan yang belum disimpan akan hilang.',
    tinggalkan: 'Tinggalkan',
    tetap: 'Tetap di sini',
  },

  email: {
    // FR-AS-009, -010 (copy usulan kecuali status)
    judul: 'Ubah email',
    langkahSandi: 'Untuk melindungi akun, masukkan kata sandi sebelum melanjutkan.', // Figma 341:6735
    sandi: 'Kata sandi',
    sandiPlaceholder: 'Masukkan kata sandi',
    sandiKosong: 'Kata sandi wajib diisi.',
    sandiSalah: 'Kata sandi salah.', // Tabel E-UDR
    langkahEmail: 'Masukkan email baru. Kami akan mengirim kode verifikasi ke email tersebut.',
    emailBaru: 'Email baru',
    langkahKode: (email: string) => `Masukkan 6 digit kode yang kami kirim ke ${email}.`,
    kode: 'Kode verifikasi',
    lanjutkan: 'Lanjutkan',
    kirimKode: 'Kirim kode',
    verifikasi: 'Verifikasi',
    batal: 'Batal',
    memproses: 'Memproses…',
    kirimUlang: 'Kirim ulang kode',
    batalkanPermintaan: 'Batalkan permintaan',
    menungguPersetujuan: 'Email baru menunggu persetujuan admin organisasi Anda.',
    langsungBerlaku: 'Email berhasil diubah.',
    statusLabel: (status: string, email: string) => `${status}: ${email}`,
    kodeTerkirim: 'Kode baru telah dikirim.',
    ditolak: 'Permintaan ubah email ditolak.',
    alasanDitolak: (alasan: string) => `Alasan: ${alasan}`, // FR-AS-010
    tutup: 'Tutup',
    diajukan: (v: string) => `diajukan ${v}`, // FR-AS-010
    sedangDiproses: 'Anda masih punya permintaan ubah email yang belum selesai. Batalkan dulu untuk mengajukan yang baru.', // Tabel E-UDR
    emailSama: 'Email ini sudah menjadi email akun Anda.', // Tabel E-UDR
    batasPermintaan: 'Permintaan kode sudah mencapai batas 10 kali per jam. Coba lagi nanti.', // FR-UDR-12 (copy usulan)
    kodeSalah: 'Kode tidak cocok. Periksa lagi email baru Anda.', // Tabel E-UDR
    kodeKedaluwarsa: 'Kode sudah kedaluwarsa. Kirim ulang kode.', // Tabel E-UDR
    // Tabel V-1 Undang Pengguna dipakai ulang untuk validasi email
    emailKosong: 'Email wajib diisi.',
    emailFormat: 'Masukkan alamat email lengkap, contoh: nama@perusahaan.co.id.', // Tabel E-UDR
    emailPribadi: 'Email pribadi tidak dapat digunakan. Gunakan email kantor.',
    emailDomain: 'Email ini belum diizinkan untuk organisasi Anda. Hubungi Admin SKK.', // Tabel E-UDR
    emailDipakai: 'Email ini sudah terdaftar di akun lain.', // Tabel E-UDR
  },

  keamanan: {
    sandiJudul: 'Kata sandi',
    sandiDiubah: (v: string) => `Terakhir diubah ${v}`,
    sandiBelum: 'Belum pernah diubah sejak aktivasi.', // usulan
    ubahSandi: 'Ubah kata sandi',
    // FR-LA-15a..c: riwayat masuk sendiri (tanpa alamat IP)
    riwayatJudul: 'Riwayat masuk',
    riwayatKeterangan: 'Aktivitas masuk ke akun Anda dalam 30 hari terakhir (minimal 20 aktivitas terakhir).', // usulan (FR-LA-15a)
    riwayatKosong: 'Belum ada aktivitas masuk.', // usulan
    riwayatGagal: 'Riwayat masuk gagal dimuat. Muat ulang halaman untuk mencoba lagi.',
    tidakMengenali: 'Tidak mengenali aktivitas ini? Ubah kata sandi Anda dan hubungi admin organisasi Anda.', // FR-LA-15c
    kolom: { waktu: 'Waktu', peristiwa: 'Peristiwa', hasil: 'Hasil', perangkat: 'Perangkat', lokasi: 'Perkiraan lokasi' },
    // Figma 341:6507 "Metode verifikasi masuk". Autentikator & passkey menunggu PRD Verifikasi Dua Langkah (KD-02, F-36).
    metode: {
      judul: 'Metode verifikasi masuk', // Figma
      keterangan:
        'Aplikasi autentikator dan passkey membantu menjaga akun Anda walaupun email dan kata sandi bocor. Tambahkan metode kuat untuk perlindungan lebih baik.', // Figma
      emailJudul: 'Kode email', // Figma
      emailIsi: (email: string) => `Kode dikirim ke ${email}. Metode dasar dan jalur pemulihan; tidak dapat dihapus.`, // Figma
      aktif: 'Aktif',
      autentikatorJudul: 'Aplikasi autentikator', // Figma
      autentikatorIsi: 'Gunakan Google Authenticator, Microsoft Authenticator, atau aplikasi sejenis untuk membuat kode verifikasi.', // Figma
      belumDiatur: 'Belum diatur', // Figma
      atur: 'Atur', // Figma
      passkeyJudul: 'Passkey', // Figma
      passkeyIsi: 'Masuk dengan sidik jari, wajah, PIN perangkat, atau kunci keamanan. Data biometrik tetap di perangkat Anda.', // Figma
      passkeyJumlah: (n: number, maks: number) => `${n} / ${maks}`, // Figma
      passkeyKosong: 'Belum ada passkey tersimpan.', // usulan
      tambahPasskey: 'Tambah passkey', // Figma
      belumTersedia: 'Pengaturan aplikasi autentikator dan passkey belum tersedia.', // usulan (KD-02)
    },
    catatan: 'Jangan bagikan kode verifikasi kepada siapa pun, termasuk pihak yang mengaku sebagai admin PERISAI.', // Figma
  },
} as const;
