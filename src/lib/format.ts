/**
 * Format data sesuai tabel "Format data" PERISAI Design System.
 * Timestamp disimpan UTC, ditampilkan WIB (Technical Notes PRD Core Platform).
 */

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'] as const;
const WIB = 'Asia/Jakarta';

type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

function wibParts(value: DateInput) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: WIB,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(toDate(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    day: Number(get('day')),
    month: Number(get('month')),
    year: Number(get('year')),
    hour: get('hour'),
    minute: get('minute'),
  };
}

/** "28 Jun 2026" */
export function formatTanggal(value: DateInput): string {
  const p = wibParts(value);
  return `${p.day} ${BULAN[p.month - 1]} ${p.year}`;
}

/** "07:41 WIB" */
export function formatJam(value: DateInput): string {
  const p = wibParts(value);
  return `${p.hour}:${p.minute} WIB`;
}

/** "28 Jun 2026, 07:41 WIB" */
export function formatTanggalJam(value: DateInput): string {
  return `${formatTanggal(value)}, ${formatJam(value)}`;
}

/**
 * Waktu relatif untuk kejadian < 24 jam ("9 jam lalu"); di atas itu jatuh ke formatTanggalJam.
 */
export function formatRelatif(value: DateInput, now: DateInput = Date.now()): string {
  const diffMs = toDate(now).getTime() - toDate(value).getTime();
  const menit = Math.floor(diffMs / 60_000);
  if (diffMs < 0 || menit >= 24 * 60) return formatTanggalJam(value);
  if (menit < 1) return 'Baru saja';
  if (menit < 60) return `${menit} menit lalu`;
  return `${Math.floor(menit / 60)} jam lalu`;
}

/** Tenggat: "H-30", "Hari ini", "Terlambat 3 hari" (berdasarkan tanggal WIB). */
export function formatTenggat(due: DateInput, now: DateInput = Date.now()): string {
  const d = wibParts(due);
  const n = wibParts(now);
  const hari = Math.round(
    (Date.UTC(d.year, d.month - 1, d.day) - Date.UTC(n.year, n.month - 1, n.day)) / 86_400_000,
  );
  if (hari === 0) return 'Hari ini';
  if (hari > 0) return `H-${hari}`;
  return `Terlambat ${Math.abs(hari)} hari`;
}

const angkaFmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });

/** "1.250.000" · "1,2" */
export function formatAngka(value: number): string {
  return angkaFmt.format(value);
}

/** "93%" (tanpa spasi) */
export function formatPersen(value: number): string {
  return `${angkaFmt.format(value)}%`;
}

/** Nilai Rupiah di sel tabel: angka tanpa simbol ("Rp" ada di judul kolom). */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value);
}

/** Hitung mundur "0:45", "1:05". */
export function formatHitungMundur(totalDetik: number): string {
  const s = Math.max(0, Math.ceil(totalDetik));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Email tersamar untuk halaman OTP (FR-LG-11, FR-AK-10): 4 karakter pertama bagian lokal lalu "****".
 * Contoh: "r.wiyono@pertamina-rokan.co.id" → "r.wi****@pertamina-rokan.co.id".
 */
export function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  const visible = local.slice(0, Math.min(4, Math.max(1, local.length - 1)));
  return `${visible}****@${domain}`;
}
