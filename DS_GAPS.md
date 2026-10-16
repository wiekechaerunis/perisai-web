# Selisih prototype vs PERISAI Design System

Sejak 16 Okt 2026 repo ini memakai **PERISAI Design System v2 · Lime** (artifact F64DT1H6vpiwx4QQNcz42f, versi
1792162946-4038, namespace `PerisaiLime`). `design-system/tokens.json` = `project/tokens.json` DS v2 apa adanya
(tema `light` / `dark`); `npm run tokens` menurunkan `src/styles/tokens.css`. Token prototype yang belum ada di DS
disimpan terpisah di `design-system/tokens.local.json` (DS-07).

**Status DS v2: berlaku** (K1–K6 diputuskan PM 16 Okt 2026), menggantikan DS v1 untuk layar aplikasi; email tetap gaya v1.

## Pembaruan DS v2 versi 1792162946-4038 (16 Okt 2026, sore)

| Aturan | Di prototype |
|---|---|
| Sidebar lebar 240 / ciut 72 dengan tombol tepi bulat 26px ("Perkecil sidebar"/"Perlebar sidebar"), disimpan per browser; bawaan ciut di < 1440px | `Sidebar` (`collapsed`, `onCollapsedChange`), `lib/use-sidebar-collapsed.ts`. Ciut: logo tanda 32×32 (`src/assets/logo-perisai-tanda.png`, aset DS), item 44×44 + tooltip gelap, badge jadi titik merah. Menggantikan rel ikon otomatis di < 1280px. |
| Kaki sidebar: logo SKK Migas 40px + "© 2026 SKK Migas. Hak cipta dilindungi. v{versi}" 11px | Versi dari `package.json` (`__APP_VERSION__` di vite.config.ts). Ciut: logo saja, teks di tooltip. |
| `p-wedge` baru: gradasi lime lembut di kiri bawah, tanpa potongan bersudut | `.sidebar-wedge` diperbarui. |
| Token baru `switch-off`; komponen Switch | `ui/Switch.tsx` (belum dipakai layar Core: filter kondisi yang ada diterapkan lewat Terapkan → tetap Checkbox). |
| Scrollbar minimalis `p-scroll` | Kelas global; dipasang di Select, Combobox, FilterPanel, Dialog, SidePanel, DataTable, nav sidebar. |
| Timeline (riwayat satu objek) | `patterns/Timeline.tsx`; "Riwayat akun" di detail pengguna kini Timeline (dikelompokkan per hari, kejadian terbaru lime, "Belum pernah login" sebagai langkah berikutnya bergaris putus). |
| Pagination: tombol navigasi tanpa garis (chevron 16px `ink-subtle`), tetap tampil walau satu halaman | Pagination. |
| PageHeader: aksi selalu di kanan, sejajar tengah blok judul, tidak turun ke bawah | PageHeader tingkat atas. |
| Checkbox sudut 4px, centang 3px | Gaya global input. |
| Link aksi berdiri sendiri tanpa garis bawah | Sisa tautan bergaris ("Ubah", "Lihat di Log akses", dll.) dibersihkan; tautan di dalam kalimat memakai `link-inline`. |
| Aksi milik satu tabel (Unduh/Ekspor) tidak masuk PageHeader; tombol ikon 36px + tooltip di toolbar tabel setelah Filter | `ui/IconButton.tsx`; Ekspor di Pengguna ("Ekspor daftar pengguna"), Log akses ("Ekspor log akses (CSV)"), Jejak audit ("Ekspor jejak audit (CSV)") pindah dari PageHeader ke toolbar. Menggantikan aturan 15 Okt 2026 "Ekspor di PageHeader". "Atur retensi" Jejak audit tetap di PageHeader (aksi halaman). |
| PageFilter (filter tingkat halaman) | Belum dipakai: layar Core Platform tidak punya filter tingkat halaman (DS-15). |

## Aturan baru DS v2 yang diterapkan (versi 1792158669-ca02, 16 Okt 2026)

