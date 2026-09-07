"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { 
  Target, 
  Plus, 
  Loader2, 
  Wallet, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Banknote, 
  X,
  Trophy,
  Calendar,
  Clock,
  Medal,
  Award
} from "lucide-react";
import { FamilyGoal, Account } from "@/types/database";
import { formatRupiah, formatNumberInput, parseNumberInput } from "@/lib/format";
import { GoalsSkeleton } from "@/components/ui/Skeleton";

const PRESET_ICONS = ["🎯", "🏖️", "🎮", "🚗", "📱", "🐮", "🏠", "🚲", "💻", "🎒", "✈️", "👟"];

export default function GoalsPage() {
  const { profile } = useAuth();
  const [goals, setGoals] = useState<FamilyGoal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");

  // Modal State: Tambah / Edit Target
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FamilyGoal | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalIcon, setGoalIcon] = useState("🎯");
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Modal State: Ikut Patungan
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FamilyGoal | null>(null);
  const [amount, setAmount] = useState("");
  const [sourceType, setSourceType] = useState<"account" | "cash">("account");
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State: Cairkan Dana
  const [showCairkanModal, setShowCairkanModal] = useState(false);
  const [cairkanGoal, setCairkanGoal] = useState<FamilyGoal | null>(null);
  const [cairkanDestination, setCairkanDestination] = useState<"account" | "cash">("account");
  const [cairkanAccountId, setCairkanAccountId] = useState("");
  const [isCairkanLoading, setIsCairkanLoading] = useState(false);

  const refreshData = async () => {
    const { data: gData } = await supabase.from("family_goals").select("*").order("created_at", { ascending: false });
    if (gData) setGoals(gData as FamilyGoal[]);

    const { data: aData } = await supabase.from("accounts").select("*").order("name", { ascending: true });
    if (aData) {
      const accList = aData as Account[];
      setAccounts(accList);
      if (accList.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accList[0].id);
        setCairkanAccountId(accList[0].id);
      }
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: gData } = await supabase.from("family_goals").select("*").order("created_at", { ascending: false });
      if (gData) setGoals(gData as FamilyGoal[]);

      const { data: aData } = await supabase.from("accounts").select("*").order("name", { ascending: true });
      if (aData) {
        const accList = aData as Account[];
        setAccounts(accList);
        if (accList.length > 0) {
          setSelectedAccountId(accList[0].id);
          setCairkanAccountId(accList[0].id);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Filtered Goals
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      const isCompleted = g.current_amount >= g.target_amount;
      if (activeTab === "active") return !isCompleted;
      if (activeTab === "completed") return isCompleted;
      return true;
    });
  }, [goals, activeTab]);

  // --- Handlers Buat / Edit Goal ---
  const handleOpenCreateGoal = () => {
    setEditingGoal(null);
    setGoalTitle("");
    setGoalTarget("");
    setGoalTargetDate("");
    setGoalDescription("");
    setGoalIcon("🎯");
    setShowGoalModal(true);
  };

  const handleOpenEditGoal = (goal: FamilyGoal) => {
    setEditingGoal(goal);
    setGoalTitle(goal.title);
    setGoalTarget(goal.target_amount.toLocaleString("id-ID"));
    setGoalTargetDate(goal.target_date || "");
    setGoalDescription(goal.description || "");
    setGoalIcon(goal.icon || "🎯");
    setShowGoalModal(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseNumberInput(goalTarget);
    if (!goalTitle.trim() || numTarget <= 0) {
      alert("Mohon isi judul dan nominal target yang valid!");
      return;
    }

    setIsSavingGoal(true);
    try {
      const payload = {
        title: goalTitle.trim(),
        target_amount: numTarget,
        target_date: goalTargetDate || null,
        description: goalDescription.trim() || null,
        icon: goalIcon,
      };

      if (editingGoal) {
        const { error } = await supabase
          .from("family_goals")
          .update(payload)
          .eq("id", editingGoal.id);

        if (error) throw error;
        alert("Target patungan berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from("family_goals")
          .insert({
            ...payload,
            current_amount: 0,
          });

        if (error) throw error;
        alert("Target patungan baru berhasil dibuat!");
      }

      setShowGoalModal(false);
      refreshData();
    } catch {
      alert("Gagal menyimpan target patungan.");
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (goal: FamilyGoal) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus target "${goal.title}"?`)) return;

    try {
      const { error } = await supabase.from("family_goals").delete().eq("id", goal.id);
      if (error) throw error;
      alert("Target patungan berhasil dihapus.");
      refreshData();
    } catch {
      alert("Gagal menghapus target.");
    }
  };

  // --- Handlers Ikut Patungan ---
  const handleContributeClick = (goal: FamilyGoal) => {
    setSelectedGoal(goal);
    setAmount("");
    setSourceType("account");
    if (accounts.length > 0) setSelectedAccountId(accounts[0].id);
    setShowContributeModal(true);
  };

  const submitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const numAmount = parseNumberInput(amount);
    if (numAmount <= 0) {
      alert("Masukkan nominal patungan yang valid!");
      return;
    }

    setIsSubmitting(true);
    try {
      const contributorName = profile?.full_name || "Anggota Keluarga";
      const goalName = selectedGoal.title;

      if (sourceType === "account") {
        if (!selectedAccountId) {
          alert("Pilih akun kas sumber dana!");
          setIsSubmitting(false);
          return;
        }

        const { error: txError } = await supabase.from("transactions").insert({
          account_id: selectedAccountId,
          type: "expense",
          amount: numAmount,
          description: `Patungan Impian: ${goalName}`,
          category: "🎯 Patungan Impian",
          user_name: contributorName,
          is_transfer: false,
        });

        if (txError) throw txError;
      }

      const newCurrent = Number(selectedGoal.current_amount || 0) + numAmount;
      const { error: goalError } = await supabase
        .from("family_goals")
        .update({ current_amount: newCurrent })
        .eq("id", selectedGoal.id);

      if (goalError) throw goalError;

      // Bonus Gamifikasi Poin
      if (profile?.id) {
        const bonusPoints = 10;
        await supabase
          .from("profiles")
          .update({ points: Number(profile.points || 0) + bonusPoints })
          .eq("id", profile.id);
      }

      alert(`🎉 Terima kasih ${contributorName}! Berhasil setor ${formatRupiah(numAmount)} untuk impian "${goalName}" (+10 Poin Gamifikasi).`);
      setShowContributeModal(false);
      refreshData();
    } catch (err) {
      console.error(err);
      alert("Gagal memproses setoran patungan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Handlers Cairkan Dana ---
  const handleOpenCairkan = (goal: FamilyGoal) => {
    if (goal.current_amount <= 0) {
      alert("Dana patungan ini masih kosong (Rp 0).");
      return;
    }
    setCairkanGoal(goal);
    setCairkanDestination("account");
    if (accounts.length > 0) setCairkanAccountId(accounts[0].id);
    setShowCairkanModal(true);
  };

  const submitPencairan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cairkanGoal || cairkanGoal.current_amount <= 0) return;

    setIsCairkanLoading(true);
    try {
      const cairkanAmount = cairkanGoal.current_amount;

      if (cairkanDestination === "account") {
        if (!cairkanAccountId) {
          alert("Pilih kas tujuan penyetoran!");
          setIsCairkanLoading(false);
          return;
        }

        const { error: txError } = await supabase.from("transactions").insert({
          account_id: cairkanAccountId,
          type: "income",
          amount: cairkanAmount,
          description: `Pencairan Patungan: ${cairkanGoal.title}`,
          category: "🎯 Patungan Impian",
          user_name: profile?.full_name || "Super Admin",
          is_transfer: false,
        });

        if (txError) throw txError;
      }

      const { error: goalError } = await supabase
        .from("family_goals")
        .update({ current_amount: 0 })
        .eq("id", cairkanGoal.id);

      if (goalError) throw goalError;

      alert(`✅ Dana patungan sebesar ${formatRupiah(cairkanAmount)} berhasil dicairkan!`);
      setShowCairkanModal(false);
      refreshData();
    } catch {
      alert("Gagal mencairkan dana patungan.");
    } finally {
      setIsCairkanLoading(false);
    }
  };

  const setContributePreset = (add: number) => {
    const cur = parseNumberInput(amount);
    setAmount(formatNumberInput((cur + add).toString()));
  };

  const setFullContribute = (sisa: number) => {
    if (sisa > 0) {
      setAmount(formatNumberInput(sisa.toString()));
    }
  };

  if (loading) {
    return <GoalsSkeleton />;
  }

  return (
    <main className="p-6 pb-28 min-h-screen bg-slate-50">
      {/* Header */}
      <header className="mb-5 pt-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Target className="text-orange-500" />
            Patungan Impian
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Kumpulkan dana bersama untuk tujuan keluarga</p>
        </div>
        {profile?.role === "super_admin" && (
          <button 
            type="button"
            onClick={handleOpenCreateGoal}
            className="text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 rounded-2xl flex items-center gap-1.5 shadow-md shadow-orange-200 hover:brightness-105 active:scale-95 transition-all"
          >
            <Plus size={16} /> Buat Target
          </button>
        )}
      </header>

      {/* Filter Tabs */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl mb-5 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Semua ({goals.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === "active" ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Berjalan ({goals.filter((g) => g.current_amount < g.target_amount).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === "completed" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Tercapai ({goals.filter((g) => g.current_amount >= g.target_amount).length})
        </button>
      </div>

      {/* List Goals */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3">
            <Target size={28} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {activeTab === "completed" ? "Belum ada target yang tercapai" : "Belum Ada Target Impian"}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
            Buat target patungan bersama seperti liburan, renovasi rumah, atau barang impian keluarga.
          </p>
          {profile?.role === "super_admin" && (
            <button
              type="button"
              onClick={handleOpenCreateGoal}
              className="px-4 py-2.5 bg-orange-500 text-white rounded-2xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-md shadow-orange-200"
            >
              + Buat Target Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGoals.map((goal) => {
            const progress = Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100);
            const isReached = goal.current_amount >= goal.target_amount;
            const sisaNominal = Math.max(0, goal.target_amount - goal.current_amount);

            // Perhitungan Estimasi Bulanan
            const now = new Date();
            const targetD = goal.target_date ? new Date(goal.target_date) : null;
            const isExpired = targetD && targetD < now;
            let remainingMonths = 0;
            let monthlySavingNeeded = 0;

            if (targetD && !isExpired && !isReached && sisaNominal > 0) {
              const diffTime = targetD.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              remainingMonths = Math.max(Math.ceil(diffDays / 30), 1);
              monthlySavingNeeded = Math.round(sisaNominal / remainingMonths);
            }

            return (
              <div 
                key={goal.id} 
                className={`bg-white rounded-3xl p-5 border transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md ${
                  isReached ? 'border-emerald-200 ring-2 ring-emerald-400/20' : 'border-slate-100'
                }`}
              >
                {/* Milestone Badge */}
                <div className="absolute top-0 right-0">
                  {isReached ? (
                    <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-2xl flex items-center gap-1 shadow-sm">
                      <Trophy size={12} /> 100% Tercapai!
                    </span>
                  ) : progress >= 75 ? (
                    <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-2xl flex items-center gap-1 shadow-sm">
                      <Award size={12} /> 75% Hampir Sampai!
                    </span>
                  ) : progress >= 50 ? (
                    <span className="bg-blue-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-2xl flex items-center gap-1 shadow-sm">
                      <Medal size={12} /> 50% Setengah Jalan!
                    </span>
                  ) : progress >= 25 ? (
                    <span className="bg-purple-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-2xl flex items-center gap-1 shadow-sm">
                      <Sparkles size={12} /> 25% Awal yang Baik
                    </span>
                  ) : null}
                </div>

                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-50 text-2xl flex items-center justify-center rounded-2xl shadow-inner border border-orange-100/80 shrink-0">
                      {goal.icon || "🎯"}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base line-clamp-1">{goal.title}</h3>
                      <p className="text-xs font-semibold text-orange-600">
                        Terkumpul {formatRupiah(goal.current_amount)}
                      </p>
                      {goal.target_date && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-0.5">
                          <Calendar size={11} />
                          <span>
                            Target: {new Date(goal.target_date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Super Admin Actions */}
                  {profile?.role === "super_admin" && (
                    <div className="flex items-center gap-1 pt-6">
                      <button 
                        type="button"
                        onClick={() => handleOpenEditGoal(goal)}
                        className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteGoal(goal)}
                        className="w-8 h-8 rounded-full bg-slate-50 border border-red-100 text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-3.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 text-[10px]">Target: {formatRupiah(goal.target_amount)}</span>
                    <span className={`text-xs font-black ${isReached ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isReached ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-amber-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Smart Monthly Savings Recommendation Banner */}
                {!isReached && monthlySavingNeeded > 0 && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2 mb-3">
                    <Clock size={14} className="shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Rekomendasi Tabungan:</span> Tabung{" "}
                      <strong className="text-amber-800">{formatRupiah(monthlySavingNeeded)} / bulan</strong> selama{" "}
                      <strong>{remainingMonths} bulan lagi</strong> untuk mencapai target tepat waktu.
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                  <button 
                    type="button"
                    onClick={() => handleContributeClick(goal)}
                    disabled={isReached}
                    className={`flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isReached 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200 hover:brightness-105 active:scale-95'
                    }`}
                  >
                    <Plus size={15} /> Ikut Patungan
                  </button>

                  {profile?.role === "super_admin" && (
                    <button 
                      type="button"
                      onClick={() => handleOpenCairkan(goal)}
                      disabled={goal.current_amount <= 0}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors disabled:opacity-40"
                    >
                      Cairkan Dana
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: Tambah / Edit Target */}
      {/* ======================================================== */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] flex flex-col pb-safe">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-black text-slate-800">
                {editingGoal ? "Edit Target Impian" : "Buat Target Baru"}
              </h2>
              <button 
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Target
                </label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Contoh: Liburan ke Bali, Beli Laptop Baru"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nominal Target (Rp)
                </label>
                <input
                  type="text"
                  required
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(formatNumberInput(e.target.value))}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
              </div>

              {/* Target Tanggal Selesai */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Target Tanggal Tercapai (Opsional)
                </label>
                <input
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Sistem akan otomatis menghitung rekomendasi tabungan per bulan.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Pilih Ikon Target
                </label>
                <div className="grid grid-cols-6 gap-2 pt-1">
                  {PRESET_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setGoalIcon(ic)}
                      className={`text-2xl p-2 rounded-2xl border transition-all flex items-center justify-center ${
                        goalIcon === ic 
                          ? 'bg-orange-50 border-orange-500 shadow-sm scale-105' 
                          : 'bg-slate-50 border-slate-200 hover:bg-white'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSavingGoal}
                  className="flex-1 py-3.5 text-white font-bold bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-xs flex items-center justify-center shadow-lg shadow-orange-200 disabled:opacity-50"
                >
                  {isSavingGoal ? <Loader2 className="animate-spin" size={18} /> : (editingGoal ? "Simpan Perubahan" : "Buat Target")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: Ikut Patungan */}
      {/* ======================================================== */}
      {showContributeModal && selectedGoal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 pb-safe">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>
            
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-black text-slate-800">Ikut Patungan</h2>
              <button 
                type="button"
                onClick={() => setShowContributeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Patungan bersama untuk impian: <span className="font-bold text-orange-600">{selectedGoal.title}</span>
            </p>

            <form onSubmit={submitContribution} className="space-y-4">
              {/* Quick Nominal Presets */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nominal Cepat
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setContributePreset(50000)}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    +50 Rb
                  </button>
                  <button
                    type="button"
                    onClick={() => setContributePreset(100000)}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    +100 Rb
                  </button>
                  <button
                    type="button"
                    onClick={() => setContributePreset(500000)}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    +500 Rb
                  </button>
                  <button
                    type="button"
                    onClick={() => setContributePreset(1000000)}
                    className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    +1 Jt
                  </button>
                  <button
                    type="button"
                    onClick={() => setFullContribute(Math.max(0, selectedGoal.target_amount - selectedGoal.current_amount))}
                    className="col-span-2 sm:col-span-1 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Lunaskan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nominal Patungan (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                  <input
                    type="text"
                    required
                    value={amount}
                    onChange={(e) => setAmount(formatNumberInput(e.target.value))}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Sumber Dana Patungan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSourceType("account")}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      sourceType === "account" 
                        ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Wallet size={15} /> Potong Kas/Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType("cash")}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      sourceType === "cash" 
                        ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Banknote size={15} /> Uang Tunai / Celengan
                  </button>
                </div>
              </div>

              {sourceType === "account" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Pilih Kas Sumber Dana
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setShowContributeModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 text-white font-bold bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-xs flex items-center justify-center shadow-lg shadow-orange-200 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Setor Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: Cairkan Dana Patungan */}
      {/* ======================================================== */}
      {showCairkanModal && cairkanGoal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 pb-safe">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden"></div>
            
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-black text-slate-800">Cairkan Dana Patungan</h2>
              <button 
                type="button"
                onClick={() => setShowCairkanModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Cairkan dana yang terkumpul untuk dibelanjakan: <span className="font-bold text-orange-600">{cairkanGoal.title}</span>
            </p>

            <form onSubmit={submitPencairan} className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between">
                <span className="text-xs font-bold text-orange-900">Total Dana Dicairkan:</span>
                <span className="text-base font-black text-orange-600">{formatRupiah(cairkanGoal.current_amount)}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tujuan Penyetoran Dana
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCairkanDestination("account")}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      cairkanDestination === "account" 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Wallet size={15} /> Masuk ke Kas/Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setCairkanDestination("cash")}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      cairkanDestination === "cash" 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Banknote size={15} /> Tunai / Diambil
                  </button>
                </div>
              </div>

              {cairkanDestination === "account" && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Pilih Kas Tujuan
                  </label>
                  <select
                    value={cairkanAccountId}
                    onChange={(e) => setCairkanAccountId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button 
                  type="button"
                  onClick={() => setShowCairkanModal(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-2xl text-xs"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isCairkanLoading}
                  className="flex-1 py-3.5 text-white font-bold bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-xs flex items-center justify-center shadow-lg shadow-emerald-200 disabled:opacity-50 transition-all"
                >
                  {isCairkanLoading ? <Loader2 className="animate-spin" size={18} /> : "Cairkan Sekarang"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
