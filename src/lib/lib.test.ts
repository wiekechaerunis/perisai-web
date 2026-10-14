import { describe, expect, it } from 'vitest';
import { formatAngka, formatHitungMundur, formatPersen, formatRelatif, formatTanggal, formatTanggalJam, formatTenggat, maskEmail } from './format';
import { meetsPolicy, passwordStrength } from './password';
import { can, canSeeInNav, MATRIX, MODULE_IDS, ROLE_IDS } from './rbac';

describe('format (tabel Format data DS)', () => {
  it('tanggal dan jam dalam WIB', () => {
    expect(formatTanggal('2026-06-28T00:41:00Z')).toBe('28 Jun 2026');
    expect(formatTanggalJam('2026-06-28T00:41:00Z')).toBe('28 Jun 2026, 07:41 WIB');
    // 23:30 UTC = 06:30 WIB hari berikutnya
    expect(formatTanggal('2026-08-31T23:30:00Z')).toBe('1 Sep 2026');
  });
  it('angka, persen, hitung mundur', () => {
    expect(formatAngka(1250000)).toBe('1.250.000');
    expect(formatAngka(1.2)).toBe('1,2');
    expect(formatPersen(93)).toBe('93%');
    expect(formatHitungMundur(45)).toBe('0:45');
    expect(formatHitungMundur(65.2)).toBe('1:06');
  });
  it('relatif dan tenggat', () => {
    const now = new Date('2026-10-14T10:00:00Z');
    expect(formatRelatif('2026-10-14T01:00:00Z', now)).toBe('9 jam lalu');
    expect(formatRelatif('2026-10-14T09:55:00Z', now)).toBe('5 menit lalu');
    expect(formatTenggat('2026-11-13T05:00:00Z', now)).toBe('H-30');
    expect(formatTenggat('2026-10-11T05:00:00Z', now)).toBe('Terlambat 3 hari');
  });
  it('email tersamar (FR-LG-11)', () => {
    expect(maskEmail('r.wiyono@pertamina-rokan.co.id')).toBe('r.wi****@pertamina-rokan.co.id');
  });
});

describe('password (FR-AK-04, FR-AK-05 Tabel P-1)', () => {
  it('kebijakan minimal', () => {
    expect(meetsPolicy('Perisai1')).toBe(true);
    expect(meetsPolicy('perisai1')).toBe(false);
    expect(meetsPolicy('Perisai')).toBe(false);
  });
  it('strength meter', () => {
    expect(passwordStrength('').label).toBe('Masukkan password');
    expect(passwordStrength('Ab1!').label).toBe('Lemah'); // < 8 selalu Lemah
    expect(passwordStrength('abcdefgh').label).toBe('Lemah');
    expect(passwordStrength('Abcdefgh').label).toBe('Cukup');
    expect(passwordStrength('Abcdefg1').label).toBe('Kuat');
    expect(passwordStrength('Abcdef1!').label).toBe('Sangat kuat');
  });
});

describe('rbac (Matriks, FR-MX-12 default deny)', () => {
  it('setiap modul punya baris matriks (FR-MX-11)', () => {
    for (const m of MODULE_IDS) expect(MATRIX[m]).toBeDefined();
  });
  it('default deny dan isolasi admin', () => {
    expect(can(['R-07'], 'M-01', 'view')).toBe(false);
    expect(can(['R-05'], 'M-15', 'view')).toBe(false);
    expect(can(['R-03'], 'M-15', 'manage')).toBe(true);
    expect(can(['R-04'], 'M-22', 'view')).toBe(true);
    expect(can(['R-07'], 'M-25', 'view')).toBe(false); // sel "?"
  });
  it('navigasi hanya modul yang dirilis (FR-PA-10)', () => {
    for (const r of ROLE_IDS.filter((x) => x !== 'R-07')) expect(canSeeInNav([r], 'M-01')).toBe(true);
    expect(canSeeInNav(['R-03'], 'M-15')).toBe(true); // dirilis di gelombang 2
    expect(canSeeInNav(['R-03'], 'M-22')).toBe(true); // dirilis di gelombang 3
    expect(canSeeInNav(['R-03'], 'M-02')).toBe(false); // belum dirilis
  });
});
