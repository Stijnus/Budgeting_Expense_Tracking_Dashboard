import { SupabaseClient } from '@supabase/supabase-js';

declare module '@supabase/supabase-js' {
  interface Database {
    public: {
      Functions: {
        delete_user: {
          Args: Record<string, never>;
          Returns: void;
        };
      };
    };
  }
}
