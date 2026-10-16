# Asumsi — perlu keputusan PM / tim

Semua asumsi di bawah disetujui Mino pada 14 Okt 2026 sebagai **sementara**. Tidak ada temuan PR-nn yang
diselesaikan di sini; kode yang terdampak ditandai `ASSUMPTION` beserta kode rujukannya.

## Konflik PRD vs DS (K-1..K-5, K-10, K-11)

| Kode | Konflik | Asumsi sementara | Lokasi |
|---|---|---|---|
| K-1 | Strength meter Tabel P-1 (merah/kuning/hijau) vs DS v1 (hanya severitas berwarna) | **Selesai 16 Okt 2026 (DS v2 PasswordField):** bar berwarna `error-ink` → `caution-ink` → `status-success-ink`, selalu dengan kata ("Kekuatan kata sandi: Cukup") — sejalan PRD P-1 dan Figma 82:4635 | `components/patterns/PasswordStrengthMeter.tsx` |
| K-2 | Alert server di atas form (Tabel E-1, L-2, U-1) tidak punya varian Callout DS | Varian usulan `error` (border + ikon `error-ink`) | `components/patterns/Callout.tsx` |
| K-3 | Label PRD Title Case ("Simpan Password Baru") vs DS sentence case | Label/judul/tombol sentence case; teks pesan disalin persis | `features/*/copy.ts` |
| K-4 | Pesan PRD mencampur "Password" dan "Kata sandi" | **Diubah 16 Okt 2026 (DS v2 AuthForm/PasswordField):** semua pesan layar publik memakai "kata sandi" (isi pesan PRD tetap, hanya istilahnya). Email di Buat kata sandi kini tersamar (keputusan PM 16 Okt; FR-AK-08 perlu diperbarui) | `features/auth/copy.ts` |
| K-5 | Status akun (Diundang, Aktif, Kedaluwarsa, Ditangguhkan, Nonaktif) tidak ada di daftar baku WorkflowStatus | Kosakata di `lib/status.ts`; komponen `AccountStatus` diusulkan (Gel. 2) | `lib/status.ts`, `DS_GAPS.md` |
| K-10 | DS memuat font dari Google Fonts; deployment bisa di jaringan tertutup | Self-host `@fontsource` | `src/styles/index.css` |
| K-11 | DS README: "PERISAI belum punya logo", tetapi ada aset "Logo PERISAI" | Diganti F-17: logo PERISAI dari Figma di layar publik; Sidebar tetap teks | `features/auth/components/AuthFrame.tsx` |

## Konflik antar-PRD / PRD vs BRD (K-6..K-9, K-12..K-15)

| Kode | Konflik | Asumsi sementara | Lokasi |
|---|---|---|---|
| K-6 | FR-PA-10 / FR-HE-14a (modul belum rilis tidak tampil) vs BRD 16.2 (menu semua modul tampil sesuai role) | Ikut PRD; satu sumber `RELEASED_MODULES` | `lib/rbac.ts` |
| K-7 | Pendaratan: "Ikhtisar" (Login), "Landing page" (Aktivasi), "Ruang Kerja" (FR-PA) | Diselesaikan oleh Figma (F-23): menu "Ikhtisar" → M-01 (`/ruang-kerja`) | `features/shell/navigation.tsx` |
| K-8 | "Pengaturan akun" (UK, LO, LA) vs "Akun Saya" (Gel. 2) | `/pengaturan-akun` bertab; digabung di Gel. 2 | `features/account/` |
| K-9 | Letak menu akun: DS Sidebar (info akun) vs Akun Saya (dropdown header) | Menu akun di bawah Sidebar | `features/shell/ProtectedLayout.tsx` |
| K-12 | Matriks: R-07 tidak punya `view` M-01, padahal semua pengguna mendarat di landing (FR-LG-25) | R-07 mendarat di Pengaturan akun | `navigation.tsx` `landingPath` |
| K-13 | Nama modul panjang (BRD 7.1) vs pendek (Matriks / BRD 7.3) | Nama panjang BRD 7.1 | `lib/rbac.ts` |
| K-14 | Pesan untuk perangkat lain yang keluar karena password diubah (FR-UK-09) tidak ditetapkan | Pesan sesi berakhir (FR-LO-08) | `lib/status.ts`, `features/session/copy.ts` |
| K-15 | Pesan untuk sesi yang berakhir karena status akun / organisasi berubah (Tabel S-2) tidak ditetapkan | Pesan "diakhiri oleh administrator" (FR-LO-17) | `services/mock/index.ts` `evaluate` |

## Butir PRD yang masih TBD

| Rujukan | Isi | Asumsi sementara |
|---|---|---|
| FR-LG-08 | Kanal "Hubungi Support" | `SUPPORT_URL` placeholder (`lib/i18n/id.ts`) |
| FR-AK-16 | Penerima notifikasi "Minta undangan baru" (pengundang asli / semua admin organisasi) | Mock: semua PIC KKKS (R-04) aktif di organisasi |
| FR-LO-09 | Copy modal peringatan idle tidak ada di PRD | Copy usulan di `features/session/copy.ts` |
| FR-LP, FR-UK, FR-LO | Judul/keterangan halaman tanpa copy PRD | Ditandai `// usulan` di `copy.ts` |

## Temuan review PR-nn yang menyentuh gelombang 1 (tidak diselesaikan)

