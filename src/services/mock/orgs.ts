/**
 * Adapter mock PRD Kelola Organisasi KKKS (ClickUp z8pmx9pc63, FR-ORG-01..30, 40..45). Pembatasan IP (FR-ORG-31..39)
 * tidak dibangun (Q-9, keputusan PM 14 Okt 2026).
 * Kewenangan (NFR Security, FR-ORG-40): R-03 semua aksi; R-07 tambah organisasi + domain + email diizinkan;
 * R-04 baca organisasinya sendiri (FR-ORG-20, tanpa alasan internal). Penolakan dicatat di Jejak Audit (PR-03).
 */
import {
  ALASAN_NONAKTIF_ORG,
  BADAN_HUKUM_MAX,
  DOMAIN_PATTERN,
  EMAIL_PATTERN,
  KODE_PATTERN,
  MAX_ALLOWED_EMAILS,
  MAX_DOMAINS,
  ORG_NAMA_MAX,
  ORG_NAMA_MIN,
  domainMatches,
  emailDomainOf,
  isPersonalDomain,
  maxAllowDate,
  nextKkksKode,
  normDomain,
} from '@/lib/org-rules';
import { ALASAN_LAINNYA_MAX, ALASAN_NONAKTIF } from '@/lib/user-rules';
import { formatTanggalJam } from '@/lib/format';
import {
  ServiceError,
  type AllowedEmail,
  type OrgDetail,
  type OrgHistoryEntry,
  type OrgImpact,
  type OrgService,
  type OrgSummary,
  type ReasonInput,
} from '../types';
import { audit, delay, normEmail, sendEmail, sessionEnd } from './core';
import { commit, db, iso, now, randomId, type DbUser } from './db';
import { wkOperatedBy, type SeedOrg } from './seed';
import { actor, activeAdmins, cancelPendingEmail, event, liveSessions, objekPengguna } from './users';

type Level = 'admin' | 'teknis' | 'baca';

const objekOrg = (o: SeedOrg) => `organisasi ${o.kode}`;
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(now()));

function deny(a: DbUser, o: SeedOrg | undefined, aksi: 'view' | 'create' | 'edit' | 'manage'): never {
  audit({ pelakuId: a.id, modul: 'M-15', aksi, objek: o ? objekOrg(o) : 'organisasi', orgObjekId: o?.id, hasil: 'Ditolak', alasan: 'Tidak punya izin', kelompok: 'Penolakan akses' });
  commit();
  throw new ServiceError('PERMISSION_DENIED');
}

function levelOf(a: DbUser): Level | null {
  if (a.roles.includes('R-03')) return 'admin';
  if (a.roles.includes('R-07')) return 'teknis';
  if (a.roles.includes('R-04')) return 'baca';
  return null;
}

/** Organisasi berdasarkan kode; Admin KKKS hanya organisasinya (lainnya 404, FR-ORG-20). */
function orgFor(a: DbUser, kode: string): { o: SeedOrg; level: Level } {
  const level = levelOf(a);
  const o = db().orgs.find((x) => x.kode === kode);
  if (!level) deny(a, o, 'view');
  if (!o || (level === 'baca' && o.id !== a.orgId)) throw new ServiceError('NOT_FOUND');
  return { o, level };
}

function need(a: DbUser, o: SeedOrg, level: Level, allowed: Level[], aksi: 'create' | 'edit' | 'manage'): void {
  if (!allowed.includes(level)) deny(a, o, aksi);
}

function bump(o: SeedOrg): void {
  o.versi = (o.versi ?? 1) + 1;
}

/** FR-ORG-40: perubahan oleh Admin Teknis diberitahukan ke Admin SKK. */
function notifyIfTeknis(a: DbUser, o: SeedOrg, apa: string): void {
  if (levelOf(a) !== 'teknis') return;
  activeAdmins('R-03').forEach((x) => sendEmail(x.email, 'Perubahan organisasi oleh Admin Teknis', `${a.nama} ${apa} pada ${o.nama} (${o.kode}).`));
}

function usersOf(o: SeedOrg): DbUser[] {
  return db().users.filter((u) => u.orgId === o.id);
}

