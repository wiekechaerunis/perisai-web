/**
 * Helper bersama adapter mock: waktu, log, email, OTP, dan sesi.
 * Dipakai oleh index.ts (autentikasi) dan users.ts (manajemen pengguna, Akun Saya).
 */
import { maskEmail } from '@/lib/format';
import { SECURITY_PARAMS as P } from '@/lib/security-params';
import type { SessionEndReason } from '@/lib/status';
import { activityBus } from '../activity';
import { ServiceError, type OtpChallenge, type Session } from '../types';
import { roleName } from '@/lib/rbac';
import { commit, db, iso, now, randomId, randomOtp, type DbAudit, type DbSession, type DbUser, type LogEntry, type OtpState } from './db';
import { SEED_OTHER_DEVICES } from './seed';

/* ---------- utilitas ---------- */

export const LATENCY = import.meta.env.MODE === 'test' ? 0 : 350;
export const MOCK_IP = '10.20.30.40';

export function delay(): Promise<void> {
  return LATENCY ? new Promise((r) => setTimeout(r, LATENCY)) : Promise.resolve();
}

export function userAgent(): string {
  return typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent;
}

export function log(entry: Omit<LogEntry, 'id' | 'at' | 'ip' | 'userAgent'>): void {
  const d = db();
  const orgId = entry.orgId ?? d.users.find((u) => u.id === entry.userId || (entry.email && u.email === entry.email))?.orgId;
  d.logs.push({
    ...entry,
    id: randomId('log'),
    orgId,
    sessionId: entry.sessionId ?? d.currentSessionId ?? undefined,
    at: now(),
    ip: MOCK_IP,
    userAgent: userAgent(),
  });
}

/** Catat entri Jejak Audit (Tabel J-1). `pelakuId` kosong = "Sistem" (FR-JA-06). Role & organisasi = snapshot (FR-JA-09). */
export function audit(e: Omit<DbAudit, 'id' | 'at' | 'ip' | 'userAgent' | 'pelaku' | 'pelakuRole' | 'pelakuOrganisasi' | 'korelasi'> & { korelasi?: string }): void {
  const d = db();
  const actor = e.pelakuId ? d.users.find((u) => u.id === e.pelakuId) : undefined;
  d.audit.push({
    ...e,
    id: randomId('aud'),
    at: now(),
    pelaku: actor?.nama ?? 'Sistem',
    pelakuRole: actor ? actor.roles.map((r) => `${r} ${roleName(r)}`).join(', ') : undefined,
    pelakuOrganisasi: actor ? d.orgs.find((o) => o.id === actor.orgId)?.nama : undefined,
    ip: MOCK_IP,
    userAgent: userAgent(),
    korelasi: e.korelasi ?? randomId('kor'),
  });
}

export function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findUserByEmail(email: string): DbUser | undefined {
  return db().users.find((u) => u.email === normEmail(email));
}

export function userById(id: string): DbUser {
  const u = db().users.find((x) => x.id === id);
  if (!u) throw new ServiceError('NOT_FOUND');
  return u;
}

export function orgOf(user: DbUser) {
  const org = db().orgs.find((o) => o.id === user.orgId);
  if (!org) throw new ServiceError('NOT_FOUND');
  return org;
}

export function aksesLewat(user: DbUser): boolean {
  return !!user.aksesBerakhir && new Date(user.aksesBerakhir).getTime() < now();
}

export function sendEmail(to: string, subject: string, body: string, link?: string): void {
  db().inbox.unshift({ id: randomId('mail'), to, subject, body, link, sentAt: iso(now()) });
}

export function newOtp(): OtpState {
  const t = now();
  return { code: randomOtp(P.otpLength), expiresAt: t + P.otpValidityMs, lastSentAt: t, wrong: 0, resends: 0 };
}

export function challengeOf(email: string, otp: OtpState): OtpChallenge {
  return {
    maskedEmail: maskEmail(email),
    resendAvailableAt: iso(otp.lastSentAt + P.otpResendCooldownMs),
    resendsLeft: P.otpMaxResends - otp.resends,
    serverNow: iso(now()),
  };
}

export function deviceInfo() {
  const ua = userAgent();
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /Linux/.test(ua) ? 'Linux' : 'Tidak diketahui';
  return { perangkat: /Mobi/.test(ua) ? 'Ponsel' : 'Komputer', browser, sistemOperasi: os, perkiraanLokasi: 'Jakarta, Indonesia' };
}