| PR | Dampak di prototype | Asumsi minimal |
|---|---|---|
| PR-01 / KD-02 | 2FA authenticator & passkey | Tidak ada menu/alur 2FA; PRD ditahan |
| PR-03 / KD-06 | Penolakan akses dicatat di Log Akses atau Jejak Audit | Mock mencatat penolakan login di log `akses` dan peristiwa akun di log `audit`; penolakan navigasi belum dicatat di klien (`RequireModule.tsx`) |
| PR-04 / KD-05 | Area vs Wilayah Kerja | Tidak ada field di gelombang 1; rencana Gel. 2 memakai "Wilayah Kerja" |
| PR-05 | Role di luar katalog ("Administrator Platform", "Auditor") | Hanya R-01..R-07 (`lib/rbac.ts`, RoleSwitcher) |
| PR-11 | "Design belum ada" tetapi ada link Figma | Keputusan Mino 14 Okt 2026: layar tanpa frame Figma mengikuti look & feel Figma yang ada. Lupa/Atur ulang kata sandi memakai bingkai OTP/Aktivasi (118:235, 66:2602) |
| PR-19 | Riwayat masuk sendiri (BR-IAM-07) belum ada PRD layar | Tidak dibangun |

## Selisih Figma vs PRD / DS (F-01..F-19)

Aturan: tampilan ikut Figma; perilaku, validasi, role, dan status ikut PRD. Selisih tidak diputuskan sendiri, dicatat di sini.
Nilai warna Figma di luar DS dikumpulkan di `src/styles/figma.css` (lihat DS_GAPS.md).

| Kode | Frame | Selisih | Yang dipakai | Perlu keputusan |
|---|---|---|---|---|
| F-01 | 85:4822 | Tautan "Lupa kata sandi?" merah #c8202f; DS: merah hanya untuk severitas/error form | Figma (`--figma-link-accent`) | Designer + pemilik DS |
| F-02 | 85:4911 | Alert login: latar merah muda, border #fecaca, judul #dc2626, radius 12px; tidak ada di Callout DS | Figma (`LoginAlert.tsx`) | Designer + pemilik DS |
| F-03 | 118:244 | "Kode berlaku 30 menit" vs PRD FR-LG-12 (10 menit) | PRD (dari `SECURITY_PARAMS`) | Designer perbarui frame |
| F-04 | 118:235 | Tidak ada tautan "Kembali ke halaman masuk"; PRD FR-LG-19 memintanya | PRD (ditambahkan di bawah form) | Designer tambah ke frame |
| F-05 | 85:4915 | Judul alert "Akun di nonaktifkan" vs PRD E-1 "Akun dinonaktifkan" | PRD | Designer perbarui frame |
| F-06 | semua | Tipografi/ukuran di luar skala DS: judul Login 32px bold, OTP 24px, state 22px, Buat Password 28px Plus Jakarta Sans; label 12px `ink`; teks error 11px (di bawah minimum DS 12px); tinggi input 39/40/48px; radius input 4/8/12px; border input #ecebe6 (kontras < 3:1) | Dipetakan ke token DS terdekat: `display`, `heading-1`, `label`, `caption`, `control-md`/`control-lg`, `radius-md`, `border-control` (kontras 3:1 wajib DS) | Designer selaraskan ke token DS |
| F-07 | 85:4840, 85:4825 | Teks bahasa Inggris (kapabilitas hero, "All rights reserved"); DS mewajibkan Bahasa Indonesia baku | Figma (disalin apa adanya) | PM / designer |
| F-08 | 85:4853 | Salah ketik "YANG LEBIH AMANA" | Ditulis "yang lebih aman" | Designer perbaiki |
| F-09 | 66:2612 | "Silahkan" (tidak baku) | "Silakan" | Designer perbaiki |
| F-10 | 66:2556 | Isi "Tautan tidak valid" berbeda dari PRD Tabel T-1 | PRD | Designer / PM |
| F-11 | 78:4289, 78:4323, 78:4328 | Ilustrasi di state aktivasi; DS: tanpa ilustrasi untuk keadaan kosong | Figma (`StatePanel` align center + media) | Pemilik DS |
| F-12 | 66:2551 | "Hubungi Support" biru #2b81f3; DS: biru hanya untuk focus-ring | Figma (`--figma-link-support`) | Designer + pemilik DS |
| F-13 | 82:4635 | Strength meter berwarna (merah untuk Lemah), sejalan PRD P-1, bertentangan DS | **K-1 tetap**: bar netral, "Lemah" `caution` (asumsi yang sudah disetujui) | PM: pilih PRD/Figma atau DS |
| F-14 | 66:2602 | Tidak ada checklist syarat; PRD FR-AK-04 mewajibkan checklist | PRD (checklist di bawah meter) | Designer tambah ke frame |
| F-15 | 66:2616 | Label "Password Baru*" (Title Case + bintang) | "Password baru" sentence case (K-3); wajib lewat `required` | Designer |
| F-16 | 85:4832 | Aksen hero #b7d334 ≈ `brand-lime` #bed630 | Token DS `brand-lime` | — |
| F-17 | 85:4797 | Logo PERISAI (gambar) di layar publik; DS README menyebut PERISAI belum punya logo, padahal aset "Logo PERISAI" ada | Logo dari Figma (menggantikan K-11) | Pemilik DS perbarui README |
| F-18 | Login | Tidak ada state pesan logout / sesi berakhir / dicabut admin / reset berhasil (FR-LO-03, -08, -17, FR-LP-14) | Callout info DS di posisi alert | Designer tambah frame |
| F-19 | 118:254, 116:163 | Teks "Kirim ulang kode" setelah hitung mundur habis dan toast "Kode baru telah dikirim." tidak ada di Figma/PRD | Copy usulan | Designer / PM |

