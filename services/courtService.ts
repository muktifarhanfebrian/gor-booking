"use server";

/**
 * courtService.ts
 * Service layer for Court CRUD operations against Supabase `courts` table.
 * Maps DB snake_case columns <-> TypeScript camelCase.
 *
 * DB schema (after migration v2):
 *   id         VARCHAR(50) PRIMARY KEY
 *   name       VARCHAR(100)
 *   status     VARCHAR(50)  -- 'active' | 'maintenance'
 *   is_blocked BOOLEAN      DEFAULT false
 */

import { getAdminSupabase } from "@/lib/adminAuth";
import type { Court, CourtInput, CourtStatus, ServiceResult } from "@/types";

// ── Row type matching Supabase table ──────────────────────────────────
interface CourtRow {
  id: string;
  name: string | null;
  status: string;
  is_blocked: boolean;
}

// ── Mapper: DB row → camelCase ────────────────────────────────────────
function rowToCourt(row: CourtRow): Court {
  return {
    id: row.id,
    name: row.name ?? row.id, // Fallback to id if name not yet set
    status: row.status as CourtStatus,
    isBlocked: row.is_blocked,
  };
}

// ── getCourts ─────────────────────────────────────────────────────────
/** Fetch all courts ordered by id */
export async function getCourts(): Promise<ServiceResult<Court[]>> {
  const supabaseAdmin = getAdminSupabase();
  const { data, error } = await supabaseAdmin
    .from("courts")
    .select("id, name, status, is_blocked")
    .order("id", { ascending: true });

  if (error) {
    console.error("[courtService.getCourts]", error.message);
    return { data: null, error: error.message };
  }

  return { data: (data as CourtRow[]).map(rowToCourt), error: null };
}

// ── createCourt ───────────────────────────────────────────────────────
/** Insert a new court record */
export async function createCourt(
  input: CourtInput
): Promise<ServiceResult<Court>> {
  const payload = {
    id: `court-${Date.now()}`,
    name: input.name.trim(),
    status: input.status ?? "active",
    is_blocked: input.isBlocked ?? false,
  };

  const supabaseAdmin = getAdminSupabase();
  const { data, error } = await supabaseAdmin
    .from("courts")
    .insert(payload)
    .select("id, name, status, is_blocked")
    .single();

  if (error) {
    console.error("[courtService.createCourt]", error.message);
    return { data: null, error: error.message };
  }

  return { data: rowToCourt(data as CourtRow), error: null };
}

// ── updateCourt ───────────────────────────────────────────────────────
/** Update one or more fields on an existing court */
export async function updateCourt(
  id: string,
  input: Partial<CourtInput>
): Promise<ServiceResult<Court>> {
  // Build DB payload, mapping camelCase → snake_case
  const payload: Partial<CourtRow> = {};
  if (input.name      !== undefined) payload.name       = input.name.trim();
  if (input.status    !== undefined) payload.status     = input.status;
  if (input.isBlocked !== undefined) payload.is_blocked = input.isBlocked;

  const supabaseAdmin = getAdminSupabase();
  const { data, error } = await supabaseAdmin
    .from("courts")
    .update(payload)
    .eq("id", id)
    .select("id, name, status, is_blocked")
    .single();

  if (error) {
    console.error("[courtService.updateCourt]", error.message);
    return { data: null, error: error.message };
  }

  return { data: rowToCourt(data as CourtRow), error: null };
}

// ── deleteCourt ───────────────────────────────────────────────────────
/** Delete a court by id */
export async function deleteCourt(id: string): Promise<ServiceResult<null>> {
  const supabaseAdmin = getAdminSupabase();
  const { error } = await supabaseAdmin.from("courts").delete().eq("id", id);

  if (error) {
    console.error("[courtService.deleteCourt]", error.message);
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}
