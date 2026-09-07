"use server";

import { createClient } from "@supabase/supabase-js";
import { AdminUser, UserProfile, UserRole } from "@/types/database";

// Menggunakan Service Role Key agar punya akses Admin untuk membuat user
// dan mem-bypass Row Level Security (RLS) jika ada.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Memverifikasi apakah request berasal dari pengguna dengan role super_admin
 */
async function verifySuperAdmin(accessToken?: string) {
  if (!supabaseServiceKey) {
    return { authorized: false, error: "SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment." };
  }
  if (!accessToken) {
    return { authorized: false, error: "Akses ditolak. Sesi autentikasi tidak ditemukan." };
  }

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  if (userError || !user) {
    return { authorized: false, error: "Sesi Anda tidak valid atau telah kedaluwarsa. Silakan login kembali." };
  }

  // Verifikasi role di tabel profiles atau user_metadata
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = profile?.role === "super_admin" || user.user_metadata?.role === "super_admin";

  if (!isSuperAdmin) {
    return { authorized: false, error: "Akses ditolak. Hanya Super Admin yang berhak melakukan tindakan ini." };
  }

  return { authorized: true, user };
}

export async function createUserAction(accessToken: string, phone: string, pin: string, fullName: string) {
  try {
    const authCheck = await verifySuperAdmin(accessToken);
    if (!authCheck.authorized) return { error: authCheck.error };

    // Validasi input
    const cleanPhone = phone.replace(/\D/g, "").trim();
    const cleanFullName = fullName.trim();
    const cleanPin = pin.trim();

    if (!cleanPhone || cleanPhone.length < 10) return { error: "Nomor HP minimal 10 digit angka." };
    if (!cleanPin || cleanPin.length !== 6) return { error: "PIN harus 6 digit angka." };
    if (!cleanFullName) return { error: "Nama pengguna harus diisi." };

    const email = `hp_${cleanPhone}@kaskeluarga.com`;

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: cleanPin,
      email_confirm: true, // Auto confirm
      user_metadata: {
        full_name: cleanFullName,
        role: "member"
      }
    });

    if (error) {
      console.error("Create user error:", error);
      if (error.message.includes("already registered") || error.message.includes("already exists")) {
        return { error: `Nomor HP ${cleanPhone} sudah terdaftar di sistem.` };
      }
      return { error: error.message };
    }

    if (data?.user?.id) {
      // Pastikan baris profil juga langsung dibuat
      await supabaseAdmin.from("profiles").upsert({
        id: data.user.id,
        full_name: cleanFullName,
        role: "member",
        points: 0
      });
    }

    return { success: true, userId: data.user.id };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan sistem saat mendaftarkan akun.";
    console.error("Create user exception:", err);
    return { error: errorMessage };
  }
}

export async function getUsersAction(accessToken: string): Promise<{ success?: boolean; users?: AdminUser[]; error?: string }> {
  try {
    const authCheck = await verifySuperAdmin(accessToken);
    if (!authCheck.authorized) return { error: authCheck.error };

    // Auth admin returns users sorted by default
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) return { error: error.message };

    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
    const profileList = (profiles || []) as UserProfile[];
    
    // Format the response nicely
    const users: AdminUser[] = (data?.users || []).map(u => {
      const phoneOnly = u.email ? u.email.replace("hp_", "").replace("@kaskeluarga.com", "") : "";
      const p = profileList.find(p => p.id === u.id);
      
      return {
        id: u.id,
        phone: phoneOnly,
        fullName: p?.full_name || (u.user_metadata?.full_name as string) || "Tanpa Nama",
        role: (p?.role || 'member') as UserRole,
        points: p?.points || 0,
        createdAt: u.created_at
      };
    });

    return { success: true, users };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan sistem saat mengambil data.";
    console.error("Get users exception:", err);
    return { error: errorMessage };
  }
}

export async function deleteUserAction(accessToken: string, userId: string) {
  try {
    const authCheck = await verifySuperAdmin(accessToken);
    if (!authCheck.authorized) return { error: authCheck.error };
    
    if (!userId) return { error: "ID pengguna tidak valid." };

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };
    
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Gagal menghapus user.";
    console.error("Delete user exception:", err);
    return { error: errorMessage };
  }
}

export async function updateUserAction(accessToken: string, userId: string, phone: string, fullName: string, pin?: string) {
  try {
    const authCheck = await verifySuperAdmin(accessToken);
    if (!authCheck.authorized) return { error: authCheck.error };

    if (!userId) return { error: "ID pengguna tidak valid." };
    if (!phone || phone.length < 10) return { error: "Nomor HP tidak valid." };
    if (!fullName) return { error: "Nama pengguna harus diisi." };
    
    const updatePayload: { email: string; user_metadata: { full_name: string }; password?: string } = {
      email: `hp_${phone}@kaskeluarga.com`,
      user_metadata: { full_name: fullName }
    };
    
    if (pin && pin.length === 6) {
      updatePayload.password = pin;
    }
    
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, updatePayload);
    
    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "Nomor HP ini sudah digunakan anggota lain." };
      }
      return { error: error.message };
    }
    
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Gagal memperbarui user.";
    console.error("Update user exception:", err);
    return { error: errorMessage };
  }
}

export async function updateUserRoleAction(accessToken: string, userId: string, newRole: string) {
  try {
    const authCheck = await verifySuperAdmin(accessToken);
    if (!authCheck.authorized) return { error: authCheck.error };

    if (!userId) return { error: "ID pengguna tidak valid." };
    
    const { error } = await supabaseAdmin.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) return { error: error.message };
    
    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Gagal memperbarui role.";
    console.error("Update role exception:", err);
    return { error: errorMessage };
  }
}