## Selisih Figma vs PRD / DS — gelombang 2 (F-20..F-42)

| Kode | Frame | Selisih | Yang dipakai | Perlu keputusan |
|---|---|---|---|---|
| F-20 | 238:3000 | Badge status berwarna: Aktif hijau, Nonaktif merah, Kedaluwarsa amber | **Diputuskan PM 14 Okt 2026: ikuti Figma 109:16180** — berwarna tanpa ikon (lihat "Warna status" di bawah) | PM |
| F-21 | 238:3000 | Sidebar 260px font Inter; menu "Alur Kerja", "Tata Kelola", "Sistem", "Grup", "Role", "Log Akses" | Lebar `sidebar-width` 232px, IBM Plex; menu modul yang belum dirilis disembunyikan (K-6) | — |
| F-22 | 66:3144 | Logo PERISAI gambar di sidebar gelap + garis merah→lime di bawah logo + penanda lime item aktif; logo SKK Migas di kaki sidebar | Logo PERISAI + garis + penanda lime mengikuti Figma; logo SKK Migas TIDAK dipasang di latar gelap (aturan Logo DS), hanya teks hak cipta | Pemilik DS |
| F-23 | 238:3000 | Menu "Ikhtisar" | Label "Ikhtisar" untuk M-01 Ruang Kerja (selaras PRD Login Goals; menyelesaikan K-7) | PM |
| F-24 | 66:3139 | Header: pencarian global, "Tanya PERISAI", bahasa "ID", notifikasi | Tidak ditampilkan (M-02, M-20, NFR-07 belum dirilis; K-6). Header hanya menu pengguna | PM |
| F-25 | 66:3553 | Isi "Undangan Gagal Dikirim": "Terjadi kesalahan… periksa alamat email…"; tombol "Cancel" | Copy PRD Kirim Ulang ("Terjadi kendala saat mengirim undangan ke [email]…"); "Batal" | Designer |
| F-26 | 106:14074 | Panel Kedaluwarsa: "Kirim ulang undangan" + "Non Aktifkan Akun" | PRD B-1 / FR-SA-17: "Kirim ulang undangan" + "Batalkan undangan" (Nonaktifkan hanya untuk Aktif/Ditangguhkan) | Designer |
| F-27 | 257:8491 | Panel Aktif: tombol "Reset kata sandi" | Tidak dibangun: reset oleh admin di luar cakupan (PRD Lupa Kata Sandi, Out of Scope) | PM |
| F-28 | 106:14009 | Tab panel "Profil / Akses / Aktivitas"; tautan "Ubah" pada Nama, Email, Jabatan | Hanya isi Profil + Riwayat akun. Akses (Hak Akses Efektif) dan Aktivitas (Log Akses) = gelombang 3; ubah data pengguna oleh admin = PRD Ubah Data & Role Pengguna yang belum ditarik (PR-07). "Ubah" hanya untuk Masa berlaku | PM |
| F-29 | 257:9443 | Deskripsi Nonaktifkan tidak menyebut pencabutan permanen (FR-SA-18 meminta peringatan; FR-SA-18 sendiri bertentangan dengan FR-SA-20) | Copy Figma | PM |
| F-30 | 269:11432, 265:11349, 51:828 | Salah ketik: "diaktifasikan", "PERSIAI", "Administartor", "Admintrator" | Diperbaiki | Designer |
| F-31 | 341:6300 | Akun Saya: Jabatan read-only, Email read-only ("Hubungi admin…"), Nama 3–100 karakter, tombol Simpan sebaris | PRD FR-AS-003/009: Jabatan bisa diubah, Email lewat permintaan (tombol "Ubah"), Nama 3–150; Simpan + Batal di bawah kartu (FR-AS-006) | Designer (PRD menyebut frame tambahan) |
| F-32 | — | Tooltip Role PRD: "Kamu tidak dapat mengubah role akunmu sendiri." | Sapaan "Anda" (DS) | PM |
| F-33 | 341:7112 | Dialog Ubah kata sandi: syarat "Minimal 12 karakter", "Angka dan simbol" | Syarat PRD (8 karakter, besar, kecil, angka; FR-UK-05 = aktivasi) | PM |
| F-34 | 341:6507 | Sesi aktif menampilkan IP lengkap | Tidak ditampilkan (FR-LO-13) | Designer |
| F-35 | 341:6507 | "Keluar dari semua perangkat lain" | "Keluar dari semua perangkat" termasuk perangkat ini (FR-LO-05) | Designer / PM |
| F-36 | 341:6507 | Tab "Keamanan masuk" berisi kartu "Metode verifikasi masuk" (autentikator, passkey) | Nama tab Figma dipakai (Akun Saya PRD: "Keamanan Akun"). **Diperbarui 14 Okt 2026 atas permintaan PM:** kartu metode verifikasi ditampilkan sesuai Figma; Kode email aktif (OTP login), tombol Atur autentikator dan Tambah passkey **nonaktif** dengan keterangan "belum tersedia" sampai PRD Verifikasi Dua Langkah (KD-02); banner "Login cadangan terakhir" tidak ditampilkan; batas passkey 5 dari judul frame Figma | PM |
| F-37 | 106:14009 | Tombol "Batalkan undangan" / "Non Aktifkan Akun" berbingkai merah di panel | Tombol sekunder netral; merah hanya di tombol konfirmasi dialog (aturan Button DS) | Designer |
| F-38 | 238:3000 | Keterangan badge "Meminta undangan baru", "Belum pernah aktivasi akun" | PRD: "Minta undangan baru" + tanggal (FR-KU-19a); "Undangan dibatalkan" (Tabel B-2) | Designer |
| F-39 | 66:3502 | Modal undang PIC KKKS menampilkan "Masa berlaku akses"; helper email lebih pendek | PRD Tabel F-1: hanya R-03; helper FR-UP-04 lengkap | Designer |
| F-40 | 221:2272 | Tombol konfirmasi "Batalkan"; label alasan tanpa tanda wajib | PRD: "Batalkan undangan"; alasan wajib (tombol nonaktif sampai dipilih) | Designer |
| F-41 | — | Organisasi nonaktif: PRD minta aksi dinonaktifkan + tooltip | Aksi disembunyikan, diganti keterangan "Organisasi nonaktif. Aktifkan kembali organisasinya lebih dulu." (PU-04: sembunyikan, bukan nonaktifkan) | PM |
| F-42 | 109:14140 | InfoBlock kirim ulang berisi contoh "Status Aktif" | Status sebenarnya (Diundang/Kedaluwarsa) | — |

