/**
 * Teks alur autentikasi. Pesan validasi/error disalin PERSIS dari PRD (perilaku & validasi ikut PRD).
 * Label/judul/tombol memakai sentence case DS (K-3). Ketidakseragaman "Password" vs "Kata sandi"
 * dalam pesan PRD dibiarkan apa adanya dan dicatat (K-4).
 */

/** Bersama: field password baru (Aktivasi V-2, Lupa FR-LP-12, Ubah U-1). */
export const passwordCopy = {
  reveal: { show: 'Tampilkan kata sandi', hide: 'Sembunyikan kata sandi' },
  kekuatan: 'Kekuatan kata sandi',
  syarat: 'Syarat kata sandi',
  syaratStatus: { met: 'terpenuhi', unmet: 'belum terpenuhi' },
} as const;

/** Bingkai layar publik (Figma 85:4794, 66:2547). */
export const authFrameCopy = {
  logoAlt: 'PERISAI',
  butuhBantuan: 'Butuh Bantuan?',
  hubungiSupport: 'Hubungi Support',
  // Figma 85:4825 (bahasa Inggris; F-07)
  hakCipta: '© 2026 SKK Migas. Hak cipta dilindungi.',
} as const;

/** Panel hero Login (Figma 85:4830, 85:4851). Teks disalin dari Figma; lihat F-07, F-08. */
export const loginHeroCopy = {
  judul: ['Hulu Migas yang Lebih Aman,', 'Berbasis Data'],
  pendukung:
    'PERISAI mendukung pengelolaan keamanan Hulu Migas melalui integrasi data, pemantauan risiko, dan pengambilan keputusan yang lebih cepat.',
  kapabilitas: [
    ['Risk & Incident', 'Management'],
    ['Analytical', 'Dashboard'],
    ['Early Warning', '& Decision Support'],
  ],
  // Figma: "YANG LEBIH AMANA" — salah ketik, ditulis "AMAN" (F-08)
  tagline: ['Energi', 'untuk Indonesia', 'yang lebih aman'],
} as const;

/** PRD Login PERISAI (tab 7b7a3b46-65b2) + Figma 85:4794. */
export const loginCopy = {
  judul: 'Masuk ke PERISAI',
  deskripsi:
    'Platform digitalisasi sekuriti Hulu Migas untuk pengelolaan risiko, insiden dan operasi yang lebih aman dan terintegrasi.',
  email: 'Email',
  emailPlaceholder: 'Masukkan email Anda',
  sandi: 'Kata sandi',
  sandiPlaceholder: 'Masukkan kata sandi Anda',
  lupa: 'Lupa kata sandi?', // FR-LP-01
  masuk: 'Masuk',
  memproses: 'Memproses…',
  // Tabel E-1 (field, sumber browser)
  emailKosong: 'Email wajib diisi.',
  emailFormat: 'Masukkan alamat email yang valid.',
  sandiKosong: 'Password wajib diisi.',
  // Tabel E-1 (alert di atas form, sumber server)
  alert: {
    INVALID_CREDENTIALS: { judul: 'Kredensial tidak valid', isi: 'Email atau password yang Anda masukkan salah.' },
    ACCOUNT_DEACTIVATED: { judul: 'Akun dinonaktifkan', isi: 'Akun Anda sedang dinonaktifkan. Hubungi Support untuk bantuan.' },
    ACCOUNT_SUSPENDED: {
      judul: 'Akun ditangguhkan',
      isi: 'Akses akun Anda ditangguhkan sementara. Hubungi admin organisasi Anda untuk informasi lebih lanjut.',
    },
    ORG_INACTIVE: {
      judul: 'Organisasi tidak aktif',
      isi: 'Organisasi Anda tidak lagi aktif di PERISAI. Hubungi SKK Migas bila menurut Anda ini keliru.',
    },
    IP_NOT_ALLOWED: {
      judul: 'Akses dari lokasi ini tidak diizinkan',
      isi: 'Organisasi Anda membatasi akses ke jaringan tertentu. Hubungi admin organisasi Anda.',
    },
    RATE_LIMITED: { judul: 'Login dibatasi sementara', isi: 'Terlalu banyak percobaan login. Coba lagi dalam 30 menit.' },
    NETWORK: { judul: 'Terjadi kendala', isi: 'Terjadi kendala. Silakan coba lagi.' },
    // Tabel E-2: batas salah input OTP → kembali ke Login
    OTP_LOCKED: { judul: 'Verifikasi gagal', isi: 'Terlalu banyak kode salah. Silakan masuk kembali.' },
    // FR-LG-14: batas kirim ulang → kembali ke Login. Copy USULAN (PRD tidak menetapkan).
    OTP_RESEND_LIMIT: { judul: 'Batas kirim ulang tercapai', isi: 'Silakan masuk kembali untuk meminta kode baru.' },
  },
  /** Kata "Hubungi Support" di dalam pesan dijadikan tautan (Figma 85:4916). */
  tautanSupport: 'Hubungi Support',
} as const;

