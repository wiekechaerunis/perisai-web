/**
 * Ruang Kerja (M-01) — placeholder halaman pendaratan setelah login.
 * FR-LG-25 (isi sesuai role dan cakupan), FR-LG-26, FR-AK-14. Isi M-01 bukan bagian Core Platform;
 * halaman ini hanya menunjukkan bahwa pendaratan role-aware bekerja.
 */
import { PageBody } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Section } from '@/components/layout/Section';
import { KeyValueList } from '@/components/patterns/KeyValueList';
import { formatTanggalJam } from '@/lib/format';
import { roleName, roleDef } from '@/lib/rbac';
import { useSession } from '../session/SessionProvider';
import { workspaceCopy as c } from './copy';

export function RuangKerjaPage() {
  const { session } = useSession();
  if (!session) return null;
  const { user } = session;
  return (
    <>
      <PageHeader title={c.judul} summary={c.ringkasan(user.nama)} />
      <PageBody>
        <Section title={c.aksesAnda} description={c.aksesKeterangan}>
          <KeyValueList
            items={[
              { key: 'role', label: c.role, value: user.roles.map((r) => `${r} ${roleName(r)}`).join(', ') },
              { key: 'org', label: c.organisasi, value: user.organisasi.nama },
              { key: 'cakupan', label: c.cakupan, value: user.roles.map((r) => roleDef(r).scope).join('; ') },
              {
                key: 'login',
                label: c.loginTerakhir,
                value: user.loginTerakhir ? formatTanggalJam(user.loginTerakhir) : '—',
              },
            ]}
          />
        </Section>
      </PageBody>
    </>
  );
}
