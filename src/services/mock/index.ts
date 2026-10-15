/**
 * Adapter mock untuk seluruh service Core Platform. Meniru aturan backend dari PRD agar alur UI bisa diuji
 * tanpa server: status akun (S-1), lockout (FR-LG-22), OTP (FR-LG-11..15), reset (FR-LP), aktivasi (FR-AK),
 * sesi dan pencabutan (FR-LO). Setiap peristiwa dicatat ke log akses / jejak audit untuk gelombang 3.
 */
import { formatTanggalJam } from '@/lib/format';
import { meetsPolicy } from '@/lib/password';
import { SECURITY_PARAMS as P } from '@/lib/security-params';
import type { InviteTokenState, ResetTokenState } from '@/lib/status';
import {
  ServiceError,
  type ActivationService,
  type AuthService,
  type DevService,
  type DeviceSession,
  type LoginChallenge,
  type PasswordService,
  type Services,
  type SessionService,
  type SessionState,
} from '../types';
import {
  aksesLewat,
  audit,
  challengeOf,
  checkOtp,
  delay,
  findUserByEmail,
  isLive,
  log,
  MOCK_IP,
  newOtp,
  normEmail,
  orgOf,
  requireSession,
  resendOtp,
  sendEmail,
  sessionEnd,
  startSession,
  toSession,
  evaluate,
  userById,
} from './core';
import { commit, db, iso, now, randomId, resetDb, type DbUser, type InviteToken, type LogEntry } from './db';
import { COMMON_PASSWORDS } from './seed';
import { accountService, userService, devUserTools } from './users';
import { logService } from './logs';
import { emailLinkService, userEditService } from './edit';
import { userProfileService } from './profile';
import { orgService } from './orgs';
import { roleService } from './roles';


/* ---------- AuthService ---------- */

