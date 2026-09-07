"use client";

import { TrendingUp, TrendingDown, Scale, CalendarClock, PiggyBank } from "lucide-react";
import { formatRupiah } from "@/lib/format";

interface FinancialSummaryCardsProps {
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  dayCount: number;
}

export default function FinancialSummaryCards({
  totalIncome,
  totalExpense,
  netFlow,
  dayCount,
}: FinancialSummaryCardsProps) {
  const isSurplus = netFlow >= 0;
  const avgDailyExpense = dayCount > 0 ? Math.round(totalExpense / dayCount) : 0;

  // Rasio Tabungan (Savings Rate)
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* 4 KPI Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Total Pemasukan */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <TrendingUp size={16} />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pemasukan</p>
          <h3 className="text-base sm:text-lg font-black text-emerald-600 truncate mt-0.5">
            {formatRupiah(totalIncome)}
          </h3>
        </div>

        {/* 2. Total Pengeluaran */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
            <TrendingDown size={16} />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Pengeluaran</p>
          <h3 className="text-base sm:text-lg font-black text-rose-600 truncate mt-0.5">
            {formatRupiah(totalExpense)}
          </h3>
        </div>

        {/* 3. Arus Kas Bersih (Net Flow) */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
              isSurplus ? "bg-teal-50 text-teal-600" : "bg-red-50 text-red-600"
            }`}
          >
            <Scale size={16} />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {isSurplus ? "Surplus Kas" : "Defisit Kas"}
          </p>
          <h3
            className={`text-base sm:text-lg font-black truncate mt-0.5 ${
              isSurplus ? "text-teal-700" : "text-red-600"
            }`}
          >
            {isSurplus ? "+" : ""}
            {formatRupiah(netFlow)}
          </h3>
        </div>

        {/* 4. Rata-rata Harian */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <CalendarClock size={16} />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata Harian</p>
          <h3 className="text-base sm:text-lg font-black text-slate-800 truncate mt-0.5">
            {formatRupiah(avgDailyExpense)}
            <span className="text-[10px] font-medium text-slate-400">/hari</span>
          </h3>
        </div>
      </div>

      {/* Savings Rate Card */}
      {totalIncome > 0 && (
        <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl text-white shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-amber-300 flex items-center justify-center shrink-0">
              <PiggyBank size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-200">Rasio Tabungan Keluarga</h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    savingsRate >= 30
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : savingsRate >= 15
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                      : savingsRate >= 0
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  {savingsRate >= 30
                    ? "🌟 Sangat Sehat"
                    : savingsRate >= 15
                    ? "🟢 Ideal"
                    : savingsRate >= 0
                    ? "🟡 Waspada"
                    : "🔴 Defisit"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {savingsRate >= 30
                  ? "Keluarga Anda berhasil menyisihkan lebih dari 30% pemasukan. Luar biasa!"
                  : savingsRate >= 15
                  ? "Arus kas sehat dan berada di kisaran target tabungan keluarga ideal."
                  : savingsRate >= 0
                  ? "Margin tabungan tipis. Disarankan untuk memangkas pos pengeluaran sekunder."
                  : "Pengeluaran melebihi pemasukan. Evaluasi pengeluaran bulanan segera."}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-white">{savingsRate}%</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold">Disimpan</p>
          </div>
        </div>
      )}
    </div>
  );
}
