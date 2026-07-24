export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_user_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          last_sign_in_at: string | null
          notes: string | null
          status: string
          status_updated_at: string | null
          status_updated_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          last_sign_in_at?: string | null
          notes?: string | null
          status?: string
          status_updated_at?: string | null
          status_updated_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          last_sign_in_at?: string | null
          notes?: string | null
          status?: string
          status_updated_at?: string | null
          status_updated_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_import_candidates: {
        Row: {
          automation_run_id: string | null
          automation_source_id: string | null
          created_at: string
          created_by: string | null
          id: string
          imported_at: string | null
          imported_event_id: string | null
          normalized_event: Json
          notes: string | null
          quality_score: number | null
          raw_payload: Json
          reviewed_at: string | null
          reviewed_by: string | null
          source_platform: string
          source_title: string | null
          source_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          automation_run_id?: string | null
          automation_source_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          imported_at?: string | null
          imported_event_id?: string | null
          normalized_event?: Json
          notes?: string | null
          quality_score?: number | null
          raw_payload?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_platform?: string
          source_title?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          automation_run_id?: string | null
          automation_source_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          imported_at?: string | null
          imported_event_id?: string | null
          normalized_event?: Json
          notes?: string | null
          quality_score?: number | null
          raw_payload?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_platform?: string
          source_title?: string | null
          source_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_import_candidates_automation_run_id_fkey"
            columns: ["automation_run_id"]
            isOneToOne: false
            referencedRelation: "event_update_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_import_candidates_automation_source_id_fkey"
            columns: ["automation_source_id"]
            isOneToOne: false
            referencedRelation: "event_update_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_import_candidates_imported_event_id_fkey"
            columns: ["imported_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_update_runs: {
        Row: {
          candidate_count: number
          created_at: string
          created_by: string | null
          discovered_count: number
          duplicate_count: number
          error_message: string | null
          finished_at: string | null
          id: string
          source_id: string | null
          source_snapshot: Json
          started_at: string | null
          status: string
          summary: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          candidate_count?: number
          created_at?: string
          created_by?: string | null
          discovered_count?: number
          duplicate_count?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          source_id?: string | null
          source_snapshot?: Json
          started_at?: string | null
          status?: string
          summary?: Json
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          candidate_count?: number
          created_at?: string
          created_by?: string | null
          discovered_count?: number
          duplicate_count?: number
          error_message?: string | null
          finished_at?: string | null
          id?: string
          source_id?: string | null
          source_snapshot?: Json
          started_at?: string | null
          status?: string
          summary?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_update_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "event_update_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      event_update_sources: {
        Row: {
          cadence: string
          category_hint: string | null
          city: string
          created_at: string
          created_by: string | null
          id: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          notes: string | null
          platform: string
          query: string
          status: string
          updated_at: string
        }
        Insert: {
          cadence?: string
          category_hint?: string | null
          city?: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          notes?: string | null
          platform?: string
          query: string
          status?: string
          updated_at?: string
        }
        Update: {
          cadence?: string
          category_hint?: string | null
          city?: string
          created_at?: string
          created_by?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          notes?: string | null
          platform?: string
          query?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_user_actions: {
        Row: {
          action: string
          created_at: string
          event_id: string
          id: string
          planned_for: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          event_id: string
          id?: string
          planned_for?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          event_id?: string
          id?: string
          planned_for?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_user_actions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tags: {
        Row: {
          event_id: string
          id: string
          tag_id: string
        }
        Insert: {
          event_id: string
          id?: string
          tag_id: string
        }
        Update: {
          event_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string
          attendees: number | null
          category: string
          cover_image: string | null
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          district: string | null
          id: string
          is_free: boolean
          latitude: number
          longitude: number
          location_accuracy: string
          location_note: string | null
          location_verified_at: string | null
          location_verified_by: string | null
          organizer: string | null
          price: number | null
          cover_source_url: string | null
          source_checked_at: string | null
          source_checked_by: string | null
          source_notes: string | null
          source_platform: string
          source_title: string | null
          source_url: string | null
          status: string
          ticket_url: string | null
          time: string
          title: string
          updated_at: string
        }
        Insert: {
          address: string
          attendees?: number | null
          category: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          district?: string | null
          id?: string
          is_free?: boolean
          latitude: number
          longitude: number
          location_accuracy?: string
          location_note?: string | null
          location_verified_at?: string | null
          location_verified_by?: string | null
          organizer?: string | null
          price?: number | null
          cover_source_url?: string | null
          source_checked_at?: string | null
          source_checked_by?: string | null
          source_notes?: string | null
          source_platform?: string
          source_title?: string | null
          source_url?: string | null
          status?: string
          ticket_url?: string | null
          time: string
          title: string
          updated_at?: string
        }
        Update: {
          address?: string
          attendees?: number | null
          category?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          district?: string | null
          id?: string
          is_free?: boolean
          latitude?: number
          longitude?: number
          location_accuracy?: string
          location_note?: string | null
          location_verified_at?: string | null
          location_verified_by?: string | null
          organizer?: string | null
          price?: number | null
          cover_source_url?: string | null
          source_checked_at?: string | null
          source_checked_by?: string | null
          source_notes?: string | null
          source_platform?: string
          source_title?: string | null
          source_url?: string | null
          status?: string
          ticket_url?: string | null
          time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