const auth: AuthService = {
  async login({ email, password }) {
    await delay();
    const user = findUserByEmail(email);
    const t = now();
    if (user?.lockedUntil && user.lockedUntil > t) {
      log({ log: 'akses', event: 'login_gagal', email: normEmail(email), result: 'gagal', reason: 'RATE_LIMITED' });
      commit();
      throw new ServiceError('RATE_LIMITED', { retryAt: iso(user.lockedUntil) });
    }
    // Email tidak terdaftar dan password salah → respons identik (FR-LG-06). Status hanya setelah password benar (FR-LG-07).
    if (!user || user.password === null || user.password !== password) {
      if (user) {
        user.loginFailures += 1;
        if (user.loginFailures >= P.loginMaxFailures) user.lockedUntil = t + P.loginLockMs;
      }
      log({ log: 'akses', event: 'login_gagal', email: normEmail(email), result: 'gagal', reason: 'INVALID_CREDENTIALS' });
      commit();
      throw new ServiceError('INVALID_CREDENTIALS');
    }
    const deny = (code: 'ACCOUNT_SUSPENDED' | 'ACCOUNT_DEACTIVATED' | 'ORG_INACTIVE') => {
      log({ log: 'akses', event: 'login_ditolak', email: user.email, userId: user.id, result: 'ditolak', reason: code });
      commit();
      return new ServiceError(code);
    };
    if (user.status === 'Ditangguhkan') throw deny('ACCOUNT_SUSPENDED');
    if (user.status === 'Nonaktif' || aksesLewat(user)) throw deny('ACCOUNT_DEACTIVATED'); // FR-LG-10
    if (user.status !== 'Aktif') throw deny('ACCOUNT_DEACTIVATED');
    if (orgOf(user).status !== 'Aktif') throw deny('ORG_INACTIVE'); // FR-LG-10a

    const d = db();
    d.preAuths = d.preAuths.filter((p) => p.userId !== user.id);
    const pre = { id: randomId('pre'), userId: user.id, createdAt: t, otp: newOtp() };
    d.preAuths.push(pre);
    sendEmail(
      user.email,
      'Kode verifikasi masuk PERISAI',
      `Kode verifikasi Anda: ${pre.otp.code}. Berlaku sampai ${formatTanggalJam(pre.otp.expiresAt)}. Jangan bagikan kode ini kepada siapa pun.`,
    );
    log({ log: 'akses', event: 'otp_dikirim', email: user.email, userId: user.id, result: 'berhasil' });
    commit();
    return { preAuthId: pre.id, ...challengeOf(user.email, pre.otp) };
  },

  async getLoginChallenge(preAuthId) {
    await delay();
    const pre = db().preAuths.find((p) => p.id === preAuthId);
    if (!pre) return null;
    return { preAuthId, ...challengeOf(userById(pre.userId).email, pre.otp) };
  },

  async verifyLoginOtp(preAuthId, code) {
    await delay();
    const d = db();
    const pre = d.preAuths.find((p) => p.id === preAuthId);
    if (!pre) throw new ServiceError('OTP_SESSION_INVALID');
    const user = userById(pre.userId);
    try {
      checkOtp(pre.otp, code);
    } catch (e) {
      if (e instanceof ServiceError && e.code === 'OTP_LOCKED') {
        // Sesi OTP dibatalkan; kegagalan dihitung ke counter lockout login (FR-LG-15).
        d.preAuths = d.preAuths.filter((p) => p.id !== preAuthId);
        user.loginFailures += 1;
        if (user.loginFailures >= P.loginMaxFailures) user.lockedUntil = now() + P.loginLockMs;
      }
      log({ log: 'akses', event: 'otp_gagal', email: user.email, userId: user.id, result: 'gagal', reason: (e as ServiceError).code });
      commit();
      throw e;
    }
    d.preAuths = d.preAuths.filter((p) => p.id !== preAuthId);
    // FR-LG-10b: pembatasan IP diperiksa setelah password dan OTP benar.
    if (orgOf(user).ipDibatasi && user.ipTidakTerdaftar) {
      log({ log: 'akses', event: 'login_ditolak', email: user.email, userId: user.id, result: 'ditolak', reason: 'IP_NOT_ALLOWED', detail: { ip: MOCK_IP } });
      commit();
      throw new ServiceError('IP_NOT_ALLOWED');
    }
    log({ log: 'akses', event: 'otp_berhasil', email: user.email, userId: user.id, result: 'berhasil' });
    const session = startSession(user);
    commit();
    return session;
  },

  async resendLoginOtp(preAuthId) {
    await delay();
    const d = db();
    const pre = d.preAuths.find((p) => p.id === preAuthId);
    if (!pre) throw new ServiceError('OTP_SESSION_INVALID');
    const user = userById(pre.userId);
    try {
      resendOtp(pre.otp);
    } catch (e) {
      if (e instanceof ServiceError && e.code === 'OTP_RESEND_LIMIT') d.preAuths = d.preAuths.filter((p) => p.id !== preAuthId);
      commit();
      throw e;
    }
    sendEmail(user.email, 'Kode verifikasi masuk PERISAI', `Kode verifikasi baru Anda: ${pre.otp.code}. Kode sebelumnya tidak berlaku lagi.`);
    log({ log: 'akses', event: 'otp_kirim_ulang', email: user.email, userId: user.id, result: 'berhasil' });
    commit();
    return { preAuthId, ...challengeOf(user.email, pre.otp) };
  },

  async cancelLoginOtp(preAuthId) {
    const d = db();
    d.preAuths = d.preAuths.filter((p) => p.id !== preAuthId);
    commit();
  },

  async getSession(): Promise<SessionState> {
    const d = db();
    const s = d.sessions.find((x) => x.id === d.currentSessionId);
    if (!s) return { status: 'none' };
    evaluate(s);
    if (s.endedAt) {
      // Pesan pengakhiran ditampilkan sekali (FR-LO-03); perangkat ini tidak lagi punya sesi.
      d.currentSessionId = null;
      commit();
      return { status: 'ended', reason: s.endReason ?? 'timeout' };
    }
    commit();
    return { status: 'active', session: toSession(s) };
  },

  async keepAlive() {
    await delay();
    const s = requireSession(true);
    commit();
    return toSession(s);
  },

  async logout() {
    await delay();
    const d = db();
    const s = d.sessions.find((x) => x.id === d.currentSessionId);
    if (s) sessionEnd(s, 'logout');
    d.currentSessionId = null;
    commit();
  },

  async logoutAllDevices() {
    await delay();
    const s = requireSession(true);
    const d = db();
    d.sessions.filter((x) => x.userId === s.userId).forEach((x) => sessionEnd(x, x.id === s.id ? 'logout' : 'revoked'));
    d.currentSessionId = null;
    commit();
  },
};

