import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from 'lucide-react';
import { Button } from './Button';
import { Select } from './Select';
import { Tabs, TabsNav } from './Tabs';
import { TextField } from './TextField';

const meta: Meta = { title: 'DS/Primitif' };
export default meta;
type S = StoryObj;

export const ButtonVarian: S = {
  name: 'Button · varian',
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary">Verifikasi jadi insiden</Button>
      <Button>Minta klarifikasi</Button>
      <Button variant="quiet">Batal</Button>
      <Button variant="destructive">Keluarkan perangkat</Button>
      <Button variant="primary" size="lg">Simpan kata sandi baru</Button>
      <Button icon={<Plus aria-hidden size={16} strokeWidth={1.8} />}>Undang pengguna</Button>
    </div>
  ),
};

export const ButtonState: S = {
  name: 'Button · state',
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="primary" loading loadingLabel="Memproses…">Masuk</Button>
      <Button variant="primary" disabled>Masuk</Button>
      <Button disabled>Kirim ulang dalam 0:45</Button>
    </div>
  ),
};

export const TextFieldState: S = {
  name: 'TextField · state',
  render: () => (
    <div className="flex max-w-[400px] flex-col gap-5">
      <TextField label="Email" placeholder="nama@perusahaan.co.id" hint="Contoh: nama@perusahaan.co.id" />
      <TextField label="Email" defaultValue="bukan-email" error="Masukkan alamat email yang valid." />
      <TextField label="Kata sandi" type="password" revealable defaultValue="Rahasia#2026" revealLabels={{ show: 'Tampilkan kata sandi', hide: 'Sembunyikan kata sandi' }} />
      <TextField label="Kode verifikasi" digitsOnly inputMode="numeric" autoComplete="one-time-code" maxLength={6} defaultValue="123456" />
      <TextField label="Email akun" readOnly defaultValue="a.pranoto@andalas-energi.example" />
      <TextField label="Email" disabled defaultValue="nonaktif@contoh.example" />
    </div>
  ),
};

export const SelectState: S = {
  name: 'Select · state',
  render: () => (
    <div className="flex max-w-[400px] flex-col gap-5">
      <Select
        label="Alasan pencabutan"
        placeholder="Pilih alasan pencabutan"
        options={['Perangkat hilang atau dicuri', 'Dugaan akses tidak sah', 'Permintaan pengguna', 'Investigasi keamanan', 'Lainnya'].map((v) => ({ value: v, label: v }))}
      />
      <Select label="Organisasi" placeholder="Pilih organisasi" options={[]} error="Organisasi wajib dipilih." />
      <Select label="Role" placeholder="Pilih organisasi terlebih dahulu" options={[]} disabled />
    </div>
  ),
};

export const TabsDalamHalaman: S = {
  name: 'Tabs · dalam halaman',
  render: () => (
    <Tabs
      label="Contoh"
      items={[
        { value: 'a', label: 'Antrian verifikasi', count: 4, content: <p>Isi antrian</p> },
        { value: 'b', label: 'Insiden aktif', count: 2, content: <p>Isi insiden</p> },
        { value: 'c', label: 'Tindak lanjut', content: <p>Isi tindak lanjut</p> },
      ]}
    />
  ),
};

export const TabsRute: S = {
  name: 'Tabs · rute',
  render: () => (
    <TabsNav
      label="Pengaturan akun"
      items={[
        { value: 'k', label: 'Ubah kata sandi', to: '/' },
        { value: 's', label: 'Sesi aktif', to: '/sesi' },
      ]}
    />
  ),
};
