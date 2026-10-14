# Usulan tambahan untuk PERISAI Design System

Komponen dan nilai di bawah tidak ada di DS (artifact `114e8e1a-…`). Semua sudah dibangun di repo ini memakai token DS,
dan masing-masing punya story di Storybook (kedua tema). Artifact DS tidak diubah.

## Komponen baru (non-DS)

| Nama | Kegunaan | Alasan | Story |
|---|---|---|---|
| Dialog / ConfirmDialog | Konfirmasi aksi berdampak, peringatan sesi | PU-05 (aksi berdampak minta konfirmasi); DS menyebut `shadow-overlay` untuk dialog, tetapi tidak punya komponennya | DS/Pola › Dialog |
| Toast | Umpan balik singkat setelah aksi berhasil | FR-AK-14, FR-UK-11, FR-AK-16 | DS/Pola › Toast |
| Menu | Menu tarik-turun aksi akun | FR-LO-01 (Keluar dari setiap halaman) | DS/Pola › Menu |
| StatePanel | Keadaan halaman penuh yang bukan daftar kosong (tautan tidak valid, akun sudah aktif, 403/404); `align=center` + `media` untuk ilustrasi Figma | EmptyState DS khusus untuk daftar kosong | DS/Pola › StatePanel |
| PasswordChecklist | Syarat password sebagai checklist | FR-AK-04, FR-LP-11, FR-UK-05 | DS/Pola › PasswordStrengthMeter + PasswordChecklist |
| PasswordStrengthMeter | Meter kekuatan 4 bar | FR-AK-05; lihat warna di K-1 | idem |
| ResendCountdown | Tombol kirim ulang dengan hitung mundur | FR-LG-13, FR-AK-10 | DS/Pola › ResendCountdown |
| AuthSplitLayout / AuthPageLayout | Kerangka layar publik: split (Login 85:4794) dan header + kolom tengah (118:235, 66:2602) | Login, OTP, Aktivasi, Lupa/Atur Ulang | DS/Tata letak › AuthSplitLayout, AuthPageLayout |
| AccountStatusBadge | Badge status: nada `success`/`strong`/`warning`/`danger` (Figma 109:16180) + `neutral`/`muted`/`caution`; ikon opsional; keterangan opsional di bawah. **Usulan token status** `--status-{success,warning,danger,strong}-{ink,bg,border}` (styles/status.css) — menyimpang dari aturan DS "status alur kerja netral" atas keputusan PM 14 Okt 2026 | K-5: status akun tidak ada di WorkflowStatus; F-20 | DS/Pola gelombang 2 › AccountStatusBadge |
| SidePanel | Panel detail kanan 480px tanpa scrim (master-detail) | Figma 106:14009 | DS/Pola gelombang 2 › SidePanel |
| Combobox / MultiSelect | Pilih satu dengan pencarian; pilih banyak dengan chip | DS Select: > 15 opsi pakai pencarian; Figma 51:827, 213:402 | DS/Pola gelombang 2 › Combobox + MultiSelect |
| Textarea | Penjelasan alasan "Lainnya" + penghitung | FR-BU-08, FR-SA-10, FR-LO-16 | DS/Pola gelombang 2 › Textarea |
| AppHeader | Header 56px dengan menu pengguna | Figma 66:3139; FR-AS-001 | DS/Tata letak › AppShell |
| FilterBar | Kartu filter: baris utama (pencarian + periode) + filter tambahan yang dapat dibuka/ditutup dengan penanda jumlah aktif | Filter Log Akses dan Jejak Audit terlalu ramai (masukan PM 14 Okt 2026) | Belum (dipakai di `/log-akses`, `/jejak-audit`) |
| ChipInput | Isian banyak nilai sebagai chip yang divalidasi satu per satu (normal, error, peringatan); Enter/koma menambah | PRD Kelola Organisasi Design Brief B3 (domain email) | Belum (dipakai di dialog Tambah organisasi) |
| Pagination | Navigasi halaman server: pemilih "Baris per halaman" (10/25/50/100), ringkasan "1–25 dari 132", Sebelumnya/Berikutnya | FR-LA-09, FR-JA-16; DS DataTable tidak punya paginasi | DS/Pola gelombang 3 › Paginasi |
| ResultTag / ArchiveTag | Penanda hasil: Berhasil `success` (hijau), Gagal/Ditolak `danger` (merah), memakai AccountStatusBadge; penanda Arsip netral | FR-LA-02, FR-LA-18, FR-JA-22; status hasil log bukan WorkflowStatus | Belum (di `features/logs/shared.tsx`, diusulkan pindah ke `patterns/`) |
| EffectiveAccessView / ScopeList | Tabel modul × aksi × cakupan + role asal; daftar cakupan bertingkat | FR-HE-14..16, FR-CD-13/14 | Belum (fitur; pola bisa jadi KeyValueList/DataTable) |