/* ---------- PasswordService ---------- */

function resetState(token: string): ResetTokenState {
  const r = db().resets.find((x) => x.token === token);
  if (!r || r.superseded) return 'invalid';
  if (r.usedAt) return 'used';
  if (now() > r.expiresAt) return 'expired';
  return 'valid';
}

function assertNewPassword(user: DbUser, pw: string): void {
  if (!meetsPolicy(pw)) throw new ServiceError('VALIDATION');
  if (COMMON_PASSWORDS.has(pw.toLowerCase())) throw new ServiceError('COMMON_PASSWORD');
  if (user.password !== null && user.password === pw) throw new ServiceError('SAME_AS_CURRENT');
}

const tokenError: Record<Exclude<ResetTokenState | InviteTokenState, 'valid'>, ServiceError['code']> = {
  invalid: 'TOKEN_INVALID',
  used: 'TOKEN_USED',
  expired: 'TOKEN_EXPIRED',
};

const password: PasswordService = {
  async requestReset(email) {
    await delay();
    const d = db();
    const key = normEmail(email);
    const t = now();
    const recent = (d.resetRequests[key] ?? []).filter((x) => t - x < 3_600_000);
    const user = findUserByEmail(key);
    const throttled =
      recent.some((x) => t - x < P.resetRequestCooldownMs) || recent.length >= P.resetRequestsPerHour;
    log({ log: 'audit', event: 'reset_diminta', email: key, userId: user?.id, result: throttled ? 'ditolak' : 'berhasil', reason: throttled ? 'BATAS_PERMINTAAN' : user ? undefined : 'EMAIL_TIDAK_TERDAFTAR' });
    if (!throttled) {
      d.resetRequests[key] = [...recent, t];
      // Hanya akun Aktif yang menerima email (FR-LP-03); respons ke UI tetap sama (FR-LP-02, -05).
      if (user && user.status === 'Aktif') {
        d.resets.filter((r) => r.userId === user.id).forEach((r) => (r.superseded = true));
        const token = randomId('rst');
        d.resets.push({ token, userId: user.id, expiresAt: t + P.resetLinkValidityMs });
        sendEmail(
          user.email,
          'Atur ulang kata sandi PERISAI',
          `Halo ${user.nama}, tautan berlaku sampai ${formatTanggalJam(t + P.resetLinkValidityMs)}. PERISAI tidak pernah meminta password atau kode OTP lewat email.`,
          `/atur-ulang-kata-sandi/${token}`,
        );
      }
    }
    commit();
  },

  async checkResetToken(token) {
    await delay();
    const state = resetState(token);
    log({ log: 'audit', event: 'reset_tautan_dibuka', result: state === 'valid' ? 'berhasil' : 'gagal', reason: state });
    commit();
    return state;
  },

  async resetPassword(token, newPassword) {
    await delay();
    const state = resetState(token);
    if (state !== 'valid') throw new ServiceError(tokenError[state]);
    const r = db().resets.find((x) => x.token === token)!;
    const user = userById(r.userId);
    assertNewPassword(user, newPassword);
    user.password = newPassword;
    r.usedAt = now();
    user.events.unshift({ id: randomId('ev'), at: now(), peristiwa: 'Kata sandi diatur ulang', pelaku: 'Pengguna', keterangan: 'Lewat tautan reset' });
    // Seluruh sesi aktif pengguna dicabut (FR-LP-14).
    const live = db().sessions.filter((s) => s.userId === user.id && isLive(s));
    live.forEach((s) => sessionEnd(s, 'password_reset'));
    sendEmail(user.email, 'Kata sandi PERISAI telah diubah', `Kata sandi Anda diubah pada ${formatTanggalJam(now())}. Bila bukan Anda, hubungi admin organisasi Anda.`);
    log({ log: 'audit', event: 'reset_berhasil', email: user.email, userId: user.id, result: 'berhasil', detail: { sesiDicabut: live.length } });
    commit();
  },

  async changePassword({ current, next }) {
    await delay();
    const s = requireSession(true);
    const user = userById(s.userId);
    const t = now();
    if (user.changePwLockedUntil && user.changePwLockedUntil > t) {
      throw new ServiceError('CHANGE_PASSWORD_LOCKED', { retryAt: iso(user.changePwLockedUntil) });
    }
    if (user.changePwLockedUntil && user.changePwLockedUntil <= t) {
      user.changePwLockedUntil = undefined;
      user.changePwFailures = 0;
    }
    if (user.password !== current) {
      user.changePwFailures += 1;
      log({ log: 'audit', event: 'ubah_sandi_gagal', userId: user.id, result: 'gagal', reason: 'CURRENT_PASSWORD_WRONG' });
      if (user.changePwFailures >= P.changePasswordMaxFailures) {
        user.changePwLockedUntil = t + P.changePasswordLockMs;
        commit();
        throw new ServiceError('CHANGE_PASSWORD_LOCKED', { retryAt: iso(user.changePwLockedUntil) });
      }
      commit();
      throw new ServiceError('CURRENT_PASSWORD_WRONG');
    }
    assertNewPassword(user, next);
    user.password = next;
    user.changePwFailures = 0;
    user.events.unshift({ id: randomId('ev'), at: t, peristiwa: 'Kata sandi diubah', pelaku: 'Pengguna' });
    // Sesi lain dicabut, sesi ini tetap hidup (FR-UK-09); tautan reset aktif dibatalkan (FR-UK-10).
    const others = db().sessions.filter((x) => x.userId === user.id && x.id !== s.id && isLive(x));
    others.forEach((x) => sessionEnd(x, 'password_changed'));
    db().resets.filter((r) => r.userId === user.id && !r.usedAt).forEach((r) => (r.superseded = true));
    sendEmail(user.email, 'Kata sandi PERISAI telah diubah', `Kata sandi Anda diubah pada ${formatTanggalJam(t)}. Bila bukan Anda, hubungi admin organisasi Anda.`);
    log({ log: 'audit', event: 'ubah_sandi_berhasil', userId: user.id, result: 'berhasil', detail: { sesiDicabut: others.length } });
    commit();
    return { revokedSessions: others.length };
  },
};

