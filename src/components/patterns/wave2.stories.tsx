import type { Meta, StoryObj } from '@storybook/react';
import { Clock3, Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { AccountStatusBadge } from './AccountStatusBadge';
import { Combobox, MultiSelect } from './Combobox';
import { ConfirmDialog } from './Dialog';
import { KeyValueList } from './KeyValueList';
import { SidePanel } from './SidePanel';

const meta: Meta = { title: 'DS/Pola gelombang 2' };
export default meta;
type S = StoryObj;

export const StatusAkun: S = {
  name: 'AccountStatusBadge',
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      <AccountStatusBadge label="Diundang" tone="strong" />
      <AccountStatusBadge label="Aktif" tone="success" />
      <AccountStatusBadge label="Kedaluwarsa" tone="warning" note="Minta undangan baru · 14 Okt 2026" />
      <AccountStatusBadge label="Ditangguhkan" tone="strong" />
      <AccountStatusBadge label="Nonaktif" tone="danger" note="Undangan dibatalkan" />
      <AccountStatusBadge label="Tidak aktif" tone="muted" />
      <AccountStatusBadge label="Ikon netral" icon={Mail} />
    </div>
  ),
};

const ORGS = ['SKK Migas', 'PT Andalas Energi Hulu', 'PT Mahakam Sejahtera Petroleum', 'PT Skyletica Labs Indonesia'].map((n, i) => ({ value: String(i), label: n }));

export const PilihanBerpencarian: S = {
  name: 'Combobox + MultiSelect',
  render: function Render() {
    const [org, setOrg] = useState<string>();
    const [roles, setRoles] = useState<string[]>(['R-05']);
    return (
      <div className="flex max-w-[512px] flex-col gap-5">
        <Combobox label="Organisasi" required placeholder="Pilih organisasi" emptyText="Data tidak ditemukan" options={ORGS} value={org} onChange={setOrg} />
        <MultiSelect
          label="Role"
          required
          placeholder="Pilih role"
          emptyText="Data tidak ditemukan"
          removeLabel="Hapus"
          options={[
            { value: 'R-04', label: 'R-04 PIC KKKS' },
            { value: 'R-05', label: 'R-05 Pelapor KKKS' },
            { value: 'R-06', label: 'R-06 Pejabat Berwenang KKKS' },
          ]}
          value={roles}
          onChange={setRoles}
        />
        <MultiSelect label="Role" placeholder="Pilih organisasi terlebih dahulu" emptyText="—" removeLabel="Hapus" options={[]} value={[]} onChange={() => undefined} disabled />
        <MultiSelect label="Wilayah Kerja" placeholder="Pilih wilayah kerja" emptyText="—" removeLabel="Hapus" options={[]} value={[]} onChange={() => undefined} error="Pilih wilayah kerja pengguna." />
      </div>
    );
  },
};

export const AreaTeks: S = {
  name: 'Textarea',
  render: () => <Textarea label="Penjelasan" required maxLength={200} showCount value="Audit akses berkala" onChange={() => undefined} />,
};

export const DialogKonfirmasiAlasan: S = {
  name: 'Dialog · konfirmasi dengan InfoBlock',
  render: () => (
    <ConfirmDialog
      open
      onOpenChange={() => undefined}
      title="Tangguhkan akun?"
      description="Akun berikut akan ditangguhkan. Pengguna tidak akan dapat mengakses sistem selama penangguhan."
      closeLabel="Batal"
      confirmLabel="Tangguhkan"
      cancelLabel="Batal"
      destructive
      onConfirm={() => undefined}
    >
      <KeyValueList
        variant="block"
        items={[
          { key: 'n', label: 'Nama', value: 'Dimas Pratama' },
          { key: 'e', label: 'Email', value: 'd.pratama@andalas-energi.example' },
          { key: 's', label: 'Sesi aktif', value: '3 sesi' },
        ]}
      />
    </ConfirmDialog>
  ),
};

export const PanelDetail: S = {
  name: 'SidePanel',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <SidePanel
      open
      onOpenChange={() => undefined}
      title="Maya Kusuma"
      titleAside={<AccountStatusBadge label="Kedaluwarsa" icon={Clock3} tone="caution" />}
      subtitle="m.kusuma@andalas-energi.example"
      closeLabel="Tutup panel"
      actions={
        <div className="flex gap-2">
          <Button>Kirim ulang undangan</Button>
          <Button>Batalkan undangan</Button>
        </div>
      }
    >
      <KeyValueList
        items={[
          { key: 'o', label: 'Organisasi', value: 'PT Andalas Energi Hulu' },
          { key: 'r', label: 'Role', value: 'R-05 Pelapor KKKS' },
        ]}
      />
    </SidePanel>
  ),
};
