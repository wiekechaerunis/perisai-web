/**
 * FR-MX-09: satu kasus uji per sel Matriks Role × Modul × Aksi (PRD tab e8b6fd5d-016a, 4.3).
 * Spesifikasi di bawah disalin dari tabel PRD (huruf kecil = kode aksi X-1; "—" = tanpa akses; "?" = belum
 * dipastikan → default deny). Setiap kombinasi modul × role × aksi diuji terhadap `can()`.
 */
import { describe, expect, it } from 'vitest';
import { ACTIONS, MODULE_IDS, ROLE_IDS, can, type Action, type ModuleId, type RoleId } from './rbac';

const SPEC: Record<ModuleId, string[]> = {
  'M-01': ['view', 'view', 'view', 'view', 'view', 'view', '—'],
  'M-02': ['view', 'view', '—', 'view', 'view', 'view', '—'],
  'M-03': ['view', 'view', 'manage', 'view', 'view', 'view', 'create edit'],
  'M-04': ['view', 'view', '—', 'view', 'view create edit submit', 'view approve', '—'],
  'M-05': ['view', 'view', '—', 'view', 'view create edit submit', 'view approve close', '—'],
  'M-06': ['view', 'view upload_signed', 'manage', 'view', 'view create edit submit', 'view approve', '—'],
  'M-07': ['view', 'view upload_signed', 'manage', 'view create edit submit', 'view create edit', 'view approve', '—'],
  'M-08': ['view', 'view', 'manage', 'view', 'view create edit submit', 'view approve', '—'],
  'M-09': ['view', 'view', '—', 'view', 'view edit submit', 'view create verify', '—'],
  'M-10': ['view export', 'view export', '—', 'view export', 'view', 'view', '—'],
  'M-11': ['view export', 'view export', '—', 'view export', 'view', 'view', '—'],
  'M-12': ['view', 'view', 'manage', 'view', 'view', 'view', '—'],
  'M-13': ['view export', 'view export', '—', 'view export', '—', 'view export', '—'],
  'M-14': ['view', 'view', 'manage', 'view', 'view create', 'view', '—'],
  'M-15': ['—', '—', 'view create edit manage', 'view create edit', '—', '—', 'manage create view edit'],
  'M-16': ['—', 'upload_signed', 'manage', '—', '—', '—', '—'],
  'M-17': ['—', 'view', 'manage', 'view create edit', 'view create edit', '—', 'manage'],
  'M-18': ['view', 'view', 'manage', 'view', 'view', 'view', '—'],
  'M-19': ['—', '—', 'view', '—', '—', '—', 'manage'],
  'M-20': ['view', 'view', 'manage', 'view', 'view', 'view', 'manage'],
  // M-21 mengikuti modul induk — tidak punya sel sendiri.
  'M-21': ['—', '—', '—', '—', '—', '—', '—'],
  'M-22': ['—', 'view', 'view manage', 'view', '—', '—', 'view'],
  'M-23': ['—', '—', 'view', '—', '—', '—', 'manage'],
  'M-24': ['view', 'view', 'manage', 'view', 'view create edit submit', 'view approve', '—'],
  'M-25': ['view', 'view', 'manage', 'view', 'view create edit submit', 'view', '?'],
};

describe('Matriks Role × Modul × Aksi (FR-MX-09, -12)', () => {
  for (const m of MODULE_IDS) {
    ROLE_IDS.forEach((r: RoleId, i) => {
      const cell = SPEC[m][i]!;
      const allowed = new Set(cell === '—' || cell === '?' ? [] : cell.split(' '));
      it(`${m} × ${r}: ${cell}`, () => {
        for (const a of ACTIONS as readonly Action[]) expect(can([r], m, a), `${m} ${r} ${a}`).toBe(allowed.has(a));
      });
    });
  }
});
