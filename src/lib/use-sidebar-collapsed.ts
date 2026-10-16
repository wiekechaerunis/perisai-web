/**
 * Keadaan sidebar lebar/ciut (DS v2 Sidebar): disimpan per pengguna di browser dan berlaku di semua halaman.
 * Bawaan bila belum pernah dipilih: lebar di layar ≥ 1440px, ciut di bawahnya (1366–1439px).
 */
import { useCallback, useState } from 'react';

const KEY = 'perisai.sidebar';

function initial(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'ciut') return true;
    if (v === 'lebar') return false;
  } catch {
    /* penyimpanan browser tidak tersedia */
  }
  return typeof window !== 'undefined' && window.innerWidth < 1440;
}

export function useSidebarCollapsed(): [boolean, (collapsed: boolean) => void] {
  const [collapsed, setState] = useState(initial);
  const set = useCallback((c: boolean) => {
    setState(c);
    try {
      localStorage.setItem(KEY, c ? 'ciut' : 'lebar');
    } catch {
      /* abaikan */
    }
  }, []);
  return [collapsed, set];
}
