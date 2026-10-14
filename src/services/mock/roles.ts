/**
 * Adapter mock PRD Katalog Role (ClickUp z8pmx9n8p0) dan Aktif & Nonaktif Role (ClickUp z8pmx9n8p1).
 * - Hanya R-03 yang membuka halaman Role dan mengubah katalog (FR-KR-06, -09e, FR-AR-02); penolakan → Jejak Audit (PR-03).
 * - Nonaktifkan: "Pindahkan ke role lain" (role tujuan aktif, jenis organisasi sama; satu transaksi; kombinasi role
 *   terlarang dilewati) atau "Lewati" (pengguna tetap memegang role) — keputusan PM 14 Okt 2026 atas FR-AR-04a vs -08.
 * - Penonaktifan tidak mencabut role maupun sesi (FR-AR-08, -09); pemindahan tidak mencabut sesi (FR-AR-18).
 * - Audit per perubahan status (FR-AR-21) dan per pengguna yang dipindah, dengan id korelasi (FR-AR-17).
 */
import { effectiveAccess, scopeFor, type EffectiveModule } from '@/lib/access';
import { ACTION_LABEL, MODULE_IDS, roleDef, type Grant, type ModuleId, type RoleId } from '@/lib/rbac';
import { allowedActions, applyRoleCatalog, CAKUPAN_PILIHAN, JENIS_LABEL, needsWk, ROLE_NOT_DEACTIVATABLE } from '@/lib/role-catalog';
import { violatesSod } from '@/lib/user-rules';
import { ServiceError, type AccessDiffItem, type RoleEntry, type RoleMoveResult, type RolePermissionInput, type RoleService } from '../types';
import { audit, delay } from './core';
import { commit, db, randomId, type DbRole, type DbUser } from './db';
import { actor, event, objekPengguna } from './users';

const objekRole = (id: RoleId) => `role ${id}`;

function requireR03(a: DbUser, id?: RoleId): void {
  if (a.roles.includes('R-03')) return;
  audit({ pelakuId: a.id, modul: 'M-15', aksi: 'manage', objek: id ? objekRole(id) : 'katalog role', hasil: 'Ditolak', alasan: 'Tidak punya izin', kelompok: 'Penolakan akses' });
  commit();
  throw new ServiceError('PERMISSION_DENIED');
}

function roleOf(id: RoleId): DbRole {
  const r = db().roles.find((x) => x.id === id);
  if (!r) throw new ServiceError('NOT_FOUND');
  return r;
}

function holders(id: RoleId): DbUser[] {
  return db().users.filter((u) => u.roles.includes(id) && u.status !== 'Nonaktif');
}

function toEntry(r: DbRole): RoleEntry {
  return {
    id: r.id,
    nama: r.nama,
    deskripsi: r.deskripsi,
    status: r.status,
    jenisOrg: JENIS_LABEL[r.orgType],
    cakupan: r.cakupan,
    sistem: r.sistem,
    pengguna: holders(r.id).length,
    dapatDinonaktifkan: !ROLE_NOT_DEACTIVATABLE.includes(r.id),
    orgType: r.orgType,
    izin: r.izin,
  };
}

function access(id: RoleId): EffectiveModule[] {
  const scope = scopeFor({ roles: [id], organisasi: '—', wilayahKerja: [], kkksDitugaskan: [] });
  return effectiveAccess('Aktif', [id], scope, [], false);
}

function diff(from: RoleId, to: RoleId): { tambah: AccessDiffItem[]; kurang: AccessDiffItem[] } {
  const label = (p: EffectiveModule['permissions'][number]) => (p.notes.length ? `${ACTION_LABEL[p.action]} (${p.notes.join('; ')})` : ACTION_LABEL[p.action]);
  const idx = (m: EffectiveModule[]) => new Map(m.map((x) => [x.module, { nama: x.nama, aksi: x.permissions.map(label) }]));
  const a = idx(access(from));
  const b = idx(access(to));
  const d = (x: typeof a, y: typeof a): AccessDiffItem[] =>
    [...x.entries()].map(([module, v]) => ({ module, nama: v.nama, aksi: v.aksi.filter((s) => !(y.get(module)?.aksi ?? []).includes(s)) })).filter((m) => m.aksi.length > 0);
  return { tambah: d(b, a), kurang: d(a, b) };
}

