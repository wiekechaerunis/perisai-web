/**
 * Adapter HTTP. Endpoint di bawah adalah USULAN kontrak (perlu konfirmasi Tech Lead; PRD 2FA menyebut
 * Zitadel di belakang BFF). Sesi memakai cookie httpOnly + secure (NFR Logout & Sesi), jadi tidak ada
 * token di localStorage. Error backend diharapkan berbentuk { code: ServiceErrorCode, meta?: {...} }.
 */
import { activityBus } from '../activity';
import { ServiceError, type ServiceErrorCode, type Services, type SessionState } from '../types';

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function http<T>(method: string, path: string, body?: unknown, opts: { activity?: boolean } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ServiceError('NETWORK');
  }
  if (opts.activity !== false) activityBus.emit();
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as { code?: ServiceErrorCode; meta?: ServiceError['meta'] };
  if (!res.ok) throw new ServiceError(data.code ?? (res.status === 401 ? 'SESSION_EXPIRED' : 'NETWORK'), data.meta);
  return data as T;
}

/** Query string dari objek filter (nilai kosong dibuang). */
function qs(o: object): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '' && v !== false) p.set(k, String(v));
  return p.toString();
}

export const apiServices: Services = {
  auth: {
    login: (input) => http('POST', '/auth/login', input),
    getLoginChallenge: (id) => http('GET', `/auth/login/${encodeURIComponent(id)}`, undefined, { activity: false }),
    verifyLoginOtp: (id, code) => http('POST', `/auth/login/${encodeURIComponent(id)}/otp`, { code }),
    resendLoginOtp: (id) => http('POST', `/auth/login/${encodeURIComponent(id)}/otp/resend`),
    cancelLoginOtp: (id) => http('DELETE', `/auth/login/${encodeURIComponent(id)}`),
    getSession: () => http<SessionState>('GET', '/auth/session', undefined, { activity: false }),
    keepAlive: () => http('POST', '/auth/session/keep-alive'),
    logout: () => http('POST', '/auth/logout'),
    logoutAllDevices: () => http('POST', '/auth/logout-all'),
  },
  password: {
    requestReset: (email) => http('POST', '/password/reset-requests', { email }),
    checkResetToken: async (token) =>
      (await http<{ state: Awaited<ReturnType<Services['password']['checkResetToken']>> }>('GET', `/password/reset/${encodeURIComponent(token)}`)).state,
    resetPassword: (token, newPassword) => http('POST', `/password/reset/${encodeURIComponent(token)}`, { newPassword }),
    changePassword: (input) => http('POST', '/me/password', input),
  },
  activation: {
    checkInvite: (token) => http('GET', `/invitations/${encodeURIComponent(token)}`),
    setPendingPassword: (token, password) => http('POST', `/invitations/${encodeURIComponent(token)}/password`, { password }),
    getActivationChallenge: (token) => http('GET', `/invitations/${encodeURIComponent(token)}/otp`),
    resendActivationOtp: (token) => http('POST', `/invitations/${encodeURIComponent(token)}/otp/resend`),
    verifyActivationOtp: (token, code) => http('POST', `/invitations/${encodeURIComponent(token)}/otp`, { code }),
    requestNewInvite: (token) => http('POST', `/invitations/${encodeURIComponent(token)}/renewal-requests`),
  },
  sessions: {
    listMySessions: () => http('GET', '/me/sessions'),
    revokeMySession: (id) => http('DELETE', `/me/sessions/${encodeURIComponent(id)}`),
  },
  users: {
    listUsers: (q = {}) => {
      const params = new URLSearchParams();
      if (q.search) params.set('search', q.search);
      if (q.status) params.set('status', q.status);
      if (q.organisasiId) params.set('organisasiId', q.organisasiId);
      if (q.mintaUndanganBaru) params.set('mintaUndanganBaru', 'true');
      if (q.role) params.set('role', q.role);
      return http('GET', `/users?${params.toString()}`);
    },
    getUser: (id) => http('GET', `/users/${encodeURIComponent(id)}`),
    listOrganisasi: () => http('GET', '/organisasi?untuk=undangan'),
    listWilayahKerja: (orgId) => http('GET', `/organisasi/${encodeURIComponent(orgId)}/wilayah-kerja?aktif=true`),
    invite: (input) => http('POST', '/invitations', input),
    resendInvite: (id) => http('POST', `/users/${encodeURIComponent(id)}/invitation/resend`),
    cancelInvite: (id, reason) => http('POST', `/users/${encodeURIComponent(id)}/invitation/cancel`, reason),
    suspend: (id, reason) => http('POST', `/users/${encodeURIComponent(id)}/suspend`, reason),
    deactivate: (id, reason) => http('POST', `/users/${encodeURIComponent(id)}/deactivate`, reason),
    reactivate: (id) => http('POST', `/users/${encodeURIComponent(id)}/reactivate`),
    setAccessEnd: (id, date) => http('PUT', `/users/${encodeURIComponent(id)}/access-end`, { date }),
    revokeSessions: (id, reason) => http('POST', `/users/${encodeURIComponent(id)}/sessions/revoke`, reason),
    effectiveAccess: (id) => http('GET', `/users/${encodeURIComponent(id)}/effective-access`),
    // PRD Ekspor Daftar Pengguna & Profil Pengguna (usulan endpoint)
    exportUsers: async (q, format) => {
      const params = new URLSearchParams({ format });
      if (q.search) params.set('search', q.search);
      if (q.status) params.set('status', q.status);
      if (q.organisasiId) params.set('organisasiId', q.organisasiId);
      if (q.role) params.set('role', q.role);
      return http('GET', `/users/export?${params.toString()}`);
    },
    resetPassword: (id) => http('POST', `/users/${encodeURIComponent(id)}/password-reset`),
    userSessions: (id) => http('GET', `/users/${encodeURIComponent(id)}/sessions`),
    revokeUserSession: (id, sid, reason) => http('POST', `/users/${encodeURIComponent(id)}/sessions/${encodeURIComponent(sid)}/revoke`, reason),
    // PRD Ubah Data & Role Pengguna (usulan endpoint)
    previewUpdate: (id, input) => http('POST', `/users/${encodeURIComponent(id)}/changes/preview`, input),
    updateUser: (id, input) => http('PATCH', `/users/${encodeURIComponent(id)}`, input),
    listEmailRequests: () => http('GET', '/email-requests?status=menunggu-persetujuan'),
    approveEmailRequest: (id) => http('POST', `/email-requests/${encodeURIComponent(id)}/approve`),
    rejectEmailRequest: (id, alasan) => http('POST', `/email-requests/${encodeURIComponent(id)}/reject`, { alasan }),
  },
  // PRD Kelola Organisasi KKKS — endpoint dari Catatan Teknis (rute /admin/organizations)
  orgs: {
    list: (q = {}) => http('GET', `/admin/organizations?${new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]).toString()}`),
    get: (kode) => http('GET', `/admin/organizations/${encodeURIComponent(kode)}`),
    nextKode: () => http('GET', '/admin/organizations/next-code'),
    domainUsedElsewhere: (domain, kode) => http('GET', `/admin/organization-domains/${encodeURIComponent(domain)}?exclude=${encodeURIComponent(kode ?? '')}`),
    create: (input) => http('POST', '/admin/organizations', input),
    update: (kode, input) => http('PATCH', `/admin/organizations/${encodeURIComponent(kode)}`, input),
    addDomain: (kode, domain) => http('POST', `/admin/organizations/${encodeURIComponent(kode)}/domains`, { domain }),
    domainImpact: (kode, domain) => http('GET', `/admin/organizations/${encodeURIComponent(kode)}/domains/${encodeURIComponent(domain)}`),
    removeDomain: (kode, domain) => http('DELETE', `/admin/organizations/${encodeURIComponent(kode)}/domains/${encodeURIComponent(domain)}`),
    impact: (kode) => http('GET', `/admin/organizations/${encodeURIComponent(kode)}/impact`),
    deactivate: (kode, reason, konfirmasiKode) => http('POST', `/admin/organizations/${encodeURIComponent(kode)}/deactivate`, { ...reason, konfirmasiKode }),
    reactivate: (kode) => http('POST', `/admin/organizations/${encodeURIComponent(kode)}/reactivate`),
    addAllowedEmail: (kode, input) => http('POST', `/admin/organizations/${encodeURIComponent(kode)}/email-allowlist`, input),
    updateAllowedEmail: (kode, id, berlakuSampai) => http('PATCH', `/admin/organizations/${encodeURIComponent(kode)}/email-allowlist/${encodeURIComponent(id)}`, { berlakuSampai }),
    removeAllowedEmail: (kode, id, opsi) => http('DELETE', `/admin/organizations/${encodeURIComponent(kode)}/email-allowlist/${encodeURIComponent(id)}`, opsi),
    addWorkArea: (kode, input) => http('POST', `/admin/organizations/${encodeURIComponent(kode)}/work-areas`, input),
    renameWorkArea: (_kode, wkId, nama) => http('PATCH', `/admin/work-areas/${encodeURIComponent(wkId)}`, { nama }),
    setWorkAreaStatus: (_kode, wkId, aktif, alasan) => http('PATCH', `/admin/work-areas/${encodeURIComponent(wkId)}`, { aktif, alasan }),
    history: (kode) => http('GET', `/admin/organizations/${encodeURIComponent(kode)}/history`),
  },
  // PRD Katalog Role & Aktif/Nonaktif Role (usulan endpoint)
  roles: {
    catalog: () => http('GET', '/roles/catalog'),
    list: () => http('GET', '/admin/roles'),
    get: (id) => http('GET', `/admin/roles/${encodeURIComponent(id)}`),
    rename: (id, input) => http('PATCH', `/admin/roles/${encodeURIComponent(id)}`, input),
    previewMove: (from, to) => http('GET', `/admin/roles/${encodeURIComponent(from)}/move-preview?to=${encodeURIComponent(to)}`),
    deactivate: (id, opsi) => http('POST', `/admin/roles/${encodeURIComponent(id)}/deactivate`, opsi),
    reactivate: (id) => http('POST', `/admin/roles/${encodeURIComponent(id)}/reactivate`),
    moveUsers: (from, to) => http('POST', `/admin/roles/${encodeURIComponent(from)}/move-users`, { to }),
    create: (input) => http('POST', '/admin/roles', input),
    updatePermissions: (id, izin) => http('PUT', `/admin/roles/${encodeURIComponent(id)}/permissions`, { izin }),
    remove: (id) => http('DELETE', `/admin/roles/${encodeURIComponent(id)}`),
  },
  emailLinks: {
    checkVerifyLink: (token) => http('GET', `/email-links/verify/${encodeURIComponent(token)}`),
    confirmVerifyLink: (token) => http('POST', `/email-links/verify/${encodeURIComponent(token)}`),
    checkNotMeLink: (token) => http('GET', `/email-links/not-me/${encodeURIComponent(token)}`),
    confirmNotMe: (token) => http('POST', `/email-links/not-me/${encodeURIComponent(token)}`),
  },
  logs: {
    accessLog: (q) => http('GET', `/access-log?${qs(q)}`),
    accessEntry: (id) => http('GET', `/access-log/${encodeURIComponent(id)}`),
    exportAccessLog: (q) => http('GET', `/access-log/export?${qs(q)}`),
    activeSessions: (q = {}) => http('GET', `/sessions?${qs(q)}`),
    revokeSession: (id, reason) => http('POST', `/sessions/${encodeURIComponent(id)}/revoke`, reason),
    myLoginHistory: () => http('GET', '/me/login-history'),
    audit: (q) => http('GET', `/audit?${qs(q)}`),
    auditEntry: (id) => http('GET', `/audit/${encodeURIComponent(id)}`),
    exportAudit: (q) => http('GET', `/audit/export?${qs(q)}`),
    retention: () => http('GET', '/audit/retention'),
    setRetention: (p) => http('PUT', '/audit/retention', p),
  },
  account: {
    getMe: () => http('GET', '/me'),
    updateProfile: (input) => http('PATCH', '/me', input),
    requestEmailChange: (input) => http('POST', '/me/email-requests', input),
    verifyEmailChange: (code) => http('POST', '/me/email-requests/verify', { code }),
    resendEmailCode: () => http('POST', '/me/email-requests/resend'),
    cancelEmailChange: () => http('DELETE', '/me/email-requests'),
    dismissEmailRejection: () => http('DELETE', '/me/email-requests/rejected'),
  },
  // Modul operasional (prototype kick-off): endpoint USULAN, belum disepakati Tech Lead.
  ops: {
    refs: () => http('GET', '/ops/refs'),
    workspace: () => http('GET', '/workspace'),
    incidents: {
      list: (q = {}) => http('GET', `/incidents?${qs(q)}`),
      get: (id) => http('GET', `/incidents/${encodeURIComponent(id)}`),
      report: (input) => http('POST', '/incidents', input),
      verify: (id) => http('POST', `/incidents/${encodeURIComponent(id)}/verify`),
      sendBack: (id, alasan) => http('POST', `/incidents/${encodeURIComponent(id)}/send-back`, { alasan }),
      assign: (id, pic) => http('POST', `/incidents/${encodeURIComponent(id)}/assign`, { pic }),
      addAction: (id, catatan) => http('POST', `/incidents/${encodeURIComponent(id)}/actions`, { catatan }),
      close: (id, input) => http('POST', `/incidents/${encodeURIComponent(id)}/close`, input),
    },
    wpb: {
      list: () => http('GET', '/wpb/periods'),
      get: (id) => http('GET', `/wpb/periods/${encodeURIComponent(id)}`),
      summary: () => http('GET', '/wpb/summary'),
      save: (id, lines) => http('PUT', `/wpb/periods/${encodeURIComponent(id)}`, { lines }),
      submit: (id, lines) => http('POST', `/wpb/periods/${encodeURIComponent(id)}/submit`, { lines }),
      sendBack: (id, alasan) => http('POST', `/wpb/periods/${encodeURIComponent(id)}/send-back`, { alasan }),
      finalize: (id) => http('POST', `/wpb/periods/${encodeURIComponent(id)}/finalize`),
      uploadSigned: (id, namaFile) => http('POST', `/wpb/periods/${encodeURIComponent(id)}/signed-document`, { namaFile }),
    },
    contracts: {
      list: () => http('GET', '/contracts'),
      get: (id) => http('GET', `/contracts/${encodeURIComponent(id)}`),
      create: (input) => http('POST', '/contracts', input),
    },
    pks: () => http('GET', '/partnerships'),
    followUps: () => http('GET', '/follow-ups'),
    notifications: {
      list: () => http('GET', '/notifications'),
      markAllRead: () => http('POST', '/notifications/read-all'),
    },
    executive: () => http('GET', '/dashboard/executive'),
    heatmap: () => http('GET', '/dashboard/heatmap'),
    resetDemo: async () => undefined,
  },
};
