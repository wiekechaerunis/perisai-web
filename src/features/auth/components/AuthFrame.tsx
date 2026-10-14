/**
 * Bingkai layar publik PERISAI sesuai Figma CORE-PERISAI.
 * - LoginFrame: Login 85:4794 (split + panel hero).
 * - PublicFrame: OTP/Aktivasi 118:235, 116:144, 66:2546..2602 (header + kolom tengah). Lupa/Atur ulang kata sandi
 *   tidak punya frame Figma dan mengikuti bingkai ini (PR-11, keputusan 14 Okt 2026).
 * Logo PERISAI dari Figma (aset "Logo PERISAI" juga ada di DS; K-11).
 */
import type { ReactNode } from 'react';
import logoPerisai from '@/assets/figma/logo-perisai.png';
import { AuthPageLayout, AuthSplitLayout } from '@/components/layout/AuthLayout';
import { SUPPORT_URL } from '@/lib/i18n/id';
import { DevRoleSwitcher } from '../../dev/DevTools';
import { services } from '@/services';
import { authFrameCopy as c } from '../copy';
import { LoginHero } from './LoginHero';

function Logo({ size }: { size: 'lg' | 'sm' }) {
  return (
    <img
      src={logoPerisai}
      alt={c.logoAlt}
      className={size === 'lg' ? 'h-[50px] w-[150px] object-contain object-left' : 'h-[34px] w-[104px] object-contain object-left'}
    />
  );
}

/** "Butuh Bantuan? Hubungi Support" (FR-AK-02; Figma 66:2549). */
export function SupportLink() {
  return (
    <p className="flex items-center gap-6 text-[14px] font-medium leading-[19.6px]">
      <span className="hidden text-[color:var(--figma-header-muted)] sm:inline">{c.butuhBantuan}</span>
      <a href={SUPPORT_URL} className="text-[color:var(--figma-link-support)] hover:underline">
        {c.hubungiSupport}
      </a>
    </p>
  );
}

export function LoginFrame({ children }: { children: ReactNode }) {
  return (
    <AuthSplitLayout
      brand={<Logo size="lg" />}
      aside={<LoginHero />}
      footer={
        <div className="flex flex-col gap-4">
          {services.dev && (
            <div className="max-w-[420px] border-t border-border-subtle pt-4">
              <DevRoleSwitcher inverse={false} />
            </div>
          )}
          <p className="text-caption text-[color:var(--figma-footer-ink)]">{c.hakCipta}</p>
        </div>
      }
    >
      {children}
    </AuthSplitLayout>
  );
}

export function PublicFrame({ children, width = 'form' }: { children: ReactNode; width?: 'form' | 'state' }) {
  return (
    <AuthPageLayout brand={<Logo size="sm" />} headerAction={<SupportLink />} width={width}>
      {children}
    </AuthPageLayout>
  );
}
