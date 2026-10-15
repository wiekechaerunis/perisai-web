# Traceability — PERISAI Core Platform (M-15, M-22)

Sumber: PRD Core Platform (Claude Docs `42618d70-…`), BRD v0.5, PERISAI Design System.
Status: **Dibangun** · **Sebagian** · **Mock** (aturan ditegakkan di adapter mock; backend wajib menegakkan ulang) ·
**Backend** (tidak punya UI) · **Gel. 2 / Gel. 3** (direncanakan) · **Ditahan**.

Kolom Figma: `—` = PRD tidak memberi link (desain dari DS + look & feel Figma, PR-11); node id = frame Figma yang diikuti
(file `qeqeJ9KGVpCFxLM6vTAK0a`, dibaca 14 Okt 2026). Selisih Figma vs PRD/DS: ASSUMPTIONS.md F-01..F-19.

## Gelombang 1 — Fondasi

| Item | File/komponen | Status |
|---|---|---|
| Token DS → CSS | `scripts/build-tokens.ts`, `design-system/tokens.json`, `src/styles/tokens.css` (generated), `tailwind.config.ts` | Dibangun |
| AppShell + Sidebar role-aware | `components/layout/AppShell.tsx`, `Sidebar.tsx`, `features/shell/ProtectedLayout.tsx`, `navigation.tsx` | Dibangun |
| RoleSwitcher (dev) | `components/layout/RoleSwitcher.tsx`, `features/dev/DevTools.tsx` | Dibangun |
| RBAC (BRD 6.2, Matriks FR-MX) | `lib/rbac.ts` | Dibangun (data matriks lengkap 25 modul) |
| Status | `lib/status.ts` | Dibangun |
| Format data | `lib/format.ts` | Dibangun |
| Service interface + mock + api | `services/types.ts`, `services/mock/*`, `services/api/index.ts`, `services/index.ts` | Dibangun (kontrak API = usulan) |

## Gelombang 1 — Alur autentikasi

### Login PERISAI · Tab `7b7a3b46-65b2` · ClickUp `z8pmx9n50h` · Figma `85-4791`

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-LG-01, 02, 03, 04, 05 | `features/auth/pages/LoginPage.tsx`, `components/LoginAlert.tsx`, `AuthFrame.tsx` (LoginFrame), `LoginHero.tsx` | 85:4794, 85:4880, 85:4906 | Dibangun |
| FR-LG-06, 07 | `services/mock` `auth.login` | — | Mock |
| FR-LG-08 | `LoginAlert.tsx` tautan "Hubungi Support" → `SUPPORT_URL` (placeholder, TBD) | 85:4916 | Sebagian |
| FR-LG-09, 10, 10a, 10b | `services/mock`; alert Tabel E-1 di `LoginPage.tsx` / `LoginOtpPage.tsx` | 85:4906 | Dibangun (UI) · Mock (aturan) |
| FR-LG-11..20 | `features/auth/pages/LoginOtpPage.tsx`, `components/OtpForm.tsx`, `preauth.ts` | 118:235 | Dibangun |
| FR-LG-21 | Email OTP (template backend); isi tiruan di Kotak masuk mock | 116:55 | Backend |
| FR-LG-22, 23 | `services/mock` lockout; alert "Login dibatasi sementara" | — | Mock |
| FR-LG-24 | Rate limit per IP | — | Backend |
| FR-LG-25 | `features/shell/navigation.tsx` `landingPath`, `features/workspace/RuangKerjaPage.tsx` | 85:4973 (catatan engineer) | Dibangun (placeholder M-01) |
| FR-LG-26 | `navigation.tsx` `buildNav`, `features/shell/RequireModule.tsx` | — | Dibangun |
| FR-LG-27 | `services/mock` `lastLogin`; tampil di Ruang kerja dan kolom "Login terakhir" Manajemen Pengguna | — | Dibangun |
| FR-LG-28 | `SessionProvider.tsx` `rememberReturnTo`, `navigation.tsx` `allowedReturnPath` | — | Dibangun |
| FR-LG-29 | `services/mock` log akses; tampil di `/log-akses` | — | Dibangun |

### Lupa Kata Sandi · Tab `f014a7ff-c6e8` · ClickUp `z8pmx9n8p6` · "Design belum ada" → look & feel Figma 118:235 / 66:2602 (PR-11)

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-LP-01, 02, 04, 06 | `features/auth/pages/LupaKataSandiPage.tsx` | — | Dibangun |
| FR-LP-03, 05 | `services/mock` `password.requestReset` | — | Mock |
| FR-LP-07, 08 | Email reset (template backend) | — | Backend |
| FR-LP-09 | `services/mock` (60 menit, single-use, supersede) | — | Mock |
| FR-LP-10..14 | `features/auth/pages/AturUlangKataSandiPage.tsx`, `features/auth/components/NewPasswordFields.tsx` | — | Dibangun |
| FR-LP-15 | Email pemberitahuan (backend; tiruan di Kotak masuk mock) | — | Backend |
| FR-LP-16, 17 | `services/mock` log audit | — | Mock |

### Ubah Kata Sandi · Tab `3e073786-4ce5` · ClickUp `z8pmx9n8p7` · "Design belum ada"

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-UK-01 | `features/account/AkunSayaPages.tsx` (tab Keamanan masuk → Ubah kata sandi) | 341:6507 | Dibangun |
| FR-UK-02, 03 | `services/mock` `requireSession`; `useSessionGuard` | — | Mock / Dibangun |
| FR-UK-04..08 | `features/account/UbahKataSandiDialog.tsx` | — | Dibangun |
| FR-UK-09, 10 | `services/mock` `password.changePassword` | — | Mock |
| FR-UK-11 | `UbahKataSandiDialog.tsx` (Toast) | 341:7112 | Dibangun |
| FR-UK-12 | Email pemberitahuan | — | Backend |
| FR-UK-13, 14 | `services/mock` log audit | — | Mock |

