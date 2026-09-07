import { supabase } from "@/lib/supabase";
import { DebtLoan, DebtPayment } from "@/types/database";

const LOCAL_STORAGE_DEBTS_KEY = "kas_debts_loans";
const LOCAL_STORAGE_PAYMENTS_KEY = "kas_debt_payments";

const DEFAULT_SAMPLE_DEBTS: DebtLoan[] = [
  {
    id: "sample-debt-1",
    type: "debt",
    person_name: "Bank Mandiri (KTA)",
    total_amount: 5000000,
    paid_amount: 1500000,
    due_date: "2026-12-25",
    description: "Renovasi dapur rumah",
    status: "partial",
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-loan-1",
    type: "loan",
    person_name: "Kak Rina",
    total_amount: 1000000,
    paid_amount: 500000,
    due_date: "2026-09-30",
    description: "Pinjaman modal usaha kue",
    status: "partial",
    created_at: new Date().toISOString(),
  },
];

/**
 * Mengambil daftar Hutang & Piutang
 */
export async function getDebtsLoans(): Promise<DebtLoan[]> {
  try {
    const { data, error } = await supabase
      .from("debts_loans")
      .select("*, accounts(name)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_DEBTS_KEY, JSON.stringify(data));
      }
      return data as DebtLoan[];
    }
  } catch (err) {
    console.warn("Supabase debts_loans query fallback:", err);
  }

  // Fallback ke localStorage
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(LOCAL_STORAGE_DEBTS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as DebtLoan[];
      } catch {}
    }
    localStorage.setItem(LOCAL_STORAGE_DEBTS_KEY, JSON.stringify(DEFAULT_SAMPLE_DEBTS));
    return DEFAULT_SAMPLE_DEBTS;
  }

  return DEFAULT_SAMPLE_DEBTS;
}

/**
 * Tambah catatan Hutang / Piutang baru
 */
export async function saveDebtLoan(
  item: Omit<DebtLoan, "id" | "created_at">
): Promise<DebtLoan> {
  const newItem: DebtLoan = {
    ...item,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `debt-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("debts_loans")
      .insert([item])
      .select("*, accounts(name)")
      .single();

    if (!error && data) {
      return data as DebtLoan;
    }
  } catch (err) {
    console.warn("Failed to insert debt into Supabase, saving locally:", err);
  }

  // Local fallback
  if (typeof window !== "undefined") {
    const current = await getDebtsLoans();
    const updated = [newItem, ...current];
    localStorage.setItem(LOCAL_STORAGE_DEBTS_KEY, JSON.stringify(updated));
  }

  return newItem;
}

/**
 * Update catatan Hutang / Piutang
 */
export async function updateDebtLoanData(
  id: string,
  updates: Partial<DebtLoan>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("debts_loans")
      .update(updates)
      .eq("id", id);

    if (!error) return true;
  } catch (err) {
    console.warn("Failed to update debt in Supabase, updating locally:", err);
  }

  // Local fallback
  if (typeof window !== "undefined") {
    const current = await getDebtsLoans();
    const updated = current.map((d) => (d.id === id ? { ...d, ...updates } : d));
    localStorage.setItem(LOCAL_STORAGE_DEBTS_KEY, JSON.stringify(updated));
    return true;
  }

  return false;
}

/**
 * Hapus catatan Hutang / Piutang
 */
export async function deleteDebtLoanData(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("debts_loans").delete().eq("id", id);
    if (!error) return true;
  } catch (err) {
    console.warn("Failed to delete debt in Supabase, deleting locally:", err);
  }

  // Local fallback
  if (typeof window !== "undefined") {
    const current = await getDebtsLoans();
    const updated = current.filter((d) => d.id !== id);
    localStorage.setItem(LOCAL_STORAGE_DEBTS_KEY, JSON.stringify(updated));
    return true;
  }

  return false;
}

/**
 * Mengambil riwayat cicilan untuk suatu hutang / piutang
 */
export async function getDebtPayments(debtId: string): Promise<DebtPayment[]> {
  try {
    const { data, error } = await supabase
      .from("debt_payments")
      .select("*, accounts(name)")
      .eq("debt_id", debtId)
      .order("payment_date", { ascending: false });

    if (!error && data) {
      return data as DebtPayment[];
    }
  } catch (err) {
    console.warn("Supabase debt_payments query fallback:", err);
  }

  // Local fallback
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
    if (saved) {
      try {
        const all = JSON.parse(saved) as DebtPayment[];
        return all.filter((p) => p.debt_id === debtId);
      } catch {}
    }
  }

  return [];
}

/**
 * Eksekusi Pembayaran / Penerimaan Cicilan
 * 1. Tambah nominal yang sudah dibayar
 * 2. Catat transaksi pengeluaran (jika hutang) / pemasukan (jika piutang) pada kas
 * 3. Catat log riwayat pembayaran cicilan
 */
export async function recordDebtPayment({
  debt,
  accountId,
  amount,
  userName,
  notes,
}: {
  debt: DebtLoan;
  accountId: string;
  amount: number;
  userName: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const newPaidAmount = Math.min(Number(debt.paid_amount || 0) + amount, Number(debt.total_amount));
    const newStatus = newPaidAmount >= Number(debt.total_amount) ? "paid" : "partial";
    const nowIso = new Date().toISOString();

    // 1. Mutasi Kas di Transaksi
    const isDebt = debt.type === "debt";
    const txType = isDebt ? "expense" : "income";
    const txCategory = isDebt ? "Pembayaran Hutang" : "Penerimaan Piutang";
    const txDescription = isDebt
      ? `Bayar Cicilan Hutang: ${debt.person_name}${notes ? ` (${notes})` : ""}`
      : `Terima Cicilan Piutang: ${debt.person_name}${notes ? ` (${notes})` : ""}`;

    const { error: txError } = await supabase.from("transactions").insert([
      {
        account_id: accountId,
        type: txType,
        amount: amount,
        description: txDescription,
        category: txCategory,
        user_name: userName,
        created_at: nowIso,
      },
    ]);

    if (txError) {
      console.warn("Error inserting transaction, continuing payment record:", txError);
    }

    // 2. Simpan Riwayat Cicilan
    try {
      await supabase.from("debt_payments").insert([
        {
          debt_id: debt.id,
          account_id: accountId,
          amount: amount,
          payment_date: nowIso,
          notes: notes || null,
        },
      ]);
    } catch (e) {
      console.warn("Payment history log fallback:", e);
    }

    // 3. Update Status Hutang
    await updateDebtLoanData(debt.id, {
      paid_amount: newPaidAmount,
      status: newStatus,
    });

    // Simpan history secara lokal juga jika fallback
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
      const all: DebtPayment[] = saved ? JSON.parse(saved) : [];
      all.unshift({
        id: `pay-${Date.now()}`,
        debt_id: debt.id,
        account_id: accountId,
        amount: amount,
        payment_date: nowIso,
        notes: notes || null,
      });
      localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(all));
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal memproses pembayaran cicilan.";
    return { success: false, error: msg };
  }
}
