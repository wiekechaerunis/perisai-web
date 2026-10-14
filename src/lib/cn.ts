import { clsx, type ClassValue } from 'clsx';

/** Gabung className. Tidak memakai tailwind-merge: kelas utilitas dibatasi token DS sehingga bentrok jarang. */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
