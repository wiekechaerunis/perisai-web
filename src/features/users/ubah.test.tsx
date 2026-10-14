/**
 * Test UI PRD Ubah Data & Role Pengguna: halaman ubah (FR-UDR-03, -09, -11, FR-HE-17), daftar Permintaan Ubah Email
 * (FR-UDR-15, -16), tombol "Ubah data" di panel (FR-UDR-01, D-7), dan halaman tautan verifikasi email (FR-UDR-05).
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, RouterProvider, Routes, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders, makeQueryClient } from '@/App';
import { services } from '@/services';
import { MOCK_PASSWORD } from '@/services/mock/seed';
import { VerifikasiEmailPage } from '../email-links/EmailLinkPages';
import { PenggunaPage } from './PenggunaPage';
import { PermintaanEmailPage } from './PermintaanEmailPage';
import { UbahPenggunaPage } from './UbahPenggunaPage';

function client() {
  const c = makeQueryClient();
  c.setDefaultOptions({ queries: { retry: false, refetchInterval: false } });
  return c;
}

/** Halaman ubah memakai useBlocker → butuh data router (tanpa navigasi di test, jsdom AbortSignal). */
function renderUbah(id: string) {
  const router = createMemoryRouter([{ path: '/pengguna/:id/ubah', element: <UbahPenggunaPage /> }], {
    initialEntries: [`/pengguna/${id}/ubah`],
    future: { v7_relativeSplatPath: true },
  });
  return render(
    <AppProviders client={client()}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </AppProviders>,
  );
}

function renderPage(route: string) {
  return render(
    <AppProviders client={client()}>
      <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/pengguna/:id" element={<PenggunaPage />} />
          <Route path="/permintaan-ubah-email" element={<PermintaanEmailPage />} />
          <Route path="/verifikasi-email/:token" element={<VerifikasiEmailPage />} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

describe('Ubah data pengguna (FR-UDR-03, -09, FR-HE-17)', () => {
  it('validasi Tabel E-UDR lalu ringkasan sebelum/sesudah + perbedaan hak akses', async () => {
    await services.dev!.signInAs('u-04');
    renderUbah('u-06');
    const nama = await screen.findByLabelText(/Nama lengkap/);
    await userEvent.clear(nama);
    await userEvent.type(nama, 'Sr');
    await userEvent.click(screen.getByRole('button', { name: 'Tinjau perubahan' }));
    expect(screen.getByText('Nama harus 3–150 karakter.')).toBeInTheDocument();

    await userEvent.type(nama, 'i Lestari W.');
    await userEvent.click(screen.getByRole('combobox', { name: /Role/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'R-04 PIC KKKS' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tinjau perubahan' }));

    const table = await screen.findByRole('table', { name: 'Ringkasan perubahan' });
    expect(within(table).getByText('Sri Lestari')).toBeInTheDocument();
    expect(within(table).getByText('Sri Lestari W.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Perbedaan hak akses' })).toBeInTheDocument();
    expect(screen.getByText(/Identitas & Akses/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Kembali mengubah' })).toBeInTheDocument();
  });

  it('akun sendiri: role read-only dengan keterangan, email lewat Akun Saya (FR-UDR-11)', async () => {
    await services.dev!.signInAs('u-04');
    renderUbah('u-04');
    expect(await screen.findByText('Anda tidak dapat mengubah role akun Anda sendiri.')).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /Role/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Buka Akun Saya' })).toBeInTheDocument();
  });
});

describe('Panel pengguna — tombol Ubah data (FR-UDR-01, D-7)', () => {
  it('Administrator Teknis melihat tautan Ubah, tanpa aksi status dan reset kata sandi (Figma 109:16236)', async () => {
    await services.dev!.signInAs('u-07');
    renderPage('/pengguna/u-05');
    expect((await screen.findAllByRole('button', { name: 'Ubah' })).length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByRole('button', { name: 'Reset kata sandi' })).toBeNull();
  });

  it('PIC: Reset kata sandi mengirim tautan; Aktivitas menampilkan sesi + riwayat (PRD Profil Pengguna)', async () => {
    await services.dev!.signInAs('u-05');
    await services.dev!.signInAs('u-04');
    renderPage('/pengguna/u-05');
    await userEvent.click(await screen.findByRole('button', { name: 'Reset kata sandi' }));
    const dialog = await screen.findByRole('dialog', { name: 'Kirim tautan atur ulang kata sandi?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Kirim tautan' }));
    await waitFor(async () =>
      expect((await services.dev!.inbox()).some((m) => m.to === 'd.pratama@andalas-energi.example' && m.link?.startsWith('/atur-ulang-kata-sandi/'))).toBe(true),
    );
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Kirim tautan atur ulang kata sandi?' })).toBeNull());
    await userEvent.click(screen.getByRole('tab', { name: 'Aktivitas' }));
    expect(await screen.findByRole('heading', { name: /Sesi aktif \(\d+\)/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Keluar' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Riwayat perubahan' })).toBeInTheDocument();
    expect(screen.getByText('Tautan atur ulang kata sandi dikirim')).toBeInTheDocument();
  });
});

describe('Permintaan ubah email (FR-UDR-15, -16)', () => {
  it('PIC melihat permintaan anggotanya; tolak wajib alasan', async () => {
    await services.dev!.signInAs('u-05');
    await services.account.requestEmailChange({ password: MOCK_PASSWORD, emailBaru: 'dimas.baru@andalas-energi.example' });
    const otp = /(\d{6})/.exec((await services.dev!.inbox()).find((m) => m.to === 'dimas.baru@andalas-energi.example')!.body)![1]!;
    await services.account.verifyEmailChange(otp);

    await services.dev!.signInAs('u-04');
    renderPage('/permintaan-ubah-email');
    const table = await screen.findByRole('table', { name: 'Daftar permintaan ubah email' });
    await waitFor(() => expect(within(table).getByText('dimas.baru@andalas-energi.example')).toBeInTheDocument());
    await userEvent.click(within(table).getByRole('button', { name: 'Tolak' }));
    const dialog = await screen.findByRole('dialog', { name: 'Tolak perubahan email?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tolak' }));
    expect(within(dialog).getByText('Alasan wajib diisi.')).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText(/Alasan penolakan/), 'Email belum terdaftar di HR.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tolak' }));
    expect(await screen.findByText('Tidak ada permintaan yang menunggu persetujuan.')).toBeInTheDocument();
  });
});

describe('Tautan verifikasi email (FR-UDR-05)', () => {
  it('tautan valid meminta konfirmasi; token acak tidak valid', async () => {
    await services.dev!.signInAs('u-04');
    await services.users.updateUser('u-05', { nama: 'Dimas Pratama', jabatan: 'Security Officer Lapangan', email: 'dimas.p@andalas-energi.example', roles: ['R-05'] });
    const link = (await services.dev!.inbox()).find((m) => m.link?.startsWith('/verifikasi-email/'))!.link!;
    renderPage(link);
    expect(await screen.findByRole('button', { name: 'Verifikasi email' })).toBeInTheDocument();
    expect(screen.getByText(/dimas\.p@andalas-energi\.example/)).toBeInTheDocument();
  });

  it('token tidak dikenal → Tautan tidak valid', async () => {
    renderPage('/verifikasi-email/acak');
    expect(await screen.findByText('Tautan tidak valid')).toBeInTheDocument();
  });
});