### Logout & Sesi · Tab `a61955db-ba08` · ClickUp `z8pmx9n8p8` · "Design belum ada"

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-LO-01, 02, 03, 04 | `ProtectedLayout.tsx` (Keluar), `LoginPage.tsx` (pesan), `services/mock` `auth.logout` | — | Dibangun |
| FR-LO-05 | `features/account/SesiAktifSection.tsx` | — | Dibangun |
| FR-LO-06, 07 | `services/mock` `evaluate` | — | Mock |
| FR-LO-08 | `features/session/copy.ts`, `LoginPage.tsx` | — | Dibangun |
| FR-LO-09, 09a, 09b, 09c | `features/session/IdleWarning.tsx`, `SessionProvider.tsx`, `services/activity.ts` | — | Dibangun |
| FR-LO-10 | `SessionProvider.tsx` `rememberReturnTo`, `navigation.tsx` `allowedReturnPath` | — | Dibangun |
| FR-LO-11, 12, 13 | `features/account/SesiAktifSection.tsx` | — | Dibangun |
| FR-LO-14, 15, 16, 16a | Lihat Gelombang 2 (panel detail pengguna) | 257:8562 | Dibangun |
| FR-LO-17 | `features/session/copy.ts` | — | Dibangun |
| FR-LO-18 | `services/mock` (status/organisasi/password → sesi berakhir) | — | Mock |
| FR-LO-19 | `SessionProvider.tsx` (data sesi disegarkan tiap 15 detik) | — | Sebagian |
| FR-LO-20, 21 | `services/mock` log akses; tampil di `/log-akses` (kelompok Keluar) | — | Dibangun |

### Aktivasi Akun · Tab `e34d9005-d913` · ClickUp `z8pmx9n51n` · Figma 66-2602, 66-2546, 66-2569, 66-2582, 82-4627, 116-144, 110-17266

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-AK-01, 02 | `features/auth/pages/AktivasiPage.tsx` (TokenState), `components/Illustration.tsx`, `AuthFrame.tsx` (SupportLink) | 66:2546, 66:2569, 66:2582 | Dibangun |
| FR-AK-03..08 | `AktivasiPage.tsx`, `NewPasswordFields.tsx`, `lib/password.ts` | 66:2602, 82:4627 | Dibangun |
| FR-AK-09, 09a, 15 | `AktivasiPage.tsx` → `services/mock` `setPendingPassword` | 66:2602 | Dibangun · Mock |
| FR-AK-10, 11, 12, 14 | `features/auth/pages/AktivasiOtpPage.tsx`, `components/OtpForm.tsx` | 116:144 | Dibangun |
| FR-AK-13 | Email kode aktivasi | 110:17266 | Backend |
| FR-AK-16, 17 | `AktivasiPage.tsx` (Minta undangan baru + toast); batas di `services/mock` | 66:2582 | Dibangun · Mock |
| FR-AK-18 | `services/mock` (undangan baru membatalkan token lama); aksi Kirim ulang / Kirim undangan baru di panel pengguna | — | Dibangun |
| FR-AK-19 | `services/mock` log audit | — | Mock |

## Gelombang 2 — Manajemen pengguna & Akun Saya

Rute: `/pengguna`, `/pengguna/:id` (panel detail), `/akun-saya`, `/akun-saya/keamanan`. Data: `services/mock/users.ts`,
aturan bersama `lib/user-rules.ts`. Figma dibaca 14 Okt 2026 (spesifikasi lengkap di luar repo; selisih: ASSUMPTIONS F-20..F-42).

### Undang Pengguna · Tab `a7315f64-20f0` · ClickUp `z8pmx9n515`

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-UP-01, 02 | `features/users/PenggunaPage.tsx` (tombol "Undang pengguna" hanya R-03/R-04/R-07) | 66:3139, 238:3000 | Dibangun |
| FR-UP-03, 04, 05 | `features/users/components/InviteDialog.tsx` (field per Tabel F-1, "Undangan berlaku 7 hari") | 49:220, 66:3502 | Dibangun |
| FR-UP-06, 07, 08, 09, 10 | `InviteDialog.tsx` + `components/patterns/Combobox.tsx`; `lib/user-rules.ts` `invitableRoles` (Tabel R-1) | 51:827, 51:828 | Dibangun |
| FR-UP-11, 11a, 11b | `services/mock/users.ts` `invite` (PIC organisasi sendiri, R-07 bukan email sendiri, notifikasi R-03) | — | Mock |
| FR-UP-12 | `InviteDialog.tsx` (Wilayah Kerja untuk R-05, "Organisasi ini belum punya wilayah kerja aktif.") | 213:402, 213:625 | Dibangun |
| FR-UP-13 | `lib/user-rules.ts` `violatesSod` (daftar kombinasi = ASSUMPTION) | 213:554 | Sebagian |
| FR-UP-14 | `InviteDialog.tsx` masa berlaku (R-03), peringatan > 2 tahun | 213:478 | Dibangun |
| FR-UP-15, 16, 17 | `InviteDialog.tsx` (Tabel V-1, trim + lowercase, tautan "Buka profil pengguna") | 213:625 | Dibangun |
| FR-UP-18, 19, 20 | `InviteDialog.tsx`, `components/SendFailedDialog.tsx`, Toast | 66:3994, 66:3835, 66:3553 | Dibangun |
| FR-UP-21 | Email undangan (template backend; tiruan di Kotak masuk mock) | 67:273 | Backend |
| FR-UP-22, 23, 24 | `PenggunaPage.tsx`, `components/patterns/AccountStatusBadge.tsx`, `services/mock/users.ts` `refresh` | 238:3000 | Dibangun |
| FR-UP-25 | `services/mock` log audit | — | Mock |

### Kirim Ulang Undangan · Tab `46a985a6-102b` · ClickUp `z8pmx9n6nr`

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-KU-01..06 | `features/users/components/UserDetailPanel.tsx` (aksi per Tabel K-1, R-03/R-04), `services/mock/users.ts` `resendInvite` | 106:14009, 106:14074 | Dibangun |
| FR-KU-07..12 | `features/users/components/UserActionDialogs.tsx` `ResendDialog`, `SendFailedDialog` | 109:14140, 219:1005, 109:14214 | Dibangun |
| FR-KU-13, 13a, 14, 16, 17 | `features/auth/pages/AktivasiPage.tsx` (Minta undangan baru), mock `requestNewInvite` | 66:2582 | Dibangun · Mock |
| FR-KU-13b, 13c, 15, 18 | Routing admin (Tabel K-3) dan kode alasan token | — | Backend (mock: notifikasi ke PIC KKKS) |
| FR-KU-19, 19a, 19c, 19d | Penanda "Minta undangan baru" + tanggal, filter "Punya permintaan aktif", blok permintaan di panel | 242:4144, 246:5817 | Dibangun |
| FR-KU-19b, 20 | mock: aktivasi menang atas kirim ulang | — | Mock |
| FR-KU-20a, 21, 22 | Dialog "Batas kirim ulang tercapai" + jam berikutnya; mock K-5 | 253:6888 | Dibangun |
| FR-KU-23, 24 | Email (template backend) | 137:317, 66:2488 | Backend |
| FR-KU-25, 26 | mock log audit | — | Mock |

