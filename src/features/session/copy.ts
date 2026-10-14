/** Teks PRD Logout & Sesi (tab a61955db-ba08). Pesan disalin persis dari PRD. */
import type { SessionEndReason } from '@/lib/status';

export const sessionCopy = {
  /** FR-LO-03, FR-LO-08, FR-LO-17; K-14 untuk password_changed, FR-LP-14 untuk password_reset. */
  pesanAkhir: {
    logout: 'Anda telah keluar.',
    timeout: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
    revoked: 'Sesi Anda diakhiri oleh administrator. Silakan masuk kembali.',
    password_changed: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
    password_reset: 'Sesi Anda telah berakhir. Silakan masuk kembali.',
    // Tabel E-ORG (PRD Kelola Organisasi KKKS)
    org_inactive: 'Organisasi Anda tidak lagi aktif di PERISAI. Hubungi SKK Migas bila menurut Anda ini keliru.',
  } satisfies Record<SessionEndReason, string>,
  /** FR-LO-09 */
  peringatan: {
    judul: 'Sesi Anda akan berakhir',
    isi: (waktu: string) => `Karena tidak ada aktivitas, sesi Anda akan berakhir dalam ${waktu}. Pilih Lanjutkan sesi untuk tetap masuk.`,
    lanjutkan: 'Lanjutkan sesi',
    keluar: 'Keluar sekarang',
    memproses: 'Memproses…',
  },
} as const;
