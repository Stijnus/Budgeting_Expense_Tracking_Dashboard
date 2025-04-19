// This file extends the Supabase types

declare module "@supabase/supabase-js" {
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
