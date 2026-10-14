/** Aturan gelombang 2 yang ditiru mock (Undang, Kirim Ulang, Batalkan, Kelola Status Akun, Akun Saya). */
import { describe, expect, it } from 'vitest';
import { RESEND_GAP_MS } from '@/lib/user-rules';
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

const base = { nama: 'Calon Pengguna', jabatan: 'Staf', roles: ['R-06' as const] };

describe('Undang Pengguna (FR-UP)', () => {
  it('PIC KKKS hanya melihat organisasinya dan mengundang role KKKS ke organisasinya (FR-UP-11, -24, R-1)', async () => {
    await s.dev!.signInAs('u-04');
    const list = await s.users.listUsers();
    expect(list.every((u) => u.organisasi.id === 'org-andalas')).toBe(true);
    expect(await code(s.users.invite({ ...base, email: 'x@andalas-energi.example', roles: ['R-01'] }))).toBe('ROLE_NOT_ALLOWED');
    const u = await s.users.invite({ ...base, email: '  Baru@Andalas-Energi.example ' });
    expect(u).toMatchObject({ email: 'baru@andalas-energi.example', status: 'Diundang', organisasi: { id: 'org-andalas' } });
  });

  it('validasi email server (Tabel V-1)', async () => {
    await s.dev!.signInAs('u-03');
    const inv = (email: string) => s.users.invite({ ...base, roles: ['R-04'], organisasiId: 'org-andalas', email });
    expect(await code(inv('orang@gmail.com'))).toBe('EMAIL_PERSONAL');
    expect(await code(inv('orang@lain.example'))).toBe('EMAIL_DOMAIN_NOT_ALLOWED');
    expect(await code(inv('r.wiyono@andalas-energi.example'))).toBe('EMAIL_REGISTERED');
    expect(await code(inv('a.pranoto@andalas-energi.example'))).toBe('EMAIL_INVITED');
    expect(await code(inv('w.sari@andalas-energi.example'))).toBe('EMAIL_INACTIVE_ACCOUNT');
    expect(await code(inv('konsultan.andalas@mitra.example'))).toBe('OK'); // daftar email diizinkan
  });

  it('R-03: role per jenis organisasi; Pelapor butuh wilayah kerja aktif; SoD (FR-UP-10, -12, -13)', async () => {
    await s.dev!.signInAs('u-04');
    expect(await code(s.users.invite({ ...base, email: 'p@andalas-energi.example', roles: ['R-05'] }))).toBe('VALIDATION');
    expect(await code(s.users.invite({ ...base, email: 'q@andalas-energi.example', roles: ['R-05', 'R-06'], wilayahKerjaIds: ['wk-andalas-1'] }))).toBe('SOD_VIOLATION');
    expect(await code(s.users.invite({ ...base, email: 'r@andalas-energi.example', roles: ['R-05'], wilayahKerjaIds: ['wk-andalas-1'] }))).toBe('OK');
    await s.dev!.signInAs('u-07'); // R-07 ke semua organisasi
    expect(await code(s.users.invite({ ...base, email: 'n@natuna-offshore.example', roles: ['R-05'], organisasiId: 'org-natuna', wilayahKerjaIds: [] }))).toBe('ORG_NO_WK');
  });

  it('gagal kirim email: tidak ada yang berubah (FR-UP-20)', async () => {
    await s.dev!.signInAs('u-04');
    const before = (await s.users.listUsers()).length;
    await s.dev!.failNextEmail();
    expect(await code(s.users.invite({ ...base, email: 'gagal@andalas-energi.example' }))).toBe('SEND_FAILED');
    expect(await s.users.listUsers()).toHaveLength(before);
  });

  it('undangan R-07 memberi tahu seluruh R-03 aktif (FR-UP-11a)', async () => {
    await s.dev!.signInAs('u-07');
    await s.users.invite({ ...base, roles: ['R-02'], organisasiId: 'org-skk', email: 'pengawas.baru@skkmigas.example' });
    expect((await s.dev!.inbox()).some((m) => m.to === 'b.santoso@skkmigas.example')).toBe(true);
  });
});

describe('Kirim Ulang & Batalkan (FR-KU, FR-BU)', () => {
  it('kirim ulang Kedaluwarsa → Diundang, tautan lama tidak valid, jeda 5 menit (K-2, K-5, FR-KU-10, -13a)', async () => {
    await s.dev!.signInAs('u-04');
    const after = await s.users.resendInvite('u-11');
    expect(after.status).toBe('Diundang');
    expect((await s.activation.checkInvite('undangan-maya-kedaluwarsa')).state).toBe('invalid');
    expect(await code(s.users.resendInvite('u-11'))).toBe('RESEND_TOO_SOON');
    await s.dev!.advanceClock(RESEND_GAP_MS);
    expect(await code(s.users.resendInvite('u-11'))).toBe('OK');
  });

  it('R-07 tidak boleh kirim ulang; akun Aktif tidak eligible (FR-KU-01, K-1)', async () => {
    await s.dev!.signInAs('u-07');
    expect(await code(s.users.resendInvite('u-10'))).toBe('PERMISSION_DENIED');
    await s.dev!.signInAs('u-03');
    expect(await code(s.users.resendInvite('u-05'))).toBe('NOT_ELIGIBLE');
  });

  it('batalkan → Nonaktif "Undangan dibatalkan", tautan tidak valid, bisa diundang ulang (B-2, FR-BU-13, -14)', async () => {
    await s.dev!.signInAs('u-04');
    expect(await code(s.users.cancelInvite('u-10', { alasan: 'Lainnya' }))).toBe('VALIDATION');
    const u = await s.users.cancelInvite('u-10', { alasan: 'Alamat email salah' });
    expect(u).toMatchObject({ status: 'Nonaktif', keteranganStatus: 'Undangan dibatalkan' });
    expect((await s.activation.checkInvite('undangan-agus-berlaku')).state).toBe('invalid');
    const again = await s.users.invite({ nama: 'Agus Pranoto', email: 'a.pranoto@andalas-energi.example', roles: ['R-06'] });
    expect(again.id).toBe('u-10');
  });
});

