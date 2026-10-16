/**
 * Tampilan hak akses efektif — PRD Hak Akses Efektif (tab fc692fd7-10f5) FR-HE-14 (modul, aksi, cakupan),
 * FR-HE-14a (hanya modul yang dirilis), FR-HE-15 (role asal), FR-HE-16 (akun sendiri); Cakupan Data FR-CD-13/14.
 * Tabel izin mengikuti Figma 109:16307 (PRD Profil Pengguna, tab Akses).
 */
import { Callout } from '@/components/patterns/Callout';
import { SCOPE_DESC, scopeLabel, type EffectiveModule, type ScopeEntry } from '@/lib/access';
import { ACTION_DESC, roleName } from '@/lib/rbac';
import type { WilayahKerja } from '@/services';
import { accessCopy as c } from './copy';

export function ScopeList({ cakupan, wkNonaktif = [] }: { cakupan: ScopeEntry[]; wkNonaktif?: WilayahKerja[] }) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1">
        {cakupan.map((s) => (
          <li key={s.role} className="text-body text-ink">
            <span className="font-medium">{scopeLabel(s)}</span>
            <span className="text-ink-muted"> · {roleName(s.role)} — {SCOPE_DESC[s.tingkat]}</span>
          </li>
        ))}
      </ul>
      {wkNonaktif.length > 0 && (
        <Callout variant="peringatan" role="status">
          {c.wkNonaktif(wkNonaktif.map((w) => w.nama).join(', '))}
        </Callout>
      )}
    </div>
  );
}

/** Jumlah izin efektif (Figma 109:16307 "Izin efektif (n)"). */
export function countPermissions(modules: EffectiveModule[] | undefined): number {
  return (modules ?? []).reduce((n, m) => n + m.permissions.length, 0);
}

/**
 * Tabel izin efektif mengikuti Figma 109:16307 (PRD Profil Pengguna): Modul | Izin (kode mono) | Deskripsi,
 * dikelompokkan per modul. Deskripsi memuat kualifikasi sel matriks dan role asal (FR-HE-15). Kode izin memakai
 * kode modul + aksi Tabel X-1 (Figma memakai contoh "users.view"; ASSUMPTION, tidak ada daftar kode izin di PRD).
 */
export function EffectiveAccessView({ modules, loading, error, showRoles = true }: { modules?: EffectiveModule[]; loading?: boolean; error?: boolean; showRoles?: boolean }) {
  if (loading) return <p role="status" className="text-body text-ink-muted">{c.memuat}</p>;
  if (error) return <p role="alert" className="text-body text-ink">{c.gagal}</p>;
  if (!modules?.length) return <p className="text-body text-ink-muted">{c.kosong}</p>;
  return (
    <table className="w-full border-collapse text-left text-body">
      <caption className="sr-only">{c.judul}</caption>
      <thead>
        <tr className="text-label text-ink-muted">
          <th scope="col" className="border-b border-border bg-surface-subtle p-[10px]">{c.kolom.modul}</th>
          <th scope="col" className="border-b border-border bg-surface-subtle p-[10px]">{c.kolom.izin}</th>
          <th scope="col" className="border-b border-border bg-surface-subtle p-[10px]">{c.kolom.deskripsi}</th>
        </tr>
      </thead>
      {modules.map((m) => (
        <tbody key={m.module} className="border-b border-border-subtle last:border-b-0">
          {m.permissions.map((p, i) => (
            <tr key={p.action} className="align-top">
              {i === 0 && (
                <th scope="rowgroup" rowSpan={m.permissions.length} className="p-[10px] font-semibold text-ink">
                  {m.nama}
                  <span className="block font-mono text-caption font-normal text-ink-muted">{m.module}</span>
                </th>
              )}
              <td className="whitespace-nowrap p-[10px] font-mono text-caption text-ink-muted">{`${m.module}.${p.action}`}</td>
              <td className="p-[10px] text-ink">
                {ACTION_DESC[p.action]}
                {p.notes.length > 0 && <span className="text-ink-muted"> ({p.notes.join('; ')})</span>}
                {showRoles && <span className="block text-caption text-ink-muted">{c.dari(p.roles.map((r) => `${r} ${roleName(r)}`).join(', '))}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}