/** Pemeriksaan OTP bersama untuk login dan aktivasi (satu service OTP, dua konteks). */
export function checkOtp(otp: OtpState, code: string): void {
  if (!/^\d{6}$/.test(code)) throw new ServiceError('VALIDATION');
  if (now() > otp.expiresAt) throw new ServiceError('OTP_EXPIRED');
  if (code !== otp.code) {
    otp.wrong += 1;
    const remaining = P.otpMaxWrongAttempts - otp.wrong;
    if (remaining <= 0) throw new ServiceError('OTP_LOCKED');
    throw new ServiceError('OTP_INVALID', { remainingAttempts: remaining });
  }
}

export function resendOtp(otp: OtpState): void {
  if (otp.resends >= P.otpMaxResends) throw new ServiceError('OTP_RESEND_LIMIT');
  if (now() < otp.lastSentAt + P.otpResendCooldownMs) throw new ServiceError('OTP_RESEND_TOO_SOON');
  // Kirim ulang membatalkan kode sebelumnya (FR-LG-13).
  otp.code = randomOtp(P.otpLength);
  otp.expiresAt = now() + P.otpValidityMs;
  otp.lastSentAt = now();
  otp.resends += 1;
  otp.wrong = 0;
}

/* ---------- sesi ---------- */

export function sessionEnd(s: DbSession, reason: SessionEndReason): void {
  if (s.endedAt) return;
  s.endedAt = now();
  s.endReason = reason;
  log({ log: 'akses', event: `sesi_berakhir:${reason}`, userId: s.userId, result: 'berhasil' });
}

/** Evaluasi apakah sesi masih berlaku; mengakhiri sesi yang lewat batas (FR-LO-06/07, Tabel S-2). */
export function evaluate(s: DbSession): void {
  if (s.endedAt) return;
  const t = now();
  const user = userById(s.userId);
  if (t - s.lastActivity > P.idleTimeoutMs || t - s.createdAt > P.absoluteTimeoutMs) {
    sessionEnd(s, 'timeout');
    return;
  }
  // ASSUMPTION (K-15): sesi yang diakhiri karena status akun/organisasi berubah memakai pesan
  // "diakhiri oleh admin organisasi" (FR-LO-17); PRD tidak menetapkan pesan khusus.
  // FR-ORG-15 / EC-ORG-03: organisasi nonaktif → pesan "Organisasi tidak aktif".
  if (orgOf(user).status !== 'Aktif') sessionEnd(s, 'org_inactive');
  else if (user.status !== 'Aktif' || aksesLewat(user)) sessionEnd(s, 'revoked');
}

export function toSession(s: DbSession): Session {
  const user = userById(s.userId);
  const org = orgOf(user);
  return {
    sessionId: s.id,
    serverNow: iso(now()),
    idleExpiresAt: iso(Math.min(s.lastActivity + P.idleTimeoutMs, s.createdAt + P.absoluteTimeoutMs)),
    absoluteExpiresAt: iso(s.createdAt + P.absoluteTimeoutMs),
    user: {
      id: user.id,
      nama: user.nama,
      email: user.email,
      jabatan: user.jabatan,
      roles: user.roles,
      organisasi: { id: org.id, nama: org.nama, jenis: org.jenis, status: org.status },
      status: user.status,
      loginTerakhir: user.lastLogin ? iso(user.lastLogin) : undefined,
    },
  };
}

export function startSession(user: DbUser): Session {
  const t = now();
  const s: DbSession = { id: randomId('ses'), userId: user.id, createdAt: t, lastActivity: t, ...deviceInfo() };
  const d = db();
  // Tanam sesi perangkat lain sekali per pengguna agar FR-LO-11 punya contoh.
  if (!d.sessions.some((x) => x.userId === user.id)) {
    for (const dev of SEED_OTHER_DEVICES) {
      const at = t - dev.jamLalu * 3_600_000;
      d.sessions.push({ id: randomId('ses'), userId: user.id, createdAt: at, lastActivity: t - 600_000, ...dev });
    }
  }
  d.sessions.push(s);
  d.currentSessionId = s.id;
  user.lastLogin = t; // FR-LG-27
  user.loginFailures = 0; // FR-LG-23
  user.lockedUntil = undefined;
  log({ log: 'akses', event: 'login_berhasil', email: user.email, userId: user.id, result: 'berhasil' });
  return toSession(s);
}

/** Sesi aktif perangkat ini; menghitung aktivitas (idle) bila `touch`. */
export function requireSession(touch: boolean): DbSession {
  const d = db();
  const s = d.sessions.find((x) => x.id === d.currentSessionId);
  if (!s) throw new ServiceError('SESSION_EXPIRED');
  evaluate(s);
  if (s.endedAt) {
    commit();
    throw new ServiceError('SESSION_EXPIRED');
  }
  if (touch) {
    s.lastActivity = now();
    activityBus.emit();
  }
  return s;
}

export function isLive(s: DbSession): boolean {
  evaluate(s);
  return !s.endedAt;
}