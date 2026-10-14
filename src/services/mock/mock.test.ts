/** Aturan backend yang ditiru mock — memastikan alur UI diuji terhadap perilaku PRD. */
import { describe, expect, it } from 'vitest';
import { SECURITY_PARAMS as P } from '@/lib/security-params';
import { ServiceError } from '../types';
import { mockLogs, mockServices as s } from './index';
import { MOCK_PASSWORD } from './seed';

const lastCode = async () => {
  const mail = (await s.dev!.inbox())[0]!;
  return /(\d{6})/.exec(mail.body)![1]!;
};

async function code<T>(p: Promise<T>): Promise<string> {
  try {
    await p;
    return 'OK';
  } catch (e) {
    return (e as ServiceError).code;
  }
}

describe('Login (PRD Login)', () => {
  it('email tidak terdaftar = password salah (FR-LG-06)', async () => {
    expect(await code(s.auth.login({ email: 'tidak.ada@x.example', password: 'x' }))).toBe('INVALID_CREDENTIALS');
    expect(await code(s.auth.login({ email: 'r.wiyono@andalas-energi.example', password: 'salah' }))).toBe('INVALID_CREDENTIALS');
  });

  it('status akun hanya terungkap setelah password benar (FR-LG-07, S-1)', async () => {
    expect(await code(s.auth.login({ email: 'w.sari@andalas-energi.example', password: 'salah' }))).toBe('INVALID_CREDENTIALS');
    expect(await code(s.auth.login({ email: 'w.sari@andalas-energi.example', password: MOCK_PASSWORD }))).toBe('ACCOUNT_DEACTIVATED');
    expect(await code(s.auth.login({ email: 'f.nugroho@andalas-energi.example', password: MOCK_PASSWORD }))).toBe('ACCOUNT_SUSPENDED');
    expect(await code(s.auth.login({ email: 'a.pranoto@andalas-energi.example', password: MOCK_PASSWORD }))).toBe('INVALID_CREDENTIALS');
    expect(await code(s.auth.login({ email: 't.hartono@andalas-energi.example', password: MOCK_PASSWORD }))).toBe('ACCOUNT_DEACTIVATED');
    expect(await code(s.auth.login({ email: 'l.marlina@seram-energi.example', password: MOCK_PASSWORD }))).toBe('ORG_INACTIVE');
  });

  it('lockout 30 menit setelah 5 gagal, walau password benar (FR-LG-22)', async () => {
    for (let i = 0; i < P.loginMaxFailures; i++) await code(s.auth.login({ email: 'd.pratama@andalas-energi.example', password: 'salah' }));
    expect(await code(s.auth.login({ email: 'd.pratama@andalas-energi.example', password: MOCK_PASSWORD }))).toBe('RATE_LIMITED');
    await s.dev!.advanceClock(P.loginLockMs + 1000);
    expect(await code(s.auth.login({ email: 'd.pratama@andalas-energi.example', password: MOCK_PASSWORD }))).toBe('OK');
  });

  it('OTP: salah menampilkan sisa, kirim ulang membatalkan kode lama, sukses membuat sesi (FR-LG-13..15)', async () => {
    const ch = await s.auth.login({ email: ' R.Wiyono@andalas-energi.example ', password: MOCK_PASSWORD });
    expect(ch.maskedEmail).toBe('r.wi****@andalas-energi.example');
    const first = await lastCode();
    const wrong = await s.auth.verifyLoginOtp(ch.preAuthId, first === '000000' ? '111111' : '000000').catch((e) => e as ServiceError);
    expect((wrong as ServiceError).meta.remainingAttempts).toBe(4);
    expect(await code(s.auth.resendLoginOtp(ch.preAuthId))).toBe('OTP_RESEND_TOO_SOON');
    await s.dev!.advanceClock(P.otpResendCooldownMs);
    await s.auth.resendLoginOtp(ch.preAuthId);
    const second = await lastCode();
    if (first !== second) expect(await code(s.auth.verifyLoginOtp(ch.preAuthId, first))).toBe('OTP_INVALID');
    const session = await s.auth.verifyLoginOtp(ch.preAuthId, second);
    expect(session.user.roles).toEqual(['R-04']);
    expect(mockLogs().some((l) => l.event === 'login_berhasil')).toBe(true);
  });

  it('IP tidak terdaftar ditolak setelah OTP benar (FR-LG-10b)', async () => {
    const ch = await s.auth.login({ email: 'r.hakim@mahakam-petro.example', password: MOCK_PASSWORD });
    expect(await code(s.auth.verifyLoginOtp(ch.preAuthId, await lastCode()))).toBe('IP_NOT_ALLOWED');
  });
});