function checkTarget(from: RoleId, to: RoleId): void {
  if (from === to) throw new ServiceError('VALIDATION', { field: 'pindahKe' });
  // FR-AR-04a: role tujuan aktif dengan jenis organisasi yang sama.
  if (roleOf(to).status !== 'Aktif') throw new ServiceError('ROLE_INACTIVE', { field: 'pindahKe' });
  if (roleDef(to).orgType !== roleDef(from).orgType) throw new ServiceError('ROLE_NOT_ALLOWED', { field: 'pindahKe' });
}

/** FR-AR-15..17: ganti role asal saja; kombinasi terlarang dilewati; satu baris audit per pengguna. */
function move(a: DbUser, from: RoleId, to: RoleId): RoleMoveResult {
  const korelasi = randomId('kor');
  const result: RoleMoveResult = { dipindah: 0, dilewati: [] };
  for (const u of holders(from)) {
    const next = [...new Set(u.roles.map((r) => (r === from ? to : r)))];
    if (violatesSod(next)) {
      result.dilewati.push({ userId: u.id, nama: u.nama, alasan: 'Kombinasi role melanggar pemisahan tugas.' });
      continue;
    }
    if (needsWk(next) && u.wilayahKerjaIds.length === 0) {
      result.dilewati.push({ userId: u.id, nama: u.nama, alasan: 'Pelapor KKKS wajib punya wilayah kerja.' });
      continue;
    }
    const before = u.roles.join(', ');
    u.roles = next;
    event(u, 'Role dipindahkan', a.nama, `${before} → ${next.join(', ')} · role ${from} dinonaktifkan`);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum: { Role: before }, sesudah: { Role: next.join(', ') }, alasan: `Pemindahan dari role ${from}`, hasil: 'Berhasil', kelompok: 'Identitas & akses', korelasi });
    result.dipindah += 1;
  }
  return result;
}

function catalogOf() {
  return db().roles.map((r) => ({ id: r.id, nama: r.nama, status: r.status, orgType: r.orgType, cakupan: r.cakupan, izin: r.izin }));
}

/** FR-KR-09, -09b: minimal satu hak akses; hanya aksi yang boleh untuk jenis organisasinya. Kualifikasi sel lama dipertahankan. */
function toGrants(input: RolePermissionInput, orgType: DbRole['orgType'], prev: DbRole['izin'] = {}): DbRole['izin'] {
  const allowed = allowedActions(orgType);
  const out: Partial<Record<ModuleId, Grant[]>> = {};
  let total = 0;
  for (const m of MODULE_IDS) {
    const acts = [...new Set(input[m] ?? [])];
    if (!acts.length) continue;
    if (acts.some((x) => !(allowed[m] ?? []).includes(x))) throw new ServiceError('VALIDATION', { field: 'izin', value: m });
    out[m] = acts.map((action) => prev[m]?.find((g) => g.action === action) ?? { action });
    total += acts.length;
  }
  if (total === 0) throw new ServiceError('VALIDATION', { field: 'izin', value: 'kosong' });
  return out;
}

function describe(izin: DbRole['izin']): string {
  return MODULE_IDS.filter((m) => izin[m]?.length)
    .map((m) => `${m}: ${izin[m]!.map((g) => g.action).join('/')}`)
    .join('; ') || '—';
}