export type LoginAlertCode = keyof typeof loginCopy.alert;

/** Verifikasi OTP — PRD Login §4.4 + Tabel E-2; Aktivasi §4.3. Figma 118:235 (login) dan 116:144 (aktivasi). */
export const otpCopy = {
  label: 'Kode verifikasi',
  login: {
    judul: 'Masukkan kode verifikasi',
    // Figma: "Kode berlaku 30 menit." → PRD FR-LG-12: 10 menit (F-03)
    isi: (email: string, menit: number) => `Kami mengirim kode 6 digit ke ${email}. Kode berlaku ${menit} menit.`,
    tombol: 'Verifikasi', // FR-LG-17
    kembali: 'Kembali ke halaman masuk', // FR-LG-19 (tidak ada di Figma; F-04)
  },
  aktivasi: {
    judul: 'Verifikasi email Anda',
    isi: (email: string, menit: number) =>
      `Masukkan kode 6 digit yang kami kirim ke ${email} untuk menyelesaikan aktivasi akun. Kode berlaku ${menit} menit.`,
    tombol: 'Aktifkan akun', // FR-AK-10
    kembali: 'Kembali ke buat password', // usulan (FR-AK-15)
  },
  memproses: 'Memverifikasi…',
  belumMenerima: 'Belum menerima kode?',
  kirimUlang: 'Kirim ulang kode',
  kirimUlangDalam: 'Kirim ulang dalam {waktu}',
  terkirimUlang: 'Kode baru telah dikirim.', // usulan
  // Tabel E-2
  kosong: 'Kode verifikasi wajib diisi.',
  kurang: 'Masukkan 6 digit kode verifikasi.',
  salah: (n: number) => `Kode verifikasi salah. Sisa percobaan: ${n}.`,
  kedaluwarsa: 'Kode sudah tidak berlaku. Kirim ulang untuk mendapatkan kode baru.',
  gagalKirimJudul: 'Terjadi kendala',
  gagalKirimIsi: 'Kode gagal dikirim. Silakan coba lagi.',
  kendalaJudul: 'Terjadi kendala',
  kendalaIsi: 'Terjadi kendala. Silakan coba lagi.',
} as const;

/** PRD Aktivasi Akun (tab e34d9005-d913) + Figma 66:2602, 66:2546, 66:2569, 66:2582. */
export const aktivasiCopy = {
  judul: 'Buat password', // Figma "Buat Password" → sentence case (K-3)
  // Figma: "Silahkan buat password baru {email} untuk login ke aplikasi PERISAI" → "Silakan" (baku, F-09)
  deskripsi: (email: string) => ({ before: 'Silakan buat password baru ', email, after: ' untuk login ke aplikasi PERISAI' }),
  baru: 'Password baru',
  konfirmasi: 'Konfirmasi password baru',
  placeholder: 'Min. 8 karakter',
  simpan: 'Simpan password baru', // T-1 CTA "Simpan Password Baru" (K-3)
  menyimpan: 'Menyimpan…',
  // Tabel V-2
  baruKosong: 'Password baru wajib diisi.',
  kurangDari8: 'Password minimal 8 karakter.',
  konfirmasiKosong: 'Konfirmasi password wajib diisi.',
  konfirmasiTidakCocok: 'Konfirmasi password tidak cocok.',
  terlaluUmum: 'Password ini terlalu umum. Gunakan kombinasi lain.', // FR-AK-06
  // FR-AK-12
  otpTerkunci: 'Terlalu banyak percobaan. Silakan buat password dan minta kode baru.',
  // FR-AK-14
  sukses: 'Akun berhasil diaktifkan.',
  // Tabel T-1 (copy PRD; Figma 66:2556 berbeda untuk "tidak valid", F-10)
  tidakValidJudul: 'Tautan tidak valid',
  tidakValidIsi: 'Tautan ini tidak dapat digunakan. Hubungi admin organisasi Anda untuk mendapatkan undangan baru.',
  sudahAktifJudul: 'Akun sudah aktif',
  sudahAktifIsi: 'Undangan ini sudah dipakai untuk mengaktifkan akun.',
  masuk: 'Masuk ke PERISAI',
  kedaluwarsaJudul: 'Undangan tidak berlaku lagi',
  kedaluwarsaIsi: [
    'Masa berlaku undangan ini sudah habis.',
    'Kami dapat memberi tahu admin organisasi Anda untuk mengirim undangan baru.',
  ],
  mintaUndangan: 'Minta undangan baru',
  mengirim: 'Mengirim…',
  // FR-AK-16
  mintaTerkirim: 'Permintaan terkirim. Admin organisasi Anda sudah diberi tahu. Undangan baru akan dikirim ke email Anda.',
  kendalaJudul: 'Terjadi kendala',
  kendalaIsi: 'Terjadi kendala. Silakan coba lagi.',
} as const;

