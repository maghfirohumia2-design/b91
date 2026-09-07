"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Wallet, 
  Settings,
  BarChart3,
  Receipt,
  CircleDollarSign
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Account } from "@/types/database";
import { HomeDashboardSkeleton } from "@/components/ui/Skeleton";
import MultiAccountMatrix from "@/components/home/MultiAccountMatrix";
import DueBillsNotificationBanner from "@/components/home/DueBillsNotificationBanner";

// Fungsi ikon per kas (Gambar 3D unik)
const getIconForAccount = (name: string) => {
  if (!name) return "/icons/umum.jpg";
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("keluarga") || lowerName.includes("rumah")) return "/icons/rumah.jpg";
  if (lowerName.includes("paud") || lowerName.includes("pendidikan") || lowerName.includes("sekolah") || lowerName.includes("anak")) return "/icons/pendidikan.jpg";
  if (lowerName.includes("spv") || lowerName.includes("dpk")) return "/icons/spv.jpg";
  if (lowerName.includes("belanja") || lowerName.includes("pasar") || lowerName.includes("dapur") || lowerName.includes("toko")) return "/icons/belanja.jpg";
  if (lowerName.includes("tabungan") || lowerName.includes("simpanan") || lowerName.includes("investasi") || lowerName.includes("it")) return "/icons/it.jpg";
  if (lowerName.includes("kantor") || lowerName.includes("usaha") || lowerName.includes("kerja")) return "/icons/kantor.jpg";
  if (lowerName.includes("hutang") || lowerName.includes("mobil") || lowerName.includes("motor") || lowerName.includes("kendaraan")) return "/icons/mobil.jpg";
  
  return "/icons/umum.jpg";
};

