"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  CircleDollarSign,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DebtLoan, Account } from "@/types/database";
import { getDebtsLoans, deleteDebtLoanData } from "@/lib/debts";
import { formatRupiah } from "@/lib/format";
import DebtCard from "@/components/hutang-piutang/DebtCard";
import AddEditDebtModal from "@/components/hutang-piutang/AddEditDebtModal";
import PayDebtModal from "@/components/hutang-piutang/PayDebtModal";
import DebtPaymentHistoryModal from "@/components/hutang-piutang/DebtPaymentHistoryModal";
import { HutangSkeleton } from "@/components/ui/Skeleton";

export default function HutangPiutangPage() {
  const [debts, setDebts] = useState<DebtLoan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "debt" | "loan" | "paid">("all");

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtLoan | null>(null);
  const [payingDebt, setPayingDebt] = useState<DebtLoan | null>(null);
  const [historyDebt, setHistoryDebt] = useState<DebtLoan | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<DebtLoan | null>(null);

  const loadData = async () => {
    try {
      const [fetchedDebts, fetchedAccounts] = await Promise.all([
        getDebtsLoans(),
        supabase.from("accounts").select("*").order("name", { ascending: true }),
      ]);

      setDebts(fetchedDebts);
      if (fetchedAccounts.data) setAccounts(fetchedAccounts.data as Account[]);
    } catch (err) {
      console.error("Error loading debts data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [fetchedDebts, fetchedAccounts] = await Promise.all([
          getDebtsLoans(),
          supabase.from("accounts").select("*").order("name", { ascending: true }),
        ]);

        if (isMounted) {
          setDebts(fetchedDebts);
          if (fetchedAccounts.data) setAccounts(fetchedAccounts.data as Account[]);
        }
      } catch (err) {
        console.error("Error initializing debts data:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalDebtRemaining = 0;
    let totalLoanRemaining = 0;
    let totalPaidAll = 0;
    let debtCount = 0;
    let loanCount = 0;
    let paidCount = 0;

    debts.forEach((d) => {
      const remaining = Math.max(Number(d.total_amount) - Number(d.paid_amount || 0), 0);
      const isPaid = d.status === "paid" || remaining === 0;

      if (isPaid) {
        paidCount++;
      }

      if (d.type === "debt") {
        totalDebtRemaining += remaining;
        debtCount++;
      } else {
        totalLoanRemaining += remaining;
        loanCount++;
      }

      totalPaidAll += Number(d.paid_amount || 0);
    });

    return {
      totalDebtRemaining,
      totalLoanRemaining,
      totalPaidAll,
      debtCount,
      loanCount,
      paidCount,
      allCount: debts.length,
    };
  }, [debts]);

  // Filtered List
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const isPaid = d.status === "paid" || Number(d.paid_amount || 0) >= Number(d.total_amount);
      if (activeTab === "paid") return isPaid;
      if (activeTab === "debt") return d.type === "debt" && !isPaid;
      if (activeTab === "loan") return d.type === "loan" && !isPaid;
      return true;
    });
  }, [debts, activeTab]);

  const handleDelete = async () => {
    if (!deletingDebt) return;
    await deleteDebtLoanData(deletingDebt.id);
    setDeletingDebt(null);
    loadData();
  };

  if (loading) {
    return <HutangSkeleton />;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 pb-28">
      {/* Header */}
      <header className="mb-6 pt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <span>Hutang & Piutang</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Buku catatan kewajiban & hak keuangan</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingDebt(null);
            setShowAddEditModal(true);
          }}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-slate-200 active:scale-95 transition-all"
        >
          <Plus size={15} />
          <span>Catat</span>
        </button>
      </header>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {/* Sisa Hutang Saya */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50/40 p-3.5 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-1.5">
            <ArrowUpRight size={14} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold tracking-wider text-red-700">Hutang Saya</p>
            <p className="text-xs sm:text-sm font-black text-red-700 truncate">
              {formatRupiah(summary.totalDebtRemaining)}
            </p>
          </div>
        </div>

        {/* Sisa Piutang Saya */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50/40 p-3.5 rounded-3xl border border-teal-100 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-1.5">
            <ArrowDownLeft size={14} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold tracking-wider text-teal-700">Piutang Saya</p>
            <p className="text-xs sm:text-sm font-black text-teal-700 truncate">
              {formatRupiah(summary.totalLoanRemaining)}
            </p>
          </div>
        </div>

        {/* Total Pelunasan */}
        <div className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-1.5">
            <CheckCircle2 size={14} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Total Terbayar</p>
            <p className="text-xs sm:text-sm font-black text-slate-800 truncate">
              {formatRupiah(summary.totalPaidAll)}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl mb-5 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === "all"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Semua ({summary.allCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("debt")}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === "debt"
              ? "bg-white text-red-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Hutang ({summary.debtCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("loan")}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === "loan"
              ? "bg-white text-teal-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Piutang ({summary.loanCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("paid")}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === "paid"
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Lunas ({summary.paidCount})
        </button>
      </div>

      {/* List Content */}
      {filteredDebts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <CircleDollarSign size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {activeTab === "paid"
              ? "Belum ada pinjaman yang lunas"
              : activeTab === "debt"
              ? "Alhamdulillah! Tidak ada catatan hutang aktif"
              : activeTab === "loan"
              ? "Tidak ada catatan piutang aktif"
              : "Belum Ada Catatan Hutang / Piutang"}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
            Catat pinjaman masuk dan keluar keluarga agar selalu tercatat rapi, transparan, dan tidak terlupakan.
          </p>
          {activeTab === "all" && (
            <button
              type="button"
              onClick={() => {
                setEditingDebt(null);
                setShowAddEditModal(true);
              }}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              + Catat Pinjaman Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onPay={(d) => setPayingDebt(d)}
              onHistory={(d) => setHistoryDebt(d)}
              onEdit={(d) => {
                setEditingDebt(d);
                setShowAddEditModal(true);
              }}
              onDelete={(d) => setDeletingDebt(d)}
            />
          ))}
        </div>
      )}

      {/* ========================================== */}
      {/* Modals */}
      {/* ========================================== */}
      <AddEditDebtModal
        isOpen={showAddEditModal}
        editingDebt={editingDebt}
        accounts={accounts}
        onClose={() => {
          setShowAddEditModal(false);
          setEditingDebt(null);
        }}
        onSuccess={loadData}
      />

      <PayDebtModal
        isOpen={!!payingDebt}
        debt={payingDebt}
        accounts={accounts}
        onClose={() => setPayingDebt(null)}
        onSuccess={loadData}
      />

      <DebtPaymentHistoryModal
        isOpen={!!historyDebt}
        debt={historyDebt}
        onClose={() => setHistoryDebt(null)}
      />

      {/* Delete Confirmation Modal */}
      {deletingDebt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-800 mb-1">
                Hapus Catatan {deletingDebt.type === "debt" ? "Hutang" : "Piutang"}?
              </h3>
              <p className="text-xs text-slate-500">
                Catatan &quot;<span className="font-bold text-slate-700">{deletingDebt.person_name}</span>&quot; sebesar {formatRupiah(deletingDebt.total_amount)} akan dihapus. Riwayat transaksi mutasi kas sebelumnya tetap tersimpan aman.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDebt(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl text-xs hover:bg-red-700 shadow-md shadow-red-200"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
