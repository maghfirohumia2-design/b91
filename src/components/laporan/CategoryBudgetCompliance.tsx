"use client";

import { useMemo } from "react";
import { Transaction, Category } from "@/types/database";
import { formatRupiah } from "@/lib/format";
import { Target, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";

interface CategoryBudgetComplianceProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function CategoryBudgetCompliance({
  transactions,
  categories,
}: CategoryBudgetComplianceProps) {
  const expenseCategoriesWithBudget = useMemo(() => {
    return categories.filter((c) => c.type === "expense" && Number(c.budget_limit) > 0);
  }, [categories]);

  const complianceData = useMemo(() => {
    const expenseTxs = transactions.filter((t) => t.type === "expense");
    const spentMap: Record<string, number> = {};

    expenseTxs.forEach((t) => {
      if (t.category) {
        spentMap[t.category] = (spentMap[t.category] || 0) + Number(t.amount || 0);
      }
    });

    const items = expenseCategoriesWithBudget.map((cat) => {
      const spent = spentMap[cat.name] || 0;
      const limit = Number(cat.budget_limit) || 0;
      const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const isOver = spent > limit;
      const isWarning = percent >= 70 && !isOver;

      return {
        cat,
        spent,
        limit,
        percent,
        isOver,
        isWarning,
      };
    });

    const totalBudget = items.reduce((acc, i) => acc + i.limit, 0);
    const totalSpentInBudgeted = items.reduce((acc, i) => acc + i.spent, 0);
    const overbudgetCount = items.filter((i) => i.isOver).length;
    const safeCount = items.length - overbudgetCount;

    return {
      items,
      totalBudget,
      totalSpentInBudgeted,
      overbudgetCount,
      safeCount,
      overallPercent: totalBudget > 0 ? Math.round((totalSpentInBudgeted / totalBudget) * 100) : 0,
    };
  }, [transactions, expenseCategoriesWithBudget]);

  if (expenseCategoriesWithBudget.length === 0) return null;

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Target size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800">Evaluasi Batas Anggaran Kategori</h3>
            <p className="text-[10px] text-slate-400">Realisasi pengeluaran vs target limit anggaran</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {complianceData.overbudgetCount > 0 ? (
            <span className="px-2.5 py-1 rounded-xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black flex items-center gap-1">
              <AlertTriangle size={11} /> {complianceData.overbudgetCount} Overbudget
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black flex items-center gap-1">
              <CheckCircle2 size={11} /> Semua Anggaran Aman
            </span>
          )}
        </div>
      </div>

      {/* Categories Budget Progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {complianceData.items.map(({ cat, spent, limit, percent, isOver, isWarning }) => (
          <div
            key={cat.id}
            className={`p-3 rounded-2xl border transition-all ${
              isOver
                ? "bg-red-50/50 border-red-200"
                : isWarning
                ? "bg-amber-50/40 border-amber-200"
                : "bg-slate-50/60 border-slate-100"
            }`}
          >
            <div className="flex justify-between items-center text-xs mb-1.5">
              <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                <span>{cat.icon}</span>
                <span className="font-bold text-slate-700 truncate">{cat.name}</span>
              </div>
              <div className="text-right">
                <span className={`font-black ${isOver ? "text-red-600" : "text-slate-800"}`}>
                  {formatRupiah(spent)}
                </span>
                <span className="text-[10px] text-slate-400 font-bold ml-1">
                  / {formatRupiah(limit)}
                </span>
              </div>
            </div>

            <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all ${
                  isOver
                    ? "bg-red-500 animate-pulse"
                    : isWarning
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px]">
              <span
                className={`font-semibold flex items-center gap-0.5 ${
                  isOver ? "text-red-600" : isWarning ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {isOver ? (
                  <>
                    <AlertTriangle size={10} /> Overbudget ({percent}%)
                  </>
                ) : isWarning ? (
                  <>
                    <AlertTriangle size={10} /> Waspada ({percent}%)
                  </>
                ) : (
                  <>
                    <ShieldCheck size={10} /> Aman ({percent}%)
                  </>
                )}
              </span>
              <span className="text-slate-400">
                {isOver
                  ? `Lebih ${formatRupiah(spent - limit)}`
                  : `Sisa ${formatRupiah(limit - spent)}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
