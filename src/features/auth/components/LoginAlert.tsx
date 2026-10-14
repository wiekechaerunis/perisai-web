/**
 * Alert di atas form Login (Tabel E-1 "Alert di atas form"), tampilan mengikuti Figma 85:4911:
 * latar merah sangat muda, border merah muda, radius 12px, ikon + judul merah, isi abu gelap,
 * kata "Hubungi Support" sebagai tautan biru. Nilai warna di luar DS ada di styles/figma.css (DS_GAPS F-02).
 * Varian `info` (pesan logout/sesi berakhir/reset berhasil) tidak ada di Figma → memakai Callout info DS.
 */
import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Callout } from '@/components/patterns/Callout';
import { SUPPORT_URL } from '@/lib/i18n/id';

export interface LoginAlertProps {
  title: string;
  body: string;
  /** Kata di dalam `body` yang dijadikan tautan ke Support (FR-LG-08). */
  linkText?: string;
  variant?: 'error' | 'info';
}

function withLink(body: string, linkText?: string): ReactNode {
  if (!linkText || !body.includes(linkText)) return body;
  const [before, after] = body.split(linkText);
  return (
    <>
      {before}
      <a href={SUPPORT_URL} className="font-medium text-[color:var(--figma-link-inline)] hover:underline">
        {linkText}
      </a>
      {after}
    </>
  );
}

export function LoginAlert({ title, body, linkText, variant = 'error' }: LoginAlertProps) {
  if (variant === 'info') {
    return <Callout variant="info">{body}</Callout>;
  }
  return (
    <div
      role="alert"
      tabIndex={-1}
      className="flex flex-col gap-2 rounded-[12px] border border-[color:var(--figma-alert-border)] bg-[color:var(--figma-alert-bg)] p-4 focus-visible:outline-none"
    >
      <p className="flex items-center gap-2 text-[14px] font-semibold leading-[20px] text-[color:var(--figma-alert-title)]">
        <AlertCircle aria-hidden size={14} strokeWidth={1.8} />
        {title}
      </p>
      <p className="text-caption leading-[1.3] text-ink-muted">{withLink(body, linkText)}</p>
    </div>
  );
}