### Batalkan Undangan · Tab `97283c3a-9515` · ClickUp `z8pmx9n6nt`

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-BU-01..05 | `UserDetailPanel.tsx` (Tabel B-1), mock `cancelInvite` | 221:1781 | Dibangun |
| FR-BU-06, 07, 08, 08a, 10, 11 | `UserActionDialogs.tsx` `CancelDialog`, `components/ReasonField.tsx` (Tabel B-3) | 221:2272, 223:2390 | Dibangun |
| FR-BU-09, 12, 13 | mock: Nonaktif + "Undangan dibatalkan", rekaman tetap, tautan → "Tautan tidak valid" | 246:6340, 66:2546 | Dibangun · Mock |
| FR-BU-14, 15, 16 | Panel: blok "Aktivasi akun belum selesai" + "Kirim undangan baru" (undang ulang rekaman sama) | 251:6771 | Dibangun |
| FR-BU-17, 18, 19 | mock (tanpa email ke pengguna; log audit) | — | Mock |

### Kelola Status Akun · Tab `aa87a27a-ee88` · ClickUp `z8pmx9n8nq`

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-SA-01, 02, 04 | `lib/status.ts`, `lib/user-rules.ts` `actionsForStatus`, mock | — | Dibangun |
| FR-SA-03 | mock: pencabutan sesi seketika (sesi diperiksa tiap 15 detik di klien) | — | Mock |
| FR-SA-05, 06, 08 | `UserDetailPanel.tsx` (R-03 semua, R-04 organisasi sendiri, bukan akun sendiri), mock | 257:8491 | Dibangun |
| FR-SA-07, 07a | `UserActionDialogs.tsx` peringatan PIC terakhir "Tetap Nonaktifkan"; mock notifikasi R-03 | — | Dibangun |
| FR-SA-09..11 | `SuspendDialog` (Tabel A-3) | 257:8570, 257:8659 | Dibangun |
| FR-SA-12, 21 | Alert login (gelombang 1, `LoginPage.tsx`) | 85:4906 | Dibangun |
| FR-SA-12a, 16, 21a, 25 | Email (template backend; tiruan di Kotak masuk mock) | 257:8676, 257:9500, 265:11349, 275:12762 | Backend |
| FR-SA-13, 14, 20, 20a | `ReactivateDialog` (riwayat perubahan status) | 265:11301 | Dibangun |
| FR-SA-15, 19, 20b | mock | — | Mock (20b: belum) |
| FR-SA-17, 18 | `DeactivateDialog` (Tabel A-4) | 257:9443 | Dibangun |
| FR-SA-22, 23, 23a, 26 | `AccessEndDialog`; invite (R-03) | 270:12574, 271:100..319 | Dibangun |
| FR-SA-24, 30 | mock `refresh` (oleh "Sistem") | — | Mock |
| FR-SA-24a, 25a, 25b | Daftar email diizinkan, pengingat in-app, kanal non-email | — | Belum (butuh Kelola Organisasi / Notifikasi) |
| FR-SA-24b | Penanda "Organisasi nonaktif", aksi tidak tersedia | — | Dibangun |
| FR-SA-28, 29, 29a..d | `UserDetailPanel.tsx` blok "Riwayat akun" (Tabel A-5) | 275:12816 | Dibangun |

### Logout & Sesi — pencabutan oleh admin · Tab `a61955db-ba08`

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-LO-14, 15, 16, 16a | Panel → menu "Akhiri semua sesi" → `RevokeDialog` (Tabel S-3); mock `revokeSessions` | 257:8562 (menu) | Dibangun |

### Akun Saya · Tab `4063d15e-cbad` · ClickUp `z8pmx9nb7u`

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-AS-001 | `features/shell/ProtectedLayout.tsx` (menu pengguna di header → Akun Saya) | 341:6720 | Dibangun |
| FR-AS-002, 003, 004, 005, 006, 007 | `features/account/AkunSayaPages.tsx` `AkunSayaProfilPage` | 341:6300 | Dibangun |
| FR-AS-008 | Keamanan masuk: Kata sandi + Sesi aktif; metode verifikasi (passkey/autentikator) DITAHAN (KD-02) | 341:6507 | Sebagian |
| FR-AS-009, 010 | `features/account/EmailChangeDialog.tsx`, status + waktu pengajuan di bawah Email, alasan penolakan sampai ditutup (selaras ClickUp 14 Okt 2026) | — (frame belum ada) | Dibangun |
| FR-AS-011 | Notifikasi hasil permintaan email ke email lama & baru; sesi lain dicabut | — | Mock |

Juga dipindah ke Akun Saya: Ubah kata sandi (FR-UK-01..11, `UbahKataSandiDialog.tsx`, Figma 341:7112) dan Sesi aktif
(FR-LO-05, -11..13, `SesiAktifSection.tsx`). `/pengaturan-akun` dialihkan ke `/akun-saya/keamanan`.

## PRD User administration (ClickUp, dibaca 14 Okt 2026)

PRD di bawah dibaca dari tautan berbagi ClickUp (di dokumen PRD Core Platform masih "belum ditarik", jadi belum ada
Tab ID). Ketiganya berstatus TESTING.

### Daftar Pengguna · ClickUp `z8pmx9n8nv` · Design Reference kosong

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-DP-01, 06, 07 | `features/users/PenggunaPage.tsx` (nama + email, organisasi, status, login terakhir) | 238:3000 | Dibangun |
| FR-DP-02, 12, 13 | Pencarian nama/email tanpa Enter; kosong → EmptyState | 238:3000 | Dibangun |
| FR-DP-03 | Kolom Role (kode mono + nama) | — | Dibangun |
| FR-DP-04 | `AccountStatusBadge` (lima status, gelombang 2) | 238:3000 | Dibangun |
| FR-DP-05 | Login terakhir WIB; "Belum pernah login" | — | Dibangun |
| FR-DP-08..11, 15 | `services/mock/users.ts` `visibleTo`; PIC tanpa filter Organisasi, filter role hanya role KKKS | 66:3139 | Dibangun |
| FR-DP-14 | Filter Organisasi, Status, Role + tombol Hapus filter | — | Dibangun |
| NFR | Cakupan ditegakkan di service (search, filter, pagination, export) | — | Mock |

