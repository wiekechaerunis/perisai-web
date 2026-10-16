/**
 * RBAC PERISAI: katalog role (BRD v0.5 §6.2), daftar modul (BRD §7.1), dan
 * Matriks Role × Modul × Aksi (PRD Core Platform, tab e8b6fd5d-016a, FR-MX-01..12) sebagai DATA (FR-MX-08).
 * Default deny (FR-MX-12): yang tidak tertulis di matriks = tidak boleh.
 * Hak akses efektif = role × cakupan data × permission (BRD 6.2); cakupan ditegakkan di backend.
 */

/* ---------- Role (hanya katalog BRD 6.2; PR-05) ---------- */

export const ROLE_IDS = ['R-01', 'R-02', 'R-03', 'R-04', 'R-05', 'R-06', 'R-07'] as const;
/** Role sistem (BRD 6.2; FR-KR-09c: tidak dapat dihapus). */
export type SystemRoleId = (typeof ROLE_IDS)[number];
/** Kode role: role sistem R-01..R-07 atau role buatan R-08 dst. (PRD Katalog Role FR-KR-09). */
export type RoleId = `R-${string}`;

export type OrgType = 'SKK Migas' | 'KKKS' | 'Kontraktor';

/** Cakupan data bawaan (Tabel R-2, FR-KR-04). */
export type CakupanBawaan = 'Seluruh organisasi' | 'Organisasi sendiri' | 'Wilayah kerja tertentu' | 'Tidak ada akses data bisnis';

export interface RoleDef {
  id: RoleId;
  name: string;
  orgType: OrgType;
  /** Cakupan data menurut BRD 6.2 (teks; penegakan di backend, FR-MX-03). */
  scope: string;
  /** Role buatan: cakupan bawaan yang dipilih saat dibuat. */
  cakupan?: CakupanBawaan;
}

/**
 * Peta label role per ID (BRD 6.2, nama baru 15 Okt 2026). Satu-satunya sumber label role di UI (lewat `roleName`).
 * TODO (NFR-07): isi label bahasa Inggris setelah glosarium EN disahkan.
 */
export const ROLE_LABELS_EN: Partial<Record<SystemRoleId, string>> = {};

export const ROLES: Record<string, RoleDef> = {
  'R-01': { id: 'R-01', name: 'Pimpinan SKK', orgType: 'SKK Migas', scope: 'Seluruh KKKS atau wilayah yang ditetapkan' },
  'R-02': { id: 'R-02', name: 'Pengawas SKK', orgType: 'SKK Migas', scope: 'Seluruh KKKS atau KKKS/wilayah yang ditugaskan' },
  'R-03': { id: 'R-03', name: 'Admin SKK', orgType: 'SKK Migas', scope: 'Administrasi seluruh organisasi' },
  'R-04': { id: 'R-04', name: 'Admin KKKS', orgType: 'KKKS', scope: 'Organisasi sendiri' },
  'R-05': { id: 'R-05', name: 'Pelapor KKKS', orgType: 'KKKS', scope: 'Organisasi sendiri atau wilayah kerja yang diberikan' },
  'R-06': { id: 'R-06', name: 'Pejabat Berwenang KKKS', orgType: 'KKKS', scope: 'Organisasi sendiri' },
  'R-07': { id: 'R-07', name: 'Admin Teknis', orgType: 'Kontraktor', scope: 'Konfigurasi dan log teknis' },
};

/** Urutan role di katalog (sistem lalu buatan). */
let roleOrder: RoleId[] = [...ROLE_IDS];

/** Definisi role; kode yang tidak dikenal tampil apa adanya (data lama / role terhapus). */
export function roleDef(id: RoleId): RoleDef {
  return ROLES[id] ?? { id, name: id, orgType: 'KKKS', scope: '—' };
}

export function roleName(id: RoleId): string {
  return roleDef(id).name;
}

export function isSystemRole(id: RoleId): id is SystemRoleId {
  return (ROLE_IDS as readonly string[]).includes(id);
}

/** Seluruh role di katalog, urut kode. */
export function allRoleIds(): RoleId[] {
  return roleOrder;
}

/** Daftarkan / perbarui role dari katalog (FR-KR-03: satu sumber). */
export function registerRoles(defs: RoleDef[]): void {
  for (const d of defs) ROLES[d.id] = { ...ROLES[d.id], ...d };
  roleOrder = [...new Set([...ROLE_IDS, ...defs.map((d) => d.id)])].filter((id) => !!ROLES[id]).sort();
}