function allowStatus(o: SeedOrg, e: NonNullable<SeedOrg['emailAllow']>[number]): AllowedEmail['status'] {
  // EC-ORG-11: domain email kini terdaftar di organisasi → tidak diperlukan lagi.
  if (o.domains.some((d) => domainMatches(emailDomainOf(e.email), d))) return 'Tidak diperlukan lagi';
  return e.berlakuSampai && e.berlakuSampai < today() ? 'Kedaluwarsa' : 'Aktif';
}

function toSummary(o: SeedOrg): OrgSummary {
  const users = usersOf(o);
  const pic = users.filter((u) => u.roles.includes('R-04') && u.status === 'Aktif');
  return {
    id: o.id,
    kode: o.kode,
    nama: o.nama,
    jenis: o.jenis,
    status: o.status,
    domains: o.domains,
    emailDiizinkan: (o.emailAllow ?? []).length,
    penggunaAktif: users.filter((u) => u.status === 'Aktif').length,
    picAktif: pic.length,
    tanpaPic: o.jenis === 'KKKS' && o.status === 'Aktif' && pic.length === 0,
  };
}

function toDetail(o: SeedOrg, level: Level): OrgDetail {
  const d = db();
  const users = usersOf(o);
  const s = toSummary(o);
  return {
    ...s,
    badanHukum: o.badanHukum,
    skema: o.skema,
    versi: o.versi ?? 1,
    picNama: users.filter((u) => u.roles.includes('R-04') && u.status === 'Aktif').map((u) => u.nama),
    undanganTertunda: users.filter((u) => u.status === 'Diundang').length,
    sesiAktif: users.reduce((n, u) => n + liveSessions(u).length, 0),
    domainDetail: o.domains.map((domain) => ({
      domain,
      pengguna: users.filter((u) => u.status !== 'Diundang' && u.status !== 'Kedaluwarsa' && domainMatches(emailDomainOf(u.email), domain)).length,
      undanganTertunda: users.filter((u) => u.status === 'Diundang' && domainMatches(emailDomainOf(u.email), domain)).length,
    })),
    emailDiizinkanDaftar: (o.emailAllow ?? []).map((e) => ({
      id: e.id,
      email: e.email,
      alasan: level === 'baca' ? undefined : e.alasan,
      berlakuSampai: e.berlakuSampai,
      status: allowStatus(o, e),
      pribadi: isPersonalDomain(emailDomainOf(e.email)),
      akunAktif: users.filter((u) => u.email === e.email && u.status === 'Aktif').length,
    })),
    wilayahKerja: d.wk
      .filter((w) => wkOperatedBy(w, o.id))
      .map((w) => ({
        id: w.id,
        kode: w.kode,
        nama: w.nama,
        aktif: w.aktif,
        dioperasikanBersama: (w.operatorIds ?? []).length > 0 || w.orgId !== o.id,
        pelapor: users.filter((u) => u.roles.includes('R-05') && u.wilayahKerjaIds.includes(w.id)).length,
      })),
    nonaktif: o.status === 'Nonaktif' && o.nonaktif ? { sejak: iso(o.nonaktif.at), alasan: o.nonaktif.alasan } : undefined,
    dapatDinonaktifkan: o.jenis === 'KKKS',
  };
}

function checkNama(nama: string, exceptId?: string): string {
  const n = nama.trim();
  if (!n) throw new ServiceError('VALIDATION', { field: 'nama', value: 'kosong' });
  if (n.length < ORG_NAMA_MIN || n.length > ORG_NAMA_MAX) throw new ServiceError('VALIDATION', { field: 'nama' });
  if (db().orgs.some((o) => o.id !== exceptId && o.nama.toLowerCase() === n.toLowerCase())) throw new ServiceError('ORG_NAME_TAKEN', { field: 'nama' });
  return n;
}

function checkDomain(raw: string, o?: SeedOrg): string {
  const d = normDomain(raw);
  if (!DOMAIN_PATTERN.test(d)) throw new ServiceError('VALIDATION', { field: 'domain', value: d });
  if (isPersonalDomain(d)) throw new ServiceError('EMAIL_PERSONAL', { field: 'domain', value: d });
  if (o?.domains.includes(d)) throw new ServiceError('DOMAIN_DUPLICATE', { field: 'domain', value: d });
  return d;
}

