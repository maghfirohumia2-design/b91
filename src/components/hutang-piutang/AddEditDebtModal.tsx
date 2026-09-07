"use client";

import { useState } from "react";
import { DebtLoan, DebtType, Account } from "@/types/database";
import { formatNumberInput, parseNumberInput } from "@/lib/format";
import { saveDebtLoan, updateDebtLoanData } from "@/lib/debts";
import { X, ArrowUpRight, ArrowDownLeft, Loader2, Calendar, Wallet, CheckCircle2, User } from "lucide-react";

interface AddEditDebtModalProps {
  isOpen: boolean;
  editingDebt: DebtLoan | null;
  accounts: Account[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEditDebtModal({
  isOpen,
  editingDebt,
  accounts,
  onClose,
  onSuccess,
}: AddEditDebtModalProps) {
  const [type, setType] = useState<DebtType>(() => editingDebt?.type || "debt");
  const [personName, setPersonName] = useState(() => editingDebt?.person_name || "");
  const [totalAmountStr, setTotalAmountStr] = useState(() =>
    editingDebt ? formatNumberInput(editingDebt.total_amount.toString()) : ""
  );
  const [paidAmountStr, setPaidAmountStr] = useState(() =>
    editingDebt?.paid_amount ? formatNumberInput(editingDebt.paid_amount.toString()) : "0"
  );
  const [dueDate, setDueDate] = useState(() => editingDebt?.due_date || "");
  const [description, setDescription] = useState(() => editingDebt?.description || "");
  const [accountId, setAccountId] = useState(() => editingDebt?.account_id || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalNominal = parseNumberInput(totalAmountStr);
    const paidNominal = parseNumberInput(paidAmountStr);

    if (!personName.trim()) {
      setErrorMsg("Nama pihak / orang / lembaga harus diisi.");
      return;
    }

    if (totalNominal <= 0) {
      setErrorMsg("Total nominal pinjaman harus lebih dari 0.");
      return;
    }

    if (paidNominal > totalNominal) {
      setErrorMsg("Nominal yang sudah dicicil tidak boleh melebihi total pinjaman.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const status = paidNominal >= totalNominal ? "paid" : paidNominal > 0 ? "partial" : "unpaid";

    try {
      if (editingDebt) {
        await updateDebtLoanData(editingDebt.id, {
          type,
          person_name: personName.trim(),
          total_amount: totalNominal,
          paid_amount: paidNominal,
          due_date: dueDate || null,
          description: description.trim() || null,
          account_id: accountId || null,
          status,
        });
      } else {
        await saveDebtLoan({
          type,
          person_name: personName.trim(),
          total_amount: totalNominal,
          paid_amount: paidNominal,
          due_date: dueDate || null,
          description: description.trim() || null,
          account_id: accountId || null,
          status,
        });
      }

      onSuccess();
      onClose();
    } catch {
      setErrorMsg("Gagal menyimpan data hutang/piutang.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] flex flex-col pb-safe">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-black text-slate-800">
              {editingDebt ? "Edit Data Pinjaman" : "Catat Hutang / Piutang"}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Pantau pinjaman keluarga secara rapi dan transparan
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Type Toggle: Hutang vs Piutang */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setType("debt")}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              type === "debt"
                ? "bg-red-500 text-white shadow-md shadow-red-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ArrowUpRight size={15} />
            <span>Hutang (Kita Pinjam)</span>
          </button>
          <button
            type="button"
            onClick={() => setType("loan")}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              type === "loan"
                ? "bg-teal-600 text-white shadow-md shadow-teal-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ArrowDownLeft size={15} />
            <span>Piutang (Orang Pinjam)</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Nama Pihak */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <User size={11} /> {type === "debt" ? "Nama Pemberi Pinjaman / Lembaga" : "Nama Peminjam / Yang Berhutang"}
            </label>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder={type === "debt" ? "e.g. Bank Mandiri, Om Budi, Koperasi" : "e.g. Kak Rina, Tetangga, Teman Kantor"}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
              required
            />
          </div>

          {/* Nominal Pokok */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total Nominal Pinjaman (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={totalAmountStr}
              onChange={(e) => setTotalAmountStr(formatNumberInput(e.target.value))}
              placeholder="0"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
              required
            />
          </div>

          {/* Sudah Dicicil (Awal) & Jatuh Tempo */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Sudah Dicicil (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={paidAmountStr}
                onChange={(e) => setPaidAmountStr(formatNumberInput(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar size={11} /> Jatuh Tempo
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Keterangan / Keperluan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Keperluan / Catatan Pinjaman
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Renovasi rumah, modal usaha, beli motor"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
            />
          </div>

          {/* Kas Terkait (Opsional) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Wallet size={11} /> Hubungkan Kas Terkait (Opsional)
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
            >
              <option value="">-- Pilih Kas (Opsional) --</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
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
                type === "debt"
                  ? "bg-gradient-to-r from-red-600 to-rose-600 shadow-red-200"
                  : "bg-gradient-to-r from-teal-600 to-emerald-600 shadow-teal-200"
              }`}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{editingDebt ? "Simpan Perubahan" : "Simpan Catatan"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