export function unregisterRole(id: RoleId): void {
  if (isSystemRole(id)) return;
  delete ROLES[id];
  roleOrder = roleOrder.filter((r) => r !== id);
  for (const m of Object.keys(MATRIX) as ModuleId[]) delete MATRIX[m][id];
}

/* ---------- Aksi (Tabel X-1, FR-MX-01) ---------- */

export const ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'export',
  'submit',
  'verify',
  'approve',
  'sign',
  'upload_signed',
  'close',
  'manage',
] as const;
export type Action = (typeof ACTIONS)[number];

export const ACTION_LABEL: Record<Action, string> = {
  view: 'Lihat',
  create: 'Buat',
  edit: 'Ubah',
  delete: 'Hapus',
  export: 'Ekspor',
  submit: 'Kirim',
  verify: 'Verifikasi',
  approve: 'Setujui',
  sign: 'Tanda tangan',
  upload_signed: 'Unggah dokumen bertanda tangan',
  close: 'Tutup',
  manage: 'Kelola',
};

/** Deskripsi aksi untuk tabel izin efektif (PRD Profil Pengguna, Figma 109:16307). Copy usulan; label dari Tabel X-1. */
export const ACTION_DESC: Record<Action, string> = {
  view: 'Melihat data modul',
  create: 'Membuat data baru',
  edit: 'Mengubah data',
  delete: 'Menghapus data',
  export: 'Mengekspor data',
  submit: 'Mengirim untuk diproses',
  verify: 'Memverifikasi data',
  approve: 'Menyetujui',
  sign: 'Menandatangani dokumen',
  upload_signed: 'Mengunggah dokumen bertanda tangan',
  close: 'Menutup',
  manage: 'Mengelola modul, termasuk konfigurasinya',
};

/* ---------- Modul (BRD §7.1) ---------- */

export const MODULE_IDS = [
  'M-01', 'M-02', 'M-03', 'M-04', 'M-05', 'M-06', 'M-07', 'M-08', 'M-09', 'M-10', 'M-11', 'M-12', 'M-13',
  'M-14', 'M-15', 'M-16', 'M-17', 'M-18', 'M-19', 'M-20', 'M-21', 'M-22', 'M-23', 'M-24', 'M-25',
] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export interface ModuleDef {
  id: ModuleId;
  /** ASSUMPTION (K-13): memakai nama panjang BRD §7.1, bukan nama pendek Matriks/BRD 7.3. */
  name: string;
  /** Tanda "Belum di SOW" (KD-04, PR-14). */
  belumDiSow?: boolean;
}

export const MODULES: Record<ModuleId, ModuleDef> = {
  'M-01': { id: 'M-01', name: 'Ruang Kerja' },
  'M-02': { id: 'M-02', name: 'Asisten PERISAI' },
  'M-03': { id: 'M-03', name: 'Profil KKKS & Wilayah Kerja' },
  'M-04': { id: 'M-04', name: 'Risiko & Kondisi Keamanan' },
  'M-05': { id: 'M-05', name: 'Insiden' },
  'M-06': { id: 'M-06', name: 'Anggaran Pengamanan (WP&B)' },
  'M-07': { id: 'M-07', name: 'Kemitraan Pengamanan' },
  'M-08': { id: 'M-08', name: 'Bahan Peledak', belumDiSow: true },
  'M-09': { id: 'M-09', name: 'Tindak Lanjut' },
  'M-10': { id: 'M-10', name: 'Analitik' },
  'M-11': { id: 'M-11', name: 'Peta Panas, Tren & Pola' },
  'M-12': { id: 'M-12', name: 'Peringatan Dini' },
  'M-13': { id: 'M-13', name: 'Dasbor Eksekutif & Laporan' },
  'M-14': { id: 'M-14', name: 'Informasi Eksternal' },
  'M-15': { id: 'M-15', name: 'Identitas & Akses' },
  'M-16': { id: 'M-16', name: 'Workflow & Persetujuan' },
  'M-17': { id: 'M-17', name: 'Intake & Ekstraksi Dokumen' },
  'M-18': { id: 'M-18', name: 'Data Referensi & Kualitas Data' },
  'M-19': { id: 'M-19', name: 'Integrasi' },
  'M-20': { id: 'M-20', name: 'Notifikasi' },
  'M-21': { id: 'M-21', name: 'Dokumen & Bukti' },
  'M-22': { id: 'M-22', name: 'Jejak Audit & Log' },
  'M-23': { id: 'M-23', name: 'AI Guardrails' },
  'M-24': { id: 'M-24', name: 'Keselamatan Kerja (K3)', belumDiSow: true },
  'M-25': { id: 'M-25', name: 'Pemantauan Layanan Infrastruktur', belumDiSow: true },
};