## Asumsi gelombang 2

| Rujukan | Isi | Asumsi sementara |
|---|---|---|
| FR-UP-13 / AB-20 | Daftar kombinasi role terlarang ada di Role & Permission Matrix (belum dibagikan) | R-05 + R-06 (`lib/user-rules.ts`) |
| FR-UP-05 | Copy masa berlaku undangan | "Undangan berlaku 7 hari" (Figma) |
| FR-KU-15 / Tabel K-3 | Routing admin penerima permintaan undangan baru | Mock: PIC KKKS aktif di organisasi (sama dengan FR-AK-16) |
| FR-KU-21 | Copy batas kirim ulang | Figma 253:6888 |
| FR-AS-009 | Persetujuan ubah email (PRD Ubah Data & Role Pengguna belum ditarik, PR-07, PR-19) | Disimulasikan lewat Alat uji ("Setujui/Tolak permintaan email saya") |
| FR-SA-20b | Reaktivasi setelah > 90 hari wajib atur ulang kata sandi | Belum dibangun |
| FR-UP-14 / FR-SA-23a | Durasi "10 tahun 3 bulan" | Dihitung per bulan kalender (`durasiSampai`) |
| R-07 | Matriks memberi R-07 `edit` data/role pengguna, tetapi PRD status/undangan hanya menyebut R-03/R-04 | **Diperbarui 14 Okt 2026** (PRD Ubah Data & Role D-7, disetujui PM): R-07 mengundang serta mengubah data & role pengguna lain; aksi status akun tetap hanya R-03/R-04 |
| Pendaratan R-07 | R-07 tidak punya M-01 | Mendarat di Pengguna (M-15) (memperbarui K-12) |

## Asumsi gelombang 3

| Rujukan | Isi | Asumsi sementara |
|---|---|---|
| PR-03 / FR-PA-11 | Penolakan akses dicatat di Log Akses atau Jejak Audit? Kedua PRD memuatnya | **Diputuskan PM (14 Okt 2026):** Jejak Audit saja; kelompok "Penolakan akses" dihapus dari filter Log Akses. Penolakan saat login (organisasi nonaktif, IP tidak terdaftar) tetap tercatat di Log Akses sebagai "Login gagal" (kelompok Masuk), disetujui PM 14 Okt 2026 |
| PR-13 / FR-LA-06 | Matriks memberi R-07 "view (log teknis)" di M-22; PRD Log Akses & Jejak Audit tidak menyebut R-07 | **Diputuskan PM (14 Okt 2026):** R-07 tidak melihat menu/halaman Log Akses & Jejak Audit; log teknis milik M-19/M-23 |
| PR-13 / Tabel C-1 | R-07 tidak ada di Tabel C-1 | Cakupan R-07 ditampilkan "Konfigurasi teknis" |
| PR-06 / FR-JA-23 | Retensi total tertulis "5X" | **Diputuskan PM (14 Okt 2026):** 5 tahun (sama dengan FR-LA-18 dan BRD) |
| FR-JA-20 | Ekspor besar di latar belakang butuh notifikasi (M-20) | Belum dibangun; ekspor langsung di klien |
| FR-HE-17, FR-CD-07/08 | Ubah role/cakupan ada di PRD Ubah Data & Role Pengguna (belum ditarik, PR-07) | Perbandingan sebelum/sesudah belum dibangun; perubahan role disimulasikan lewat Alat uji |
| KD-03 / FR-HE-11..13 | Fitur Grup belum diputuskan | Slot `groupRoles` ada di `effectiveAccess`, selalu kosong |
| FR-PA-19 | "Landing Page" vs Design Reference "Ruang Kerja" | **Diputuskan PM (14 Okt 2026):** Ruang Kerja (`/ruang-kerja`). R-07 (tanpa M-01) diarahkan ke pendaratannya, disetujui PM 14 Okt 2026 |
| FR-LA-15a | "20 peristiwa terakhir atau 30 hari" | 30 hari atau 20 peristiwa terakhir, mana yang lebih banyak; tampil di Akun Saya · Keamanan masuk (pengganti "Pengaturan akun", K-8) |
| FR-LA-11 / FR-JA-17 | Isi tab Aktivitas di panel pengguna tidak digambar (Figma 106:14009 hanya label tab) | 10 peristiwa Log Akses 30 hari terakhir + tautan ke Log Akses dan Jejak Audit; tab hanya untuk R-02/R-03/R-04 |
| FR-CD-04b | Copy pemilih cakupan R-02 | "Cakupan Pengawas": "Seluruh KKKS" (default) / "Beberapa KKKS tertentu" (usulan) |
| PR-11 | Log Akses / Jejak Audit tanpa Figma | Pola Manajemen Pengguna: kartu filter, tabel, panel kanan 480px |