### Profil Pengguna · ClickUp `z8pmx9n8nx` · Figma 109:16236 / 109:16307 / 109:16444

PRD tidak memberi FR ID; baris dinomori sementara PP-1..PP-9 sesuai urutan tabel (temuan untuk PM).

| ID sementara | File/komponen | Figma | Status |
|---|---|---|---|
| PP-1 detail | `components/UserDetailPanel.tsx` tab Profil (Ubah per field → `/pengguna/:id/ubah`, gembok untuk read-only, Riwayat akun: Diundang, Diaktifkan, Login terakhir) | 109:16236 | Dibangun |
| PP-2 role & izin | `components/UserPanelTabs.tsx` `AksesTab`, `features/access/EffectiveAccessView.tsx` ("Izin efektif (n)", Modul · Izin · Deskripsi) | 109:16307 | Dibangun |
| PP-3 aktivitas | `AktivitasTab` (Sesi aktif + "Aktif … lalu", Riwayat perubahan dengan pelaku/tanggal/alasan) | 109:16444 | Dibangun |
| PP-4 akhiri satu sesi | Tombol Keluar per sesi + alasan; `services/mock/profile.ts` `revokeUserSession` | 109:16444 | Dibangun |
| PP-5 akhiri semua sesi | Menu ··· → Akhiri semua sesi (nonaktif bila 0 sesi) | 109:16236 | Dibangun |
| PP-6, PP-7 tangguhkan / nonaktifkan | Menu ··· (gelombang 2); Ditangguhkan → tombol Aktifkan kembali | 109:16236 | Dibangun |
| PP-8 reset kata sandi | Tombol "Reset kata sandi" + konfirmasi; `profile.ts` `resetPassword` (tautan Lupa Kata Sandi, hanya akun Aktif) | 109:16236 | Dibangun |
| PP-9 cakupan organisasi | Organisasi lain → 404 (keputusan PM, mengikuti FR-PA-15) | — | Dibangun |

### Ekspor Daftar Pengguna · ClickUp `z8pmx9n8nz` · Design Reference kosong

| ID | File/komponen | Figma | Status |
|---|---|---|---|
| US-ED-01 | `PenggunaPage.tsx` tombol Ekspor (R-03, R-04), `components/ExportDialog.tsx` | — | Dibangun |
| US-ED-02, 03, (04) | `profile.ts` `exportUsers` (filter + pencarian, seluruh hasil tanpa batas halaman) | — | Dibangun |
| (05) | `lib/export-file.ts` CSV (UTF-8 BOM) dan XLSX (`write-excel-file`) | — | Dibangun |
| (06) | Kolom sesuai Export Data Specification; tanpa kata sandi/token | — | Dibangun |
| (07), (08), (09) | Pesan gagal, tombol nonaktif bila kosong (+ NOT_ELIGIBLE di service), toast berhasil | — | Dibangun |
| Objective audit | Ekspor tercatat di Jejak Audit (aksi export) | — | Mock |
| NFR ekspor besar asinkron | Belum (butuh job latar belakang + notifikasi M-20) | — | Belum |

## Katalog Role · ClickUp `z8pmx9n8p0` & Aktif/Nonaktif Role · ClickUp `z8pmx9n8p1` (status TESTING)

"Design belum ada" → pola Manajemen Pengguna (tabel + panel kanan) — PR-11. Rute `/role`, `/role/:kode` (R-03).
Data: `services/mock/roles.ts`, katalog klien `lib/role-catalog.ts` (nama, status, cakupan, hak akses → `ROLES`/`MATRIX`).
`RoleId` kini kode terbuka (`R-${string}`) agar role buatan R-08 dst. didukung; akses lewat `roleDef`/`roleName`.

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-KR-01, 02 | `services/mock/db.ts` `roles` (tujuh role data awal, kode tetap) | — | Dibangun |
| FR-KR-03 | `lib/role-catalog.ts` `applyRoleCatalog`, `rolesByOrgType`; dropdown Undang/Ubah membaca katalog; `ProtectedLayout` memuat katalog | — | Dibangun |
| FR-KR-04 | `needsWk` (role bercakupan wilayah kerja → field Wilayah Kerja); `scopeFor` untuk role buatan | — | Dibangun |
| FR-KR-05 | `lib/user-rules.ts` `FORBIDDEN_ROLE_COMBOS` sebagai data (UI pengelolaan belum ada) | — | Sebagian |
| FR-KR-06, 07 | `features/roles/RolePage.tsx` (menu & rute hanya R-03; kolom kode, nama, jenis, cakupan, status, jumlah pengguna → `/pengguna?role=`) | — | Dibangun |
| FR-KR-08 | `components/RoleDialogs.tsx` `RenameRoleDialog` (berlaku seketika) | — | Dibangun |
| FR-KR-09, 09a, 09b | `BuatRolePage.tsx` (rute `/role/baru`, halaman penuh dengan jejak lokasi + tombol kembali + konfirmasi tinggalkan) + `components/RolePermissionDialogs.tsx` `PermissionPicker` (modul & aksi dari satu sumber; aksi dibatasi jenis organisasi) | — | Dibangun |
| FR-KR-09c | Role sistem: hak akses dapat diubah, tidak dapat dihapus | — | Dibangun |
| FR-KR-09d | `DeleteRoleDialog` (role buatan tanpa pengguna; pesan "masih dipakai [n] pengguna") | — | Dibangun |
| FR-KR-09e | Service menolak selain R-03 (Jejak Audit, PR-03) | — | Mock |
| FR-KR-09f | `EditPermissionsDialog` (konfirmasi jumlah pengguna terdampak; sesi tidak dicabut) | — | Dibangun |
| FR-KR-10, 11 | Jejak Audit kelompok Konfigurasi (sebelum/sesudah); nama pelaku/role snapshot | — | Mock |
| FR-AR-01, 02, 03 | Status Aktif/Tidak Aktif; hanya R-03; R-03 tidak dapat dinonaktifkan | — | Dibangun |
| FR-AR-04, 04a, 04b, 04c, 05 | `DeactivateRoleDialog` (jumlah pengguna + tautan; Pindahkan ke role lain dengan perbedaan hak akses, atau Lewati — keputusan PM) | — | Dibangun |
| FR-AR-06, 07 | Role Tidak Aktif tidak muncul di dropdown/filter; service menolak `ROLE_INACTIVE` | — | Dibangun |
| FR-AR-08, 09 | Role tidak dicabut dari pemilik; sesi tidak dicabut | — | Mock |
| FR-AR-10, 11 | `ReactivateRoleDialog` | — | Dibangun |
| FR-AR-13..18 | `MoveUsersDialog` (pratinjau, hanya role asal diganti, kombinasi terlarang dilewati + laporan, audit per pengguna berkorelasi) | — | Dibangun |
| FR-AR-19, 20 | Penanda redup di daftar role; "(Tidak aktif)" di Daftar Pengguna & tab Akses | — | Dibangun |
| FR-AR-21 | Audit status role + jumlah pengguna saat itu | — | Mock |

