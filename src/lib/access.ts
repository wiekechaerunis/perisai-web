/**
 * Hak akses efektif dan cakupan data — PRD Hak Akses Efektif (tab fc692fd7-10f5, Tabel H-1, H-2) dan Cakupan Data
 * (tab 88b87435-c320, Tabel C-1). Dipakai adapter mock untuk menghitung (FR-HE-20: produksi menghitung di backend)
 * dan UI untuk teks. Penegakan cakupan tetap di backend (FR-CD-15).
 */
import { ACTIONS, MATRIX, MODULES, RELEASED_MODULES, roleDef, type Action, type ModuleId, type RoleId } from './rbac';
import type { AccountStatus } from './status';

/* ---------- Cakupan (Tabel C-1, FR-CD-01, -04a) ---------- */

export type ScopeLevel = 'Seluruh organisasi' | 'Beberapa organisasi' | 'Organisasi sendiri' | 'Wilayah kerja tertentu' | 'Konfigurasi teknis';

/** Entri cakupan bertipe (FR-CD-04a). `nilai` = nama organisasi / wilayah kerja. */
export interface ScopeEntry {
  role: RoleId;
  tingkat: ScopeLevel;
  nilai: string[];
}

export const SCOPE_DESC: Record<ScopeLevel, string> = {
  'Seluruh organisasi': 'Melihat data seluruh KKKS',
  'Beberapa organisasi': 'Melihat data KKKS tertentu yang ditugaskan',
  'Organisasi sendiri': 'Melihat data organisasinya saja',
  'Wilayah kerja tertentu': 'Melihat data pada wilayah kerja (WK) yang ditetapkan',
  // ASSUMPTION: R-07 tidak ada di Tabel C-1 (PR-13); dipakai deskripsi BRD 6.2.
  'Konfigurasi teknis': 'Konfigurasi dan log teknis',
};

export interface ScopeInput {
  roles: readonly RoleId[];
  organisasi: string;
  /** Nama wilayah kerja (R-05). */
  wilayahKerja: string[];
  /** Nama KKKS yang ditugaskan untuk R-02 (kosong = seluruh KKKS, FR-CD-04b). */
  kkksDitugaskan: string[];
}

/** Cakupan default mengikuti role, bukan modul (FR-CD-02). */
export function scopeFor(input: ScopeInput): ScopeEntry[] {
  return input.roles.map((role): ScopeEntry => {
    switch (role) {
      case 'R-01':
      case 'R-03':
        return { role, tingkat: 'Seluruh organisasi', nilai: [] };
      case 'R-02':
        return input.kkksDitugaskan.length
          ? { role, tingkat: 'Beberapa organisasi', nilai: input.kkksDitugaskan }
          : { role, tingkat: 'Seluruh organisasi', nilai: [] };
      case 'R-05':
        return { role, tingkat: 'Wilayah kerja tertentu', nilai: input.wilayahKerja };
      case 'R-07':
        return { role, tingkat: 'Konfigurasi teknis', nilai: [] };
      default: {
        // Role buatan (FR-KR-04): cakupan bawaan dari katalog.
        const c = roleDef(role).cakupan;
        if (c === 'Seluruh organisasi') return { role, tingkat: 'Seluruh organisasi', nilai: [] };
        if (c === 'Wilayah kerja tertentu') return { role, tingkat: 'Wilayah kerja tertentu', nilai: input.wilayahKerja };
        return { role, tingkat: 'Organisasi sendiri', nilai: [input.organisasi] };
      }
    }
  });
}

export function scopeLabel(e: ScopeEntry): string {
  return e.nilai.length ? `${e.tingkat}: ${e.nilai.join(', ')}` : e.tingkat;
}

/* ---------- Hak akses efektif (Tabel H-1) ---------- */

export interface EffectivePermission {
  action: Action;
  /** Role asal (FR-HE-15). */
  roles: RoleId[];
  /** Kualifikasi sel matriks, mis. "organisasi sendiri". */
  notes: string[];
}

export interface EffectiveModule {
  module: ModuleId;
  nama: string;
  permissions: EffectivePermission[];
  /** Cakupan per role yang memberi izin (FR-HE-04). */
  cakupan: ScopeEntry[];
}

/**
 * H-1: (1) akun tidak Aktif → tanpa hak (FR-HE-07); (2) kumpulkan role langsung + grup (FR-HE-11; grup belum aktif
 * di v1, KD-03 → slot kosong); (3–4) izin matriks dipasangkan dengan cakupan role-nya, digabung (FR-HE-02..04);
 * hanya modul yang dirilis ditampilkan (FR-HE-14a). SoD dokumen (langkah 5) dievaluasi per dokumen, bukan di sini.
 */
export function effectiveAccess(
  status: AccountStatus,
  directRoles: readonly RoleId[],
  scope: ScopeEntry[],
  groupRoles: readonly RoleId[] = [],
  onlyReleased = true,
): EffectiveModule[] {
  if (status !== 'Aktif') return [];
  const roles = [...new Set([...directRoles, ...groupRoles])];
  const out: EffectiveModule[] = [];
  for (const module of Object.keys(MATRIX) as ModuleId[]) {
    if (onlyReleased && !RELEASED_MODULES.has(module)) continue;
    const perms = new Map<Action, EffectivePermission>();
    for (const role of roles) {
      for (const g of MATRIX[module][role] ?? []) {
        const p = perms.get(g.action) ?? { action: g.action, roles: [], notes: [] };
        if (!p.roles.includes(role)) p.roles.push(role);
        if (g.note && !p.notes.includes(g.note)) p.notes.push(g.note);
        perms.set(g.action, p);
      }
    }
    if (perms.size === 0) continue;
    const grantingRoles = new Set([...perms.values()].flatMap((p) => p.roles));
    out.push({
      module,
      nama: MODULES[module].name,
      permissions: [...perms.values()].sort((a, b) => ACTIONS.indexOf(a.action) - ACTIONS.indexOf(b.action)),
      cakupan: scope.filter((s) => grantingRoles.has(s.role)),
    });
  }
  return out;
}

/* ---------- Pemisahan tugas (Tabel H-2, FR-HE-10a) ---------- */

export const SOD_MESSAGES = {
  approve: 'Anda tidak dapat menyetujui dokumen yang Anda buat sendiri.',
  verify: 'Anda tidak dapat memverifikasi dokumen yang Anda buat sendiri.',
  close: 'Anda tidak dapat menutup dokumen yang Anda buat sendiri.',
  sign: 'Anda tidak dapat menandatangani dokumen yang Anda buat sendiri.',
  twoStages: 'Anda sudah memproses dokumen ini di tahap sebelumnya. Tahap ini harus dilakukan oleh orang lain.',
} as const;