## PRD Ubah Data & Role Pengguna (ClickUp z8pmx9n8ny) dan Akun Saya (ClickUp z8pmx9nb7u)

Keputusan PM 14 Okt 2026:

| Rujukan | Isi | Keputusan |
|---|---|---|
| FR-UDR-11 vs PR-03 | PRD minta percobaan ubah role sendiri dicatat di Log Akses | Ikuti PR-03: dicatat di Jejak Audit |
| Tabel E-UDR | Pesan memakai "kamu/akunmu"; DS mewajibkan "Anda" | Teks PRD ditulis ulang dengan sapaan "Anda" (seperti F-32) |
| D-7 | R-07 boleh mengubah pengguna lain (menggantikan asumsi gelombang 2) | Ikuti PRD; status akun tetap R-03/R-04 |
| "Halaman edit" | Dialog atau halaman | Halaman penuh `/pengguna/:id/ubah` |
| Tata letak halaman ubah | Tidak ada frame Figma untuk ubah pengguna | Ikuti Figma 341:6300 (Akun Saya — Profil): satu kartu, judul + status, Nama/Email · Jabatan/Organisasi, lalu Role dan cakupan akses. Perilaku tetap PRD: nama 3–150 (Figma 3–100, F-31), jabatan bisa diubah, Masa berlaku hanya ditampilkan (diubah dari panel, FR-SA-22) |

Asumsi (baris FR-UDR-07, FR-UDR-03, FR-UDR-05, FR-AS-011 / FR-UDR-16, dan halaman tautan email FR-UDR-05/-13/-14 disetujui PM 14 Okt 2026; sisanya belum diputuskan):

| Rujukan | Isi | Asumsi sementara |
|---|---|---|
| FR-UDR-07 | Katalog Role belum ditarik | **Disetujui PM (14 Okt 2026):** Pilihan role R-01..R-07 sesuai jenis organisasi (BRD 6.2); R-04 hanya R-04/R-05/R-06 (FR-UDR-08) |
| FR-UDR-08 | Pengguna punya role di luar kewenangan pengubah | Role lama boleh tetap, tetapi tidak bisa ditambahkan oleh pengubah itu |
| FR-UDR-03 | Akun Nonaktif / organisasi nonaktif | **Disetujui PM (14 Okt 2026):** Tidak bisa diubah (selaras FR-SA-24b); tombol "Ubah data" tidak tampil |
| FR-UDR-05 | Email akun yang belum aktif (Diundang/Kedaluwarsa) | **Disetujui PM (14 Okt 2026):** Tidak bisa diubah di halaman ini; batalkan undangan lalu undang ulang |
| FR-UDR-11 | Admin membuka halaman ubah dirinya sendiri | Nama/jabatan bisa diubah; role read-only; email lewat Akun Saya |
| FR-AS-011 / FR-UDR-16 | "Sesi saat ini tetap aktif" saat permintaan disetujui oleh orang lain | **Disetujui PM (14 Okt 2026):** Sesi pengguna yang paling baru aktif dipertahankan |
| FR-UDR-05, -13, -14 | Halaman tautan email | **Disetujui PM (14 Okt 2026):** Meminta klik konfirmasi dulu agar pemindai tautan email tidak menjalankan aksi; copy usulan |
| FR-UDR-05, -13 | Pesan di halaman Login setelah sesi dicabut karena email berganti / "Bukan saya" | Pesan sesi berakhir umum (K-14) untuk keduanya |
| FR-UDR-15 | Menu "User administration" | Item "Permintaan ubah email" di seksi Administrasi (R-03, R-04) dengan badge; Kotak Persetujuan M-01 belum dibangun |
| FR-UDR-12 | Copy batas 10 permintaan kode per jam | "Permintaan kode sudah mencapai batas 10 kali per jam. Coba lagi nanti." (usulan) |
| ROLE_NOT_ALLOWED | Tidak ada di Tabel E-UDR | Alert Tabel P-1 "Anda tidak berwenang melakukan aksi ini…" |

Akun Saya (ClickUp z8pmx9nb7u) selaras dengan PRD Ubah Data & Role revisi 13 Okt 2026. Selisih dengan build gelombang 2
yang sudah diperbaiki: penyetuju PIC yang juga Pejabat Berwenang (EC-UDR-04), alasan penolakan tampil sampai ditutup,
satu permintaan aktif termasuk saat Menunggu Verifikasi, batas 10 kode per jam, tautan "Bukan saya", pesan Tabel E-UDR.
FR-AS-008 (Passkey) tetap ditahan (KD-02). Figma 341:6299 belum memuat frame tambahan yang diminta Design Reference
(Jabatan editable, tombol Ubah Email, dialog email baru + kode, status permintaan, tooltip Role).

## PRD User administration, Kelola Organisasi KKKS, Role (keputusan PM 14 Okt 2026)

