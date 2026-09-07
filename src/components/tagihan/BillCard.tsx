"use client";

import { RecurringBill } from "@/types/database";
import { formatRupiah } from "@/lib/format";
import { getBillStatus } from "@/lib/bills";
import { Calendar, CheckCircle2, AlertCircle, Clock, CreditCard, MoreVertical, Edit3, Trash2 } from "lucide-react";
import { useState } from "react";

interface BillCardProps {
  bill: RecurringBill;
  onPay: (bill: RecurringBill) => void;
  onEdit: (bill: RecurringBill) => void;
  onDelete: (bill: RecurringBill) => void;
}

export default function BillCard({ bill, onPay, onEdit, onDelete }: BillCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const statusInfo = getBillStatus(bill);
  const isPaid = statusInfo.status === "paid";

  return (
    <div className={`bg-white rounded-3xl p-5 border transition-all relative shadow-sm hover:shadow-md ${
      isPaid ? "border-emerald-100/80 bg-gradient-to-br from-white to-emerald-50/20" : "border-slate-100"
    }`}>
      {/* Top Row: Icon, Title, Status & Menu */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shadow-inner shrink-0">
            {bill.icon || "⚡"}
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm leading-tight mb-0.5">{bill.title}</h3>
            <span className="text-[11px] text-slate-400 font-medium">{bill.category}</span>
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
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)} 
              />
              <div className="absolute right-0 top-8 bg-white border border-slate-100 rounded-2xl shadow-xl p-1.5 z-20 min-w-[130px] animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(bill);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                >
                  <Edit3 size={13} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(bill);
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

      {/* Middle Row: Due Info Badge & Nominal */}
      <div className="flex items-center justify-between py-2 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar size={13} className="text-slate-400" />
          <span className="text-slate-500 font-medium">Tgl {bill.due_day} tiap bulan</span>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Estimasi</p>
          <p className="text-base font-black text-slate-800">{formatRupiah(bill.amount)}</p>
        </div>
      </div>

      {/* Bottom Row: Status Badge & Pay Action */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Status Badge */}
        <div className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 ${statusInfo.badgeClass}`}>
          {isPaid ? (
            <CheckCircle2 size={13} className="shrink-0" />
          ) : statusInfo.status === "overdue" ? (
            <AlertCircle size={13} className="shrink-0" />
          ) : (
            <Clock size={13} className="shrink-0" />
          )}
          <span>{statusInfo.message}</span>
        </div>

        {/* Action Button */}
        {!isPaid ? (
          <button
            type="button"
            onClick={() => onPay(bill)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-200 active:scale-95 transition-all"
          >
            <CreditCard size={13} />
            <span>Bayar</span>
          </button>
        ) : (
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 size={14} /> Lunas
          </span>
        )}
      </div>
    </div>
  );
}
