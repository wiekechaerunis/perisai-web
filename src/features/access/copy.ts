/** Teks hak akses efektif, cakupan, dan penegakan hak akses (PRD Hak Akses Efektif, Cakupan Data, Penegakan Hak Akses). */
export const accessCopy = {
  judul: 'Hak akses efektif',
  keterangan: 'Gabungan izin dari seluruh role pengguna beserta cakupan datanya. Hanya modul yang sudah tersedia yang ditampilkan.', // FR-HE-14a (copy usulan)
  cakupanJudul: 'Cakupan data',
  kolom: { modul: 'Modul', izin: 'Izin', deskripsi: 'Deskripsi' }, // Figma 109:16307 ("Permission" → "Izin", bahasa baku)
  izinEfektif: (n: number) => `Izin efektif (${n})`, // Figma 109:16307
  berasalDari: (roles: string) => `Berasal dari role ${roles}. Izin diatur di menu Role.`, // Figma 109:16307
  dari: (roles: string) => `dari ${roles}`, // FR-HE-15
  kosong: 'Tidak ada hak akses. Akun tidak aktif atau belum punya role.', // FR-HE-07 (copy usulan)
  memuat: 'Memuat…',
  gagal: 'Hak akses gagal dimuat. Muat ulang halaman untuk mencoba lagi.',
  wkNonaktif: (wk: string) => `Wilayah kerja ${wk} sudah dinonaktifkan di data induk. Tinjau cakupan pengguna ini.`, // FR-CD-13 (copy usulan)
  // FR-PA-18a
  hakBerubah: 'Hak akses Anda telah diperbarui oleh administrator.',
  // Tabel P-1 (alert aksi di dalam halaman, FR-PA-20)
  ditolakJudul: 'Anda tidak memiliki akses',
  ditolakIsi: 'Anda tidak berwenang melakukan aksi ini. Hubungi administrator organisasi Anda bila Anda merasa seharusnya berwenang.',
  sodJudul: 'Tidak dapat diproses',
} as const;
