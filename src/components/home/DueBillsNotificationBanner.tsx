"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RecurringBill } from "@/types/database";
import { getRecurringBills, getBillStatus } from "@/lib/bills";
import { formatRupiah } from "@/lib/format";
import { BellRing, AlertCircle, ArrowRight } from "lucide-react";

export default function DueBillsNotificationBanner() {
  const [urgentBills, setUrgentBills] = useState<{ bill: RecurringBill; message: string; isOverdue: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function checkBills() {
      try {
        const bills = await getRecurringBills();
        if (!isMounted) return;

        const urgent = bills
          .filter((b) => b.is_active)
          .map((b) => {
            const statusInfo = getBillStatus(b);
            return {
              bill: b,
              message: statusInfo.message,
              isOverdue: statusInfo.status === "overdue",
              isDueSoon: statusInfo.status === "due_soon",
            };
          })
          .filter((item) => item.isOverdue || item.isDueSoon);

        setUrgentBills(urgent);
      } catch (err) {
        console.error("Error checking urgent bills:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkBills();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || urgentBills.length === 0) return null;

  const hasOverdue = urgentBills.some((b) => b.isOverdue);
  const totalAmount = urgentBills.reduce((sum, item) => sum + Number(item.bill.amount || 0), 0);

  return (
    <div
      className={`p-4 rounded-3xl border shadow-lg transition-all animate-in fade-in slide-in-from-top-4 relative overflow-hidden ${
        hasOverdue
          ? "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-red-500 shadow-red-200/50"
          : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-amber-400 shadow-orange-200/50"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/30 shadow-inner">
            {hasOverdue ? (
              <AlertCircle size={22} className="animate-bounce" />
            ) : (
              <BellRing size={22} className="animate-pulse" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                {hasOverdue ? "⚠️ Tagihan Terlewat!" : "🔔 Tagihan Mendekati Batas"}
              </span>
              <span className="text-xs font-bold opacity-90">({urgentBills.length} Tagihan)</span>
            </div>
            <h4 className="text-sm font-black mt-0.5">
              Total {formatRupiah(totalAmount)} Perlu Dibayar
            </h4>
            <p className="text-[11px] text-white/90 line-clamp-1 mt-0.5">
              {urgentBills.map((u) => `${u.bill.title} (${u.message})`).join(" • ")}
            </p>
          </div>
        </div>

        <Link
          href="/tagihan"
          className="px-3.5 py-2 bg-white text-slate-900 font-bold rounded-2xl text-xs hover:bg-slate-100 active:scale-95 transition-all shadow-md shrink-0 flex items-center gap-1"
        >
          <span>Bayar</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
