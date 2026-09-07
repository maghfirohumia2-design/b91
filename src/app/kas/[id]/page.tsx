"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Wallet,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  History,
  Plus,
  ArrowLeftRight,
  Search,
  BarChart3,
  X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Account, Transaction, Category } from "@/types/database";
import { formatRupiah, formatDateIndo } from "@/lib/format";

// Modular Components
import KasHeaderCard from "@/components/kas/KasHeaderCard";
import BudgetProgressCard from "@/components/kas/BudgetProgressCard";
import CategoryExpenseCard from "@/components/kas/CategoryExpenseCard";
import TransactionDetailModal from "@/components/kas/TransactionDetailModal";
import { KasDetailSkeleton } from "@/components/ui/Skeleton";

export default function KasDashboardPage() {
  const { profile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Interaction State
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  // Budgeting State
  const [monthlyExpense, setMonthlyExpense] = useState(0);

  const fetchKasData = async () => {
    if (!accountId) return;

    // 1. Fetch Account
    const { data: accData, error: accError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (accError || !accData) {
      setError(true);
      return;
    }
    setAccount(accData as Account);

    // 2. Fetch Categories
    const { data: catData } = await supabase.from("categories").select("*");
    if (catData) setDbCategories(catData as Category[]);

    // 3. Fetch Transactions
    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    if (!txError && txData) {
      const txs = txData as Transaction[];
      setTransactions(txs);

      // Hitung Saldo Total
      const currentBal = txs.reduce((acc, t) => {
        return t.type === "income" ? acc + t.amount : acc - t.amount;
      }, 0);
      setBalance(currentBal);

      // Hitung Pengeluaran Bulan Ini untuk Anggaran
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const thisMonthExpense = txs
        .filter(t => {
          if (t.type !== "expense") return false;
          const d = new Date(t.created_at);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      setMonthlyExpense(thisMonthExpense);
    }
  };

  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      await fetchKasData();
      setLoading(false);
    }
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  // Handler Hapus Transaksi
  const handleDeleteTransaction = async (tx: Transaction) => {
    const isTransfer = tx.is_transfer && tx.linked_tx_id;
    const confirmMsg = isTransfer
      ? "Transaksi ini adalah bagian dari transfer antar kas. Menghapus transaksi ini akan menghapus pasangan transfernya juga. Lanjutkan?"
      : "Apakah Anda yakin ingin menghapus transaksi ini?";

    if (!confirm(confirmMsg)) return;

    setIsDeleting(true);
    try {
      if (isTransfer) {
        const filterQuery = `id.eq.${tx.id},id.eq.${tx.linked_tx_id},linked_tx_id.eq.${tx.id}`;
        const { error: delError } = await supabase
          .from("transactions")
          .delete()
          .or(filterQuery);

        if (delError) throw delError;
      } else {
        const { error: delError } = await supabase
          .from("transactions")
          .delete()
          .eq("id", tx.id);

        if (delError) throw delError;
      }

      setSelectedTx(null);
      await fetchKasData();
    } catch {
      alert("Gagal menghapus transaksi.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <KasDetailSkeleton />;
  }

  if (error || !account) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center bg-slate-50">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-lg font-black text-slate-800 mb-1">Kas Tidak Ditemukan</h2>
        <p className="text-xs text-slate-400 max-w-xs mb-6">Akun kas mungkin telah dihapus atau URL tidak valid.</p>
        <button
          onClick={() => router.push("/")}
          className="px-5 py-3 bg-slate-900 text-white font-bold rounded-2xl text-xs"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Filter Transactions
  const filteredTransactions = transactions.filter(t => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchCat = t.category?.toLowerCase().includes(q);
      const matchUser = t.user_name?.toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchUser) return false;
    }
    // Date filter
    if (filterStartDate) {
      const txDate = new Date(t.created_at).toISOString().split("T")[0];
      if (txDate < filterStartDate) return false;
    }
    if (filterEndDate) {
      const txDate = new Date(t.created_at).toISOString().split("T")[0];
      if (txDate > filterEndDate) return false;
    }
    return true;
  });

  const incomeTotal = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseTotal = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <main className="p-6 pb-32 min-h-screen bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between mb-5 pt-2">
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="p-2.5 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 p-0.5 relative overflow-hidden shadow-sm shrink-0">
            <Image
              src={account.icon || "/icons/umum.jpg"}
              alt={account.name}
              fill
              className="object-cover rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 leading-tight">{account.name}</h1>
            <p className="text-[10px] text-slate-400 font-medium">Buku Kas & Detail Mutasi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/laporan?accountId=${accountId}`}
            className="p-2.5 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:text-blue-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
            title="Laporan & Ekspor Kas Ini"
          >
            <BarChart3 size={15} />
            <span className="hidden sm:inline">Laporan</span>
          </Link>
          <Link
            href={`/transaksi/transfer?fromId=${accountId}`}
            className="p-2.5 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:text-emerald-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
            title="Transfer Antar Kas"
          >
            <ArrowLeftRight size={15} />
            <span className="hidden sm:inline">Transfer</span>
          </Link>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="space-y-5">
        {/* 1. Saldo Header Card */}
        <KasHeaderCard
          account={account}
          balance={balance}
          incomeTotal={incomeTotal}
          expenseTotal={expenseTotal}
          showBalance={showBalance}
          onToggleShowBalance={() => setShowBalance(!showBalance)}
        />

        {/* 2. Target Anggaran Bulanan */}
        <BudgetProgressCard
          account={account}
          monthlyExpense={monthlyExpense}
          profile={profile}
          onBudgetUpdated={(newLimit) => {
            setAccount({ ...account, budget_limit: newLimit });
          }}
        />

        {/* 3. Top Kategori Pengeluaran */}
        <CategoryExpenseCard
          transactions={transactions}
          categories={dbCategories}
        />

        {/* 4. Riwayat Transaksi & Filter */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <History size={14} className="text-emerald-600" />
              Riwayat Mutasi ({filteredTransactions.length})
            </h3>
          </div>

          {/* Search & Date Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari transaksi atau nama pembuat..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] font-bold text-slate-700 focus:outline-none"
              />
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] font-bold text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-2">
            {filteredTransactions.map(tx => {
              const isIncome = tx.type === "income";
              const catObj = dbCategories.find(c => c.name === tx.category);
              const icon = catObj?.icon || (tx.category?.includes(" ") ? tx.category.split(" ")[0] : (isIncome ? "💰" : "🛒"));

              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => setSelectedTx(tx)}
                  className="w-full bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 active:scale-[0.99] transition-all flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                      isIncome ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'
                    }`}>
                      {icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                        {tx.description || tx.category || "Transaksi"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {formatDateIndo(tx.created_at, { day: "numeric", month: "short" })} • {tx.user_name || "Anggota"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`text-xs font-black ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {isIncome ? "+" : "-"}{formatRupiah(tx.amount)}
                    </p>
                    {tx.is_transfer && (
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                        Transfer
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {filteredTransactions.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                <Wallet size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-400">Tidak ada transaksi ditemukan.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2">
        {showFabMenu && (
          <div className="flex flex-col gap-2 mb-1 animate-in fade-in slide-in-from-bottom-4">
            <Link
              href={`/transaksi/baru?type=income&accountId=${accountId}`}
              className="px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <TrendingUp size={16} /> + Pemasukan
            </Link>
            <Link
              href={`/transaksi/baru?type=expense&accountId=${accountId}`}
              className="px-4 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-2xl shadow-lg flex items-center gap-2 hover:bg-rose-700 active:scale-95 transition-all"
            >
              <TrendingDown size={16} /> - Pengeluaran
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 transition-all ${
            showFabMenu ? 'bg-slate-800 rotate-45' : 'bg-gradient-to-r from-emerald-500 to-teal-600'
          }`}
          title="Tambah Transaksi"
        >
          <Plus size={26} />
        </button>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTx}
        account={account}
        isDeleting={isDeleting}
        onClose={() => setSelectedTx(null)}
        onDelete={handleDeleteTransaction}
      />

    </main>
  );
}
