const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 30000 → '30,000' (Indian grouping, no ₹ symbol). */
export function formatRupees(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();
  if (digits.length <= 3) return `${sign}${digits}`;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return `${sign}${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}

export const formatAmount = (value: number) => `₹ ${formatRupees(value)}`;

/** '9876526448' → '98765 26448'. */
export function formatIndianMobile(digits: string): string {
  const cleaned = digits.replace(/\D/g, '');
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
}

/** '9876526448' → '+91 ••••••6448' (store label: '+91 ••••••6448' in reference). */
export function maskedMobile(digits: string): string {
  const cleaned = digits.replace(/\D/g, '');
  const tail = cleaned.slice(-4).padStart(4, '•');
  return `+91 ••••••${tail}`;
}

/** '2026-10-12' → '12 Oct 2026'. */
export function formatDateLabel(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1] ?? month;
  return `${Number(day)} ${monthName} ${year}`;
}

/** Seconds → 'MM:SS'. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDistance(km: number): string {
  return `≈ ${km} km`;
}
