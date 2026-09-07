"use client";

import { FileSpreadsheet, Printer } from "lucide-react";
import { exportTransactionsToCSV } from "@/lib/export-csv";
import { Transaction, Account } from "@/types/database";

interface ExportActionButtonsProps {
  transactions: Transaction[];
  accounts: Account[];
  selectedAccountName: string;
  periodLabel: string;
}

export default function ExportActionButtons({
  transactions,
  accounts,
  selectedAccountName,
  periodLabel
}: ExportActionButtonsProps) {
  const handleExportCSV = () => {
    const cleanAccountName = selectedAccountName.toLowerCase().replace(/\s+/g, "_");
    const cleanPeriod = periodLabel.toLowerCase().replace(/\s+/g, "_");
    const fileName = `laporan_kas_${cleanAccountName}_${cleanPeriod}.csv`;

    exportTransactionsToCSV(transactions, accounts, fileName);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const isDisabled = transactions.length === 0;

  return (
    <div className="flex flex-wrap gap-2.5 print:hidden">
      {/* Tombol Export Excel / CSV */}
      <button
        type="button"
        disabled={isDisabled}
        onClick={handleExportCSV}
        className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all disabled:opacity-50 disabled:pointer-events-none"
        title="Unduh data dalam format file Excel (.csv)"
      >
        <FileSpreadsheet size={16} />
        <span>Export Excel / CSV</span>
      </button>

      {/* Tombol Cetak / Simpan PDF */}
      <button
        type="button"
        disabled={isDisabled}
        onClick={handlePrintPDF}
        className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-slate-200 transition-all disabled:opacity-50 disabled:pointer-events-none"
        title="Buka menu cetak atau simpan sebagai file PDF"
      >
        <Printer size={16} />
        <span>Cetak / Simpan PDF</span>
      </button>
    </div>
  );
}
