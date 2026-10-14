/**
 * Ilustrasi state Aktivasi dari Figma, dengan potongan (crop) yang sama seperti frame:
 * 78:4289 (tautan tidak valid), 78:4323 (akun sudah aktif), 78:4328 (undangan kedaluwarsa).
 */
import akunSudahAktif from '@/assets/figma/ilustrasi-akun-sudah-aktif.png';
import tautanTidakValid from '@/assets/figma/ilustrasi-tautan-tidak-valid.png';
import undanganKedaluwarsa from '@/assets/figma/ilustrasi-undangan-kedaluwarsa.png';

const ART = {
  invalid: { src: tautanTidakValid, w: 183, h: 150, img: { width: '204.37%', height: '166.41%', left: '-52.81%', top: '-32.44%' } },
  used: { src: akunSudahAktif, w: 180, h: 112, img: { width: '169.35%', height: '181.88%', left: '-36.6%', top: '-43.34%' } },
  expired: { src: undanganKedaluwarsa, w: 223, h: 150, img: { width: '170.45%', height: '168.78%', left: '-36.36%', top: '-29.11%' } },
} as const;

export function Illustration({ kind }: { kind: keyof typeof ART }) {
  const a = ART[kind];
  return (
    <div className="relative overflow-hidden" style={{ width: a.w, height: a.h }}>
      <img src={a.src} alt="" className="absolute max-w-none" style={a.img} />
    </div>
  );
}
