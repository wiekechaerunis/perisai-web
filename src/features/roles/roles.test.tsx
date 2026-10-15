/** Test UI PRD Katalog Role & Aktif/Nonaktif Role. */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, RouterProvider, Routes, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders, makeQueryClient } from '@/App';
import { services } from '@/services';
import { buildNav } from '../shell/navigation';
import { BuatRolePage } from './BuatRolePage';
import { RoleDetailPage, RolePage } from './RolePage';

function renderAt(route: string) {
  const client = makeQueryClient();
  client.setDefaultOptions({ queries: { retry: false, refetchInterval: false } });
  return render(
    <AppProviders client={client}>
      <MemoryRouter initialEntries={[route]} future={{ v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/role" element={<RolePage />} />
          <Route path="/role/:kode" element={<RoleDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

describe('Halaman Role (FR-KR-06, -07)', () => {
  it('menu Role hanya untuk R-03', () => {
    const labels = (r: Parameters<typeof buildNav>[0]) => buildNav(r).flatMap((g) => g.items.map((i) => i.label));
    expect(labels(['R-03'])).toContain('Role');
    expect(labels(['R-04'])).not.toContain('Role');
    expect(labels(['R-07'])).not.toContain('Role');
  });

  it('daftar tujuh role dengan jumlah pengguna bertaut', async () => {
    await services.dev!.signInAs('u-03');
    renderAt('/role');
    const table = await screen.findByRole('table', { name: 'Daftar role' });
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(8));
    expect(within(table).getByText('Pejabat Berwenang KKKS')).toBeInTheDocument();
    expect(within(table).getAllByRole('link')[0]).toHaveAttribute('href', '/pengguna?role=R-01');
  });
});

describe('Nonaktifkan role (FR-AR-04, keputusan PM 14 Okt 2026)', () => {
  it('pilih Pindahkan → wajib role tujuan dan tampil perbedaan hak akses', async () => {
    await services.dev!.signInAs('u-03');
    renderAt('/role/R-06');
    await screen.findByRole('heading', { level: 1, name: 'Pejabat Berwenang KKKS' });
    const panel = document.body;
    await userEvent.click(within(panel).getByRole('button', { name: 'Aksi lainnya' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Nonaktifkan role' }));
    const modal = await screen.findByRole('dialog', { name: 'Nonaktifkan R-06 Pejabat Berwenang KKKS?' });
    expect(within(modal).getByText(/pengguna masih memakai role ini/)).toBeInTheDocument();
    const tombol = within(modal).getByRole('button', { name: 'Nonaktifkan role' });
    expect(tombol).toBeDisabled();
    await userEvent.click(within(modal).getByRole('combobox', { name: 'Role tujuan' }));
    await userEvent.click(await screen.findByRole('option', { name: 'R-04 PIC KKKS' }));
    expect(await within(modal).findByText('Perbedaan hak akses')).toBeInTheDocument();
    expect(tombol).toBeEnabled();
    await userEvent.click(within(modal).getByRole('radio', { name: /Lewati/ }));
    expect(within(modal).queryByRole('combobox', { name: 'Role tujuan' })).toBeNull();
  });

  it('R-03 tidak menampilkan aksi nonaktifkan (FR-AR-03)', async () => {
    await services.dev!.signInAs('u-03');
    renderAt('/role/R-03');
    await screen.findByRole('heading', { level: 1, name: 'Administrator Bisnis' });
    const panel = document.body;
    expect(within(panel).getByText('Administrator Bisnis tidak dapat dinonaktifkan.')).toBeInTheDocument();
    await userEvent.click(within(panel).getByRole('button', { name: 'Aksi lainnya' }));
    expect(await screen.findByRole('menuitem', { name: 'Ubah nama dan deskripsi' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Nonaktifkan role' })).toBeNull();
  });
});

describe('Buat role & ubah hak akses (FR-KR-09, -09f)', () => {
  it('tombol Buat role membuka halaman /role/baru', async () => {
    await services.dev!.signInAs('u-03');
    const client = makeQueryClient();
    client.setDefaultOptions({ queries: { retry: false, refetchInterval: false } });
    render(
      <AppProviders client={client}>
        <MemoryRouter initialEntries={['/role']} future={{ v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/role" element={<RolePage />} />
            <Route path="/role/baru" element={<p>halaman buat role</p>} />
          </Routes>
        </MemoryRouter>
      </AppProviders>,
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Buat role' }));
    expect(await screen.findByText('halaman buat role')).toBeInTheDocument();
  });

  it('halaman Buat role: jejak lokasi, tombol kembali, validasi, hak akses mengikuti jenis organisasi', async () => {
    await services.dev!.signInAs('u-03');
    const client = makeQueryClient();
    client.setDefaultOptions({ queries: { retry: false, refetchInterval: false } });
    const router = createMemoryRouter(
      [
        { path: '/role/baru', element: <BuatRolePage /> },
        { path: '/role/:kode', element: <p>panel role</p> },
      ],
      { initialEntries: ['/role/baru'], future: { v7_relativeSplatPath: true } },
    );
    render(
      <AppProviders client={client}>
        <RouterProvider router={router} />
      </AppProviders>,
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Buat role' })).toBeInTheDocument();
    const crumbs = screen.getByRole('navigation', { name: 'Jejak lokasi' });
    expect(within(crumbs).getByRole('link', { name: 'Role' })).toHaveAttribute('href', '/role');
    expect(screen.getByRole('link', { name: 'Kembali ke Role' })).toHaveAttribute('href', '/role');
    expect(screen.queryByRole('dialog')).toBeNull();

    await userEvent.type(screen.getByLabelText(/^Nama role/), 'Analis KKKS');
    await userEvent.type(screen.getByLabelText(/^Deskripsi/), 'Menganalisis laporan organisasinya');
    await userEvent.click(screen.getByRole('button', { name: 'Buat role' }));
    expect(screen.getByText('Pilih minimal satu hak akses.')).toBeInTheDocument();
    // KKKS tidak dapat memilih M-23 AI Guardrails (milik R-07 / Kontraktor).
    expect(screen.queryByText('AI Guardrails')).toBeNull();
    const row = screen.getByRole('rowheader', { name: /M-01/ }).closest('tr')!;
    await userEvent.click(within(row as HTMLElement).getByRole('checkbox', { name: /^Lihat/ }));
    expect(screen.queryByText('Pilih minimal satu hak akses.')).toBeNull();
    expect(screen.getByText(/1 hak akses dipilih/)).toBeInTheDocument();
    // Simpan + navigasi ke panel role baru tidak diuji di sini: navigasi data router gagal di jsdom (AbortSignal);
    // pembuatan role diuji di services/mock/roles.test.ts dan diverifikasi di browser.
  });

  it('ubah hak akses menampilkan jumlah pengguna terdampak sebelum disimpan', async () => {
    await services.dev!.signInAs('u-03');
    renderAt('/role/R-06');
    await screen.findByRole('heading', { level: 1, name: 'Pejabat Berwenang KKKS' });
    const panel = document.body;
    await userEvent.click(within(panel).getByRole('button', { name: 'Ubah hak akses' }));
    const dlg = await screen.findByRole('dialog', { name: 'Ubah hak akses' });
    const row = within(dlg).getByRole('rowheader', { name: /M-15/ }).closest('tr')!;
    await userEvent.click(within(row as HTMLElement).getByRole('checkbox', { name: /^Lihat/ }));
    await userEvent.click(within(dlg).getByRole('button', { name: 'Lanjutkan' }));
    const confirm = await screen.findByRole('dialog', { name: /Simpan hak akses R-06/ });
    expect(within(confirm).getByText(/pengguna yang memakai role ini pada permintaan berikutnya/)).toBeInTheDocument();
    await userEvent.click(within(confirm).getByRole('button', { name: 'Simpan hak akses' }));
    expect(await screen.findByText('Hak akses R-06 diperbarui.')).toBeInTheDocument();
  });
});
