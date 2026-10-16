import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Check, Clock, Send } from 'lucide-react';
import { FormFooter } from '../layout/FormFooter';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { AccountStatusBadge } from './AccountStatusBadge';
import { AppliedFilters, ChipGroup, FilterGroup, FilterPanel, type AppliedFilter } from './FilterPanel';
import { Illustration, type IllustrationName } from './Illustration';
import { OtpField } from './OtpField';
import { TableCard, TableSearch } from './TableCard';
import { Timeline } from './Timeline';

const meta: Meta = { title: 'DS v2 Lime/Pola' };
export default meta;
type S = StoryObj;

const filterLabels = {
  trigger: 'Filter',
  title: 'Filter',
  close: 'Tutup filter',
  reset: 'Atur ulang',
  region: 'Filter aktif',
  clear: 'Hapus filter',
  remove: (l: string, v: string) => `Hapus filter ${l}: ${v}`,
  more: (n: number) => `+${n} filter lainnya`,
};

interface Demo {
  status: string;
  jenis: string;
}

function TableCardDemo({ variant }: { variant: 'popover' | 'panel' }) {
  const [value, setValue] = useState<Demo>({ status: 'semua', jenis: 'semua' });
  const applied: AppliedFilter[] = [
    value.status !== 'semua' && { key: 'status', label: 'Status', value: value.status, onRemove: () => setValue({ ...value, status: 'semua' }) },
    value.jenis !== 'semua' && { key: 'jenis', label: 'Jenis', value: value.jenis, onRemove: () => setValue({ ...value, jenis: 'semua' }) },
  ].filter(Boolean) as AppliedFilter[];
  return (
    <TableCard
      title="Daftar pengguna"
      tools={
        <>
          <TableSearch label="Cari pengguna" placeholder="Cari nama atau email" />
          <FilterPanel<Demo>
            variant={variant}
            value={value}
            emptyValue={{ status: 'semua', jenis: 'semua' }}
            activeCount={applied.length}
            onApply={setValue}
            applyLabel={() => 'Terapkan · 12 pengguna'}
            labels={filterLabels}
          >
            {(d, set) => (
              <>
                <FilterGroup legend="Status">
                  <Select
                    label="Status"
                    hideLabel
                    value={d.status}
                    onValueChange={(v) => set({ ...d, status: v })}
                    options={['semua', 'Diundang', 'Aktif', 'Kedaluwarsa', 'Ditangguhkan', 'Nonaktif'].map((x) => ({ value: x, label: x === 'semua' ? 'Semua status' : x }))}
                  />
                </FilterGroup>
                <FilterGroup legend="Jenis">
                  <ChipGroup label="Jenis" value={d.jenis} onChange={(v) => set({ ...d, jenis: v })} options={['semua', 'SKK Migas', 'KKKS'].map((x) => ({ value: x, label: x === 'semua' ? 'Semua' : x }))} />
                </FilterGroup>
              </>
            )}
          </FilterPanel>
        </>
      }
      applied={<AppliedFilters filters={applied} onClear={() => setValue({ status: 'semua', jenis: 'semua' })} labels={filterLabels} />}
    >
      <p className="px-4 pb-4 text-body text-ink-muted">Isi tabel (DataTable) di sini.</p>
    </TableCard>
  );
}

/** DataTable dalam satu kartu: toolbar (judul, cari, Filter), pil filter aktif, tabel. FilterPanel popover ≤ 6 isian. */
export const KartuTabelPopover: S = { render: () => <TableCardDemo variant="popover" /> };
/** > 6 isian atau rentang tanggal → panel kanan 480px. */
export const KartuTabelPanel: S = { render: () => <TableCardDemo variant="panel" /> };

/** Tag / WorkflowStatus DS v2: 24px, 12/16 700, tanpa garis (kecuali Draf), tanpa titik. */
export const Tag: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <AccountStatusBadge label="Dikerjakan" tone="info" />
      <AccountStatusBadge label="Aktif" tone="success" />
      <AccountStatusBadge label="Diundang" tone="neutral" />
      <AccountStatusBadge label="Kedaluwarsa" tone="caution" />
      <AccountStatusBadge label="Nonaktif" tone="danger" />
      <AccountStatusBadge label="Draf" tone="draft" />
      <AccountStatusBadge label="Dibatalkan" tone="muted" />
      <AccountStatusBadge label="Perangkat ini" tone="selected" />
    </div>
  ),
};

function OtpDemo({ error }: { error?: string }) {
  const [v, setV] = useState('482');
  return <OtpField label="Kode verifikasi" value={v} onChange={setV} error={error} className="max-w-[400px]" />;
}
/** Satu input, enam sel tampilan; tempel dan isi otomatis tetap jalan. */
export const KodeOtp: S = { render: () => <OtpDemo /> };
export const KodeOtpError: S = { render: () => <OtpDemo error="Kode salah. Periksa lagi kode di email Anda." /> };

const NAMES: IllustrationName[] = ['kosong', 'filter-kosong', 'cari-kosong', 'tidak-ditemukan', 'akses-ditolak', 'gagal-dimuat', 'berhasil', 'menunggu', 'tautan-tidak-valid', 'akun-aktif', 'undangan-kedaluwarsa', 'sesi-habis', 'selamat-datang'];
/** Ilustrasi garis EmptyState bertoken (ikut tema). */
export const Ilustrasi: S = {
  render: () => (
    <div className="grid grid-cols-4 gap-3">
      {NAMES.map((n) => (
        <div key={n} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-4">
          <Illustration name={n} />
          <span className="font-mono text-caption text-ink-muted">il-{n}</span>
        </div>
      ))}
    </div>
  ),
};

/** Bar aksi form menempel di bawah: tombol saja, satu primer. */
export const BarAksiForm: S = {
  render: () => (
    <div className="p-6">
      <FormFooter start={<Button>Batal</Button>} end={<Button variant="primary">Buat role</Button>} />
    </div>
  ),
};

function SwitchDemo() {
  const [on, setOn] = useState(true);
  return (
    <div className="max-w-[360px] rounded-xl border border-border bg-surface p-4">
      <Switch label="Perlu ditinjau" description="Sudah lewat jadwal tinjau" checked={on} onCheckedChange={setOn} />
    </div>
  );
}
/** Saklar untuk kondisi yang langsung berlaku; seluruh baris bisa diklik. */
export const Saklar: S = { render: () => <SwitchDemo /> };

/** Riwayat satu objek, terbaru di atas; simpul lime = keadaan sekarang. */
export const Riwayat: S = {
  render: () => (
    <div className="max-w-[420px] rounded-xl border border-border bg-surface p-5">
      <Timeline
        label="Riwayat akun"
        groups={[
          {
            key: 'd1',
            label: 'Hari ini · 16 Okt 2026',
            events: [
              { key: 'n', title: 'Belum pernah login', icon: <Clock />, tone: 'next' },
              { key: 'a', title: 'Diaktifkan', time: '09:20 WIB', icon: <Check />, tone: 'now' },
            ],
          },
          { key: 'd2', label: '15 Okt 2026', events: [{ key: 'u', title: 'Diundang', time: '14:10 WIB', icon: <Send />, actor: { name: 'Rina Wiyono', initials: 'RW' } }] },
        ]}
      />
    </div>
  ),
};
