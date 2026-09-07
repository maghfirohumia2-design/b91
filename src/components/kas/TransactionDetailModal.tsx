"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  X, 
  Trash2, 
  Edit3, 
  Loader2, 
  Calendar, 
  User, 
  Tag, 
  ExternalLink,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";
import { formatRupiah, formatDateIndo, formatTimeIndo } from "@/lib/format";
import { Transaction, Account } from "@/types/database";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  account: Account | null;
  isDeleting: boolean;
  onClose: () => void;
  onDelete: (tx: Transaction) => void;
}

export default function TransactionDetailModal({
  transaction,
  account,
  isDeleting,
  onClose,
  onDelete
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  const isIncome = transaction.type === "income";

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 pb-safe max-h-[90vh] flex flex-col">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 ${
            isIncome 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {isIncome ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
            {isIncome ? "Pemasukan" : "Pengeluaran"}
            {transaction.is_transfer && " (Transfer)"}
          </span>

          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Amount Big Display */}
        <div className="text-center my-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Nominal Transaksi</p>
          <h2 className={`text-3xl font-black ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
            {isIncome ? "+" : "-"}{formatRupiah(transaction.amount)}
          </h2>
          <p className="text-sm font-bold text-slate-700 mt-1">{transaction.description || "Tanpa keterangan"}</p>
        </div>

        {/* Receipt Image Preview */}
        {transaction.receipt_url && (
          <div className="my-4 bg-slate-50 p-2 rounded-2xl border border-slate-200 text-center">
            <div className="relative w-full h-44 rounded-xl overflow-hidden mb-2 bg-slate-100">
              <Image 
                src={transaction.receipt_url} 
                alt="Nota Transaksi" 
                fill 
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            <a 
              href={transaction.receipt_url} 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink size={12} /> Buka Foto Nota Ukuran Penuh
            </a>
          </div>
        )}

        {/* Metadata List */}
        <div className="bg-slate-50 rounded-2xl p-4 my-3 border border-slate-100 space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Tag size={14} /> Kategori
            </span>
            <span className="font-black text-slate-800">{transaction.category || "-"}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Receipt size={14} /> Kas / Dompet
            </span>
            <span className="font-bold text-slate-700">{account?.name || "-"}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <User size={14} /> Dicatat Oleh
            </span>
            <span className="font-bold text-slate-700">{transaction.user_name || "Anggota"}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Calendar size={14} /> Waktu Transaksi
            </span>
            <span className="font-bold text-slate-700">
              {formatDateIndo(transaction.created_at)} • {formatTimeIndo(transaction.created_at)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
          {!transaction.is_transfer && (
            <Link
              href={`/transaksi/edit/${transaction.id}`}
              className="flex-1 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Edit3 size={15} /> Edit
            </Link>
          )}
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onDelete(transaction)}
            className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
