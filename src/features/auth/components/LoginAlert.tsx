/**
 * Alert di atas form Login (Tabel E-1 "Alert di atas form") — DS v2 · Lime Banner gagal (`error-bg` / `error-ink`,
 * `radius-lg`), kata "Hubungi Support" sebagai link tebal bergaris bawah. Menggantikan warna Figma 85:4911.
 * Varian `info` (pesan logout/sesi berakhir/reset berhasil) memakai Catatan (Callout info).
 */
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
      <a href={SUPPORT_URL} className="link-inline text-current">
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
    <Callout variant="error" title={title} tabIndex={-1} className="focus-visible:outline-none">
      {withLink(body, linkText)}
    </Callout>
  );
}