/**
 * Modul yang sudah dirilis di prototype ini. Modul yang belum dirilis tidak tampil di navigasi.
 * ASSUMPTION (K-6): mengikuti FR-PA-10/FR-HE-14a (disembunyikan), bukan BRD 16.2 (tampil sesuai role).
 * Ubah di satu tempat ini bila keputusan berbeda.
 */
export const RELEASED_MODULES: ReadonlySet<ModuleId> = new Set<ModuleId>(['M-01', 'M-15', 'M-22']);

/* ---------- Matriks (PRD Matriks Role × Modul × Aksi, 4.3) ---------- */

export interface Grant {
  action: Action;
  /** Kualifikasi dari sel matriks, mis. "organisasi sendiri". Penegakan cakupan di backend. */
  note?: string;
}

type Cell = Grant[];
const g = (...actions: Action[]): Cell => actions.map((action) => ({ action }));
const q = (action: Action, note: string): Grant => ({ action, note });

/** Baris = modul, kolom = role. Sel kosong / tidak ada = tidak ada akses (default deny). */
export const MATRIX: Record<ModuleId, Record<string, Cell>> = {
  'M-01': { 'R-01': g('view'), 'R-02': g('view'), 'R-03': g('view'), 'R-04': g('view'), 'R-05': g('view'), 'R-06': g('view') },
  'M-02': { 'R-01': g('view'), 'R-02': g('view'), 'R-04': g('view'), 'R-05': g('view'), 'R-06': g('view') },
  'M-03': {
    'R-01': g('view'), 'R-02': g('view'), 'R-03': g('manage'), 'R-04': g('view'), 'R-05': g('view'), 'R-06': g('view'),
    'R-07': [q('create', 'organisasi'), q('edit', 'domain, email diizinkan, alamat IP')],
  },
  'M-04': { 'R-01': g('view'), 'R-02': g('view'), 'R-04': g('view'), 'R-05': g('view', 'create', 'edit', 'submit'), 'R-06': g('view', 'approve') },
  'M-05': { 'R-01': g('view'), 'R-02': g('view'), 'R-04': g('view'), 'R-05': g('view', 'create', 'edit', 'submit'), 'R-06': g('view', 'approve', 'close') },
  'M-06': { 'R-01': g('view'), 'R-02': g('view', 'upload_signed'), 'R-03': g('manage'), 'R-04': g('view'), 'R-05': g('view', 'create', 'edit', 'submit'), 'R-06': g('view', 'approve') },
  'M-07': {
    'R-01': g('view'), 'R-02': [{ action: 'view' }, q('upload_signed', 'bila ditetapkan K-15/K-21')], 'R-03': g('manage'),
    'R-04': g('view', 'create', 'edit', 'submit'), 'R-05': g('view', 'create', 'edit'), 'R-06': g('view', 'approve'),
  },
  'M-08': { 'R-01': g('view'), 'R-02': g('view'), 'R-03': g('manage'), 'R-04': g('view'), 'R-05': g('view', 'create', 'edit', 'submit'), 'R-06': g('view', 'approve') },
  'M-09': { 'R-01': g('view'), 'R-02': g('view'), 'R-04': g('view'), 'R-05': g('view', 'edit', 'submit'), 'R-06': g('view', 'create', 'verify') },
  'M-10': { 'R-01': g('view', 'export'), 'R-02': g('view', 'export'), 'R-04': g('view', 'export'), 'R-05': [q('view', 'terbatas wilayah kerjanya')], 'R-06': g('view') },
  'M-11': { 'R-01': g('view', 'export'), 'R-02': g('view', 'export'), 'R-04': g('view', 'export'), 'R-05': [q('view', 'terbatas wilayah kerjanya')], 'R-06': g('view') },
  'M-12': { 'R-01': g('view'), 'R-02': g('view'), 'R-03': g('manage'), 'R-04': g('view'), 'R-05': g('view'), 'R-06': g('view') },
  'M-13': {
    'R-01': g('view', 'export'), 'R-02': g('view', 'export'),
    'R-04': [q('view', 'laporan organisasinya sendiri; RV-13'), q('export', 'laporan organisasinya sendiri; RV-13')],
    'R-06': [q('view', 'laporan organisasinya sendiri; RV-13'), q('export', 'laporan organisasinya sendiri; RV-13')],
  },
  'M-14': { 'R-01': g('view'), 'R-02': g('view'), 'R-03': g('manage'), 'R-04': g('view'), 'R-05': g('view', 'create'), 'R-06': g('view') },
  'M-15': {
    'R-03': g('view', 'create', 'edit', 'manage'),
    'R-04': [q('view', 'organisasi sendiri'), q('create', 'organisasi sendiri'), q('edit', 'organisasi sendiri')],
    'R-07': [
      q('manage', 'konfigurasi autentikasi'),
      q('create', 'undangan pengguna ke semua role'),
      { action: 'view' },
      q('edit', 'data dan role pengguna seluruh organisasi'),
    ],
  },
  'M-16': { 'R-02': g('upload_signed'), 'R-03': g('manage') },
  'M-17': { 'R-02': g('view'), 'R-03': g('manage'), 'R-04': g('view', 'create', 'edit'), 'R-05': g('view', 'create', 'edit'), 'R-07': [q('manage', 'mesin ekstraksi')] },
  'M-18': { 'R-01': g('view'), 'R-02': g('view'), 'R-03': g('manage'), 'R-04': g('view'), 'R-05': g('view'), 'R-06': g('view') },
  'M-19': { 'R-03': g('view'), 'R-07': g('manage') },
  'M-20': { 'R-01': g('view'), 'R-02': g('view'), 'R-03': [q('manage', 'isi')], 'R-04': g('view'), 'R-05': g('view'), 'R-06': g('view'), 'R-07': [q('manage', 'saluran')] },
  // M-21 mengikuti modul induk (R-01..R-06); R-07 tanpa akses. Dievaluasi lewat modul induk.
  'M-21': {},
  'M-22': {
    'R-02': g('view'), 'R-03': [{ action: 'view' }, q('manage', 'retensi & ekspor')], 'R-04': [q('view', 'terbatas organisasinya')],
    'R-07': [q('view', 'log teknis')],
  },
  'M-23': { 'R-03': g('view'), 'R-07': g('manage') },
  'M-24': { 'R-01': g('view'), 'R-02': g('view'), 'R-03': g('manage'), 'R-04': g('view'), 'R-05': g('view', 'create', 'edit', 'submit'), 'R-06': g('view', 'approve') },
  // Sel R-07 M-25 tertulis "?" di matriks (belum dipastikan) → default deny.
  'M-25': { 'R-01': g('view'), 'R-02': g('view'), 'R-03': g('manage'), 'R-04': g('view'), 'R-05': g('view', 'create', 'edit', 'submit'), 'R-06': g('view') },
};