interface AccountWithBalance extends Account {
  calculatedBalance: number;
}

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsWithBalance, setAccountsWithBalance] = useState<AccountWithBalance[]>([]);
  const [totalFamilyBalance, setTotalFamilyBalance] = useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<Record<string, number>>({});
  const [accountsError, setAccountsError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("My Family");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: accountsData, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: true });

      const { data: transactions } = await supabase
        .from('transactions')
        .select('account_id, type, amount, created_at, is_transfer');

      if (accError) {
        setAccountsError(true);
      } else {
        const accs = (accountsData || []) as Account[];
        setAccounts(accs);
        
        const newMonthlyExpenses: Record<string, number> = {};
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        accs.forEach(acc => { 
          newMonthlyExpenses[acc.id] = 0;
        });
        
        transactions?.forEach(tx => {
          const amount = Number(tx.amount);
          const txDate = new Date(tx.created_at);
          const isCurrentMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;

          if (tx.type === 'expense' && isCurrentMonth && !tx.is_transfer) {
            newMonthlyExpenses[tx.account_id] = (newMonthlyExpenses[tx.account_id] || 0) + amount;
          }
        });
        
        setMonthlyExpenses(newMonthlyExpenses);

        // Hitung Saldo Tiap Kas & Total Saldo Keluarga
        let totalBal = 0;
        const calculatedAccs: AccountWithBalance[] = accs.map((acc) => {
          const accTxs = transactions?.filter((t) => t.account_id === acc.id) || [];
          const income = accTxs
            .filter((t) => t.type === 'income')
            .reduce((s, t) => s + Number(t.amount || 0), 0);
          const expense = accTxs
            .filter((t) => t.type === 'expense')
            .reduce((s, t) => s + Number(t.amount || 0), 0);
          const curBal = Number(acc.initial_balance || 0) + (income - expense);
          totalBal += curBal;
          return { ...acc, calculatedBalance: curBal };
        });

        setAccountsWithBalance(calculatedAccs);
        setTotalFamilyBalance(totalBal);
      }
      setLoading(false);
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.avatar_url) {
        setAvatarUrl(user.user_metadata.avatar_url);
      }
      if (user?.user_metadata?.full_name) {
        setFullName(user.user_metadata.full_name);
      }
    });

    fetchData();
  }, []);

  if (loading) {
    return <HomeDashboardSkeleton />;
  }

  return (
    <main className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Full-width hero header */}
      <div className="w-full bg-gradient-to-br from-emerald-600 via-teal-500 to-emerald-800 pb-16 pt-0 shadow-[0_10px_40px_rgba(16,185,129,0.3)] relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="max-w-6xl mx-auto px-6 pt-8 relative z-10">
          {/* Header Profile */}
          <header className="flex justify-between items-center mb-2 gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white tracking-tight truncate">{fullName}</h1>
              <p className="text-sm text-emerald-50 font-medium opacity-90 truncate">Selalu Sehat dan Bahagia</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link 
                href="/laporan" 
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors backdrop-blur-sm shadow-sm border border-white/20"
                title="Laporan & Analisis Keuangan"
              >
                <BarChart3 size={20} />
              </Link>
              <Link 
                href="/profil" 
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors backdrop-blur-sm shadow-sm border border-white/20"
                title="Pengaturan Profil"
              >
                <Settings size={20} />
              </Link>
              <Link href="/profil" className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-xl shadow-lg border-[3px] border-emerald-300/50 overflow-hidden relative transition-transform hover:scale-105 active:scale-95">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Profil" fill className="object-cover" />
                ) : (
                  "👨‍👩‍👧"
                )}
              </Link>
            </div>
          </header>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 pb-28 relative z-10 space-y-5">
        {/* Due Bills Notification Alert Banner */}
        <DueBillsNotificationBanner />

        {/* Multi-Account Asset Proportion Matrix */}
        <MultiAccountMatrix
          accounts={accountsWithBalance}
          totalBalance={totalFamilyBalance}
        />

        {/* Menu Kas Container */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border border-white/50 min-h-[200px]">
        {accountsError && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 mb-4">
            Gagal mengambil data dari database. Pastikan koneksi aman.
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-75"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-bounce">
                <Wallet size={36} className="text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Menyiapkan Kas...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 sm:gap-6">
              {accounts?.map((account) => (
                <Link 
                  href={`/kas/${account.id}`} 
                  key={account.id} 
                  className="group flex flex-col items-center justify-start cursor-pointer active:scale-95 transition-transform w-[72px] sm:w-[84px]"
                >
                  {/* Icon Box */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] flex items-center justify-center mb-2 shadow-sm bg-white p-1 border border-slate-100/80 group-hover:shadow-md group-hover:border-slate-200 transition-all">
                    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner">
                      <Image src={account.icon || getIconForAccount(account.name)} alt={account.name} fill className="object-cover" sizes="64px" />
                    </div>
                  </div>
                  
                  {/* Text / Title */}
                  <span className="text-[10px] sm:text-xs font-bold text-slate-700 text-center uppercase tracking-wide px-1 line-clamp-2 leading-tight mt-1">
                    {account.name}
                  </span>
                  
                  {/* Budget Progress (if exists) */}
                  {account.budget_limit > 0 && (
                    <div className="w-12 sm:w-14 mt-1.5 flex flex-col items-center">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            (monthlyExpenses[account.id] / account.budget_limit) > 0.85 
                              ? 'bg-red-500' 
                              : (monthlyExpenses[account.id] / account.budget_limit) > 0.6 
                                ? 'bg-orange-400' 
                                : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min((monthlyExpenses[account.id] / account.budget_limit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* Quick Action Shortcuts: Tagihan, Hutang Piutang, Laporan */}
            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-2.5">
              <Link
                href="/tagihan"
                className="p-3 bg-amber-50/60 hover:bg-amber-50 border border-amber-100/80 rounded-2xl flex flex-col items-center text-center transition-all active:scale-95 shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow-sm">
                  <Receipt size={17} />
                </div>
                <span className="text-xs font-bold text-slate-800">Tagihan</span>
                <span className="text-[10px] text-slate-400 font-medium">Rutin & Bulanan</span>
              </Link>

              <Link
                href="/hutang-piutang"
                className="p-3 bg-rose-50/60 hover:bg-rose-50 border border-rose-100/80 rounded-2xl flex flex-col items-center text-center transition-all active:scale-95 shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center mb-1.5 shadow-sm">
                  <CircleDollarSign size={17} />
                </div>
                <span className="text-xs font-bold text-slate-800">Hutang Piutang</span>
                <span className="text-[10px] text-slate-400 font-medium">Buku Pinjaman</span>
              </Link>

              <Link
                href="/laporan"
                className="p-3 bg-blue-50/60 hover:bg-blue-50 border border-blue-100/80 rounded-2xl flex flex-col items-center text-center transition-all active:scale-95 shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center mb-1.5 shadow-sm">
                  <BarChart3 size={17} />
                </div>
                <span className="text-xs font-bold text-slate-800">Laporan</span>
                <span className="text-[10px] text-slate-400 font-medium">Analisis & Ekspor</span>
              </Link>
            </div>

            {(!accounts || accounts.length === 0) && !accountsError && (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">Belum ada akun kas yang dibuat.</p>
                <Link href="/profil" className="text-emerald-600 text-sm font-semibold hover:underline mt-2 inline-block">
                  Tambah Akun Kas di Profil
                </Link>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </main>
  );
}
