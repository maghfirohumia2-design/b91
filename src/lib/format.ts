/**
 * Utilitas pemformatan angka, mata uang, dan tanggal untuk aplikasi Kas Keluarga
 */

/**
 * Format angka menjadi format mata uang Rupiah Indonesia
 * Contoh: 50000 -> "Rp 50.000"
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "Rp 0";
  }
  const num = Number(amount);
  return `Rp ${num.toLocaleString("id-ID")}`;
}

/**
 * Format string input pengguna menjadi format angka terformat
 * Contoh: "50000" -> "50.000"
 */
export function formatNumberInput(value: string): string {
  const cleanDigits = value.replace(/\D/g, "");
  if (!cleanDigits) return "";
  return Number(cleanDigits).toLocaleString("id-ID");
}

/**
 * Parsing string berformat rupiah menjadi number
 * Contoh: "50.000" atau "Rp 50.000" -> 50000
 */
export function parseNumberInput(value: string): number {
  const cleanDigits = value.replace(/\D/g, "");
  return parseFloat(cleanDigits) || 0;
}

/**
 * Format tanggal ke bahasa Indonesia
 * Contoh: "2026-08-15T12:00:00Z" -> "15 Agustus 2026"
 */
export function formatDateIndo(dateStr: string | Date, options?: Intl.DateTimeFormatOptions): string {
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
      ...options
    };
    return date.toLocaleDateString("id-ID", defaultOptions);
  } catch {
    return "-";
  }
}

/**
 * Format jam dan menit ke format lokal
 * Contoh: "2026-08-15T12:30:00Z" -> "12:30"
 */
export function formatTimeIndo(dateStr: string | Date): string {
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}
