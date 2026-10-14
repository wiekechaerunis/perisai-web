/**
 * Teks antarmuka bersama (Bahasa Indonesia baku, sentence case, sapaan "Anda").
 * NFR-07 BRD meminta antarmuka Indonesia dan Inggris; prototype baru menyediakan bahasa Indonesia.
 * Teks khusus fitur (termasuk pesan validasi PRD yang disalin persis) ada di features/<fitur>/copy.ts.
 */
export const t = {
  app: {
    nama: 'PERISAI',
    lompatKeKonten: 'Lompat ke konten',
    navUtama: 'Navigasi utama',
    memuat: 'Memuat…',
    tutup: 'Tutup',
    notifikasi: 'Notifikasi',
  },
  nav: {
    ikhtisar: 'Ikhtisar',
    administrasi: 'Administrasi',
    pengguna: 'Pengguna',
    permintaanEmail: 'Permintaan ubah email',
    organisasi: 'Organisasi',
    role: 'Role',
    logAkses: 'Log Akses',
    jejakAudit: 'Jejak Audit',
  },
  akun: {
    menu: 'Menu akun',
    akunSaya: 'Akun Saya',
    keluar: 'Keluar',
    // Figma 66:3207 (bahasa Inggris; F-07)
    hakCipta: '© 2026 SKK Migas. All rights reserved.',
  },
  galat: {
    tidakDitemukanJudul: 'Halaman tidak ditemukan',
    tidakDitemukanIsi: 'Halaman atau data yang Anda cari tidak tersedia.',
    tidakBerwenangJudul: 'Anda tidak memiliki akses',
    tidakBerwenangIsi: (modul: string) =>
      `Anda tidak berwenang membuka ${modul}. Hubungi administrator organisasi Anda bila Anda merasa seharusnya berwenang.`,
    kembaliKeRuangKerja: 'Kembali ke Ikhtisar',
  },
} as const;

/**
 * Kanal "Hubungi Support" — FR-LG-08 masih [TBD: email/URL helpdesk].
 * ASSUMPTION: placeholder sampai kanal ditetapkan.
 */
export const SUPPORT_URL = 'mailto:support@perisai.example';