/** Salinan matriks awal (data awal katalog role sistem). */
export const DEFAULT_MATRIX: Record<ModuleId, Record<string, Cell>> = structuredClone(MATRIX);

/** Hak akses satu role dari matriks (FR-KR-09). */
export function roleGrants(id: RoleId): Partial<Record<ModuleId, Grant[]>> {
  const out: Partial<Record<ModuleId, Grant[]>> = {};
  for (const m of MODULE_IDS) {
    const cell = MATRIX[m][id];
    if (cell?.length) out[m] = cell;
  }
  return out;
}

/** Ganti seluruh hak akses satu role (FR-KR-09f: berlaku pada permintaan berikutnya). */
export function setRoleGrants(id: RoleId, grants: Partial<Record<ModuleId, Grant[]>>): void {
  for (const m of MODULE_IDS) {
    const cell = grants[m];
    if (cell?.length) MATRIX[m][id] = cell;
    else delete MATRIX[m][id];
  }
}

/* ---------- Evaluasi ---------- */

/** Satu pengguna dapat memiliki lebih dari satu role (BRD 6.2). */
export function grantsFor(roles: readonly RoleId[], module: ModuleId): Grant[] {
  return roles.flatMap((r) => MATRIX[module][r] ?? []);
}

/** Default deny (FR-MX-12). */
export function can(roles: readonly RoleId[], module: ModuleId, action: Action): boolean {
  return grantsFor(roles, module).some((gr) => gr.action === action);
}

/** Modul tampil di navigasi bila dirilis DAN pengguna punya izin `view` (PU-04, FR-PA-10). */
export function canSeeInNav(roles: readonly RoleId[], module: ModuleId): boolean {
  return RELEASED_MODULES.has(module) && can(roles, module, 'view');
}