export const roleService: RoleService = {
  async catalog() {
    await delay();
    return db().roles.map((r) => ({ id: r.id, nama: r.nama, status: r.status, orgType: r.orgType, cakupan: r.cakupan, izin: r.izin }));
  },

  async list() {
    await delay();
    requireR03(actor());
    return db().roles.map(toEntry);
  },

  async get(id) {
    await delay();
    requireR03(actor(), id);
    return toEntry(roleOf(id));
  },

  async rename(id, input) {
    await delay();
    const a = actor();
    requireR03(a, id);
    const r = roleOf(id);
    const nama = input.nama.trim();
    const deskripsi = input.deskripsi.trim();
    if (nama.length < 3 || nama.length > 60) throw new ServiceError('VALIDATION', { field: 'nama' });
    if (db().roles.some((x) => x.id !== id && x.nama.toLowerCase() === nama.toLowerCase())) throw new ServiceError('ORG_NAME_TAKEN', { field: 'nama' });
    if (!deskripsi || deskripsi.length > 300) throw new ServiceError('VALIDATION', { field: 'deskripsi' });
    if (nama === r.nama && deskripsi === r.deskripsi) throw new ServiceError('NO_CHANGES');
    const sebelum: Record<string, string> = {};
    const sesudah: Record<string, string> = {};
    if (nama !== r.nama) {
      sebelum.Nama = r.nama;
      sesudah.Nama = nama;
    }
    if (deskripsi !== r.deskripsi) {
      sebelum.Deskripsi = r.deskripsi;
      sesudah.Deskripsi = deskripsi;
    }
    r.nama = nama;
    r.deskripsi = deskripsi;
    // FR-KR-08: berlaku seketika di seluruh dropdown; kode tidak berubah. FR-KR-11: audit lama memakai nama saat itu.
    applyRoleCatalog(db().roles);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekRole(id), sebelum, sesudah, hasil: 'Berhasil', kelompok: 'Konfigurasi' });
    commit();
    return toEntry(r);
  },

  async previewMove(from, to) {
    await delay();
    requireR03(actor(), from);
    checkTarget(from, to);
    const d = diff(from, to);
    return { pengguna: holders(from).length, aksesBertambah: d.tambah, aksesBerkurang: d.kurang };
  },

  async deactivate(id, opsi) {
    await delay();
    const a = actor();
    requireR03(a, id);
    const r = roleOf(id);
    if (ROLE_NOT_DEACTIVATABLE.includes(id)) {
      audit({ pelakuId: a.id, modul: 'M-15', aksi: 'manage', objek: objekRole(id), hasil: 'Ditolak', alasan: 'R-03 tidak dapat dinonaktifkan', kelompok: 'Penolakan akses' });
      commit();
      throw new ServiceError('PERMISSION_DENIED');
    }
    if (r.status !== 'Aktif') throw new ServiceError('NOT_ELIGIBLE');
    const jumlah = holders(id).length;
    let result: RoleMoveResult = { dipindah: 0, dilewati: [] };
    if (opsi.pindahKe) {
      checkTarget(id, opsi.pindahKe);
      // FR-AR-04b: satu transaksi — bila gagal, tidak ada yang berubah.
      const snapshot = structuredClone(db().users);
      try {
        result = move(a, id, opsi.pindahKe);
      } catch (e) {
        db().users = snapshot;
        throw e;
      }
    }
    r.status = 'Tidak Aktif';
    applyRoleCatalog(db().roles);
    audit({
      pelakuId: a.id,
      modul: 'M-15',
      aksi: 'manage',
      objek: objekRole(id),
      sebelum: { Status: 'Aktif' },
      sesudah: { Status: 'Tidak Aktif', 'Pengguna saat itu': String(jumlah), ...(opsi.pindahKe ? { 'Dipindahkan ke': opsi.pindahKe, Dipindah: String(result.dipindah), Dilewati: String(result.dilewati.length) } : {}) },
      hasil: 'Berhasil',
      kelompok: 'Konfigurasi',
    });
    commit();
    return result;
  },

  async reactivate(id) {
    await delay();
    const a = actor();
    requireR03(a, id);
    const r = roleOf(id);
    if (r.status !== 'Tidak Aktif') throw new ServiceError('NOT_ELIGIBLE');
    r.status = 'Aktif';
    applyRoleCatalog(db().roles);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'manage', objek: objekRole(id), sebelum: { Status: 'Tidak Aktif' }, sesudah: { Status: 'Aktif', 'Pengguna saat itu': String(holders(id).length) }, hasil: 'Berhasil', kelompok: 'Konfigurasi' });
    commit();
    return toEntry(r);
  },

  async create(input) {
    await delay();
    const a = actor();
    requireR03(a);
    const d = db();
    const nama = input.nama.trim();
    const deskripsi = input.deskripsi.trim();
    if (nama.length < 3 || nama.length > 60) throw new ServiceError('VALIDATION', { field: 'nama' });
    if (d.roles.some((x) => x.nama.toLowerCase() === nama.toLowerCase())) throw new ServiceError('ORG_NAME_TAKEN', { field: 'nama' });
    if (!deskripsi || deskripsi.length > 300) throw new ServiceError('VALIDATION', { field: 'deskripsi' });
    if (!(['SKK Migas', 'KKKS', 'Kontraktor'] as const).includes(input.orgType)) throw new ServiceError('VALIDATION', { field: 'orgType' });
    if (!CAKUPAN_PILIHAN.includes(input.cakupan)) throw new ServiceError('VALIDATION', { field: 'cakupan' });
    const izin = toGrants(input.izin, input.orgType);
    const n = Math.max(...d.roles.map((x) => Number(x.id.slice(2)) || 0)) + 1;
    const id = `R-${String(n).padStart(2, '0')}` as RoleId;
    const r = { id, nama, deskripsi, status: 'Aktif' as const, orgType: input.orgType, cakupan: input.cakupan, sistem: false, izin };
    d.roles.push(r);
    applyRoleCatalog(catalogOf());
    // FR-KR-10, FR-MX-10: perubahan katalog/matriks tercatat.
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'create', objek: objekRole(id), sesudah: { Nama: nama, 'Jenis organisasi': input.orgType, Cakupan: input.cakupan, 'Hak akses': describe(izin) }, hasil: 'Berhasil', kelompok: 'Konfigurasi' });
    commit();
    return toEntry(r);
  },

  async updatePermissions(id, input) {
    await delay();
    const a = actor();
    requireR03(a, id);
    const r = roleOf(id);
    const izin = toGrants(input, r.orgType, r.izin);
    const before = describe(r.izin);
    const after = describe(izin);
    if (before === after) throw new ServiceError('NO_CHANGES');
    r.izin = izin;
    // FR-KR-09f: berlaku untuk seluruh pemakai pada permintaan berikutnya; sesi tidak dicabut.
    applyRoleCatalog(catalogOf());
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekRole(id), sebelum: { 'Hak akses': before }, sesudah: { 'Hak akses': after, 'Pengguna terdampak': String(holders(id).length) }, hasil: 'Berhasil', kelompok: 'Konfigurasi' });
    commit();
    return toEntry(r);
  },

  async remove(id) {
    await delay();
    const a = actor();
    requireR03(a, id);
    const r = roleOf(id);
    // FR-KR-09c: role sistem tidak dapat dihapus.
    if (r.sistem) {
      audit({ pelakuId: a.id, modul: 'M-15', aksi: 'delete', objek: objekRole(id), hasil: 'Ditolak', alasan: 'Role sistem tidak dapat dihapus', kelompok: 'Penolakan akses' });
      commit();
      throw new ServiceError('PERMISSION_DENIED');
    }
    // FR-KR-09d: masih dipakai → arahkan menonaktifkan.
    const n = db().users.filter((u) => u.roles.includes(id)).length;
    if (n > 0) throw new ServiceError('ROLE_IN_USE', { value: String(n) });
    db().roles = db().roles.filter((x) => x.id !== id);
    applyRoleCatalog(catalogOf());
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'delete', objek: objekRole(id), sebelum: { Nama: r.nama, 'Hak akses': describe(r.izin) }, hasil: 'Berhasil', kelompok: 'Konfigurasi' });
    commit();
  },

  async moveUsers(from, to) {
    await delay();
    const a = actor();
    requireR03(a, from);
    if (roleOf(from).status !== 'Tidak Aktif') throw new ServiceError('NOT_ELIGIBLE');
    checkTarget(from, to);
    const result = move(a, from, to);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'manage', objek: objekRole(from), sesudah: { 'Dipindahkan ke': to, Dipindah: String(result.dipindah), Dilewati: String(result.dilewati.length) }, hasil: 'Berhasil', kelompok: 'Konfigurasi' });
    commit();
    return result;
  },
};
