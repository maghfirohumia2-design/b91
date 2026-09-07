import { Transaction, Account } from "@/types/database";
import { formatDateIndo, formatTimeIndo } from "@/lib/format";

/**
 * Mengonversi daftar transaksi menjadi string CSV dan memicu unduhan di browser
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  accounts: Account[],
  fileName = "laporan_keuangan_kas_keluarga.csv"
) {
  if (!transactions || transactions.length === 0) {
    alert("Tidak ada transaksi untuk diekspor.");
    return;
  }

  // Buat mapping nama kas
  const accountMap = new Map<string, string>();
  accounts.forEach((acc) => {
    accountMap.set(acc.id, acc.name);
  });

  // Header CSV
  const headers = [
    "No",
    "Tanggal",
    "Jam",
    "Kas / Dompet",
    "Tipe Transaksi",
    "Kategori",
    "Keterangan",
    "Dicatat Oleh",
    "Pemasukan (Rp)",
    "Pengeluaran (Rp)",
    "Status Transfer"
  ];

  // Baris data CSV
  const rows = transactions.map((tx, index) => {
    const isIncome = tx.type === "income";
    const kasName = accountMap.get(tx.account_id) || "Kas";
    const tanggal = formatDateIndo(tx.created_at);
    const jam = formatTimeIndo(tx.created_at);
    const pemasukan = isIncome ? tx.amount : 0;
    const pengeluaran = !isIncome ? tx.amount : 0;
    const statusTransfer = tx.is_transfer ? "Transfer Antar Kas" : "Biasa";
    const cleanDesc = (tx.description || "").replace(/"/g, '""');
    const cleanCat = (tx.category || "-").replace(/"/g, '""');

    return [
      index + 1,
      `"${tanggal}"`,
      `"${jam}"`,
      `"${kasName}"`,
      `"${isIncome ? "Pemasukan" : "Pengeluaran"}"`,
      `"${cleanCat}"`,
      `"${cleanDesc}"`,
      `"${tx.user_name || "Anggota"}"`,
      pemasukan,
      pengeluaran,
      `"${statusTransfer}"`
    ].join(",");
  });

  // Gabungkan dengan BOM UTF-8 (\uFEFF) agar Microsoft Excel membuka karakter & aksen dengan sempurna
  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");

  // Buat Blob dan download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
