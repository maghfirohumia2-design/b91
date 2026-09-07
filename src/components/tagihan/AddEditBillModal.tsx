"use client";

import { useState } from "react";
import { RecurringBill, Account, Category } from "@/types/database";
import { formatNumberInput, parseNumberInput } from "@/lib/format";
import { saveRecurringBill, updateRecurringBillData } from "@/lib/bills";
import { X, Calendar, Wallet, Tag, Loader2, Plus, Edit3, CheckCircle2 } from "lucide-react";

interface AddEditBillModalProps {
  isOpen: boolean;
  editingBill: RecurringBill | null;
  accounts: Account[];
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

const COMMON_BILL_ICONS = ["⚡", "📶", "🏫", "🏥", "🏠", "📺", "🚗", "🛡️", "💧", "🛒", "📱", "💳"];

const COMMON_BILL_CATEGORIES = [
  "Tagihan & Utilitas",
  "Pendidikan",
  "Komunikasi & Internet",
  "Kesehatan",
  "Tempat Tinggal",
  "Langganan & Hiburan",
  "Transportasi",
  "Lain-lain",
];

export default function AddEditBillModal({
  isOpen,
  editingBill,
  accounts,
  categories,
  onClose,
  onSuccess,
}: AddEditBillModalProps) {
  const [title, setTitle] = useState(() => editingBill?.title || "");
  const [amountStr, setAmountStr] = useState(() =>
    editingBill ? formatNumberInput(editingBill.amount.toString()) : ""
  );
  const [dueDay, setDueDay] = useState<number>(() => editingBill?.due_day || 10);
  const [category, setCategory] = useState(() => editingBill?.category || "Tagihan & Utilitas");
  const [selectedAccountId, setSelectedAccountId] = useState(() =>
    editingBill?.account_id || (accounts.length > 0 ? accounts[0].id : "")
  );
  const [icon, setIcon] = useState(() => editingBill?.icon || "⚡");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = parseNumberInput(amountStr);

    if (!title.trim()) {
      setErrorMsg("Nama tagihan harus diisi.");
      return;
    }

    if (nominal <= 0) {
      setErrorMsg("Nominal estimasi tagihan harus lebih dari 0.");
      return;
    }

    if (dueDay < 1 || dueDay > 31) {
      setErrorMsg("Tanggal jatuh tempo harus antara 1 sampai 31.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (editingBill) {
        await updateRecurringBillData(editingBill.id, {
          title: title.trim(),
          amount: nominal,
          due_day: dueDay,
          category,
          account_id: selectedAccountId || null,
          icon,
        });
      } else {
        await saveRecurringBill({
          title: title.trim(),
          amount: nominal,
          due_day: dueDay,
          category,
          account_id: selectedAccountId || null,
          icon,
          is_active: true,
          last_paid_at: null,
        });
      }

      onSuccess();
      onClose();
    } catch {
      setErrorMsg("Gagal menyimpan tagihan rutin.");
    } finally {
      setLoading(false);
    }
  };

  const availableCategories = categories.length > 0
    ? Array.from(new Set([...categories.map((c) => c.name), ...COMMON_BILL_CATEGORIES]))
    : COMMON_BILL_CATEGORIES;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] flex flex-col pb-safe">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              {editingBill ? <Edit3 size={18} /> : <Plus size={18} />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800">
                {editingBill ? "Edit Tagihan Rutin" : "Tambah Tagihan Rutin"}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Atur estimasi dan tanggal jatuh tempo bulanan
              </p>
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
          <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Ikon Picker */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Pilih Ikon Tagihan
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_BILL_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-2xl text-lg flex items-center justify-center transition-all ${
                    icon === emoji
                      ? "bg-amber-100 border-2 border-amber-500 scale-110 shadow-sm"
                      : "bg-slate-50 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Nama Tagihan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Nama Tagihan
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Listrik PLN, WiFi Rumah, SPP Anak"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              required
            />
          </div>

          {/* Nominal Estimasi & Tanggal Jatuh Tempo */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Estimasi (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={amountStr}
                onChange={(e) => setAmountStr(formatNumberInput(e.target.value))}
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar size={11} /> Tgl Jatuh Tempo
              </label>
              <select
                value={dueDay}
                onChange={(e) => setDueDay(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Tgl {d} tiap bulan
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kategori Tagihan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag size={11} /> Kategori Pengeluaran
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Kas Sumber Pembayaran Default */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Wallet size={11} /> Kas Sumber Pembayaran Default
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
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
              className="flex-[2] py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-200 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{editingBill ? "Simpan Perubahan" : "Tambah Tagihan"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
