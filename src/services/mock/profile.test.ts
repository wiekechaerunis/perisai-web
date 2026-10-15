/** PRD Daftar Pengguna (filter role), Ekspor Daftar Pengguna, dan Profil Pengguna (reset kata sandi, sesi) di mock. */
import { describe, expect, it } from 'vitest';
import { ServiceError } from '../types';
import { mockServices as s } from './index';

/** jsdom Blob tidak punya .text(). */
function blobText(b: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.readAsText(b);
  });
}

async function code<T>(p: Promise<T>): Promise<string> {
  try {
    await p;
    return 'OK';
  } catch (e) {
    return (e as ServiceError).code;
  }
}

describe('Daftar Pengguna (FR-DP-14, -15)', () => {
  it('filter role mengikuti cakupan', async () => {
    await s.dev!.signInAs('u-04');
    const list = await s.users.listUsers({ role: 'R-05' });
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((u) => u.roles.includes('R-05') && u.organisasi.id === 'org-andalas')).toBe(true);
  });
});

describe('Ekspor Daftar Pengguna (US-ED-01..09)', () => {
  it('Admin KKKS: hanya organisasinya, mengikuti filter, tanpa data sensitif, tercatat di Jejak Audit', async () => {
    await s.dev!.signInAs('u-04');
    const r = await s.users.exportUsers({ status: 'Aktif' }, 'csv');
    const text = await blobText(r.blob);
    const lines = text.replace('﻿', '').split('\r\n');
    expect(lines[0]).toBe('Nama Lengkap,Email,Username,Jabatan,Role,Organisasi,Status Akun,Tanggal Diundang,Tanggal Diaktifkan,Login Terakhir');
    expect(lines.length - 1).toBe(r.count);
    expect(lines.slice(1).every((l) => l.includes('PT Andalas Energi Hulu') && l.includes(',Aktif,'))).toBe(true);
    expect(text).not.toMatch(/password|token/i);
    expect(r.filename).toMatch(/^pengguna-perisai-\d{4}-\d{2}-\d{2}\.csv$/);
    await s.dev!.signInAs('u-03');
    const audit = await s.logs.audit({ dari: '2000-01-01', sampai: '2100-01-01', page: 1, pageSize: 5 });
    expect(audit.items[0]).toMatchObject({ objek: 'daftar pengguna', aksi: 'export' });
  });

  it('XLSX dibuat; hasil kosong ditolak; R-07 tidak berwenang', async () => {
    await s.dev!.signInAs('u-03');
    const x = await s.users.exportUsers({}, 'xlsx');
    expect(x.blob.size).toBeGreaterThan(0);
    expect(await code(s.users.exportUsers({ search: 'tidak-ada-orang-ini' }, 'csv'))).toBe('NOT_ELIGIBLE');
    await s.dev!.signInAs('u-07');
    expect(await code(s.users.exportUsers({}, 'csv'))).toBe('PERMISSION_DENIED');
  });
});

describe('Profil Pengguna — reset kata sandi & sesi', () => {
  it('reset kata sandi oleh Admin KKKS: tautan dikirim, hanya akun Aktif, organisasi lain 404', async () => {
    await s.dev!.signInAs('u-04');
    await s.users.resetPassword('u-05');
    expect((await s.dev!.inbox())[0]).toMatchObject({ to: 'd.pratama@andalas-energi.example' });
    expect(await code(s.users.resetPassword('u-10'))).toBe('NOT_ELIGIBLE');
    expect(await code(s.users.resetPassword('u-19'))).toBe('NOT_FOUND');
  });

  it('sesi per pengguna dan akhiri satu sesi dengan alasan', async () => {
    await s.dev!.signInAs('u-05');
    await s.dev!.signInAs('u-04');
    const sessions = await s.users.userSessions('u-05');
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    expect(await code(s.users.revokeUserSession('u-05', sessions[0]!.id, { alasan: '' }))).toBe('VALIDATION');
    await s.users.revokeUserSession('u-05', sessions[0]!.id, { alasan: 'Perangkat hilang atau dicuri' });
    expect(await s.users.userSessions('u-05')).toHaveLength(sessions.length - 1);
    expect((await s.users.getUser('u-05')).riwayat[0]!.peristiwa).toBe('Sesi diakhiri');
  });
});