| Aturan | Di prototype |
|---|---|
| K1 font **Plus Jakarta Sans** (UI) + IBM Plex Mono (ID, IP) | `@fontsource/plus-jakarta-sans` 400–700 (self-host, menggantikan Plex Sans); `tabular-nums` di body. |
| Bobot: 700 hanya judul halaman/kartu/dialog dan `metric`; 600 tombol, tag, label, nama item, link, `<b>`; 500 judul KPI, pesan error, toast | Button 600, Tag 600 (token `tag`), `body-strong` 600, pesan error 500, tab 500/600; 700 tersisa di judul, halaman pagination aktif, chip terpilih, menu aktif. |
| Link di dalam kalimat bergaris tipis `border-control` berjarak 3px; link aksi berdiri sendiri tanpa garis bawah | Kelas `link-inline`; Button `link`/`link-danger` tanpa garis bawah (garis tipis saat hover). |
| Ekspresi E1: tab aktif garis bawah 3px `action` | Tabs/TabsNav. |
| Ekspresi E4: checkbox/radio aktif `action` dengan tanda `on-action`; garis kiri 3px `action` pada baris tabel yang di-hover | Gaya global input + DataTable. (Membalik aturan sebelumnya "checkbox ink, bukan lime".) |
| Ekspresi E5: progres terisi `action` | Meter kuota passkey (ManagedList "0 dari 5"). |
| Ekspresi E6: gradasi + potongan diagonal lime di dasar sidebar (`p-wedge`) | Kaki Sidebar (`.sidebar-wedge`). |
| K4: status berjalan biru `status-info-*` | Diundang = info (biru); Ditangguhkan = caution. Menutup DS-08. |
| AuthForm: istilah "kata sandi", email tersamar juga di Buat kata sandi (PM 16 Okt; FR-AK-08 perlu diperbarui), "Kekuatan: Cukup", checklist 2 kolom tampil sebelum mengetik | Copy Aktivasi/Login/Atur ulang, `maskEmail` di Aktivasi, PasswordStrengthMeter + PasswordChecklist. |
| Textarea: tumbuh sampai 240px; penghitung tebal saat penuh; diumumkan saat sisa ≤ 20 | Textarea (`limitLabel` opsional). |
| Prinsip 8 "lunak": catatan tetap sebagai Note | Catatan di Akun saya (Profil, Keamanan masuk) jadi Callout info. |

## Yang disamakan ke DS v2 pada 16 Okt 2026 (revamp penuh)

