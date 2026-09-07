"use client";

import { PieChart, Users } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { Transaction, Category } from "@/types/database";

interface CategoryDistributionProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function CategoryDistribution({
  transactions,
  categories
}: CategoryDistributionProps) {
  const expenseTxs = transactions.filter((t) => t.type === "expense");
  const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);

  // 1. Hitung per Kategori
  const categoryMap = new Map<string, number>();
  expenseTxs.forEach((t) => {
    const cat = t.category || "Lain-lain";
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.amount);
  });

  const sortedCategories = Array.from(categoryMap.entries())
    .map(([catName, amount]) => {
      const matchDb = categories.find((c) => c.name === catName);
      const icon = matchDb?.icon || (catName.includes(" ") ? catName.split(" ")[0] : "🏷️");
      const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      return { name: catName, amount, icon, percentage };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  // 2. Hitung per Anggota
  const userMap = new Map<string, { expense: number; income: number }>();
  transactions.forEach((t) => {
    const user = t.user_name || "Anggota";
    const current = userMap.get(user) || { expense: 0, income: 0 };
    if (t.type === "expense") current.expense += t.amount;
    else if (t.type === "income") current.income += t.amount;
    userMap.set(user, current);
  });

  const memberData = Array.from(userMap.entries())
    .map(([userName, data]) => ({
      userName,
      expense: data.expense,
      income: data.income,
      percentage: totalExpense > 0 ? Math.round((data.expense / totalExpense) * 100) : 0,
    }))
    .sort((a, b) => b.expense - a.expense);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Kolom 1: Distribusi Kategori Pengeluaran */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <PieChart size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800">Distribusi Kategori</h3>
            <p className="text-[10px] text-slate-400">Kategori pengeluaran terbesar</p>
          </div>
        </div>

        {sortedCategories.length > 0 ? (
          <div className="space-y-3">
            {sortedCategories.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5 truncate max-w-[180px]">
                    <span className="text-sm">{cat.icon}</span> {cat.name}
                  </span>
                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-800">{formatRupiah(cat.amount)}</span>
                    <span className="text-[10px] text-slate-400 font-bold ml-1.5">({cat.percentage}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs font-medium">
            Tidak ada data pengeluaran dalam periode ini.
          </div>
        )}
      </div>

      {/* Kolom 2: Aktivitas per Anggota Keluarga */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Users size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800">Aktivitas per Anggota</h3>
            <p className="text-[10px] text-slate-400">Total mutasi dicatat oleh anggota</p>
          </div>
        </div>

        {memberData.length > 0 ? (
          <div className="space-y-3">
            {memberData.map((m) => (
              <div key={m.userName} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-black text-slate-800">{m.userName}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Porsi Pengeluaran: <span className="font-bold text-slate-600">{m.percentage}%</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-rose-600">-{formatRupiah(m.expense)}</p>
                  {m.income > 0 && (
                    <p className="font-bold text-emerald-600 text-[10px]">+{formatRupiah(m.income)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs font-medium">
            Belum ada aktivitas anggota pada filter ini.
          </div>
        )}
      </div>
    </div>
  );
}
