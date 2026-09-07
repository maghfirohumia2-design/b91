"use client";

import { useState } from "react";
import { DebtLoan } from "@/types/database";
import { formatRupiah } from "@/lib/format";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  CheckCircle2, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  History, 
  Coins 
} from "lucide-react";

interface DebtCardProps {
  debt: DebtLoan;
  onPay: (debt: DebtLoan) => void;
  onHistory: (debt: DebtLoan) => void;
  onEdit: (debt: DebtLoan) => void;
  onDelete: (debt: DebtLoan) => void;
}

export default function DebtCard({
  debt,
  onPay,
  onHistory,
  onEdit,
  onDelete,
}: DebtCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const isDebt = debt.type === "debt"; // Hutang (kita berhutang)
  const isPaid = debt.status === "paid" || Number(debt.paid_amount) >= Number(debt.total_amount);
  const remaining = Math.max(Number(debt.total_amount) - Number(debt.paid_amount || 0), 0);
  const percent = Math.min(Math.round(((debt.paid_amount || 0) / debt.total_amount) * 100), 100);

  return (
    <div
      className={`bg-white rounded-3xl p-5 border transition-all relative shadow-sm hover:shadow-md ${
        isPaid
          ? "border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50/20"
          : isDebt
          ? "border-red-100/80"
          : "border-teal-100/80"
      }`}
    >
      {/* Top Header: Badge, Person Name & Menu */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner shrink-0 ${
              isDebt
                ? "bg-red-50 text-red-600 border border-red-100"
                : "bg-teal-50 text-teal-600 border border-teal-100"
            }`}
          >
            {isDebt ? <ArrowUpRight size={22} /> : <ArrowDownLeft size={22} />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                  isDebt
                    ? "bg-red-100/80 text-red-700"
                    : "bg-teal-100/80 text-teal-700"
                }`}
              >
                {isDebt ? "Hutang Saya" : "Piutang Saya"}
              </span>
              {isPaid && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                  <CheckCircle2 size={12} /> Lunas
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-800 text-sm leading-tight">{debt.person_name}</h3>
            {debt.description && (
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
                {debt.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5 z-20 min-w-[140px] animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onHistory(debt);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                >
                  <History size={13} /> Riwayat Cicilan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(debt);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                >
                  <Edit3 size={13} /> Edit Data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(debt);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
                >
                  <Trash2 size={13} /> Hapus
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar & Nominal Info */}
      <div className="space-y-2 py-2 border-t border-slate-50">
        <div className="flex justify-between items-center text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Progress Pelunasan ({percent}%)
          </span>
          <span className="font-bold text-slate-700">
            {formatRupiah(debt.paid_amount || 0)} / {formatRupiah(debt.total_amount)}
          </span>
        </div>

        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isPaid
                ? "bg-emerald-500"
                : isDebt
                ? "bg-red-500"
                : "bg-teal-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex justify-between items-center pt-1 text-xs">
          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
            {debt.due_date ? (
              <>
                <Calendar size={12} className="text-slate-400" />
                <span>Jatuh tempo: {new Date(debt.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
              </>
            ) : (
              <span>Tanpa batas tempo</span>
            )}
          </div>

          <div className="text-right">
            <p className="text-[9px] uppercase font-bold text-slate-400">Sisa {isDebt ? "Hutang" : "Piutang"}</p>
            <p className={`text-sm font-black ${isPaid ? "text-emerald-600" : isDebt ? "text-red-600" : "text-teal-600"}`}>
              {formatRupiah(remaining)}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onHistory(debt)}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 py-1 px-2 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <History size={13} />
          <span>Lihat Log ({percent}%)</span>
        </button>

        {!isPaid ? (
          <button
            type="button"
            onClick={() => onPay(debt)}
            className={`px-4 py-2 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all ${
              isDebt
                ? "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-200"
                : "bg-gradient-to-r from-teal-500 to-emerald-600 shadow-teal-200"
            }`}
          >
            <Coins size={14} />
            <span>{isDebt ? "Bayar Cicilan" : "Terima Bayaran"}</span>
          </button>
        ) : (
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 py-1">
            <CheckCircle2 size={15} /> Sudah Lunas
          </span>
        )}
      </div>
    </div>
  );
}
