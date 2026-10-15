/**
 * Permintaan Ubah Email — PRD Ubah Data & Role Pengguna FR-UDR-15, -16, Tabel S-UDR, EC-UDR-07 (ClickUp z8pmx9n8ny).
 * Tidak ada Figma: pola tabel Manajemen Pengguna (PR-11).
 * Penyetuju: Administrator Bisnis (PIC KKKS, Pimpinan, Pengawas) atau PIC KKKS (anggota organisasinya).
 * Setujui: server memeriksa ulang keunikan & domain; gagal → ditolak otomatis (alert). Tolak: alasan wajib.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { Callout } from '@/components/patterns/Callout';
import { DataTable } from '@/components/patterns/DataTable';
import { ConfirmDialog } from '@/components/patterns/Dialog';
import { EmptyState } from '@/components/patterns/EmptyState';
import { useToast } from '@/components/patterns/Toast';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { formatTanggalJam } from '@/lib/format';
import { ALASAN_LAINNYA_MAX } from '@/lib/user-rules';
import { isServiceError, services, type EmailRequestItem } from '@/services';
import { usersCopy } from './copy';
import { USERS_KEY } from './hooks';

const c = usersCopy.permintaanEmail;
export const EMAIL_REQUESTS_KEY = ['email-requests'] as const;

export function useEmailRequests(enabled = true) {
  return useQuery({ queryKey: EMAIL_REQUESTS_KEY, queryFn: () => services.users.listEmailRequests(), enabled });
}

export function PermintaanEmailPage() {
  const list = useEmailRequests();
  const qc = useQueryClient();
  const toast = useToast();
  const [approve, setApprove] = useState<EmailRequestItem | null>(null);
  const [reject, setReject] = useState<EmailRequestItem | null>(null);
  const [alasan, setAlasan] = useState('');
  const [alasanErr, setAlasanErr] = useState<string>();
  const [alert, setAlert] = useState<string | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: EMAIL_REQUESTS_KEY });
    void qc.invalidateQueries({ queryKey: USERS_KEY });
  };
  const approveM = useMutation({ mutationFn: (id: string) => services.users.approveEmailRequest(id) });
  const rejectM = useMutation({ mutationFn: ({ id, text }: { id: string; text: string }) => services.users.rejectEmailRequest(id, text) });

  function onApprove() {
    if (!approve) return;
    setAlert(null);
    approveM.mutate(approve.userId, {
      onSuccess: () => toast.show({ title: c.disetujui }),
      onError: (err) => {
        if (isServiceError(err, 'EMAIL_TAKEN_ON_APPROVE')) setAlert(usersCopy.e.keburuDipakai);
        else if (isServiceError(err, 'EMAIL_DOMAIN_NOT_ALLOWED')) setAlert(c.domainBerubah);
        else setAlert(usersCopy.kendalaIsi);
      },
      onSettled: () => {
        setApprove(null);
        refresh();
      },
    });
  }

  function onReject() {
    if (!reject) return;
    const text = alasan.trim();
    if (!text) return setAlasanErr(c.alasanKosong);
    rejectM.mutate(
      { id: reject.userId, text },
      {
        onSuccess: () => {
          toast.show({ title: c.ditolak });
          setReject(null);
        },
        onError: () => setAlasanErr(usersCopy.kendalaIsi),
        onSettled: refresh,
      },
    );
  }

  const k = c.kolom;
  const columns: ColumnDef<EmailRequestItem, unknown>[] = [
    {
      id: 'p',
      header: k.pengguna,
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.nama}
          <span className="block text-caption font-normal text-ink-muted">{row.original.organisasi}</span>
        </span>
      ),
    },
    { id: 'l', header: k.emailLama, cell: ({ row }) => <span className="break-all">{row.original.emailLama}</span> },
    { id: 'b', header: k.emailBaru, cell: ({ row }) => <span className="break-all font-medium">{row.original.emailBaru}</span> },
    { id: 'w', header: k.diajukan, cell: ({ row }) => <span className="whitespace-nowrap font-mono text-caption">{formatTanggalJam(row.original.diajukan)}</span> },
    {
      id: 'a',
      header: k.aksi,
      cell: ({ row }) => (
        <span className="flex gap-2">
          <Button onClick={() => setApprove(row.original)}>{c.setujui}</Button>
          <Button
            onClick={() => {
              setAlasan('');
              setAlasanErr(undefined);
              setReject(row.original);
            }}
          >
            {c.tolak}
          </Button>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={c.judul} summary={c.ringkasan} />
      <PageBody>
        <Section className="border border-border">
          <div className="flex flex-col gap-4">
            {alert && (
              <Callout variant="error">
                {alert}
              </Callout>
            )}
            <DataTable
              caption={c.tabel}
              columns={columns}
              data={list.data ?? []}
              getRowId={(r) => r.userId}
              loading={list.isPending}
              loadingContent={<p className="text-body-dense text-ink-muted">{usersCopy.profil.memuat}</p>}
              error={list.isError ? usersCopy.kendalaIsi : undefined}
              empty={<EmptyState title={c.kosong} />}
            />
          </div>
        </Section>
      </PageBody>
      <ConfirmDialog
        open={!!approve}
        onOpenChange={(o) => !o && !approveM.isPending && setApprove(null)}
        title={c.setujuiJudul}
        description={approve ? c.setujuiIsi(approve.nama, approve.emailBaru) : undefined}
        confirmLabel={c.setujui}
        cancelLabel={c.batal}
        onConfirm={onApprove}
        loading={approveM.isPending}
        loadingLabel={c.memproses}
        closeLabel={c.batal}
      />
      <ConfirmDialog
        open={!!reject}
        onOpenChange={(o) => !o && !rejectM.isPending && setReject(null)}
        title={c.tolakJudul}
        description={reject ? `${reject.nama} · ${reject.emailBaru}` : undefined}
        confirmLabel={c.tolak}
        cancelLabel={c.batal}
        onConfirm={onReject}
        loading={rejectM.isPending}
        loadingLabel={c.memproses}
        closeLabel={c.batal}
      >
        <Textarea
          label={c.alasan}
          required
          maxLength={ALASAN_LAINNYA_MAX}
          showCount
          value={alasan}
          onChange={(ev) => (setAlasan(ev.target.value), setAlasanErr(undefined))}
          hint={c.alasanHint}
          error={alasanErr}
        />
      </ConfirmDialog>
    </>
  );
}
