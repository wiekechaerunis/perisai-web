/**
 * Teks halaman tautan email (PRD Ubah Data & Role Pengguna, FR-UDR-05, -13, -14). PRD tidak memberi copy untuk
 * halaman ini: semua "usulan", mengikuti nada halaman tautan Aktivasi/Atur Ulang.
 */
export const emailLinkCopy = {
  memuat: 'Memuat…',
  memproses: 'Memproses…',
  masuk: 'Masuk ke PERISAI',
  tidakValidJudul: 'Tautan tidak valid',
  tidakValidIsi: 'Tautan ini tidak dikenali atau sudah digantikan perubahan lain. Hubungi administrator organisasi Anda.',
  dipakaiJudul: 'Tautan sudah digunakan',
  dipakaiIsi: 'Tautan ini sudah digunakan sebelumnya.',
  gagalJudul: 'Terjadi kendala',
  gagalIsi: 'Permintaan belum dapat diproses. Silakan coba lagi.',
  // FR-UDR-05
  verifikasiJudul: 'Verifikasi email baru',
  verifikasiIsi: (email: string) =>
    `Administrator mengubah email akun PERISAI Anda menjadi ${email}. Setelah diverifikasi, email ini dipakai untuk masuk dan seluruh sesi Anda berakhir.`,
  verifikasi: 'Verifikasi email',
  verifikasiSukses: 'Email baru sudah berlaku. Silakan masuk dengan email baru Anda.',
  // FR-UDR-13, -14
  bukanSayaJudul: 'Bukan Anda yang meminta perubahan email?',
  bukanSayaIsi: 'Kami akan membatalkan permintaan perubahan email dan mengakhiri seluruh sesi akun Anda. Setelah itu, ubah kata sandi Anda.',
  bukanSayaAksi: 'Batalkan dan akhiri semua sesi',
  bukanSayaSukses: 'Permintaan perubahan email dibatalkan dan seluruh sesi diakhiri. Segera ubah kata sandi Anda.',
} as const;
