/**
 * Dropdown alasan + penjelasan "Lainnya" (maks 200 karakter). Dipakai Batalkan Undangan (Tabel B-3, FR-BU-08/08a),
 * Tangguhkan (A-3, FR-SA-10), Nonaktifkan (A-4, FR-SA-18), dan Cabut Sesi (S-3, FR-LO-16).
 * Tidak ada nilai terpilih saat dibuka (placeholder); tombol konfirmasi nonaktif sampai alasan valid.
 */
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ALASAN_LAINNYA_MAX } from '@/lib/user-rules';
import type { ReasonInput } from '@/services';
import { usersCopy as c } from '../copy';

export interface ReasonFieldProps {
  label: string;
  placeholder: string;
  options: readonly string[];
  value: ReasonInput;
  onChange: (v: ReasonInput) => void;
  showErrors?: boolean;
}

export function reasonValid(r: ReasonInput): boolean {
  if (!r.alasan) return false;
  if (r.alasan === 'Lainnya') return !!r.penjelasan?.trim() && r.penjelasan.length <= ALASAN_LAINNYA_MAX;
  return true;
}

export function ReasonField({ label, placeholder, options, value, onChange, showErrors }: ReasonFieldProps) {
  const lainnya = value.alasan === 'Lainnya';
  return (
    <div className="flex flex-col gap-4">
      <Select
        label={label}
        placeholder={placeholder}
        value={value.alasan || undefined}
        onValueChange={(alasan) => onChange({ alasan, penjelasan: alasan === 'Lainnya' ? value.penjelasan : undefined })}
        options={options.map((o) => ({ value: o, label: o }))}
        error={showErrors && !value.alasan ? c.alasanKosong : undefined}
      />
      {lainnya && (
        <Textarea
          label={c.status.penjelasan}
          required
          maxLength={ALASAN_LAINNYA_MAX}
          showCount
          value={value.penjelasan ?? ''}
          onChange={(e) => onChange({ ...value, penjelasan: e.target.value })}
          error={showErrors && !value.penjelasan?.trim() ? c.lainnyaKosong : undefined}
        />
      )}
    </div>
  );
}
