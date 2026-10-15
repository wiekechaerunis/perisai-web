/**
 * Teks Katalog Role (ClickUp z8pmx9n8p0) dan Aktif & Nonaktif Role (ClickUp z8pmx9n8p1). Kedua PRD "Design belum ada";
 * teks tanpa sumber PRD ditandai "usulan".
 */
export const roleCopy = {
  nav: 'Role',
  judul: 'Role',
  ringkasan: 'Daftar role baku yang berlaku sama di seluruh organisasi.', // usulan
  tabel: 'Daftar role',
  kolom: { kode: 'Kode', nama: 'Nama', jenis: 'Jenis organisasi', cakupan: 'Cakupan', status: 'Status', pengguna: 'Pengguna' },
  aktif: 'Aktif',
  tidakAktif: 'Tidak aktif',
  sistem: 'Role sistem', // FR-KR-09c (usulan label)
  memuat: 'Memuat…',
  gagal: 'Daftar role gagal dimuat.',
  panel: {
    tutup: 'Tutup panel',
    deskripsi: 'Deskripsi',
    jenis: 'Jenis organisasi',
    cakupan: 'Cakupan data bawaan',
    status: 'Status',
    pengguna: 'Pengguna',
    penggunaLink: (n: number) => `${n} pengguna`,
    hakAkses: 'Hak akses', // usulan
    hakAksesKet: 'Hak akses role berlaku untuk seluruh pengguna yang memakainya.', // FR-KR-09f (usulan)
    ubah: 'Ubah nama dan deskripsi', // FR-KR-08
    nonaktifkan: 'Nonaktifkan role',
    aktifkan: 'Aktifkan kembali',
    pindahkan: 'Pindahkan pengguna', // FR-AR-13
    tidakDapatNonaktif: 'Administrator Bisnis tidak dapat dinonaktifkan.', // FR-AR-03 (usulan)
    menu: 'Aksi role',
  },
  ubah: {
    judul: 'Ubah nama dan deskripsi', // usulan
    nama: 'Nama role',
    namaHint: 'Kode role tidak berubah.', // FR-KR-02
    deskripsi: 'Deskripsi',
    simpan: 'Simpan',
    batal: 'Batal',
    menyimpan: 'Menyimpan…',
    sukses: 'Role diperbarui.', // usulan
    namaSalah: 'Nama role harus 3–60 karakter.', // usulan
    namaDipakai: 'Nama ini sudah dipakai role lain.', // usulan
    deskripsiKosong: 'Deskripsi wajib diisi.', // usulan
  },
  nonaktifkan: {
    judul: (kode: string, nama: string) => `Nonaktifkan ${kode} ${nama}?`, // FR-AR-04 (usulan)
    peringatan: (n: number) => `${n} pengguna masih memakai role ini. Mereka tetap dapat mengaksesnya sampai role diganti.`, // FR-AR-04
    tanpaPengguna: 'Tidak ada pengguna yang memakai role ini.', // usulan
    lihatPengguna: 'Lihat pengguna', // FR-AR-05
    pilihan: 'Pengguna yang memakai role ini', // usulan
    pindah: 'Pindahkan ke role lain', // keputusan PM 14 Okt 2026
    lewati: 'Lewati, pengguna tetap memegang role ini', // keputusan PM 14 Okt 2026
    tujuan: 'Role tujuan',
    tujuanPlaceholder: 'Pilih role tujuan',
    tujuanKosong: 'Pilih role tujuan.', // usulan
    catatan: 'Role tidak lagi dapat dipilih di form undangan, ubah role, dan filter. Sesi pengguna tidak dicabut.', // FR-AR-06, -09 (usulan)
    tombol: 'Nonaktifkan role',
    memproses: 'Memproses…',
    batal: 'Batal',
    sukses: (kode: string) => `Role ${kode} dinonaktifkan.`, // usulan
    hasil: (dipindah: number, dilewati: number) => `${dipindah} pengguna dipindahkan, ${dilewati} dilewati.`, // FR-AR-16 (usulan)
  },
  aktifkan: {
    judul: (kode: string, nama: string) => `Aktifkan kembali ${kode} ${nama}?`, // usulan
    isi: 'Role langsung muncul lagi di seluruh pilihan role. Kewenangan dan cakupannya tidak berubah.', // FR-AR-10, -11 (usulan)
    sukses: (kode: string) => `Role ${kode} aktif kembali.`, // usulan
  },
  pindah: {
    judul: (kode: string) => `Pindahkan pengguna dari ${kode}`, // FR-AR-13 (usulan)
    pratinjau: (n: number, dari: string, ke: string) => `${n} pengguna dipindahkan dari ${dari} ke ${ke}. Hanya role ini yang diganti; role lain pengguna tidak berubah.`, // FR-AR-14, -15
    tombol: 'Pindahkan pengguna',
    aksesJudul: 'Perbedaan hak akses', // FR-AR-04a
    bertambah: 'Bertambah',
    berkurang: 'Berkurang',
    sama: 'Hak akses tidak berubah.',
    hasilJudul: 'Hasil pemindahan', // FR-AR-16 (usulan)
    dilewatiJudul: 'Dilewati',
  },
  penandaTidakAktif: '(Tidak aktif)', // FR-AR-20 (usulan)
  tutup: 'Tutup',
  buatRole: 'Buat role', // FR-KR-09 (usulan)
  buatan: 'Role buatan', // usulan
  izin: {
    legend: 'Hak akses', // FR-KR-09
    kolomModul: 'Modul',
    tidakTersedia: 'Tidak tersedia untuk jenis organisasi ini', // usulan (FR-KR-09b)
    hint: (jenis: string) => `Hanya modul dan aksi yang boleh untuk jenis organisasi ${jenis}.`, // FR-KR-09b (usulan)
    terpilih: (n: number) => `${n} hak akses dipilih`, // usulan
    minimal: 'Pilih minimal satu hak akses.', // FR-KR-09 (usulan)
    gagal: 'Role gagal disimpan. Silakan coba lagi.', // usulan
    buatJudul: 'Buat role', // usulan
    buatDeskripsi: 'Role baru langsung tersedia di pilihan role sesuai jenis organisasinya.', // FR-KR-09 (usulan)
    crumbRole: 'Role',
    kembaliKe: 'Kembali ke Role', // usulan
    infoJudul: 'Informasi role', // usulan
    batal: 'Batal',
    tinggalkanJudul: 'Tinggalkan halaman?', // usulan (pola FR-UDR-10)
    tinggalkanIsi: 'Role belum dibuat. Isian yang sudah Anda masukkan akan hilang.', // usulan
    tinggalkan: 'Tinggalkan',
    tetap: 'Tetap di halaman',
    jenisHint: 'Mengganti jenis organisasi mengosongkan hak akses yang sudah dipilih.', // usulan
    buat: 'Buat role',
    dibuat: (id: string) => `Role ${id} dibuat.`, // usulan
    ubah: 'Ubah hak akses', // FR-KR-09c (usulan)
    ubahJudul: 'Ubah hak akses', // usulan
    lanjut: 'Lanjutkan',
    konfirmasiJudul: (id: string, nama: string) => `Simpan hak akses ${id} ${nama}?`, // usulan
    konfirmasiIsi: (n: number) => `Perubahan berlaku untuk ${n} pengguna yang memakai role ini pada permintaan berikutnya. Sesi mereka tidak dicabut.`, // FR-KR-09f
    simpan: 'Simpan hak akses',
    diubah: (id: string) => `Hak akses ${id} diperbarui.`, // usulan
    hapus: 'Hapus role',
    hapusJudul: (id: string, nama: string) => `Hapus ${id} ${nama}?`, // usulan
    hapusIsi: 'Role ini tidak dipakai pengguna mana pun dan akan dihapus dari katalog.', // usulan
    masihDipakai: (n: number) => `Role ini masih dipakai ${n} pengguna dan tidak dapat dihapus. Nonaktifkan role bila tidak ingin dipakai lagi.`, // FR-KR-09d
    dihapus: (id: string) => `Role ${id} dihapus.`, // usulan
  },
} as const;