function checkAllowDate(email: string, berlakuSampai?: string): void {
  const pribadi = isPersonalDomain(emailDomainOf(email));
  if (pribadi && !berlakuSampai) throw new ServiceError('ALLOW_DATE_REQUIRED', { field: 'berlakuSampai' });
  if (berlakuSampai && (berlakuSampai < today() || berlakuSampai > maxAllowDate(new Date(now())))) {
    throw new ServiceError('VALIDATION', { field: 'berlakuSampai' });
  }
}

function impactOf(o: SeedOrg): OrgImpact {
  const users = usersOf(o);
  return {
    pengguna: users.filter((u) => u.status === 'Aktif').length,
    sesi: users.reduce((n, u) => n + liveSessions(u).length, 0),
    undangan: users.filter((u) => u.status === 'Diundang').length,
  };
}

function reasonText(r: ReasonInput): string {
  return r.alasan === 'Lainnya' ? `Lainnya: ${r.penjelasan?.trim()}` : r.alasan;
}

export const orgService: OrgService = {
  async list(q = {}) {
    await delay();
    const a = actor();
    const level = levelOf(a);
    if (!level) deny(a, undefined, 'view');
    const term = q.search?.trim().toLowerCase();
    return db()
      .orgs.filter((o) => level !== 'baca' || o.id === a.orgId)
      .filter((o) => !q.jenis || o.jenis === q.jenis)
      .filter((o) => !q.status || o.status === q.status)
      .filter((o) => !term || o.nama.toLowerCase().includes(term) || o.kode.toLowerCase().includes(term) || o.domains.some((d) => d.includes(term)))
      .map(toSummary)
      .sort((x, y) => x.nama.localeCompare(y.nama, 'id'));
  },

  async get(kode) {
    await delay();
    const a = actor();
    const { o, level } = orgFor(a, kode);
    return toDetail(o, level);
  },

  async nextKode() {
    await delay();
    return nextKkksKode(db().orgs.map((o) => o.kode));
  },

  async domainUsedElsewhere(domain, kode) {
    await delay();
    const d = normDomain(domain);
    return db().orgs.some((o) => o.kode !== kode && o.domains.includes(d));
  },

  async create(input) {
    await delay();
    const a = actor();
    const level = levelOf(a);
    if (level !== 'admin' && level !== 'teknis') deny(a, undefined, 'create');
    const d = db();
    const nama = checkNama(input.nama);
    const kode = input.kode.trim().toUpperCase();
    if (!kode) throw new ServiceError('VALIDATION', { field: 'kode', value: 'kosong' });
    if (!KODE_PATTERN.test(kode)) throw new ServiceError('VALIDATION', { field: 'kode' });
    // EC-ORG-01: kode unik.
    if (d.orgs.some((o) => o.kode === kode)) throw new ServiceError('ORG_CODE_TAKEN', { field: 'kode' });
    if ((input.badanHukum ?? '').length > BADAN_HUKUM_MAX) throw new ServiceError('VALIDATION', { field: 'badanHukum' });
    const domains = [...new Set(input.domains.map((x) => checkDomain(x)))];
    if (!domains.length) throw new ServiceError('VALIDATION', { field: 'domain', value: 'kosong' });
    if (domains.length > MAX_DOMAINS) throw new ServiceError('DOMAIN_LIMIT', { field: 'domain' });
    const o: SeedOrg = {
      id: randomId('org'),
      kode,
      nama,
      jenis: 'KKKS',
      status: 'Aktif',
      domains,
      badanHukum: input.badanHukum?.trim() || undefined,
      skema: input.skema,
      emailAllow: [],
      versi: 1,
    };
    d.orgs.push(o);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'create', objek: objekOrg(o), orgObjekId: o.id, sesudah: { Nama: nama, Kode: kode, Domain: domains.join(', ') }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    notifyIfTeknis(a, o, 'menambahkan organisasi');
    commit();
    return toDetail(o, level);
  },

  async update(kode, input) {
    await delay();
    const a = actor();
    const { o, level } = orgFor(a, kode);
    need(a, o, level, ['admin'], 'edit');
    // FR-ORG-11: diubah admin lain lebih dulu.
    if ((o.versi ?? 1) !== input.versi) throw new ServiceError('VERSION_CONFLICT');
    const nama = checkNama(input.nama, o.id);
    if ((input.badanHukum ?? '').length > BADAN_HUKUM_MAX) throw new ServiceError('VALIDATION', { field: 'badanHukum' });
    const sebelum: Record<string, string> = {};
    const sesudah: Record<string, string> = {};
    const set = (label: string, from: string | undefined, to: string | undefined) => {
      if ((from ?? '') !== (to ?? '')) {
        sebelum[label] = from ?? '—';
        sesudah[label] = to ?? '—';
      }
    };
    set('Nama organisasi', o.nama, nama);
    set('Nama badan hukum', o.badanHukum, input.badanHukum?.trim() || undefined);
    set('Skema kontrak', o.skema, input.skema);
    if (!Object.keys(sesudah).length) throw new ServiceError('NO_CHANGES');
    o.nama = nama;
    o.badanHukum = input.badanHukum?.trim() || undefined;
    o.skema = input.skema;
    bump(o);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekOrg(o), orgObjekId: o.id, sebelum, sesudah, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
    return toDetail(o, level);
  },

  async addDomain(kode, domain) {
    await delay();
    const a = actor();
    const { o, level } = orgFor(a, kode);
    need(a, o, level, ['admin', 'teknis'], 'edit');
    if (o.domains.length >= MAX_DOMAINS) throw new ServiceError('DOMAIN_LIMIT', { field: 'domain' });
    const d = checkDomain(domain, o);
    o.domains = [...o.domains, d];
    bump(o);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekOrg(o), orgObjekId: o.id, sesudah: { 'Domain ditambahkan': d }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    notifyIfTeknis(a, o, `menambahkan domain ${d}`);
    commit();
    return toDetail(o, level);
  },

  async domainImpact(kode, domain) {
    await delay();
    const a = actor();
    const { o, level } = orgFor(a, kode);
    const row = toDetail(o, level).domainDetail.find((x) => x.domain === domain);
    if (!row) throw new ServiceError('NOT_FOUND');
    return row;
  },

  async removeDomain(kode, domain) {
    await delay();
    const a = actor();
    const { o, level } = orgFor(a, kode);
    need(a, o, level, ['admin', 'teknis'], 'edit');
    if (!o.domains.includes(domain)) throw new ServiceError('NOT_FOUND');
    if (o.jenis === 'KKKS' && o.domains.length === 1) throw new ServiceError('DOMAIN_LAST');
    o.domains = o.domains.filter((x) => x !== domain);
    // FR-ORG-12, EC-ORG-04: undangan tertunda ke domain itu tidak berlaku lagi (kecuali email diizinkan).
    const d = db();
    let dibatalkan = 0;
    usersOf(o)
      .filter((u) => (u.status === 'Diundang' || u.status === 'Kedaluwarsa') && domainMatches(emailDomainOf(u.email), domain))
      .filter((u) => !o.domains.some((x) => domainMatches(emailDomainOf(u.email), x)) && !(o.emailAllow ?? []).some((e) => e.email === u.email))
      .forEach((u) => {
        d.invites.filter((i) => i.userId === u.id).forEach((i) => (i.revoked = true));
        event(u, 'Undangan tidak berlaku', a.nama, `Domain ${domain} dihapus dari organisasi.`);
        dibatalkan += 1;
      });
    bump(o);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekOrg(o), orgObjekId: o.id, sebelum: { Domain: domain }, sesudah: { 'Domain dihapus': domain, 'Undangan dibatalkan': String(dibatalkan) }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    notifyIfTeknis(a, o, `menghapus domain ${domain}`);
    commit();
    return toDetail(o, level);
  },

  async impact(kode) {
    await delay();
    const a = actor();
    const { o } = orgFor(a, kode);
    return impactOf(o);
  },

  async deactivate(kode, reason, konfirmasiKode) {
    await delay();
    const a = actor();
    const { o, level } = orgFor(a, kode);
    need(a, o, level, ['admin'], 'manage');
    // FR-ORG-13: SKK Migas dan Kontraktor tidak dapat dinonaktifkan.
    if (o.jenis !== 'KKKS') deny(a, o, 'manage');
    if (o.status !== 'Aktif') throw new ServiceError('NOT_ELIGIBLE');
    if (!reason.alasan || !(ALASAN_NONAKTIF_ORG as readonly string[]).includes(reason.alasan)) throw new ServiceError('VALIDATION', { field: 'alasan' });
    if (reason.alasan === 'Lainnya' && (!reason.penjelasan?.trim() || reason.penjelasan.length > ALASAN_LAINNYA_MAX)) throw new ServiceError('VALIDATION', { field: 'penjelasan' });
    if (konfirmasiKode.trim() !== o.kode) throw new ServiceError('CODE_MISMATCH', { field: 'konfirmasi' });
    const before = impactOf(o);
    const alasan = reasonText(reason);
    o.status = 'Nonaktif';
    o.nonaktif = { at: now(), alasan, oleh: a.nama };
    bump(o);
    // FR-ORG-15: seluruh sesi berakhir ≤ 30 detik; status akun tidak berubah.
    usersOf(o).forEach((u) => {
      liveSessions(u).forEach((s) => sessionEnd(s, 'org_inactive'));
      cancelPendingEmail(u, 'Organisasi dinonaktifkan.');
    });
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'manage', objek: objekOrg(o), orgObjekId: o.id, sebelum: { Status: 'Aktif' }, sesudah: { Status: 'Nonaktif', 'Pengguna terdampak': String(before.pengguna) }, alasan, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    // FR-ORG-19: email ke Admin SKK lain dan Admin KKKS organisasi itu.
    const waktu = formatTanggalJam(now());
    activeAdmins('R-03').filter((x) => x.id !== a.id).forEach((x) => sendEmail(x.email, `Organisasi ${o.nama} dinonaktifkan`, `${o.nama} (${o.kode}) dinonaktifkan oleh ${a.nama} pada ${waktu}. Alasan: ${alasan}.`));
    usersOf(o).filter((u) => u.roles.includes('R-04') && u.status === 'Aktif').forEach((x) => sendEmail(x.email, `Organisasi ${o.nama} dinonaktifkan`, `${o.nama} dinonaktifkan di PERISAI pada ${waktu}. Alasan: ${alasan}. Hubungi SKK Migas untuk pertanyaan.`));
    commit();
    return before;
  },

  async reactivate(kode) {
    await delay();
    const a = actor();
    const { o, level } = orgFor(a, kode);
    need(a, o, level, ['admin'], 'manage');
    if (o.status !== 'Nonaktif') throw new ServiceError('NOT_ELIGIBLE');
    o.status = 'Aktif';
    o.nonaktif = undefined;
    bump(o);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'manage', objek: objekOrg(o), orgObjekId: o.id, sebelum: { Status: 'Nonaktif' }, sesudah: { Status: 'Aktif' }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    const waktu = formatTanggalJam(now());
    activeAdmins('R-03').filter((x) => x.id !== a.id).forEach((x) => sendEmail(x.email, `Organisasi ${o.nama} aktif kembali`, `${o.nama} (${o.kode}) diaktifkan kembali oleh ${a.nama} pada ${waktu}.`));
    usersOf(o).filter((u) => u.roles.includes('R-04') && u.status === 'Aktif').forEach((x) => sendEmail(x.email, `Organisasi ${o.nama} aktif kembali`, `${o.nama} aktif kembali di PERISAI sejak ${waktu}.`));
    commit();
    return toDetail(o, level);
  },

  async addAllowedEmail(kode, input) {
    await delay();
    const a = actor();
    const { o, level } = orgFor(a, kode);
    need(a, o, level, ['admin', 'teknis'], 'edit');
    const email = normEmail(input.email);
    if (!EMAIL_PATTERN.test(email)) throw new ServiceError('VALIDATION', { field: 'email' });
    const alasan = input.alasan.trim();
    if (!alasan || alasan.length > ALASAN_LAINNYA_MAX) throw new ServiceError('VALIDATION', { field: 'alasan' });
    const domain = emailDomainOf(email);
    if (o.domains.some((d) => domainMatches(domain, d))) throw new ServiceError('EMAIL_DOMAIN_REGISTERED', { field: 'email', value: domain });
    const d = db();
    // FR-ORG-26: satu email hanya untuk satu organisasi.
    if (d.orgs.some((x) => (x.emailAllow ?? []).some((e) => e.email === email)) || d.users.some((u) => u.email === email && u.orgId !== o.id)) {
      throw new ServiceError('EMAIL_OTHER_ORG', { field: 'email' });
    }
    checkAllowDate(email, input.berlakuSampai);
    if ((o.emailAllow ?? []).length >= MAX_ALLOWED_EMAILS) throw new ServiceError('DOMAIN_LIMIT', { field: 'email' });
    o.emailAllow = [...(o.emailAllow ?? []), { id: randomId('alw'), email, alasan, berlakuSampai: input.berlakuSampai, dibuat: now(), oleh: a.nama }];
    bump(o);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekOrg(o), orgObjekId: o.id, sesudah: { 'Email diizinkan': email, 'Berlaku sampai': input.berlakuSampai ?? '—' }, alasan, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    notifyIfTeknis(a, o, `menambahkan email diizinkan ${email}`);
    commit();
    return toDetail(o, level);
  },

  async updateAllowedEmail(kode, id, berlakuSampai) {
    await delay();
    const a = actor();
    const { o, level } = orgFor(a, kode);
    need(a, o, level, ['admin', 'teknis'], 'edit');
    const e = (o.emailAllow ?? []).find((x) => x.id === id);
    if (!e) throw new ServiceError('NOT_FOUND');
    checkAllowDate(e.email, berlakuSampai);
    const before = e.berlakuSampai;
    e.berlakuSampai = berlakuSampai;
    // FR-ORG-28: masa berlaku akses pengguna terkait ikut berubah.
    usersOf(o)
      .filter((u) => u.email === e.email)
      .forEach((u) => {
        u.aksesBerakhir = berlakuSampai ? new Date(`${berlakuSampai}T16:59:59.999Z`).toISOString() : undefined;
        event(u, 'Masa berlaku akses diubah', a.nama, `Mengikuti email diizinkan: ${berlakuSampai ?? 'tanpa batas'}`);
      });
    bump(o);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekOrg(o), orgObjekId: o.id, sebelum: { [`Berlaku sampai (${e.email})`]: before ?? '—' }, sesudah: { [`Berlaku sampai (${e.email})`]: berlakuSampai ?? '—' }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
    return toDetail(o, level);
  },

  async removeAllowedEmail(kode, id, opsi) {
    await delay();
    const a = actor();
    const { o, level } = orgFor(a, kode);
    need(a, o, level, ['admin', 'teknis'], 'edit');
    const e = (o.emailAllow ?? []).find((x) => x.id === id);
    if (!e) throw new ServiceError('NOT_FOUND');
    const d = db();
    const akun = usersOf(o).filter((u) => u.email === e.email);
    if (opsi.nonaktifkanAkun) {
      const r = opsi.alasan;
      if (!r?.alasan || !(r.alasan in ALASAN_NONAKTIF)) throw new ServiceError('VALIDATION', { field: 'alasan' });
    }
    o.emailAllow = (o.emailAllow ?? []).filter((x) => x.id !== id);
    akun.forEach((u) => {
      // EC-ORG-12: undangan yang belum diaktivasi menjadi tidak berlaku.
      if (u.status === 'Diundang' || u.status === 'Kedaluwarsa') {
        d.invites.filter((i) => i.userId === u.id).forEach((i) => (i.revoked = true));
        event(u, 'Undangan tidak berlaku', a.nama, 'Email dihapus dari daftar email diizinkan.');
      }
      // EC-ORG-10: akun aktif ikut dinonaktifkan bila dicentang.
      if (opsi.nonaktifkanAkun && (u.status === 'Aktif' || u.status === 'Ditangguhkan')) {
        const alasan = reasonText(opsi.alasan!);
        u.status = 'Nonaktif';
        liveSessions(u).forEach((s) => sessionEnd(s, 'revoked'));
        event(u, 'Akun dinonaktifkan', a.nama, `Alasan: ${alasan} · email dihapus dari daftar email diizinkan`);
        audit({ pelakuId: a.id, modul: 'M-15', aksi: 'manage', objek: objekPengguna(u), orgObjekId: u.orgId, sebelum: { Status: 'Aktif' }, sesudah: { Status: 'Nonaktif' }, alasan, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
      }
    });
    bump(o);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekOrg(o), orgObjekId: o.id, sebelum: { 'Email diizinkan': e.email }, sesudah: { 'Email diizinkan dihapus': e.email }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    notifyIfTeknis(a, o, `menghapus email diizinkan ${e.email}`);
    commit();
    return toDetail(o, level);
  },

  async addWorkArea(kode, input) {
    await delay();
    const a = actor();
    const { o, level } = orgFor(a, kode);
    need(a, o, level, ['admin'], 'edit');
    const d = db();
    const wkKode = input.kode.trim().toUpperCase();
    const nama = input.nama.trim();
    if (!KODE_PATTERN.test(wkKode)) throw new ServiceError('VALIDATION', { field: 'kode' });
    if (d.wk.some((w) => w.kode === wkKode)) throw new ServiceError('ORG_CODE_TAKEN', { field: 'kode' });
    if (nama.length < ORG_NAMA_MIN || nama.length > ORG_NAMA_MAX) throw new ServiceError('VALIDATION', { field: 'nama' });
    if (d.wk.some((w) => w.nama.toLowerCase() === nama.toLowerCase())) throw new ServiceError('ORG_NAME_TAKEN', { field: 'nama' });
    d.wk.push({ id: randomId('wk'), kode: wkKode, nama, orgId: o.id, aktif: true });
    bump(o);
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'create', objek: objekOrg(o), orgObjekId: o.id, sesudah: { 'Wilayah kerja': `${wkKode} ${nama}` }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
    return toDetail(o, level);
  },

  async renameWorkArea(kode, wkId, nama) {
    await delay();
    const a = actor();
    const { o, level } = orgFor(a, kode);
    need(a, o, level, ['admin'], 'edit');
    const d = db();
    const w = d.wk.find((x) => x.id === wkId && wkOperatedBy(x, o.id));
    if (!w) throw new ServiceError('NOT_FOUND');
    const n = nama.trim();
    if (n.length < ORG_NAMA_MIN || n.length > ORG_NAMA_MAX) throw new ServiceError('VALIDATION', { field: 'nama' });
    if (d.wk.some((x) => x.id !== w.id && x.nama.toLowerCase() === n.toLowerCase())) throw new ServiceError('ORG_NAME_TAKEN', { field: 'nama' });
    const before = w.nama;
    w.nama = n;
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'edit', objek: objekOrg(o), orgObjekId: o.id, sebelum: { [`Nama ${w.kode}`]: before }, sesudah: { [`Nama ${w.kode}`]: n }, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
    return toDetail(o, level);
  },

  async setWorkAreaStatus(kode, wkId, aktif, alasan) {
    await delay();
    const a = actor();
    const { o, level } = orgFor(a, kode);
    need(a, o, level, ['admin'], 'manage');
    const w = db().wk.find((x) => x.id === wkId && wkOperatedBy(x, o.id));
    if (!w) throw new ServiceError('NOT_FOUND');
    // FR-ORG-44: alasan wajib saat menonaktifkan.
    if (!aktif && (!alasan?.trim() || alasan.length > ALASAN_LAINNYA_MAX)) throw new ServiceError('VALIDATION', { field: 'alasan' });
    w.aktif = aktif;
    w.alasanNonaktif = aktif ? undefined : alasan?.trim();
    audit({ pelakuId: a.id, modul: 'M-15', aksi: 'manage', objek: objekOrg(o), orgObjekId: o.id, sebelum: { [`Status ${w.kode}`]: aktif ? 'Nonaktif' : 'Aktif' }, sesudah: { [`Status ${w.kode}`]: aktif ? 'Aktif' : 'Nonaktif' }, alasan, hasil: 'Berhasil', kelompok: 'Identitas & akses' });
    commit();
    return toDetail(o, level);
  },

  async history(kode) {
    await delay();
    const a = actor();
    const { o } = orgFor(a, kode);
    return db()
      .audit.filter((e) => e.objek === objekOrg(o) && e.hasil === 'Berhasil')
      .sort((x, y) => y.at - x.at)
      .map((e): OrgHistoryEntry => {
        const keys = [...new Set([...Object.keys(e.sebelum ?? {}), ...Object.keys(e.sesudah ?? {})])];
        const perubahan = keys.map((k) => (e.sebelum?.[k] && e.sesudah?.[k] ? `${k}: ${e.sebelum[k]} → ${e.sesudah[k]}` : `${k}: ${e.sesudah?.[k] ?? e.sebelum?.[k]}`)).join('; ');
        return { id: e.id, waktu: iso(e.at), pelaku: e.pelaku, perubahan, alasan: e.alasan };
      });
  },
};

