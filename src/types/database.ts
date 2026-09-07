export type UserRole = "super_admin" | "member";

export type TransactionType = "income" | "expense";

export interface Account {
  id: string;
  name: string;
  description?: string | null;
  initial_balance: number;
  budget_limit: number;
  icon?: string | null;
  created_at?: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category?: string | null;
  receipt_url?: string | null;
  user_name?: string | null;
  is_transfer?: boolean | null;
  linked_tx_id?: string | null;
  created_at: string;
  accounts?: {
    name: string;
  } | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  bg_class: string;
  text_class: string;
  budget_limit?: number | null; // Batas anggaran bulanan (khusus expense)
  created_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  points: number;
  avatar_url?: string | null;
  created_at?: string;
}

export interface FamilyGoal {
  id: string;
  title: string;
  icon: string;
  target_amount: number;
  current_amount: number;
  target_date?: string | null;
  description?: string | null;
  created_at?: string;
}

export interface Reward {
  id: string;
  title: string;
  icon: string;
  points_cost: number;
  created_at?: string;
}

export type ClaimStatus = "pending" | "approved" | "rejected";

export interface RewardClaim {
  id: string;
  user_id: string;
  reward_id: string;
  status: ClaimStatus;
  created_at: string;
  profiles?: {
    full_name: string;
  } | null;
  rewards?: {
    title: string;
    icon?: string;
    points_cost?: number;
  } | null;
}

export interface AdminUser {
  id: string;
  phone: string;
  fullName: string;
  role: UserRole;
  points: number;
  createdAt?: string;
}

export interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  category: string;
  due_day: number; // 1-31
  account_id?: string | null;
  icon: string;
  is_active: boolean;
  last_paid_at?: string | null;
  created_at?: string;
  accounts?: {
    name: string;
  } | null;
}

export type DebtType = "debt" | "loan"; // debt = Hutang (kita berhutang), loan = Piutang (orang lain berhutang ke kita)
export type DebtStatus = "unpaid" | "partial" | "paid";

export interface DebtLoan {
  id: string;
  type: DebtType;
  person_name: string;
  total_amount: number;
  paid_amount: number;
  due_date?: string | null;
  description?: string | null;
  account_id?: string | null;
  status: DebtStatus;
  created_at?: string;
  accounts?: {
    name: string;
  } | null;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  account_id?: string | null;
  amount: number;
  payment_date: string;
  notes?: string | null;
  accounts?: {
    name: string;
  } | null;
}
