"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Gift, Target } from "lucide-react";

import Image from "next/image";

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-8 md:px-16 lg:px-32 py-3 pb-safe flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50 print:hidden">
      <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-emerald-600' : 'text-slate-400 opacity-70 hover:opacity-100 transition-opacity'}`}>
        <div className={`relative w-7 h-7 overflow-hidden rounded-lg ${pathname === '/' ? 'shadow-md shadow-emerald-200 ring-2 ring-emerald-500 ring-offset-2' : ''}`}>
          <Image src="/icons/icon_nav_home.jpg" alt="Beranda" fill className="object-cover" />
        </div>
        <span className="text-[10px] font-bold mt-1">Beranda</span>
      </Link>
      <Link href="/goals" className={`flex flex-col items-center gap-1 ${pathname === '/goals' ? 'text-orange-600' : 'text-slate-400 opacity-70 hover:opacity-100 transition-opacity'}`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-orange-50 text-orange-600 border border-orange-100 ${pathname === '/goals' ? 'shadow-md shadow-orange-200 ring-2 ring-orange-500 ring-offset-2 bg-orange-500 text-white' : ''}`}>
          <Target size={16} />
        </div>
        <span className="text-[10px] font-bold mt-1">Patungan</span>
      </Link>

      <Link href="/transaksi/transfer" className={`flex flex-col items-center gap-1 ${pathname === '/transaksi/transfer' ? 'text-blue-600' : 'text-slate-400 opacity-70 hover:opacity-100 transition-opacity'}`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100 ${pathname === '/transaksi/transfer' ? 'shadow-md shadow-blue-200 ring-2 ring-blue-500 ring-offset-2 bg-blue-500 text-white' : ''}`}>
          <ArrowLeftRight size={16} />
        </div>
        <span className="text-[10px] font-bold mt-1">Transfer</span>
      </Link>

      <Link href="/rewards" className={`flex flex-col items-center gap-1 ${pathname === '/rewards' ? 'text-pink-600' : 'text-slate-400 opacity-70 hover:opacity-100 transition-opacity'}`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-pink-50 text-pink-600 border border-pink-100 ${pathname === '/rewards' ? 'shadow-md shadow-pink-200 ring-2 ring-pink-500 ring-offset-2 bg-pink-500 text-white' : ''}`}>
          <Gift size={16} />
        </div>
        <span className="text-[10px] font-bold mt-1">Toko</span>
      </Link>

      <Link href="/profil" className={`flex flex-col items-center gap-1 ${pathname === '/profil' ? 'text-emerald-600' : 'text-slate-400 opacity-70 hover:opacity-100 transition-opacity'}`}>
        <div className={`relative w-7 h-7 overflow-hidden rounded-lg ${pathname === '/profil' ? 'shadow-md shadow-blue-200 ring-2 ring-blue-500 ring-offset-2' : ''}`}>
          <Image src="/icons/icon_nav_profile.jpg" alt="Profil" fill className="object-cover" />
        </div>
        <span className="text-[10px] font-bold mt-1">Profil</span>
      </Link>
    </div>
  );
}
