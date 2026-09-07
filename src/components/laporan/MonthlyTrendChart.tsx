"use client";

import { BarChart3 } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { Transaction } from "@/types/database";

interface MonthlyTrendChartProps {
  transactions: Transaction[];
}

interface MonthData {
  monthKey: string; // e.g. "2026-08"
  label: string; // e.g. "Agu 26"
  income: number;
  expense: number;
}

export default function MonthlyTrendChart({ transactions }: MonthlyTrendChartProps) {
  if (!transactions || transactions.length === 0) return null;

  // Kelompokkan transaksi per bulan (6 bulan terakhir atau sesuai data)
  const monthMap = new Map<string, { income: number; expense: number; label: string }>();

  transactions.forEach((tx) => {
    const d = new Date(tx.created_at);
    if (isNaN(d.getTime())) return;

    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });

    const current = monthMap.get(monthKey) || { income: 0, expense: 0, label };
    if (tx.type === "income") {
      current.income += tx.amount;
    } else if (tx.type === "expense") {
      current.expense += tx.amount;
    }
    monthMap.set(monthKey, current);
  });

  // Urutkan berdasarkan waktu
  const chartData: MonthData[] = Array.from(monthMap.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .slice(-6) // ambil maksimal 6 bulan terakhir
    .map(([monthKey, val]) => ({
      monthKey,
      label: val.label,
      income: val.income,
      expense: val.expense,
    }));

  if (chartData.length === 0) return null;

  // Nilai maksimum untuk skala tinggi grafik
  const maxVal = Math.max(
    ...chartData.map((d) => Math.max(d.income, d.expense)),
    100000
  );

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BarChart3 size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800">Tren Pemasukan vs Pengeluaran</h3>
            <p className="text-[10px] text-slate-400">Perbandingan riwayat per bulan</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-600">Masuk</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="text-slate-600">Keluar</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="pt-6 pb-2">
        <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-44 border-b border-slate-100 pb-2">
          {chartData.map((item) => {
            const incomeHeight = Math.max(Math.round((item.income / maxVal) * 100), 4);
            const expenseHeight = Math.max(Math.round((item.expense / maxVal) * 100), 4);

            return (
              <div key={item.monthKey} className="flex flex-col items-center h-full justify-end group">
                <div className="flex items-end gap-1 sm:gap-1.5 h-full w-full justify-center">
                  {/* Income Bar */}
                  <div className="w-3 sm:w-4 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full bg-emerald-500 rounded-t-lg transition-all duration-700 group-hover:brightness-110 shadow-sm"
                      style={{ height: `${item.income > 0 ? incomeHeight : 0}%` }}
                      title={`Pemasukan: ${formatRupiah(item.income)}`}
                    />
                  </div>

                  {/* Expense Bar */}
                  <div className="w-3 sm:w-4 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full bg-rose-500 rounded-t-lg transition-all duration-700 group-hover:brightness-110 shadow-sm"
                      style={{ height: `${item.expense > 0 ? expenseHeight : 0}%` }}
                      title={`Pengeluaran: ${formatRupiah(item.expense)}`}
                    />
                  </div>
                </div>

                <span className="text-[10px] font-bold text-slate-400 mt-2 truncate max-w-[48px]">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
