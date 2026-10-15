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
          <li key={s.role} className="text-body-dense text-ink">
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
  if (loading) return <p role="status" className="text-body-dense text-ink-muted">{c.memuat}</p>;
  if (error) return <p role="alert" className="text-body-dense text-ink">{c.gagal}</p>;
  if (!modules?.length) return <p className="text-body-dense text-ink-muted">{c.kosong}</p>;
  return (
    <table className="w-full border-collapse text-left text-body-dense">
      <caption className="sr-only">{c.judul}</caption>
      <thead>
        <tr className="bg-surface-sunken text-label text-ink">
          <th scope="col" className="px-0 py-2 pr-3 font-semibold">{c.kolom.modul}</th>
          <th scope="col" className="py-2 pr-3 font-semibold">{c.kolom.izin}</th>
          <th scope="col" className="py-2 font-semibold">{c.kolom.deskripsi}</th>
        </tr>
      </thead>
      {modules.map((m) => (
        <tbody key={m.module} className="border-b border-border-subtle last:border-b-0">
          {m.permissions.map((p, i) => (
            <tr key={p.action} className="align-top">
              {i === 0 && (
                <th scope="rowgroup" rowSpan={m.permissions.length} className="py-3 pr-3 font-semibold text-ink">
                  {m.nama}
                  <span className="block font-mono text-caption font-normal text-ink-subtle">{m.module}</span>
                </th>
              )}
              <td className="py-3 pr-3 font-mono text-caption text-ink-muted">{`${m.module}.${p.action}`}</td>
              <td className="py-3 text-ink">
                {ACTION_DESC[p.action]}
                {p.notes.length > 0 && <span className="text-ink-muted"> ({p.notes.join('; ')})</span>}
                {showRoles && <span className="block text-caption text-ink-subtle">{c.dari(p.roles.map((r) => `${r} ${roleName(r)}`).join(', '))}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}