| Bagian | Perubahan di prototype |
|---|---|
| Token | Ganti seluruh `tokens.json` dengan v2 (50 warna, tema `light`/`dark`). Nama v1 diganti: `sev-kritis/tinggi/sedang/rendah` → `sev-critical/high/medium/low-*`, `status-warning-*` → `caution-*`, `status-danger-*` → `error-*`, `overlay-scrim` → `scrim`, `sidebar-*` dihapus (sidebar putih), `brand-lime` → `action`. Arti `ink-subtle` berubah (v2: lebih kuat dari `ink-muted`). Tipografi v2 (`page-title` 24/32, `page-title-child` 20/28, `section-title` 15/22, `body` 13/18, `label` 12/16 600, `tag`, `data-id`), radius v2 (`md` 8 tombol/input, `lg` 10 menu/kotak isi, `xl` 12 kartu), `shadow-floating`, ukuran `topbar-height` 64, `control-height` 40, `popover-width` 360, `sidepanel-width` 480. Plex Sans 700 ditambahkan. |
| Kerangka | Sidebar putih 240px: logo PERISAI 176px + garis identitas 80:20 `brand-red`:`action` + label "Menu"; item 42px `radius-lg`, aktif = blok lime + 700; badge `count-bg`; kaki bergradien lime lembut; rel ikon 72px di bawah 1280px. Bar atas 64px. Area konten padding 24px, jarak kartu 16px. |
| PageHeader | Tingkat atas: judul 24px + satu subjudul `ink-muted` maks. 560px, tanpa jejak lokasi. Turunan (detail/form): pita `surface` + tombol kembali 40px, judul 20px + tag status sebaris, jejak lokasi 12px DI BAWAH judul (dipisah "›"), meta singkat setelah "·". Menggantikan DS-06. |
| Kartu (Section) | `surface` + garis `border` + `radius-xl` + padding 20px, tanpa bayangan. |
| Button | Primer lime (`action` + `on-action`), hover `action-hover` + garis bawah 2px `action-line`; sekunder garis dalam `border-control`, hover garis `ink`; varian baru `subtle` dan ukuran `sm` 36px; tekan mengecil 97%; teks 13px/700; `link-danger` memakai `error-ink`. |
| Input (TextField, Select, Textarea, Combobox, ChipInput) | Garis dalam 1px `border-control`; hover `ink`; fokus 2px `action-line`; error 2px `error-ink`; baca saja `surface-subtle`; nonaktif `surface-sunken`. Label 12/16 600 `ink`. Opsi Select 36px, terpilih `action-subtle-*` + centang + 700; daftar `radius-lg` + `shadow-overlay`. |
| Checkbox / Radio | Gaya global (styles/index.css): kotak 16px garis 1,5px `border-control`, tercentang `ink` + centang `surface` (bukan lime); radio tercentang = lingkaran dalam 5px `ink`. |
| Tag (AccountStatusBadge) | 24px, padding 9px, `radius-sm`, 12/16 700, tanpa garis (kecuali Draf), tanpa titik. Nada baru `info`, `draft`, `selected` ("Perangkat ini" kini `action-subtle`). |
| DataTable + toolbar | Satu tabel dalam satu kartu (`TableCard`): toolbar berisi judul tabel + kotak cari 36px + tombol Filter; pil filter aktif; kepala `surface-subtle`; baris 52px, hover `surface-subtle`; kolom pertama `body-strong`. Judul tabel kini "Daftar …". |
| Filter | Pola v2 **FilterPanel**: semua filter di panel (popover 360px untuk ≤ 6 isian; panel kanan 480px untuk Log akses/Jejak audit karena > 6 isian + rentang tanggal), tidak langsung berlaku — "Atur ulang" + "Terapkan · n {entitas}" dengan pratinjau jumlah. **AppliedFilter**: pil `action-subtle` 28px, ✕ langsung mencabut, + "Hapus filter". Enum ≤ 5 = ChipGroup. Menggantikan FilterBar (dihapus) dan DS-03/DS-05. |
| Pagination | « ‹ nomor halaman (maks. 7 slot) › », halaman aktif lime, "Tampilkan [25] per halaman" + rentang tebal; di kaki kartu tabel. |
| Dialog / ConfirmDialog | 480px (`lg` 640px), `shadow-floating`, judul 17/24 700, tombol tutup 28px, isi `ink-subtle`, kaki bergaris `border-subtle` dengan tombol rata kanan. |
| Toast | Kanan bawah, 480px, `radius-lg`, lingkaran ikon `ink` (gagal `error-ink`), pesan 14/20 500, tombol tutup ✕ 28px. |
| Callout | Banner v2: `radius-lg`, tanpa garis kiri; info = Catatan (`surface` + `border`, teks `ink-subtle`). |
| EmptyState / StatusPage | Ilustrasi garis v2 bertoken (`Illustration`, 13 dari 17 ilustrasi DS) menggantikan bitmap Figma; judul `section-title` (EmptyState) atau 20px (StatusPage); halaman 403/404 di tengah dengan satu tombol sekunder. Menutup DS-04. |
| FormFooter | Bar aksi form menempel di bawah (Buat role, Ubah data pengguna): kiri Batal/Kembali, kanan satu primer. |
| Layar publik | AuthForm v2: logo 120px, judul 24px rata tengah, kalimat 14/20 `ink-subtle`, kontrol 48px, tombol lime lebar penuh; OtpField 6 sel (tetap satu input); meter kekuatan berwarna + kata ("Kekuatan kata sandi: Cukup"); syarat tercentang hijau. Bar atas layar publik 56px. Warna Figma (merah "Lupa kata sandi", biru "Hubungi Support", alert merah muda) diganti token DS. |
| Gerak | Hover/tekan 120ms, muncul 160ms (fade + geser 4px) untuk dropdown, popover, dialog, toast; semua mati saat `prefers-reduced-motion: reduce`. |
| Angka & tanggal | Tanggal/waktu dan jumlah tidak lagi mono (README DS v2: mono hanya untuk ID dan IP); angka tabular. |

