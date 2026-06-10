"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { User, UserInput, UserRole } from "@/types";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/services/userService";

// ── Toast ──────────────────────────────────────────────────────────────
type ToastType = "success" | "error";
interface Toast { id: number; msg: string; type: ToastType }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((msg: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

// ── Role Badge ─────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: UserRole }) {
  return role === "admin" ? (
    <span className="text-[9px] font-black px-2.5 py-1 rounded-full border bg-red-500/15 border-red-500/25 text-red-300 uppercase tracking-wider">
      ⚙ Admin
    </span>
  ) : (
    <span className="text-[9px] font-black px-2.5 py-1 rounded-full border bg-blue-500/12 border-blue-500/20 text-blue-300 uppercase tracking-wider">
      👤 User
    </span>
  );
}

// ── Skeleton Row ───────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-4 flex justify-between items-center animate-pulse">
      <div className="space-y-2">
        <div className="h-4 bg-white/8 rounded w-32" />
        <div className="h-3 bg-white/5 rounded w-24" />
      </div>
      <div className="flex gap-2">
        <div className="w-16 h-7 bg-white/5 rounded-xl" />
        <div className="w-16 h-7 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// USERS MANAGER COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export function UsersManager() {
  const { toasts, show } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ── Create modal state ─────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<UserRole>("user");
  const [saving, setSaving] = useState(false);

  // ── Edit modal state ───────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("user");
  const [editSaving, setEditSaving] = useState(false);

  // ── Delete confirm ─────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getUsers();
    if (error) show(error, "error");
    else setUsers(data ?? []);
    setLoading(false);
  }, [show]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Filtered list ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  }, [users, search]);

  // ── Create user ────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const input: UserInput = { name: formName, phone: formPhone, email: formEmail, role: formRole };
      const { error } = await createUser(input);
      if (error) show(error, "error");
      else { show(`Akun "${formName}" berhasil ditambahkan.`); }
      setShowModal(false);
      setFormName(""); setFormPhone(""); setFormEmail(""); setFormRole("user");
      fetchUsers();
    } catch (err) {
      show("Gagal memproses data. Periksa koneksi internet Anda dan coba lagi.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Open edit modal ────────────────────────────────────────────────
  const openEdit = (user: User) => {
    setEditTarget(user);
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditEmail(user.email || "");
    setEditRole(user.role);
  };

  // ── Save edit ──────────────────────────────────────────────────────
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    setEditSaving(true);
    try {
      const { error } = await updateUser(editTarget.id, {
        name: editName,
        phone: editPhone,
        email: editEmail,
        role: editRole,
      });
      if (error) show(error, "error");
      else show(`Akun "${editName}" berhasil diperbarui.`);
      setEditTarget(null);
      fetchUsers();
    } catch (err) {
      show("Gagal memproses data. Periksa koneksi internet Anda dan coba lagi.", "error");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Toggle role (quick action) ─────────────────────────────────────
  const handleToggleRole = async (user: User) => {
    try {
      const newRole: UserRole = user.role === "admin" ? "user" : "admin";
      const { error } = await updateUser(user.id, { role: newRole });
      if (error) show(error, "error");
      else show(`Role "${user.name}" diubah ke ${newRole}.`);
      fetchUsers();
    } catch (err) {
      show("Gagal memproses data. Periksa koneksi internet Anda dan coba lagi.", "error");
    }
  };

  // ── Delete confirmed ───────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await deleteUser(deleteTarget.id);
      if (error) show(error, "error");
      else show(`Akun "${deleteTarget.name}" dihapus.`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      show("Gagal memproses data. Periksa koneksi internet Anda dan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* ── Header Controls ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Master Data Akun</h3>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full sm:w-auto flex justify-center items-center gap-1.5 px-4 py-2 bg-lime-500 hover:bg-lime-400 text-slate-950 text-sm font-black rounded-lg shadow-lg shadow-lime-500/20 transition-all hover:scale-105 active:scale-95"
        >
          ＋ Tambah Akun
        </button>
      </div>

      {/* ── Search Bar ────────────────────────────── */}
      <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau nomor WhatsApp..."
            className="w-full bg-slate-900/40 border border-slate-800/60 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 focus:bg-slate-900/60 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Result count */}
        {search && (
          <p className="text-[10px] text-slate-500">
            {filtered.length} hasil ditemukan untuk &ldquo;{search}&rdquo;
          </p>
        )}

        {/* ── User List ──────────────────────────────── */}
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
            : filtered.length === 0
            ? (
              <div className="text-center py-14 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl">
                <p className="text-2xl mb-2">📭</p>
                <p className="text-xs text-slate-400">Tidak ada akun ditemukan.</p>
              </div>
            )
            : filtered.map((user) => {
                const maskPhone = (phone: string) => {
                  if (!phone) return "-";
                  const p = phone.replace(/\D/g, "");
                  if (p.length < 8) return p;
                  return p.slice(0, 4) + "-" + p.slice(4, 8) + "-" + p.slice(8);
                };

                return (
              <div
                key={user.id}
                className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 hover:border-slate-700 p-4 rounded-2xl flex justify-between items-center gap-3 transition-all"
              >
                {/* User info */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-white text-sm leading-tight truncate">{user.name}</p>
                    <RoleBadge role={user.role} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">📱 {maskPhone(user.phone)}</p>
                  <p className="text-[10px] text-slate-500 font-mono">✉️ {user.email ? user.email : "-"}</p>
                  <p className="text-[9px] text-slate-600">
                    Bergabung: {new Date(user.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggleRole(user)}
                    title={`Ubah ke ${user.role === "admin" ? "User" : "Admin"}`}
                    className={`px-2.5 py-1.5 text-[9px] font-black rounded-xl border transition-all active:scale-95 ${
                      user.role === "admin"
                        ? "bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/18"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-300 hover:bg-blue-500/18"
                    }`}
                  >
                    {user.role === "admin" ? "→ User" : "→ Admin"}
                  </button>
                  <button
                    onClick={() => openEdit(user)}
                    className="px-2.5 py-1.5 bg-slate-500/10 border border-slate-500/20 text-slate-300 hover:bg-slate-500/18 text-[9px] font-black rounded-xl transition-all active:scale-95"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setDeleteTarget(user)}
                    className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/18 text-red-300 hover:bg-red-500/18 text-[9px] font-black rounded-xl transition-all active:scale-95"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              );
            })
          }
        </div>

        {/* Summary footer */}
        {!loading && users.length > 0 && (
          <p className="text-center text-[10px] text-slate-600 pb-4">
            Total {users.length} akun · {users.filter(u => u.role === "admin").length} admin · {users.filter(u => u.role === "user").length} user
          </p>
        )}

      {/* ══════════════════════════════════════════════ */}
      {/*  TOAST STACK                                   */}
      {/* ══════════════════════════════════════════════ */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl border pointer-events-auto ${
              t.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-300"
                : "bg-red-950/90 border-red-500/30 text-red-300"
            }`}
          >
            {t.type === "success" ? "✓ " : "✗ "}{t.msg}
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/*  CREATE MODAL (Bypass Panel)                   */}
      {/* ══════════════════════════════════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <form
            onSubmit={handleCreate}
            className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <span>➕</span>
                <span className="text-xs font-black text-white uppercase tracking-wider">Tambah Akun Pengguna</span>
              </div>
              <button type="button" onClick={() => setShowModal(false)}
                className="w-7 h-7 bg-slate-900/50 hover:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Nama Lengkap</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nama pengguna"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Nomor WhatsApp</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="08XXXXXXXXXX"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Email (Opsional)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="admin@gor.com"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Hak Akses</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["user", "admin"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setFormRole(r)}
                      className={`py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-wider transition-all ${
                        formRole === r
                          ? r === "admin"
                            ? "bg-red-500/15 border-red-500/35 text-red-300"
                            : "bg-blue-500/15 border-blue-500/35 text-blue-300"
                          : "bg-white/[0.03] border-white/8 text-slate-500"
                      }`}
                    >
                      {r === "admin" ? "⚙ Admin" : "👤 User"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-lime-500 hover:bg-lime-400 text-slate-950 rounded-2xl font-black text-xs shadow-xl shadow-lime-500/20 transition-all active:scale-95 flex justify-center items-center gap-2"
              >
                {saving
                  ? <><span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" /> Menyimpan...</>
                  : "Daftarkan Akun"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/*  EDIT MODAL                                    */}
      {/* ══════════════════════════════════════════════ */}
      {editTarget && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setEditTarget(null); }}
        >
          <form
            onSubmit={handleEdit}
            className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <span>✏️</span>
                <span className="text-xs font-black text-white uppercase tracking-wider">Edit Akun Pengguna</span>
              </div>
              <button type="button" onClick={() => setEditTarget(null)}
                className="w-7 h-7 bg-slate-900/50 hover:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Nama Lengkap</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500/40 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Nomor WhatsApp</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500/40 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Email (Opsional)</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500/40 transition-all"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Hak Akses</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["user", "admin"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditRole(r)}
                      className={`py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-wider transition-all ${
                        editRole === r
                          ? r === "admin"
                            ? "bg-red-500/15 border-red-500/35 text-red-300"
                            : "bg-blue-500/15 border-blue-500/35 text-blue-300"
                          : "bg-white/[0.03] border-white/8 text-slate-500"
                      }`}
                    >
                      {r === "admin" ? "⚙ Admin" : "👤 User"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                type="submit"
                disabled={editSaving}
                className="w-full py-3.5 bg-lime-500 hover:bg-lime-400 text-slate-950 rounded-2xl font-black text-xs shadow-xl shadow-lime-500/20 transition-all active:scale-95 flex justify-center items-center gap-2"
              >
                {editSaving
                  ? <><span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" /> Menyimpan...</>
                  : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/*  DELETE CONFIRM MODAL                          */}
      {/* ══════════════════════════════════════════════ */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div className="w-full max-w-xs bg-slate-950 border border-red-500/20 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 text-center space-y-3">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-2xl">🗑️</div>
              <div>
                <p className="font-black text-white text-sm">Hapus Akun Pengguna?</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Akun <span className="text-red-300 font-bold">{deleteTarget.name}</span> ({deleteTarget.phone}) akan dihapus permanen dari database.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 bg-slate-900/50 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-2xl font-bold text-xs transition-all active:scale-95"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-red-500/20 border border-red-500/35 text-red-300 hover:bg-red-500/30 rounded-2xl font-black text-xs transition-all active:scale-95 flex justify-center items-center gap-2"
              >
                {deleting
                  ? <><span className="animate-spin rounded-full h-3 w-3 border-2 border-red-300 border-t-transparent" /> Menghapus...</>
                  : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