| No | Isi | Keputusan |
|---|---|---|
| 1 | Pembatasan IP organisasi (FR-ORG-31..39) | Tidak dibangun (Q-9 PRD: bukan Core Platform) |
| 2 | Rute Organisasi | `/organisasi` (bukan `/admin/organisasi`) |
| 3 | Menu Organisasi vs Matriks M-03 (view R-01/02/05/06) | Hanya R-03, R-07, R-04 (organisasinya, mode baca) |
| 4 | FR-ORG-23 minta Log Akses | Penolakan di Jejak Audit (PR-03) |
| 5 | Badge Aktif hijau (Design Brief) | Ikuti DS: netral; "Tanpa PIC" caution |
| 6 | Figma 109:16236 tautan Ubah inline | Membuka halaman `/pengguna/:id/ubah` |
| 7 | Profil Pengguna minta 403 untuk organisasi lain | 404 (FR-PA-15) |
| 8 | Nama role di Figma ("R-07 Manajer Keamanan") | BRD 6.2 |
| 9 | Siapa boleh ekspor (Matriks M-15 tanpa aksi export) | R-03 dan R-04; XLSX lewat `write-excel-file` (perlu konfirmasi Tech Lead) |
| 10 | Katalog Role Out of Scope vs FR-KR-09/09d | Ikuti FR: buat dan hapus role lewat antarmuka |
| 11 | FR-AR-08 vs FR-AR-04a/04b, "Lewati" | Pilih "Pindahkan ke role lain" (role tujuan + perbedaan hak akses) atau "Lewati" (pengguna tetap memegang role); pindah massal dari role Tidak Aktif (FR-AR-13) |

Selisih Figma Profil Pengguna (109:16236/16307/16444) vs PRD/DS:

| ID | Figma | Dibangun | Alasan |
|---|---|---|---|
| F-43 | Email bergembok | Email punya tautan Ubah bila admin boleh mengubahnya | PRD Ubah Data & Role revisi 13 Okt (FR-UDR-05) |
| F-44 | Tombol "Keluar" merah | Teks tebal bergaris bawah warna ink | DS: merah hanya untuk severitas / error form |
| F-45 | Kode izin `users.view` | `M-15.view` (kode modul + aksi Tabel X-1); deskripsi aksi usulan | PRD tidak memuat daftar kode izin |
| F-46 | Kolom "Permission" | "Izin" | Bahasa UI baku (DS) |
| F-47 | Badge "Aktif" hijau | Hijau (`success`), diputuskan PM 14 Okt 2026 | PM |
| F-48 | Riwayat perubahan hanya di Aktivitas | Sama; Riwayat akun di Profil berisi Diundang/Diaktifkan/Login terakhir | Figma |

Asumsi Tahap C (Katalog Role, Aktif & Nonaktif Role):

| Rujukan | Isi | Asumsi sementara |
|---|---|---|
| FR-KR-09b | Batas hak akses per jenis organisasi tidak dirinci | **Disetujui PM (14 Okt 2026):** Gabungan hak akses role sistem berjenis sama pada Matriks awal |
| FR-KR-09 | Kode role buatan | R-08, R-09, … (berurutan) |
| Tabel R-1 | Siapa boleh mengundang role buatan | **Disetujui PM (14 Okt 2026):** R-03 & R-07 sesuai jenis organisasi; R-04 untuk role buatan KKKS |
| Tabel R-2 | "Area tertentu" | Ditulis "Wilayah kerja tertentu" (FR-CD-09a) |
| FR-KR-08 | Batas panjang nama/deskripsi role | **Disetujui PM (14 Okt 2026):** Nama 3–60, deskripsi ≤ 300 karakter (usulan) |
| FR-KR-09c | Mengubah hak akses role sistem menghapus kualifikasi sel ("organisasi sendiri") | **Disetujui PM (14 Okt 2026):** Kualifikasi dipertahankan untuk aksi yang tetap dicentang |
| FR-KR-05 | Pasangan role terlarang sebagai data | Tetap daftar di `lib/user-rules.ts`; belum ada UI |
| NFR katalog | Cache ≤ 1 menit | Klien memuat katalog saat masuk, staleTime 60 detik |
| Tech Lead | `RoleId` | Diubah dari union R-01..R-07 menjadi kode terbuka; daftar role dari katalog |

Asumsi Tahap B (Kelola Organisasi KKKS):

| Rujukan | Isi | Asumsi sementara |
|---|---|---|
| FR-ORG-01 | Modul untuk penggerbangan | **Disetujui PM (14 Okt 2026):** M-15 (PRD di bawah User Management); BRD menaruh identitas KKKS di M-03 yang belum dirilis |
| Tabel O-1 | Kode organisasi seed SKK Migas / Kontraktor | `SKKMIGAS`, `KONTRAKTOR`; KKKS `KKKS-nnn` (Q-2) |
| FR-ORG-42 | Memilih KKKS operator bersama | **Disetujui PM (14 Okt 2026):** Belum bisa dipilih di layar; data contoh WK-ADL-02 dioperasikan bersama |
| FR-ORG-41 | WK hanya Administrator Bisnis | **Disetujui PM (14 Okt 2026):** R-07 tidak mengelola WK |
| FR-ORG-02 | Kolom ikon gembok pembatasan IP | Tidak tampil (IP tidak dibangun) |
| FR-ORG-15, EC-ORG-03 | Pesan saat sesi berakhir karena organisasi nonaktif | Jenis pengakhiran baru `org_inactive` dengan teks Tabel E-ORG (menggantikan K-15 untuk kasus ini) |
| Blok dampak modal Nonaktifkan | Design Brief: latar merah muda | Warna caution (DS: merah hanya severitas/error) |
| EC-ORG-07 | Domain IDN | **Disetujui PM (14 Okt 2026):** Tidak didukung; hanya ASCII |

Asumsi Tahap A:

