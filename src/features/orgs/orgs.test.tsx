/** Test UI PRD Kelola Organisasi KKKS: daftar, tambah (chip domain), panel, nonaktifkan, mode baca PIC. */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

function Probe() {
  const l = useLocation();
  return <output data-testid="loc">{l.pathname}</output>;
}
import { describe, expect, it } from 'vitest';
import { AppProviders, makeQueryClient } from '@/App';
import { services } from '@/services';
import { OrganisasiPage } from './OrganisasiPage';

/** Tanpa v7_startTransition: di jsdom navigasi dalam transisi tertahan oleh penutupan dialog + toast (di browser normal). */
function renderAt(route: string) {
  const client = makeQueryClient();
  client.setDefaultOptions({ queries: { retry: false, refetchInterval: false } });
  return render(
    <AppProviders client={client}>
      <MemoryRouter initialEntries={[route]} future={{ v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/organisasi" element={<OrganisasiPage />} />
          <Route path="/organisasi/:kode" element={<OrganisasiPage />} />
        </Routes>
        <Probe />
      </MemoryRouter>
    </AppProviders>,
  );
}

describe('Organisasi — Administrator Bisnis', () => {
  it('daftar aktif + penanda Tanpa PIC; tambah organisasi dengan chip domain (FR-ORG-02, -04, -05, -08)', async () => {
    await services.dev!.signInAs('u-03');
    renderAt('/organisasi');
    const table = await screen.findByRole('table', { name: 'Daftar organisasi' });
    await waitFor(() => expect(within(table).getByText('PT Natuna Lepas Pantai')).toBeInTheDocument());
    expect(within(table).queryByText('PT Seram Timur Energi')).toBeNull();
    expect(within(table).getAllByText('Tanpa PIC').length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: 'Tambah organisasi' }));
    const dialog = await screen.findByRole('dialog', { name: 'Tambah organisasi' });
    await waitFor(() => expect(within(dialog).getByLabelText(/^Kode/)).toHaveValue('KKKS-005'));
    await userEvent.type(within(dialog).getByLabelText(/Nama organisasi/), 'Contoh Energi Nusantara');
    const domain = within(dialog).getByLabelText(/Domain email/);
    await userEvent.type(domain, 'gmail.com{Enter}');
    expect(within(dialog).getByText(/Domain email pribadi tidak dapat dipakai/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Hapus gmail.com' }));
    await userEvent.type(domain, 'contoh-energi.co.id{Enter}');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Tambah organisasi' }));
    expect(await screen.findByText('Organisasi ditambahkan.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undang PIC KKKS' })).toBeInTheDocument();
    expect(await screen.findByRole('dialog', { name: 'Contoh Energi Nusantara' })).toBeInTheDocument();
  });

  it('nonaktifkan: tombol aktif setelah alasan dipilih dan kode diketik (FR-ORG-14)', async () => {
    await services.dev!.signInAs('u-03');
    renderAt('/organisasi/KKKS-003');
    const panel = await screen.findByRole('dialog', { name: 'PT Natuna Lepas Pantai' });
    await userEvent.click(within(panel).getByRole('button', { name: 'Aksi organisasi' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Nonaktifkan organisasi' }));
    const modal = await screen.findByRole('dialog', { name: 'Nonaktifkan PT Natuna Lepas Pantai?' });
    const tombol = within(modal).getByRole('button', { name: 'Nonaktifkan organisasi' });
    expect(tombol).toBeDisabled();
    await userEvent.click(within(modal).getByRole('combobox', { name: 'Alasan penonaktifan' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Kontrak kerja sama berakhir' }));
    await userEvent.type(within(modal).getByLabelText('Ketik KKKS-003 untuk mengonfirmasi'), 'KKKS-003');
    expect(tombol).toBeEnabled();
  });
});

describe('Organisasi — PIC KKKS (FR-ORG-20)', () => {
  it('langsung detail organisasinya, mode baca', async () => {
    await services.dev!.signInAs('u-04');
    renderAt('/organisasi');
    expect(await screen.findByRole('heading', { name: 'PT Andalas Energi Hulu' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tambah organisasi' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ubah' })).toBeNull();
    await userEvent.click(screen.getByRole('tab', { name: 'Akses' }));
    expect(await screen.findByText('konsultan.andalas@mitra.example')).toBeInTheDocument();
    expect(screen.queryByText('Konsultan keamanan kontrak 2026')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tambah email' })).toBeNull();
  });
});
