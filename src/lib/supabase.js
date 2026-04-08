import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qkniibktuszvdpgycrea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_1HmQKN-J3mqgjN292zm8AA_CUP2l3Tm';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Validate an access code against the advisor_codes table.
 * Returns the code row if valid and active, null otherwise.
 */
export async function validateCode(code) {
  const { data, error } = await supabase
    .from('advisor_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('active', true)
    .maybeSingle();

  if (error || !data) return null;

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

  return data;
}

/**
 * Fetch all advisor codes (admin only).
 */
export async function fetchAllCodes() {
  const { data, error } = await supabase
    .from('advisor_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Create a new advisor code.
 */
export async function createCode({ code, advisor_name, is_admin = false, expires_at = null }) {
  const { data, error } = await supabase
    .from('advisor_codes')
    .insert([{ code: code.trim().toUpperCase(), advisor_name, is_admin, active: true, expires_at }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Toggle a code active/inactive.
 */
export async function toggleCode(id, active) {
  const { error } = await supabase
    .from('advisor_codes')
    .update({ active })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Delete a code permanently.
 */
export async function deleteCode(id) {
  const { error } = await supabase
    .from('advisor_codes')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