| Rujukan | Isi | Asumsi sementara |
|---|---|---|
| Profil Pengguna | Kolom ID kosong | **Disetujui PM (14 Okt 2026):** Nomor sementara PP-1..PP-9 |
| PP-8 | Reset kata sandi untuk status apa | **Disetujui PM (14 Okt 2026):** Hanya akun Aktif; memakai alur Lupa Kata Sandi (tautan 1 jam) |
| PP-4 | Alasan saat mengakhiri satu sesi | **Disetujui PM (14 Okt 2026):** Wajib, pakai Tabel S-3 (sama dengan cabut semua sesi) |
| FR-DP-05 | Contoh format "27/9/2026, 17.31.41 GMT+7" | **Disetujui PM (14 Okt 2026):** Format DS "14 Okt 2026, 17:31 WIB" |
| Ekspor | "Expired", "Jabatan / Role" | **Disetujui PM (14 Okt 2026):** Status baku "Kedaluwarsa"; kolom Jabatan dan Role dipisah |
| Daftar Pengguna | Ukuran halaman | 25 baris (contoh US-ED-04) |

## Lain-lain

- Versi BRD: link BRD berisi **v0.5** (13 Okt 2026), dan PRD sudah diselaraskan ke v0.5. Prototype memakai v0.5.
- Figma: file `qeqeJ9KGVpCFxLM6vTAK0a` dibaca lewat connector Figma akun Qhesa chairunnisa (14 Okt 2026); connector
  `designer.h` masih ditolak.
- FR-LG-14 (batas kirim ulang OTP) tidak punya copy di PRD: alert usulan "Batas kirim ulang tercapai". Di aktivasi, batas
  kirim ulang diperlakukan sama dengan batas salah input (kembali ke Buat password, FR-AK-12).
- Kuota "Minta undangan baru": BRD AB-14 (1x/24 jam) = FR-AK-17 (1x/24 jam per token). Kirim Ulang Tabel K-5 (3x/24 jam)
  ditangani di Gel. 2.

## Warna status (diputuskan PM 14 Okt 2026)

