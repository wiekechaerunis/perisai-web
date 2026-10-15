/**
 * Katalog role — PRD Katalog Role (ClickUp z8pmx9n8p0, Tabel R-2) dan Aktif & Nonaktif Role (ClickUp z8pmx9n8p1).
 * Kode role tetap (FR-KR-02); nama, deskripsi, status, jenis organisasi, cakupan, dan hak akses berasal dari katalog di
 * backend. Klien menyimpan salinan katalog di sini (`applyRoleCatalog`) agar seluruh dropdown, pemeriksaan izin, dan
 * tampilan membaca satu sumber (FR-KR-03, FR-KR-09a, NFR Consistency). Tech Lead: di produksi katalog dimuat dari API
 * dan di-cache ≤ 1 menit (NFR Performance).
 */
import {
  DEFAULT_MATRIX,
  MODULE_IDS,
  ROLE_IDS,
  allRoleIds,
  isSystemRole,
  registerRoles,
  roleDef,
  setRoleGrants,
  unregisterRole,
  type Action,
  type CakupanBawaan,
  type Grant,
  type ModuleId,
  type OrgType,
  type RoleId,
  type SystemRoleId,
} from './rbac';

export type RoleStatus = 'Aktif' | 'Tidak aktif';

/** Label jenis organisasi pada Tabel R-2. */
export const JENIS_LABEL: Record<OrgType, string> = { 'SKK Migas': 'Regulator (SKK Migas)', KKKS: 'KKKS', Kontraktor: 'Kontraktor' };

/** Tabel R-2: cakupan data bawaan dan ringkasan peran role sistem. */
export const ROLE_R2: Record<SystemRoleId, { cakupan: CakupanBawaan; deskripsi: string }> = {
  'R-01': { cakupan: 'Seluruh organisasi', deskripsi: 'Melihat gambaran nasional dan menyetujui hal yang memerlukan keputusan pimpinan' },
  'R-02': { cakupan: 'Seluruh organisasi', deskripsi: 'Memverifikasi laporan dan memantau tindak lanjut lintas KKKS' },
  'R-03': { cakupan: 'Seluruh organisasi', deskripsi: 'Mengelola pengguna, role, dan data referensi platform' },
  'R-04': { cakupan: 'Organisasi sendiri', deskripsi: 'Mengelola pengguna di organisasinya dan menjadi penghubung dengan SKK Migas' },
  // "Area tertentu" di Tabel R-2 = Wilayah kerja (FR-CD-09a: label "Wilayah Kerja", bukan "Area").
  'R-05': { cakupan: 'Wilayah kerja tertentu', deskripsi: 'Membuat laporan dari wilayah kerja yang ditetapkan' },
  'R-06': { cakupan: 'Organisasi sendiri', deskripsi: 'Menyetujui dan menandatangani dokumen atas nama organisasinya' },
  'R-07': { cakupan: 'Tidak ada akses data bisnis', deskripsi: 'Mengelola konfigurasi teknis platform tanpa membuka data operasional' },
};

/** Cakupan yang dapat dipilih untuk role buatan (FR-KR-09). */
export const CAKUPAN_PILIHAN: readonly CakupanBawaan[] = ['Seluruh organisasi', 'Organisasi sendiri', 'Wilayah kerja tertentu'];

export const DEFAULT_ROLE_NAMES = Object.fromEntries(ROLE_IDS.map((r) => [r, roleDef(r).name])) as Record<SystemRoleId, string>;

/** Cakupan bawaan role (sistem dari Tabel R-2, buatan dari katalog). */
export function roleCakupan(id: RoleId): CakupanBawaan {
  return isSystemRole(id) ? ROLE_R2[id].cakupan : (roleDef(id).cakupan ?? 'Organisasi sendiri');
}

const status: Record<string, RoleStatus> = {};

/** FR-AR-06: role Tidak Aktif tidak muncul di dropdown mana pun. */
export function isRoleActive(r: RoleId): boolean {
  return status[r] !== 'Tidak aktif';
}

export function roleStatus(r: RoleId): RoleStatus {
  return status[r] ?? 'Aktif';
}

/** FR-AR-03: R-03 Admin SKK tidak dapat dinonaktifkan. */
export const ROLE_NOT_DEACTIVATABLE: readonly RoleId[] = ['R-03'];

/** FR-KR-04, FR-UP-12: role bercakupan wilayah kerja mewajibkan field Wilayah Kerja. */
export function needsWk(roles: readonly RoleId[]): boolean {
  return roles.some((r) => roleCakupan(r) === 'Wilayah kerja tertentu');
}

/** Role di katalog untuk satu jenis organisasi (FR-KR-03). */
export function rolesByOrgType(t: OrgType): RoleId[] {
  return allRoleIds().filter((r) => roleDef(r).orgType === t);
}

/**
 * FR-KR-09b: hak akses yang boleh dipilih untuk role baru dibatasi jenis organisasinya.
 * Disetujui PM 14 Okt 2026: batasnya = gabungan hak akses role sistem berjenis sama pada Matriks awal.
 */
export function allowedActions(t: OrgType): Partial<Record<ModuleId, Action[]>> {
  const out: Partial<Record<ModuleId, Action[]>> = {};
  for (const m of MODULE_IDS) {
    const acts = new Set<Action>();
    for (const r of ROLE_IDS) if (roleDef(r).orgType === t) for (const gr of DEFAULT_MATRIX[m][r] ?? []) acts.add(gr.action);
    if (acts.size) out[m] = [...acts];
  }
  return out;
}

export interface CatalogRole {
  id: RoleId;
  nama: string;
  status: RoleStatus;
  orgType?: OrgType;
  cakupan?: CakupanBawaan;
  /** Hak akses per modul (FR-KR-09, -09c, -09f). */
  izin?: Partial<Record<ModuleId, Grant[]>>;
}

/** Terapkan katalog terbaru. Role buatan yang tidak ada lagi di katalog dihapus dari salinan klien. */
export function applyRoleCatalog(entries: readonly CatalogRole[]): void {
  const ids = new Set(entries.map((e) => e.id));
  for (const r of allRoleIds()) if (!isSystemRole(r) && !ids.has(r)) unregisterRole(r);
  registerRoles(
    entries.map((e) => ({
      ...roleDef(e.id),
      id: e.id,
      name: e.nama,
      ...(e.orgType ? { orgType: e.orgType } : {}),
      ...(e.cakupan && !isSystemRole(e.id) ? { cakupan: e.cakupan, scope: e.cakupan } : {}),
    })),
  );
  for (const e of entries) {
    status[e.id] = e.status;
    if (e.izin) setRoleGrants(e.id, e.izin);
  }
}
