/**
 * Teks antarmuka bersama (Bahasa Indonesia baku, sentence case, sapaan "Anda").
 * NFR-07 BRD meminta antarmuka Indonesia dan Inggris; prototype baru menyediakan bahasa Indonesia.
 * Teks khusus fitur (termasuk pesan validasi PRD yang disalin persis) ada di features/<fitur>/copy.ts.
 */
export const t = {
  /** Pola filter tabel DS v2 (FilterPanel, AppliedFilters). */
  filter: {
    trigger: 'Filter',
    title: 'Filter',
    close: 'Tutup filter',
    reset: 'Atur ulang',
    terapkan: 'Terapkan',
    terapkanJumlah: (n: number, entitas: string) => `Terapkan · ${n} ${entitas}`,
    region: 'Filter aktif',
    clear: 'Hapus filter',
    remove: (label: string, value: string) => `Hapus filter ${label}: ${value}`,
    more: (n: number) => `+${n} filter lainnya`,
    semua: 'Semua',
  },
  app: {
    nama: 'PERISAI',
    lompatKeKonten: 'Lompat ke konten',
    navUtama: 'Navigasi utama',
    perkecilSidebar: 'Perkecil sidebar', // DS v2 Sidebar
    perlebarSidebar: 'Perlebar sidebar',
    memuat: 'Memuat…',
    tutup: 'Tutup',
    notifikasi: 'Notifikasi',
  },
  nav: {
    menu: 'Menu',
    ikhtisar: 'Ikhtisar',
    administrasi: 'Administrasi',
    pengguna: 'Pengguna',
    permintaanEmail: 'Permintaan ubah email',
    organisasi: 'Organisasi',
    role: 'Role',
    logAkses: 'Log akses',
    jejakAudit: 'Jejak audit',
  },
  akun: {
    menu: 'Menu akun',
    akunSaya: 'Akun saya',
    keluar: 'Keluar',
    // Figma 66:3207 (bahasa Inggris; F-07)
    hakCipta: '© 2026 SKK Migas. Hak cipta dilindungi.',
  },
  galat: {
    tidakDitemukanJudul: 'Halaman tidak ditemukan',
    tidakDitemukanIsi: 'Halaman atau data yang Anda cari tidak tersedia.',
    tidakBerwenangJudul: 'Anda tidak memiliki akses',
    tidakBerwenangIsi: (modul: string) =>
      `Anda tidak berwenang membuka ${modul}. Hubungi admin organisasi Anda bila Anda merasa seharusnya berwenang.`,
    kembaliKeRuangKerja: 'Kembali ke Ikhtisar',
  },
} as const;

/**
 * Kanal "Hubungi Support" — FR-LG-08 masih [TBD: email/URL helpdesk].
 * ASSUMPTION: placeholder sampai kanal ditetapkan.
 */
export const SUPPORT_URL = 'mailto:support@perisai.example';
