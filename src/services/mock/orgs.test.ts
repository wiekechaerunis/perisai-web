/** PRD Kelola Organisasi KKKS (FR-ORG) yang ditiru mock. */
import { describe, expect, it } from 'vitest';
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

describe('Daftar & tambah organisasi (FR-ORG-01..09)', () => {
  it('daftar, cari, penanda Tanpa PIC; PIC hanya organisasinya; role lain ditolak', async () => {
    await s.dev!.signInAs('u-03');
    const all = await s.orgs.list({ status: 'Aktif' });
    expect(all.map((o) => o.kode)).toContain('KKKS-001');
    expect(all.find((o) => o.kode === 'KKKS-003')).toMatchObject({ tanpaPic: true });
    expect((await s.orgs.list({ search: 'mahakam-petro' })).map((o) => o.kode)).toEqual(['KKKS-002']);
    await s.dev!.signInAs('u-04');
    expect((await s.orgs.list()).map((o) => o.kode)).toEqual(['KKKS-001']);
    expect(await code(s.orgs.get('KKKS-002'))).toBe('NOT_FOUND');
    await s.dev!.signInAs('u-05');
    expect(await code(s.orgs.list())).toBe('PERMISSION_DENIED');
  });

  it('tambah: validasi E-ORG, kode otomatis, peringatan domain dipakai, langsung dapat dipakai undangan (SK-01)', async () => {
    await s.dev!.signInAs('u-03');
    const kode = await s.orgs.nextKode();
    expect(kode).toBe('KKKS-005');
    expect(await code(s.orgs.create({ nama: 'PT Andalas Energi Hulu', kode, domains: ['contoh.co.id'] }))).toBe('ORG_NAME_TAKEN');
    expect(await code(s.orgs.create({ nama: 'Contoh Energi', kode: 'KKKS-001', domains: ['contoh.co.id'] }))).toBe('ORG_CODE_TAKEN');
    expect(await code(s.orgs.create({ nama: 'Contoh Energi', kode: 'K!', domains: ['contoh.co.id'] }))).toBe('VALIDATION');
    expect(await code(s.orgs.create({ nama: 'Contoh Energi', kode, domains: ['gmail.com'] }))).toBe('EMAIL_PERSONAL');
    expect(await code(s.orgs.create({ nama: 'Contoh Energi', kode, domains: [] }))).toBe('VALIDATION');
    expect(await s.orgs.domainUsedElsewhere('andalas-energi.example')).toBe(true);
    const o = await s.orgs.create({ nama: 'Contoh Energi Nusantara', kode, domains: ['contoh-energi.co.id'] });
    expect(o).toMatchObject({ status: 'Aktif', jenis: 'KKKS', tanpaPic: true });
    const u = await s.users.invite({ nama: 'Calon PIC', email: 'pic@hq.contoh-energi.co.id', roles: ['R-04'], organisasiId: o.id });
    expect(u.status).toBe('Diundang');
  });

  it('Administrator Teknis boleh menambah organisasi, tidak boleh mengubah profil (FR-ORG-40)', async () => {
    await s.dev!.signInAs('u-07');
    await s.dev!.clearInbox();
    const o = await s.orgs.create({ nama: 'Contoh Teknis', kode: 'KKKS-090', domains: ['teknis.co.id'] });
    expect((await s.dev!.inbox()).some((m) => m.to === 'b.santoso@skkmigas.example')).toBe(true);
    expect(await code(s.orgs.update(o.kode, { nama: 'Ubah', versi: o.versi }))).toBe('PERMISSION_DENIED');
    expect(await code(s.orgs.deactivate(o.kode, { alasan: 'Dibuat karena kesalahan' }, o.kode))).toBe('PERMISSION_DENIED');
  });
});

