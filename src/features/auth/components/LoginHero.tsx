/**
 * Panel visual kanan layar Login (Figma 85:4826). Dekoratif: foto anjungan lepas pantai dengan potongan miring
 * (mask 85:4828 → clip-path), aksen lime, judul, teks pendukung, tiga kapabilitas, dan tagline.
 * Aksen memakai `brand-lime` DS (#bed630); Figma #b7d334 (selisih kecil, dicatat di DS_GAPS.md).
 */
import { Bell, ChartLine, Shield } from 'lucide-react';
import hero from '@/assets/figma/hero.png';
import { loginHeroCopy as c } from '../copy';

const ICONS = [Shield, ChartLine, Bell] as const;

export function LoginHero() {
  return (
    <div className="absolute inset-0">
      <img
        src={hero}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-bottom"
        style={{ clipPath: 'polygon(19.15% 0, 100% 0, 100% 100%, 0 100%)' }}
      />
      <div className="absolute right-[36px] top-[36px] flex w-[114px] flex-col gap-[9px]">
        <span aria-hidden className="h-px w-[34px] bg-[color:var(--figma-hero-ink)]" />
        <p className="text-caption uppercase leading-[normal] text-surface-sunken">
          {c.tagline.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </p>
      </div>
      <div className="absolute bottom-[90px] left-[19%] flex w-[min(646px,72%)] flex-col gap-6">
        <div className="flex flex-col gap-[10px]">
          <span aria-hidden className="h-[3px] w-[36px] bg-brand-lime" />
          <p className="text-[34px] font-semibold leading-[40px] text-[color:var(--figma-hero-ink)]">
            {c.judul.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <p className="max-w-[570px] text-[14px] leading-[21px] text-[color:var(--figma-hero-ink-muted)]">{c.pendukung}</p>
        </div>
        <ul className="grid grid-cols-3 gap-[28px]">
          {c.kapabilitas.map((label, i) => {
            const Icon = ICONS[i]!;
            return (
              <li key={label.join(' ')} className="flex items-center gap-[10px]">
                <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-[color:var(--figma-hero-ink)] text-[color:var(--figma-hero-ink)]">
                  <Icon aria-hidden size={18} strokeWidth={1.8} />
                </span>
                <span className="text-caption font-medium text-[color:var(--figma-hero-ink)]">
                  {label.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