describe('Sesi (PRD Logout & Sesi)', () => {
  it('idle timeout 30 menit → ended:timeout sekali (FR-LO-06, -08)', async () => {
    await s.dev!.signInAs('u-04');
    await s.dev!.advanceClock(P.idleTimeoutMs + 1000);
    expect(await s.auth.getSession()).toEqual({ status: 'ended', reason: 'timeout' });
    expect(await s.auth.getSession()).toEqual({ status: 'none' });
  });

  it('getSession tidak dihitung aktivitas, keepAlive dihitung (FR-LO-09)', async () => {
    await s.dev!.signInAs('u-04');
    await s.dev!.advanceClock(20 * 60_000);
    await s.auth.getSession();
    await s.dev!.advanceClock(11 * 60_000);
    expect((await s.auth.getSession()).status).toBe('ended');
    await s.dev!.signInAs('u-04');
    await s.dev!.advanceClock(20 * 60_000);
    await s.auth.keepAlive();
    await s.dev!.advanceClock(11 * 60_000);
    expect((await s.auth.getSession()).status).toBe('active');
  });

  it('dicabut admin → ended:revoked (FR-LO-14, -17)', async () => {
    await s.dev!.signInAs('u-04');
    await s.dev!.simulateAdminRevoke();
    expect(await s.auth.getSession()).toEqual({ status: 'ended', reason: 'revoked' });
  });

  it('cabut sesi lain milik sendiri, bukan sesi ini (FR-LO-12)', async () => {
    await s.dev!.signInAs('u-04');
    const list = await s.sessions.listMySessions();
    expect(list.filter((x) => x.perangkatIni)).toHaveLength(1);
    const other = list.find((x) => !x.perangkatIni)!;
    await s.sessions.revokeMySession(other.id);
    expect((await s.sessions.listMySessions()).some((x) => x.id === other.id)).toBe(false);
    expect(await code(s.sessions.revokeMySession(list.find((x) => x.perangkatIni)!.id))).toBe('NOT_FOUND');
  });
});

describe('Lupa & ubah kata sandi', () => {
  it('pesan seragam; email hanya untuk akun Aktif; tautan lama batal (FR-LP-02, -03, -09)', async () => {
    await s.password.requestReset('tidak.ada@x.example');
    await s.password.requestReset('f.nugroho@andalas-energi.example'); // Ditangguhkan
    expect(await s.dev!.inbox()).toHaveLength(0);
    await s.password.requestReset('r.wiyono@andalas-energi.example');
    const first = (await s.dev!.inbox())[0]!.link!.split('/').pop()!;
    await s.dev!.advanceClock(P.resetRequestCooldownMs);
    await s.password.requestReset('r.wiyono@andalas-energi.example');
    const second = (await s.dev!.inbox())[0]!.link!.split('/').pop()!;
    expect(await s.password.checkResetToken(first)).toBe('invalid');
    expect(await s.password.checkResetToken(second)).toBe('valid');
    expect(await code(s.password.resetPassword(second, MOCK_PASSWORD))).toBe('SAME_AS_CURRENT');
    expect(await code(s.password.resetPassword(second, 'Password1'))).toBe('COMMON_PASSWORD');
    await s.password.resetPassword(second, 'Baru#Sandi2026');
    expect(await s.password.checkResetToken(second)).toBe('used');
  });

  it('ubah kata sandi: salah 5x mengunci 15 menit tanpa mencabut sesi (FR-UK-08)', async () => {
    await s.dev!.signInAs('u-04');
    for (let i = 0; i < 4; i++) expect(await code(s.password.changePassword({ current: 'x', next: 'Baru#Sandi2026' }))).toBe('CURRENT_PASSWORD_WRONG');
    expect(await code(s.password.changePassword({ current: 'x', next: 'Baru#Sandi2026' }))).toBe('CHANGE_PASSWORD_LOCKED');
    expect(await code(s.password.changePassword({ current: MOCK_PASSWORD, next: 'Baru#Sandi2026' }))).toBe('CHANGE_PASSWORD_LOCKED');
    expect((await s.auth.getSession()).status).toBe('active');
  });

  it('ubah kata sandi berhasil mencabut sesi lain saja (FR-UK-09)', async () => {
    await s.dev!.signInAs('u-04');
    const before = (await s.sessions.listMySessions()).length;
    const res = await s.password.changePassword({ current: MOCK_PASSWORD, next: 'Baru#Sandi2026' });
    expect(res.revokedSessions).toBe(before - 1);
    expect(await s.sessions.listMySessions()).toHaveLength(1);
  });
});

describe('Aktivasi (PRD Aktivasi Akun)', () => {
  it('state token T-1 dan aktivasi Diundang → Aktif (FR-AK-01, -09, -14)', async () => {
    expect((await s.activation.checkInvite('tidak-ada')).state).toBe('invalid');
    expect((await s.activation.checkInvite('undangan-maya-kedaluwarsa')).state).toBe('expired');
    const info = await s.activation.checkInvite('undangan-agus-berlaku');
    expect(info).toMatchObject({ state: 'valid', email: 'a.pranoto@andalas-energi.example' });
    await s.activation.setPendingPassword('undangan-agus-berlaku', 'Agus#Aman2026');
    const session = await s.activation.verifyActivationOtp('undangan-agus-berlaku', await lastCode());
    expect(session.user.status).toBe('Aktif');
    expect((await s.activation.checkInvite('undangan-agus-berlaku')).state).toBe('used');
  });

  it('minta undangan baru 1x per 24 jam (FR-AK-16, -17)', async () => {
    await s.activation.requestNewInvite('undangan-maya-kedaluwarsa');
    await s.activation.requestNewInvite('undangan-maya-kedaluwarsa');
    const notif = (await s.dev!.inbox()).filter((m) => m.subject === 'Permintaan undangan baru');
    expect(notif).toHaveLength(1); // satu PIC KKKS aktif di organisasi, satu kali
  });
});
