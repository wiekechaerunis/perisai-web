/**
 * Illustration — ilustrasi garis EmptyState PERISAI DS v2 · Lime (kanvas 200×140, garis `ink` 2,5px ujung membulat,
 * isi `surface` / `surface-sunken`, satu aksen `action` atau `accent-card-border`, bayangan tanah `surface-sunken`).
 * Mengikuti tema lewat token (kelas `.il` di styles/index.css). Dekoratif: selalu aria-hidden.
 * Ukuran: `lg` 200×140 (halaman status penuh), `md` 160×112 (di dalam kartu), `sm` 120×84 (filter/cari kosong, dialog Hasil).
 * Path disalin dari preview komponen EmptyState DS v2.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type IllustrationName =
  | 'kosong'
  | 'filter-kosong'
  | 'cari-kosong'
  | 'tidak-ditemukan'
  | 'akses-ditolak'
  | 'gagal-dimuat'
  | 'berhasil'
  | 'menunggu'
  | 'tautan-tidak-valid'
  | 'akun-aktif'
  | 'undangan-kedaluwarsa'
  | 'sesi-habis'
  | 'selamat-datang';

const SIZE = { sm: [120, 84], md: [160, 112], lg: [200, 140] } as const;

const ground = <ellipse className="gr" cx="100" cy="124" rx="70" ry="8" />;

const ART: Record<IllustrationName, ReactNode> = {
  kosong: (
    <>
      {ground}
      <rect className="so ln" x="62" y="22" width="76" height="96" rx="8" />
      <rect className="pa ln" x="54" y="30" width="76" height="96" rx="8" />
      <rect className="so" x="66" y="46" width="40" height="6" rx="3" />
      <rect className="so" x="66" y="60" width="52" height="6" rx="3" />
      <rect className="so" x="66" y="74" width="30" height="6" rx="3" />
      <circle className="ac ln" cx="130" cy="104" r="16" />
      <path className="ln" d="M130 96v16M122 104h16" />
    </>
  ),
  'filter-kosong': (
    <>
      {ground}
      <rect className="pa ln" x="46" y="34" width="88" height="84" rx="8" />
      <rect className="so" x="58" y="48" width="64" height="8" rx="4" />
      <rect className="so" x="58" y="64" width="64" height="8" rx="4" />
      <rect className="so" x="58" y="80" width="40" height="8" rx="4" />
      <path className="at ln" d="M112 26h56l-21 26v22l-14 8V52z" />
      <circle className="pa ln" cx="160" cy="92" r="12" />
      <path className="ln" d="m155 87 10 10M165 87l-10 10" />
    </>
  ),
  'cari-kosong': (
    <>
      {ground}
      <rect className="pa ln" x="40" y="40" width="80" height="70" rx="8" />
      <rect className="so" x="52" y="54" width="56" height="6" rx="3" />
      <rect className="so" x="52" y="68" width="40" height="6" rx="3" />
      <circle className="at ln" cx="122" cy="62" r="26" />
      <circle className="pa ln" cx="122" cy="62" r="17" />
      <path className="ln" d="m141 81 20 20" strokeWidth="6" />
      <path className="ln" d="M117 57a5 5 0 1 1 7 5c-2 1-2 2-2 4M122 71v.5" />
    </>
  ),
  'tidak-ditemukan': (
    <>
      {ground}
      <path className="ln" d="M100 120V30" />
      <path className="pa ln" d="M64 36h56l12 11-12 11H64z" />
      <path className="at ln" d="M136 66H82l-12 11 12 11h54z" />
      <rect className="so" x="74" y="44" width="30" height="6" rx="3" />
      <rect className="pa" x="92" y="74" width="30" height="6" rx="3" />
      <circle className="ac ln" cx="150" cy="40" r="12" />
      <path className="ln" d="M146 36a4 4 0 1 1 5 4c-1 .6-1 1.3-1 2.5M150 46v.5" />
    </>
  ),
  'akses-ditolak': (
    <>
      {ground}
      <path className="pa ln" d="M100 18 140 32v30c0 28-24 46-40 56-16-10-40-28-40-56V32z" />
      <rect className="ac ln" x="82" y="64" width="36" height="30" rx="6" />
      <path className="ln" d="M89 64v-8a11 11 0 0 1 22 0v8" />
      <path className="ln" d="M100 76v8" />
    </>
  ),
  'gagal-dimuat': (
    <>
      {ground}
      <rect className="pa ln" x="44" y="30" width="112" height="80" rx="8" />
      <path className="ln" d="M44 46h112" />
      <circle className="so" cx="56" cy="38" r="3" />
      <circle className="so" cx="66" cy="38" r="3" />
      <path className="er ln" d="M100 58 122 96H78z" />
      <path className="ln" d="M100 72v10M100 89v.5" />
    </>
  ),
  berhasil: (
    <>
      {ground}
      <rect className="pa ln" x="52" y="30" width="72" height="88" rx="8" />
      <rect className="so" x="64" y="46" width="48" height="6" rx="3" />
      <rect className="so" x="64" y="60" width="36" height="6" rx="3" />
      <rect className="so" x="64" y="74" width="44" height="6" rx="3" />
      <circle className="ac ln" cx="128" cy="92" r="22" />
      <path className="ln" d="m118 92 7 7 13-14" strokeWidth="4" />
      <path className="ln" d="M154 54v8M150 58h8M44 98v6M41 101h6" />
    </>
  ),
  menunggu: (
    <>
      {ground}
      <path className="pa ln" d="M76 22h48M76 118h48M82 22c0 26 36 30 36 48s-36 22-36 48M118 22c0 26-36 30-36 48s36 22 36 48" />
      <path className="at" d="M90 36h20l-10 14z" />
      <path className="ac ln" d="M88 110c3-9 21-9 24 0z" />
      <path className="ln" d="M100 74v14" strokeDasharray="2 5" />
    </>
  ),
  'tautan-tidak-valid': (
    <>
      {ground}
      <rect className="pa ln" x="46" y="26" width="96" height="64" rx="8" />
      <rect className="so" x="58" y="40" width="44" height="6" rx="3" />
      <rect className="so" x="58" y="54" width="60" height="6" rx="3" />
      <path className="ln" d="M76 112l8-8a9 9 0 0 1 13 13l-8 8a9 9 0 0 1-13-13" />
      <path className="ln" d="M118 96l-8 8a9 9 0 0 1-13-13l8-8a9 9 0 0 1 13 13" />
      <path className="ln" d="M100 100l4-4M92 92l-3-6M108 108l6 3" />
      <circle className="pa ln" cx="150" cy="30" r="12" />
      <path className="ln" d="m145 25 10 10M155 25l-10 10" />
    </>
  ),
  'akun-aktif': (
    <>
      {ground}
      <rect className="pa ln" x="44" y="28" width="92" height="62" rx="8" />
      <rect className="so" x="56" y="40" width="22" height="22" rx="4" />
      <rect className="so" x="86" y="42" width="38" height="6" rx="3" />
      <rect className="so" x="86" y="54" width="28" height="6" rx="3" />
      <circle className="pa ln" cx="88" cy="104" r="12" />
      <circle className="so" cx="88" cy="104" r="4" />
      <path className="ln" d="M100 104h36M128 104v8M136 104v6" />
      <circle className="ac ln" cx="146" cy="44" r="14" />
      <path className="ln" d="m139 44 5 5 9-10" />
      <path className="ln" d="M150 22l3-6M162 30l6-3M38 30l-6-4" />
    </>
  ),
  'undangan-kedaluwarsa': (
    <>
      {ground}
      <rect className="pa ln" x="40" y="40" width="100" height="66" rx="8" />
      <path className="ln" d="M40 46l50 34 50-34" />
      <circle className="at ln" cx="128" cy="98" r="18" />
      <path className="ln" d="M128 88v10l7 5" />
      <circle className="pa ln" cx="150" cy="38" r="12" />
      <path className="ln" d="m145 33 10 10M155 33l-10 10" />
    </>
  ),
  'sesi-habis': (
    <>
      {ground}
      <circle className="pa ln" cx="94" cy="68" r="42" />
      <path className="ln" d="M94 40v28l18 10" />
      <path className="ln" d="M94 30v4M94 102v4M56 68h4M128 68h4" />
      <rect className="ac ln" x="124" y="86" width="32" height="26" rx="5" />
      <path className="ln" d="M130 86v-6a10 10 0 0 1 20 0v6M140 96v6" />
    </>
  ),
  'selamat-datang': (
    <>
      {ground}
      <path className="pa ln" d="M100 18 140 32v30c0 28-24 46-40 56-16-10-40-28-40-56V32z" />
      <path className="ln" d="m84 66 11 11 21-23" strokeWidth="4" />
      <path className="ac ln" d="m148 28 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
      <path className="at ln" d="m46 84 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
    </>
  ),
};

export interface IllustrationProps {
  name: IllustrationName;
  size?: keyof typeof SIZE;
  className?: string;
}

export function Illustration({ name, size = 'md', className }: IllustrationProps) {
  const [w, h] = SIZE[size];
  return (
    <svg className={cn('il', className)} viewBox="0 0 200 140" width={w} height={h} aria-hidden="true" focusable="false">
      {ART[name]}
    </svg>
  );
}
