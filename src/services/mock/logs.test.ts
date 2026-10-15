/** Aturan gelombang 3 yang ditiru mock: Log Akses (FR-LA), Jejak Audit (FR-JA), hak akses efektif (FR-HE), cakupan (FR-CD). */
import { describe, expect, it } from 'vitest';
import { ServiceError } from '../types';
import { mockServices as s } from './index';

const day = (offset: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(Date.now() + offset * 86_400_000));
const last7 = { dari: day(-7), sampai: day(0), page: 1, pageSize: 50 };

async function code<T>(p: Promise<T>): Promise<string> {
  try {
    await p;
    return 'OK';
  } catch (e) {
    return (e as ServiceError).code;
  }
}

describe('Log Akses (FR-LA)', () => {
  it('R-03 melihat semua; filter kegagalan login beruntun (FR-LA-06, -12)', async () => {
    await s.dev!.signInAs('u-03');
    const all = await s.logs.accessLog(last7);
    expect(all.total).toBeGreaterThan(5);
    const streak = await s.logs.accessLog({ ...last7, gagalBeruntun: true });
    expect(streak.items.every((e) => e.email === 'f.nugroho@andalas-energi.example')).toBe(true);
    expect(streak.total).toBe(6);
  });

  it('R-04 hanya organisasinya; R-07 dan R-05 ditolak dan tercatat (FR-LA-06, PR-03)', async () => {
    await s.dev!.signInAs('u-04');
    const rows = (await s.logs.accessLog(last7)).items;
    expect(rows.every((e) => e.organisasi?.id === 'org-andalas')).toBe(true);
    await s.dev!.signInAs('u-07');
    expect(await code(s.logs.accessLog(last7))).toBe('PERMISSION_DENIED');
    await s.dev!.signInAs('u-03');
    const denials = await s.logs.audit({ ...last7, hasil: 'Ditolak' });
    expect(denials.items.some((e) => e.pelaku === 'Yoga Prasetyo')).toBe(true);
  });

  it('arsip > 12 bulan ditandai (FR-LA-18); ekspor hanya R-03 dan tercatat (FR-LA-16, -17)', async () => {
    await s.dev!.signInAs('u-03');
    const old = await s.logs.accessLog({ ...last7, dari: day(-450) });
    expect(old.items.some((e) => e.arsip)).toBe(true);
    const csv = await s.logs.exportAccessLog(last7);
    expect(csv.split('\n')[0]).toContain('Waktu (WIB)');
    expect((await s.logs.audit(last7)).items[0]).toMatchObject({ aksi: 'export', objek: 'Log akses' });
    await s.dev!.signInAs('u-02');
    expect(await code(s.logs.exportAccessLog(last7))).toBe('PERMISSION_DENIED');
  });

  it('riwayat masuk sendiri tanpa IP (FR-LA-15a, -15b)', async () => {
    await s.dev!.signInAs('u-04');
    const mine = await s.logs.myLoginHistory();
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((e) => e.ip === undefined)).toBe(true);
  });

  it('sesi aktif dan cabut satu sesi (FR-LA-13, -14)', async () => {
    await s.dev!.signInAs('u-05');
    await s.dev!.signInAs('u-04');
    const sessions = await s.logs.activeSessions();
    const target = sessions.find((x) => x.userId === 'u-05')!;
    await s.logs.revokeSession(target.id, { alasan: 'Perangkat hilang atau dicuri' });
    expect((await s.logs.activeSessions()).some((x) => x.id === target.id)).toBe(false);
  });
});