## Kelola Organisasi KKKS · Tab `ecaa6126-ac9f` · ClickUp `z8pmx9pc63` (status scoping)

Tidak ada Figma (Design Brief bagian E: frame belum diserahkan) → pola Manajemen Pengguna (PR-11).
Rute `/organisasi`, `/organisasi/:kode`. Data: `services/mock/orgs.ts`, aturan `lib/org-rules.ts`.
Pembatasan IP (FR-ORG-31..39) tidak dibangun (Q-9, keputusan PM 14 Okt 2026).

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-ORG-01 | `features/shell/navigation.tsx` (Organisasi untuk R-03/R-07/R-04), `RequireModule` (lainnya 403 + Jejak Audit) | — | Dibangun |
| FR-ORG-02, 03 | `features/orgs/OrganisasiPage.tsx` (kolom O-1 ringkas, cari nama/kode/domain, filter Jenis & Status bawaan Aktif, 25 baris, nonaktif redup) | — | Dibangun |
| FR-ORG-04 | Badge "Tanpa PIC" di daftar; banner + Undang PIC di panel | — | Dibangun |
| FR-ORG-05, 07 | `components/AddOrgDialog.tsx` + `components/patterns/ChipInput.tsx` (chip error/peringatan) | — | Dibangun |
| FR-ORG-06 | Kode terkunci di panel; `orgs.ts` tidak menerima perubahan kode | — | Dibangun |
| FR-ORG-08 | Toast "Organisasi ditambahkan." + aksi Undang PIC KKKS (Toast `action`), panel organisasi baru terbuka | — | Dibangun |
| FR-ORG-09 | Alert gagal tambah, isian tetap | — | Dibangun |
| FR-ORG-10 | `components/OrgPanel.tsx` tab Profil/Akses/Wilayah Kerja/Riwayat; angka bertaut ke Daftar Pengguna (jumlah grup tidak tampil, KD-03) | — | Sebagian |
| FR-ORG-11 | Ubah inline + pemeriksaan versi (alert "baru saja diubah administrator lain") | — | Dibangun |
| FR-ORG-12 | `components/OrgAccessTab.tsx` domain (n/20, Hapus + konfirmasi dampak, domain terakhir nonaktif) | — | Dibangun |
| FR-ORG-13 | Menu Nonaktifkan tidak tampil untuk SKK Migas/Kontraktor; service menolak | — | Dibangun |
| FR-ORG-14, 15, 17 | `components/OrgStatusDialogs.tsx` (dampak, alasan Tabel O-3, ketik kode); sesi berakhir `org_inactive` | — | Dibangun |
| FR-ORG-16 | Login "Organisasi tidak aktif" (gelombang 1, teks = Tabel E-ORG); pesan sesi berakhir baru (`org_inactive`) | — | Dibangun |
| FR-ORG-18 | Penanda "Organisasi nonaktif" + aksi dinonaktifkan (gelombang 2, FR-SA-24b) | — | Dibangun |
| FR-ORG-19 | Email ke Administrator Bisnis lain & PIC KKKS (mock) | — | Mock |
| FR-ORG-20 | PIC: halaman detail organisasinya, mode baca, tanpa alasan email diizinkan | — | Dibangun |
| FR-ORG-21, 22 | Jejak Audit untuk tiap perubahan (sebelum/sesudah, alasan) | — | Mock |
| FR-ORG-23 | Penolakan dicatat di Jejak Audit (PR-03) | — | Mock |
| FR-ORG-24..29 | Email diizinkan (tambah, tanggal wajib email pribadi ≤ 12 bulan, satu organisasi, undangan lolos + masa berlaku akses otomatis, ubah tanggal, hapus + nonaktifkan akun, status Kedaluwarsa) | — | Dibangun |
| FR-ORG-30 | Pengingat sebelum kedaluwarsa (butuh job terjadwal) | — | Belum |
| FR-ORG-31..39 | Pembatasan IP | — | Tidak dibangun (Q-9) |
| FR-ORG-40 | R-07: tambah organisasi + domain + email diizinkan; tanpa ubah profil/nonaktifkan; email ke Administrator Bisnis | — | Dibangun |
| FR-ORG-41..45 | `components/OrgWorkAreaTab.tsx` (tambah/ubah nama/nonaktifkan dengan alasan; Dioperasikan bersama; PIC baca); WK aktif jadi pilihan Undang | — | Dibangun |
| EC-ORG-04, 10, 11, 12 | Undangan ke domain/email yang dihapus tidak berlaku; "Tidak diperlukan lagi" | — | Mock |
| EC-ORG-07 | Domain IDN | — | Belum (ASCII saja) |

## Ubah Data & Role Pengguna · ClickUp `z8pmx9n8ny` (dibaca 14 Okt 2026, status IN DEVELOPMENT)

