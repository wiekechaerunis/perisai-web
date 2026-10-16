import type { Meta, StoryObj } from '@storybook/react';
import { LayoutDashboard, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { TabsNav } from '../ui/Tabs';
import { AppShell, PageBody } from './AppShell';
import { AuthPageLayout, AuthSplitLayout } from './AuthLayout';
import { PageHeader } from './PageHeader';
import { RoleSwitcher } from './RoleSwitcher';
import { Section } from './Section';
import { Sidebar } from './Sidebar';

const meta: Meta = { title: 'DS/Tata letak', parameters: { layout: 'fullscreen' } };
export default meta;
type S = StoryObj;

const sidebar = (
  <Sidebar
    navLabel="Navigasi utama"
    groups={[
      {
        key: 'u',
        label: 'Utama',
        items: [
          { key: 'm1', label: 'Ruang kerja', to: '/', icon: <LayoutDashboard aria-hidden size={16} strokeWidth={1.8} /> },
          { key: 'm15', label: 'Manajemen pengguna', to: '/pengguna', icon: <Users aria-hidden size={16} strokeWidth={1.8} />, count: 2 },
        ],
      },
    ]}
    footerText="© 2026 SKK Migas. Hak cipta dilindungi. v0.1.0"
    footer={
      <RoleSwitcher
        label="Masuk sebagai (uji)"
        placeholder="Pilih role"
        users={[{ id: 'u-04', label: 'R-04 Admin KKKS' }]}
        onSelect={() => undefined}
      />
    }
  />
);

export const Kerangka: S = {
  name: 'AppShell + Sidebar + PageHeader + Section',
  render: () => (
    <AppShell skipLinkLabel="Lompat ke konten" sidebar={sidebar}>
      <PageHeader
        breadcrumbs={[{ label: 'Beranda', to: '/' }, { label: 'Pengaturan akun' }]}
        title="Pengaturan akun"
        summary="Kelola kata sandi dan perangkat yang sedang masuk ke akun Anda."
        actions={<Button>Ekspor</Button>}
        tabs={<TabsNav label="Bagian" items={[{ value: 'a', label: 'Ubah kata sandi', to: '/' }, { value: 'b', label: 'Sesi aktif', to: '/sesi' }]} />}
      />
      <PageBody>
        <Section title="Sesi aktif" description="Perangkat yang sedang masuk ke akun Anda." action={<Button variant="quiet">Lihat semua</Button>}>
          <p className="text-body text-ink">Isi section.</p>
        </Section>
      </PageBody>
    </AppShell>
  ),
};

export const LayarPublikSplit: S = {
  name: 'AuthSplitLayout (Figma Login 85:4794)',
  render: () => (
    <AuthSplitLayout
      brand={<span className="text-section-title font-semibold tracking-[0.04em]">PERISAI</span>}
      footer={<p className="text-caption text-ink-muted">© 2026 SKK Migas</p>}
      aside={<div className="absolute inset-0 bg-surface-sunken" />}
    >
      <h1 className="text-page-title">Masuk ke PERISAI</h1>
    </AuthSplitLayout>
  ),
};

export const LayarPublikHeader: S = {
  name: 'AuthPageLayout (Figma OTP 118:235)',
  render: () => (
    <AuthPageLayout brand={<span className="text-section-title font-semibold tracking-[0.04em]">PERISAI</span>} headerAction={<a className="text-body underline" href="#">Hubungi Support</a>}>
      <h1 className="text-center text-page-title">Masukkan kode verifikasi</h1>
    </AuthPageLayout>
  ),
};
