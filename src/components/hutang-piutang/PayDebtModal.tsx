"use client";

import { useState } from "react";
import { DebtLoan, Account } from "@/types/database";
import { formatNumberInput, parseNumberInput, formatRupiah } from "@/lib/format";
import { recordDebtPayment } from "@/lib/debts";
import { useAuth } from "@/components/AuthProvider";
import { X, Loader2, Wallet, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface PayDebtModalProps {
  isOpen: boolean;
  debt: DebtLoan | null;
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function PayDebtModal({
  isOpen,
  debt,
  accounts,
  onClose,
  onSuccess,
}: PayDebtModalProps) {
  const { session, profile } = useAuth();
  const userName = session?.user?.user_metadata?.full_name || profile?.full_name || "Anggota Keluarga";

  const isDebt = debt?.type === "debt";
  const remaining = debt ? Math.max(Number(debt.total_amount) - Number(debt.paid_amount || 0), 0) : 0;

  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    return debt?.account_id || (accounts.length > 0 ? accounts[0].id : "");
  });
  const [amountStr, setAmountStr] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !debt) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = parseNumberInput(amountStr);

    if (nominal <= 0) {
      setErrorMsg("Nominal pembayaran cicilan harus lebih dari 0.");
      return;
    }

    if (nominal > remaining) {
      setErrorMsg(`Nominal melebihi sisa ${isDebt ? "hutang" : "piutang"} (${formatRupiah(remaining)}).`);
      return;
    }

    if (!selectedAccountId) {
      setErrorMsg("Pilih kas yang digunakan untuk transaksi.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await recordDebtPayment({
      debt,
      accountId: selectedAccountId,
      amount: nominal,
      userName,
      notes: notes.trim() || undefined,
    });

    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || "Gagal memproses pembayaran cicilan.");
    }
  };

  const setHalfAmount = () => {
    const half = Math.round(remaining / 2);
    setAmountStr(formatNumberInput(half.toString()));
  };

  const setFullAmount = () => {
    setAmountStr(formatNumberInput(remaining.toString()));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] flex flex-col pb-safe">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                isDebt ? "bg-red-50 text-red-600" : "bg-teal-50 text-teal-600"
              }`}
            >
              {isDebt ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">
                {isDebt ? "Bayar Cicilan Hutang" : "Terima Pembayaran Piutang"}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">{debt.person_name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePay} className="space-y-4">
          {/* Summary Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Pokok</p>
              <p className="font-bold text-slate-700">{formatRupiah(debt.total_amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Sisa Belum Lunas</p>
              <p className={`font-black text-sm ${isDebt ? "text-red-600" : "text-teal-600"}`}>
                {formatRupiah(remaining)}
              </p>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={setHalfAmount}
              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[11px] transition-colors"
            >
              Bayar 50%
            </button>
            <button
              type="button"
              onClick={setFullAmount}
              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[11px] transition-colors"
            >
              Lunaskan 100%
            </button>
          </div>

          {/* Nominal Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Nominal Cicilan (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={(e) => setAmountStr(formatNumberInput(e.target.value))}
              placeholder="0"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
              required
            />
          </div>

          {/* Kas Sumber/Penerima */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Wallet size={12} /> {isDebt ? "Potong Saldo Kas" : "Setor ke Saldo Kas"}
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Catatan Cicilan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cicilan ke-2, transfer BCA"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-[2] py-3.5 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all disabled:opacity-50 ${
                isDebt
                  ? "bg-gradient-to-r from-red-600 to-rose-600 shadow-red-200"
                  : "bg-gradient-to-r from-teal-600 to-emerald-600 shadow-teal-200"
              }`}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{isDebt ? "Konfirmasi Bayar Hutang" : "Konfirmasi Terima Uang"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
