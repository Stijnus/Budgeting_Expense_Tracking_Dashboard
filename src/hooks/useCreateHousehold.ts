import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useCreateHousehold() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function createHousehold(name: string) {
    setLoading(true);
    setError(null);
    setSuccess(false);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('households').insert({
      name,
      created_by: user.id
    }).select('id');
    if (error) setError(error.message);
    else {
      // Add creator as owner in household_members
      const householdId = data[0].id;
      await supabase.from('household_members').insert({
        household_id: householdId,
        user_id: user.id,
        role: 'owner',
        status: 'accepted'
      });
      setSuccess(true);
    }
    setLoading(false);
  }

  return { createHousehold, loading, error, success };
}