PRD dibaca dari tautan berbagi ClickUp (belum ada di dokumen PRD Core Platform, jadi tidak punya Tab ID). Tidak ada
Design Reference maupun link Figma. Halaman `/pengguna/:id/ubah` mengikuti tata letak Figma 341:6300 (Akun Saya — Profil) atas arahan PM
14 Okt 2026; layar lain dari DS + look & feel Manajemen Pengguna (PR-11).
Rute: `/pengguna/:id/ubah`, `/permintaan-ubah-email`, `/verifikasi-email/:token`, `/bukan-saya/:token`.
Data: `services/mock/edit.ts`; aturan bersama `lib/user-rules.ts` (`editableRoles`, `emailApproverRole`).

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-UDR-01 | `services/mock/edit.ts` `assertCanEdit` (R-03, R-07 semua organisasi); email ke Administrator Bisnis untuk perubahan oleh R-07 dan pemberian role R-03; `UserDetailPanel.tsx` tombol "Ubah data" | — | Dibangun |
| FR-UDR-02 | `edit.ts` (R-04 organisasinya; organisasi lain = NOT_FOUND / 404) | — | Mock |
| FR-UDR-03 | `features/users/UbahPenggunaPage.tsx` (nama 3–150, jabatan ≤ 100, organisasi read-only) | 341:6300 (tata letak) | Dibangun |
| FR-UDR-04 | `features/account/AkunSayaPages.tsx` (simpan langsung, tercatat di Jejak Audit) | 341:6300 | Dibangun |
| FR-UDR-05 | `UbahPenggunaPage.tsx` field Email; `edit.ts` tautan verifikasi; `features/email-links/EmailLinkPages.tsx` `VerifikasiEmailPage` (seluruh sesi dicabut, notifikasi email lama & baru) | — | Dibangun |
| FR-UDR-06 | `UserDetailPanel.tsx` baris Email (status + email yang diajukan); `AkunSayaPages.tsx` | — | Dibangun |
| FR-UDR-07, 08 | `UbahPenggunaPage.tsx` Role + Wilayah Kerja (R-05) + Cakupan Pengawas (R-02); `edit.ts` (`editableRoles`, SoD, tanpa mengakhiri sesi) | 341:6300 (tata letak) | Dibangun |
| FR-UDR-09 | `UbahPenggunaPage.tsx` `Ringkasan` (sebelum/sesudah, Kembali mengubah, Batal, toast sukses/gagal) | — | Dibangun |
| FR-UDR-10 | `UbahPenggunaPage.tsx` (`useBlocker` + ConfirmDialog), Akun Saya (gelombang 2) | — | Dibangun |
| FR-UDR-11 | `UbahPenggunaPage.tsx` role read-only untuk akun sendiri; `edit.ts` 403 + Jejak Audit (PR-03) | — | Dibangun |
| FR-UDR-12 | `services/mock/users.ts` `requestEmailChange` (kata sandi, satu permintaan aktif, 10/jam, email lama diberi tahu + "Bukan saya") | 341:6735 | Dibangun |
| FR-UDR-13 | `users.ts` `applyEmailChange` (R-03/R-07 langsung berlaku; "Bukan saya" mencabut sesi + memberi tahu Administrator Bisnis) | — | Mock |
| FR-UDR-14 | `lib/user-rules.ts` `emailApproverRole`; `BukanSayaPage` | — | Dibangun |
| FR-UDR-15 | `features/users/PermintaanEmailPage.tsx`, menu + badge (`navigation.tsx`, `ProtectedLayout.tsx`); email ke penyetuju. Kotak Persetujuan M-01 belum ada | — | Sebagian |
| FR-UDR-16 | `PermintaanEmailPage.tsx` (Setujui dengan pemeriksaan ulang, Tolak dengan alasan wajib; pengaju tidak menyetujui sendiri) | — | Dibangun |
| FR-UDR-17 | Snapshot nama/jabatan di dokumen bertanda tangan | — | Belum (modul dokumen belum ada) |
| FR-UDR-18 | Jejak Audit/Log Akses menyimpan nama pelaku saat kejadian (gelombang 3); Riwayat akun mencatat perubahan nama, jabatan, email | — | Dibangun |
| Tabel S-UDR | `services/types.ts` `EmailRequestStatus` (+ Berlaku/Dibatalkan sebagai peristiwa riwayat) | — | Dibangun |
| Tabel E-UDR | `features/users/copy.ts` `e`, `features/account/akunSayaCopy.ts` (sapaan "Anda") | — | Dibangun |
| EC-UDR-04 | `emailApproverRole` (PIC + Pejabat Berwenang → Administrator Bisnis) | — | Dibangun |
| EC-UDR-05, 06 | `users.ts` `cancelPendingEmail` (organisasi/akun nonaktif, akun ditangguhkan) | — | Mock |
| EC-UDR-07 | `edit.ts` `approveEmailRequest` (ditolak otomatis bila domain tidak lagi diizinkan) | — | Mock |

## Gelombang 3 — Hak akses, Log Akses, Jejak Audit

Rute: `/log-akses` (tab Log akses / Sesi aktif), `/jejak-audit`, ditambah tab Akses/Aktivitas di panel `/pengguna/:id`,
bagian hak akses di `/akun-saya` dan riwayat masuk di `/akun-saya/keamanan`. Keenam PRD gelombang 3 menulis
"Design belum ada" (atau tidak punya Design Reference): semua layar dibuat dari DS + look & feel Figma Manajemen Pengguna
(PR-11). Kolom Figma `—` = tidak ada frame; `106:14009` = hanya tab Profil/Akses/Aktivitas yang tergambar.
Data: `services/mock/logs.ts`, `lib/access.ts`, `lib/log-events.ts`. Asumsi: ASSUMPTIONS.md "Asumsi gelombang 3".

### Penegakan Hak Akses · Tab `dbd20295-c7ef` · ClickUp `z8pmx9n8pw`

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-PA-01..06 | `services/mock/users.ts` `assertCanManage`, `services/mock/logs.ts` `reach` (cek per permintaan, default deny, cakupan di query) | — | Mock / Backend |
| FR-PA-07, 08, 09, 10 | `features/shell/navigation.tsx` `buildNav` (disembunyikan, dari `lib/rbac.ts` yang sama dengan mock), `RELEASED_MODULES` | — | Dibangun |
| FR-PA-11, 11a | `services/mock/users.ts` `recordDenial` (Jejak Audit saja, PR-03 diputuskan 14 Okt 2026) | — | Mock |
| FR-PA-12 | Pengelompokan penolakan berulang per id korelasi | — | Backend (belum di mock) |
| FR-PA-13 | Penolakan tidak mengakhiri sesi (mock) | — | Mock |
| FR-PA-14, 15, 22 | `features/shell/RequireModule.tsx`, `ErrorPages.tsx` (403 / 404 sama persis untuk luar cakupan & modul belum rilis; kode tidak tampil) | — | Dibangun |
| FR-PA-16 | `lib/access.ts` `SOD_MESSAGES` (Tabel H-2); dipakai saat dokumen operasional dirilis | — | Sebagian |
| FR-PA-17, 18 | `features/access/copy.ts`, `lib/i18n/id.ts` `galat` (nama modul, tanpa nama organisasi/dokumen) | — | Dibangun |
| FR-PA-18a | `features/shell/ProtectedLayout.tsx` (toast "Hak akses Anda telah diperbarui oleh administrator." + navigasi dari sesi yang di-poll); Alat uji "Ubah role saya" | — | Dibangun |
| FR-PA-19 | `ErrorPages.tsx` `ForbiddenPage` → tautan ke Ruang Kerja (diputuskan 14 Okt 2026) | — | Dibangun |
| FR-PA-20 | `features/users/components/UserActionDialogs.tsx` (alert di dialog, input tetap; teks Tabel P-1) | — | Dibangun |
| FR-PA-21 | `features/session/SessionProvider.tsx` `rememberReturnTo` (gelombang 1) | — | Dibangun |

