import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders, makeQueryClient } from '@/App';
import { services } from '@/services';
import { MOCK_PASSWORD } from '@/services/mock/seed';
import { AktivasiOtpPage } from './pages/AktivasiOtpPage';
import { AktivasiPage } from './pages/AktivasiPage';
import { LoginOtpPage } from './pages/LoginOtpPage';
import { LoginPage } from './pages/LoginPage';

function renderAuth(route: string) {
  const client = makeQueryClient();
  client.setDefaultOptions({ queries: { retry: false, refetchInterval: false } });
  return render(
    <AppProviders client={client}>
      <MemoryRouter initialEntries={[route]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/masuk" element={<LoginPage />} />
          <Route path="/masuk/verifikasi" element={<LoginOtpPage />} />
          <Route path="/aktivasi/:token" element={<AktivasiPage />} />
          <Route path="/aktivasi/:token/verifikasi" element={<AktivasiOtpPage />} />
          <Route path="/ruang-kerja" element={<p>Ruang kerja (uji)</p>} />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  );
}

const lastCode = async () => /(\d{6})/.exec((await services.dev!.inbox())[0]!.body)![1]!;

async function fillLogin(email: string, pw: string) {
  await userEvent.type(await screen.findByLabelText('Email'), email);
  await userEvent.type(screen.getByLabelText('Kata sandi'), pw);
  await userEvent.click(screen.getByRole('button', { name: 'Masuk' }));
}

describe('Login (FR-LG-01..10b, Tabel E-1)', () => {
  it('validasi browser di bawah field', async () => {
    renderAuth('/masuk');
    await userEvent.click(await screen.findByRole('button', { name: 'Masuk' }));
    expect(screen.getByText('Email wajib diisi.')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi wajib diisi.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveFocus();
    await userEvent.type(screen.getByLabelText('Email'), 'bukan-email');
    await userEvent.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(screen.getByText('Masukkan alamat email yang valid.')).toBeInTheDocument();
  });

  it('kredensial salah dan akun dinonaktifkan tampil sebagai alert di atas form', async () => {
    renderAuth('/masuk');
    await fillLogin('r.wiyono@andalas-energi.example', 'salah');
    expect(await screen.findByRole('alert')).toHaveTextContent('Kredensial tidak valid');
    await userEvent.clear(screen.getByLabelText('Email'));
    await fillLogin('w.sari@andalas-energi.example', MOCK_PASSWORD);
    const alert = await screen.findByText('Akun dinonaktifkan');
    expect(alert.closest('[role="alert"]')).toHaveTextContent('Akun Anda sedang dinonaktifkan. Hubungi Support untuk bantuan.');
    expect(screen.getByRole('link', { name: 'Hubungi Support' })).toBeInTheDocument();
  });

  it('login → OTP (email tersamar, salah, sukses) → Ruang kerja', async () => {
    renderAuth('/masuk');
    await fillLogin('r.wiyono@andalas-energi.example', MOCK_PASSWORD);
    expect(await screen.findByRole('heading', { name: 'Masukkan kode verifikasi' })).toBeInTheDocument();
    expect(screen.getByText(/r\.wi\*\*\*\*@andalas-energi\.example\. Kode berlaku 10 menit\./)).toBeInTheDocument();
    expect(screen.getByText(/Kirim ulang dalam/)).toBeInTheDocument();
    const code = await lastCode();
    const field = screen.getByLabelText('Kode verifikasi');
    expect(field).toHaveAttribute('autocomplete', 'one-time-code');
    await userEvent.click(screen.getByRole('button', { name: 'Verifikasi' }));
    expect(screen.getByText('Kode verifikasi wajib diisi.')).toBeInTheDocument();
    await userEvent.type(field, '123');
    await userEvent.click(screen.getByRole('button', { name: 'Verifikasi' }));
    expect(screen.getByText('Masukkan 6 digit kode verifikasi.')).toBeInTheDocument();
    await userEvent.clear(field);
    await userEvent.type(field, code === '000000' ? '111111' : '000000');
    await userEvent.click(screen.getByRole('button', { name: 'Verifikasi' }));
    expect(await screen.findByText('Kode verifikasi salah. Sisa percobaan: 4.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Kode verifikasi'), code);
    await userEvent.click(screen.getByRole('button', { name: 'Verifikasi' }));
    expect(await screen.findByText('Ruang kerja (uji)')).toBeInTheDocument();
  });

  it('halaman OTP tanpa langkah password kembali ke Login (FR-LG-18)', async () => {
    renderAuth('/masuk/verifikasi');
    expect(await screen.findByRole('heading', { name: 'Masuk ke PERISAI' })).toBeInTheDocument();
  });

  it('5x kode salah → kembali ke Login dengan alert Verifikasi gagal (Tabel E-2)', async () => {
    renderAuth('/masuk');
    await fillLogin('r.wiyono@andalas-energi.example', MOCK_PASSWORD);
    const code = await lastCode();
    const wrong = code === '000000' ? '111111' : '000000';
    await screen.findByRole('heading', { name: 'Masukkan kode verifikasi' });
    for (let i = 0; i < 5; i++) {
      await userEvent.type(screen.getByLabelText('Kode verifikasi'), wrong);
      await userEvent.click(screen.getByRole('button', { name: 'Verifikasi' }));
      if (i < 4) await screen.findByText(`Kode verifikasi salah. Sisa percobaan: ${4 - i}.`);
    }
    expect(await screen.findByText('Verifikasi gagal')).toBeInTheDocument();
    expect(screen.getByText('Terlalu banyak kode salah. Silakan masuk kembali.')).toBeInTheDocument();
  });
});

describe('Aktivasi (FR-AK-01..17)', () => {
  it('state tautan tidak valid dan kedaluwarsa + minta undangan baru (T-1, FR-AK-16)', async () => {
    renderAuth('/aktivasi/tidak-ada');
    expect(await screen.findByRole('heading', { name: 'Tautan tidak valid' })).toBeInTheDocument();
  });

  it('kedaluwarsa → minta undangan baru menampilkan toast', async () => {
    renderAuth('/aktivasi/undangan-maya-kedaluwarsa');
    expect(await screen.findByRole('heading', { name: 'Undangan tidak berlaku lagi' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Minta undangan baru' }));
    expect(await screen.findByText(/Permintaan terkirim\. Admin organisasi Anda sudah diberi tahu\./)).toBeInTheDocument();
  });

  it('buat password → verifikasi email → akun aktif dan masuk', async () => {
    renderAuth('/aktivasi/undangan-agus-berlaku');
    expect(await screen.findByRole('heading', { name: 'Buat kata sandi' })).toBeInTheDocument();
    // DS v2 AuthForm (keputusan PM 16 Okt 2026): email tersamar juga di layar Buat kata sandi.
    expect(screen.getByText('a.pr****@andalas-energi.example')).toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Simpan kata sandi baru' });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Kata sandi baru'), 'Agus#Aman2026');
    await userEvent.type(screen.getByLabelText('Konfirmasi kata sandi baru'), 'Agus#Aman2026');
    await userEvent.click(save);
    expect(await screen.findByRole('heading', { name: 'Verifikasi email Anda' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Kode verifikasi'), await lastCode());
    await userEvent.click(screen.getByRole('button', { name: 'Aktifkan akun' }));
    expect(await screen.findByText('Ruang kerja (uji)')).toBeInTheDocument();
    expect(screen.getByText('Akun berhasil diaktifkan.')).toBeInTheDocument();
    await waitFor(async () => expect((await services.activation.checkInvite('undangan-agus-berlaku')).state).toBe('used'));
  });

  it('password umum ditolak (FR-AK-06)', async () => {
    renderAuth('/aktivasi/undangan-agus-berlaku');
    await userEvent.type(await screen.findByLabelText('Kata sandi baru'), 'Password1');
    await userEvent.type(screen.getByLabelText('Konfirmasi kata sandi baru'), 'Password1');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan kata sandi baru' }));
    expect(await screen.findByText('Kata sandi ini terlalu umum. Gunakan kombinasi lain.')).toBeInTheDocument();
  });
});
