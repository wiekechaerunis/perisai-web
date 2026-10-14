/**
 * ResendCountdown — komponen NON-DS (usulan di DS_GAPS.md).
 * Tombol kirim ulang yang nonaktif selama hitung mundur ("Kirim ulang dalam 0:45", FR-LG-13, FR-AK-10).
 * Waktu target berasal dari server; `serverOffsetMs` = serverNow − Date.now() saat respons diterima (FR-LO-09c).
 */
import { useEffect, useState } from 'react';
import { formatHitungMundur } from '@/lib/format';
import { Button } from '../ui/Button';

export interface ResendCountdownProps {
  /** ISO UTC kapan kirim ulang tersedia. */
  availableAt: string;
  serverOffsetMs?: number;
  onResend: () => void;
  loading?: boolean;
  /** Teks: label aktif dan label hitung mundur (`{waktu}` diganti "0:45"). */
  labels: { resend: string; countdown: string };
  disabled?: boolean;
}

function remainingSeconds(availableAt: string, offset: number): number {
  return Math.max(0, (new Date(availableAt).getTime() - (Date.now() + offset)) / 1000);
}

export function ResendCountdown({ availableAt, serverOffsetMs = 0, onResend, loading, labels, disabled }: ResendCountdownProps) {
  const [left, setLeft] = useState(() => remainingSeconds(availableAt, serverOffsetMs));

  useEffect(() => {
    setLeft(remainingSeconds(availableAt, serverOffsetMs));
    const id = setInterval(() => setLeft(remainingSeconds(availableAt, serverOffsetMs)), 250);
    return () => clearInterval(id);
  }, [availableAt, serverOffsetMs]);

  const waiting = left > 0;
  return (
    <Button variant="quiet" onClick={onResend} disabled={waiting || disabled} loading={loading}>
      {waiting ? labels.countdown.replace('{waktu}', formatHitungMundur(left)) : labels.resend}
    </Button>
  );
}
