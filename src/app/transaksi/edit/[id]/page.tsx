"use client";

import { useState, useEffect, use, Suspense, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Upload, Loader2, Receipt, Tag, CheckCircle, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Account, Category, Transaction, TransactionType } from "@/types/database";
import { formatNumberInput, formatRupiah } from "@/lib/format";
import ReceiptScannerModal from "@/components/transaksi/ReceiptScannerModal";
import AiSettingsModal from "@/components/profil/AiSettingsModal";

function EditTransaksiContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const { id } = use(params);
  
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState<string>("");
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [categorySpentMap, setCategorySpentMap] = useState<Record<string, number>>({});
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  // Restore missing states
  const [existingReceipt, setExistingReceipt] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  
  const [linkedTxId, setLinkedTxId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showAiSettingsModal, setShowAiSettingsModal] = useState(false);
  
  const amountInputRef = useRef<HTMLInputElement>(null);

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
        const looseMatch = dbCategories.find((c) =>
          c.name.toLowerCase().includes(scannedData.category?.toLowerCase() || "")
        );
        if (looseMatch) setCategory(looseMatch.name);
      }
    }
  };

  useEffect(() => {
    async function fetchData() {
      // Fetch accounts
      const { data: accData } = await supabase.from("accounts").select("*").order("name");
      if (accData) {
        setAccounts(accData as Account[]);
      }

      // Fetch categories
      const { data: catData } = await supabase.from("categories").select("*").order("name");
      if (catData) {
        setDbCategories(catData as Category[]);
      }

      // Fetch monthly expenses
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { data: expData } = await supabase
        .from("transactions")
        .select("category, amount, type")
        .gte("created_at", startOfMonth)
        .eq("type", "expense");

      if (expData) {
        const spentMap: Record<string, number> = {};
        expData.forEach((tx) => {
          if (tx.category) {
            spentMap[tx.category] = (spentMap[tx.category] || 0) + Number(tx.amount || 0);
          }
        });
        setCategorySpentMap(spentMap);
      }

      // Fetch transaction
      const { data: txData } = await supabase.from("transactions").select("*").eq("id", id).single();
      if (txData) {
        const tx = txData as Transaction;
        setType(tx.type);
        
        let txCategory = tx.category;
        if (!txCategory && catData) {
          const defaultCats = (catData as Category[]).filter(c => c.type === tx.type);
          if (defaultCats.length > 0) txCategory = defaultCats[0].name;
        }
        setCategory(txCategory || "");
        
        setAccountId(tx.account_id);
        setAmount(tx.amount.toLocaleString("id-ID"));
        setDescription(tx.description);
        setExistingReceipt(tx.receipt_url || null);
        setCreatedAt(tx.created_at);
        setUserName(tx.user_name || "Admin");
        setLinkedTxId(tx.linked_tx_id || null);
      }
      
      setInitialFetchLoading(false);
    }
    
    fetchData();
  }, [id]);

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
      alert("Pilih kategori terlebih dahulu!");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleSaveTransaction = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    try {
      let receipt_url = existingReceipt;

      // Upload file baru jika ada (menimpa yang lama)
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
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

      // Update transaksi
      const numAmount = parseFloat(amount.replace(/\D/g, ""));
      const { error } = await supabase.from("transactions").update({
        type,
        account_id: accountId,
        amount: numAmount,
        description,
        category,
        receipt_url,
      }).eq("id", id);

      if (error) throw error;

      // Sync linked transfer transaction if exists
      if (linkedTxId) {
        await supabase.from("transactions").update({
          amount: numAmount,
        }).eq("id", linkedTxId);
      }

      if (returnTo) {
        router.push(returnTo);
      } else {
        router.push("/transaksi");
      }
      router.refresh();
    } catch (error) {
      console.error("Gagal mengupdate transaksi:", error);
      alert("Terjadi kesalahan saat mengupdate transaksi.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (initialFetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-bounce">
              <Loader2 className="animate-spin text-white" size={36} />
            </div>
          </div>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Menyiapkan Form...</p>
        </div>
      </div>
    );
  }

  const accountName = accounts.find(a => a.id === accountId)?.name || "Kas Tidak Diketahui";
  const formattedDate = createdAt ? new Date(createdAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" }) : "-";

  const selectedCategoryObj = dbCategories.find((c) => c.name === category);
  const currentCategoryLimit = Number(selectedCategoryObj?.budget_limit) || 0;
  const currentCategorySpent = category ? (categorySpentMap[category] || 0) : 0;
  const parsedInputAmount = parseFloat(amount.replace(/\D/g, "")) || 0;
  const projectedCategorySpent = type === "expense" ? currentCategorySpent + parsedInputAmount : 0;
  const isCategoryOverbudget = type === "expense" && currentCategoryLimit > 0 && projectedCategorySpent > currentCategoryLimit;
  const isCategoryNearBudget = type === "expense" && currentCategoryLimit > 0 && !isCategoryOverbudget && (projectedCategorySpent / currentCategoryLimit) >= 0.75;

  return (
    <>
      {/* --- Tampilan Struk Khusus untuk Print --- */}
      <div className="hidden print:block w-full max-w-sm mx-auto p-4 bg-white text-black font-mono">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold border-b border-black pb-2 mb-2">BUKTI TRANSAKSI</h2>
          <p className="text-sm font-bold uppercase">{accountName}</p>
        </div>
        
        <div className="mb-4 text-sm space-y-1">
          <p className="flex justify-between"><span>Tanggal:</span> <span>{formattedDate}</span></p>
          <p className="flex justify-between"><span>ID Trx:</span> <span className="text-[10px]">{id.split("-")[0]}</span></p>
          {userName && (
            <p className="flex justify-between border-t border-black/20 pt-1 mt-1"><span>Kasir:</span> <span>{userName}</span></p>
          )}
        </div>
        
        <div className="border-t border-b border-dashed border-black py-4 mb-4">
          <p className="text-xs uppercase mb-1">Keterangan:</p>
          <p className="font-bold text-sm leading-tight">{description}</p>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <span className="font-bold">{type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN'}</span>
          <span className="text-xl font-bold">Rp {amount}</span>
        </div>
        
        <div className="text-center text-xs border-t border-black pt-4">
          <p>Terima kasih</p>
        </div>
      </div>

      {/* --- Tampilan Aplikasi Utama (Disembunyikan saat di-print) --- */}
      <main className="p-6 pb-24 bg-slate-50 min-h-screen print:hidden">
        <header className="mb-6 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={returnTo || "/"} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-100 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-slate-800">Detail Transaksi</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowScannerModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-orange-200 hover:brightness-105 active:scale-95 transition-all"
            >
              <Sparkles size={14} />
              <span>Scan AI</span>
            </button>
            <button 
              type="button" 
              onClick={handlePrint}
              className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all text-sm font-bold active:scale-95"
            >
              <div className="relative w-6 h-6 rounded-md overflow-hidden shadow-inner">
                <Image src="/icons/icon_print.jpg" alt="Print" fill className="object-cover" />
              </div>
              Cetak
            </button>
          </div>
        </header>

        <form onSubmit={handleReview} className="space-y-6">
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
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Tag size={14} className="text-emerald-600" />
              Pilih Kategori
            </label>
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
                    <span>{cat.name.replace(cat.icon + " ", "")}</span>
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

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
            {/* Nominal */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nominal</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rp</span>
                <input
                  ref={amountInputRef}
                  type="text"
                  inputMode="numeric"
                  required
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (!val) {
                      setAmount("");
                    } else {
                      setAmount(parseInt(val, 10).toLocaleString("id-ID"));
                    }
                  }}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-lg font-bold text-slate-800 transition-all"
                />
              </div>
            </div>

            {/* Akun/Kas */}
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

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Keterangan</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Beli token listrik, Terima honor..."
                className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 transition-all font-medium"
              />
            </div>

            {/* Upload Nota */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Foto Nota (Opsional)</label>
              
              {existingReceipt && !file && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                    <Receipt size={16} /> Nota tersimpan
                  </div>
                  <a href={existingReceipt} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline">Lihat</a>
                </div>
              )}

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-slate-400" />
                  <p className="text-sm text-slate-500 font-medium text-center px-4">
                    {file ? file.name : "Ketuk untuk upload foto baru (akan menimpa nota lama)"}
                  </p>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
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
              "Simpan Perubahan"
            )}
          </button>
        </form>

        {/* Konfirmasi Update (Pre-Save Modal) */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 pb-safe">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden"></div>
              
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <CheckCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Simpan Perubahan?</h2>
                <p className="text-sm text-slate-500 mt-1">Periksa kembali detail pembaruan Anda</p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 mb-6">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Jenis</span>
                  <span className={`text-sm font-bold ${type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Nominal</span>
                  <span className="text-base font-black text-slate-800">Rp {amount}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Kategori</span>
                  <span className="text-sm font-bold text-slate-700">{category}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-400 uppercase">Kas</span>
                  <span className="text-sm font-bold text-slate-700">{accounts.find(a => a.id === accountId)?.name}</span>
                </div>
                <div className="flex justify-between items-start pt-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase mt-0.5">Ket</span>
                  <span className="text-sm font-medium text-slate-700 text-right max-w-[60%]">{description}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveTransaction}
                  disabled={loading}
                  className="flex-1 py-3.5 text-white font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Simpan Update'}
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
    </>
  );
}

export default function EditTransaksiPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <EditTransaksiContent params={params} />
    </Suspense>
  );
}