## Masih berbeda dari DS v2 (perlu keputusan)

| Kode | Bagian | Prototype | DS v2 | Alasan / sumber |
|---|---|---|---|---|
| DS-01 | Toast | Toast "Organisasi ditambahkan." punya tombol aksi "Undang PIC KKKS" | Toast tanpa tombol aksi | PRD Kelola Organisasi FR-ORG-08. PM pilih: tetap di Toast (DS diperluas) atau pindah ke ConfirmDialog/halaman. |
| DS-02 | Jejak audit | Panel filter dengan tombol "Tampilkan"; halaman dibuka kosong (EmptyState + "Pilih filter") | Sudah tercatat sebagai pengecualian di README FilterPanel v2 | PRD FR-JA-12. Selaras; tetap dicatat karena tombol "Pilih filter" usulan. |
| DS-07 | Token prototype | `tokens.local.json`: `dialog-title` 17/24 700, `lead` 14/20, `space-8/10`, `control-sm` 36, `control-lg` 48, `row-min` 52, `content-max` 720, `dialog-width-md/lg`, `auth-panel-width` 563 | Nilai disebut di README komponen, belum jadi token | Usulkan masuk `tokens.json` DS v2. |
| DS-09 | Ikon | Lucide (stroke 1,8–2, `currentColor`) | Set ikon garis PERISAI (82 ikon `ic-*`) | Mengganti set ikon = pekerjaan terpisah; bentuk dan ketebalan Lucide mirip. |
| DS-10 | Bar atas | Kiri kosong; hanya kartu pengguna di kanan | Cari global ⌘K, Tanya AI, notifikasi | Belum ada di PRD Core Platform; tidak dibuat agar tidak mengarang fitur. |
| DS-11 | Ilustrasi | 13 ilustrasi (tanpa offline, pemeliharaan, notifikasi kosong, diproses) | 17 ilustrasi | Hanya yang dipakai layar Core Platform yang disalin. |
| DS-12 | Tema gelap | Token `dark` tersedia, belum ada toggle di aplikasi (Storybook: Terang/Gelap) | K2: tema Gelap dari token yang sama | Logo untuk latar gelap belum ada (README Logo DS v2). |
| DS-13 | Ekspresi E3 (kartu aksen) | Belum ada kartu aksen di layar Core Platform | Tiap layar: E1 + E2 + satu dari E3–E6 | Layar Core Platform tidak punya ringkasan KPI; E4–E6 sudah terpenuhi lewat checkbox, baris tabel, sidebar. |
| DS-15 | PageFilter | Tidak dibuat | Komponen baru DS v2 | Belum ada halaman Core Platform dengan filter tingkat halaman (Periode/Area); dibuat saat dashboard/ringkasan dibangun. |
| DS-14 | ManagedList | Ikon jenis tanpa kotak (prinsip 8 "lunak") | README ManagedList: ikon di kotak 36px | Dua aturan DS bertentangan; prinsip 8 lebih baru. |

## Nilai Figma di luar DS (layar publik)

Hanya panel foto Login (`LoginHero`) yang masih memakai nilai `src/styles/figma.css` (teks putih di atas foto). Alert login,
tautan "Lupa kata sandi?" dan "Hubungi support", garis header, dan footer kini memakai token DS v2.
