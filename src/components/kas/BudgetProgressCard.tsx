"use client";

import { useState } from "react";
import { AlertCircle, Edit2, Loader2, Sparkles, X, Check } from "lucide-react";
import { formatRupiah, formatNumberInput, parseNumberInput } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import { Account, UserProfile } from "@/types/database";

interface BudgetProgressCardProps {
  account: Account;
  monthlyExpense: number;
  profile: UserProfile | null;
  onBudgetUpdated: (newLimit: number) => void;
}

export default function BudgetProgressCard({
  account,
  monthlyExpense,
  profile,
  onBudgetUpdated
}: BudgetProgressCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const budgetLimit = account.budget_limit || 0;
  const hasBudget = budgetLimit > 0;
  const progress = hasBudget ? Math.min(Math.round((monthlyExpense / budgetLimit) * 100), 100) : 0;
  const isOverBudget = hasBudget && monthlyExpense > budgetLimit;
  const sisaBudget = Math.max(0, budgetLimit - monthlyExpense);

  const handleOpenModal = () => {
    setBudgetInput(budgetLimit > 0 ? budgetLimit.toLocaleString("id-ID") : "");
    setShowModal(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseNumberInput(budgetInput);

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("accounts")
        .update({ budget_limit: numLimit })
        .eq("id", account.id);

      if (error) throw error;

      onBudgetUpdated(numLimit);
      setShowModal(false);
    } catch {
      alert("Gagal menyimpan target anggaran.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className={`p-5 rounded-3xl border transition-all ${
        isOverBudget 
          ? 'bg-red-50/70 border-red-200' 
          : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isOverBudget ? 'bg-red-100 text-red-600' : 'bg-orange-50 text-orange-600'
            }`}>
              <AlertCircle size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800">Target Anggaran Bulanan</h3>
              <p className="text-[10px] text-slate-400">Batas pengeluaran kas bulan ini</p>
            </div>
          </div>

          {profile?.role === "super_admin" && (
            <button
              onClick={handleOpenModal}
              className="text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
            >
              <Edit2 size={12} /> {hasBudget ? "Ubah Target" : "Pasang Target"}
            </button>
          )}
        </div>

        {hasBudget ? (
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className={`text-xs font-black ${isOverBudget ? 'text-red-600' : 'text-slate-700'}`}>
                {formatRupiah(monthlyExpense)} <span className="text-[10px] font-normal text-slate-400">terpakai dari {formatRupiah(budgetLimit)}</span>
              </span>
              <span className={`text-xs font-black ${isOverBudget ? 'text-red-600' : 'text-orange-600'}`}>
                {progress}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  isOverBudget 
                    ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                    : progress > 80 
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                    : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center mt-2 text-[10px] font-bold">
              <span className={isOverBudget ? 'text-red-600' : 'text-slate-400'}>
                {isOverBudget ? '⚠️ Melebihi Batas Anggaran!' : `Sisa Anggaran: ${formatRupiah(sisaBudget)}`}
              </span>
              <span className="text-slate-400">Reset tiap awal bulan</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-400 font-medium">Belum ada batas anggaran yang ditetapkan untuk kas ini.</p>
          </div>
        )}
      </div>

      {/* Modal Pasang/Ubah Budget */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 pb-safe">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>

            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Sparkles className="text-orange-500" size={20} />
                Batas Anggaran Bulanan
              </h3>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Tentukan batas maksimal pengeluaran bulanan untuk kas <span className="font-bold text-slate-800">{account.name}</span>.
            </p>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nominal Batas Anggaran (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(formatNumberInput(e.target.value))}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Masukkan 0 atau kosongkan untuk menonaktifkan batas anggaran.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3.5 text-white font-bold bg-orange-500 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-200 hover:bg-orange-600 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
