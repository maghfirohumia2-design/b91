"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Upload, Loader2, Tag, CheckCircle, Sparkles, Camera, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Account, Category, TransactionType } from "@/types/database";
import { formatNumberInput, formatRupiah } from "@/lib/format";
import ReceiptScannerModal from "@/components/transaksi/ReceiptScannerModal";
import AiSettingsModal from "@/components/profil/AiSettingsModal";

function TransaksiBaruContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const prefillType = searchParams.get("type") as TransactionType | null;
  const prefillAccountId = searchParams.get("accountId");

  const [type, setType] = useState<TransactionType>(prefillType || "expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState(prefillAccountId || "");
  const [file, setFile] = useState<File | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [categorySpentMap, setCategorySpentMap] = useState<Record<string, number>>({});
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // AI Scanner & Settings Modals
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showAiSettingsModal, setShowAiSettingsModal] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [accRes, catRes, txRes, userRes] = await Promise.all([
        supabase.from("accounts").select("*").order("name"),
        supabase.from("categories").select("*").order("name"),
        supabase.from("transactions").select("category, amount, type").gte("created_at", startOfMonth).eq("type", "expense"),
        supabase.auth.getUser(),
      ]);

      if (accRes.data) {
        const accs = accRes.data as Account[];
        setAccounts(accs);
        if (!prefillAccountId && accs.length > 0) setAccountId(accs[0].id);
      }

      if (catRes.data) {
        const cats = catRes.data as Category[];
        setDbCategories(cats);
        // Set initial category based on type
        const filtered = cats.filter(c => c.type === (prefillType || "expense"));
        if (filtered.length > 0) setCategory(filtered[0].name);
      }

      if (txRes.data) {
        const spentMap: Record<string, number> = {};
        txRes.data.forEach((tx) => {
          if (tx.category) {
            spentMap[tx.category] = (spentMap[tx.category] || 0) + Number(tx.amount || 0);
          }
        });
        setCategorySpentMap(spentMap);
      }

      if (userRes.data?.user?.user_metadata?.full_name) {
        setCurrentUserName(userRes.data.user.user_metadata.full_name);
      }
    }
    fetchData();
  }, [prefillAccountId, prefillType]);

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount.replace(/\D/g, "")) || 0;
    if (numAmount <= 0) {
      alert("Masukkan nominal transaksi yang valid (lebih dari 0)!");
      return;
    }

    if (!accountId) {
      alert("Pilih kas terlebih dahulu!");
      return;
    }

    if (!category) {
      alert("Pilih kategori transaksi!");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      let receipt_url = null;

      // Upload gambar jika ada
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("receipts")
          .getPublicUrl(filePath);

        receipt_url = publicUrlData.publicUrl;
      }

      // Simpan transaksi
      const { error } = await supabase.from("transactions").insert({
        type,
        account_id: accountId,
        amount: parseFloat(amount.replace(/\D/g, "")),
        description,
        category,
        receipt_url,
        user_name: currentUserName,
      });

      if (error) throw error;

      if (prefillAccountId) {
        router.push(`/kas/${prefillAccountId}`);
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (error) {
      console.error("Gagal menyimpan transaksi:", error);
      alert("Terjadi kesalahan saat menyimpan transaksi.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAiScan = (scannedData: {
    amount: number;
    description: string;
    category?: string;
    file: File;
  }) => {
    setType("expense");
    setAmount(formatNumberInput(scannedData.amount.toString()));
    setDescription(scannedData.description);
    setFile(scannedData.file);

    if (scannedData.category) {
      const match = dbCategories.find(
        (c) => c.name.toLowerCase() === scannedData.category?.toLowerCase()
      );
      if (match) {
        setCategory(match.name);
      } else {
        // Coba cari kategori yang mengandung kata
        const looseMatch = dbCategories.find((c) =>
          c.name.toLowerCase().includes(scannedData.category?.toLowerCase() || "")
        );
        if (looseMatch) setCategory(looseMatch.name);
      }
    }
  };

  const selectedCategoryObj = dbCategories.find((c) => c.name === category);
  const currentCategoryLimit = Number(selectedCategoryObj?.budget_limit) || 0;
  const currentCategorySpent = category ? (categorySpentMap[category] || 0) : 0;
  const parsedInputAmount = parseFloat(amount.replace(/\D/g, "")) || 0;
  const projectedCategorySpent = type === "expense" ? currentCategorySpent + parsedInputAmount : 0;
  const isCategoryOverbudget = type === "expense" && currentCategoryLimit > 0 && projectedCategorySpent > currentCategoryLimit;
  const isCategoryNearBudget = type === "expense" && currentCategoryLimit > 0 && !isCategoryOverbudget && (projectedCategorySpent / currentCategoryLimit) >= 0.75;

  return (
    <main className="p-6 pb-28 min-h-screen bg-slate-50">
      <header className="mb-6 pt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link 
            href={prefillAccountId ? `/kas/${prefillAccountId}` : "/"} 
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-800 truncate">
              {prefillAccountId ? `Catat ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'}` : "Catat Transaksi"}
            </h1>
            {prefillAccountId && (
              <p className="text-sm font-semibold text-emerald-600 truncate">
                {accounts.find(a => a.id === prefillAccountId)?.name || "Memuat..."}
              </p>
            )}
          </div>
        </div>

        {/* Tombol AI Scan Struk di Header */}
        <button
          type="button"
          onClick={() => setShowScannerModal(true)}
          className="py-2 px-3.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-200 active:scale-95 hover:brightness-105 transition-all shrink-0"
        >
          <Sparkles size={14} className="animate-spin" />
          <span className="hidden sm:inline">Scan Struk AI</span>
          <span className="sm:hidden">Scan AI</span>
        </button>
      </header>

      {/* AI Scanner Banner */}
      <div 
        onClick={() => setShowScannerModal(true)}
        className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-4 rounded-3xl text-white shadow-lg shadow-orange-200/60 mb-6 flex items-center justify-between cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 text-amber-200 text-[10px] font-black uppercase tracking-wider mb-0.5">
            <Sparkles size={13} />
            <span>Fitur Cerdas Baru</span>
          </div>
          <h3 className="text-sm font-black">Scan Nota Belanja dengan AI</h3>
          <p className="text-[11px] text-white/90 mt-0.5">Foto struk kasir, AI otomatis mengisi nominal & toko!</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shrink-0 border border-white/30 shadow-inner">
          <Camera size={22} />
        </div>
      </div>

      <form onSubmit={handleReview} className="space-y-6">
        {/* Pilihan Jenis */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              const exps = dbCategories.filter(c => c.type === "expense");
              if (exps.length > 0) setCategory(exps[0].name);
            }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${type === "expense" ? "bg-red-500 text-white shadow-md shadow-red-200" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => {
              setType("income");
              const incs = dbCategories.filter(c => c.type === "income");
              if (incs.length > 0) setCategory(incs[0].name);
            }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${type === "income" ? "bg-emerald-500 text-white shadow-md shadow-emerald-200" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Pemasukan
          </button>
        </div>

        {/* Pilihan Kategori (Chip Badges) */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Tag size={14} className="text-emerald-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pilih Kategori</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {dbCategories.filter(c => c.type === type).map((cat) => {
              const isSelected = category === cat.name;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.name);
                    amountInputRef.current?.focus();
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    isSelected
                      ? type === "income"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200 scale-105"
                        : "bg-red-500 text-white border-red-500 shadow-md shadow-red-200 scale-105"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Live Category Budget Alert Banner */}
          {type === "expense" && currentCategoryLimit > 0 && (
            <div className={`mt-3 p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition-all ${
              isCategoryOverbudget
                ? "bg-red-50 border-red-200 text-red-700"
                : isCategoryNearBudget
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}>
              {isCategoryOverbudget ? (
                <AlertTriangle size={16} className="shrink-0 text-red-600 mt-0.5" />
              ) : isCategoryNearBudget ? (
                <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
              ) : (
                <ShieldCheck size={16} className="shrink-0 text-emerald-600 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="flex justify-between items-center font-bold mb-0.5">
                  <span>
                    {isCategoryOverbudget
                      ? "⚠️ Peringatan: Melebihi Batas Anggaran!"
                      : isCategoryNearBudget
                      ? "⚡ Mendekati Batas Anggaran Bulanan"
                      : "🛡️ Anggaran Kategori Masih Aman"}
                  </span>
                  <span>
                    {formatRupiah(projectedCategorySpent)} / {formatRupiah(currentCategoryLimit)}
                  </span>
                </div>
                <p className="text-[11px] opacity-90">
                  {isCategoryOverbudget
                    ? `Transaksi ini membuat total pengeluaran kategori ${category} overbudget sebesar ${formatRupiah(projectedCategorySpent - currentCategoryLimit)}.`
                    : `Sisa kuota anggaran kategori ini: ${formatRupiah(Math.max(currentCategoryLimit - projectedCategorySpent, 0))}.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form Inputs Container */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          {/* Nominal Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nominal</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">Rp</span>
              <input
                ref={amountInputRef}
                type="text"
                required
                value={amount}
                onChange={(e) => setAmount(formatNumberInput(e.target.value))}
                placeholder="0"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-2xl font-bold text-slate-800 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Akun/Kas */}
          {!prefillAccountId && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pilih Kas</label>
              <select
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 transition-all font-medium appearance-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Keterangan</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Beli token listrik, Belanja supermarket..."
              className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 transition-all font-medium"
            />
          </div>

          {/* Upload Nota / Struk Bukti */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Foto Struk / Nota (Opsional)
            </label>
            <label className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
              <Upload className="text-slate-400 mb-2" size={24} />
              <span className="text-sm font-medium text-slate-600">
                {file ? file.name : "Ambil foto atau pilih dari galeri"}
              </span>
              <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
            type === "income" 
              ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200" 
              : "bg-red-500 hover:bg-red-600 shadow-red-200"
          } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              Menyimpan...
            </>
          ) : (
            "Simpan Transaksi"
          )}
        </button>
      </form>

      {/* Konfirmasi Simpan (Pre-Save Modal) */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 pb-safe">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Konfirmasi Transaksi</h2>
              <p className="text-sm text-slate-500 mt-1">Periksa kembali detail sebelum menyimpan</p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 mb-6">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Jenis</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Kategori</span>
                <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <span>{selectedCategoryObj?.icon || "🏷️"}</span>
                  <span>{category}</span>
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Kas</span>
                <span className="text-sm font-bold text-slate-700">
                  {accounts.find(a => a.id === accountId)?.name}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                <span className="text-xs font-semibold text-slate-400 uppercase">Keterangan</span>
                <span className="text-sm font-medium text-slate-700 max-w-[200px] text-right truncate">
                  {description}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Total Nominal</span>
                <span className={`text-xl font-black ${type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                  Rp {amount}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3.5 px-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
              >
                Ubah Lagi
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="flex-1 py-3.5 px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 text-sm flex items-center justify-center gap-2"
              >
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Receipt Scanner Modal */}
      <ReceiptScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        availableCategories={dbCategories.map((c) => c.name)}
        onApplyScan={handleApplyAiScan}
        onOpenAiSettings={() => setShowAiSettingsModal(true)}
      />

      {/* AI Settings Modal */}
      <AiSettingsModal
        isOpen={showAiSettingsModal}
        onClose={() => setShowAiSettingsModal(false)}
      />
    </main>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    }>
      <TransaksiBaruContent />
    </Suspense>
  );
}
