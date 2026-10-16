/**
 * RoleSwitcher — alat DEV (tidak tampil di produksi/mode api). Masuk cepat sebagai pengguna uji
 * per role R-01..R-07 (katalog BRD 6.2) tanpa password + OTP, untuk memeriksa tampilan role-aware.
 * Data pengguna dan aksi diberikan pemakai (komponen tidak fetch sendiri).
 */
import { Select } from '../ui/Select';

export interface RoleSwitcherUser {
  id: string;
  label: string;
}

export interface RoleSwitcherProps {
  users: RoleSwitcherUser[];
  currentUserId?: string;
  onSelect: (userId: string) => void;
  label: string;
  placeholder: string;
  /** inverse = di atas sidebar-bg. */
  tone?: 'default' | 'inverse';
}

export function RoleSwitcher({ users, currentUserId, onSelect, label, placeholder, tone = 'inverse' }: RoleSwitcherProps) {
  return (
    <Select
      tone={tone}
      label={label}
      placeholder={placeholder}
      value={currentUserId}
      onValueChange={onSelect}
      options={users.map((u) => ({ value: u.id, label: u.label }))}
    />
  );
}
