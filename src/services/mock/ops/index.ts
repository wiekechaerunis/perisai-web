/**
 * Adapter mock modul operasional (prototype kick-off). Aturan bisnis yang ditegakkan DI SINI (bukan hanya di UI):
 * - KD-01 / BR-DOK-04: SKK Migas hanya memantau. Satu-satunya aksi tulis SKK = Pengawas SKK (R-02) mengunggah
 *   dokumen bertanda tangan untuk item "Menunggu Dokumen Bertanda Tangan" → "Final".
 * - Semua review/persetujuan oleh Pejabat Berwenang KKKS (R-06); laporan oleh Pelapor KKKS (R-05).
 * - Isolasi data (BRD 6.2): pengguna KKKS hanya menerima data organisasinya; SKK lintas KKKS.
 * - AB-17: dasbor, peta panas, laporan hanya dari insiden terverifikasi; tinggi/kritis belum terverifikasi terpisah.
 */
import { can, type RoleId } from '@/lib/rbac';
import { ServiceError } from '../../types';
import type {
  Contract,
  ContractStatus,
  ExecutiveSummary,
  FollowUp,
  HeatPoint,
  Incident,
  IncidentEvent,
  OpsNotification,
  OpsService,
  PksAgreement,
  Severity,
  WorkItem,
  WpbLine,
  WpbPeriod,
  WpbSummary,
} from '../../ops-types';
import { VERIFIED_STATUSES, WPB_CATEGORIES, WPB_DEVIATION_THRESHOLD } from '../../ops-types';
import { delay, requireSession, userById } from '../core';
import { now } from '../db';
import { OPS_LOKASI, OPS_ORGS, OPS_WK, PIC_PER_ORG, seedOps, type OpsDb } from './seed';

const KEY = 'perisai.ops.v1';
const DAY = 86_400_000;
let state: OpsDb | null = null;

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function db(): OpsDb {
  if (state) return state;
  const raw = storage()?.getItem(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as OpsDb;
      if (parsed.version === 1) return (state = parsed);
    } catch {
      /* data rusak: tanam ulang */
    }
  }
  state = seedOps(now());
  persist();
  return state;
}

function persist() {
  if (state) storage()?.setItem(KEY, JSON.stringify(state));
}

/** Untuk tes. */
export function resetOpsDb() {
  state = null;
  storage()?.removeItem(KEY);
}

const SKK_ROLES: RoleId[] = ['R-01', 'R-02', 'R-03'];
const KKKS_ROLES: RoleId[] = ['R-04', 'R-05', 'R-06'];

interface Viewer {
  id: string;
  nama: string;
  roles: RoleId[];
  orgId: string;
  skk: boolean;
  kkks: boolean;
}

function viewer(): Viewer {
  const s = requireSession(true);
  const u = userById(s.userId);
  return { id: u.id, nama: u.nama, roles: u.roles, orgId: u.orgId, skk: u.roles.some((r) => SKK_ROLES.includes(r)), kkks: u.roles.some((r) => KKKS_ROLES.includes(r)) };
}

/** Isolasi data: SKK melihat semua KKKS; KKKS hanya organisasinya; role lain (Admin Teknis) tidak melihat data bisnis. */
function visible<T extends { orgId: string }>(v: Viewer, rows: T[]): T[] {
  if (v.skk) return rows;
  if (v.kkks) return rows.filter((r) => r.orgId === v.orgId);
  return [];
}

function deny(): never {
  throw new ServiceError('PERMISSION_DENIED');
}

function roleLabel(v: Viewer): string {
  if (v.roles.includes('R-06')) return 'Pejabat Berwenang KKKS';
  if (v.roles.includes('R-05')) return 'Pelapor KKKS';
  if (v.roles.includes('R-02')) return 'Pengawas SKK';
  return v.roles[0] ?? '';
}

function nextId(prefix: string): string {
  const d = db();
  d.seq += 1;
  return `${prefix}-${d.seq}`;
}

function ev(jenis: IncidentEvent['jenis'], v: Viewer | null, catatan?: string): IncidentEvent {
  return { id: nextId('ev'), at: new Date(now()).toISOString(), jenis, oleh: v?.nama ?? 'Sistem', peran: v ? roleLabel(v) : 'Otomatis', catatan };
}

