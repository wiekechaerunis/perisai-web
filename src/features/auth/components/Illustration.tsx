/**
 * Ilustrasi state tautan email (Aktivasi, Atur ulang kata sandi, tautan email). DS v2 · Lime StatusPage: ilustrasi
 * garis EmptyState 200×140 bertoken (menggantikan bitmap Figma 78:4289 / 78:4323 / 78:4328).
 */
import { Illustration as DsIllustration, type IllustrationName } from '@/components/patterns/Illustration';

const NAME: Record<'invalid' | 'used' | 'expired', IllustrationName> = {
  invalid: 'tautan-tidak-valid',
  used: 'akun-aktif',
  expired: 'undangan-kedaluwarsa',
};

export function Illustration({ kind }: { kind: keyof typeof NAME }) {
  return <DsIllustration name={NAME[kind]} size="lg" />;
}
