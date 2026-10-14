/** Aturan PRD Ubah Data & Role Pengguna (FR-UDR) yang ditiru mock. */
import { describe, expect, it } from 'vitest';
import { ServiceError } from '../types';
import { mockServices as s } from './index';
import { MOCK_PASSWORD } from './seed';

async function code<T>(p: Promise<T>): Promise<string> {
  try {
    await p;
    return 'OK';
  } catch (e) {
    return (e as ServiceError).code;
  }
}

const last7 = (() => {
  const day = (o: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(Date.now() + o * 86_400_000));
  return { dari: day(-7), sampai: day(0), page: 1, pageSize: 100 };
})();

async function otpFor(email: string): Promise<string> {
  const mail = (await s.dev!.inbox()).find((m) => m.to === email && /(\d{6})/.test(m.body));
  return /(\d{6})/.exec(mail!.body)![1]!;
}

async function linkFor(email: string, prefix: string): Promise<string> {
  const mail = (await s.dev!.inbox()).find((m) => m.to === email && m.link?.startsWith(prefix));
  return mail!.link!.split('/').pop()!;
}

describe('Ubah pengguna lain (FR-UDR-01..09)', () => {
  it('PIC KKKS: ringkasan sebelum/sesudah + perbedaan hak akses, lalu simpan (FR-UDR-08, -09, FR-HE-17)', async () => {
    await s.dev!.signInAs('u-04');
    const input = { nama: 'Sri Lestari Wulandari', jabatan: 'VP Security', roles: ['R-06' as const, 'R-04' as const] };
    const p = await s.users.previewUpdate('u-06', input);
    expect(p.perubahan.map((c) => c.field)).toEqual(['nama', 'roles']);
    expect(p.aksesBertambah.map((m) => m.module)).toEqual(['M-15', 'M-22']);
    expect(p.aksesBerkurang).toEqual([]);
    const after = await s.users.updateUser('u-06', input);
    expect(after).toMatchObject({ nama: 'Sri Lestari Wulandari', roles: ['R-06', 'R-04'] });
    expect(after.riwayat[0]!.peristiwa).toBe('Role dan cakupan diubah');
    const audit = await s.logs.audit(last7);
    expect(audit.items[0]).toMatchObject({ objek: 'pengguna #u-06', kelompok: 'Identitas & akses' });
  });

  it('tanpa perubahan → NO_CHANGES; validasi nama (Tabel E-UDR)', async () => {
    await s.dev!.signInAs('u-03');
    expect(await code(s.users.previewUpdate('u-06', { nama: 'Sri Lestari', jabatan: 'VP Security', roles: ['R-06'] }))).toBe('NO_CHANGES');
    expect(await code(s.users.previewUpdate('u-06', { nama: 'Sr', roles: ['R-06'] }))).toBe('VALIDATION');
  });

  it('PIC organisasi lain → 404; PIC tidak dapat memberi role di atas kewenangannya (FR-UDR-02, -08)', async () => {
    await s.dev!.signInAs('u-19');
    expect(await code(s.users.previewUpdate('u-06', { nama: 'Sri Lestari', roles: ['R-04'] }))).toBe('NOT_FOUND');
    await s.dev!.signInAs('u-04');
    expect(await code(s.users.previewUpdate('u-06', { nama: 'Sri Lestari', roles: ['R-01'] }))).toBe('ROLE_NOT_ALLOWED');
    expect(await code(s.users.previewUpdate('u-06', { nama: 'Sri Lestari', roles: ['R-05'], wilayahKerjaIds: [] }))).toBe('VALIDATION');
  });

  it('tidak dapat mengubah role sendiri; penolakan tercatat di Jejak Audit (FR-UDR-11, PR-03)', async () => {
    await s.dev!.signInAs('u-04');
    expect(await code(s.users.updateUser('u-04', { nama: 'Rina Wiyono', roles: ['R-04', 'R-06'] }))).toBe('PERMISSION_DENIED');
    await s.dev!.signInAs('u-03');
    const audit = await s.logs.audit(last7);
    expect(audit.items.find((e) => e.kelompok === 'Penolakan akses' && e.objek === 'pengguna #u-04')).toBeTruthy();
  });

  it('Administrator Teknis mengubah → Administrator Bisnis diberi tahu (FR-UDR-01, D-7)', async () => {
    await s.dev!.signInAs('u-07');
    await s.dev!.clearInbox();
    await s.users.updateUser('u-05', { nama: 'Dimas Pratama', jabatan: 'Koordinator Lapangan', roles: ['R-05'] });
    expect((await s.dev!.inbox()).some((m) => m.to === 'b.santoso@skkmigas.example' && /Administrator Teknis/.test(m.subject))).toBe(true);
  });

  it('ubah email oleh admin: berlaku setelah tautan diverifikasi, seluruh sesi dicabut (FR-UDR-05, -06)', async () => {
    await s.dev!.signInAs('u-04');
    const d = await s.users.updateUser('u-05', { nama: 'Dimas Pratama', jabatan: 'Security Officer Lapangan', email: 'dimas.p@andalas-energi.example', roles: ['R-05'] });
    expect(d.email).toBe('d.pratama@andalas-energi.example');
    expect(d.emailTertunda).toMatchObject({ emailBaru: 'dimas.p@andalas-energi.example', status: 'Menunggu Verifikasi', olehAdmin: true });
    const token = await linkFor('dimas.p@andalas-energi.example', '/verifikasi-email/');
    expect(await s.emailLinks.checkVerifyLink(token)).toMatchObject({ state: 'valid' });
    await s.emailLinks.confirmVerifyLink(token);
    expect(await s.emailLinks.checkVerifyLink(token)).toMatchObject({ state: 'used' });
    expect((await s.users.getUser('u-05')).email).toBe('dimas.p@andalas-energi.example');
    expect(await code(s.users.updateUser('u-05', { nama: 'Dimas Pratama', email: 'r.wiyono@andalas-energi.example', roles: ['R-05'] }))).toBe('EMAIL_REGISTERED');
  });
});

