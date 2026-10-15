/**
 * IndonesiaMap — komponen NON-DS (DS_GAPS): peta Indonesia offline berbentuk SVG sederhana (garis pulau
 * disederhanakan, hanya ilustrasi; bukan peta resmi). Titik berupa tombol HTML di atas SVG agar dapat diakses
 * keyboard. Ukuran titik mengikuti jumlah; warna titik = severitas tertinggi (DS: titik severitas memakai `sev-*`).
 */
import { cn } from '@/lib/cn';

type LngLat = [number, number];

/** Kotak tampilan: bujur 94–142, lintang 7 s.d. −11 (proyeksi ekuirektangular). */
const W = 960;
const H = 360;
const project = ([lng, lat]: LngLat): [number, number] => [((lng - 94) / 48) * W, ((7 - lat) / 18) * H];

const ISLANDS: LngLat[][] = [
  // Sumatra
  [[95.3, 5.6], [97.5, 5.2], [98.7, 3.8], [100.3, 2.4], [101.2, 2.0], [103.4, 1.0], [104.3, -0.3], [105.9, -2.9], [106.0, -4.0], [105.8, -5.8], [104.6, -5.9], [103.4, -4.9], [102.3, -3.9], [101.0, -2.5], [100.4, -1.0], [99.3, 0.2], [98.6, 1.7], [97.2, 3.2], [95.9, 4.4]],
  // Jawa
  [[105.2, -6.8], [106.5, -6.0], [108.3, -6.3], [110.4, -6.9], [111.6, -6.6], [112.7, -6.9], [114.4, -7.7], [114.6, -8.7], [112.5, -8.4], [110.4, -8.1], [108.2, -7.8], [106.4, -7.4]],
  // Bali, Lombok, Sumbawa, Flores, Sumba, Timor
  [[114.5, -8.1], [115.7, -8.4], [115.2, -8.8], [114.5, -8.4]],
  [[116.0, -8.4], [116.7, -8.3], [116.6, -8.9], [116.0, -8.8]],
  [[116.9, -8.3], [119.0, -8.2], [118.9, -8.8], [117.0, -9.0]],
  [[119.8, -8.4], [122.9, -8.1], [122.8, -8.6], [119.9, -8.9]],
  [[119.0, -9.4], [120.8, -9.6], [120.4, -10.3], [119.1, -9.9]],
  [[123.5, -10.2], [125.2, -9.0], [127.2, -8.4], [126.9, -8.8], [124.8, -9.9], [123.7, -10.4]],
  // Kalimantan (Borneo)
  [[108.9, 1.6], [109.6, 2.0], [111.2, 2.8], [113.0, 3.2], [115.4, 4.9], [117.0, 6.9], [119.3, 5.4], [118.0, 4.4], [117.6, 3.3], [118.0, 1.0], [117.5, 0.0], [116.9, -1.3], [116.5, -2.6], [116.0, -3.9], [114.6, -4.2], [113.0, -3.2], [111.5, -3.5], [110.2, -2.9], [109.6, -1.0], [109.0, 0.3]],
  // Sulawesi
  [[119.5, 0.0], [120.2, 0.9], [121.8, 1.1], [124.4, 1.6], [125.2, 1.5], [124.5, 0.4], [123.0, 0.5], [121.3, 0.5], [120.4, -0.6], [121.6, -0.9], [123.3, -0.8], [122.5, -1.5], [121.5, -1.9], [122.9, -4.0], [122.4, -4.8], [121.2, -4.4], [120.8, -3.0], [120.4, -2.9], [120.4, -5.6], [119.5, -5.5], [119.4, -4.4], [118.8, -2.8], [119.4, -1.4]],
  // Papua (Nugini bagian barat; batas negara di 141° BT)
  [[131.0, -1.4], [132.5, -0.4], [134.1, -0.9], [135.0, -3.3], [137.8, -1.5], [141.0, -2.6], [141.0, -9.1], [139.0, -8.1], [138.0, -8.4], [137.6, -7.4], [138.6, -6.8], [135.0, -4.4], [133.0, -4.1], [132.1, -2.8]],
  // Halmahera, Seram, Buru
  [[127.4, 1.9], [128.0, 1.4], [128.7, 0.5], [128.2, -0.8], [127.6, -0.3], [127.4, 1.0]],
  [[127.9, -3.0], [130.8, -3.1], [130.9, -3.9], [128.2, -3.6]],
  [[125.9, -3.2], [127.2, -3.3], [126.9, -3.8], [126.0, -3.7]],
  // Bangka, Belitung, Natuna Besar
  [[105.2, -1.7], [106.6, -2.3], [106.7, -3.0], [105.6, -2.4]],
  [[107.6, -2.6], [108.3, -2.6], [108.2, -3.2], [107.6, -3.1]],
  [[107.9, 4.0], [108.4, 4.2], [108.3, 3.6], [107.9, 3.6]],
];

/** Daratan negara tetangga sebagai konteks (lebih pucat). */
const CONTEXT: LngLat[][] = [
  [[100.2, 6.5], [101.0, 6.8], [102.3, 6.2], [103.4, 4.6], [103.5, 2.8], [104.3, 1.4], [103.5, 1.3], [101.3, 2.8], [100.3, 4.3]],
];

const path = (pts: LngLat[]) => `M${pts.map((p) => project(p).map((n) => n.toFixed(1)).join(',')).join('L')}Z`;

export type MapPointLevel = 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah' | 'Kosong';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  /** Label aksesibel tombol, mis. "WK Mahakam Delta, 9 insiden". */
  label: string;
  /** Teks singkat di samping titik. */
  caption?: string;
  value: number;
  level: MapPointLevel;
}

export interface IndonesiaMapProps {
  points: MapPoint[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Label aksesibel peta. */
  label: string;
  className?: string;
}

const LEVEL: Record<MapPointLevel, string> = {
  Kritis: 'bg-sev-kritis',
  Tinggi: 'bg-sev-tinggi',
  Sedang: 'bg-sev-sedang',
  Rendah: 'bg-sev-rendah',
  Kosong: 'bg-ink-subtle',
};

export function IndonesiaMap({ points, selectedId, onSelect, label, className }: IndonesiaMapProps) {
  const maxV = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className={cn('relative w-full overflow-hidden rounded-md bg-surface-sunken', className)} style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label={label}>
        {CONTEXT.map((pts, i) => (
          <path key={`c${i}`} d={path(pts)} className="fill-border-subtle" />
        ))}
        {ISLANDS.map((pts, i) => (
          <path key={i} d={path(pts)} className="fill-surface stroke-border" strokeWidth={1} />
        ))}
      </svg>
      {points.map((p) => {
        const [x, y] = project([p.lng, p.lat]);
        const size = 14 + Math.round((Math.sqrt(p.value) / Math.sqrt(maxV)) * 26);
        const selected = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            aria-label={p.label}
            aria-pressed={selected}
            onClick={() => onSelect?.(p.id)}
            className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}
          >
            <span
              aria-hidden
              className={cn('block rounded-full opacity-80 ring-2 ring-surface transition-transform group-hover:scale-110', LEVEL[p.level], selected && 'opacity-100 ring-ink')}
              style={{ width: size, height: size }}
            />
            {p.caption && (
              <span aria-hidden className="pointer-events-none absolute left-full top-1/2 ml-1 hidden -translate-y-1/2 whitespace-nowrap rounded-sm bg-surface/90 px-1 text-caption text-ink sm:block">
                {p.caption}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
