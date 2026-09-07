"use client";

import { useMemo } from "react";
import { Account } from "@/types/database";
import { formatRupiah } from "@/lib/format";
import { PieChart, ArrowLeftRight } from "lucide-react";
import Link from "next/link";

interface AccountWithBalance extends Account {
  calculatedBalance?: number;
}

interface MultiAccountMatrixProps {
  accounts: AccountWithBalance[];
  totalBalance: number;
}

const PALETTE = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-slate-500",
];

const TEXT_PALETTE = [
  "text-emerald-600",
  "text-blue-600",
  "text-purple-600",
  "text-amber-600",
  "text-rose-600",
  "text-teal-600",
  "text-indigo-600",
  "text-orange-600",
  "text-slate-600",
];

export default function MultiAccountMatrix({
  accounts,
  totalBalance,
}: MultiAccountMatrixProps) {
  const sortedAccounts = useMemo(() => {
    return [...accounts]
      .map((acc, idx) => {
        const bal = Math.max(Number(acc.calculatedBalance ?? acc.initial_balance ?? 0), 0);
        const percentage = totalBalance > 0 ? Math.round((bal / totalBalance) * 100) : 0;
        return {
          ...acc,
          currentBal: bal,
          percentage,
          colorBg: PALETTE[idx % PALETTE.length],
          colorText: TEXT_PALETTE[idx % TEXT_PALETTE.length],
        };
      })
      .sort((a, b) => b.currentBal - a.currentBal);
  }, [accounts, totalBalance]);

  if (accounts.length <= 1 || totalBalance <= 0) return null;

  return (
    <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] p-5 shadow-xl shadow-slate-200/50 border border-white/50 space-y-3 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PieChart size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800">Alokasi Saldo Multi-Kas</h3>
            <p className="text-[10px] text-slate-400 font-medium">Proporsi sebaran dana di seluruh dompet & rekening</p>
          </div>
        </div>

        <Link
          href="/transaksi/transfer"
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-[11px] font-bold text-slate-700 active:scale-95 transition-all shadow-sm"
        >
          <ArrowLeftRight size={13} className="text-indigo-600" />
          <span>Transfer Antar Kas</span>
        </Link>
      </div>

      {/* Segmented Multi-Color Progress Bar */}
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
        {sortedAccounts.map((acc) => {
          if (acc.percentage <= 0) return null;
          return (
            <div
              key={acc.id}
              className={`${acc.colorBg} h-full transition-all hover:opacity-80`}
              style={{ width: `${acc.percentage}%` }}
              title={`${acc.name}: ${formatRupiah(acc.currentBal)} (${acc.percentage}%)`}
            />
          );
        })}
      </div>

      {/* Accounts Proportion Chips List */}
      <div className="flex flex-wrap gap-2 pt-1">
        {sortedAccounts.map((acc) => (
          <Link
            key={acc.id}
            href={`/kas/${acc.id}`}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-[11px] transition-colors"
          >
            <span className={`w-2 h-2 rounded-full ${acc.colorBg} shrink-0`} />
            <span className="font-bold text-slate-700 truncate max-w-[100px]">{acc.name}</span>
            <span className={`font-black ${acc.colorText}`}>{acc.percentage}%</span>
            <span className="text-[10px] text-slate-400 font-medium">({formatRupiah(acc.currentBal)})</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
