/**
 * Test UI gelombang 3: Log Akses (FR-LA-*), Jejak Audit (FR-JA-12), navigasi M-22 (FR-LA-06), panel pengguna
 * (FR-HE-14, FR-LA-11) dan Akun Saya (FR-HE-16, FR-LA-15a..c).
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, RouterProvider, Routes, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders, makeQueryClient } from '@/App';
import { services } from '@/services';
import { AkunSayaKeamananPage, AkunSayaLayout, AkunSayaProfilPage } from '../account/AkunSayaPages';
import { buildNav } from '../shell/navigation';
import { PenggunaPage } from '../users/PenggunaPage';
import { UserDetailPage } from '../users/components/UserDetailPanel';
import { JejakAuditPage } from './JejakAuditPage';
import { LogAksesPage } from './LogAksesPage';

/** Halaman berbasis URL params: MemoryRouter (navigasi data router di jsdom gagal karena AbortSignal). */
function renderPage(route: string) {
  const client = makeQueryClient();
  client.setDefaultOptions({ queries: { retry: false, refetchInterval: false } });
  return render(
    <AppProviders client={client}>
      <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/log-akses" element={<LogAksesPage />} />
          <Route path="/jejak-audit" element={<JejakAuditPage />} />
          <Route path="/pengguna" element={<PenggunaPage />} />
          <Route path="/pengguna/:id" element={<UserDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

function renderAt(route: string) {
  const client = makeQueryClient();
  client.setDefaultOptions({ queries: { retry: false, refetchInterval: false } });
  const router = createMemoryRouter(
    [
      {
        path: '/akun-saya',
        element: <AkunSayaLayout />,
        children: [
          { index: true, element: <AkunSayaProfilPage /> },
          { path: 'keamanan', element: <AkunSayaKeamananPage /> },
        ],
      },
    ],
    { initialEntries: [route], future: { v7_relativeSplatPath: true } },
  );
  return render(
    <AppProviders client={client}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </AppProviders>,
  );
}

const navLabels = (roles: Parameters<typeof buildNav>[0]) => buildNav(roles).flatMap((g) => g.items.map((i) => i.label));

describe('Navigasi M-22 (FR-LA-06)', () => {
  it('Log Akses & Jejak Audit untuk R-02/R-03/R-04, tidak untuk R-07 dan R-05', () => {
    expect(navLabels(['R-03'])).toEqual(expect.arrayContaining(['Log akses', 'Jejak audit']));
    expect(navLabels(['R-04'])).toEqual(expect.arrayContaining(['Log akses', 'Jejak audit']));
    expect(navLabels(['R-07'])).not.toContain('Log akses');
    expect(navLabels(['R-05'])).not.toContain('Jejak audit');
  });
});

describe('Log Akses', () => {
  it('R-04 hanya melihat organisasinya; tanpa tombol Ekspor (FR-LA-07, FR-LA-16)', async () => {
    await services.dev!.signInAs('u-04');
    renderPage('/log-akses');
    const table = await screen.findByRole('table', { name: 'Daftar log akses' });
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(1));
    expect(within(table).queryByText('PT Mahakam Sejahtera Petroleum')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ekspor CSV' })).toBeNull();
  });

  it('R-03 bisa mengekspor dan membuka detail entri (FR-LA-09, FR-LA-16)', async () => {
    await services.dev!.signInAs('u-03');
    renderPage('/log-akses');
    expect(await screen.findByRole('button', { name: 'Ekspor CSV' })).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: 'Daftar log akses' });
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(1));
    await userEvent.click(within(table).getAllByRole('row')[1]!);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});

describe('Jejak Audit (FR-JA-12)', () => {
  it('dibuka kosong sampai filter diterapkan', async () => {
    await services.dev!.signInAs('u-03');
    renderPage('/jejak-audit');
    expect(await screen.findByText('Pilih filter untuk menampilkan jejak audit')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Tampilkan' }));
    const table = await screen.findByRole('table');
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(1));
  });
});

describe('Panel pengguna — tab Akses & Aktivitas (FR-HE-14, FR-LA-11)', () => {
  it('R-03 melihat hak akses efektif dan aktivitas', async () => {
    await services.dev!.signInAs('u-03');
    renderPage('/pengguna/u-05');
    await userEvent.click(await screen.findByRole('tab', { name: 'Akses' }));
    expect(await screen.findByRole('heading', { name: /Izin efektif \(\d+\)/ })).toBeInTheDocument();
    expect(screen.getByText('M-01.view')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Aktivitas' })).toBeInTheDocument();
  });
});

describe('Akun Saya (FR-HE-16, FR-LA-15a..c)', () => {
  it('menampilkan hak akses efektif sendiri', async () => {
    await services.dev!.signInAs('u-04');
    renderAt('/akun-saya');
    expect(await screen.findByRole('heading', { name: 'Hak akses efektif' })).toBeInTheDocument();
  });

  it('riwayat masuk tanpa alamat IP dan tautan Ubah kata sandi', async () => {
    await services.dev!.signInAs('u-04');
    renderAt('/akun-saya/keamanan');
    expect(await screen.findByRole('heading', { name: 'Riwayat masuk' })).toBeInTheDocument();
    expect(screen.getByText(/Tidak mengenali aktivitas ini\?/)).toBeInTheDocument();
    expect(screen.queryByText(/Alamat IP/)).toBeNull();
  });
});

describe('Undang R-02 — cakupan (FR-CD-04b)', () => {
  it('pilihan Seluruh KKKS / Beberapa KKKS; Beberapa wajib memilih KKKS', async () => {
    await services.dev!.signInAs('u-03');
    renderPage('/pengguna');
    await userEvent.click(await screen.findByRole('button', { name: 'Undang pengguna' }));
    const dialog = await screen.findByRole('dialog', { name: 'Undang pengguna' });
    await userEvent.click(within(dialog).getByRole('combobox', { name: /^Organisasi/ }));
    await userEvent.click(await within(dialog).findByRole('option', { name: 'SKK Migas' }));
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Role/ }));
    await userEvent.click(within(within(dialog).getByRole('listbox')).getByRole('option', { name: /R-02/ }));
    expect(await within(dialog).findByRole('radio', { name: 'Seluruh KKKS' })).toBeChecked();
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Beberapa KKKS tertentu' }));
    expect(within(dialog).getByRole('combobox', { name: /KKKS yang ditugaskan/ })).toBeInTheDocument();
  });
});
