"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { UserCircle, Camera, Edit2, Loader2, Check, X, Shield, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/types/database";

interface ProfileHeaderProps {
  profile: UserProfile | null;
  phone: string | null;
  fullName: string;
  avatarUrl: string | null;
  onProfileUpdated: (newName: string, newAvatar?: string) => void;
}

export default function ProfileHeader({
  profile,
  phone,
  fullName,
  avatarUrl,
  onProfileUpdated
}: ProfileHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(fullName);
  const [isSavingName, setIsSavingName] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;

    setIsSavingName(true);
    try {
      const { error: userError } = await supabase.auth.updateUser({
        data: { full_name: tempName.trim() }
      });
      if (userError) throw userError;

      if (profile?.id) {
        await supabase
          .from("profiles")
          .update({ full_name: tempName.trim() })
          .eq("id", profile.id);
      }

      // Perbarui juga nama pembuat di transaksi lama jika ada
      if (fullName && fullName !== tempName.trim()) {
        await supabase
          .from("transactions")
          .update({ user_name: tempName.trim() })
          .eq("user_name", fullName);
      }

      onProfileUpdated(tempName.trim());
      setIsEditingName(false);
    } catch {
      alert("Gagal menyimpan nama pengguna.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingImage(true);
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload ke Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Ambil Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Simpan ke Auth metadata
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      // Simpan ke profiles table
      if (profile?.id) {
        await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", profile.id);
      }

      onProfileUpdated(fullName, publicUrl);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Terjadi kesalahan.";
      alert("Gagal mengunggah foto profil: " + msg);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6 flex flex-col items-center text-center relative overflow-hidden">
      {/* Background Decorative Gradient */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 opacity-90" />

      {/* Avatar Container */}
      <div className="relative mt-4 mb-3 z-10">
        <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden bg-emerald-50 flex items-center justify-center relative">
          {avatarUrl ? (
            <Image 
              src={avatarUrl} 
              alt={fullName} 
              fill 
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <UserCircle size={72} className="text-slate-300" />
          )}
          {uploadingImage && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="animate-spin text-white" size={24} />
            </div>
          )}
        </div>

        {/* Camera Upload Button */}
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-md hover:bg-emerald-700 active:scale-95 transition-all border-2 border-white"
          title="Ubah Foto Profil"
        >
          <Camera size={14} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {/* Name and Inline Edit Form */}
      {isEditingName ? (
        <form onSubmit={handleSaveName} className="flex items-center gap-2 mb-2 z-10 max-w-xs w-full">
          <input 
            type="text"
            required
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-slate-50 border border-emerald-500 rounded-xl text-sm font-bold text-slate-800 focus:outline-none"
            autoFocus
          />
          <button 
            type="submit" 
            disabled={isSavingName}
            className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            {isSavingName ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
          </button>
          <button 
            type="button" 
            onClick={() => {
              setTempName(fullName);
              setIsEditingName(false);
            }}
            className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-1.5 mb-1 z-10">
          <h2 className="text-xl font-black text-slate-800">{fullName}</h2>
          <button 
            type="button"
            onClick={() => {
              setTempName(fullName);
              setIsEditingName(true);
            }}
            className="text-slate-400 hover:text-emerald-600 p-1 transition-colors"
            title="Edit Nama"
          >
            <Edit2 size={14} />
          </button>
        </div>
      )}

      {/* Phone Number */}
      <p className="text-xs text-slate-400 font-medium mb-3 z-10">{phone || "Nomor belum diatur"}</p>

      {/* Role & Point Badges */}
      <div className="flex items-center gap-2 z-10">
        {profile?.role === "super_admin" ? (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <Shield size={12} className="text-emerald-600" /> Super Admin
          </span>
        ) : (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <User size={12} /> Anggota Keluarga
          </span>
        )}

        {profile?.role === "member" && (
          <span className="bg-pink-50 text-pink-700 border border-pink-200 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1">
            🎁 {profile?.points || 0} Poin
          </span>
        )}
      </div>
    </div>
  );
}
