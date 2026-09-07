"use client";

import { Eye, EyeOff, TrendingUp, TrendingDown } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { Account } from "@/types/database";

interface KasHeaderCardProps {
  account: Account;
  balance: number;
  incomeTotal: number;
  expenseTotal: number;
  showBalance: boolean;
  onToggleShowBalance: () => void;
}

export const getGradientForAccount = (name: string) => {
  if (!name) return "from-emerald-500 to-teal-500";
  const lowerName = name.toLowerCase();
  if (lowerName.includes("keluarga") || lowerName.includes("rumah")) return "from-emerald-500 to-teal-500";
  if (lowerName.includes("kantor") || lowerName.includes("psv") || lowerName.includes("kerja")) return "from-blue-500 to-indigo-500";
  if (lowerName.includes("sekolah") || lowerName.includes("pendidikan") || lowerName.includes("kuliah")) return "from-orange-400 to-red-500";
  if (lowerName.includes("mobil") || lowerName.includes("motor") || lowerName.includes("kendaraan")) return "from-purple-500 to-pink-500";
  if (lowerName.includes("belanja") || lowerName.includes("toko")) return "from-pink-500 to-rose-500";
  return "from-slate-700 to-slate-900";
};

export default function KasHeaderCard({
  account,
  balance,
  incomeTotal,
  expenseTotal,
  showBalance,
  onToggleShowBalance
}: KasHeaderCardProps) {
  const gradientClass = getGradientForAccount(account.name);

  return (
    <div className={`w-full rounded-3xl p-6 text-white shadow-xl relative overflow-hidden bg-gradient-to-r ${gradientClass} transition-all duration-300`}>
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-black/10 blur-xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80 bg-white/15 px-2.5 py-1 rounded-full backdrop-blur-sm inline-block">
              {account.name}
            </span>
            {account.description && (
              <p className="text-[11px] text-white/80 font-medium mt-1">{account.description}</p>
            )}
          </div>
          <button 
            type="button"
            onClick={onToggleShowBalance}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white/90"
            title={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
          >
            {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Saldo Display */}
        <div className="my-4">
          <p className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-0.5">Saldo Tersedia</p>
          <h2 className="text-3xl font-black tracking-tight">
            {showBalance ? formatRupiah(balance) : "••••••••"}
          </h2>
        </div>

        {/* Pemasukan vs Pengeluaran Bulan Ini */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-400/20 flex items-center justify-center text-emerald-200">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Pemasukan</p>
              <p className="text-xs font-black text-white">
                {showBalance ? formatRupiah(incomeTotal) : "••••••"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-400/20 flex items-center justify-center text-rose-200">
              <TrendingDown size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Pengeluaran</p>
              <p className="text-xs font-black text-white">
                {showBalance ? formatRupiah(expenseTotal) : "••••••"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