## Varian / perluasan komponen DS

| Komponen | Perluasan | Alasan |
|---|---|---|
| Callout | Varian `error` (border + ikon `error-ink`, teks `ink`) | K-2: alert server di atas form (Tabel E-1, L-2, U-1) |
| TextField | `revealable` (toggle sandi), `digitsOnly` + `autoComplete="one-time-code"`, `leading` (ikon kiri, Figma 85:4808/4815), `size="lg"` (`control-lg`, kode verifikasi) | FR-LG-02, FR-LG-16, Figma Login/OTP |
| Select | `tone="inverse"` untuk latar `sidebar-bg` | RoleSwitcher dev di Sidebar |
| Dialog | Kepala/kaki bergaris, lebar 560px, `footerNote`, varian `media` (ilustrasi, rata tengah) | Figma 109:14140, 66:3553 |
| KeyValueList | `variant="block"` (InfoBlock `surface-sunken`, label 120px) | Figma 109:14140 |
| Sidebar | `brand` (logo), grup bisa dilipat, penanda lime item aktif | Figma 238:3000 (F-22) |
| DataTable | `onRowClick`, `selectedRowId` (`surface-selected`) | Master-detail Figma 106:14009 |
| Toast | `action` (tombol aksi lanjutan) | FR-ORG-08 "Organisasi ditambahkan." + Undang PIC KKKS |
| Menu | Item `disabled` (redup, tidak dapat dipilih) | PRD Profil Pengguna: "Akhiri semua sesi" nonaktif bila 0 sesi |
| Section | Dipakai dengan border `border` sebagai kartu (Figma radius 8 + border); DS: Section tanpa border | Figma 66:3139 |

## Nilai di luar token

| Nilai | Dipakai di | Usulan token |
|---|---|---|
| Scrim dialog `ink` @ 40% | `Dialog.tsx` overlay | `overlay-scrim` per tema |
| Panel autentikasi 563px (padding 88/61px), form 420px; header publik 80px (padding 80px), kolom 400/640px | `AuthLayout.tsx` | Dari Figma 85:4795, 118:236; usulan `auth-panel-width` |
| Tinggi bar meter 4px, jarak bar 4px | `PasswordStrengthMeter.tsx` | — (pakai `space-1`) |
| Lebar dialog 480px / 720px | `Dialog.tsx`, alat uji | `dialog-width-md/lg` |

## Nilai Figma di luar DS (dipakai di layar Login/OTP/Aktivasi)

Semua ada di `src/styles/figma.css`; selisihnya dijelaskan di ASSUMPTIONS.md F-01..F-19.

| Variabel | Nilai | Frame | Bertentangan dengan aturan DS |
|---|---|---|---|
| `--figma-link-accent` | #c8202f | 85:4822 "Lupa kata sandi?" | Merah hanya untuk severitas / error form |
| `--figma-link-support` | #2b81f3 | 66:2551 "Hubungi Support" | Biru hanya untuk focus-ring |
| `--figma-link-inline` | #2459c8 | 85:4916 tautan dalam alert | Sama dengan `focus-ring` |
| `--figma-alert-bg` / `-border` / `-title` | #fffbfb / #fecaca / #dc2626 | 85:4911 alert login | Callout tidak punya varian ini |
| `--figma-hero-ink` / `-muted` | #ffffff / rgba(255,255,255,.85) | 85:4833–4850 | Tidak ada token teks di atas foto |
| `--figma-footer-ink` | #8a8f93 | 85:4825 | Mendekati `ink-subtle` |
| `--figma-header-border` / `-muted` | #e6e6e7 / #777980 | 66:2547, 66:2550 | Mendekati `border` / `ink-subtle` |
| Ukuran teks hero | 34/40px, 14/21px | 85:4833, 85:4834 | Di luar skala tipe DS |
| Ilustrasi state | 3 gambar PNG | 78:4289, 78:4323, 78:4328 | DS: tanpa ilustrasi untuk keadaan kosong |

Nilai Figma lain (tipografi, tinggi input, radius, border input) **tidak** dipakai; dipetakan ke token DS terdekat (F-06).