/* ---------- ActivationService ---------- */

function inviteOf(token: string): InviteToken | undefined {
  return db().invites.find((i) => i.token === token);
}

function inviteState(token: string): InviteTokenState {
  const inv = inviteOf(token);
  if (!inv || inv.revoked) return 'invalid';
  const user = userById(inv.userId);
  if (inv.usedAt || user.status === 'Aktif') return 'used';
  if (now() > inv.expiresAt || user.status === 'Kedaluwarsa') return 'expired';
  if (user.status !== 'Diundang') return 'invalid';
  return 'valid';
}

function requireValidInvite(token: string): InviteToken {
  const state = inviteState(token);
  if (state !== 'valid') throw new ServiceError(tokenError[state]);
  return inviteOf(token)!;
}

const activation: ActivationService = {
  async checkInvite(token) {
    await delay();
    const state = inviteState(token);
    const inv = inviteOf(token);
    log({ log: 'audit', event: 'aktivasi_tautan_dibuka', userId: inv?.userId, result: state === 'valid' ? 'berhasil' : 'gagal', reason: state });
    commit();
    if (state !== 'valid' || !inv) return { state };
    const user = userById(inv.userId);
    return { state, email: user.email, organisasi: orgOf(user).nama };
  },

  async setPendingPassword(token, pw) {
    await delay();
    const inv = requireValidInvite(token);
    const user = userById(inv.userId);
    assertNewPassword(user, pw);
    user.pendingPassword = pw;
    inv.otp = newOtp();
    sendEmail(user.email, 'Kode aktivasi akun PERISAI', `Kode aktivasi Anda: ${inv.otp.code}. Berlaku sampai ${formatTanggalJam(inv.otp.expiresAt)}. Jangan bagikan kode ini.`);
    log({ log: 'audit', event: 'aktivasi_otp_dikirim', userId: user.id, result: 'berhasil' });
    commit();
    return challengeOf(user.email, inv.otp);
  },

  async getActivationChallenge(token) {
    await delay();
    if (inviteState(token) !== 'valid') return null;
    const inv = inviteOf(token)!;
    if (!inv.otp) return null;
    return challengeOf(userById(inv.userId).email, inv.otp);
  },

  async resendActivationOtp(token) {
    await delay();
    const inv = requireValidInvite(token);
    if (!inv.otp) throw new ServiceError('OTP_SESSION_INVALID');
    const user = userById(inv.userId);
    try {
      resendOtp(inv.otp);
    } catch (e) {
      commit();
      throw e;
    }
    sendEmail(user.email, 'Kode aktivasi akun PERISAI', `Kode aktivasi baru Anda: ${inv.otp.code}. Kode sebelumnya tidak berlaku lagi.`);
    log({ log: 'audit', event: 'aktivasi_otp_kirim_ulang', userId: user.id, result: 'berhasil' });
    commit();
    return challengeOf(user.email, inv.otp);
  },

  async verifyActivationOtp(token, code) {
    await delay();
    const inv = requireValidInvite(token);
    if (!inv.otp) throw new ServiceError('OTP_SESSION_INVALID');
    const user = userById(inv.userId);
    try {
      checkOtp(inv.otp, code);
    } catch (e) {
      if (e instanceof ServiceError && e.code === 'OTP_LOCKED') {
        // Kembali ke Buat Password; password pending dibuang (FR-AK-12, FR-AK-15).
        inv.otp = undefined;
        user.pendingPassword = null;
      }
      log({ log: 'audit', event: 'aktivasi_otp_gagal', userId: user.id, result: 'gagal', reason: (e as ServiceError).code });
      commit();
      throw e;
    }
    user.password = user.pendingPassword ?? null;
    user.pendingPassword = null;
    user.status = 'Aktif';
    user.pernahAktif = true;
    user.newInviteRequestedAt = undefined; // FR-KU-19c
    user.events.unshift({ id: randomId('ev'), at: now(), peristiwa: 'Akun diaktifkan', pelaku: 'Pengguna', keterangan: 'Email terverifikasi' });
    inv.usedAt = now();
    inv.otp = undefined;
    log({ log: 'audit', event: 'aktivasi_berhasil', userId: user.id, result: 'berhasil', detail: { dari: 'Diundang', ke: 'Aktif' } });
    audit({ pelakuId: user.id, modul: 'M-15', aksi: 'edit', objek: `pengguna #${user.id}`, orgObjekId: user.orgId, sebelum: { Status: 'Diundang' }, sesudah: { Status: 'Aktif' }, alasan: 'Aktivasi akun', hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    const session = startSession(user);
    commit();
    return session;
  },

  async requestNewInvite(token) {
    await delay();
    const inv = inviteOf(token);
    if (!inv || inviteState(token) !== 'expired') throw new ServiceError('TOKEN_INVALID');
    const t = now();
    // Dibatasi 1x per 24 jam per token; klik berikutnya tetap tampil sukses tanpa notifikasi kedua (FR-AK-17).
    if (!inv.lastNewInviteRequestAt || t - inv.lastNewInviteRequestAt >= P.inviteRequestCooldownMs) {
      inv.lastNewInviteRequestAt = t;
      const user = userById(inv.userId);
      // FR-KU-19a: penanda "Minta undangan baru" + tanggal di tabel pengguna.
      user.newInviteRequestedAt = t;
      // ASSUMPTION (FR-AK-16 TBD): notifikasi dikirim ke semua Admin KKKS (R-04) organisasi pengguna.
      db()
        .users.filter((u) => u.orgId === user.orgId && u.roles.includes('R-04') && u.status === 'Aktif')
        .forEach((admin) => sendEmail(admin.email, 'Permintaan undangan baru', `${user.nama} (${user.email}) meminta undangan baru karena undangannya kedaluwarsa.`));
      log({ log: 'audit', event: 'minta_undangan_baru', userId: user.id, result: 'berhasil' });
    }
    commit();
  },
};

/* ---------- SessionService ---------- */

const sessions: SessionService = {
  async listMySessions() {
    await delay();
    const cur = requireSession(true);
    const list: DeviceSession[] = db()
      .sessions.filter((s) => s.userId === cur.userId && isLive(s))
      .sort((a, b) => Number(b.id === cur.id) - Number(a.id === cur.id) || b.lastActivity - a.lastActivity)
      .map((s) => ({
        id: s.id,
        perangkat: s.perangkat,
        browser: s.browser,
        sistemOperasi: s.sistemOperasi,
        perkiraanLokasi: s.perkiraanLokasi,
        waktuMasuk: iso(s.createdAt),
        aktivitasTerakhir: iso(s.lastActivity),
        perangkatIni: s.id === cur.id,
      }));
    commit();
    return list;
  },

  async revokeMySession(sessionId) {
    await delay();
    const cur = requireSession(true);
    const target = db().sessions.find((s) => s.id === sessionId && s.userId === cur.userId);
    if (!target || target.id === cur.id) throw new ServiceError('NOT_FOUND');
    sessionEnd(target, 'revoked');
    commit();
  },
};

/* ---------- DevService ---------- */

const dev: DevService = {
  async listUsers() {
    return db().users.map((u) => ({
      id: u.id,
      nama: u.nama,
      email: u.email,
      roles: u.roles,
      organisasi: orgOf(u).nama,
      status: u.status,
      catatan: u.catatan,
    }));
  },
  async signInAs(userId) {
    const user = userById(userId);
    const d = db();
    const cur = d.sessions.find((s) => s.id === d.currentSessionId);
    if (cur) sessionEnd(cur, 'logout');
    const session = startSession(user);
    commit();
    return session;
  },
  async inbox() {
    return [...db().inbox];
  },
  async clearInbox() {
    db().inbox = [];
    commit();
  },
  async advanceClock(ms) {
    db().clockOffset += ms;
    commit();
  },
  async simulateAdminRevoke() {
    const d = db();
    const cur = d.sessions.find((s) => s.id === d.currentSessionId);
    if (!cur) return;
    d.sessions.filter((s) => s.userId === cur.userId).forEach((s) => sessionEnd(s, 'revoked'));
    commit();
  },
  async simulateStatusChange(status) {
    const d = db();
    const cur = d.sessions.find((s) => s.id === d.currentSessionId);
    if (!cur) return;
    userById(cur.userId).status = status;
    d.sessions.filter((s) => s.userId === cur.userId).forEach((s) => sessionEnd(s, 'revoked'));
    commit();
  },
  async issueTestLink(kind, state) {
    const d = db();
    const t = now();
    if (kind === 'reset') {
      const user = userById('u-04');
      const token = randomId('rst');
      d.resets.push({
        token,
        userId: user.id,
        expiresAt: state === 'expired' ? t - 1 : t + P.resetLinkValidityMs,
        usedAt: state === 'used' ? t : undefined,
      });
      commit();
      return `/atur-ulang-kata-sandi/${token}`;
    }
    const user = userById('u-10');
    const token = randomId('inv');
    d.invites.filter((i) => i.userId === user.id).forEach((i) => (i.revoked = true));
    d.invites.push({
      token,
      userId: user.id,
      expiresAt: state === 'expired' ? t - 1 : t + P.inviteValidityDays * 86_400_000,
      usedAt: state === 'used' ? t : undefined,
    });
    commit();
    return `/aktivasi/${token}`;
  },
  async reset() {
    resetDb();
  },
  decideEmailRequest: devUserTools.decideEmailRequest,
  failNextEmail: devUserTools.failNextEmail,
  simulateRoleChange: devUserTools.simulateRoleChange,
};

export const mockServices: Services = { auth, password, activation, sessions, users: { ...userService, ...userEditService, ...userProfileService }, account: accountService, logs: logService, emailLinks: emailLinkService, orgs: orgService, roles: roleService, dev };

/** Untuk test: akses log yang dicatat mock. */
export function mockLogs(): LogEntry[] {
  return db().logs;
}

export type { LoginChallenge };
