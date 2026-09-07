"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  BarChart3, 
  ArrowLeft, 
  Wallet, 
  Calendar, 
  Filter, 
  Receipt,
  Printer
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { Account, Transaction, Category } from "@/types/database";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { LaporanSkeleton } from "@/components/ui/Skeleton";

// Sub-components
import FinancialSummaryCards from "@/components/laporan/FinancialSummaryCards";
import MonthlyTrendChart from "@/components/laporan/MonthlyTrendChart";
import CategoryDistribution from "@/components/laporan/CategoryDistribution";
import ExportActionButtons from "@/components/laporan/ExportActionButtons";
import CashflowIntelligenceCards from "@/components/laporan/CashflowIntelligenceCards";
import CategoryBudgetCompliance from "@/components/laporan/CategoryBudgetCompliance";

type PeriodPreset = "this_month" | "last_month" | "last_3_months" | "this_year" | "custom";

function LaporanContent() {
  const searchParams = useSearchParams();
  const prefillAccountId = searchParams.get("accountId") || "all";
  const { session, profile } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedAccountId, setSelectedAccountId] = useState<string>(prefillAccountId);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("this_month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);

      // 1. Fetch Accounts
      const { data: accData } = await supabase.from("accounts").select("*").order("name");
      if (accData) setAccounts(accData as Account[]);

      // 2. Fetch Categories
      const { data: catData } = await supabase.from("categories").select("*");
      if (catData) setCategories(catData as Category[]);

      // 3. Fetch All Transactions
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (txData) setTransactions(txData as Transaction[]);

      setLoading(false);
    }

    loadInitialData();
  }, []);

  // Hitung rentang tanggal efektif berdasarkan preset
  const dateRange = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let label = "Bulan Ini";

    if (periodPreset === "this_month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      label = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    } else if (periodPreset === "last_month") {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = start.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    } else if (periodPreset === "last_3_months") {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      label = `3 Bulan Terakhir (${start.toLocaleDateString("id-ID", { month: "short" })} - ${end.toLocaleDateString("id-ID", { month: "short", year: "numeric" })})`;
    } else if (periodPreset === "this_year") {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      label = `Tahun ${now.getFullYear()}`;
    } else if (periodPreset === "custom") {
      if (customStartDate) start = new Date(customStartDate + "T00:00:00");
      else start = new Date(2020, 0, 1);

      if (customEndDate) end = new Date(customEndDate + "T23:59:59");
      else end = new Date();

      label = `${formatDateIndo(start, { day: "numeric", month: "short", year: "numeric" })} - ${formatDateIndo(end, { day: "numeric", month: "short", year: "numeric" })}`;
    }

    return { start, end, label };
  }, [periodPreset, customStartDate, customEndDate]);

  // Filter transaksi
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Filter Kas
      if (selectedAccountId !== "all" && tx.account_id !== selectedAccountId) {
        return false;
      }

      // 2. Filter Tipe
      if (typeFilter !== "all" && tx.type !== typeFilter) {
        return false;
      }

      // 3. Filter Rentang Waktu
      const txTime = new Date(tx.created_at).getTime();
      if (txTime < dateRange.start.getTime() || txTime > dateRange.end.getTime()) {
        return false;
      }

      return true;
    });
  }, [transactions, selectedAccountId, typeFilter, dateRange]);

  // Perhitungan Keuangan
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const netFlow = totalIncome - totalExpense;

  const dayCount = useMemo(() => {
    const diffTime = Math.abs(dateRange.end.getTime() - dateRange.start.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [dateRange]);

  const selectedAccountName = useMemo(() => {
    if (selectedAccountId === "all") return "Semua Kas (Konsolidasi)";
    const match = accounts.find((a) => a.id === selectedAccountId);
    return match ? match.name : "Kas";
  }, [accounts, selectedAccountId]);

  const currentUserName = session?.user?.user_metadata?.full_name || profile?.full_name || "Anggota";

  if (loading) {
    return <LaporanSkeleton />;
  }

  return (
    <main className="p-4 sm:p-6 pb-28 min-h-screen bg-slate-50">
      {/* ======================================================== */}
      {/* SCREEN VIEW (Disembunyikan saat cetak) */}
      {/* ======================================================== */}
      <div className="print:hidden">
        {/* Header Navigation */}
        <header className="flex items-center justify-between mb-5 pt-2">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2.5 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={22} />
                Laporan Keuangan
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Rekapitulasi arus kas & analisis tren</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2.5 bg-white border border-slate-200/80 rounded-2xl text-slate-600 hover:text-blue-600 hover:bg-slate-50 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
            title="Cetak Laporan"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">Cetak</span>
          </button>
        </header>

        {/* Filter Control Box */}
        <section className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm mb-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Filter size={15} className="text-blue-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Filter Laporan</h3>
          </div>

          {/* Row 1: Pilih Kas & Tipe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Wallet size={12} /> Pilih Kas / Dompet
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="all">🌟 Semua Kas (Konsolidasi Seluruh Kas)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Receipt size={12} /> Tipe Transaksi
              </label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setTypeFilter("all")}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                    typeFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter("income")}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                    typeFilter === "income" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter("expense")}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                    typeFilter === "expense" ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Periode Presets */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar size={12} /> Periode Waktu
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: "this_month", label: "Bulan Ini" },
                { key: "last_month", label: "Bulan Lalu" },
                { key: "last_3_months", label: "3 Bulan Terakhir" },
                { key: "this_year", label: "Tahun Ini" },
                { key: "custom", label: "Kustom Tanggal" }
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriodPreset(p.key as PeriodPreset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    periodPreset === p.key
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Picker */}
            {periodPreset === "custom" && (
              <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-2xl animate-in fade-in">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 mb-1">Dari Tanggal</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 mb-1">Sampai Tanggal</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Action Buttons: Export CSV & Cetak PDF */}
        <div className="mb-5">
          <ExportActionButtons
            transactions={filteredTransactions}
            accounts={accounts}
            selectedAccountName={selectedAccountName}
            periodLabel={dateRange.label}
          />
        </div>

        {/* Content Sections */}
        <div className="space-y-5">
          {/* 1. KPI Financial Cards */}
          <FinancialSummaryCards
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            netFlow={netFlow}
            dayCount={dayCount}
          />

          {/* 2. Monthly Trend Chart */}
          <MonthlyTrendChart transactions={transactions} />

          {/* 3. Cashflow Intelligence & Weekly Breakdown */}
          <CashflowIntelligenceCards transactions={filteredTransactions} />

          {/* 4. Category Budget Compliance */}
          <CategoryBudgetCompliance
            transactions={filteredTransactions}
            categories={categories}
          />

          {/* 5. Category & Member Distribution */}
          <CategoryDistribution
            transactions={filteredTransactions}
            categories={categories}
          />

          {/* 4. Detailed Transaction Table (Screen Preview) */}
          <section className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-black text-slate-800">
                  Daftar Mutasi Transaksi ({filteredTransactions.length})
                </h3>
                <p className="text-[10px] text-slate-400">
                  {selectedAccountName} • {dateRange.label}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-2">Tanggal</th>
                    <th className="py-2.5 px-2">Kas</th>
                    <th className="py-2.5 px-2">Kategori</th>
                    <th className="py-2.5 px-2">Keterangan</th>
                    <th className="py-2.5 px-2">Pencatat</th>
                    <th className="py-2.5 px-2 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {filteredTransactions.map((tx) => {
                    const isIncome = tx.type === "income";
                    const kasName = accounts.find((a) => a.id === tx.account_id)?.name || "Kas";

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-2 whitespace-nowrap text-[11px]">
                          {formatDateIndo(tx.created_at, { day: "numeric", month: "short", year: "2-digit" })}
                        </td>
                        <td className="py-3 px-2 font-bold text-slate-800 whitespace-nowrap">{kasName}</td>
                        <td className="py-3 px-2 whitespace-nowrap">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600">
                            {tx.category || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-2 line-clamp-1 max-w-[150px]">{tx.description || "-"}</td>
                        <td className="py-3 px-2 text-slate-500 whitespace-nowrap">{tx.user_name || "Anggota"}</td>
                        <td className={`py-3 px-2 text-right font-black whitespace-nowrap ${
                          isIncome ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {isIncome ? "+" : "-"}{formatRupiah(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                        Tidak ada transaksi ditemukan pada filter ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PRINT / PDF OFFICIAL DOCUMENT TEMPLATE */}
      {/* (Hanya muncul saat dicetak via window.print / PDF) */}
      {/* ======================================================== */}
      <div className="hidden print:block text-slate-900 bg-white p-4">
        {/* Kop Surat Resmi */}
        <div className="border-b-2 border-slate-900 pb-4 mb-5 text-center">
          <h1 className="text-2xl font-black tracking-wide uppercase">LAPORAN ARUS KAS KELUARGA</h1>
          <p className="text-xs text-slate-600 mt-1">
            Akun: <span className="font-bold text-slate-900">{selectedAccountName}</span> | Periode:{" "}
            <span className="font-bold text-slate-900">{dateRange.label}</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Dicetak pada: {formatDateIndo(new Date())} • Oleh: {currentUserName}</p>
        </div>

        {/* Ringkasan Finansial Cetak */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 border border-slate-300 rounded-lg text-center">
            <p className="text-[10px] uppercase font-bold text-slate-500">Total Pemasukan</p>
            <h3 className="text-sm font-black text-emerald-700 mt-0.5">{formatRupiah(totalIncome)}</h3>
          </div>
          <div className="p-3 border border-slate-300 rounded-lg text-center">
            <p className="text-[10px] uppercase font-bold text-slate-500">Total Pengeluaran</p>
            <h3 className="text-sm font-black text-rose-700 mt-0.5">{formatRupiah(totalExpense)}</h3>
          </div>
          <div className="p-3 border border-slate-300 rounded-lg text-center">
            <p className="text-[10px] uppercase font-bold text-slate-500">Arus Kas Bersih (Surplus/Defisit)</p>
            <h3 className={`text-sm font-black mt-0.5 ${netFlow >= 0 ? "text-teal-700" : "text-red-700"}`}>
              {netFlow >= 0 ? "+" : ""}{formatRupiah(netFlow)}
            </h3>
          </div>
        </div>

        {/* Tabel Data Lengkap */}
        <table className="w-full text-left text-[10px] border-collapse border border-slate-300 mb-8">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
              <th className="py-2 px-2 border border-slate-300 w-8 text-center">No</th>
              <th className="py-2 px-2 border border-slate-300">Tanggal</th>
              <th className="py-2 px-2 border border-slate-300">Kas</th>
              <th className="py-2 px-2 border border-slate-300">Kategori</th>
              <th className="py-2 px-2 border border-slate-300">Keterangan</th>
              <th className="py-2 px-2 border border-slate-300">Pencatat</th>
              <th className="py-2 px-2 border border-slate-300 text-right">Pemasukan (Rp)</th>
              <th className="py-2 px-2 border border-slate-300 text-right">Pengeluaran (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((tx, idx) => {
              const isIncome = tx.type === "income";
              const kasName = accounts.find((a) => a.id === tx.account_id)?.name || "Kas";

              return (
                <tr key={tx.id} className="border-b border-slate-200">
                  <td className="py-1.5 px-2 border border-slate-300 text-center">{idx + 1}</td>
                  <td className="py-1.5 px-2 border border-slate-300">{formatDateIndo(tx.created_at, { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="py-1.5 px-2 border border-slate-300 font-bold">{kasName}</td>
                  <td className="py-1.5 px-2 border border-slate-300">{tx.category || "-"}</td>
                  <td className="py-1.5 px-2 border border-slate-300">{tx.description || "-"}</td>
                  <td className="py-1.5 px-2 border border-slate-300">{tx.user_name || "Anggota"}</td>
                  <td className="py-1.5 px-2 border border-slate-300 text-right font-bold text-emerald-700">
                    {isIncome ? formatRupiah(tx.amount) : "-"}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300 text-right font-bold text-rose-700">
                    {!isIncome ? formatRupiah(tx.amount) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-black border-t-2 border-slate-400">
              <td colSpan={6} className="py-2 px-2 border border-slate-300 text-right uppercase">Total</td>
              <td className="py-2 px-2 border border-slate-300 text-right text-emerald-800">{formatRupiah(totalIncome)}</td>
              <td className="py-2 px-2 border border-slate-300 text-right text-rose-800">{formatRupiah(totalExpense)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Tanda Tangan Laporan */}
        <div className="flex justify-between items-end pt-6 text-xs">
          <div>
            <p className="text-slate-500">Mengetahui,</p>
            <p className="font-bold text-slate-800 mt-12">Kepala Keluarga</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500">Dibuat Oleh,</p>
            <p className="font-bold text-slate-800 mt-12">{currentUserName}</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LaporanPage() {
  return (
    <Suspense fallback={<LaporanSkeleton />}>
      <LaporanContent />
    </Suspense>
  );
}
