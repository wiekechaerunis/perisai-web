# Katalog komponen

Cek daftar ini sebelum membuat komponen baru. Perluas lewat props/variant, jangan menduplikasi.
Komponen di `ui/`, `patterns/`, `layout/` **tidak** mengimpor `features/` atau `services/`, dan tidak memuat teks
hardcode; teks lewat props. Aturan ini ditegakkan ESLint (`no-restricted-imports`).

| Komponen | Folder | Sumber | Props penting | Story | Test |
|---|---|---|---|---|---|
| Button | ui | DS v2 | `variant` primary/secondary/subtle/quiet/destructive/link/link-danger, `size` sm 36/md 40/lg 48, `loading`, `loadingLabel`, `icon`, `block` | ✓ | ✓ |
| TextField | ui | DS v2 (+perluasan) | `label`, `hint`, `error`, `revealable`, `revealLabels`, `digitsOnly`, `leading`, `size` md 40/lg 48, `trailing`, `hideLabel`; helper `inputStateClass` dipakai semua kotak isian | ✓ | ✓ |
| Select | ui | DS v2 | `label`, `options`, `placeholder`, `error`, `size` sm 32/md 40 | ✓ | — |
| Checkbox | ui | DS v2 | `label`; gaya kotak global di styles/index.css (juga untuk radio native) | ✓ | — |
| Tabs / TabsNav | ui | DS | `items` (+`count`), `label`; TabsNav per rute | ✓ | ✓ |
| Callout | patterns | DS (+varian error) | `variant` info/peringatan/kritis/error, `title`, `action` | ✓ | ✓ |
| EmptyState | patterns | DS v2 | `title`, `description`, `action`, `illustration` (nama il-*, `null` = tanpa), `illustrationSize` sm/md | ✓ | via DataTable |
| Illustration | patterns | DS v2 | `name` (13 ilustrasi garis bertoken), `size` sm 120/md 160/lg 200 | ✓ | — |
| TableCard / TableSearch | patterns | DS v2 (kerangka DataTable) | `title`, `tools`, `applied`, `before`, `footer`; TableSearch 36px berikon | ✓ | via halaman |
| FilterPanel / FilterGroup / FilterButton | patterns | DS v2 | `value`, `emptyValue`, `onApply`, `children(draft, setDraft)`, `applyLabel`, `activeCount`, `variant` popover/panel, `onDraftChange` (pratinjau), `open`/`onOpenChange` | ✓ | ✓ |
| AppliedFilters | patterns | DS v2 (AppliedFilter) | `filters` (`label`, `value`, `onRemove`), `onClear`, `labels` | ✓ | via halaman |
| ChipGroup | patterns | DS v2 (chip pilih) | `options` (+`dot` severitas), `value`, `onChange`, `label` | ✓ | — |
| OtpField | patterns | DS v2 | `label`, `value`, `onChange`, `length`, `error`, `hint` (satu input, 6 sel tampilan) | ✓ | via halaman |
| KeyValueList | patterns | DS | `items` (`label`, `value`, `action`, `mono`) | ✓ | — |
| DataTable | patterns | DS | `columns` (meta `align`, `mono`), `data`, `caption`, `loading`, `empty`, `error` | ✓ | ✓ |
| Dialog / ConfirmDialog | patterns | DS v2 | `size` md 480/lg 640, `media` (varian Hasil); `title`, `description`, `footer`, `dismissible`; Confirm: `confirmLabel`, `destructive`, `loading` | ✓ | ✓ |
| Toast (Provider + useToast) | patterns | DS v2 | `show({ title, description })` | ✓ | via halaman |
| Menu | patterns | DS v2 (ActionMenu) | `trigger`, `items` (+`danger`: paling bawah, `error-ink`), `header`, `side` | ✓ | — |
| StatePanel | patterns | DS v2 (StatusPage) | `illustration`, `icon`, `media`, `align` start/center, `title`, `description`, `actions`, `headingLevel` | ✓ | ✓ |
| PasswordChecklist | patterns | non-DS | `rules` (`met`), `label`, `srStatus` | ✓ | ✓ |
| PasswordStrengthMeter | patterns | non-DS | `bars`, `label`, `weak`, `srPrefix` | ✓ | ✓ |
| ResendCountdown | patterns | non-DS | `availableAt`, `serverOffsetMs`, `labels`, `onResend` | ✓ | ✓ |
| AppShell / PageBody | layout | DS (kerangka) | `sidebar`, `skipLinkLabel` | ✓ | — |
| Sidebar | layout | DS v2 | `groups` (sudah disaring role), `brand`, `brandMark`, `collapsed`/`onCollapsedChange`, `toggleLabels`, `footerLogo`, `footerText`, `footerTitle`, `footer` | ✓ | ✓ |
| PageHeader | layout | DS v2 | tingkat atas: `title`, `summary` (subjudul), `actions`, `tabs`; turunan (bila `back`/`breadcrumbs`): pita + tombol kembali 40px, `titleAside` (tag), jejak lokasi di bawah judul | ✓ | — |
| Section | layout | DS v2 (kartu) | `title`, `description`, `action`, `flush` (kartu tabel) | ✓ | — |
| IconButton | ui | DS v2 (`p-ibtn`) | `label` (aria-label + tooltip), `icon`, `variant` outline/ghost, `loading` | — | via halaman |
| Switch | ui | DS v2 | `label`, `description`, `checked`, `onCheckedChange`, `disabled` (baris `role="switch"`) | ✓ | — |
| Timeline | patterns | DS v2 | `groups` (`label` hari, `events`: `title`, `time`, `actor`, `note`, `icon`, `tone` now/ok/warn/err/plain/next), `label` | ✓ | via halaman |
| FormFooter | layout | DS v2 | `start` (Batal/Kembali), `end` (satu primer) — sticky di bawah | ✓ | via halaman |
| AuthSplitLayout / AuthPageLayout | layout | non-DS | Split: `brand`, `footer`, `aside`; Page: `brand`, `headerAction`, `width` | ✓ | via halaman |
| RoleSwitcher (dev) | layout | non-DS | `users`, `onSelect`, `tone` | ✓ | — |
| AppHeader | layout | non-DS | `start`, `end` | via AppShell | via halaman |
| AccountStatusBadge | patterns | DS v2 (Tag / WorkflowStatus) | `label`, `icon`, `tone` info/success/neutral/caution/danger/draft/muted/selected (+warning/strong v1), `note`; ekspor `TAG_BASE`, `TAG_TONE` | ✓ | ✓ |
| SidePanel | patterns | non-DS | `title`, `titleAside`, `subtitle`, `actions`, `closeLabel` | ✓ | via halaman |
| Combobox | patterns | non-DS | `options`, `value`, `onChange`, `emptyText`, `required`, `error` | ✓ | ✓ |
| MultiSelect | patterns | non-DS | `options`, `value[]`, `onChange`, `removeLabel`, `disabled` | ✓ | ✓ |
| Textarea | ui | non-DS | `label`, `maxLength`, `showCount`, `error` | ✓ | via halaman |
| Pagination | patterns | non-DS | `page`, `pageSize`, `total`, `onPageChange`, `labels` | ✓ | via halaman |

Komponen DS yang belum dibangun (belum dibutuhkan gelombang 1): AuditStamp, ConfidenceMeter, ProvenanceTag, MetricStrip,
ThresholdBar, DecisionList, ProcessPath, QueueItem, SeverityBadge, WorkflowStatus. AuditStamp dan WorkflowStatus
direncanakan di Gel. 2/3 (Riwayat akun, Jejak Audit).

Komponen fitur (bukan reusable lintas modul) di `features/auth/components/`: `NewPasswordFields` (field password baru
untuk tiga konteks), `OtpForm` (kode verifikasi untuk login dan aktivasi), `AuthFrame` (LoginFrame, PublicFrame,
SupportLink), `LoginHero`, `LoginAlert` (alert Figma 85:4911), `Illustration`. Gelombang 2 di `features/users/components/`:
`InviteDialog`, `UserDetailPanel` (+ `StatusBadge`), `UserActionDialogs`, `ReasonField`, `SendFailedDialog`; di
`features/account/`: `AkunSayaPages`, `EmailChangeDialog`, `UbahKataSandiDialog`, `SesiAktifSection`.
