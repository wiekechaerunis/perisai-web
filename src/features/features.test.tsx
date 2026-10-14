import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { services } from '@/services';
import { MOCK_PASSWORD } from '@/services/mock/seed';
import { renderWithApp } from '@/test/render';
import { UbahKataSandiDialog } from './account/UbahKataSandiDialog';
import { AturUlangKataSandiPage } from './auth/pages/AturUlangKataSandiPage';
import { LupaKataSandiPage } from './auth/pages/LupaKataSandiPage';

describe('Lupa kata sandi (FR-LP-01..06)', () => {
  it('validasi Tabel L-2 lalu pesan seragam', async () => {
    renderWithApp(<LupaKataSandiPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Kirim tautan' }));
    expect(screen.getByText('Email wajib diisi.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Email'), 'bukan-email');
    await userEvent.click(screen.getByRole('button', { name: 'Kirim tautan' }));
    expect(screen.getByText('Masukkan alamat email yang valid.')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Email'));
    await userEvent.type(screen.getByLabelText('Email'), 'tidak.terdaftar@x.example');
    await userEvent.click(screen.getByRole('button', { name: 'Kirim tautan' }));
    expect(
      await screen.findByText(/Jika email tersebut terdaftar, kami telah mengirim tautan/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kembali ke halaman masuk' })).toHaveAttribute('href', '/masuk');
  });
});

describe('Atur ulang kata sandi (FR-LP-10..14)', () => {
  it('tautan kedaluwarsa menampilkan state L-3', async () => {
    const link = await services.dev!.issueTestLink('reset', 'expired');
    renderWithApp(<AturUlangKataSandiPage />, { route: link, path: '/atur-ulang-kata-sandi/:token' });
    expect(await screen.findByRole('heading', { name: 'Tautan tidak berlaku lagi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Minta tautan baru' })).toBeInTheDocument();
  });

  it('tombol simpan aktif hanya bila syarat terpenuhi; sukses ke Login', async () => {
    const link = await services.dev!.issueTestLink('reset', 'valid');
    renderWithApp(<AturUlangKataSandiPage />, { route: link, path: '/atur-ulang-kata-sandi/:token' });
    const save = await screen.findByRole('button', { name: 'Simpan kata sandi baru' });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByLabelText('Kata sandi baru'), 'Baru#Sandi2026');
    await userEvent.type(screen.getByLabelText('Konfirmasi kata sandi baru'), 'Baru#Sandi2026');
    expect(save).toBeEnabled();
    await userEvent.click(save);
    expect(await screen.findByText('Halaman masuk')).toBeInTheDocument();
  });
});

describe('Ubah kata sandi (FR-UK-04..11)', () => {
  it('kata sandi saat ini salah lalu berhasil dengan toast', async () => {
    await services.dev!.signInAs('u-04');
    renderWithApp(<UbahKataSandiDialog open onOpenChange={() => undefined} />);
    await userEvent.type(screen.getByLabelText('Kata sandi saat ini'), 'salah-sekali');
    await userEvent.type(screen.getByLabelText('Kata sandi baru'), 'Baru#Sandi2026');
    await userEvent.type(screen.getByLabelText('Konfirmasi kata sandi baru'), 'Baru#Sandi2026');
    await userEvent.click(screen.getByRole('button', { name: 'Simpan kata sandi' }));
    expect(await screen.findByText('Kata sandi saat ini tidak sesuai.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Kata sandi saat ini')).toHaveFocus());

    await userEvent.clear(screen.getByLabelText('Kata sandi saat ini'));
    await userEvent.type(screen.getByLabelText('Kata sandi saat ini'), MOCK_PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Simpan kata sandi' }));
    expect(await screen.findByText('Kata sandi berhasil diubah. Perangkat lain telah dikeluarkan.')).toBeInTheDocument();
  });

  it('konfirmasi tidak cocok menahan tombol simpan', async () => {
    await services.dev!.signInAs('u-04');
    renderWithApp(<UbahKataSandiDialog open onOpenChange={() => undefined} />);
    await userEvent.type(screen.getByLabelText('Kata sandi saat ini'), MOCK_PASSWORD);
    await userEvent.type(screen.getByLabelText('Kata sandi baru'), 'Baru#Sandi2026');
    await userEvent.type(screen.getByLabelText('Konfirmasi kata sandi baru'), 'Baru#Sandi2027');
    expect(screen.getByText('Konfirmasi kata sandi tidak cocok.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simpan kata sandi' })).toBeDisabled();
  });
});
