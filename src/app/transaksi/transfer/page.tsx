"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowLeftRight, Loader2, CheckCircle, AlertTriangle, Wallet } from "lucide-react";
import Link from "next/link";
import { Account } from "@/types/database";
import { formatNumberInput, parseNumberInput, formatRupiah } from "@/lib/format";

interface AccountWithBalance extends Account {
  calculatedBalance: number;
}

function TransferFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillFromId = searchParams.get("fromId");

  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [fromAccountId, setFromAccountId] = useState(prefillFromId || "");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState("Admin");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [accRes, txRes, userRes] = await Promise.all([
        supabase.from("accounts").select("*").order("name"),
        supabase.from("transactions").select("account_id, type, amount"),
        supabase.auth.getUser(),
      ]);

      if (accRes.data && accRes.data.length > 0) {
        const rawAccs = accRes.data as Account[];
        const txs = txRes.data || [];

        const accsWithBal: AccountWithBalance[] = rawAccs.map((acc) => {
          const accTxs = txs.filter((t) => t.account_id === acc.id);
          const income = accTxs
            .filter((t) => t.type === "income")
            .reduce((s, t) => s + Number(t.amount || 0), 0);
          const expense = accTxs
            .filter((t) => t.type === "expense")
            .reduce((s, t) => s + Number(t.amount || 0), 0);
          const curBal = Number(acc.initial_balance || 0) + (income - expense);
          return { ...acc, calculatedBalance: curBal };
        });

        setAccounts(accsWithBal);
        const initialFrom = prefillFromId || accsWithBal[0].id;
        setFromAccountId(initialFrom);
        const defaultTo = accsWithBal.find((a) => a.id !== initialFrom)?.id || "";
        setToAccountId(defaultTo);
      }

      if (userRes.data?.user?.user_metadata?.full_name) {
        setCurrentUserName(userRes.data.user.user_metadata.full_name);
      }
    }
    fetchData();
  }, [prefillFromId]);

  const handleFromChange = (newFromId: string) => {
    setFromAccountId(newFromId);
    if (newFromId === toAccountId) {
      const other = accounts.find((a) => a.id !== newFromId);
      if (other) setToAccountId(other.id);
    }
  };

  const handleSwap = () => {
    if (!fromAccountId || !toAccountId) return;
    const oldFrom = fromAccountId;
    const oldTo = toAccountId;
    setFromAccountId(oldTo);
    setToAccountId(oldFrom);
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromAccountId === toAccountId) {
      alert("Kas asal dan kas tujuan tidak boleh sama!");
      return;
    }

    const numAmount = parseNumberInput(amount);
    if (numAmount <= 0) {
      alert("Masukkan nominal transfer yang valid!");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleSaveTransaction = async () => {
    setShowConfirmModal(false);
    if (fromAccountId === toAccountId) {
      alert("Kas asal dan kas tujuan tidak boleh sama!");
      return;
    }

    const numAmount = parseNumberInput(amount);
    if (numAmount <= 0) {
      alert("Masukkan nominal transfer yang valid!");
      return;
    }

    setLoading(true);

    try {
      const fromAccount = accounts.find((a) => a.id === fromAccountId);
      const toAccount = accounts.find((a) => a.id === toAccountId);

      const noteText = description ? ` (${description})` : "";

      // 1. Catat pengeluaran di Kas Asal
      const { data: txOut, error: errOut } = await supabase
        .from("transactions")
        .insert({
          account_id: fromAccountId,
          type: "expense",
          amount: numAmount,
          description: `Transfer ke ${toAccount?.name || "Kas lain"}${noteText}`,
          user_name: currentUserName,
          is_transfer: true,
        })
        .select()
        .single();

      if (errOut) throw errOut;

      // 2. Catat pemasukan di Kas Tujuan
      const { data: txIn, error: errIn } = await supabase
        .from("transactions")
        .insert({
          account_id: toAccountId,
          type: "income",
          amount: numAmount,
          description: `Transfer dari ${fromAccount?.name || "Kas lain"}${noteText}`,
          user_name: currentUserName,
          is_transfer: true,
          linked_tx_id: txOut?.id || null,
        })
        .select()
        .single();

      if (errIn) throw errIn;

      // 3. Link txOut back to txIn if txIn created
      if (txOut && txIn) {
        await supabase
          .from("transactions")
          .update({ linked_tx_id: txIn.id })
          .eq("id", txOut.id);
      }

      alert(`✅ Transfer sebesar ${formatRupiah(numAmount)} berhasil!`);

      if (prefillFromId) {
        router.push(`/kas/${prefillFromId}`);
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (error: unknown) {
      console.error("Gagal melakukan transfer:", error);
      alert("Terjadi kesalahan saat melakukan transfer.");
    } finally {
      setLoading(false);
    }
  };

  const fromAcc = accounts.find((a) => a.id === fromAccountId);
  const toAcc = accounts.find((a) => a.id === toAccountId);
  const numAmount = parseNumberInput(amount);

  const fromBalBefore = fromAcc?.calculatedBalance || 0;
  const fromBalAfter = fromBalBefore - numAmount;
  const toBalBefore = toAcc?.calculatedBalance || 0;
  const toBalAfter = toBalBefore + numAmount;
  const isOverBalance = numAmount > fromBalBefore && fromBalBefore > 0;

  const setPreset = (add: number) => {
    const cur = parseNumberInput(amount);
    setAmount(formatNumberInput((cur + add).toString()));
  };

  const setAllBalance = () => {
    if (fromBalBefore > 0) {
      setAmount(formatNumberInput(fromBalBefore.toString()));
    }
  };

  return (
    <main className="p-6 pb-24 bg-slate-50 min-h-screen">
      <header className="mb-6 pt-4 flex items-center gap-4">
        <Link
          href={prefillFromId ? `/kas/${prefillFromId}` : "/"}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <ArrowLeftRight className="text-indigo-600" size={22} />
            Transfer Antar Kas
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Pindahkan saldo antar dompet & rekening keluarga</p>
        </div>
      </header>

      {accounts.length < 2 ? (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
          <ArrowLeftRight size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Kas Tidak Cukup</h2>
          <p className="text-sm text-slate-500 mb-6">Anda membutuhkan minimal 2 kas untuk melakukan transfer.</p>
          <Link
            href="/profil"
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold inline-block hover:bg-emerald-600 transition-colors"
          >
            Tambah Kas Baru
          </Link>
        </div>
      ) : (
        <form onSubmit={handleReview} className="space-y-5">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
            {/* Interactive Kas Asal & Tujuan Card with Swap Button */}
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 relative space-y-4">
              {/* Dari Kas (Asal) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Dari Kas (Sumber Dana)</span>
                  {fromAcc && (
                    <span className="text-[11px] font-bold text-slate-600 lowercase">
                      saldo: {formatRupiah(fromBalBefore)}
                    </span>
                  )}
                </label>
                <select
                  required
                  value={fromAccountId}
                  onChange={(e) => handleFromChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-bold text-sm"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatRupiah(acc.calculatedBalance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap Button Divider */}
              <div className="relative flex justify-center py-0.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/80" />
                </div>
                <button
                  type="button"
                  onClick={handleSwap}
                  className="relative z-10 p-2 bg-indigo-600 hover:bg-indigo-700 active:scale-90 text-white rounded-full shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1 text-[11px] font-bold px-3"
                  title="Tukar Kas Asal dan Tujuan"
                >
                  <ArrowLeftRight size={14} />
                  <span>Tukar Arah</span>
                </button>
              </div>

              {/* Ke Kas (Tujuan) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Ke Kas (Tujuan Transfer)</span>
                  {toAcc && (
                    <span className="text-[11px] font-bold text-slate-600 lowercase">
                      saldo: {formatRupiah(toBalBefore)}
                    </span>
                  )}
                </label>
                <select
                  required
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-bold text-sm"
                >
                  {accounts
                    .filter((acc) => acc.id !== fromAccountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatRupiah(acc.calculatedBalance)})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Quick Nominal Presets */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Nominal Cepat
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreset(50000)}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  +50 Rb
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(100000)}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  +100 Rb
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(500000)}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  +500 Rb
                </button>
                <button
                  type="button"
                  onClick={() => setPreset(1000000)}
                  className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  +1 Jt
                </button>
                <button
                  type="button"
                  onClick={setAllBalance}
                  className="col-span-2 sm:col-span-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Semua Saldo
                </button>
              </div>
            </div>

            {/* Nominal Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Nominal Transfer
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={amount}
                  onChange={(e) => setAmount(formatNumberInput(e.target.value))}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xl font-black text-slate-800 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Live Balance Simulation Card */}
            {numAmount > 0 && fromAcc && toAcc && (
              <div className="p-4 bg-gradient-to-br from-indigo-50/70 to-blue-50/50 rounded-2xl border border-indigo-100 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-[11px] uppercase tracking-wider">
                  <Wallet size={14} /> Simulasi Saldo Setelah Transfer
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 bg-white/90 rounded-xl border border-indigo-100/80">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{fromAcc.name}</p>
                    <p className={`font-black text-xs ${fromBalAfter < 0 ? "text-red-600" : "text-slate-700"}`}>
                      {formatRupiah(fromBalAfter)}
                    </p>
                    <p className="text-[10px] text-rose-500 font-medium">-{formatRupiah(numAmount)}</p>
                  </div>
                  <div className="p-2.5 bg-white/90 rounded-xl border border-indigo-100/80">
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{toAcc.name}</p>
                    <p className="font-black text-xs text-slate-700">{formatRupiah(toBalAfter)}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">+{formatRupiah(numAmount)}</p>
                  </div>
                </div>

                {isOverBalance && (
                  <div className="p-2 bg-amber-100/80 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
                    <AlertTriangle size={13} className="shrink-0 text-amber-600" />
                    <span>Perhatian: Nominal transfer melebihi saldo kas asal saat ini.</span>
                  </div>
                )}
              </div>
            )}

            {/* Keterangan Catatan */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Catatan / Alasan Transfer (Opsional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Isi saldo dompet tunai mingguan"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm font-medium text-slate-800 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowLeftRight size={20} />}
            Simpan Transfer
          </button>
        </form>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <CheckCircle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-base font-black text-slate-800 mb-1">Konfirmasi Transfer</h3>
              <p className="text-xs text-slate-500 mb-3">Pastikan rincian pemindahan saldo sudah benar.</p>
              
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-slate-400">Dari:</span>
                  <span className="font-bold text-slate-700">{fromAcc?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ke:</span>
                  <span className="font-bold text-slate-700">{toAcc?.name}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-1.5">
                  <span className="text-slate-400">Nominal:</span>
                  <span className="font-black text-indigo-600 text-sm">{formatRupiah(numAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveTransaction}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-2xl text-xs hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors"
              >
                Ya, Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TransferPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex justify-center items-center">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      }
    >
      <TransferFormContent />
    </Suspense>
  );
}