describe('Jejak Audit (FR-JA)', () => {
  it('aksi pengguna tercatat dengan nilai sebelum/sesudah dan pelaku (FR-JA-01, -04)', async () => {
    await s.dev!.signInAs('u-04');
    await s.users.suspend('u-05', { alasan: 'Investigasi internal' });
    await s.dev!.signInAs('u-03');
    const e = (await s.logs.audit({ ...last7, objek: 'pengguna #u-05' })).items[0]!;
    expect(e).toMatchObject({ pelaku: 'Rina Wiyono', pelakuRole: 'R-04 PIC KKKS', aksi: 'edit', sebelum: { Status: 'Aktif' }, sesudah: { Status: 'Ditangguhkan' }, alasan: 'Investigasi internal' });
  });

  it('kelompok aksi massal per id korelasi (FR-JA-15)', async () => {
    await s.dev!.signInAs('u-03');
    const group = await s.logs.audit({ ...last7, korelasi: 'kor-undang-massal-1' });
    expect(group.total).toBe(3);
  });

  it('kebijakan retensi: hanya R-03, perubahan tercatat (FR-JA-25)', async () => {
    await s.dev!.signInAs('u-04');
    expect(await code(s.logs.setRetention({ aktifBulan: 6, totalTahun: 5 }))).toBe('PERMISSION_DENIED');
    await s.dev!.signInAs('u-03');
    expect(await code(s.logs.setRetention({ aktifBulan: 120, totalTahun: 5 }))).toBe('VALIDATION');
    const p = await s.logs.setRetention({ aktifBulan: 18, totalTahun: 5 });
    expect(p).toMatchObject({ aktifBulan: 18, diubahOleh: 'Bagus Santoso' });
    expect((await s.logs.audit(last7)).items[0]).toMatchObject({ objek: 'Kebijakan retensi', kelompok: 'Konfigurasi' });
  });
});

describe('Hak akses efektif & cakupan (FR-HE, FR-CD)', () => {
  it('modul dirilis saja, role asal, cakupan; akun nonaktif tanpa hak (FR-HE-07, -14a, -15)', async () => {
    await s.dev!.signInAs('u-03');
    const pic = await s.users.effectiveAccess('u-04');
    const m15 = pic.find((m) => m.module === 'M-15')!;
    expect(m15.permissions.map((p) => p.action)).toEqual(['view', 'create', 'edit']);
    expect(m15.permissions[0]!.roles).toEqual(['R-04']);
    expect(m15.cakupan[0]).toMatchObject({ tingkat: 'Organisasi sendiri' });
    expect(pic.some((m) => m.module === 'M-05')).toBe(false); // belum dirilis
    expect(await s.users.effectiveAccess('u-13')).toEqual([]); // Nonaktif
  });

  it('R-02 cakupan KKKS tertentu (FR-CD-04b); WK nonaktif ditandai (FR-CD-13)', async () => {
    await s.dev!.signInAs('u-03');
    const u = await s.users.invite({ nama: 'Pengawas Wilayah', email: 'pengawas.wil@skkmigas.example', roles: ['R-02'], organisasiId: 'org-skk', cakupanOrganisasiIds: ['org-andalas'] });
    expect(u.cakupan[0]).toMatchObject({ tingkat: 'Beberapa organisasi', nilai: ['PT Andalas Energi Hulu'] });
    expect(await code(s.users.invite({ nama: 'X', email: 'x2@skkmigas.example', roles: ['R-02'], organisasiId: 'org-skk', cakupanOrganisasiIds: ['org-skk'] }))).toBe('VALIDATION');
    const teguh = await s.users.getUser('u-14');
    expect(teguh.wilayahKerjaNonaktif.map((w) => w.nama)).toEqual(['WK Andalas Utara']);
  });

  it('perubahan role berlaku tanpa mencabut sesi (FR-HE-18, FR-LO-19)', async () => {
    const before = await s.dev!.signInAs('u-04');
    await s.dev!.simulateRoleChange();
    const st = await s.auth.getSession();
    expect(st.status).toBe('active');
    if (st.status === 'active') expect(st.session.user.roles).not.toEqual(before.user.roles);
  });

  it('penolakan akses dicatat di Jejak Audit saja (PR-03, FR-PA-11)', async () => {
    await s.dev!.signInAs('u-05');
    expect(await code(s.logs.accessLog(last7))).toBe('PERMISSION_DENIED');
    await s.dev!.signInAs('u-03');
    const akses = await s.logs.accessLog(last7);
    expect(akses.items.some((e) => e.kelompok === ('Penolakan akses' as never))).toBe(false);
    const audit = await s.logs.audit(last7);
    expect(audit.items.find((e) => e.kelompok === 'Penolakan akses' && e.objek === 'modul M-22')).toMatchObject({ pelaku: 'Dimas Pratama', hasil: 'Ditolak' });
  });
});
