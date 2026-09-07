"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-shimmer rounded-2xl bg-slate-200/70 ${className}`} />;
}

/**
 * Skeleton Loader untuk Halaman Beranda (Home Dashboard)
 */
export function HomeDashboardSkeleton() {
  return (
    <div className="p-6 pb-28 min-h-screen bg-slate-50 space-y-6">
      {/* Header Greeting Skeleton */}
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-2">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-48 h-7 rounded-xl" />
        </div>
        <Skeleton className="w-12 h-12 rounded-2xl" />
      </div>

      {/* Kas Accounts Carousel Skeleton */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-16 h-4" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          <Skeleton className="min-w-[280px] h-44 rounded-3xl" />
          <Skeleton className="min-w-[120px] h-44 rounded-3xl opacity-50" />
        </div>
      </div>

      {/* Quick Action Grid Skeleton */}
      <div className="grid grid-cols-4 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>

      {/* Recent Transactions List Skeleton */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center px-1">
          <Skeleton className="w-36 h-4" />
          <Skeleton className="w-16 h-4" />
        </div>
        <div className="space-y-2.5">
          <Skeleton className="w-full h-16 rounded-2xl" />
          <Skeleton className="w-full h-16 rounded-2xl" />
          <Skeleton className="w-full h-16 rounded-2xl" />
          <Skeleton className="w-full h-16 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton Loader untuk Detail Kas (/kas/[id])
 */
export function KasDetailSkeleton() {
  return (
    <div className="p-6 pb-28 min-h-screen bg-slate-50 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <div className="space-y-1.5">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-24 h-3" />
        </div>
      </div>

      {/* Main Balance Card Skeleton */}
      <Skeleton className="w-full h-52 rounded-3xl" />

      {/* Budget Progress Card Skeleton */}
      <Skeleton className="w-full h-28 rounded-3xl" />

      {/* Filter Bar Skeleton */}
      <Skeleton className="w-full h-20 rounded-2xl" />

      {/* History Items Skeleton */}
      <div className="space-y-2.5">
        <Skeleton className="w-full h-16 rounded-2xl" />
        <Skeleton className="w-full h-16 rounded-2xl" />
        <Skeleton className="w-full h-16 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton Loader untuk Goals & Patungan Impian
 */
export function GoalsSkeleton() {
  return (
    <div className="p-6 pb-28 min-h-screen bg-slate-50 space-y-5">
      <div className="flex justify-between items-center pt-4">
        <div className="space-y-1.5">
          <Skeleton className="w-40 h-7" />
          <Skeleton className="w-56 h-3" />
        </div>
        <Skeleton className="w-28 h-9 rounded-2xl" />
      </div>

      <div className="space-y-4 pt-2">
        <Skeleton className="w-full h-48 rounded-3xl" />
        <Skeleton className="w-full h-48 rounded-3xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton Loader untuk Toko Keluarga (Rewards)
 */
export function RewardsSkeleton() {
  return (
    <div className="p-6 pb-28 min-h-screen bg-slate-50 space-y-5">
      <div className="flex justify-between items-center pt-4">
        <div className="space-y-1.5">
          <Skeleton className="w-36 h-7" />
          <Skeleton className="w-52 h-3" />
        </div>
        <Skeleton className="w-28 h-9 rounded-2xl" />
      </div>

      {/* Point Card Skeleton */}
      <Skeleton className="w-full h-32 rounded-3xl" />

      {/* Tab bar */}
      <Skeleton className="w-full h-12 rounded-2xl" />

      {/* Grid items */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-44 rounded-3xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton Loader untuk Halaman Laporan Keuangan
 */
export function LaporanSkeleton() {
  return (
    <div className="p-6 pb-28 min-h-screen bg-slate-50 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div className="space-y-1.5">
          <Skeleton className="w-36 h-7" />
          <Skeleton className="w-48 h-3" />
        </div>
        <Skeleton className="w-24 h-9 rounded-2xl" />
      </div>

      {/* Filter Bar */}
      <Skeleton className="w-full h-24 rounded-3xl" />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>

      {/* Trend Chart */}
      <Skeleton className="w-full h-56 rounded-3xl" />

      {/* Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Skeleton className="h-60 rounded-3xl" />
        <Skeleton className="h-60 rounded-3xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton Loader untuk Halaman Tagihan Rutin
 */
export function TagihanSkeleton() {
  return (
    <div className="p-6 pb-28 min-h-screen bg-slate-50 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div className="space-y-1.5">
          <Skeleton className="w-36 h-7" />
          <Skeleton className="w-52 h-3" />
        </div>
        <Skeleton className="w-28 h-9 rounded-2xl" />
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <Skeleton className="h-20 rounded-3xl" />
        <Skeleton className="h-20 rounded-3xl" />
        <Skeleton className="h-20 rounded-3xl" />
      </div>

      {/* Tab Filter */}
      <Skeleton className="w-full h-11 rounded-2xl" />

      {/* Bill Cards List */}
      <div className="space-y-3.5 pt-1">
        <Skeleton className="w-full h-36 rounded-3xl" />
        <Skeleton className="w-full h-36 rounded-3xl" />
        <Skeleton className="w-full h-36 rounded-3xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton Loader untuk Halaman Hutang & Piutang
 */
export function HutangSkeleton() {
  return (
    <div className="p-6 pb-28 min-h-screen bg-slate-50 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div className="space-y-1.5">
          <Skeleton className="w-40 h-7" />
          <Skeleton className="w-56 h-3" />
        </div>
        <Skeleton className="w-28 h-9 rounded-2xl" />
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>

      {/* Tab Filter */}
      <Skeleton className="w-full h-11 rounded-2xl" />

      {/* Debt Cards List */}
      <div className="space-y-3.5 pt-1">
        <Skeleton className="w-full h-44 rounded-3xl" />
        <Skeleton className="w-full h-44 rounded-3xl" />
      </div>
    </div>
  );
}
