/**
 * "Undangan Gagal Dikirim" (FR-UP-20, FR-KU-11) — tampilan Figma 66:3553 (ilustrasi + teks tengah).
 * Isi pesan mengikuti PRD Kirim Ulang ("Terjadi kendala saat mengirim undangan ke [email]…"), bukan copy Figma (F-25).
 */
import illusError from '@/assets/figma/illus-error-x.png';
import { Dialog } from '@/components/patterns/Dialog';
import { Button } from '@/components/ui/Button';
import { usersCopy as c } from '../copy';

export interface SendFailedDialogProps {
  open: boolean;
  email: string;
  onClose: () => void;
  onRetry: () => void;
  retrying?: boolean;
}

export function SendFailedDialog({ open, email, onClose, onRetry, retrying }: SendFailedDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={c.undangModal.gagalJudul}
      description={c.undangModal.gagalIsi(email)}
      closeLabel={c.undangModal.tutup}
      media={<img src={illusError} alt="" className="h-[87px] w-[94px] object-contain" />}
      footer={
        <>
          <Button onClick={onClose} disabled={retrying}>
            {c.undangModal.batal}
          </Button>
          <Button variant="primary" onClick={onRetry} loading={retrying} loadingLabel={c.undangModal.mengirim}>
            {c.undangModal.cobaLagi}
          </Button>
        </>
      }
    />
  );
}
