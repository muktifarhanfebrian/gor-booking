"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Court, CourtInput, CourtStatus } from "@/types";
import {
  getCourts,
  createCourt,
  updateCourt,
  deleteCourt,
} from "@/services/courtService";

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

// ── Status badge helper ────────────────────────────────────────────────
function statusBadge(court: Court) {
  if (court.isBlocked)
    return { label: "🔒 Diblokir", cls: "bg-red-500/15 text-red-300 border-red-500/25" };
  if (court.status === "maintenance")
    return { label: "🔧 Maintenance", cls: "bg-amber-500/15 text-amber-300 border-amber-500/25" };
  return { label: "✓ Aktif", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" };
}

// ── Court Card ─────────────────────────────────────────────────────────
function CourtCard({
  court,
  onEdit,
  onDelete,
}: {
  court: Court;
  onEdit: (c: Court) => void;
  onDelete: (c: Court) => void;
}) {
  const badge = statusBadge(court);
  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-black text-white text-base leading-tight">{court.name}</h3>
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{court.id}</p>
        </div>
        <span className={`flex-shrink-0 text-[9px] font-black px-2.5 py-1 rounded-full border ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-slate-800">
        <button
          onClick={() => onEdit(court)}
          className="flex-1 py-2 bg-blue-500/12 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 text-[10px] font-black rounded-xl transition-all active:scale-95"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => onDelete(court)}
          className="flex-1 py-2 bg-red-500/10 border border-red-500/18 text-red-300 hover:bg-red-500/18 text-[10px] font-black rounded-xl transition-all active:scale-95"
        >
          🗑️ Hapus
        </button>
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="h-5 bg-white/8 rounded-lg w-3/4" />
      <div className="h-3 bg-white/5 rounded w-1/2" />
      <div className="flex gap-2 pt-2">
        <div className="flex-1 h-8 bg-white/5 rounded-xl" />
        <div className="flex-1 h-8 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// COURTS MANAGER COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export function CourtsManager() {
  const { toasts, show } = useToast();

  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "maintenance" | "blocked">("all");

  // ── Create / Edit modal state ──────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Court | null>(null);
  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState<CourtStatus>("active");
  const [formBlocked, setFormBlocked] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Delete confirm modal ───────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Court | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────
  const fetchCourts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getCourts();
    if (error) show(error, "error");
    else setCourts(data ?? []);
    setLoading(false);
  }, [show]);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  // ── Open add modal ─────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setFormName("");
    setFormStatus("active");
    setFormBlocked(false);
    setShowModal(true);
  };

  // ── Open edit modal ────────────────────────────────────────────────
  const openEdit = (court: Court) => {
    setEditTarget(court);
    setFormName(court.name);
    setFormStatus(court.status);
    setFormBlocked(court.isBlocked);
    setShowModal(true);
  };

  // ── Save (create or update) ────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);

    try {
      const input: CourtInput = {
        name: formName,
        status: formStatus,
        isBlocked: formBlocked,
      };

      if (editTarget) {
        const { error } = await updateCourt(editTarget.id, input);
        if (error) show(error, "error");
        else { show(`Court "${formName}" berhasil diperbarui.`); }
      } else {
        const { error } = await createCourt(input);
        if (error) show(error, "error");
        else { show(`Court "${formName}" berhasil ditambahkan.`); }
      }
      setShowModal(false);
      fetchCourts();
    } catch (err) {
      show("Gagal memproses data. Periksa koneksi internet Anda dan coba lagi.", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete confirmed ───────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await deleteCourt(deleteTarget.id);
      if (error) show(error, "error");
      else show(`Court "${deleteTarget.name}" dihapus.`);
      setDeleteTarget(null);
      fetchCourts();
    } catch (err) {
      show("Gagal memproses data. Periksa koneksi internet Anda dan coba lagi.", "error");
    } finally {
      setDeleting(false);
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────
  const filtered = courts.filter((c) => {
    if (filter === "blocked")     return c.isBlocked;
    if (filter === "maintenance") return c.status === "maintenance" && !c.isBlocked;
    if (filter === "active")      return c.status === "active" && !c.isBlocked;
    return true;
  });

  const filterTabs = [
    { id: "all",         label: "Semua",       count: courts.length },
    { id: "active",      label: "✓ Aktif",     count: courts.filter(c => c.status === "active" && !c.isBlocked).length },
    { id: "maintenance", label: "🔧 Maintenance", count: courts.filter(c => c.status === "maintenance").length },
    { id: "blocked",     label: "🔒 Diblokir",  count: courts.filter(c => c.isBlocked).length },
  ] as const;

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* ── Header Controls ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Master Data Lapangan</h3>
        </div>
        <button
          onClick={openAdd}
          className="w-full sm:w-auto flex justify-center items-center gap-1.5 px-4 py-2 bg-lime-500 hover:bg-lime-400 text-slate-950 text-sm font-black rounded-lg shadow-lg shadow-lime-500/20 transition-all hover:scale-105 active:scale-95"
        >
          ＋ Tambah Lapangan
        </button>
      </div>

      {/* ── iOS Segmented Filter ───────────────────── */}
      <div className="bg-slate-900/40 backdrop-blur-md p-1 rounded-2xl flex gap-1 border border-slate-800/60 shadow-inner">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 py-2 px-1 text-center rounded-xl transition-all duration-200 ${
                filter === tab.id
                  ? "bg-slate-800 text-lime-400 shadow-lg border border-slate-700"
                  : "text-slate-500 hover:text-slate-400"
              }`}
            >
              <p className="text-[9px] font-black uppercase tracking-wider whitespace-nowrap">{tab.label}</p>
              <p className={`text-xs font-black ${filter === tab.id ? "text-blue-300" : "text-slate-600"}`}>
                {tab.count}
              </p>
            </button>
          ))}
        </div>

        {/* ── Court Grid ────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : filtered.length === 0
            ? (
              <div className="col-span-2 text-center py-14 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl">
                <p className="text-2xl mb-2">🏸</p>
                <p className="text-xs text-slate-400">Tidak ada lapangan ditemukan.</p>
              </div>
            )
            : filtered.map((c) => (
              <CourtCard
                key={c.id}
                court={c}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))
          }
        </div>

      {/* ══════════════════════════════════════════════ */}
      {/*  TOAST STACK                                   */}
      {/* ══════════════════════════════════════════════ */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl border pointer-events-auto transition-all ${
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
      {/*  CREATE / EDIT MODAL                           */}
      {/* ══════════════════════════════════════════════ */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <form
            onSubmit={handleSave}
            className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <span>{editTarget ? "✏️" : "➕"}</span>
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  {editTarget ? "Edit Lapangan" : "Tambah Lapangan Baru"}
                </span>
              </div>
              <button type="button" onClick={() => setShowModal(false)}
                className="w-7 h-7 bg-slate-900/50 hover:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all text-sm font-bold">
                ✕
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Nama Lapangan</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Court 1 – Vinyl Premium"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 transition-all"
                  required
                />
              </div>

              {/* Status toggle */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Status Operasional</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["active", "maintenance"] as CourtStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormStatus(s)}
                      className={`py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-wider transition-all ${
                        formStatus === s
                          ? s === "active"
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                            : "bg-amber-500/15 border-amber-500/40 text-amber-300"
                          : "bg-white/[0.03] border-white/8 text-slate-500"
                      }`}
                    >
                      {s === "active" ? "✓ Aktif" : "🔧 Maintenance"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Block toggle */}
              <div>
                <label className="block text-slate-400 mb-1.5 font-semibold">Kunci Slot (Turnamen / Internal)</label>
                <button
                  type="button"
                  onClick={() => setFormBlocked(!formBlocked)}
                  className={`w-full py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-wider transition-all ${
                    formBlocked
                      ? "bg-red-500/15 border-red-500/35 text-red-300"
                      : "bg-white/[0.03] border-white/8 text-slate-500 hover:text-slate-400"
                  }`}
                >
                  {formBlocked ? "🔒 Lapangan Diblokir (Klik untuk Buka)" : "🔓 Tidak Diblokir (Klik untuk Kunci)"}
                </button>
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
                  : editTarget ? "Simpan Perubahan" : "Tambah Lapangan"}
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
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                🗑️
              </div>
              <div>
                <p className="font-black text-white text-sm">Hapus Lapangan?</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  <span className="text-red-300 font-bold">{deleteTarget.name}</span> akan dihapus permanen dari sistem beserta seluruh data terkait.
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
