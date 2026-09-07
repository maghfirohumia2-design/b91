/**
 * Antarmuka hasil ekstraksi struk belanja oleh AI
 */
export interface ReceiptScanResult {
  amount: number;
  merchant: string;
  date?: string;
  suggestedCategory?: string;
  description: string;
  items: string[];
  rawText?: string;
}

/**
 * Prompt khusus untuk ekstraksi struk belanja berbahasa Indonesia
 */
export function buildReceiptPrompt(availableCategories: string[]): string {
  const categoryListStr = availableCategories.length > 0 
    ? `Daftar kategori yang tersedia di aplikasi: [${availableCategories.join(", ")}].`
    : "";

  return `
Kamu adalah asisten OCR cerdas khusus membaca dan menganalisis struk/nota belanja di Indonesia (misal: Indomaret, Alfamart, Superindo, Hypermart, SPBU Pertamina/Shell, Restoran, Kafe, Warung, Apotek, Toko Bangunan, Tagihan Listrik/PDAM, dll).

TUGAS UTAMA:
Ekstrak informasi dari gambar struk ini dengan sangat teliti dan kembalikan HANYA dalam format JSON valid tanpa format markdown tambahan.

${categoryListStr}

FORMAT JSON YANG WAJIB DIHASILKAN:
{
  "amount": <angka total nominal akhir yang dibayar pelanggan, integer tanpa titik/koma desimal rupiah. Contoh: 45000>,
  "merchant": "<nama toko, merchant, atau tempat belanja. Contoh: 'Indomaret Sudirman' atau 'SPBU Pertamina'>",
  "date": "<tanggal transaksi dalam format YYYY-MM-DD jika terbaca di struk, atau null jika tidak ada>",
  "suggestedCategory": "<pilih satu nama kategori yang paling sesuai dari daftar kategori di atas, atau berikan saran kategori umum pengeluaran jika tidak ada yang pas>",
  "description": "<ringkasan singkat transaksi, misalnya: 'Indomaret - Minyak goreng, sabun, telur' atau 'Bensin Motor SPBU'>",
  "items": ["<nama item 1>", "<nama item 2>", "<nama item 3>"]
}

PANDUAN EKSTRAKSI NOMINAL (AMOUNT):
1. Cari baris "TOTAL", "TOTAL AKHIR", "GRAND TOTAL", "TAGIHAN", "TOTAL BAYAR", "JUMLAH", atau baris pembayaran terbesar.
2. Jangan keliru dengan nilai subtotal sebelum diskon, nominal uang tunai yang diserahkan (CASH/TUNAI), atau uang kembalian (CHANGE/KEMBALI).
3. Hasilkan nilai numerik bersih murni (contoh: jika tertulis Rp 78.500, hasilkan integer 78500).

KEMBALIKAN HANYA JSON VALID.
`.trim();
}