### Matriks Role × Modul × Aksi · Tab `e8b6fd5d-016a` · ClickUp `z8pmx9n8pb`

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-MX-01, 01a, 02 | `lib/rbac.ts` `ACTIONS` (Tabel X-1), `Grant` = modul + aksi | — | Dibangun (data) |
| FR-MX-03, 04, 04a | `lib/access.ts` `effectiveAccess`, `scopeFor` | — | Dibangun |
| FR-MX-05 | `lib/access.ts` `SOD_MESSAGES`; penegakan per dokumen menunggu modul operasional | — | Sebagian |
| FR-MX-06, 06a, 07 | `lib/rbac.ts` `MATRIX` (R-03 / R-07 tanpa data bisnis) | — | Dibangun (data) |
| FR-MX-07a, 07a1, 07b | Bergantung M-04..M-16 (belum dirilis) | — | Belum (modul belum ada) |
| FR-MX-07c | `services/mock/logs.ts` tidak punya operasi ubah/hapus entri | — | Mock |
| FR-MX-07d | `services/mock/logs.ts` `reach` (R-04 organisasinya) | — | Mock |
| FR-MX-08 | `lib/rbac.ts` `MATRIX` sebagai data | — | Dibangun |
| FR-MX-09 | `lib/matrix.test.ts` (satu test per sel modul × role × aksi) | — | Dibangun |
| FR-MX-10 | Perubahan hak akses role lewat halaman Role (FR-KR-09f) tercatat di Jejak Audit | — | Dibangun |
| FR-MX-11 | `RELEASED_MODULES` hanya modul dengan baris matriks | — | Dibangun |
| FR-MX-12 | `lib/rbac.ts` `can` default deny | — | Dibangun |

### Hak Akses Efektif · Tab `fc692fd7-10f5` · ClickUp `z8pmx9n8pt`

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-HE-01..05, 07 | `lib/access.ts` `effectiveAccess` (Tabel H-1: status → role → izin + cakupan → gabung) | — | Dibangun |
| FR-HE-06 | Role Tidak Aktif tetap dihitung untuk pemiliknya (`effectiveAccess` membaca role pengguna, bukan status katalog) | — | Dibangun |
| FR-HE-08, 08a, 10, 10a | `lib/access.ts` `SOD_MESSAGES`; penegakan per dokumen menunggu modul operasional | — | Sebagian |
| FR-HE-09 | `lib/user-rules.ts` `violatesSod` (saat undang, gelombang 2) | — | Sebagian |
| FR-HE-11, 12, 13 | `effectiveAccess(…, groupRoles)` — slot grup ada, fitur Grup ditahan KD-03 | — | Sebagian |
| FR-HE-14, 14a, 15 | `features/access/EffectiveAccessView.tsx` di `features/users/components/UserPanelTabs.tsx` (tab Akses) | 106:14009 (tab saja) | Dibangun |
| FR-HE-16 | `features/account/AkunSayaPages.tsx` (bagian "Hak akses efektif") | — | Dibangun |
| FR-HE-17 | `UbahPenggunaPage.tsx` "Perbedaan hak akses" (bertambah/berkurang per modul), `edit.ts` `accessDiff` | — | Dibangun |
| FR-HE-18, 19, 20 | Sesi tidak dicabut saat role berubah; dihitung di service (`users.effectiveAccess`) | — | Mock / Backend |

### Cakupan Data · Tab `88b87435-c320` · ClickUp `z8pmx9n8pu`

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-CD-01, 02, 04, 04a | `lib/access.ts` `scopeFor`, `ScopeEntry` (Tabel C-1) | — | Dibangun |
| FR-CD-03, 03a, 15, 16, 18, 20, 21 | `services/mock` (isolasi antar-KKKS, luar cakupan = NOT_FOUND) | — | Mock / Backend |
| FR-CD-04b | `features/users/components/InviteDialog.tsx` (Cakupan Pengawas: Seluruh KKKS / Beberapa KKKS tertentu) | — | Dibangun |
| FR-CD-05, 06 | `services/mock/users.ts` `invite` (cakupan ≤ pengundang) | — | Mock |
| FR-CD-07, 08 | `UbahPenggunaPage.tsx` (Wilayah Kerja, Cakupan Pengawas), `edit.ts` (tanpa mengakhiri sesi, Jejak Audit sebelum/sesudah) | — | Dibangun |
| FR-CD-09..12 | `InviteDialog.tsx` Wilayah Kerja (gelombang 2) | 213:402 | Dibangun |
| FR-CD-13 | `UserDetailPanel.tsx` (WK "(Nonaktif)"), `EffectiveAccessView.tsx` `ScopeList` | — | Dibangun |
| FR-CD-14 | `AkunSayaPages.tsx` "Cakupan akses" → `ScopeList` | 341:6300 | Dibangun |
| FR-CD-17 | `recordDenial` → Jejak Audit (mock) | — | Mock |
| FR-CD-19 | Grafik lintas organisasi (M-10/M-11 belum dirilis) | — | Belum |