describe('Ubah, domain, nonaktifkan (FR-ORG-10..19)', () => {
  it('ubah dengan pemeriksaan versi (FR-ORG-11)', async () => {
    await s.dev!.signInAs('u-03');
    const o = await s.orgs.get('KKKS-002');
    await s.orgs.update('KKKS-002', { nama: 'PT Mahakam Sejahtera', versi: o.versi });
    expect(await code(s.orgs.update('KKKS-002', { nama: 'PT Mahakam Lagi', versi: o.versi }))).toBe('VERSION_CONFLICT');
    const h = await s.orgs.history('KKKS-002');
    expect(h[0]!.perubahan).toContain('PT Mahakam Sejahtera Petroleum → PT Mahakam Sejahtera');
  });

  it('domain: duplikat, domain terakhir tidak dapat dihapus, hapus membatalkan undangan (SK-02)', async () => {
    await s.dev!.signInAs('u-03');
    expect(await code(s.orgs.addDomain('KKKS-001', 'andalas-energi.example'))).toBe('DOMAIN_DUPLICATE');
    expect(await code(s.orgs.removeDomain('KKKS-001', 'andalas-energi.example'))).toBe('DOMAIN_LAST');
    await s.orgs.addDomain('KKKS-001', 'andalas-baru.example');
    const impact = await s.orgs.domainImpact('KKKS-001', 'andalas-energi.example');
    expect(impact.undanganTertunda).toBeGreaterThan(0);
    await s.orgs.removeDomain('KKKS-001', 'andalas-energi.example');
    expect(await code(s.users.invite({ nama: 'Baru', email: 'baru@andalas-energi.example', roles: ['R-04'], organisasiId: 'org-andalas' }))).toBe('EMAIL_DOMAIN_NOT_ALLOWED');
    expect((await s.users.getUser('u-10')).riwayat[0]!.peristiwa).toBe('Undangan tidak berlaku');
  });

  it('nonaktifkan: alasan + ketik kode; sesi berakhir; status akun tetap; SKK Migas tidak dapat (SK-03)', async () => {
    await s.dev!.signInAs('u-05');
    await s.dev!.signInAs('u-03');
    const impact = await s.orgs.impact('KKKS-001');
    expect(impact.sesi).toBeGreaterThan(0);
    expect(await code(s.orgs.deactivate('KKKS-001', { alasan: '' }, 'KKKS-001'))).toBe('VALIDATION');
    expect(await code(s.orgs.deactivate('KKKS-001', { alasan: 'Kontrak kerja sama berakhir' }, 'KKKS-01'))).toBe('CODE_MISMATCH');
    expect(await code(s.orgs.deactivate('SKKMIGAS', { alasan: 'Kontrak kerja sama berakhir' }, 'SKKMIGAS'))).toBe('PERMISSION_DENIED');
    await s.orgs.deactivate('KKKS-001', { alasan: 'Kontrak kerja sama berakhir' }, 'KKKS-001');
    expect((await s.orgs.get('KKKS-001')).sesiAktif).toBe(0);
    expect((await s.users.getUser('u-05')).status).toBe('Aktif');
    await s.orgs.reactivate('KKKS-001');
    expect((await s.orgs.get('KKKS-001')).status).toBe('Aktif');
  });
});

describe('Email diizinkan & wilayah kerja (FR-ORG-24..30, 41..45)', () => {
  it('aturan email diizinkan dan masa berlaku akses otomatis (SK-05, SK-06)', async () => {
    await s.dev!.signInAs('u-03');
    expect(await code(s.orgs.addAllowedEmail('KKKS-002', { email: 'x@mahakam-petro.example', alasan: 'Uji' }))).toBe('EMAIL_DOMAIN_REGISTERED');
    expect(await code(s.orgs.addAllowedEmail('KKKS-002', { email: 'konsultan.andalas@mitra.example', alasan: 'Uji' }))).toBe('EMAIL_OTHER_ORG');
    expect(await code(s.orgs.addAllowedEmail('KKKS-002', { email: 'andi.baru@gmail.com', alasan: 'Uji' }))).toBe('ALLOW_DATE_REQUIRED');
    expect(await code(s.orgs.addAllowedEmail('KKKS-002', { email: 'budi@konsultan-aman.co.id', alasan: ' ' }))).toBe('VALIDATION');
    await s.orgs.addAllowedEmail('KKKS-002', { email: 'budi@konsultan-aman.co.id', alasan: 'Konsultan keamanan kontrak 2026', berlakuSampai: '2027-06-30' });
    const u = await s.users.invite({ nama: 'Budi', email: 'budi@konsultan-aman.co.id', roles: ['R-04'], organisasiId: 'org-mahakam' });
    expect(u.aksesBerakhir?.slice(0, 10)).toBe('2027-06-30');
  });

  it('PIC melihat email diizinkan tanpa alasan dan tidak dapat mengubah (FR-ORG-20)', async () => {
    await s.dev!.signInAs('u-04');
    const o = await s.orgs.get('KKKS-001');
    expect(o.emailDiizinkanDaftar.length).toBeGreaterThan(0);
    expect(o.emailDiizinkanDaftar.every((e) => e.alasan === undefined)).toBe(true);
    expect(await code(s.orgs.addAllowedEmail('KKKS-001', { email: 'a@b.co.id', alasan: 'x' }))).toBe('PERMISSION_DENIED');
  });

  it('WK: tambah (kode unik), dioperasikan bersama, nonaktifkan dengan alasan', async () => {
    await s.dev!.signInAs('u-03');
    expect(await code(s.orgs.addWorkArea('KKKS-003', { kode: 'WK-ADL-01', nama: 'WK Baru' }))).toBe('ORG_CODE_TAKEN');
    const o = await s.orgs.addWorkArea('KKKS-003', { kode: 'WK-NTN-02', nama: 'WK Natuna Barat' });
    const wk = o.wilayahKerja.find((w) => w.kode === 'WK-NTN-02')!;
    expect(wk.aktif).toBe(true);
    expect((await s.orgs.get('KKKS-002')).wilayahKerja.find((w) => w.kode === 'WK-ADL-02')?.dioperasikanBersama).toBe(true);
    expect(await code(s.orgs.setWorkAreaStatus('KKKS-003', wk.id, false))).toBe('VALIDATION');
    await s.orgs.setWorkAreaStatus('KKKS-003', wk.id, false, 'Dialihkan');
    expect((await s.users.listWilayahKerja('org-natuna')).length).toBe(0);
  });
});