/** PRD Lupa Kata Sandi (tab f014a7ff-c6e8). */
export const lupaCopy = {
  judul: 'Lupa kata sandi',
  keterangan: 'Masukkan email akun PERISAI Anda. Kami akan mengirim tautan untuk mengatur ulang kata sandi.', // usulan
  email: 'Email',
  emailHint: 'Contoh: nama@perusahaan.co.id',
  kirim: 'Kirim tautan', // FR-LP-01
  mengirim: 'Mengirim…',
  kembali: 'Kembali ke halaman masuk', // FR-LP-06
  // FR-LP-02 (pesan seragam)
  terkirimJudul: 'Periksa email Anda', // usulan
  terkirim:
    'Jika email tersebut terdaftar, kami telah mengirim tautan untuk mengatur ulang kata sandi. Periksa kotak masuk Anda.',
  // Tabel L-2
  emailKosong: 'Email wajib diisi.',
  emailFormat: 'Masukkan alamat email yang valid.',
  kendalaJudul: 'Terjadi kendala',
  kendalaIsi: 'Terjadi kendala. Silakan coba lagi.',
} as const;

/** PRD Lupa Kata Sandi §4.3 dan Tabel L-3. */
export const aturUlangCopy = {
  judul: 'Atur ulang kata sandi',
  keterangan: 'Buat kata sandi baru untuk akun Anda.', // usulan
  baru: 'Kata sandi baru',
  konfirmasi: 'Konfirmasi kata sandi baru',
  simpan: 'Simpan kata sandi baru',
  menyimpan: 'Menyimpan…',
  // Pesan validasi: Tabel V-2 PRD Aktivasi (FR-LP-12)
  baruKosong: 'Password baru wajib diisi.',
  konfirmasiKosong: 'Konfirmasi password wajib diisi.',
  konfirmasiTidakCocok: 'Konfirmasi password tidak cocok.',
  terlaluUmum: 'Password ini terlalu umum. Gunakan kombinasi lain.',
  // FR-LP-13 (copy usulan PRD)
  samaDenganLama: 'Kata sandi baru harus berbeda dari kata sandi sebelumnya.',
  // Tabel L-3
  tidakValidJudul: 'Tautan tidak valid',
  tidakValidIsi: 'Tautan ini tidak dapat digunakan. Periksa email terbaru Anda, atau minta tautan baru.',
  dipakaiJudul: 'Tautan sudah digunakan',
  dipakaiIsi: 'Kata sandi Anda sudah diubah dengan tautan ini.',
  kedaluwarsaJudul: 'Tautan tidak berlaku lagi',
  kedaluwarsaIsi: 'Masa berlaku tautan sudah habis.',
  mintaBaru: 'Minta tautan baru',
  masuk: 'Masuk ke PERISAI',
  // FR-LP-14
  sukses: 'Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru Anda.',
  kendalaJudul: 'Terjadi kendala',
  kendalaIsi: 'Terjadi kendala. Silakan coba lagi.',
} as const;

/** Validasi email bersama (Tabel E-1 / L-2). */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
