"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Plus, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Coins
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RecurringBill, Account, Category } from "@/types/database";
import { getRecurringBills, getBillStatus, deleteRecurringBillData } from "@/lib/bills";
import { formatRupiah } from "@/lib/format";
import BillCard from "@/components/tagihan/BillCard";
import AddEditBillModal from "@/components/tagihan/AddEditBillModal";
import PayBillModal from "@/components/tagihan/PayBillModal";
import { TagihanSkeleton } from "@/components/ui/Skeleton";

export default function TagihanPage() {
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unpaid" | "paid">("all");

  // Modals state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingBill, setEditingBill] = useState<RecurringBill | null>(null);
  const [payingBill, setPayingBill] = useState<RecurringBill | null>(null);
  const [deletingBill, setDeletingBill] = useState<RecurringBill | null>(null);

  const loadData = async () => {
    try {
      const [fetchedBills, fetchedAccounts, fetchedCategories] = await Promise.all([
        getRecurringBills(),
        supabase.from("accounts").select("*").order("name", { ascending: true }),
        supabase.from("categories").select("*").eq("type", "expense").order("name", { ascending: true }),
      ]);

      setBills(fetchedBills);
      if (fetchedAccounts.data) setAccounts(fetchedAccounts.data as Account[]);
      if (fetchedCategories.data) setCategories(fetchedCategories.data as Category[]);
    } catch (err) {
      console.error("Error loading bills data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [fetchedBills, fetchedAccounts, fetchedCategories] = await Promise.all([
          getRecurringBills(),
          supabase.from("accounts").select("*").order("name", { ascending: true }),
          supabase.from("categories").select("*").eq("type", "expense").order("name", { ascending: true }),
        ]);

        if (isMounted) {
          setBills(fetchedBills);
          if (fetchedAccounts.data) setAccounts(fetchedAccounts.data as Account[]);
          if (fetchedCategories.data) setCategories(fetchedCategories.data as Category[]);
        }
      } catch (err) {
        console.error("Error loading bills data:", err);
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
    let totalEstimated = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let unpaidCount = 0;
    let paidCount = 0;

    bills.forEach((bill) => {
      if (!bill.is_active) return;
      totalEstimated += Number(bill.amount) || 0;
      const status = getBillStatus(bill);

      if (status.status === "paid") {
        totalPaid += Number(bill.amount) || 0;
        paidCount++;
      } else {
        totalUnpaid += Number(bill.amount) || 0;
        unpaidCount++;
      }
    });

    return {
      totalEstimated,
      totalPaid,
      totalUnpaid,
      unpaidCount,
      paidCount,
      allCount: bills.length,
    };
  }, [bills]);

  // Filtered Bills List
  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const status = getBillStatus(bill);
      if (activeTab === "paid") return status.status === "paid";
      if (activeTab === "unpaid") return status.status !== "paid";
      return true;
    });
  }, [bills, activeTab]);

  const handleDelete = async () => {
    if (!deletingBill) return;
    await deleteRecurringBillData(deletingBill.id);
    setDeletingBill(null);
    loadData();
  };

  if (loading) {
    return <TagihanSkeleton />;
  }

  const currentMonthName = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

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
              <span>Tagihan Rutin</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Periode {currentMonthName}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingBill(null);
            setShowAddEditModal(true);
          }}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-md shadow-slate-200 active:scale-95 transition-all"
        >
          <Plus size={15} />
          <span>Tambah</span>
        </button>
      </header>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        {/* Total Estimasi */}
        <div className="bg-white p-3.5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-1.5">
            <Coins size={14} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Total Tagihan</p>
            <p className="text-xs sm:text-sm font-black text-slate-800 truncate">
              {formatRupiah(summary.totalEstimated)}
            </p>
          </div>
        </div>

        {/* Sudah Dibayar */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-3.5 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5">
            <CheckCircle2 size={14} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold tracking-wider text-emerald-700">Sudah Dibayar</p>
            <p className="text-xs sm:text-sm font-black text-emerald-700 truncate">
              {formatRupiah(summary.totalPaid)}
            </p>
          </div>
        </div>

        {/* Belum Dibayar */}
        <div className="bg-gradient-to-br from-red-50 to-amber-50/40 p-3.5 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-between">
          <div className="w-7 h-7 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-1.5">
            <Clock size={14} />
          </div>
          <div>
            <p className="text-[9px] uppercase font-bold tracking-wider text-red-600">Sisa Tagihan</p>
            <p className="text-xs sm:text-sm font-black text-red-600 truncate">
              {formatRupiah(summary.totalUnpaid)}
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
          onClick={() => setActiveTab("unpaid")}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === "unpaid"
              ? "bg-white text-red-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Belum Bayar ({summary.unpaidCount})
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

      {/* Bill List Container */}
      {filteredBills.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <Receipt size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {activeTab === "paid"
              ? "Belum ada tagihan yang lunas bulan ini"
              : activeTab === "unpaid"
              ? "Hore! Semua tagihan sudah lunas 🎉"
              : "Belum Ada Tagihan Rutin"}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
            Catat semua pengeluaran rutin bulanan keluarga seperti listrik, internet, SPP, dan BPJS agar selalu terpantau.
          </p>
          {activeTab === "all" && (
            <button
              type="button"
              onClick={() => {
                setEditingBill(null);
                setShowAddEditModal(true);
              }}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              + Tambah Tagihan Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredBills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onPay={(b) => setPayingBill(b)}
              onEdit={(b) => {
                setEditingBill(b);
                setShowAddEditModal(true);
              }}
              onDelete={(b) => setDeletingBill(b)}
            />
          ))}
        </div>
      )}

      {/* ========================================== */}
      {/* Modals */}
      {/* ========================================== */}
      <AddEditBillModal
        isOpen={showAddEditModal}
        editingBill={editingBill}
        accounts={accounts}
        categories={categories}
        onClose={() => {
          setShowAddEditModal(false);
          setEditingBill(null);
        }}
        onSuccess={loadData}
      />

      <PayBillModal
        isOpen={!!payingBill}
        bill={payingBill}
        accounts={accounts}
        onClose={() => setPayingBill(null)}
        onSuccess={loadData}
      />

      {/* Delete Confirmation Modal */}
      {deletingBill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-800 mb-1">Hapus Tagihan Rutin?</h3>
              <p className="text-xs text-slate-500">
                Tagihan &quot;<span className="font-bold text-slate-700">{deletingBill.title}</span>&quot; akan dihapus dari daftar pengingat. Riwayat transaksi pengeluaran sebelumnya tetap aman.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBill(null)}
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
