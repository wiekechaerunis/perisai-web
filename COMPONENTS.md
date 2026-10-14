# Katalog komponen

Cek daftar ini sebelum membuat komponen baru. Perluas lewat props/variant, jangan menduplikasi.
Komponen di `ui/`, `patterns/`, `layout/` **tidak** mengimpor `features/` atau `services/`, dan tidak memuat teks
hardcode; teks lewat props. Aturan ini ditegakkan ESLint (`no-restricted-imports`).

| Komponen | Folder | Sumber | Props penting | Story | Test |
|---|---|---|---|---|---|
| Button | ui | DS | `variant` primary/secondary/quiet/destructive, `size` md/lg, `loading`, `loadingLabel`, `icon`, `block` | ✓ | ✓ |
| TextField | ui | DS (+perluasan) | `label`, `hint`, `error`, `revealable`, `revealLabels`, `digitsOnly`, `leading`, `size` md/lg, `trailing`, `hideLabel` | ✓ | ✓ |
| Select | ui | DS | `label`, `options`, `placeholder`, `error`, `tone` | ✓ | — |
| Tabs / TabsNav | ui | DS | `items` (+`count`), `label`; TabsNav per rute | ✓ | ✓ |
| Callout | patterns | DS (+varian error) | `variant` info/peringatan/kritis/error, `title`, `action` | ✓ | ✓ |
| EmptyState | patterns | DS | `title`, `description`, `action` | ✓ | via DataTable |
| KeyValueList | patterns | DS | `items` (`label`, `value`, `action`, `mono`) | ✓ | — |
| DataTable | patterns | DS | `columns` (meta `align`, `mono`), `data`, `caption`, `loading`, `empty`, `error` | ✓ | ✓ |
| Dialog / ConfirmDialog | patterns | non-DS | `title`, `description`, `footer`, `dismissible`; Confirm: `confirmLabel`, `destructive`, `loading` | ✓ | ✓ |
| Toast (Provider + useToast) | patterns | non-DS | `show({ title, description })` | ✓ | via halaman |
| Menu | patterns | non-DS | `trigger`, `items`, `header`, `side` | ✓ | — |
| StatePanel | patterns | non-DS | `icon`, `media`, `align` start/center, `title`, `description`, `actions`, `headingLevel` | ✓ | ✓ |
| PasswordChecklist | patterns | non-DS | `rules` (`met`), `label`, `srStatus` | ✓ | ✓ |
| PasswordStrengthMeter | patterns | non-DS | `bars`, `label`, `weak`, `srPrefix` | ✓ | ✓ |
| ResendCountdown | patterns | non-DS | `availableAt`, `serverOffsetMs`, `labels`, `onResend` | ✓ | ✓ |
| AppShell / PageBody | layout | DS (kerangka) | `sidebar`, `skipLinkLabel` | ✓ | — |
| Sidebar | layout | DS | `groups` (sudah disaring role), `account`, `footer`, `navLabel` | ✓ | ✓ |
| PageHeader | layout | DS | `title`, `breadcrumbs`, `summary`, `actions`, `tabs` | ✓ | — |
| Section | layout | DS | `title`, `description`, `action` | ✓ | — |
| AuthSplitLayout / AuthPageLayout | layout | non-DS | Split: `brand`, `footer`, `aside`; Page: `brand`, `headerAction`, `width` | ✓ | via halaman |
| RoleSwitcher (dev) | layout | non-DS | `users`, `onSelect`, `tone` | ✓ | — |
| AppHeader | layout | non-DS | `start`, `end` | via AppShell | via halaman |
| AccountStatusBadge | patterns | non-DS | `label`, `icon`, `tone` neutral/muted/caution, `note` | ✓ | ✓ |
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
