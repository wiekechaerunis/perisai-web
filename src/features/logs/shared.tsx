/** Utilitas bersama halaman log: tanggal WIB, unduh CSV, filter periode, badge hasil berwarna, judul tabel. */
import { useState } from 'react';
import { AccountStatusBadge, TAG_BASE, TAG_TONE } from '@/components/patterns/AccountStatusBadge';
import { cn } from '@/lib/cn';
import { formatTanggal } from '@/lib/format';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { logsCopy as c } from './copy';

/** "YYYY-MM-DD" (WIB) dengan geser hari. */
export function wibDay(offsetDays = 0): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date(Date.now() + offsetDays * 86_400_000));
}

/** Unduh teks sebagai file (FR-LA-16, FR-JA-18). */
export function downloadCsv(name: string, content: string): void {
  const blob = new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Preset periode (usulan desain 15 Okt 2026, menunggu persetujuan PM): jumlah hari ke belakang dari hari ini (WIB). */
const PRESETS = [
  { value: '0', days: 0 },
  { value: '7', days: 7 },
  { value: '30', days: 30 },
] as const;
const KHUSUS = 'khusus';

/** Default periode halaman log: 7 hari terakhir (FR-LA-07, FR-JA-12). */
export const DEFAULT_PERIOD = { dari: () => wibDay(-7), sampai: () => wibDay(0) };

export function isDefaultPeriod(dari: string, sampai: string): boolean {
  return dari === DEFAULT_PERIOD.dari() && sampai === DEFAULT_PERIOD.sampai();
}

function presetOf(dari: string, sampai: string): string {
  if (sampai !== wibDay(0)) return KHUSUS;
  return PRESETS.find((p) => wibDay(-p.days) === dari)?.value ?? KHUSUS;
}

/**
 * Periode sebagai satu Select dengan preset (Hari ini, 7 hari terakhir, 30 hari terakhir, Rentang khusus). Kotak
 * "Dari tanggal" / "Sampai tanggal" hanya muncul untuk rentang khusus, agar baris utama filter tidak penuh kotak.
 */
export function PeriodFields({
  dari,
  sampai,
  onChange,
  inPanel = false,
}: {
  dari: string;
  sampai: string;
  onChange: (v: { dari: string; sampai: string }) => void;
  /** Di dalam panel filter: label preset disembunyikan (legend sudah menyebut Periode), lebar penuh. */
  inPanel?: boolean;
}) {
  const [custom, setCustom] = useState(() => presetOf(dari, sampai) === KHUSUS);
  const value = custom ? KHUSUS : presetOf(dari, sampai);
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select
        label={c.periode}
        hideLabel={inPanel}
        value={value}
        onValueChange={(v) => {
          if (v === KHUSUS) return setCustom(true);
          setCustom(false);
          const p = PRESETS.find((x) => x.value === v)!;
          onChange({ dari: wibDay(-p.days), sampai: wibDay(0) });
        }}
        options={[
          { value: '0', label: c.presetHariIni },
          { value: '7', label: c.preset7 },
          { value: '30', label: c.preset30 },
          { value: KHUSUS, label: c.presetKhusus },
        ]}
        className={inPanel ? 'w-full' : 'w-[190px]'}
      />
      {custom && (
        <div className="grid w-full grid-cols-2 gap-2">
          <TextField label={c.dari} type="date" value={dari} max={sampai} onChange={(e) => onChange({ dari: e.target.value, sampai })} required />
          <TextField label={c.sampai} type="date" value={sampai} min={dari} onChange={(e) => onChange({ dari, sampai: e.target.value })} required />
        </div>
      )}
    </div>
  );
}

/** Hasil berhasil/gagal: netral, gagal/ditolak memakai `caution` (kondisi abnormal non-severitas, DS). */
/** Hasil log: Berhasil hijau, Gagal/Ditolak merah (warna status Figma 109:16180, arahan PM 14 Okt 2026). */
export function ResultTag({ ok, children }: { ok: boolean; children: string }) {
  return <AccountStatusBadge label={children} tone={ok ? 'success' : 'danger'} />;
}

/**
 * Judul kartu tabel = nama tabel (masukan PM 14 Okt 2026: tanpa jumlah entri di judul). Jumlah hasil (FR-LA-07) tampil di
 * ringkasan paginasi ("1–25 dari 132").
 */
export function TableTitle({ title }: { title: string }) {
  return <>{title}</>;
}

export function ArchiveTag() {
  return <span className={cn(TAG_BASE, TAG_TONE.muted, 'ml-2')}>{c.arsip}</span>;
}

/** Rentang tanggal untuk pil filter: "5–14 Okt 2026" gaya README DS (memakai format tanggal penuh di kedua ujung). */
export function formatRentang(dari: string, sampai: string): string {
  const a = formatTanggal(`${dari}T00:00:00+07:00`);
  const b = formatTanggal(`${sampai}T00:00:00+07:00`);
  return a === b ? a : `${a} – ${b}`;
}
