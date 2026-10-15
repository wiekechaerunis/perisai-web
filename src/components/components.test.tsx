import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from './layout/Sidebar';
import { AccountStatusBadge } from './patterns/AccountStatusBadge';
import { Callout } from './patterns/Callout';
import { Combobox, MultiSelect } from './patterns/Combobox';
import { DataTable } from './patterns/DataTable';
import { FilterBar } from './patterns/FilterBar';
import { ConfirmDialog } from './patterns/Dialog';
import { Pagination } from './patterns/Pagination';
import { PasswordChecklist } from './patterns/PasswordChecklist';
import { PasswordStrengthMeter } from './patterns/PasswordStrengthMeter';
import { ResendCountdown } from './patterns/ResendCountdown';
import { StatePanel } from './patterns/StatePanel';
import { Button } from './ui/Button';
import { Tabs } from './ui/Tabs';
import { TextField } from './ui/TextField';

describe('Button', () => {
  it('loading menonaktifkan tombol agar tidak terkirim ganda (FR-LG-03)', async () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="Memproses…" onClick={onClick}>
        Masuk
      </Button>,
    );
    const btn = screen.getByRole('button', { name: 'Memproses…' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('TextField', () => {
  it('toggle tampil/sembunyikan, default tersembunyi (FR-LG-02)', async () => {
    render(<TextField label="Kata sandi" type="password" revealable revealLabels={{ show: 'Tampilkan', hide: 'Sembunyikan' }} />);
    const input = screen.getByLabelText('Kata sandi');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Tampilkan' }));
    expect(input).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: 'Sembunyikan' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('mode kode: hanya angka, autocomplete one-time-code (FR-LG-16)', async () => {
    render(<TextField label="Kode verifikasi" digitsOnly inputMode="numeric" autoComplete="one-time-code" maxLength={6} />);
    const input = screen.getByLabelText('Kode verifikasi');
    await userEvent.type(input, '12a3-45');
    expect(input).toHaveValue('12345');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
  });

  it('error terhubung ke field dan memakai aria-invalid', () => {
    render(<TextField label="Email" error="Email wajib diisi." />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Email wajib diisi.');
  });
});

describe('Callout', () => {
  it('varian error diumumkan sebagai alert', () => {
    render(<Callout variant="error" title="Kredensial tidak valid">Email atau password yang Anda masukkan salah.</Callout>);
    expect(screen.getByRole('alert')).toHaveTextContent('Kredensial tidak valid');
  });
});

describe('Password patterns', () => {
  it('checklist menandai syarat terpenuhi untuk pembaca layar', () => {
    render(
      <PasswordChecklist
        label="Syarat kata sandi"
        srStatus={{ met: 'terpenuhi', unmet: 'belum terpenuhi' }}
        rules={[
          { id: 'a', label: 'Minimal 8 karakter', met: true },
          { id: 'b', label: 'Minimal 1 angka', met: false },
        ]}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Minimal 8 karakter: terpenuhi');
    expect(items[1]).toHaveTextContent('Minimal 1 angka: belum terpenuhi');
  });

  it('meter menyebut label kata, tidak hanya warna', () => {
    render(<PasswordStrengthMeter bars={3} label="Kuat" srPrefix="Kekuatan kata sandi" />);
    expect(screen.getByRole('meter', { name: 'Kekuatan kata sandi' })).toHaveAttribute('aria-valuetext', 'Kuat');
  });
});

describe('ResendCountdown', () => {
  it('nonaktif selama hitung mundur lalu aktif (FR-LG-13)', () => {
    vi.useFakeTimers();
    const onResend = vi.fn();
    render(
      <ResendCountdown
        availableAt={new Date(Date.now() + 45_000).toISOString()}
        onResend={onResend}
        labels={{ resend: 'Kirim ulang kode', countdown: 'Kirim ulang dalam {waktu}' }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Kirim ulang dalam 0:45' })).toBeDisabled();
    act(() => vi.advanceTimersByTime(45_500));
    expect(screen.getByRole('button', { name: 'Kirim ulang kode' })).toBeEnabled();
    vi.useRealTimers();
  });
});

describe('ConfirmDialog', () => {
  it('konfirmasi dan batal', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <ConfirmDialog open title="Keluarkan perangkat ini?" confirmLabel="Keluarkan perangkat" cancelLabel="Batal" onConfirm={onConfirm} onOpenChange={onOpenChange} />,
    );
    expect(screen.getByRole('dialog', { name: 'Keluarkan perangkat ini?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keluarkan perangkat' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('DataTable', () => {
  it('render baris dan urut kolom', async () => {
    render(
      <DataTable
        caption="Daftar"
        data={[{ n: 'B', v: 2 }, { n: 'A', v: 1 }]}
        columns={[
          { accessorKey: 'n', header: 'Nama' },
          { accessorKey: 'v', header: 'Nilai', meta: { align: 'right', mono: true } },
        ]}
      />,
    );
    const rows = () => screen.getAllByRole('row').slice(1).map((r) => r.textContent);
    expect(rows()).toEqual(['B2', 'A1']);
    await userEvent.click(screen.getByRole('button', { name: 'Nama' }));
    expect(rows()).toEqual(['A1', 'B2']);
  });

  it('menampilkan empty state saat data kosong', () => {
    render(<DataTable caption="Daftar" data={[]} columns={[{ accessorKey: 'n', header: 'Nama' }]} empty={<p>Daftar kosong</p>} />);
    expect(screen.getByText('Daftar kosong')).toBeInTheDocument();
  });
});

describe('Tabs', () => {
  it('pindah tab dengan panah kanan', async () => {
    render(
      <Tabs
        label="Bagian"
        items={[
          { value: 'a', label: 'Satu', content: <p>Isi satu</p> },
          { value: 'b', label: 'Dua', content: <p>Isi dua</p> },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Satu' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Dua' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Isi dua')).toBeVisible();
  });
});

describe('Combobox dan MultiSelect', () => {
  it('Combobox: cari, tidak ditemukan, pilih dengan keyboard', async () => {
    const onChange = vi.fn();
    render(
      <Combobox
        label="Organisasi"
        emptyText="Data tidak ditemukan"
        options={[
          { value: 'a', label: 'SKK Migas' },
          { value: 'b', label: 'PT Andalas Energi Hulu' },
        ]}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole('combobox', { name: 'Organisasi' });
    await userEvent.type(input, 'Baskit');
    expect(screen.getByText('Data tidak ditemukan')).toBeInTheDocument();
    await userEvent.clear(input);
    await userEvent.type(input, 'andalas{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('MultiSelect: pilih dan hapus chip', async () => {
    function Harness() {
      const [v, setV] = useState<string[]>([]);
      return (
        <MultiSelect
          label="Role"
          emptyText="—"
          removeLabel="Hapus"
          options={[
            { value: 'R-04', label: 'R-04 PIC KKKS' },
            { value: 'R-05', label: 'R-05 Pelapor KKKS' },
          ]}
          value={v}
          onChange={setV}
        />
      );
    }
    render(<Harness />);
    await userEvent.click(screen.getByRole('combobox', { name: 'Role' }));
    await userEvent.click(screen.getByRole('option', { name: 'R-05 Pelapor KKKS' }));
    expect(screen.getByRole('option', { name: 'R-05 Pelapor KKKS' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Hapus R-05 Pelapor KKKS' }));
    expect(screen.queryByRole('button', { name: 'Hapus R-05 Pelapor KKKS' })).toBeNull();
  });

  it('AccountStatusBadge menampilkan label dan keterangan', () => {
    render(<AccountStatusBadge label="Kedaluwarsa" tone="caution" note="Minta undangan baru" />);
    expect(screen.getByText('Kedaluwarsa')).toBeInTheDocument();
    expect(screen.getByText('Minta undangan baru')).toBeInTheDocument();
  });
});

describe('Sidebar dan StatePanel', () => {
  it('hanya menampilkan item yang diberikan; item aktif ditandai', () => {
    render(
      <MemoryRouter initialEntries={['/ruang-kerja']}>
        <Sidebar navLabel="Navigasi utama" groups={[{ key: 'g', label: 'Utama', items: [{ key: 'm1', label: 'Ruang kerja', to: '/ruang-kerja', count: 3 }] }]} />
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: /Ruang kerja/ });
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link).toHaveTextContent('3');
  });

  it('StatePanel memakai heading halaman', () => {
    render(<StatePanel title="Tautan tidak valid" description="Tautan ini tidak dapat digunakan." />);
    expect(screen.getByRole('heading', { level: 1, name: 'Tautan tidak valid' })).toBeInTheDocument();
  });
});

describe('Pagination', () => {
  const labels = { sebelumnya: 'Sebelumnya', berikutnya: 'Berikutnya', label: 'Navigasi halaman', barisPerHalaman: 'Baris per halaman', ringkasan: (a: number, b: number, n: number) => `${a}–${b} dari ${n}` };

  it('menampilkan pemilih baris per halaman dan ringkasan', () => {
    render(<Pagination page={2} pageSize={25} total={132} onPageChange={() => {}} pageSizeOptions={[10, 25, 50, 100]} onPageSizeChange={() => {}} labels={labels} />);
    expect(screen.getByRole('combobox', { name: 'Baris per halaman' })).toHaveTextContent('25');
    expect(screen.getByText('26–50 dari 132')).toBeInTheDocument();
  });

  it('tanpa onPageSizeChange tidak menampilkan pemilih', () => {
    render(<Pagination page={1} pageSize={25} total={30} onPageChange={() => {}} labels={labels} />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});

describe('FilterBar (pola Filter daftar DS)', () => {
  const labels = { more: (n: number) => (n ? `Filter lainnya (${n})` : 'Filter lainnya'), less: 'Sembunyikan filter', clear: 'Hapus filter', remove: (l: string) => `Hapus filter ${l}`, active: 'Filter aktif' };

  it('filter tambahan aktif tampil sebagai pil saat tertutup dan bisa dihapus satu per satu', async () => {
    const onRemove = vi.fn();
    render(
      <FilterBar
        primary={<TextField label="Pengguna" />}
        advanced={<TextField label="Alamat IP" />}
        activeFilters={[{ key: 'ip', label: 'Alamat IP: 10.0.0.1', onRemove }]}
        onClear={() => {}}
        labels={labels}
      />,
    );
    // Ada filter tambahan aktif → terbuka otomatis; pil tidak digandakan.
    expect(screen.getByRole('button', { name: /Sembunyikan filter/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByRole('list', { name: 'Filter aktif' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Sembunyikan filter/ }));
    expect(screen.getByRole('list', { name: 'Filter aktif' })).toHaveTextContent('Alamat IP: 10.0.0.1');
    await userEvent.click(screen.getByRole('button', { name: 'Hapus filter Alamat IP: 10.0.0.1' }));
    expect(onRemove).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Hapus filter' })).toBeInTheDocument();
  });

  it('tanpa filter aktif: tombol berupa teks tanpa angka dan tanpa "Hapus filter"', () => {
    render(<FilterBar primary={<TextField label="Pengguna" />} advanced={<TextField label="Alamat IP" />} labels={labels} />);
    expect(screen.getByRole('button', { name: /^Filter lainnya$/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Hapus filter' })).not.toBeInTheDocument();
  });
});
