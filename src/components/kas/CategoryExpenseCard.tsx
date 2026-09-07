"use client";

import { PieChart } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { Transaction, Category } from "@/types/database";

interface CategoryExpenseCardProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function CategoryExpenseCard({
  transactions,
  categories
}: CategoryExpenseCardProps) {
  // Hitung pengeluaran per kategori
  const expenseTxs = transactions.filter(t => t.type === "expense");
  const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);

  if (totalExpense === 0) return null;

  const categoryMap = new Map<string, number>();
  expenseTxs.forEach(t => {
    const cat = t.category || "Lain-lain";
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.amount);
  });

  const sortedCategories = Array.from(categoryMap.entries())
    .map(([catName, amount]) => {
      const matchDb = categories.find(c => c.name === catName);
      const icon = matchDb?.icon || (catName.includes(" ") ? catName.split(" ")[0] : "🏷️");
      const percentage = Math.round((amount / totalExpense) * 100);
      return { name: catName, amount, icon, percentage };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5); // Tampilkan Top 5 Kategori

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
          <PieChart size={16} />
        </div>
        <div>
          <h3 className="text-xs font-black text-slate-800">Top Pengeluaran Kategori</h3>
          <p className="text-[10px] text-slate-400">Distribusi pengeluaran kas terbesar</p>
        </div>
      </div>

      <div className="space-y-3">
        {sortedCategories.map(cat => (
          <div key={cat.name} className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <span className="text-sm">{cat.icon}</span> {cat.name}
              </span>
              <div className="text-right">
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
    </div>
  );
}
