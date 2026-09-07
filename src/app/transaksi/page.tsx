import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Plus } from "lucide-react";
import TransactionList from "@/components/TransactionList";

export const revalidate = 0;

export default async function TransaksiPage() {
  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      *,
      accounts ( name )
    `)
    .order('created_at', { ascending: false });

  return (
    <main className="p-6">
      <header className="mb-6 pt-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h1>
          <p className="text-sm text-slate-500">Semua arus kas Anda</p>
        </div>
        <Link href="/transaksi/baru" className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors">
          <Plus size={20} />
        </Link>
      </header>

      <div className="space-y-4 pb-20">
        <TransactionList initialTransactions={transactions || []} />
      </div>
    </main>
  );
}
