// Manually added based on migrations - ideally use `supabase gen types typescript`

    export type Json =
      | string
      | number
      | boolean
      | null
      | { [key: string]: Json | undefined }
      | Json[]

    export type Database = {
      public: {
        Tables: {
          // Existing categories table
          categories: {
            Row: {
              created_at: string
              id: string
              name: string
              user_id: string
            }
            Insert: {
              created_at?: string
              id?: string
              name: string
              user_id: string
            }
            Update: {
              created_at?: string
              id?: string
              name?: string
              user_id?: string
            }
            Relationships: [
              {
                foreignKeyName: "categories_user_id_fkey"
                columns: ["user_id"]
                isOneToOne: false
                referencedRelation: "users"
                referencedColumns: ["id"]
              },
            ]
          }
          // Existing expenses table
          expenses: {
            Row: {
              amount: number
              category_id: string | null
              created_at: string
              description: string | null
              expense_date: string
              id: string
              user_id: string
              // household_id: string | null // Will be added later
            }
            Insert: {
              amount: number
              category_id?: string | null
              created_at?: string
              description?: string | null
              expense_date: string
              id?: string
              user_id: string
              // household_id?: string | null // Will be added later
            }
            Update: {
              amount?: number
              category_id?: string | null
              created_at?: string
              description?: string | null
              expense_date?: string
              id?: string
              user_id?: string
              // household_id?: string | null // Will be added later
            }
            Relationships: [
              {
                foreignKeyName: "expenses_category_id_fkey"
                columns: ["category_id"]
                isOneToOne: false
                referencedRelation: "categories"
                referencedColumns: ["id"]
              },
              {
                foreignKeyName: "expenses_user_id_fkey"
                columns: ["user_id"]
                isOneToOne: false
                referencedRelation: "users"
                referencedColumns: ["id"]
              },
              // { // Will be added later
              //   foreignKeyName: "expenses_household_id_fkey"
              //   columns: ["household_id"]
              //   isOneToOne: false
              //   referencedRelation: "households"
              //   referencedColumns: ["id"]
              // },
            ]
          }
          // Existing budgets table
          budgets: {
            Row: {
              id: string
              user_id: string
              category_id: string | null
              amount: number
              start_date: string
              end_date: string
              created_at: string
              updated_at: string
              // household_id: string | null // Will be added later
            }
            Insert: {
              id?: string
              user_id: string
              category_id?: string | null
              amount: number
              start_date: string
              end_date: string
              created_at?: string
              updated_at?: string
              // household_id?: string | null // Will be added later
            }
            Update: {
              id?: string
              user_id?: string
              category_id?: string | null
              amount?: number
              start_date?: string
              end_date?: string
              created_at?: string
              updated_at?: string
              // household_id?: string | null // Will be added later
            }
            Relationships: [
              {
                foreignKeyName: "budgets_user_id_fkey"
                columns: ["user_id"]
                isOneToOne: false
                referencedRelation: "users"
                referencedColumns: ["id"]
              },
              {
                foreignKeyName: "budgets_category_id_fkey"
                columns: ["category_id"]
                isOneToOne: false
                referencedRelation: "categories"
                referencedColumns: ["id"]
              },
              // { // Will be added later
              //   foreignKeyName: "budgets_household_id_fkey"
              //   columns: ["household_id"]
              //   isOneToOne: false
              //   referencedRelation: "households"
              //   referencedColumns: ["id"]
              // },
            ]
          }
          // Existing incomes table
          incomes: {
              Row: {
                id: string
                user_id: string
                amount: number
                description: string | null
                income_date: string
                created_at: string
                updated_at: string
                // household_id: string | null // Will be added later
              }
              Insert: {
                id?: string
                user_id: string
                amount: number
                description?: string | null
                income_date: string
                created_at?: string
                updated_at?: string
                // household_id?: string | null // Will be added later
              }
              Update: {
                id?: string
                user_id?: string
                amount?: number
                description?: string | null
                income_date?: string
                created_at?: string
                updated_at?: string
                // household_id?: string | null // Will be added later
              }
              Relationships: [
                {
                  foreignKeyName: "incomes_user_id_fkey"
                  columns: ["user_id"]
                  isOneToOne: false
                  referencedRelation: "users"
                  referencedColumns: ["id"]
                }
                // { // Will be added later
                //   foreignKeyName: "incomes_household_id_fkey"
                //   columns: ["household_id"]
                //   isOneToOne: false
                //   referencedRelation: "households"
                //   referencedColumns: ["id"]
                // }
              ]
            }
          // Existing tags table
          tags: {
            Row: {
              id: string
              user_id: string
              name: string
              created_at: string
            }
            Insert: {
              id?: string
              user_id: string
              name: string
              created_at?: string
            }
            Update: {
              id?: string
              user_id?: string
              name?: string
              created_at?: string
            }
            Relationships: [
              {
                foreignKeyName: "tags_user_id_fkey"
                columns: ["user_id"]
                isOneToOne: false
                referencedRelation: "users"
                referencedColumns: ["id"]
              }
            ]
          }
          // Existing expense_tags join table
          expense_tags: {
            Row: {
              expense_id: string
              tag_id: string
              created_at: string
            }
            Insert: {
              expense_id: string
              tag_id: string
              created_at?: string
            }
            Update: { // Usually not updated directly
              expense_id?: string
              tag_id?: string
              created_at?: string
            }
            Relationships: [
              {
                foreignKeyName: "expense_tags_expense_id_fkey"
                columns: ["expense_id"]
                isOneToOne: false
                referencedRelation: "expenses"
                referencedColumns: ["id"]
              },
              {
                foreignKeyName: "expense_tags_tag_id_fkey"
                columns: ["tag_id"]
                isOneToOne: false
                referencedRelation: "tags"
                referencedColumns: ["id"]
              }
            ]
          }
          // --- NEW Household Tables ---
          households: {
            Row: {
              id: string
              name: string
              owner_id: string
              created_at: string
              updated_at: string
            }
            Insert: {
              id?: string
              name: string
              owner_id: string // Must be set on insert
              created_at?: string
              updated_at?: string
            }
            Update: {
              id?: string
              name?: string
              owner_id?: string // Ownership transfer not handled via simple update
              created_at?: string
              updated_at?: string
            }
            Relationships: [
              {
                foreignKeyName: "households_owner_id_fkey"
                columns: ["owner_id"]
                isOneToOne: false
                referencedRelation: "users"
                referencedColumns: ["id"]
              }
            ]
          }
          household_members: {
            Row: {
              household_id: string
              user_id: string
              role: string // 'owner' | 'member'
              joined_at: string
            }
            Insert: {
              household_id: string
              user_id: string
              role?: string // Defaults to 'member' in DB
              joined_at?: string
            }
            Update: { // Role updates might be restricted by RLS
              household_id?: string
              user_id?: string
              role?: string
              joined_at?: string
            }
            Relationships: [
              {
                foreignKeyName: "household_members_household_id_fkey"
                columns: ["household_id"]
                isOneToOne: false
                referencedRelation: "households"
                referencedColumns: ["id"]
              },
              {
                foreignKeyName: "household_members_user_id_fkey"
                columns: ["user_id"]
                isOneToOne: false
                referencedRelation: "users"
                referencedColumns: ["id"]
              }
            ]
          }
          // --- END NEW Household Tables ---
        }
        Views: {
          [_ in never]: never
        }
        Functions: {
          [_ in never]: never
        }
        Enums: {
          [_ in never]: never
        }
        CompositeTypes: {
          [_ in never]: never
        }
      }
    }

    // Helper types (optional but can be useful)
    export type Tables<
      PublicTableNameOrOptions extends
        | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
        | { schema: keyof Database },
      TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
            Database[PublicTableNameOrOptions["schema"]]["Views"])
        : never = never,
    > = PublicTableNameOrOptions extends { schema: keyof Database }
      ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
          Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
          Row: infer R
        }
        ? R
        : never
      : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
            Database["public"]["Views"])
        ? (Database["public"]["Tables"] &
            Database["public"]["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
          }
          ? R
          : never
        : never

    export type TablesInsert<
      PublicTableNameOrOptions extends
        | keyof Database["public"]["Tables"]
        | { schema: keyof Database },
      TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never = never,
    > = PublicTableNameOrOptions extends { schema: keyof Database }
      ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Insert: infer I
        }
        ? I
        : never
      : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
        ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
            Insert: infer I
          }
          ? I
          : never
        : never

    export type TablesUpdate<
      PublicTableNameOrOptions extends
        | keyof Database["public"]["Tables"]
        | { schema: keyof Database },
      TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never = never,
    > = PublicTableNameOrOptions extends { schema: keyof Database }
      ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
          Update: infer U
        }
        ? U
        : never
      : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
        ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
            Update: infer U
          }
          ? U
          : never
        : never

    export type Enums<
      PublicEnumNameOrOptions extends
        | keyof Database["public"]["Enums"]
        | { schema: keyof Database },
      EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
        : never = never,
    > = PublicEnumNameOrOptions extends { schema: keyof Database }
      ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
      : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
        ? Database["public"]["Enums"][PublicEnumNameOrOptions]
        : never
