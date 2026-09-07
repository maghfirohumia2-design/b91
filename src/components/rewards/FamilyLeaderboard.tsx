"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types/database";
import { Trophy, Medal, Award, Crown, Sparkles } from "lucide-react";

export default function FamilyLeaderboard() {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchLeaderboard() {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .order("points", { ascending: false });

        if (data && isMounted) {
          setMembers(data as UserProfile[]);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLeaderboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || members.length === 0) return null;

  const topThree = members.slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-[32px] p-5 text-white shadow-xl shadow-orange-200/60 mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-100 border border-white/30 shadow-inner">
            <Trophy size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-100">
              Peringkat Poin Keluarga
            </h3>
            <p className="text-[10px] text-white/80">Anggota paling aktif mencatat & menabung</p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-white/20">
          <Sparkles size={11} className="text-amber-200" /> Musim Ini
        </span>
      </div>

      {/* Podium Top 3 */}
      <div className="grid grid-cols-3 gap-2 relative z-10 pt-1">
        {topThree.map((member, idx) => {
          const isFirst = idx === 0;
          const isSecond = idx === 1;

          return (
            <div
              key={member.id}
              className={`p-3 rounded-2xl flex flex-col items-center text-center transition-all ${
                isFirst
                  ? "bg-white text-slate-800 shadow-lg scale-105 border-2 border-amber-300 ring-4 ring-amber-300/30"
                  : "bg-white/15 backdrop-blur-md text-white border border-white/20"
              }`}
            >
              {/* Rank Badge */}
              <div className="mb-1">
                {isFirst ? (
                  <span className="w-7 h-7 rounded-full bg-amber-400 text-slate-900 font-black text-xs flex items-center justify-center shadow-md">
                    <Crown size={15} />
                  </span>
                ) : isSecond ? (
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-black text-[11px] flex items-center justify-center">
                    <Medal size={13} />
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full bg-amber-700/60 text-amber-200 font-black text-[11px] flex items-center justify-center">
                    <Award size={13} />
                  </span>
                )}
              </div>

              {/* Name */}
              <p
                className={`text-xs font-black truncate max-w-full leading-tight ${
                  isFirst ? "text-slate-800" : "text-white"
                }`}
              >
                {member.full_name || "Anggota"}
              </p>

              {/* Points */}
              <p
                className={`text-[11px] font-black mt-0.5 ${
                  isFirst ? "text-orange-600" : "text-amber-200"
                }`}
              >
                {member.points || 0} Pts
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
