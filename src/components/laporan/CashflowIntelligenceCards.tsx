"use client";

import { useMemo } from "react";
import { Transaction } from "@/types/database";
import { formatRupiah } from "@/lib/format";
import { 
  CalendarRange, 
  Sparkles, 
  Flame, 
  CreditCard,
  CheckCircle2
} from "lucide-react";

interface CashflowIntelligenceCardsProps {
  transactions: Transaction[];
}

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function CashflowIntelligenceCards({
  transactions,
}: CashflowIntelligenceCardsProps) {
  const expenseTxs = useMemo(() => {
    return transactions.filter((t) => t.type === "expense");
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return expenseTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [expenseTxs]);

  // 1. Weekly Breakdown (Minggu 1 - 4/5)
  const weeklyData = useMemo(() => {
    const weeks = [
      { name: "Minggu 1 (Tgl 1-7)", total: 0 },
      { name: "Minggu 2 (Tgl 8-14)", total: 0 },
      { name: "Minggu 3 (Tgl 15-21)", total: 0 },
      { name: "Minggu 4 (Tgl 22+)", total: 0 },
    ];

    expenseTxs.forEach((t) => {
      const date = new Date(t.created_at);
      const day = date.getDate();

      if (day <= 7) weeks[0].total += Number(t.amount || 0);
      else if (day <= 14) weeks[1].total += Number(t.amount || 0);
      else if (day <= 21) weeks[2].total += Number(t.amount || 0);
      else weeks[3].total += Number(t.amount || 0);
    });

    return weeks;
  }, [expenseTxs]);

  // 2. Day-of-Week Distribution (Hari Puncak Belanja)
  const dayStats = useMemo(() => {
    const counts = Array(7).fill(0);

    expenseTxs.forEach((t) => {
      const date = new Date(t.created_at);
      const dayIdx = date.getDay(); // 0 = Minggu, 6 = Sabtu
      counts[dayIdx] += Number(t.amount || 0);
    });

    let peakDayIdx = 0;
    let maxVal = 0;
    counts.forEach((val, idx) => {
      if (val > maxVal) {
        maxVal = val;
        peakDayIdx = idx;
      }
    });

    return {
      counts,
      peakDay: DAY_NAMES[peakDayIdx],
      peakAmount: maxVal,
    };
  }, [expenseTxs]);

  // 3. Biggest Single Expense
  const biggestExpense = useMemo(() => {
    if (expenseTxs.length === 0) return null;
    return [...expenseTxs].sort((a, b) => b.amount - a.amount)[0];
  }, [expenseTxs]);

  if (expenseTxs.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* 2 Grid Columns: Pola Mingguan & Hari Puncak */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Weekly Breakdown */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarRange size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800">Distribusi Pengeluaran Mingguan</h3>
              <p className="text-[10px] text-slate-400">Pola arus keluar dari awal hingga akhir bulan</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {weeklyData.map((w, idx) => {
              const pct = totalExpense > 0 ? Math.round((w.total / totalExpense) * 100) : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600">{w.name}</span>
                    <span className="font-black text-slate-800">
                      {formatRupiah(w.total)}{" "}
                      <span className="text-[10px] font-bold text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peak Day Distribution */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800">Hari Belanja Tertinggi</h3>
                <p className="text-[10px] text-slate-400">Hari dengan akumulasi pengeluaran terbanyak</p>
              </div>
            </div>

            {/* Peak Day Banner */}
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-amber-600">Puncak Belanja</p>
                <p className="text-sm font-black text-slate-800">Hari {dayStats.peakDay}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-amber-600">Total Hari Ini</p>
                <p className="text-xs font-black text-amber-700">{formatRupiah(dayStats.peakAmount)}</p>
              </div>
            </div>

            {/* Days Mini Bar Chart */}
            <div className="grid grid-cols-7 gap-1.5 pt-1 text-center">
              {DAY_NAMES.map((name, idx) => {
                const isPeak = name === dayStats.peakDay;
                const ratio = dayStats.peakAmount > 0 ? (dayStats.counts[idx] / dayStats.peakAmount) * 100 : 0;
                return (
                  <div key={name} className="flex flex-col items-center gap-1">
                    <div className="w-full h-14 bg-slate-100 rounded-xl flex items-end p-1 overflow-hidden">
                      <div
                        className={`w-full rounded-lg transition-all ${
                          isPeak ? "bg-amber-500" : "bg-slate-300"
                        }`}
                        style={{ height: `${Math.max(ratio, 10)}%` }}
                      />
                    </div>
                    <span
                      className={`text-[9px] font-bold ${
                        isPeak ? "text-amber-600 font-black" : "text-slate-400"
                      }`}
                    >
                      {name.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Smart Financial Insights Banner */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-3xl border border-indigo-100 shadow-sm flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-200 mt-0.5">
          <Sparkles size={20} />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-black text-slate-800 flex items-center gap-1.5">
            <span>Insight Keuangan Cerdas</span>
          </h4>
          <div className="space-y-1 text-slate-600 text-[11px] leading-relaxed">
            <p className="flex items-start gap-1.5">
              <CheckCircle2 size={13} className="text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Puncak arus keluar terjadi pada hari <strong className="text-slate-800">{dayStats.peakDay}</strong> dengan total akumulasi {formatRupiah(dayStats.peakAmount)}.
              </span>
            </p>
            {biggestExpense && (
              <p className="flex items-start gap-1.5">
                <CreditCard size={13} className="text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  Transaksi pengeluaran terbesar: <strong className="text-slate-800">{biggestExpense.description || biggestExpense.category}</strong> sebesar {formatRupiah(biggestExpense.amount)}.
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
