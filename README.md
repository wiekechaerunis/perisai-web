# perisai-web — prototype PERISAI Core Platform

> **Prototype kick-off 21 Okt 2026.** Selain Core Platform, repo ini memuat ilustrasi garis besar modul di luar Core untuk
> demo kick-off (lihat [Demo kick-off](#demo-kick-off-21-okt-2026)). Ilustrasi kick-off · **bukan desain final dan bukan
> acuan dev** untuk modul di luar Core.

Prototype React untuk Core Platform PERISAI: **M-15 Identitas & Akses** dan **M-22 Jejak Audit & Log**.
Kodenya disiapkan agar bisa dilanjutkan tim dev. Tampilan mengikuti PERISAI Design System; data lewat service interface
yang bisa ditukar ke API nyata.

> **Stack perlu konfirmasi Tech Lead.** Stack tim tech belum ditetapkan; repo ini memakai stack default di bawah.
> Bawa juga ke Tech Lead: kontrak API (`src/services/api/index.ts` adalah usulan), Zitadel/BFF (PRD 2FA), dan hosting
> font (self-host karena deployment bisa di jaringan tertutup/VPN).

## Menjalankan

```bash
npm i
npm run dev            # http://localhost:5173 (mode data mock)
npm run storybook      # katalog komponen, toggle tema Standar / Ruang kendali
npm test               # Vitest + Testing Library
npm run typecheck && npm run lint && npm run build && npm run build-storybook
```

Mode data: `VITE_DATA_SOURCE=mock` (default) atau `api` (lihat `.env.example`).

### Data uji (mode mock)

- Akun uji, organisasi fiktif, dan kata sandi uji ada di `src/services/mock/seed.ts`. Semua data fiktif.
- **Alat uji (mock)** di bawah Sidebar:
  - Kotak masuk mock (kode OTP, tautan reset/aktivasi).
  - Buat tautan uji (berlaku / sudah dipakai / kedaluwarsa).
  - Majukan jam server (uji idle timeout dan peringatan sesi).
  - Simulasikan admin mencabut sesi, atau akun ditangguhkan.
  - Gagalkan email berikutnya (uji "Undangan Gagal Dikirim"); setujui/tolak permintaan ubah email.
- Masuk lewat `/masuk` dengan email akun uji + kata sandi uji, lalu kode OTP dari Kotak masuk mock. Cara cepat:
  **Masuk sebagai (uji)** di bawah form Login (hanya mode mock).
- Tautan aktivasi uji: `/aktivasi/undangan-agus-berlaku` (berlaku), `/aktivasi/undangan-maya-kedaluwarsa` (kedaluwarsa).

## Demo kick-off (21 Okt 2026)

Lima alur dari PRD Garis Besar (Kick-off), dengan data contoh fiktif. Tanpa autentikasi sungguhan: kata sandi uji ada di
`src/services/mock/seed.ts`, dan kode OTP tampil di layar verifikasi ("Mode demo · kode OTP").
Gunakan **Ganti peran (demo)** di header untuk berpindah sudut pandang tanpa login ulang. Ulang demo dari awal:
**Alat uji (mock) › Atur ulang data mock** di bawah Sidebar.

| Peran (demo) | Akun uji | Organisasi |
|---|---|---|
| Pimpinan SKK | Hendra Wibisono | SKK Migas |
| Pengawas SKK | Ratna Paramitha | SKK Migas |
| Pelapor KKKS | Dimas Pratama (`d.pratama@andalas-energi.example`) | PT Andalas Energi Hulu |
| Pejabat Berwenang KKKS | Sri Lestari | PT Andalas Energi Hulu |
| Admin KKKS | Rina Wiyono | PT Andalas Energi Hulu |

Label peran dibaca dari satu peta (`src/lib/rbac.ts` › `ROLES`); nama peran masih bisa berubah.

### Urutan klik

1. **Masuk & Ruang Kerja per peran**
   1. `/masuk` → email Dimas + kata sandi uji → **Masuk** → masukkan kode OTP yang tampil → **Verifikasi**.
   2. Ruang Kerja Pelapor: *Tugas saya* + ringkasan organisasi.
   3. Ganti peran → **Pengawas SKK**: ringkasan lintas KKKS, antrean *Menunggu dokumen bertanda tangan*.
2. **Insiden dari lapangan sampai ditutup** (mulai di layar ponsel: DevTools browser → ukuran 375 px)
   1. Pelapor KKKS → **Lapor insiden** (`/lapor`) → keparahan **Kritis**, lokasi, kronologi, foto → **Kirim laporan**.
   2. Ganti peran → **Pengawas SKK**: notifikasi lonceng + Ruang Kerja *Insiden tinggi/kritis · Belum terverifikasi*.
      Buka insiden: hanya linimasa, **tanpa tombol aksi**.
   3. Ganti peran → **Pejabat Berwenang KKKS**: *Kotak persetujuan* → insiden → **Verifikasi** → pilih PIC → **Tugaskan** →
      **Catat tindakan** → **Tutup insiden** (wajib penyebab + bukti).
3. **Realisasi WP&B**
   1. Pelapor KKKS → **Anggaran pengamanan** → *Realisasi bulanan* → **September 2026** (Draft) → **Unggah template**
      (pilih berkas apa saja) → kategori *Koordinasi aparat* +18% wajib dijelaskan → isi penjelasan → **Ajukan**.
   2. Pejabat Berwenang KKKS → buka periode yang sama → **Finalisasi** → draf berita acara disusun, status
      *Menunggu Dokumen Bertanda Tangan* (**Lihat draf berita acara**).
   3. Pengawas SKK → Ruang Kerja › *Menunggu dokumen bertanda tangan* → pilih PDF → **Unggah dokumen bertanda tangan** →
      status **Final**. Dasbor anggaran vs realisasi + sorotan deviasi ada di `/wpb`.
4. **Kontrak BUJP & pengingat**: **Kontrak BUJP** (`/kontrak`) → status Aktif / Akan Berakhir / Berakhir → buka
   *SPK-BUJP/ADL/2024/017* → dokumen, realisasi, insiden terkait, pengingat 12/6/3/1 bulan. Admin KKKS / Pelapor KKKS:
   **Daftarkan kontrak**. Notifikasi pengingat ada di lonceng (peran KKKS).
5. **Dasbor eksekutif & peta panas**: Pimpinan SKK → **Dasbor eksekutif** (`/dasbor`) → klik titik di peta →
   **Peta panas** (`/peta-panas`) → daftar insiden area → buka detail insiden.

### Aturan yang ditegakkan (data layer `src/services/mock/ops`)

- SKK Migas hanya memantau: tidak ada setujui/tolak/kembalikan/tugaskan/komentar. Satu-satunya aksi tulis: Pengawas SKK
  mengunggah dokumen bertanda tangan → *Final*.
- Semua review dan persetujuan oleh Pejabat Berwenang KKKS.
- Isolasi data: pengguna KKKS hanya menerima data organisasinya; SKK lintas KKKS.
- Dasbor, peta panas, laporan hanya dari insiden terverifikasi; tinggi/kritis *Belum terverifikasi* tampil terpisah.
- Modul lain tampil sebagai layar ringkas; Bahan peledak, Layanan infrastruktur, K3, Asisten PERISAI, dan Informasi
  eksternal bertanda **Konsep**.

## Rute

| Rute | Layar | Status |
|---|---|---|
| `/masuk` | Login (Figma 85:4794) + pesan pengakhiran sesi | Dibangun |
| `/masuk/verifikasi` | Verifikasi OTP login (Figma 118:235) | Dibangun |
| `/aktivasi/:token` | Buat password + state tautan (Figma 66:2602, 66:2546, 66:2569, 66:2582) | Dibangun |
| `/aktivasi/:token/verifikasi` | Verifikasi email aktivasi (Figma 116:144) | Dibangun |
| `/lupa-kata-sandi` | Permintaan reset | Dibangun |
| `/atur-ulang-kata-sandi/:token` | Atur ulang kata sandi (4 state tautan) | Dibangun |
| `/ruang-kerja` | Placeholder M-01 (pendaratan role-aware) | Dibangun |
| `/pengguna`, `/pengguna/:id` | Manajemen pengguna + halaman detail `/pengguna/:id` (undang, kirim ulang, batalkan, status, masa berlaku, cabut sesi; tab Akses & Aktivitas) | Dibangun (gelombang 2–3) |
| `/akun-saya` | Akun Saya · Profil (nama, jabatan, ubah email lewat permintaan, cakupan, hak akses efektif) | Dibangun (gelombang 2–3) |
| `/akun-saya/keamanan` | Akun Saya · Keamanan masuk (ubah kata sandi, sesi aktif, riwayat masuk) | Dibangun (gelombang 2–3) |
| `/pengguna/:id/ubah` | Ubah data & role pengguna: ringkasan sebelum/sesudah + perbedaan hak akses (R-03, R-07, R-04 organisasinya) | Dibangun (Ubah Data & Role) |
| `/permintaan-ubah-email` | Daftar permintaan ubah email: Setujui / Tolak dengan alasan (R-03, R-04) | Dibangun (Ubah Data & Role) |
| `/verifikasi-email/:token`, `/bukan-saya/:token` | Tautan publik dari email: verifikasi email baru, "Bukan saya" | Dibangun (Ubah Data & Role) |
| `/role`, `/role/:kode`, `/role/baru` | Katalog role (R-03): ubah nama/deskripsi, buat role (halaman `/role/baru`), ubah hak akses, nonaktifkan (pindahkan/lewati), aktifkan kembali, pindah massal, hapus role buatan | Dibangun (Role) |
| `/organisasi`, `/organisasi/:kode` | Kelola Organisasi KKKS: daftar, tambah, halaman detail `/organisasi/:kode` (Profil/Akses/Wilayah Kerja/Riwayat), nonaktifkan (R-03; R-07 terbatas; R-04 baca organisasinya) | Dibangun (Organisasi) |
| `/log-akses` | Log Akses (filter, detail entri, kegagalan beruntun, ekspor R-03) + tab Sesi aktif (cabut sesi); R-02/R-03/R-04 | Dibangun (gelombang 3) |
| `/jejak-audit` | Jejak Audit (dibuka kosong, detail sebelum/sesudah, kelompok aksi massal, retensi R-03); R-02/R-03/R-04 | Dibangun (gelombang 3) |

Peringatan idle (FR-LO-09) dan menu Keluar tersedia di semua halaman setelah login.

## Dependensi tambahan (perlu konfirmasi Tech Lead)

- `write-excel-file@4.1.1` (MIT): membuat file .xlsx untuk Ekspor Daftar Pengguna. Di produksi file sebaiknya dibuat backend.

## Stack default

Vite 5 · React 18 · TypeScript strict · React Router 6 · Tailwind 3 (dipetakan ke token DS; palet bawaan dimatikan) ·
Radix (Dialog, DropdownMenu, Select, Tabs, Toast) · TanStack Query & Table · Zod · Lucide · Storybook 8 · Vitest + RTL ·
ESLint 9 + Prettier · `vercel.json` (SPA rewrite; **belum di-deploy**).

## Struktur

```
design-system/tokens.json   salinan tokens.json PERISAI Design System (artifact 114e8e1a-…, tokens v1, diambil 14 Okt 2026)
scripts/build-tokens.ts     tokens.json → src/styles/tokens.css (otomatis sebelum dev/build/storybook)
src/components/ui|patterns|layout   implementasi resmi komponen DS + komponen non-DS (DS_GAPS.md)
src/features/<fitur>        halaman, copy.ts (teks PRD), hook
src/services                types.ts (kontrak), mock/, api/, index.ts
src/lib                     rbac.ts, status.ts, format.ts, password.ts, security-params.ts, i18n/
```

## Sumber

| Sumber | Versi |
|---|---|
| PRD Core Platform (Claude Docs, master) | 13 Okt 2026 |
| BRD | **v0.5** (13 Okt 2026); katalog role 6.2, M-15, M-22 |
| PERISAI Design System | tokens v1 |
| Decision Log | KD-01..KD-07 masih *Diusulkan* |
| Figma `CORE-PERISAI` (`qeqeJ9KGVpCFxLM6vTAK0a`) | dibaca 14 Okt 2026; aset di `src/assets/figma/`, nilai di luar DS di `src/styles/figma.css` |

Dokumen pendamping: [TRACEABILITY.md](TRACEABILITY.md) · [ASSUMPTIONS.md](ASSUMPTIONS.md) · [DS_GAPS.md](DS_GAPS.md) · [COMPONENTS.md](COMPONENTS.md)
