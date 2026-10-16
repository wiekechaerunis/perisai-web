export const workspaceCopy = {
  judul: 'Ruang kerja',
  ringkasan: (nama: string) => `Selamat datang, ${nama}. Modul bisnis akan tampil di sini sesuai role Anda.`,
  aksesAnda: 'Akses Anda',
  aksesKeterangan: 'Menu dan data dibatasi oleh role dan cakupan data Anda.',
  role: 'Role',
  organisasi: 'Organisasi',
  cakupan: 'Cakupan data',
  loginTerakhir: 'Login terakhir',
} as const;
