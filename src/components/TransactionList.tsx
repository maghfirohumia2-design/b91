"use client";

import { ArrowDownRight, ArrowUpRight, Receipt, Trash2, Edit2, Search, Download, Filter } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Transaction } from "@/types/database";

export default function TransactionList({ initialTransactions }: { initialTransactions: Transaction[] }) {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) return;
    
    setIsDeleting(id);
    try {
      const targetTx = transactions.find(t => t.id === id);
      let error;
      if (targetTx?.linked_tx_id || targetTx?.is_transfer) {
        const res = await supabase
          .from("transactions")
          .delete()
          .or(`id.eq.${id},id.eq.${targetTx?.linked_tx_id},linked_tx_id.eq.${id}`);
        error = res.error;
        if (!error) {
          setTransactions(transactions.filter(t => t.id !== id && t.id !== targetTx?.linked_tx_id && t.linked_tx_id !== id));
        }
      } else {
        const res = await supabase.from("transactions").delete().eq("id", id);
        error = res.error;
        if (!error) {
          setTransactions(transactions.filter(t => t.id !== id));
        }
      }
      if (error) throw error;
      
      router.refresh(); // Refresh server state (saldo dll)
    } catch (error) {
      console.error("Gagal menghapus:", error);
      alert("Terjadi kesalahan saat menghapus transaksi.");
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Smart Search Logic
      let matchesSearch = true;
      const query = searchQuery.trim().toLowerCase();
      
      if (query) {
        if (query.startsWith('>')) {
          const val = parseFloat(query.substring(1).replace(/\D/g, ''));
          matchesSearch = !isNaN(val) && tx.amount > val;
        } else if (query.startsWith('<')) {
          const val = parseFloat(query.substring(1).replace(/\D/g, ''));
          matchesSearch = !isNaN(val) && tx.amount < val;
        } else if (query.startsWith('=')) {
          const val = parseFloat(query.substring(1).replace(/\D/g, ''));
          matchesSearch = !isNaN(val) && tx.amount === val;
        } else if (query.startsWith('#')) {
          const catStr = query.substring(1);
          matchesSearch = (tx.category || "").toLowerCase().includes(catStr);
        } else {
          matchesSearch = tx.description.toLowerCase().includes(query) || 
                          (tx.accounts?.name || "").toLowerCase().includes(query) ||
                          (tx.category || "").toLowerCase().includes(query);
        }
      }
      
      // Filter by month (format YYYY-MM)
      let matchesMonth = true;
      if (filterMonth) {
        const txDate = new Date(tx.created_at);
        const txMonthStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        matchesMonth = txMonthStr === filterMonth;
      }
      
      return matchesSearch && matchesMonth;
    });
  }, [transactions, searchQuery, filterMonth]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    
    // Header CSV
    let csvContent = "Tanggal,ID Transaksi,Sumber Kas,Keterangan,Tipe,Nominal,Kasir\n";
    
    filteredTransactions.forEach((tx) => {
      const date = new Date(tx.created_at).toLocaleString("id-ID");
      const id = tx.id;
      const kas = tx.accounts?.name || "-";
      const desc = `"${tx.description.replace(/"/g, '""')}"`; // Escape quotes
      const type = tx.type === "income" ? "Pemasukan" : "Pengeluaran";
      const amount = tx.amount;
      const user = tx.user_name || "Admin";
      
      csvContent += `${date},${id},${kas},${desc},${type},${amount},${user}\n`;
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_Transaksi_${filterMonth || 'Semua'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate unique months for filter dropdown
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(tx => {
      const txDate = new Date(tx.created_at);
      const monthStr = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthStr);
    });
    return Array.from(months).sort().reverse(); // Terbaru di atas
  }, [transactions]);

  const formatMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Action Bar: Search, Filter, Export */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi, atau ketik >50000, #Makan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              <option value="">Semua Bulan</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-700 transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200 text-sm">
          Tidak ada transaksi yang cocok.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
        <div key={tx.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 group relative overflow-hidden">
          {/* Main Transaction Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {tx.type === 'income' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 text-sm">{tx.description}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-xs text-slate-500">{tx.accounts?.name}</p>
                  {tx.user_name && (
                    <>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                        👤 {tx.user_name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
              </p>
              {tx.receipt_url && (
                <a href={tx.receipt_url} target="_blank" rel="noreferrer" className="text-[10px] font-medium text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors">
                  <Receipt size={10} /> Nota
                </a>
              )}
            </div>
          </div>
          
          {/* Action Buttons (Edit / Delete) */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-50/50 mt-1">
            <Link 
              href={`/transaksi/edit/${tx.id}`}
              className="flex-1 py-2 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg flex items-center justify-center gap-1.5 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <Edit2 size={12} /> Ubah
            </Link>
            {profile?.role === 'super_admin' && (
              <button 
                onClick={() => handleDelete(tx.id)}
                disabled={isDeleting === tx.id}
                className={`flex-1 py-2 text-xs font-medium bg-red-50 text-red-500 rounded-lg flex items-center justify-center gap-1.5 hover:bg-red-100 hover:text-red-600 transition-colors ${isDeleting === tx.id ? 'opacity-50' : ''}`}
              >
                <Trash2 size={12} /> {isDeleting === tx.id ? 'Menghapus...' : 'Hapus'}
              </button>
            )}
          </div>
        </div>
      ))}
        </div>
      )}
    </div>
  );
}
