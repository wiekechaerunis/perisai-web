/**
 * Penjaga meninggalkan form yang sudah diubah (DS pola "Halaman turunan", diputuskan PM 15 Okt 2026):
 * - navigasi di dalam aplikasi (tombol kembali, Batal, jejak lokasi, menu) → `blocker` untuk ConfirmDialog
 *   "Tinggalkan halaman?";
 * - menutup tab atau memuat ulang → peringatan bawaan browser (`beforeunload`).
 * Butuh data router (useBlocker).
 */
import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export function useLeaveGuard(dirty: boolean, saved: { current: boolean }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saved.current && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (!dirty && blocker.state === 'blocked') blocker.reset?.();
  }, [dirty, blocker]);
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saved.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, saved]);
  return blocker;
}
