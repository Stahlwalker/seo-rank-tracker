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
      url_keyword_pairs: {
        Row: {
          id: string
          url: string
          keyword: string
          monthly_search_volume: number | null
          current_ranking: number | null
          note: string | null
          status: string | null
          last_updated: string | null
          user_id: string
          created_at: string
        }
        Insert: {
          id: string
          url: string
          keyword: string
          monthly_search_volume?: number | null
          current_ranking?: number | null
          note?: string | null
          status?: string | null
          last_updated?: string | null
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          url?: string
          keyword?: string
          monthly_search_volume?: number | null
          current_ranking?: number | null
          note?: string | null
          status?: string | null
          last_updated?: string | null
          user_id?: string
          created_at?: string
        }
      }
      ranking_history: {
        Row: {
          id: string
          url_keyword_id: string
          month: string
          position: number
          created_at: string
        }
        Insert: {
          id: string
          url_keyword_id: string
          month: string
          position: number
          created_at?: string
        }
        Update: {
          id?: string
          url_keyword_id?: string
          month?: string
          position?: number
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
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