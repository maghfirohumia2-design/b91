"use client";

import { useEffect, useState } from "react";
import { DebtLoan, DebtPayment } from "@/types/database";
import { getDebtPayments } from "@/lib/debts";
import { formatRupiah } from "@/lib/format";
import { X, History, Loader2, Calendar, Wallet, FileText, CheckCircle2 } from "lucide-react";

interface DebtPaymentHistoryModalProps {
  isOpen: boolean;
  debt: DebtLoan | null;
  onClose: () => void;
}

export default function DebtPaymentHistoryModal({
  isOpen,
  debt,
  onClose,
}: DebtPaymentHistoryModalProps) {
  const [payments, setPayments] = useState<DebtPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      if (!debt) return;
      setLoading(true);
      const data = await getDebtPayments(debt.id);
      if (isMounted) {
        setPayments(data);
        setLoading(false);
      }
    }

    if (isOpen && debt) {
      fetchHistory();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, debt]);

  if (!isOpen || !debt) return null;

  const isDebt = debt.type === "debt";

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[85vh] flex flex-col pb-safe">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <History size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">Riwayat Cicilan</h3>
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

        {/* Summary Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs mb-4">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Pinjaman</p>
            <p className="font-bold text-slate-700">{formatRupiah(debt.total_amount)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Terbayar</p>
            <p className="font-bold text-emerald-600">{formatRupiah(debt.paid_amount || 0)}</p>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="animate-spin" size={24} />
              <p className="text-xs font-bold">Memuat riwayat...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-xs font-bold text-slate-600 mb-1">Belum Ada Riwayat Cicilan</p>
              <p className="text-[11px] text-slate-400">
                Tekan tombol {isDebt ? '"Bayar Cicilan"' : '"Terima Bayaran"'} untuk mencatat pembayaran.
              </p>
            </div>
          ) : (
            payments.map((p, idx) => (
              <div
                key={p.id || idx}
                className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      {isDebt ? "Pembayaran Cicilan" : "Penerimaan Cicilan"}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {new Date(p.payment_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {p.accounts?.name && (
                        <span className="flex items-center gap-1">
                          <Wallet size={10} />
                          {p.accounts.name}
                        </span>
                      )}
                    </div>
                    {p.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md">
                        <FileText size={10} className="shrink-0 text-slate-400" />
                        <span>{p.notes}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-emerald-600">
                    +{formatRupiah(p.amount)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Close Action */}
        <div className="pt-4 border-t border-slate-100 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs hover:bg-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