Badge status mengikuti Figma 109:16180 "Note for Engineer › User Status"; menggantikan keputusan badge netral (F-20, F-47,
keputusan #5 Organisasi). Variabel di `src/styles/status.css`, nada di `AccountStatusBadge`.

| Status | Nada | Catatan |
|---|---|---|
| Akun Aktif, Organisasi Aktif, Role Aktif, Email diizinkan Aktif | `success` (hijau) | |
| Akun Diundang, Ditangguhkan | `strong` (abu tua) | |
| Akun Kedaluwarsa, Email diizinkan Kedaluwarsa, Tanpa PIC | `warning` (kuning) | |
| Akun Nonaktif | `danger` (merah) | |
| Organisasi Nonaktif, Role Tidak Aktif, Pribadi | `muted` (abu) | ASSUMPTION: entitas nonaktif tetap abu (Design Brief B1, FR-AR-19); Figma hanya mengatur status akun |

- ASSUMPTION (aksesibilitas DS ≥ 4,5:1): teks hijau #298954 → #1e6b41 dan kuning #d48e00 → #8f5f00; latar/border tetap
  nilai Figma. Ukuran teks 12px (minimum DS), Figma 11px. Ikon status dihapus mengikuti Figma.
- ASSUMPTION: varian tema `ruang-kendali` (gelap) diusulkan sendiri karena Figma hanya tema terang.

## Keamanan masuk mengikuti Figma 341:6507 (14 Okt 2026)

- Sesi aktif diubah dari tabel menjadi daftar perangkat sesuai Figma (ikon, perangkat, lokasi, aktivitas terakhir, badge
  "Perangkat ini" hijau). Tetap tanpa IP (F-34) dan tombol "Keluar dari semua perangkat" (F-35). ASSUMPTION: aksi
  "Keluarkan perangkat" per baris (FR-LO-12, tidak ada di Figma) memakai gaya tautan seperti aksi baris passkey.
- Riwayat masuk (FR-LA-15, tidak ada di Figma) tetap di bawah Sesi aktif.
- Perbaikan tab: garis bawah tab aktif sebelumnya tidak tampil (bentrok kelas `border-transparent`/`border-action`).
- Hasil log (Log Akses, Jejak Audit, Riwayat masuk): Berhasil `success` (hijau), Gagal/Ditolak `danger` (merah) — arahan PM
  14 Okt 2026. Judul kartu tabel log memakai nama tabel ("Daftar log akses", dst.) tanpa jumlah entri; jumlah hasil (FR-LA-07)
  tampil di ringkasan paginasi ("1–25 dari 132").
- ASSUMPTION (masukan PM 14 Okt 2026): paginasi punya pilihan "Baris per halaman" 10/25/50/100, bawaan 25 untuk semua
  tabel (Log Akses dan Jejak Audit sebelumnya 20). PRD tidak menetapkan ukuran halaman. Pilihan disimpan di URL (`baris`).
- Judul tabel Pengguna ("Manajemen pengguna") dan Organisasi juga tanpa jumlah (arahan PM 14 Okt 2026; Figma 66:3139 memakai
  "Manajemen pengguna · n"). Total tampil di ringkasan paginasi.

## Buat role sebagai halaman penuh (diputuskan PM 15 Okt 2026)

- Buat role (FR-KR-09) pindah dari dialog ke halaman `/role/baru` karena isiannya berat: tombol kembali di kiri, lalu satu
  kolom berisi jejak lokasi "Role › Buat role", judul, dan ringkasan (rata kiri sama, masukan PM 15 Okt 2026); dua kartu
  (Informasi role, Hak akses tanpa batas tinggi); tombol Batal / Buat role di bawah.
- ASSUMPTION: meninggalkan halaman dengan isian belum disimpan meminta konfirmasi (pola FR-UDR-10; PRD Katalog Role tidak
  mengatur). Setelah berhasil, pengguna diarahkan ke panel role baru (`/role/:kode`) dengan toast "Role R-xx dibuat."
- Ubah hak akses (FR-KR-09c) tetap dialog; dapat dipindah ke halaman dengan pola yang sama bila diminta.
- Pemilih hak akses (Buat role, Ubah hak akses) berbentuk matriks modul × aksi (masukan PM 15 Okt 2026): kolom tetap =
  semua aksi yang dipakai minimal satu jenis organisasi; kotak centang hanya pada aksi yang diizinkan untuk jenis organisasi
  terpilih, sel lain bertanda titik "Tidak tersedia" (FR-KR-09b tetap berlaku). Modul tanpa aksi yang diizinkan tidak tampil.

## Detail pengguna dan organisasi sebagai halaman penuh (diputuskan PM 15 Okt 2026)

- `/pengguna/:id` dan `/organisasi/:kode` kini halaman penuh (pola halaman turunan DS), bukan panel samping 480px
  (Figma 106:14009 / 109:16236 memakai panel). Tombol kembali dan jejak lokasi ("Pengguna › {nama}",
  "Organisasi › {nama}") kembali ke daftar dengan filter yang sama (query string dibawa lewat state navigasi).
- Badge status di samping judul; aksi (Reset kata sandi + menu ···, Kirim ulang/Batalkan undangan, Aktifkan kembali,
  Nonaktifkan organisasi) di kanan PageHeader; catatan status (undangan kedaluwarsa, organisasi nonaktif) di atas kartu
  bertab.
- Toast "Organisasi ditambahkan." → aksi "Undang PIC KKKS" membuka halaman detail organisasi baru lalu dialog Undang
  (FR-ORG-08).
- Detail role (`/role/:kode`) juga halaman penuh: kartu "Informasi role" dan "Hak akses"; jejak lokasi "Role › {nama}".
- Gaya tombol di ketiga halaman detail (masukan PM 15 Okt 2026, aturan DS Button): satu aksi utama primer berikon sesuai
  status, aksi pendamping sekunder berikon, sisanya di menu "Aksi lainnya" (···).
  - Pengguna Aktif: Reset kata sandi, ···(Tangguhkan, Nonaktifkan, Akhiri semua sesi).
  - Pengguna Diundang/Kedaluwarsa: **Kirim ulang undangan** (primer), Batalkan undangan.
  - Pengguna Ditangguhkan/Nonaktif: **Aktifkan kembali** (primer), ···.
  - Organisasi: Nonaktifkan organisasi (sekunder; destructive hanya di ConfirmDialog); bila nonaktif **Aktifkan kembali** (primer).
  - Role Aktif: **Ubah hak akses** (primer), ···(Ubah nama dan deskripsi, Nonaktifkan, Hapus); Tidak aktif: **Aktifkan kembali** (primer).
  - Tombol "Ubah data" di header sempat ditambahkan lalu dihapus (masukan PM 15 Okt 2026): pengubahan cukup lewat tautan
    "Ubah" per field.
- Detail role diubah langsung di halaman (masukan PM 15 Okt 2026), menggantikan dialog "Ubah nama dan deskripsi" dan
  "Ubah hak akses":
  - Kartu "Informasi role": nama dan deskripsi berupa isian; jenis organisasi, cakupan, status, jumlah pengguna baca saja.
  - Kartu "Hak akses": matriks centang modul × aksi yang sama dengan Buat role, menggantikan tabel baca saja.
  - Tombol Batal + Simpan muncul hanya bila ada perubahan ("Ada perubahan yang belum disimpan."); Simpan hak akses tetap
    meminta konfirmasi jumlah pengguna terdampak (FR-KR-09f). Meninggalkan halaman dengan perubahan → "Tinggalkan halaman?".
  - Header: "Aktifkan kembali" (primer) bila Tidak aktif; menu "Aksi lainnya" berisi Nonaktifkan, Pindahkan pengguna,
    Hapus (menu tidak tampil bila kosong, mis. R-03).

## Nama role dan "admin organisasi" (BRD/PRD 15 Okt 2026)

- Label role (peta tunggal `ROLES` di `lib/rbac.ts`, dibaca lewat `roleName`): R-01 Pimpinan SKK, R-02 Pengawas SKK,
  R-03 Admin SKK, R-04 Admin KKKS, R-05 Pelapor KKKS, R-06 Pejabat Berwenang KKKS, R-07 Admin Teknis. Slot label EN
  `ROLE_LABELS_EN` disiapkan (TODO NFR-07). Mock DB v8 → v9 hanya mengganti nama role sistem yang tersimpan.
- Copy untuk pengguna akhir memakai "admin organisasi (Anda)", bukan "administrator" atau nama role.
- Diputuskan PM: header kolom ditulis sentence case "Admin KKKS" (bukan "ADMIN KKKS"); filter status organisasi hanya
  diganti nama (opsi baru Belum ada admin/Pribadi/Kedaluwarsa/Pengecualian IP tidak ditambah); ringkasan Profil tetap
  "Sesi aktif" (Grup ditahan KD-03); error domain saat ubah email juga "Hubungi Admin SKK."; "Cakupan Pengawas SKK".
- Belum disesuaikan (di luar cakupan wording): Admin SKK hanya dapat mengundang R-04 ke organisasi KKKS
  (`lib/user-rules.ts`); email "Role Admin SKK diberikan" masih dikirim (`services/mock/edit.ts`).
