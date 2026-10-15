/** PRD Katalog Role & Aktif/Nonaktif Role yang ditiru mock. */
import { describe, expect, it } from 'vitest';
import { can, roleName } from '@/lib/rbac';
import { isRoleActive } from '@/lib/role-catalog';
import { invitableRoles } from '@/lib/user-rules';
import { ServiceError } from '../types';
import { mockServices as s } from './index';

async function code<T>(p: Promise<T>): Promise<string> {
  try {
    await p;
    return 'OK';
  } catch (e) {
    return (e as ServiceError).code;
  }
}

describe('Katalog Role (FR-KR-01..08)', () => {
  it('tujuh role sistem; hanya R-03 (FR-KR-06, -09e)', async () => {
    await s.dev!.signInAs('u-03');
    const list = await s.roles.list();
    expect(list.map((r) => r.id)).toEqual(['R-01', 'R-02', 'R-03', 'R-04', 'R-05', 'R-06', 'R-07']);
    expect(list.find((r) => r.id === 'R-05')).toMatchObject({ jenisOrg: 'KKKS', cakupan: 'Wilayah kerja tertentu', sistem: true });
    expect(list.find((r) => r.id === 'R-03')?.dapatDinonaktifkan).toBe(false);
    await s.dev!.signInAs('u-04');
    expect(await code(s.roles.list())).toBe('PERMISSION_DENIED');
    expect((await s.roles.catalog()).length).toBe(7);
  });

  it('ubah nama berlaku seketika; kode tetap; tercatat (FR-KR-02, -08, -10)', async () => {
    await s.dev!.signInAs('u-03');
    await s.roles.rename('R-06', { nama: 'Pejabat Penyetuju KKKS', deskripsi: 'Menyetujui dokumen atas nama organisasinya' });
    expect(roleName('R-06')).toBe('Pejabat Penyetuju KKKS');
    const audit = await s.logs.audit({ dari: '2000-01-01', sampai: '2100-01-01', page: 1, pageSize: 5 });
    expect(audit.items[0]).toMatchObject({ objek: 'role R-06', kelompok: 'Konfigurasi' });
  });
});

describe('Aktif & Nonaktif Role (FR-AR-01..21)', () => {
  it('R-03 tidak dapat dinonaktifkan (FR-AR-03)', async () => {
    await s.dev!.signInAs('u-03');
    expect(await code(s.roles.deactivate('R-03', {}))).toBe('PERMISSION_DENIED');
  });

  it('Lewati: role tidak muncul di dropdown, pengguna tetap memegangnya, penetapan baru ditolak (FR-AR-06..08)', async () => {
    await s.dev!.signInAs('u-03');
    await s.roles.deactivate('R-06', {});
    expect(isRoleActive('R-06')).toBe(false);
    expect(invitableRoles('R-04', 'KKKS')).toEqual(['R-04', 'R-05']);
    expect((await s.users.getUser('u-06')).roles).toEqual(['R-06']);
    await s.dev!.signInAs('u-04');
    expect(await code(s.users.invite({ nama: 'Calon', email: 'calon@andalas-energi.example', roles: ['R-06'] }))).toBe('ROLE_INACTIVE');
    await s.dev!.signInAs('u-03');
    await s.roles.reactivate('R-06');
    expect(isRoleActive('R-06')).toBe(true);
  });

  it('Pindahkan ke role lain: pratinjau beda akses, satu transaksi, kombinasi terlarang dilewati (FR-AR-04a, -15..17)', async () => {
    await s.dev!.signInAs('u-03');
    expect(await code(s.roles.previewMove('R-06', 'R-01'))).toBe('ROLE_NOT_ALLOWED');
    const p = await s.roles.previewMove('R-06', 'R-04');
    expect(p.pengguna).toBeGreaterThan(0);
    expect(p.aksesBertambah.length).toBeGreaterThan(0);
    const r = await s.roles.deactivate('R-06', { pindahKe: 'R-04' });
    expect(r.dipindah).toBe(p.pengguna);
    expect((await s.users.getUser('u-06')).roles).toEqual(['R-04']);
    expect((await s.roles.get('R-06')).status).toBe('Tidak aktif');
  });

  it('pindah massal dari role Tidak Aktif (FR-AR-13)', async () => {
    await s.dev!.signInAs('u-03');
    await s.roles.deactivate('R-05', {});
    expect(await code(s.roles.moveUsers('R-04', 'R-06'))).toBe('NOT_ELIGIBLE');
    const r = await s.roles.moveUsers('R-05', 'R-04');
    expect(r.dipindah).toBeGreaterThan(0);
    expect((await s.roles.get('R-05')).pengguna).toBe(0);
  });
});

describe('Buat, ubah hak akses, hapus role (FR-KR-09..09f)', () => {
  it('buat role KKKS: minimal satu izin, izin dibatasi jenis organisasi, langsung tersedia di undangan', async () => {
    await s.dev!.signInAs('u-03');
    expect(await code(s.roles.create({ nama: 'Analis KKKS', deskripsi: 'Analisis', orgType: 'KKKS', cakupan: 'Organisasi sendiri', izin: {} }))).toBe('VALIDATION');
    expect(await code(s.roles.create({ nama: 'Analis KKKS', deskripsi: 'Analisis', orgType: 'KKKS', cakupan: 'Organisasi sendiri', izin: { 'M-23': ['manage'] } }))).toBe('VALIDATION');
    const r = await s.roles.create({ nama: 'Analis KKKS', deskripsi: 'Menganalisis laporan organisasinya', orgType: 'KKKS', cakupan: 'Organisasi sendiri', izin: { 'M-01': ['view'], 'M-15': ['view'] } });
    expect(r).toMatchObject({ id: 'R-08', sistem: false, status: 'Aktif' });
    expect(invitableRoles('R-04', 'KKKS')).toContain('R-08');
    expect(can(['R-08'], 'M-15', 'view')).toBe(true);
    await s.dev!.signInAs('u-04');
    expect(await code(s.roles.create({ nama: 'X', deskripsi: 'x', orgType: 'KKKS', cakupan: 'Organisasi sendiri', izin: { 'M-01': ['view'] } }))).toBe('PERMISSION_DENIED');
  });

  it('ubah hak akses role sistem berlaku seketika; role sistem tidak dapat dihapus; role terpakai tidak dapat dihapus', async () => {
    await s.dev!.signInAs('u-03');
    expect(can(['R-06'], 'M-15', 'view')).toBe(false);
    const izin = { 'M-01': ['view' as const], 'M-15': ['view' as const] };
    await s.roles.updatePermissions('R-06', izin);
    expect(can(['R-06'], 'M-15', 'view')).toBe(true);
    expect(await code(s.roles.remove('R-06'))).toBe('PERMISSION_DENIED');
    const r = await s.roles.create({ nama: 'Peran Uji', deskripsi: 'Uji', orgType: 'KKKS', cakupan: 'Wilayah kerja tertentu', izin: { 'M-01': ['view'] } });
    await s.users.invite({ nama: 'Uji', email: 'uji@andalas-energi.example', roles: ['R-04'], organisasiId: 'org-andalas' });
    await s.dev!.signInAs('u-04');
    await s.users.invite({ nama: 'Uji Dua', email: 'uji2@andalas-energi.example', roles: [r.id], wilayahKerjaIds: ['wk-andalas-1'] });
    await s.dev!.signInAs('u-03');
    expect(await code(s.roles.remove(r.id))).toBe('ROLE_IN_USE');
  });
});
