/** Utilitas bersama halaman log: tanggal WIB, unduh CSV, filter periode, badge hasil berwarna, judul tabel. */
import { AccountStatusBadge } from '@/components/patterns/AccountStatusBadge';
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

export function PeriodFields({ dari, sampai, onChange }: { dari: string; sampai: string; onChange: (v: { dari: string; sampai: string }) => void }) {
  return (
    <fieldset className="flex flex-wrap items-end gap-2">
      <legend className="sr-only">{c.periode}</legend>
      <TextField label={c.dari} type="date" value={dari} max={sampai} onChange={(e) => onChange({ dari: e.target.value, sampai })} containerClassName="w-[170px]" required />
      <TextField label={c.sampai} type="date" value={sampai} min={dari} onChange={(e) => onChange({ dari, sampai: e.target.value })} containerClassName="w-[170px]" required />
    </fieldset>
  );
}

/** Hasil berhasil/gagal: netral, gagal/ditolak memakai `caution` (kondisi abnormal non-severitas, DS). */
/** Hasil log: Berhasil hijau, Gagal/Ditolak merah (warna status Figma 109:16180, arahan PM 14 Okt 2026). */
export function ResultTag({ ok, children }: { ok: boolean; children: string }) {
  return <AccountStatusBadge label={children} tone={ok ? 'success' : 'danger'} />;
}

/** Judul kartu tabel: nama tabel + jumlah entri (FR-LA-07) sebagai keterangan kecil. */
export function TableTitle({ title, count }: { title: string; count?: number }) {
  return (
    <span className="flex items-baseline gap-2">
      {title}
      {count !== undefined && <span className="font-mono text-caption font-normal text-ink-subtle">{c.jumlah(count)}</span>}
    </span>
  );
}

export function ArchiveTag() {
  return <span className="ml-2 inline-flex h-5 items-center rounded-sm border border-border bg-surface-sunken px-2 text-caption text-ink-subtle">{c.arsip}</span>;
}