function notify(n: Omit<OpsNotification, 'id' | 'at' | 'dibaca'>) {
  db().notifications.unshift({ ...n, id: nextId('ntf'), at: new Date(now()).toISOString(), dibaca: false });
}

function findIncident(v: Viewer, id: string): Incident {
  const i = visible(v, db().incidents).find((x) => x.id === id);
  if (!i) throw new ServiceError('NOT_FOUND');
  return i;
}

/** Hanya Pejabat Berwenang KKKS organisasi insiden yang boleh memverifikasi, menugaskan, mencatat, dan menutup. */
function requireReviewer(v: Viewer, orgId: string) {
  if (!v.roles.includes('R-06') || v.orgId !== orgId) deny();
}

const highOrCritical = (s: Severity) => s === 'Kritis' || s === 'Tinggi';

function contractStatus(c: OpsDb['contracts'][number]): { status: ContractStatus; sisaHari: number } {
  const sisaHari = Math.ceil((new Date(c.berakhir).getTime() - now()) / DAY);
  // AB-10: Akan Berakhir = masuk jendela pengingat pertama (12 bulan).
  const status: ContractStatus = sisaHari < 0 ? 'Berakhir' : sisaHari <= 365 ? 'Akan Berakhir' : 'Aktif';
  return { status, sisaHari };
}

function withStatus(c: OpsDb['contracts'][number]): Contract {
  return { ...c, ...contractStatus(c) };
}

function pksStatus(p: OpsDb['pks'][number]): PksAgreement {
  const sisa = (new Date(p.berakhir).getTime() - now()) / DAY;
  return { ...p, status: sisa < 0 ? 'Berakhir' : sisa <= 365 ? 'Akan Berakhir' : 'Aktif' };
}

function followUp(f: OpsDb['followUps'][number]): FollowUp {
  return { ...f, terlambat: f.status !== 'Selesai' && new Date(f.tenggat).getTime() < now() };
}

const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const namaPeriode = (p: Pick<WpbPeriod, 'bulan' | 'tahun'>) => `${NAMA_BULAN[p.bulan - 1]} ${p.tahun}`;

function findWpb(v: Viewer, id: string): WpbPeriod {
  const p = visible(v, db().wpb).find((x) => x.id === id);
  if (!p) throw new ServiceError('NOT_FOUND');
  return p;
}

/** BR-WPB-04: kategori di atas ambang deviasi wajib diberi penjelasan. */
function validateLines(lines: WpbLine[]) {
  for (const l of lines) {
    if (l.realisasi === null || Number.isNaN(l.realisasi)) throw new ServiceError('VALIDATION');
    const dev = l.rencana ? Math.abs(l.realisasi - l.rencana) / l.rencana : 0;
    if (dev > WPB_DEVIATION_THRESHOLD && !l.penjelasan?.trim()) throw new ServiceError('VALIDATION');
  }
}

function wpbLink(p: WpbPeriod) {
  return `/wpb/${p.id}`;
}