describe('Kelola Status Akun (FR-SA)', () => {
  it('tangguhkan mencabut sesi; tidak bisa atas diri sendiri; aktifkan kembali (FR-SA-03, -06, -11, -13)', async () => {
    await s.dev!.signInAs('u-05');
    await s.dev!.signInAs('u-04');
    expect(await code(s.users.suspend('u-04', { alasan: 'Investigasi internal' }))).toBe('SELF_ACTION');
    const u = await s.users.suspend('u-05', { alasan: 'Investigasi internal' });
    expect(u).toMatchObject({ status: 'Ditangguhkan', sesiAktif: 0 });
    expect((await s.users.reactivate('u-05')).status).toBe('Aktif');
    const detail = await s.users.getUser('u-05');
    expect(detail.riwayat.map((e) => e.peristiwa).slice(0, 2)).toEqual(['Akun diaktifkan kembali', 'Akun ditangguhkan']);
  });

  it('PIC terakhir ditandai; Nonaktif yang belum pernah aktif tidak bisa diaktifkan kembali (FR-SA-07, -20a)', async () => {
    await s.dev!.signInAs('u-03');
    expect((await s.users.getUser('u-04')).picTerakhir).toBe(true);
    expect(await code(s.users.reactivate('u-17'))).toBe('NOT_ELIGIBLE');
    expect(await code(s.users.suspend('u-15', { alasan: 'Investigasi internal' }))).toBe('ORG_INACTIVE');
  });

  it('masa berlaku: tolak tanggal lampau; lewat → Nonaktif oleh Sistem (FR-SA-23, -24)', async () => {
    await s.dev!.signInAs('u-03');
    expect(await code(s.users.setAccessEnd('u-05', '2020-01-01'))).toBe('PAST_DATE');
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    await s.users.setAccessEnd('u-05', tomorrow);
    await s.dev!.advanceClock(3 * 86_400_000);
    await s.dev!.signInAs('u-03');
    const u = await s.users.getUser('u-05');
    expect(u.status).toBe('Nonaktif');
    expect(u.riwayat[0]).toMatchObject({ peristiwa: 'Masa berlaku akses berakhir', pelaku: 'Sistem' });
  });

  it('cabut sesi oleh admin; PIC tidak bisa lintas organisasi (FR-LO-14, -15)', async () => {
    await s.dev!.signInAs('u-05');
    await s.dev!.signInAs('u-04');
    expect((await s.users.revokeSessions('u-05', { alasan: 'Dugaan akses tidak sah' })).revoked).toBeGreaterThan(0);
    expect(await code(s.users.revokeSessions('u-19', { alasan: 'Dugaan akses tidak sah' }))).toBe('PERMISSION_DENIED');
  });
});

describe('Akun Saya (FR-AS)', () => {
  it('ubah nama/jabatan; ubah email Pelapor menunggu persetujuan PIC (FR-AS-003, -009)', async () => {
    await s.dev!.signInAs('u-05');
    expect(await code(s.account.updateProfile({ nama: 'Di' }))).toBe('VALIDATION');
    expect((await s.account.updateProfile({ nama: 'Dimas Pratama S.', jabatan: 'Koordinator' })).jabatan).toBe('Koordinator');
    expect(await code(s.account.requestEmailChange({ password: 'salah', emailBaru: 'dimas@andalas-energi.example' }))).toBe('CURRENT_PASSWORD_WRONG');
    await s.account.requestEmailChange({ password: MOCK_PASSWORD, emailBaru: 'dimas@andalas-energi.example' });
    const otp = /(\d{6})/.exec((await s.dev!.inbox())[0]!.body)![1]!;
    const me = await s.account.verifyEmailChange(otp);
    expect(me.permintaanEmail?.status).toBe('Menunggu Persetujuan');
    await s.dev!.decideEmailRequest('u-05', true);
    expect((await s.account.getMe()).email).toBe('dimas@andalas-energi.example');
  });

  it('R-03 ubah email langsung berlaku setelah kode (FR-AS-009)', async () => {
    await s.dev!.signInAs('u-03');
    await s.account.requestEmailChange({ password: MOCK_PASSWORD, emailBaru: 'bagus@skkmigas.example' });
    const otp = /(\d{6})/.exec((await s.dev!.inbox())[0]!.body)![1]!;
    expect((await s.account.verifyEmailChange(otp)).email).toBe('bagus@skkmigas.example');
  });
});
