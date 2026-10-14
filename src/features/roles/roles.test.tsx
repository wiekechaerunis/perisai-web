/** Test UI PRD Katalog Role & Aktif/Nonaktif Role. */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders, makeQueryClient } from '@/App';
import { services } from '@/services';
import { buildNav } from '../shell/navigation';
import { RolePage } from './RolePage';

function renderAt(route: string) {
  const client = makeQueryClient();
  client.setDefaultOptions({ queries: { retry: false, refetchInterval: false } });
  return render(
    <AppProviders client={client}>
      <MemoryRouter initialEntries={[route]} future={{ v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/role" element={<RolePage />} />
          <Route path="/role/:kode" element={<RolePage />} />
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
    const panel = await screen.findByRole('dialog', { name: 'Pejabat Berwenang KKKS' });
    await userEvent.click(within(panel).getByRole('button', { name: 'Aksi role' }));
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
    const panel = await screen.findByRole('dialog', { name: 'Administrator Bisnis' });
    expect(within(panel).queryByRole('button', { name: 'Aksi role' })).toBeNull();
    expect(within(panel).getByText('Administrator Bisnis tidak dapat dinonaktifkan.')).toBeInTheDocument();
  });
});

describe('Buat role & ubah hak akses (FR-KR-09, -09f)', () => {
  it('buat role: pemilih hak akses mengikuti jenis organisasi, panel role baru terbuka', async () => {
    await services.dev!.signInAs('u-03');
    renderAt('/role');
    await userEvent.click(await screen.findByRole('button', { name: 'Buat role' }));
    const dlg = await screen.findByRole('dialog', { name: 'Buat role' });
    await userEvent.type(within(dlg).getByLabelText(/^Nama role/), 'Analis KKKS');
    await userEvent.type(within(dlg).getByLabelText(/^Deskripsi/), 'Menganalisis laporan organisasinya');
    await userEvent.click(within(dlg).getByRole('button', { name: 'Buat role' }));
    expect(within(dlg).getByText('Pilih minimal satu hak akses.')).toBeInTheDocument();
    // KKKS tidak dapat memilih M-23 AI Guardrails (milik R-07 / Kontraktor).
    expect(within(dlg).queryByText('AI Guardrails')).toBeNull();
    const row = within(dlg).getByRole('rowheader', { name: /M-01/ }).closest('tr')!;
    await userEvent.click(within(row as HTMLElement).getByRole('checkbox', { name: 'Lihat' }));
    await userEvent.click(within(dlg).getByRole('button', { name: 'Buat role' }));
    expect(await screen.findByRole('dialog', { name: 'Analis KKKS' })).toBeInTheDocument();
  });

  it('ubah hak akses menampilkan jumlah pengguna terdampak sebelum disimpan', async () => {
    await services.dev!.signInAs('u-03');
    renderAt('/role/R-06');
    const panel = await screen.findByRole('dialog', { name: 'Pejabat Berwenang KKKS' });
    await userEvent.click(within(panel).getByRole('button', { name: 'Ubah hak akses' }));
    const dlg = await screen.findByRole('dialog', { name: 'Ubah hak akses' });
    const row = within(dlg).getByRole('rowheader', { name: /M-15/ }).closest('tr')!;
    await userEvent.click(within(row as HTMLElement).getByRole('checkbox', { name: 'Lihat' }));
    await userEvent.click(within(dlg).getByRole('button', { name: 'Lanjutkan' }));
    const confirm = await screen.findByRole('dialog', { name: /Simpan hak akses R-06/ });
    expect(within(confirm).getByText(/pengguna yang memakai role ini pada permintaan berikutnya/)).toBeInTheDocument();
    await userEvent.click(within(confirm).getByRole('button', { name: 'Simpan hak akses' }));
    expect(await screen.findByText('Hak akses R-06 diperbarui.')).toBeInTheDocument();
  });
});
