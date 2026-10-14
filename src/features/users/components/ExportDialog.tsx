/**
 * Ekspor Daftar Pengguna — PRD ClickUp z8pmx9n8nz (US-ED-01..09). Tidak ada Figma: pola dialog Undang (PR-11).
 * Pilih format (.csv / .xlsx); ekspor mengikuti pencarian & filter yang sedang dipakai, seluruh hasil (tidak terbatas
 * halaman); pesan berhasil/gagal; tombol nonaktif bila tidak ada data (US-ED-08).
 */
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/patterns/Dialog';
import { useToast } from '@/components/patterns/Toast';
import type { ExportFormat } from '@/lib/export-file';
import { services, type UserListQuery } from '@/services';
import { usersCopy } from '../copy';

const p = usersCopy.panel;

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExportDialog({ query, count, onClose }: { query: UserListQuery; count: number; onClose: () => void }) {
  const toast = useToast();
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const m = useMutation({
    mutationFn: () => services.users.exportUsers(query, format),
    onSuccess: (r) => {
      download(r.blob, r.filename);
      toast.show({ title: p.eksporSukses(r.count) });
      onClose();
    },
  });
  return (
    <ConfirmDialog
      open
      onOpenChange={(o) => !o && !m.isPending && onClose()}
      title={p.eksporJudul}
      description={p.eksporKeterangan(count)}
      closeLabel={usersCopy.sesi.batal}
      cancelLabel={usersCopy.sesi.batal}
      confirmLabel={p.eksporKirim}
      loading={m.isPending}
      loadingLabel={p.eksporMemproses}
      confirmDisabled={count === 0}
      onConfirm={() => m.mutate()}
    >
      {m.isError && (
        <p role="alert" className="text-caption text-error-ink">
          {p.eksporGagal}
        </p>
      )}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-label text-ink-muted">{p.eksporFormat}</legend>
        {(['xlsx', 'csv'] as const).map((f) => (
          <label key={f} className="flex items-center gap-2 text-body-dense text-ink">
            <input type="radio" name="format-ekspor" value={f} checked={format === f} onChange={() => setFormat(f)} className="h-4 w-4 accent-[var(--color-action)]" />
            {f === 'xlsx' ? p.eksporXlsx : p.eksporCsv}
          </label>
        ))}
      </fieldset>
    </ConfirmDialog>
  );
}
