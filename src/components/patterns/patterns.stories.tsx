import type { Meta, StoryObj } from '@storybook/react';
import { Link2Off } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Callout } from './Callout';
import { DataTable } from './DataTable';
import { ConfirmDialog, Dialog } from './Dialog';
import { EmptyState } from './EmptyState';
import { KeyValueList } from './KeyValueList';
import { Menu } from './Menu';
import { PasswordChecklist } from './PasswordChecklist';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { ResendCountdown } from './ResendCountdown';
import { StatePanel } from './StatePanel';
import { ToastProvider, useToast } from './Toast';

const meta: Meta = { title: 'DS/Pola' };
export default meta;
type S = StoryObj;

export const CalloutVarian: S = {
  name: 'Callout · varian',
  render: () => (
    <div className="flex max-w-[480px] flex-col gap-3">
      <Callout variant="info">Anda telah keluar.</Callout>
      <Callout variant="peringatan" title="Akun ditangguhkan">
        Akses akun Anda ditangguhkan sementara. Hubungi admin organisasi Anda untuk informasi lebih lanjut.
      </Callout>
      <Callout variant="error" title="Kredensial tidak valid">
        Email atau password yang Anda masukkan salah.
      </Callout>
      <Callout variant="kritis" title="1 sinyal kritis">
        Hanya untuk sinyal atau insiden berseveritas Kritis.
      </Callout>
    </div>
  ),
};

export const EmptyStateDefault: S = {
  name: 'EmptyState',
  render: () => <EmptyState title="Antrian verifikasi kosong" description="Sinyal baru akan muncul di sini." action={<Button>Hapus filter</Button>} />,
};

export const KeyValue: S = {
  name: 'KeyValueList',
  render: () => (
    <KeyValueList
      items={[
        { key: 'r', label: 'Role', value: 'R-04 Admin KKKS' },
        { key: 'o', label: 'Organisasi', value: 'PT Andalas Energi Hulu' },
        { key: 'l', label: 'Login terakhir', value: '14 Okt 2026, 15:51 WIB', mono: true, action: <Button variant="quiet">Ubah</Button> },
      ]}
    />
  ),
};

const rows = [
  { id: '1', perangkat: 'Chrome · Windows', lokasi: 'Jakarta, Indonesia', masuk: '14 Okt 2026, 15:51 WIB' },
  { id: '2', perangkat: 'Edge 129 · Windows 11', lokasi: 'Jakarta, Indonesia', masuk: '14 Okt 2026, 12:51 WIB' },
];
const cols = [
  { accessorKey: 'perangkat', header: 'Perangkat' },
  { accessorKey: 'lokasi', header: 'Perkiraan lokasi' },
  { accessorKey: 'masuk', header: 'Waktu masuk', meta: { mono: true } },
];

export const DataTableState: S = {
  name: 'DataTable · state',
  render: () => (
    <div className="flex flex-col gap-8">
      <DataTable caption="Sesi aktif" data={rows} columns={cols} />
      <DataTable caption="Sesi aktif" data={[]} columns={cols} empty={<EmptyState title="Hanya perangkat ini yang sedang masuk." />} />
      <DataTable caption="Sesi aktif" data={[]} columns={cols} loading loadingContent={<p className="text-ink-muted">Memuat…</p>} />
      <DataTable caption="Sesi aktif" data={[]} columns={cols} error="Daftar sesi gagal dimuat. Muat ulang halaman untuk mencoba lagi." />
    </div>
  ),
};

export const DialogKonfirmasi: S = {
  name: 'Dialog · konfirmasi',
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Buka dialog</Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Keluarkan perangkat ini?"
          description="Edge 129 · Windows 11 akan kehilangan akses ke akun Anda dalam 30 detik."
          confirmLabel="Keluarkan perangkat"
          cancelLabel="Batal"
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};

export const DialogPeringatanSesi: S = {
  name: 'Dialog · peringatan sesi (tidak bisa ditutup)',
  render: () => (
    <Dialog
      open
      onOpenChange={() => undefined}
      dismissible={false}
      title="Sesi Anda akan berakhir"
      description="Karena tidak ada aktivitas, sesi Anda akan berakhir dalam 1:42. Pilih Lanjutkan sesi untuk tetap masuk."
      footer={
        <>
          <Button variant="quiet">Keluar sekarang</Button>
          <Button variant="primary" size="lg">Lanjutkan sesi</Button>
        </>
      }
    />
  ),
};

function ToastDemo() {
  const toast = useToast();
  return <Button onClick={() => toast.show({ title: 'Akun berhasil diaktifkan.' })}>Tampilkan toast</Button>;
}

export const Toast: S = {
  render: () => (
    <ToastProvider closeLabel="Tutup" regionLabel="Notifikasi">
      <ToastDemo />
    </ToastProvider>
  ),
};

export const MenuAkun: S = {
  name: 'Menu',
  render: () => (
    <Menu
      header={<span className="text-body font-semibold">Rina Wiyono</span>}
      trigger={<Button>Menu akun</Button>}
      items={[
        { key: 'a', label: 'Pengaturan akun', onSelect: () => undefined },
        { key: 'b', label: 'Keluar', onSelect: () => undefined },
      ]}
    />
  ),
};

export const StatePanelTautan: S = {
  name: 'StatePanel',
  render: () => (
    <div className="max-w-[400px]">
      <StatePanel
        icon={Link2Off}
        title="Tautan tidak valid"
        description="Tautan ini tidak dapat digunakan. Periksa email terbaru Anda, atau minta tautan baru."
        actions={<Button variant="primary" size="lg" block>Minta tautan baru</Button>}
      />
    </div>
  ),
};

export const KekuatanSandi: S = {
  name: 'PasswordStrengthMeter + PasswordChecklist',
  render: () => (
    <div className="flex max-w-[400px] flex-col gap-4">
      {(
        [
          [0, 'Masukkan password'],
          [1, 'Lemah'],
          [2, 'Cukup'],
          [3, 'Kuat'],
          [4, 'Sangat kuat'],
        ] as const
      ).map(([b, l]) => (
        <PasswordStrengthMeter key={l} bars={b} label={l} weak={l === 'Lemah'} srPrefix="Kekuatan kata sandi" />
      ))}
      <PasswordChecklist
        label="Syarat kata sandi"
        srStatus={{ met: 'terpenuhi', unmet: 'belum terpenuhi' }}
        rules={[
          { id: '1', label: 'Minimal 8 karakter', met: true },
          { id: '2', label: 'Minimal 1 huruf besar', met: true },
          { id: '3', label: 'Minimal 1 huruf kecil', met: false },
          { id: '4', label: 'Minimal 1 angka', met: false },
        ]}
      />
    </div>
  ),
};

export const KirimUlang: S = {
  name: 'ResendCountdown',
  render: () => (
    <ResendCountdown
      availableAt={new Date(Date.now() + 45_000).toISOString()}
      onResend={() => undefined}
      labels={{ resend: 'Kirim ulang kode', countdown: 'Kirim ulang dalam {waktu}' }}
    />
  ),
};
