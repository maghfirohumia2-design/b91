import { supabase } from "@/lib/supabase";
import { RecurringBill } from "@/types/database";

const DEFAULT_SAMPLE_BILLS: RecurringBill[] = [
  {
    id: "bill-sample-1",
    title: "Listrik PLN & Token",
    amount: 350000,
    category: "Tagihan & Utilitas",
    due_day: 10,
    icon: "⚡",
    is_active: true,
    last_paid_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "bill-sample-2",
    title: "Internet WiFi Rumah",
    amount: 280000,
    category: "Tagihan & Utilitas",
    due_day: 15,
    icon: "📶",
    is_active: true,
    last_paid_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "bill-sample-3",
    title: "SPP Sekolah Anak",
    amount: 500000,
    category: "Pendidikan",
    due_day: 5,
    icon: "🏫",
    is_active: true,
    last_paid_at: null,
    created_at: new Date().toISOString(),
  },
];

const LOCAL_STORAGE_KEY = "kas_recurring_bills";

export type BillStatusType = "paid" | "due_soon" | "overdue" | "upcoming";

export interface BillStatusInfo {
  status: BillStatusType;
  daysRemaining: number;
  message: string;
  badgeClass: string;
  textClass: string;
}

/**
 * Menghitung status jatuh tempo tagihan di bulan berjalan
 */
export function getBillStatus(bill: RecurringBill): BillStatusInfo {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentDay = now.getDate();

  // Cek apakah sudah dibayar di bulan dan tahun yang sama
  if (bill.last_paid_at) {
    const paidDate = new Date(bill.last_paid_at);
    if (
      paidDate.getFullYear() === currentYear &&
      paidDate.getMonth() === currentMonth
    ) {
      return {
        status: "paid",
        daysRemaining: 0,
        message: "Sudah Lunas Bulan Ini",
        badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
        textClass: "text-emerald-600",
      };
    }
  }

  // Jika belum dibayar bulan ini, hitung selisih hari ke due_day
  const diffDays = bill.due_day - currentDay;

  if (diffDays === 0) {
    return {
      status: "due_soon",
      daysRemaining: 0,
      message: "Jatuh Tempo HARI INI!",
      badgeClass: "bg-amber-50 border-amber-300 text-amber-800 animate-pulse",
      textClass: "text-amber-600",
    };
  }

  if (diffDays > 0 && diffDays <= 3) {
    return {
      status: "due_soon",
      daysRemaining: diffDays,
      message: `Jatuh tempo ${diffDays} hari lagi`,
      badgeClass: "bg-amber-50 border-amber-200 text-amber-700",
      textClass: "text-amber-600",
    };
  }

  if (diffDays > 3) {
    return {
      status: "upcoming",
      daysRemaining: diffDays,
      message: `Jatuh tempo tgl ${bill.due_day}`,
      badgeClass: "bg-slate-50 border-slate-200 text-slate-600",
      textClass: "text-slate-500",
    };
  }

  // diffDays < 0 (sudah lewat)
  const overdueDays = Math.abs(diffDays);
  return {
    status: "overdue",
    daysRemaining: diffDays,
    message: `Lewat jatuh tempo (${overdueDays} hari)`,
    badgeClass: "bg-red-50 border-red-200 text-red-700 font-bold",
    textClass: "text-red-600",
  };
}

/**
 * Mengambil daftar tagihan rutin (Supabase dengan fallback otomatis)
 */
export async function getRecurringBills(): Promise<RecurringBill[]> {
  try {
    const { data, error } = await supabase
      .from("recurring_bills")
      .select("*, accounts(name)")
      .order("due_day", { ascending: true });

    if (!error && data) {
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
      return data as RecurringBill[];
    }
  } catch (err) {
    console.warn("Supabase recurring_bills query fallback:", err);
  }

  // Fallback to local storage
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as RecurringBill[];
      } catch {}
    }
    // Set default samples if first time
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_BILLS));
    return DEFAULT_SAMPLE_BILLS;
  }

  return DEFAULT_SAMPLE_BILLS;
}

/**
 * Tambah tagihan rutin baru
 */
export async function saveRecurringBill(bill: Omit<RecurringBill, "id" | "created_at">): Promise<RecurringBill> {
  const newBill: RecurringBill = {
    ...bill,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `bill-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("recurring_bills")
      .insert([bill])
      .select("*, accounts(name)")
      .single();

    if (!error && data) {
      return data as RecurringBill;
    }
  } catch (err) {
    console.warn("Failed to insert into Supabase, saving locally:", err);
  }

  // Local fallback
  if (typeof window !== "undefined") {
    const current = await getRecurringBills();
    const updated = [...current, newBill];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  }

  return newBill;
}

/**
 * Update tagihan rutin
 */
export async function updateRecurringBillData(
  id: string,
  updates: Partial<RecurringBill>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("recurring_bills")
      .update(updates)
      .eq("id", id);

    if (!error) return true;
  } catch (err) {
    console.warn("Failed to update in Supabase, updating locally:", err);
  }

  // Local fallback
  if (typeof window !== "undefined") {
    const current = await getRecurringBills();
    const updated = current.map((b) => (b.id === id ? { ...b, ...updates } : b));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return true;
  }

  return false;
}

/**
 * Hapus tagihan rutin
 */
export async function deleteRecurringBillData(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("recurring_bills").delete().eq("id", id);
    if (!error) return true;
  } catch (err) {
    console.warn("Failed to delete in Supabase, deleting locally:", err);
  }

  // Local fallback
  if (typeof window !== "undefined") {
    const current = await getRecurringBills();
    const updated = current.filter((b) => b.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return true;
  }

  return false;
}

/**
 * Eksekusi One-Tap Bayar Tagihan
 */
export async function executePayBill({
  bill,
  accountId,
  amount,
  userName,
  customDescription,
}: {
  bill: RecurringBill;
  accountId: string;
  amount: number;
  userName: string;
  customDescription?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const description = customDescription || `Pembayaran ${bill.title} (${new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })})`;
    const nowIso = new Date().toISOString();

    // 1. Catat transaksi pengeluaran di Supabase
    const { error: txError } = await supabase.from("transactions").insert([
      {
        account_id: accountId,
        type: "expense",
        amount: amount,
        description: description,
        category: bill.category || "Tagihan & Utilitas",
        user_name: userName,
        created_at: nowIso,
      },
    ]);

    if (txError) {
      console.error("Gagal mencatat transaksi pembayaran tagihan:", txError);
      return { success: false, error: txError.message };
    }

    // 2. Update status last_paid_at pada tagihan
    await updateRecurringBillData(bill.id, {
      last_paid_at: nowIso,
    });

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses pembayaran.";
    return { success: false, error: msg };
  }
}
