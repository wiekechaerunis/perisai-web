/** Aturan bisnis prototype kick-off yang ditegakkan data layer (KD-01, BR-DOK-04, isolasi data, AB-17). */
import { describe, expect, it } from 'vitest';
import { mockServices as s } from '..';
import { isServiceError } from '../../types';

async function code(p: Promise<unknown>) {
  try {
    await p;
    return 'OK';
  } catch (e) {
    return isServiceError(e) ? e.code : 'ERR';
  }
}

describe('Insiden (alur 2)', () => {
  it('Pelapor melapor kritis → SKK diberi tahu "Belum terverifikasi"; SKK tidak dapat memverifikasi; Pejabat menutup wajib bukti', async () => {
    await s.dev!.signInAs('u-05');
    const refs = await s.ops.refs();
    expect(refs.lokasi.every((l) => l.orgId === 'org-andalas')).toBe(true);
    const inc = await s.ops.incidents.report({ jenis: 'Sabotase fasilitas', severity: 'Kritis', lokasiId: refs.lokasi[0]!.id, waktu: new Date().toISOString(), kronologi: 'Uji', foto: [] });
    expect(inc.status).toBe('Belum terverifikasi');

    await s.dev!.signInAs('u-02');
    expect((await s.ops.notifications.list()).some((n) => n.link === `/insiden/${inc.id}`)).toBe(true);
    expect(await code(s.ops.incidents.verify(inc.id))).toBe('PERMISSION_DENIED');

    await s.dev!.signInAs('u-06');
    await s.ops.incidents.verify(inc.id);
    await s.ops.incidents.assign(inc.id, 'Teguh Hartono');
    expect(await code(s.ops.incidents.close(inc.id, { penyebab: 'x', bukti: [] }))).toBe('VALIDATION');
    const closed = await s.ops.incidents.close(inc.id, { penyebab: 'Celah perimeter', bukti: ['ba.pdf'] });
    expect(closed.status).toBe('Ditutup');
  });

  it('isolasi data: KKKS hanya organisasinya; SKK lintas KKKS', async () => {
    await s.dev!.signInAs('u-06');
    expect((await s.ops.incidents.list()).every((i) => i.orgId === 'org-andalas')).toBe(true);
    await s.dev!.signInAs('u-01');
    expect(new Set((await s.ops.incidents.list()).map((i) => i.orgId)).size).toBeGreaterThan(1);
  });

  it('dasbor & peta panas hanya data terverifikasi; tinggi/kritis belum terverifikasi terpisah', async () => {
    await s.dev!.signInAs('u-01');
    const all = await s.ops.incidents.list();
    const ex = await s.ops.executive();
    expect(ex.insidenTerverifikasi).toBe(all.filter((i) => ['Terverifikasi', 'Ditangani', 'Ditutup'].includes(i.status)).length);
    expect(ex.belumTerverifikasi.length).toBeGreaterThan(0);
    const heat = await s.ops.heatmap();
    expect(heat.reduce((n, h) => n + h.jumlah, 0)).toBe(ex.insidenTerverifikasi);
  });
});

describe('WP&B (alur 3)', () => {
  it('deviasi > 10% wajib dijelaskan → finalisasi Pejabat → unggah Pengawas SKK → Final', async () => {
    await s.dev!.signInAs('u-05');
    const draft = (await s.ops.wpb.list()).find((p) => p.status === 'Draft')!;
    const lines = draft.lines.map((l, i) => ({ ...l, realisasi: Math.round(l.rencana * (i === 0 ? 1.2 : 1)) }));
    expect(await code(s.ops.wpb.submit(draft.id, lines))).toBe('VALIDATION');
    lines[0]!.penjelasan = 'Pengamanan tambahan';
    expect((await s.ops.wpb.submit(draft.id, lines)).status).toBe('Review Internal KKKS');

    await s.dev!.signInAs('u-02');
    expect(await code(s.ops.wpb.finalize(draft.id))).toBe('PERMISSION_DENIED');

    await s.dev!.signInAs('u-06');
    expect((await s.ops.wpb.finalize(draft.id)).status).toBe('Menunggu Dokumen Bertanda Tangan');

    await s.dev!.signInAs('u-01');
    expect(await code(s.ops.wpb.uploadSigned(draft.id, 'ba.pdf'))).toBe('PERMISSION_DENIED');
    await s.dev!.signInAs('u-02');
    expect((await s.ops.workspace()).menungguDokumen.some((w) => w.id === draft.id)).toBe(true);
    expect((await s.ops.wpb.uploadSigned(draft.id, 'ba-ttd.pdf')).status).toBe('Final');
  });
});

describe('Kontrak BUJP (alur 4)', () => {
  it('status dari tanggal: 2 kontrak akan berakhir; pengingat 12/6/3/1 bulan', async () => {
    await s.dev!.signInAs('u-02');
    const list = await s.ops.contracts.list();
    expect(list).toHaveLength(10);
    expect(list.filter((c) => c.status === 'Akan Berakhir')).toHaveLength(2);
    expect(list[0]!.pengingat.map((p) => p.bulanSebelum)).toEqual([12, 6, 3, 1]);
  });
});
