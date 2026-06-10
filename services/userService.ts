"use server";

/**
 * userService.ts
 * Service layer for User CRUD operations against Supabase `users` table.
 * Maps DB snake_case columns <-> TypeScript camelCase.
 *
 * DB schema (New Passwordless Model):
 *   id               UUID  DEFAULT gen_random_uuid() PRIMARY KEY
 *   phone            VARCHAR(50) UNIQUE NOT NULL
 *   name             VARCHAR(255) NOT NULL
 *   email            VARCHAR(255) NULL
 *   role             VARCHAR(50) -- 'user' | 'admin'
 *   created_at       TIMESTAMPTZ
 */

import { getAdminSupabase } from "@/lib/adminAuth";
import type { User, UserInput, UserRole, ServiceResult } from "@/types";

// ── Row type matching Supabase table ──────────────────────────────────
interface UserRow {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  role: string;
  created_at: string;
}

// ── Mapper: DB row → camelCase ────────────────────────────────────────
function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    role: row.role as UserRole,
    createdAt: row.created_at,
  };
}

// ── getUsers ──────────────────────────────────────────────────────────
/** Fetch all users ordered by created_at descending */
export async function getUsers(): Promise<ServiceResult<User[]>> {
  const supabaseAdmin = getAdminSupabase();
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, phone, name, email, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[userService.getUsers]", error.message);
    return { data: null, error: error.message };
  }

  return { data: (data as UserRow[]).map(rowToUser), error: null };
}

// ── createUser ────────────────────────────────────────────────────────
/** Bypass-panel: admin registers a new user manually */
export async function createUser(
  input: UserInput
): Promise<ServiceResult<User>> {
  const phone = input.phone.trim();

  const payload: Omit<UserRow, "id" | "created_at"> = {
    name: input.name.trim(),
    phone: phone,
    email: input.email ? input.email.trim() : null,
    role: input.role ?? "user",
  };

  const supabaseAdmin = getAdminSupabase();
  const { data, error } = await supabaseAdmin
    .from("users")
    .insert(payload)
    .select("id, phone, name, email, role, created_at")
    .single();

  if (error) {
    console.error("[userService.createUser]", error.message);
    return { data: null, error: error.message };
  }

  return { data: rowToUser(data as UserRow), error: null };
}

// ── updateUser ────────────────────────────────────────────────────────
/**
 * Update name, phone, email or role for a user.
 */
export async function updateUser(
  id: string,
  input: Partial<UserInput>
): Promise<ServiceResult<User>> {
  const payload: Partial<Pick<UserRow, "name" | "phone" | "email" | "role">> = {};
  if (input.name !== undefined) {
    payload.name = input.name.trim();
  }
  if (input.phone !== undefined) {
    payload.phone = input.phone.trim();
  }
  if (input.email !== undefined) {
    payload.email = input.email ? input.email.trim() : null;
  }
  if (input.role !== undefined) {
    payload.role = input.role;
  }

  const supabaseAdmin = getAdminSupabase();
  const { data, error } = await supabaseAdmin
    .from("users")
    .update(payload)
    .eq("id", id)
    .select("id, phone, name, email, role, created_at")
    .single();

  if (error) {
    console.error("[userService.updateUser]", error.message);
    return { data: null, error: error.message };
  }

  return { data: rowToUser(data as UserRow), error: null };
}

// ── deleteUser ────────────────────────────────────────────────────────
/** Delete a user by UUID */
export async function deleteUser(id: string): Promise<ServiceResult<null>> {
  const supabaseAdmin = getAdminSupabase();
  const { error } = await supabaseAdmin.from("users").delete().eq("id", id);

  if (error) {
    console.error("[userService.deleteUser]", error.message);
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}