describe('Ubah email sendiri + persetujuan (FR-UDR-12..16, FR-AS-009..011)', () => {
  it('anggota KKKS → disetujui PIC organisasinya; tolak wajib alasan; alasan tampil sampai ditutup', async () => {
    await s.dev!.signInAs('u-05');
    expect(await code(s.account.requestEmailChange({ password: MOCK_PASSWORD, emailBaru: 'd.pratama@andalas-energi.example' }))).toBe('EMAIL_SAME');
    await s.account.requestEmailChange({ password: MOCK_PASSWORD, emailBaru: 'dimas.baru@andalas-energi.example' });
    // Satu permintaan aktif, termasuk saat Menunggu Verifikasi.
    expect(await code(s.account.requestEmailChange({ password: MOCK_PASSWORD, emailBaru: 'lain@andalas-energi.example' }))).toBe('EMAIL_REQUEST_PENDING');
    // Email lama diberi tahu + tautan "Bukan saya".
    expect((await s.dev!.inbox()).some((m) => m.to === 'd.pratama@andalas-energi.example' && m.link?.startsWith('/bukan-saya/'))).toBe(true);
    const me = await s.account.verifyEmailChange(await otpFor('dimas.baru@andalas-energi.example'));
    expect(me.permintaanEmail?.status).toBe('Menunggu Persetujuan');

    await s.dev!.signInAs('u-03');
    expect(await s.users.listEmailRequests()).toEqual([]);
    await s.dev!.signInAs('u-04');
    const list = await s.users.listEmailRequests();
    expect(list).toMatchObject([{ userId: 'u-05', emailLama: 'd.pratama@andalas-energi.example', emailBaru: 'dimas.baru@andalas-energi.example' }]);
    expect(await code(s.users.rejectEmailRequest('u-05', ' '))).toBe('VALIDATION');
    await s.users.rejectEmailRequest('u-05', 'Email belum terdaftar di sistem HR.');

    await s.dev!.signInAs('u-05');
    const m2 = await s.account.getMe();
    expect(m2.permintaanEmail).toMatchObject({ status: 'Ditolak', alasan: 'Email belum terdaftar di sistem HR.' });
    expect((await s.account.dismissEmailRejection()).permintaanEmail).toBeUndefined();
  });

  it('PIC KKKS → disetujui Administrator Bisnis; pengaju tidak menyetujui sendiri (FR-UDR-14, -16, EC-UDR-04)', async () => {
    await s.dev!.signInAs('u-04');
    await s.account.requestEmailChange({ password: MOCK_PASSWORD, emailBaru: 'rina.w@andalas-energi.example' });
    await s.account.verifyEmailChange(await otpFor('rina.w@andalas-energi.example'));
    expect(await s.users.listEmailRequests()).toEqual([]);
    await s.dev!.signInAs('u-03');
    await s.users.approveEmailRequest('u-04');
    expect((await s.users.getUser('u-04')).email).toBe('rina.w@andalas-energi.example');
  });

  it('disetujui saat email keburu dipakai → ditolak otomatis (FR-UDR-16)', async () => {
    await s.dev!.signInAs('u-06');
    await s.account.requestEmailChange({ password: MOCK_PASSWORD, emailBaru: 'sri.l@andalas-energi.example' });
    await s.account.verifyEmailChange(await otpFor('sri.l@andalas-energi.example'));
    await s.dev!.signInAs('u-03');
    await s.users.invite({ nama: 'Sri Lain', email: 'sri.l@andalas-energi.example', roles: ['R-04'], organisasiId: 'org-andalas' });
    await s.dev!.signInAs('u-04');
    expect(await code(s.users.approveEmailRequest('u-06'))).toBe('EMAIL_TAKEN_ON_APPROVE');
  });

  it('"Bukan saya" membatalkan permintaan dan mencabut sesi (FR-UDR-14)', async () => {
    await s.dev!.signInAs('u-05');
    await s.account.requestEmailChange({ password: MOCK_PASSWORD, emailBaru: 'dimas.x@andalas-energi.example' });
    const token = await linkFor('d.pratama@andalas-energi.example', '/bukan-saya/');
    await s.emailLinks.confirmNotMe(token);
    expect(await s.emailLinks.checkNotMeLink(token)).toEqual({ state: 'used' });
    expect((await s.auth.getSession()).status).not.toBe('active');
  });
});