### Log Akses · Tab `ac582539-7263` · ClickUp `z8pmx9n8pn`

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-LA-01, 02, 03, 04, 05 | `lib/log-events.ts` (Tabel G-1), `services/mock/core.ts` `log`, `services/mock/logs.ts` | — | Mock |
| FR-LA-06, 06a | `features/shell/navigation.tsx` `LOG_ROLES`, `RequireModule roles`, `logs.ts` `reach` (R-04 tanpa IP organisasi lain) | — | Dibangun |
| FR-LA-07, 08, 09 | `features/logs/LogAksesPage.tsx` (7 hari, jumlah hasil, filter di URL, "(Nonaktif)", `components/patterns/Pagination.tsx`) | — | Dibangun |
| FR-LA-10 | `LogAksesPage.tsx` `EntryPanel` (semua field G-2, tautan id sesi) | — | Dibangun |
| FR-LA-11 | `UserPanelTabs.tsx` `AktivitasTab` ("Buka di Log Akses") | 106:14009 (tab saja) | Dibangun |
| FR-LA-12 | `LogAksesPage.tsx` filter cepat "Kegagalan login beruntun" (5x, `FAILED_STREAK_THRESHOLD`) | — | Dibangun |
| FR-LA-13, 14, 15 | `LogAksesPage.tsx` tab Sesi aktif + dialog Cabut sesi (alasan wajib) | — | Dibangun |
| FR-LA-15a, 15b, 15c | `AkunSayaPages.tsx` `RiwayatMasuk` (30 hari, tanpa IP, arahan + tombol Ubah kata sandi) | — | Dibangun |
| FR-LA-16, 17 | `LogAksesPage.tsx` Ekspor CSV (R-03), `logs.ts` `exportAccessLog` (tercatat di Jejak Audit) | — | Dibangun |
| FR-LA-18, 19 | `features/logs/shared.tsx` `ArchiveTag`; kebijakan retensi bersama Jejak Audit | — | Dibangun |

### Jejak Audit · Tab `70911a9e-e9ed` · ClickUp `z8pmx9n8pe`

| FR ID | File/komponen | Figma | Status |
|---|---|---|---|
| FR-JA-01, 02, 04, 05, 06 | `services/mock/core.ts` `audit` (Tabel J-1, J-2, "Sistem"), `lib/log-events.ts` `AUDIT_GROUPS` | — | Mock |
| FR-JA-03, 07, 08 | Tidak mencatat "lihat"; append-only; satu transaksi | — | Mock / Backend |
| FR-JA-09, 10 | Snapshot nama, role, organisasi pelaku di `audit` | — | Mock |
| FR-JA-11 | Rute `/jejak-audit` (R-02/R-03 semua, R-04 organisasinya) | — | Dibangun |
| FR-JA-12, 13, 16 | `features/logs/JejakAuditPage.tsx` (dibuka kosong, filter draf vs diterapkan, "(Nonaktif)", paginasi) | — | Dibangun |
| FR-JA-14 | `JejakAuditPage.tsx` `EntryPanel` (tabel nilai sebelum/sesudah) | — | Dibangun |
| FR-JA-15 | `JejakAuditPage.tsx` kelompok per id korelasi | — | Dibangun |
| FR-JA-17 | `UserPanelTabs.tsx` "Buka di Jejak Audit" (dari profil; dari dokumen menunggu modul operasional) | — | Sebagian |
| FR-JA-18, 19 | Ekspor CSV R-03, tercatat | — | Dibangun |
| FR-JA-20 | Ekspor besar di latar belakang + notifikasi | — | Belum (M-20 belum dirilis) |
| FR-JA-21, 22 | Arsip > 12 bulan, penanda Arsip, tetap bisa dicari | — | Dibangun |
| FR-JA-23, 24 | Retensi total 5 tahun (PR-06, diputuskan PM 14 Okt 2026), pemusnahan | — | Mock / Backend |
| FR-JA-25 | `JejakAuditPage.tsx` `RetentionDialog` (hanya R-03, tercatat, tidak retroaktif) | — | Dibangun |

## Ditahan

| PRD | Tab ID | ClickUp ID | Alasan |
|---|---|---|---|
| Verifikasi Dua Langkah (FR-MF) | 062c2670-aa60 | z8pmx9p62u | KD-02 / PR-01 belum diputuskan |

## Prototype kick-off 21 Okt 2026 · PRD Garis Besar (Kick-off) + BRD v0.5

Ilustrasi garis besar, **bukan acuan dev**. Kode PRD mengikuti PRD Garis Besar (tab 01–13).

| FR / PRD | PRD Garis Besar | File/komponen | Status |
|---|---|---|---|
| RKJ-01..03 (Ruang Kerja per peran, Tugas Saya, Kotak Persetujuan) | Tab 04 | `features/workspace/RuangKerjaPage.tsx` | Ilustrasi |
| INS-01 (lapor dari ponsel) | Tab 06 | `features/incidents/LaporInsidenPage.tsx` (`/lapor`) | Ilustrasi |
| INS-02..08 (verifikasi, kembalikan, tugaskan PIC, tindakan, tutup + bukti; notifikasi SKK) | Tab 06, BR-INS-04/08 | `features/incidents/InsidenPages.tsx` (`/insiden`, `/insiden/:id`) | Ilustrasi |
| OPS-01..04, OPS-12, PLT-03 (realisasi, deviasi 10%, finalisasi, berita acara, unggah dokumen bertanda tangan) | Tab 07, BR-WPB-04/05, BR-DOK-04 | `features/wpb/WpbPages.tsx` (`/wpb`, `/wpb/:id`) | Ilustrasi |
| OPS-05..08, ANL-01 (register BUJP, detail, status dari tanggal, pengingat 12/6/3/1) | Tab 08, AB-09/10 | `features/contracts/KontrakPages.tsx` (`/kontrak`, `/kontrak/:id`) | Ilustrasi |
| EKS-01 (dasbor eksekutif; belum terverifikasi terpisah) | Tab 13, BR-EKS-01, AB-17 | `features/dashboard/DashboardPages.tsx` (`/dasbor`) | Ilustrasi |
| ANL-02 (peta panas → area → insiden → detail) | Tab 11 | `features/dashboard/DashboardPages.tsx` (`/peta-panas`), `components/patterns/IndonesiaMap.tsx` | Ilustrasi |
| Notifikasi (PLT) | Tab 02 | `features/notifications/NotificationsPage.tsx` (`/notifikasi`, lonceng header) | Ilustrasi |
| Layar ringkas: Risiko, PKS/PKT, Tindak lanjut, Profil KKKS, Analitik, Peringatan dini, Laporan | Tab 03, 04, 05, 08, 11, 12, 13 | `features/modules/ModulePages.tsx` | Ringkas |
| Konsep: Bahan peledak, Layanan infrastruktur, K3, Asisten PERISAI, Informasi eksternal | Tab 09, 10, 12, 13 | `features/modules/ModulePages.tsx` (`/konsep/*`) | Konsep |
| KD-01, isolasi data, AB-17 | BRD 6.2, PU-13 | `services/mock/ops/index.ts` + `ops.test.ts` | Ditegakkan di data layer |
