/**
 * Pembuat file ekspor tabel (PRD Ekspor Daftar Pengguna: .csv dan .xlsx). Dipakai adapter mock; di produksi file
 * dibuat backend (endpoint ekspor mengembalikan file).
 * XLSX memakai `write-excel-file` (MIT) — pustaka tambahan, perlu konfirmasi Tech Lead.
 */
export type ExportFormat = 'csv' | 'xlsx';

export const EXPORT_MIME: Record<ExportFormat, string> = {
  csv: 'text/csv;charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function csvCell(v: string): string {
  return /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** CSV UTF-8 dengan BOM agar Excel membaca huruf non-ASCII dengan benar. */
export function buildCsv(header: string[], rows: string[][]): Blob {
  const text = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  return new Blob(['﻿' + text], { type: EXPORT_MIME.csv });
}

export async function buildXlsx(header: string[], rows: string[][], sheet = 'Data'): Promise<Blob> {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const data = [header.map((h) => ({ value: h, fontWeight: 'bold' as const })), ...rows.map((r) => r.map((v) => ({ value: v })))];
  return writeXlsxFile(data, { sheet }).toBlob();
}

export async function buildExport(format: ExportFormat, header: string[], rows: string[][], sheet?: string): Promise<Blob> {
  return format === 'csv' ? buildCsv(header, rows) : buildXlsx(header, rows, sheet);
}
