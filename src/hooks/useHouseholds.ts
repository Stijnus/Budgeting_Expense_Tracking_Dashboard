import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useHouseholds() {
  const [households, setHouseholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHouseholds() {
      setLoading(true);
      const user = supabase.auth.getUser();
      const { data, error } = await supabase
        .from('household_members')
        .select('household_id, households(name)')
        .eq('user_id', (await user).data.user?.id);
      if (!error) {
        setHouseholds(data.map((m: any) => ({ id: m.household_id, name: m.households.name })));
      }
      setLoading(false);
    }
    fetchHouseholds();
  }, []);

  return { households, loading };
}
