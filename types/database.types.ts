// Auto-generate this file with: npx supabase gen types typescript --project-id <ref> > types/database.types.ts
// Placeholder — replace with generated types

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
      users: {
        Row: {
          id: string
          phone: string
          name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          phone: string
          name?: string | null
          created_at?: string
        }
        Update: {
          name?: string | null
        }
      }
      cook_profiles: {
        Row: {
          id: string
          user_id: string
          kitchen_name: string
          cuisine_tags: string[]
          rating: number
          review_count: number
          is_active: boolean
          location: unknown // PostGIS geography
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['cook_profiles']['Row']>
        Update: Partial<Database['public']['Tables']['cook_profiles']['Row']>
      }
      dishes: {
        Row: {
          id: string
          cook_id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          available_date: string
          max_quantity: number
          is_available: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['dishes']['Row']>
        Update: Partial<Database['public']['Tables']['dishes']['Row']>
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          cook_id: string
          status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          total_amount: number
          pickup_time: string | null
          address_id: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['orders']['Row']>
        Update: Partial<Database['public']['Tables']['orders']['Row']>
      }
      customer_addresses: {
        Row: {
          id: string
          user_id: string
          label: 'Home' | 'Work' | 'Other'
          address_line: string
          lat: number
          lng: number
          is_default: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['customer_addresses']['Row']>
        Update: Partial<Database['public']['Tables']['customer_addresses']['Row']>
      }
      reviews: {
        Row: {
          id: string
          order_id: string
          customer_id: string
          cook_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['reviews']['Row']>
        Update: Partial<Database['public']['Tables']['reviews']['Row']>
      }
    }
  }
}
