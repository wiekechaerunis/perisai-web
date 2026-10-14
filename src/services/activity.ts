/**
 * Bus sederhana: adapter memberi tahu UI setiap kali permintaan pengguna sampai ke server.
 * SessionProvider memakainya untuk menutup peringatan idle secara otomatis (FR-LO-09b)
 * dan menyegarkan sisa waktu sesi.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

export const activityBus = {
  emit(): void {
    listeners.forEach((l) => l());
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
