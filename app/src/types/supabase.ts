// Auto-generated Supabase types
// Run: npx supabase gen types typescript --project-id sajslcwqvxwbmvrvawje > src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      partners: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          phone: string | null
          address: string | null
          role: 'farmer' | 'buyer'
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          phone?: string | null
          address?: string | null
          role?: 'farmer' | 'buyer'
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          phone?: string | null
          address?: string | null
          role?: 'farmer' | 'buyer'
          user_id?: string
        }
      }
      purchases: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          partner_id: string
          crop_name: string
          quantity: number
          rate: number
          total_amount: number
          purchase_date: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          partner_id: string
          crop_name: string
          quantity: number
          rate: number
          total_amount: number
          purchase_date: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          partner_id?: string
          crop_name?: string
          quantity?: number
          rate?: number
          total_amount?: number
          purchase_date?: string
          user_id?: string
        }
      }
      invoices: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          partner_id: string
          total_amount: number
          status: 'pending' | 'paid' | 'partial'
          invoice_date: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          partner_id: string
          total_amount: number
          status?: 'pending' | 'paid' | 'partial'
          invoice_date: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          partner_id?: string
          total_amount?: number
          status?: 'pending' | 'paid' | 'partial'
          invoice_date?: string
          user_id?: string
        }
      }
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

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific types
export type Partner = Tables<'partners'>
export type Purchase = Tables<'purchases'>
export type Invoice = Tables<'invoices'>
