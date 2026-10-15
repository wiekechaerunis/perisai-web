import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders, makeQueryClient } from '@/App';
import { services } from '@/services';
import { AkunSayaLayout, AkunSayaProfilPage } from '../account/AkunSayaPages';
import { PenggunaPage } from './PenggunaPage';
import { UserDetailPage } from './components/UserDetailPanel';

/** Halaman detail (bukan panel samping lagi): tunggu judul h1, kembalikan seluruh dokumen sebagai wadah. */
async function detailPage(name: string | RegExp): Promise<HTMLElement> {
  await screen.findByRole('heading', { level: 1, name });
  return document.body;
}

function renderAt(route: string) {
  const client = makeQueryClient();
  client.setDefaultOptions({ queries: { retry: false, refetchInterval: false } });
  const router = createMemoryRouter(
    [
      { path: '/pengguna', element: <PenggunaPage /> },
      { path: '/pengguna/:id', element: <UserDetailPage /> },
      { path: '/akun-saya', element: <AkunSayaLayout />, children: [{ index: true, element: <AkunSayaProfilPage /> }] },
    ],
    { initialEntries: [route], future: { v7_relativeSplatPath: true } },
  );
  return render(
    <AppProviders client={client}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </AppProviders>,
  );
}

describe('Manajemen pengguna — PIC KKKS (FR-UP-24, R-1)', () => {
  it('hanya organisasinya, tanpa filter Organisasi; undang tanpa field Organisasi', async () => {
    await services.dev!.signInAs('u-04');
    renderAt('/pengguna');
    const table = await screen.findByRole('table', { name: 'Daftar pengguna' });
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(3));
    expect(within(table).queryByText('PT Mahakam Sejahtera Petroleum')).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Organisasi' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Undang pengguna' }));
    const dialog = await screen.findByRole('dialog', { name: 'Undang pengguna' });
    expect(within(dialog).queryByLabelText(/^Organisasi/)).toBeNull();
    expect(within(dialog).queryByLabelText(/Masa berlaku akses/)).toBeNull(); // hanya R-03 (F-1)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Undang' }));
    expect(within(dialog).getByText('Nama lengkap wajib diisi.')).toBeInTheDocument();
    expect(within(dialog).getByText('Email wajib diisi.')).toBeInTheDocument();
    expect(within(dialog).getByText('Pilih role pengguna.')).toBeInTheDocument();

    await userEvent.type(within(dialog).getByLabelText(/Nama lengkap/), 'Calon Pelapor');
    await userEvent.type(within(dialog).getByLabelText(/^Email/), 'pelapor.baru@gmail.com');
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Role/ }));
    const roleList = within(dialog).getByRole('listbox');
    expect(within(roleList).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'R-04 PIC KKKS',
      'R-05 Pelapor KKKS',
      'R-06 Pejabat Berwenang KKKS',
    ]);
    await userEvent.click(within(roleList).getByRole('option', { name: 'R-05 Pelapor KKKS' }));
    // R-05 → field Wilayah Kerja muncul (FR-UP-12)
    await userEvent.click(await within(dialog).findByRole('combobox', { name: /Wilayah Kerja/ }));
    await userEvent.click(await within(dialog).findByRole('option', { name: 'WK Andalas Darat' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Undang' }));
    expect(await within(dialog).findByText('Email pribadi tidak dapat digunakan. Gunakan email kantor.')).toBeInTheDocument();

    const email = within(dialog).getByLabelText(/^Email/);
    await userEvent.clear(email);
    await userEvent.type(email, 'pelapor.baru@andalas-energi.example');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Undang' }));
    expect(await screen.findByText('Undangan dibuat. Pengguna perlu mengaktifkan akun melalui tautan.')).toBeInTheDocument();
    expect(await screen.findByText('Calon Pelapor')).toBeInTheDocument();
  });

  it('panel Diundang: batalkan undangan dengan alasan wajib (FR-BU-06..09)', async () => {
    await services.dev!.signInAs('u-04');
    renderAt('/pengguna/u-10');
    const panel = await detailPage(/Agus Pranoto/);
    await userEvent.click(within(panel).getByRole('button', { name: 'Batalkan undangan' }));
    const dialog = await screen.findByRole('dialog', { name: 'Batalkan undangan?' });
    const confirm = within(dialog).getByRole('button', { name: 'Batalkan undangan' });
    expect(confirm).toBeDisabled();
    expect(within(dialog).getByText('Link aktivasi yang sudah dikirim tidak akan berlaku lagi.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Alasan pembatalan' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Undangan ganda' }));
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    expect(await screen.findByText('Undangan untuk a.pranoto@andalas-energi.example dibatalkan.')).toBeInTheDocument();
    expect(await within(panel).findByText('Aktivasi akun belum selesai')).toBeInTheDocument();
  });

  it('panel Aktif: tangguhkan lewat menu, lalu aktifkan kembali (FR-SA-09..13)', async () => {
    await services.dev!.signInAs('u-04');
    renderAt('/pengguna/u-05');
    const panel = await detailPage(/Dimas Pratama/);
    await userEvent.click(within(panel).getByRole('button', { name: 'Aksi lainnya' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Tangguhkan akun' }));
    const dialog = await screen.findByRole('dialog', { name: 'Tangguhkan akun?' });
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Alasan penangguhan' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Lainnya' }));
    const confirm = within(dialog).getByRole('button', { name: 'Tangguhkan' });
    expect(confirm).toBeDisabled(); // "Lainnya" wajib penjelasan
    await userEvent.type(within(dialog).getByLabelText(/Penjelasan/), 'Audit akses');
    await userEvent.click(confirm);
    expect(await screen.findByText('Akun Dimas Pratama ditangguhkan.')).toBeInTheDocument();
    await userEvent.click(await within(panel).findByRole('button', { name: 'Aktifkan kembali' }));
    const re = await screen.findByRole('dialog', { name: 'Reaktivasi akun?' });
    expect(within(re).getByText('Riwayat perubahan status')).toBeInTheDocument();
    await userEvent.click(within(re).getByRole('button', { name: 'Aktifkan kembali' }));
    expect(await screen.findByText('Akun Dimas Pratama diaktifkan kembali.')).toBeInTheDocument();
  });

  it('PIC tidak melihat aksi status pada akunnya sendiri (FR-SA-06)', async () => {
    await services.dev!.signInAs('u-04');
    renderAt('/pengguna/u-04');
    const panel = await detailPage(/Rina Wiyono/);
    expect(within(panel).queryByRole('button', { name: 'Aksi lainnya' })).toBeNull();
  });
});

describe('Akun Saya (FR-AS-003, -006)', () => {
  it('ubah jabatan lalu simpan', async () => {
    await services.dev!.signInAs('u-05');
    renderAt('/akun-saya');
    const jabatan = await screen.findByLabelText('Jabatan');
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeDisabled();
    await userEvent.clear(jabatan);
    await userEvent.type(jabatan, 'Koordinator Lapangan');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(await screen.findByText('Profil berhasil diperbarui.')).toBeInTheDocument();
    expect(screen.getByText('Anda tidak dapat mengubah role akun Anda sendiri.')).toBeInTheDocument();
  });
});
