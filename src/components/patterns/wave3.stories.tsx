import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Pagination } from './Pagination';

const meta: Meta = { title: 'DS/Pola gelombang 3' };
export default meta;
type S = StoryObj;

const labels = {
  sebelumnya: 'Sebelumnya',
  berikutnya: 'Berikutnya',
  label: 'Navigasi halaman',
  ringkasan: (a: number, b: number, n: number) => `${a}–${b} dari ${n}`,
};

function PaginationDemo({ total }: { total: number }) {
  const [page, setPage] = useState(1);
  return <Pagination page={page} pageSize={25} total={total} onPageChange={setPage} labels={labels} />;
}

/** Usulan DS (DS_GAPS.md): navigasi halaman untuk Log Akses dan Jejak Audit. */
export const Paginasi: S = { render: () => <PaginationDemo total={132} /> };
export const PaginasiSatuHalaman: S = { render: () => <PaginationDemo total={8} /> };
