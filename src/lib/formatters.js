const LOCALE = 'id-ID'
const CURRENCY = 'IDR'

// Instansiasi di luar fungsi (Singleton) agar performa lebih ringan
const rupiahFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
})

const rupiahCompactFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  notation: 'compact',
  maximumFractionDigits: 1,
})

const angkaFormatter = new Intl.NumberFormat(LOCALE)

/**
 * Format angka ke Rupiah penuh (contoh: "Rp 15.000.000")
 */
export const formatRupiah = (amount) => rupiahFormatter.format(amount ?? 0)

/**
 * Format angka ke Rupiah ringkas (contoh: "Rp 15 jt")
 */
export const formatRupiahCompact = (amount) => rupiahCompactFormatter.format(amount ?? 0)

/**
 * Format angka biasa dengan titik pemisah ribuan (contoh: "15.000")
 */
export const formatAngka = (number) => angkaFormatter.format(number ?? 0)

/**
 * Format tanggal ke format Indonesia
 */
export const formatTanggal = (isoString, options = {}) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format tanggal + jam ke format Indonesia
 */
export const formatTanggalJam = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
