import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useInviteMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function inviteMember(householdId: string, email: string) {
    setLoading(true);
    setError(null);
    setSuccess(false);
    // Generate a token (could be improved)
    const token = Math.random().toString(36).substring(2);
    const { error } = await supabase.from('household_invitations').insert({
      household_id: householdId,
      email,
      invite_token: token,
      status: 'pending',
    });
    if (error) setError(error.message);
    else setSuccess(true);
    setLoading(false);
  }

  return { inviteMember, loading, error, success };
}
