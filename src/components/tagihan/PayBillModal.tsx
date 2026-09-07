"use client";

import { useState } from "react";
import { RecurringBill, Account } from "@/types/database";
import { formatNumberInput, parseNumberInput, formatRupiah } from "@/lib/format";
import { executePayBill } from "@/lib/bills";
import { useAuth } from "@/components/AuthProvider";
import { X, Loader2, Wallet, CheckCircle2, AlertCircle } from "lucide-react";

interface PayBillModalProps {
  isOpen: boolean;
  bill: RecurringBill | null;
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function PayBillModal({
  isOpen,
  bill,
  accounts,
  onClose,
  onSuccess,
}: PayBillModalProps) {
  const { session, profile } = useAuth();
  const userName = session?.user?.user_metadata?.full_name || profile?.full_name || "Anggota Keluarga";

  const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
    return bill?.account_id || (accounts.length > 0 ? accounts[0].id : "");
  });
  const [amountStr, setAmountStr] = useState<string>(() => {
    return bill ? formatNumberInput(bill.amount.toString()) : "";
  });
  const [customDescription, setCustomDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !bill) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = parseNumberInput(amountStr);

    if (nominal <= 0) {
      setErrorMsg("Nominal pembayaran harus lebih dari 0.");
      return;
    }

    if (!selectedAccountId) {
      setErrorMsg("Pilih sumber kas untuk pembayaran.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await executePayBill({
      bill,
      accountId: selectedAccountId,
      amount: nominal,
      userName,
      customDescription: customDescription.trim() || undefined,
    });

    setLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || "Gagal memproses pembayaran tagihan.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] flex flex-col pb-safe">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-inner">
              {bill.icon || "⚡"}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Bayar Tagihan</h3>
              <p className="text-[11px] text-slate-400 font-medium">{bill.title}</p>
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

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePay} className="space-y-4">
          {/* Bill Info Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Kategori</p>
              <p className="font-bold text-slate-700">{bill.category}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Estimasi Tagihan</p>
              <p className="font-bold text-slate-700">{formatRupiah(bill.amount)}</p>
            </div>
          </div>

          {/* Sumber Kas */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Wallet size={12} /> Bayar Menggunakan Kas
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nominal Aktual */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Nominal yang Dibayarkan (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={amountStr}
              onChange={(e) => setAmountStr(formatNumberInput(e.target.value))}
              placeholder="0"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              required
            />
          </div>

          {/* Catatan / Keterangan Tambahan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Keterangan Transaksi (Opsional)
            </label>
            <input
              type="text"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder={`Pembayaran ${bill.title}`}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
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
              className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-200 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Konfirmasi Pembayaran</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
