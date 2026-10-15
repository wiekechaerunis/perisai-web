# Selisih prototype vs PERISAI Design System

Sejak 15 Okt 2026 repo ini disamakan dengan artifact PERISAI Design System versi 1791996601-114a
(`design-system/tokens.json` = `project/tokens.json` DS; `npm run tokens` menurunkan `src/styles/tokens.css`).
Semua usulan lama di file ini (komponen gelombang 1–3, token status, `overlay-scrim`, `dialog-width-*`,
`auth-panel-width`, `app-header-height`, varian Callout/TextField/Select/KeyValueList/Sidebar/DataTable/Menu/Section)
sudah masuk DS dan tidak dicatat lagi di sini.

## Yang disamakan ke DS pada 15 Okt 2026

| Bagian | Perubahan di prototype |
|---|---|
| Token | Ganti seluruh `tokens.json` dengan versi DS: `count-ink`, `overlay-scrim`, `error-bg`, `action-danger`/`on-action-danger`, `status-*` (tema gelap: latar 12%, border 35%), `dialog-width-*`, `auth-panel-width`, `app-header-height`, `radius-full`, `heading-panel`. `styles/status.css` dihapus. |
| AccountStatusBadge, ResultTag, ArchiveTag | Memakai token `status-*` DS; neutral `ink`/`surface`/`border`; muted dan ArchiveTag `ink-muted`. |
| Sidebar | Angka badge jumlah `count-ink` (bukan `on-action`). |
| Dialog / ConfirmDialog | Scrim `overlay-scrim`; ukuran `md` 480 / `base` 560 (bawaan) / `lg` 720 dari token; fokus awal di Batal untuk konfirmasi destructive. |
| Button | Destructive `action-danger`; varian `link` dan `link-danger`; nonaktif 45%; loading `aria-disabled`. Aksi per baris (Ubah, Nonaktifkan wilayah kerja; Ubah di panel organisasi) memakai `link`. |
| Callout | Latar berwarna + garis kiri 4px, ikon 16px, varian error `error-bg`/`error-ink`, ukuran `compact` di form dan Dialog. Kotak alert buatan tangan di halaman fitur diganti Callout. |
| Toast | Varian `gagal` (lingkaran `status-danger-ink`, tidak hilang sendiri); durasi 5 detik. |
| EmptyState, StatePanel, Menu, chip | EmptyState rata tengah `heading-2`; StatePanel `heading-panel`; item Menu 10×12px; chip pil 13px medium. |
| Teks | "Log akses", "Jejak audit", "Akun saya", "Tidak aktif"; "© 2026 SKK Migas. Hak cipta dilindungi." Label menu "Ikhtisar" tetap (keputusan terbuka DS). |
| Button (aturan 15 Okt 2026) | Tombol "Filter lainnya" `quiet` semibold berwarna tetap `ink-muted`; "Hapus filter" di area filter Pengguna/Organisasi `link`; "Ekspor CSV" Log akses dan Jejak audit pindah ke aksi PageHeader; aksi PageHeader turun 24px bila ada jejak lokasi; "Tinggalkan" di ConfirmDialog tinggalkan halaman `destructive` + peringatan `beforeunload` (`lib/use-leave-guard.ts`); panel organisasi: satu aksi status jadi tombol sekunder langsung (bukan menu "⋯"). |
| Filter daftar | "Hapus filter" (`link`) di semua halaman daftar, hanya tampil bila ada filter aktif; daftar kosong karena filter menawarkan "Hapus filter". |

## Masih berbeda dari DS (perlu keputusan)

| Kode | Bagian | Prototype | DS | Alasan / sumber |
|---|---|---|---|---|
| DS-01 | Toast | Toast "Organisasi ditambahkan." punya tombol aksi "Undang PIC KKKS" | Toast tanpa tombol aksi | PRD Kelola Organisasi FR-ORG-08. PM pilih: tetap di Toast (DS diperluas) atau pindah ke ConfirmDialog/halaman. |
| DS-02 | Jejak audit | Filter disusun lalu diterapkan dengan tombol "Tampilkan"; halaman dibuka kosong | Filter berlaku langsung, tanpa tombol "Tampilkan" | PRD FR-JA-12 (halaman dibuka kosong dengan filter). DS perlu pengecualian, atau PRD diubah. |
| DS-03 | Pola filter daftar | Mengikuti aturan "Filter daftar" yang diminta 15 Okt 2026 | README DS belum memuat pola "Filter daftar" (README FilterBar masih ringkas) | Bagian filter di prompt DS belum tertulis di artifact. |
| DS-05 | Filter Log akses dan Jejak audit | Pil filter aktif, Checkbox filter cepat, tombol "Filter lainnya" `quiet`, periode berupa Select preset (Hari ini, 7 hari terakhir, 30 hari terakhir, Rentang khusus) | Belum ada di DS | Usulan desain 15 Okt 2026, diterapkan atas permintaan PM. Preset periode bukan dari PRD (FR-LA-07/FR-JA-12 hanya menyebut default 7 hari): perlu persetujuan PM. Teks DS di PROMPT_UPDATE_DS_FILTER.md. |
| DS-06 | PageHeader | Prop `back`: tombol ikon kembali 36px (border `border-control`, ikon panah kiri 18px, `aria-label` "Kembali ke …") di kiri judul, dipakai halaman Buat role `/role/baru` bersama jejak lokasi | PageHeader tanpa tombol kembali (jejak lokasi saja) | Arahan PM 15 Okt 2026: Buat role jadi halaman penuh dengan tombol kembali dan breadcrumbs. Usulkan ke DS sebagai bagian PageHeader. |
| DS-04 | EmptyState | Tanpa ilustrasi | Ilustrasi opsional | Aset ilustrasi resmi belum ada (DS: menyusul dari desainer). |

## Nilai Figma di luar DS (layar publik Login/OTP/Aktivasi)

Tercatat di DS sebagai "Pengecualian layar publik". Semua ada di `src/styles/figma.css`; selisihnya dijelaskan di
ASSUMPTIONS.md F-01..F-19. Biru `--figma-link-support` #2b81f3 gagal kontras (3,8:1) dan perlu dibetulkan desainer.