export const opsService: OpsService = {
  async refs() {
    await delay();
    const v = viewer();
    return {
      orgs: v.skk ? OPS_ORGS : OPS_ORGS.filter((o) => o.id === v.orgId),
      wk: visible(v, OPS_WK),
      lokasi: visible(v, OPS_LOKASI),
      pic: v.kkks ? (PIC_PER_ORG[v.orgId] ?? []) : [],
    };
  },

  async workspace() {
    await delay();
    const v = viewer();
    const d = db();
    const incidents = visible(v, d.incidents);
    const wpb = visible(v, d.wpb);
    const tugas: WorkItem[] = [];
    const kotak: WorkItem[] = [];
    const menunggu: WorkItem[] = [];
    const incItem = (i: Incident, keterangan: string): WorkItem => ({ id: i.id, jenis: 'Insiden', judul: `${i.kode} · ${i.judul}`, keterangan, status: i.status, link: `/insiden/${i.id}`, severity: i.severity, at: i.dilaporkanPada });
    const wpbItem = (p: WpbPeriod, keterangan: string): WorkItem => ({ id: p.id, jenis: 'WP&B', judul: `Realisasi WP&B ${namaPeriode(p)} · ${p.orgNama}`, keterangan, status: p.status, link: wpbLink(p), at: p.timeline.at(-1)?.at ?? new Date(Date.UTC(p.tahun, p.bulan, 1)).toISOString() });
    if (v.roles.includes('R-06')) {
      for (const i of incidents.filter((x) => x.status === 'Belum terverifikasi')) kotak.push(incItem(i, 'Verifikasi laporan insiden'));
      for (const p of wpb.filter((x) => x.status === 'Review Internal KKKS')) kotak.push(wpbItem(p, 'Finalisasi realisasi'));
      for (const i of incidents.filter((x) => x.status === 'Terverifikasi')) tugas.push(incItem(i, 'Tugaskan PIC'));
      for (const i of incidents.filter((x) => x.status === 'Ditangani').slice(0, 4)) tugas.push(incItem(i, 'Pantau penanganan, lalu tutup'));
    }
    if (v.roles.includes('R-05')) {
      for (const p of wpb.filter((x) => x.status === 'Draft' || x.status === 'Perlu Perbaikan')) tugas.push(wpbItem(p, p.status === 'Draft' ? 'Isi realisasi bulanan' : 'Perbaiki sesuai catatan'));
      for (const i of incidents.filter((x) => x.status === 'Dikembalikan')) tugas.push(incItem(i, 'Lengkapi laporan yang dikembalikan'));
      for (const f of visible(v, d.followUps).filter((x) => x.pic === v.nama && x.status !== 'Selesai')) tugas.push({ id: f.id, jenis: 'Tindak lanjut', judul: `${f.kode} · ${f.judul}`, keterangan: `Sumber: ${f.sumber}`, status: f.status, link: '/tindak-lanjut', at: f.tenggat });
    }
    if (v.roles.includes('R-04')) {
      for (const c of visible(v, d.contracts).map(withStatus).filter((x) => x.status === 'Akan Berakhir')) tugas.push({ id: c.id, jenis: 'Kontrak', judul: `${c.nomor} · ${c.bujp}`, keterangan: `Berakhir dalam ${c.sisaHari} hari`, status: c.status, link: `/kontrak/${c.id}`, at: c.berakhir });
    }
    if (v.skk) {
      for (const p of wpb.filter((x) => x.status === 'Menunggu Dokumen Bertanda Tangan')) menunggu.push(wpbItem(p, v.roles.includes('R-02') ? 'Unggah berita acara bertanda tangan' : 'Menunggu unggahan Pengawas SKK'));
    }
    const bySev = (a: WorkItem, b: WorkItem) => (a.severity && b.severity ? ['Kritis', 'Tinggi', 'Sedang', 'Rendah'].indexOf(a.severity) - ['Kritis', 'Tinggi', 'Sedang', 'Rendah'].indexOf(b.severity) : 0) || b.at.localeCompare(a.at);
    return { tugasSaya: tugas.sort(bySev), kotakPersetujuan: kotak.sort(bySev), menungguDokumen: menunggu.sort((x, y) => y.at.localeCompare(x.at)) };
  },

  incidents: {
    async list(filter = {}) {
      await delay();
      const v = viewer();
      let rows = visible(v, db().incidents);
      if (filter.verifiedOnly) rows = rows.filter((i) => VERIFIED_STATUSES.includes(i.status));
      if (filter.wkId) rows = rows.filter((i) => i.wkId === filter.wkId);
      return [...rows].sort((a, b) => b.waktu.localeCompare(a.waktu));
    },
    async get(id) {
      await delay();
      return structuredClone(findIncident(viewer(), id));
    },
    async report(input) {
      await delay();
      const v = viewer();
      if (!v.roles.includes('R-05') || !can(v.roles, 'M-05', 'create')) deny();
      const lok = OPS_LOKASI.find((l) => l.id === input.lokasiId && l.orgId === v.orgId);
      if (!lok || !input.kronologi.trim()) throw new ServiceError('VALIDATION');
      const wk = OPS_WK.find((w) => w.id === lok.wkId)!;
      const org = OPS_ORGS.find((o) => o.id === v.orgId)!;
      const d = db();
      const nomor = d.incidents.length + 101;
      const inc: Incident = {
        id: nextId('ins'),
        kode: `INS-2026-${String(nomor).padStart(4, '0')}`,
        orgId: v.orgId,
        orgNama: org.nama,
        jenis: input.jenis,
        severity: input.severity,
        status: 'Belum terverifikasi',
        lokasiId: lok.id,
        lokasiNama: lok.nama,
        wkId: wk.id,
        wkNama: wk.nama,
        lat: lok.lat,
        lng: lok.lng,
        waktu: input.waktu,
        dilaporkanPada: new Date(now()).toISOString(),
        pelapor: v.nama,
        judul: `${input.jenis} di ${lok.nama}`,
        kronologi: input.kronologi.trim(),
        foto: input.foto,
        timeline: [ev('Dilaporkan', v)],
      };
      // BR-INS-04: tinggi/kritis langsung ke Pengawas & Pimpinan SKK dengan label "Belum terverifikasi".
      if (highOrCritical(inc.severity)) {
        inc.timeline.push(ev('Notifikasi SKK', null, 'Dikirim ke Pengawas SKK dan Pimpinan SKK dengan label Belum terverifikasi'));
        notify({ judul: `Insiden ${inc.severity.toLowerCase()} · Belum terverifikasi`, isi: `${inc.judul} (${inc.orgNama}). Menunggu verifikasi Pejabat Berwenang KKKS.`, link: `/insiden/${inc.id}`, kritis: inc.severity === 'Kritis', untukRoles: ['R-01', 'R-02'] });
      }
      notify({ judul: 'Insiden baru menunggu verifikasi', isi: inc.judul, link: `/insiden/${inc.id}`, kritis: inc.severity === 'Kritis', untukRoles: ['R-06'], orgId: inc.orgId });
      d.incidents.unshift(inc);
      persist();
      return structuredClone(inc);
    },
    async verify(id) {
      await delay();
      const v = viewer();
      const i = findIncident(v, id);
      requireReviewer(v, i.orgId);
      if (i.status !== 'Belum terverifikasi') throw new ServiceError('VALIDATION');
      i.status = 'Terverifikasi';
      i.timeline.push(ev('Diverifikasi', v));
      persist();
      return structuredClone(i);
    },
    async sendBack(id, alasan) {
      await delay();
      const v = viewer();
      const i = findIncident(v, id);
      requireReviewer(v, i.orgId);
      if (!alasan.trim()) throw new ServiceError('VALIDATION');
      i.status = 'Dikembalikan';
      i.alasanDikembalikan = alasan.trim();
      i.timeline.push(ev('Dikembalikan', v, alasan.trim()));
      persist();
      return structuredClone(i);
    },
    async assign(id, pic) {
      await delay();
      const v = viewer();
      const i = findIncident(v, id);
      requireReviewer(v, i.orgId);
      if (!pic.trim()) throw new ServiceError('VALIDATION');
      i.status = 'Ditangani';
      i.pic = pic;
      i.timeline.push(ev('Ditugaskan', v, `PIC: ${pic}`));
      persist();
      return structuredClone(i);
    },
    async addAction(id, catatan) {
      await delay();
      const v = viewer();
      const i = findIncident(v, id);
      requireReviewer(v, i.orgId);
      if (!catatan.trim()) throw new ServiceError('VALIDATION');
      i.timeline.push(ev('Tindakan', v, catatan.trim()));
      persist();
      return structuredClone(i);
    },
    async close(id, input) {
      await delay();
      const v = viewer();
      const i = findIncident(v, id);
      requireReviewer(v, i.orgId);
      // BR-INS-08: tombol tutup tidak tersedia sebelum bukti dan penyebab diisi.
      if (!input.penyebab.trim() || input.bukti.length === 0) throw new ServiceError('VALIDATION');
      i.status = 'Ditutup';
      i.penyebab = input.penyebab.trim();
      i.bukti = input.bukti;
      i.timeline.push(ev('Ditutup', v, `Penyebab: ${i.penyebab}`));
      if (highOrCritical(i.severity)) notify({ judul: `Insiden ${i.severity.toLowerCase()} ditutup`, isi: `${i.kode} · ${i.judul} (${i.orgNama})`, link: `/insiden/${i.id}`, kritis: false, untukRoles: ['R-01', 'R-02'] });
      persist();
      return structuredClone(i);
    },
  },

  wpb: {
    async list() {
      await delay();
      return [...visible(viewer(), db().wpb)].sort((a, b) => b.tahun - a.tahun || b.bulan - a.bulan || a.orgNama.localeCompare(b.orgNama));
    },
    async get(id) {
      await delay();
      return structuredClone(findWpb(viewer(), id));
    },
    async summary() {
      await delay();
      const v = viewer();
      const d = db();
      const orgIds = Object.keys(d.disepakati).filter((o) => v.skk || (v.kkks && o === v.orgId));
      return orgIds.map((orgId): WpbSummary => {
        const periods = d.wpb.filter((p) => p.orgId === orgId && p.status !== 'Draft');
        const rows = WPB_CATEGORIES.map((kategori) => {
          const rencana = periods.reduce((s, p) => s + (p.lines.find((l) => l.kategori === kategori)?.rencana ?? 0), 0);
          const realisasi = periods.reduce((s, p) => s + (p.lines.find((l) => l.kategori === kategori)?.realisasi ?? 0), 0);
          return { kategori, disepakati: d.disepakati[orgId]![kategori], realisasi, deviasi: rencana ? realisasi / rencana - 1 : 0, rencana };
        });
        return {
          orgId,
          orgNama: OPS_ORGS.find((o) => o.id === orgId)!.nama,
          tahun: 2026,
          disepakatiTahunan: rows.reduce((s, r) => s + r.disepakati, 0),
          rencanaSampaiKini: rows.reduce((s, r) => s + r.rencana, 0),
          realisasiSampaiKini: rows.reduce((s, r) => s + r.realisasi, 0),
          rows: rows.map(({ rencana: _r, ...rest }) => rest),
        };
      });
    },
    async save(id, lines) {
      await delay();
      const v = viewer();
      const p = findWpb(v, id);
      if (!v.roles.includes('R-05') || !['Draft', 'Perlu Perbaikan'].includes(p.status)) deny();
      p.lines = lines;
      persist();
      return structuredClone(p);
    },
    async submit(id, lines) {
      await delay();
      const v = viewer();
      const p = findWpb(v, id);
      if (!v.roles.includes('R-05') || !['Draft', 'Perlu Perbaikan'].includes(p.status)) deny();
      validateLines(lines);
      p.lines = lines;
      p.status = 'Review Internal KKKS';
      p.timeline.push({ at: new Date(now()).toISOString(), oleh: v.nama, peran: 'Pelapor KKKS', aksi: 'Mengajukan realisasi' });
      notify({ judul: 'Realisasi WP&B menunggu finalisasi', isi: `${namaPeriode(p)} · ${p.orgNama}`, link: wpbLink(p), kritis: false, untukRoles: ['R-06'], orgId: p.orgId });
      persist();
      return structuredClone(p);
    },
    async sendBack(id, alasan) {
      await delay();
      const v = viewer();
      const p = findWpb(v, id);
      requireReviewer(v, p.orgId);
      if (p.status !== 'Review Internal KKKS' || !alasan.trim()) throw new ServiceError('VALIDATION');
      p.status = 'Perlu Perbaikan';
      p.timeline.push({ at: new Date(now()).toISOString(), oleh: v.nama, peran: 'Pejabat Berwenang KKKS', aksi: 'Mengembalikan untuk perbaikan', catatan: alasan.trim() });
      persist();
      return structuredClone(p);
    },
    async finalize(id) {
      await delay();
      const v = viewer();
      const p = findWpb(v, id);
      requireReviewer(v, p.orgId);
      if (p.status !== 'Review Internal KKKS') throw new ServiceError('VALIDATION');
      const t = new Date(now()).toISOString();
      const org = OPS_ORGS.find((o) => o.id === p.orgId)!;
      p.status = 'Menunggu Dokumen Bertanda Tangan';
      p.beritaAcara = { nomor: `BA-WPB/${org.kode}/${p.tahun}/${String(p.bulan).padStart(2, '0')}`, dibuatPada: t };
      p.timeline.push({ at: t, oleh: v.nama, peran: 'Pejabat Berwenang KKKS', aksi: 'Memfinalisasi realisasi' });
      p.timeline.push({ at: t, oleh: 'Sistem', peran: 'Otomatis', aksi: 'Menyusun draf berita acara', catatan: 'Angka diambil dari data yang terkunci. Ditandatangani kedua pihak di luar sistem.' });
      notify({ judul: 'Berita acara WP&B menunggu dokumen bertanda tangan', isi: `${namaPeriode(p)} · ${p.orgNama}`, link: wpbLink(p), kritis: false, untukRoles: ['R-02'] });
      persist();
      return structuredClone(p);
    },
    async uploadSigned(id, namaFile) {
      await delay();
      const v = viewer();
      const p = findWpb(v, id);
      // BR-DOK-04: satu-satunya aksi tulis SKK Migas.
      if (!v.roles.includes('R-02') || !can(v.roles, 'M-06', 'upload_signed')) deny();
      if (p.status !== 'Menunggu Dokumen Bertanda Tangan' || !p.beritaAcara || !namaFile.trim()) throw new ServiceError('VALIDATION');
      const t = new Date(now()).toISOString();
      p.beritaAcara.dokumen = { nama: namaFile, diunggahOleh: v.nama, diunggahPada: t };
      // ASSUMPTION: pencocokan angka dokumen vs data terkunci selalu lolos di prototype.
      p.status = 'Final';
      p.timeline.push({ at: t, oleh: v.nama, peran: 'Pengawas SKK', aksi: 'Mengunggah berita acara bertanda tangan', catatan: 'Angka cocok dengan data terkunci. Status Final.' });
      notify({ judul: 'Berita acara WP&B Final', isi: `${namaPeriode(p)} · ${p.orgNama}`, link: wpbLink(p), kritis: false, untukRoles: ['R-05', 'R-06'], orgId: p.orgId });
      persist();
      return structuredClone(p);
    },
  },

  contracts: {
    async list() {
      await delay();
      return visible(viewer(), db().contracts)
        .map(withStatus)
        .sort((a, b) => a.berakhir.localeCompare(b.berakhir));
    },
    async get(id) {
      await delay();
      const c = visible(viewer(), db().contracts).find((x) => x.id === id);
      if (!c) throw new ServiceError('NOT_FOUND');
      return structuredClone(withStatus(c));
    },
    async create(input) {
      await delay();
      const v = viewer();
      if (!v.kkks || !(can(v.roles, 'M-07', 'create'))) deny();
      const wk = OPS_WK.find((w) => w.id === input.wkId && w.orgId === v.orgId);
      if (!wk || !input.nomor.trim() || !input.bujp.trim() || input.berakhir <= input.mulai) throw new ServiceError('VALIDATION');
      const org = OPS_ORGS.find((o) => o.id === v.orgId)!;
      const c = {
        id: nextId('kon'),
        nomor: input.nomor.trim(),
        bujp: input.bujp.trim(),
        orgId: v.orgId,
        orgNama: org.nama,
        aset: input.aset.trim(),
        wkNama: wk.nama,
        mulai: input.mulai,
        berakhir: input.berakhir,
        nilai: input.nilai,
        realisasi: 0,
        personel: input.personel,
        dokumen: input.dokumen,
        insidenIds: [],
        pengingat: ([12, 6, 3, 1] as const).map((b) => {
          const t = new Date(new Date(input.berakhir).getTime() - b * 30 * DAY);
          return { bulanSebelum: b, tanggal: t.toISOString().slice(0, 10), terkirim: t.getTime() <= now() };
        }),
      };
      db().contracts.push(c);
      persist();
      return withStatus(c);
    },
  },

  async pks() {
    await delay();
    return visible(viewer(), db().pks).map(pksStatus);
  },

  async followUps() {
    await delay();
    return visible(viewer(), db().followUps).map(followUp);
  },

  notifications: {
    async list() {
      await delay();
      const v = viewer();
      return db().notifications.filter((n) => n.untukRoles.some((r) => v.roles.includes(r)) && (!n.orgId || n.orgId === v.orgId));
    },
    async markAllRead() {
      await delay();
      const v = viewer();
      for (const n of db().notifications) if (n.untukRoles.some((r) => v.roles.includes(r)) && (!n.orgId || n.orgId === v.orgId)) n.dibaca = true;
      persist();
    },
  },

  async executive() {
    await delay();
    const v = viewer();
    const d = db();
    const all = visible(v, d.incidents);
    const verified = all.filter((i) => VERIFIED_STATUSES.includes(i.status));
    const perSeverity = { Kritis: 0, Tinggi: 0, Sedang: 0, Rendah: 0 } as Record<Severity, number>;
    for (const i of verified) perSeverity[i.severity] += 1;
    const orgs = OPS_ORGS.filter((o) => v.skk || o.id === v.orgId);
    const contracts = visible(v, d.contracts).map(withStatus);
    const pks = visible(v, d.pks).map(pksStatus);
    const fu = visible(v, d.followUps).map(followUp);
    const sums = await opsService.wpb.summary();
    const disepakati = sums.reduce((s, x) => s + x.rencanaSampaiKini, 0);
    const realisasi = sums.reduce((s, x) => s + x.realisasiSampaiKini, 0);
    const summary: ExecutiveSummary = {
      insidenTerverifikasi: verified.length,
      insidenKritisTinggi: verified.filter((i) => highOrCritical(i.severity)).length,
      insidenTerbuka: verified.filter((i) => i.status !== 'Ditutup').length,
      belumTerverifikasi: all.filter((i) => i.status === 'Belum terverifikasi' && highOrCritical(i.severity)),
      perSeverity,
      perOrg: orgs.map((o) => ({ orgId: o.id, orgNama: o.nama, insiden: verified.filter((i) => i.orgId === o.id).length, kritisTinggi: verified.filter((i) => i.orgId === o.id && highOrCritical(i.severity)).length })),
      anggaran: { disepakati, realisasi, deviasiKategori: sums.reduce((s, x) => s + x.rows.filter((r) => Math.abs(r.deviasi) > WPB_DEVIATION_THRESHOLD).length, 0) },
      kontrak: { aktif: contracts.filter((c) => c.status === 'Aktif').length, akanBerakhir: contracts.filter((c) => c.status === 'Akan Berakhir').length, berakhir: contracts.filter((c) => c.status === 'Berakhir').length },
      pks: { aktif: pks.filter((p) => p.status === 'Aktif').length, akanBerakhir: pks.filter((p) => p.status === 'Akan Berakhir').length },
      // ASSUMPTION: modul Risiko belum dibangun; angka ilustrasi.
      risiko: v.skk ? { tinggi: 7, kritis: 2 } : { tinggi: 3, kritis: 1 },
      tindakLanjut: { terbuka: fu.filter((f) => f.status !== 'Selesai').length, terlambat: fu.filter((f) => f.terlambat).length },
      peringatanDini: [
        { judul: 'Frekuensi insiden pencurian di WK Andalas Darat naik 2× dari rata-rata 3 bulan', at: new Date(now() - 2 * DAY).toISOString(), sumber: 'Aturan frekuensi insiden' },
        { judul: 'Kontrak BUJP SPK-BUJP/ADL/2024/017 berakhir kurang dari 2 bulan', at: new Date(now() - 5 * DAY).toISOString(), sumber: 'Aturan masa berlaku' },
        { judul: 'Peringatan cuaca: gelombang tinggi 3–4 m di perairan Natuna', at: new Date(now() - 1 * DAY).toISOString(), sumber: 'Informasi eksternal (BMKG)' },
      ].filter((_, k) => v.skk || k < 2),
      isuKritis: verified
        .filter((i) => highOrCritical(i.severity) && i.status !== 'Ditutup')
        .slice(0, 5)
        .map((i) => ({ judul: `${i.kode} · ${i.judul}`, link: `/insiden/${i.id}`, severity: i.severity })),
    };
    return summary;
  },

  async heatmap() {
    await delay();
    const v = viewer();
    const verified = visible(v, db().incidents).filter((i) => VERIFIED_STATUSES.includes(i.status));
    return visible(v, OPS_WK).map((w): HeatPoint => {
      const rows = verified.filter((i) => i.wkId === w.id);
      return { wkId: w.id, wkNama: w.nama, orgNama: OPS_ORGS.find((o) => o.id === w.orgId)!.nama, provinsi: w.provinsi, lat: w.lat, lng: w.lng, jumlah: rows.length, kritisTinggi: rows.filter((i) => highOrCritical(i.severity)).length };
    });
  },

  async resetDemo() {
    await delay();
    state = seedOps(now());
    persist();
  },
};

