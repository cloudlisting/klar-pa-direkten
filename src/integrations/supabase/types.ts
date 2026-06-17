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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bids: {
        Row: {
          bidder_id: string
          created_at: string
          id: string
          message: string | null
          price_sek: number
          proposed_time: string | null
          proposed_time_text: string | null
          status: Database["public"]["Enums"]["bid_status"]
          task_id: string
          updated_at: string
        }
        Insert: {
          bidder_id: string
          created_at?: string
          id?: string
          message?: string | null
          price_sek: number
          proposed_time?: string | null
          proposed_time_text?: string | null
          status?: Database["public"]["Enums"]["bid_status"]
          task_id: string
          updated_at?: string
        }
        Update: {
          bidder_id?: string
          created_at?: string
          id?: string
          message?: string | null
          price_sek?: number
          proposed_time?: string | null
          proposed_time_text?: string | null
          status?: Database["public"]["Enums"]["bid_status"]
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          read_at: string | null
          sender_user_id: string
          thread_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          sender_user_id: string
          thread_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          sender_user_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          customer_user_id: string
          id: string
          task_id: string
          tasker_user_id: string
        }
        Insert: {
          created_at?: string
          customer_user_id: string
          id?: string
          task_id: string
          tasker_user_id: string
        }
        Update: {
          created_at?: string
          customer_user_id?: string
          id?: string
          task_id?: string
          tasker_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          details: string | null
          id: string
          raised_by: string
          reason: string
          status: Database["public"]["Enums"]["dispute_status"]
          task_id: string
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          raised_by: string
          reason: string
          status?: Database["public"]["Enums"]["dispute_status"]
          task_id: string
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          raised_by?: string
          reason?: string
          status?: Database["public"]["Enums"]["dispute_status"]
          task_id?: string
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          availability_text: string | null
          created_at: string
          estimated_duration: string | null
          id: string
          message: string | null
          price_sek: number
          status: Database["public"]["Enums"]["offer_status"]
          task_id: string
          tasker_user_id: string
          updated_at: string
        }
        Insert: {
          availability_text?: string | null
          created_at?: string
          estimated_duration?: string | null
          id?: string
          message?: string | null
          price_sek: number
          status?: Database["public"]["Enums"]["offer_status"]
          task_id: string
          tasker_user_id: string
          updated_at?: string
        }
        Update: {
          availability_text?: string | null
          created_at?: string
          estimated_duration?: string | null
          id?: string
          message?: string | null
          price_sek?: number
          status?: Database["public"]["Enums"]["offer_status"]
          task_id?: string
          tasker_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_sek: number
          created_at: string
          customer_fee_sek: number
          id: string
          payee_user_id: string
          payer_user_id: string
          platform_fee_sek: number
          provider: string | null
          provider_reference_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          task_id: string
          tasker_fee_sek: number
          updated_at: string
        }
        Insert: {
          amount_sek: number
          created_at?: string
          customer_fee_sek?: number
          id?: string
          payee_user_id: string
          payer_user_id: string
          platform_fee_sek?: number
          provider?: string | null
          provider_reference_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          task_id: string
          tasker_fee_sek?: number
          updated_at?: string
        }
        Update: {
          amount_sek?: number
          created_at?: string
          customer_fee_sek?: number
          id?: string
          payee_user_id?: string
          payer_user_id?: string
          platform_fee_sek?: number
          provider?: string | null
          provider_reference_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          task_id?: string
          tasker_fee_sek?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bankid_verified: boolean
          bio: string | null
          cancelled_tasks: number
          city: string | null
          completed_tasks: number
          completion_rate: number
          created_at: string
          email: string
          email_verified: boolean
          first_name: string | null
          google_connected: boolean
          id: string
          id_verified: boolean
          is_deactivated: boolean
          last_name: string | null
          name: string
          onboarding_completed: boolean
          phone: string | null
          phone_verified: boolean
          rating_avg: number
          rating_count: number
          referral_code: string | null
          response_time_minutes: number | null
          role: Database["public"]["Enums"]["user_role_kind"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bankid_verified?: boolean
          bio?: string | null
          cancelled_tasks?: number
          city?: string | null
          completed_tasks?: number
          completion_rate?: number
          created_at?: string
          email: string
          email_verified?: boolean
          first_name?: string | null
          google_connected?: boolean
          id: string
          id_verified?: boolean
          is_deactivated?: boolean
          last_name?: string | null
          name: string
          onboarding_completed?: boolean
          phone?: string | null
          phone_verified?: boolean
          rating_avg?: number
          rating_count?: number
          referral_code?: string | null
          response_time_minutes?: number | null
          role?: Database["public"]["Enums"]["user_role_kind"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bankid_verified?: boolean
          bio?: string | null
          cancelled_tasks?: number
          city?: string | null
          completed_tasks?: number
          completion_rate?: number
          created_at?: string
          email?: string
          email_verified?: boolean
          first_name?: string | null
          google_connected?: boolean
          id?: string
          id_verified?: boolean
          is_deactivated?: boolean
          last_name?: string | null
          name?: string
          onboarding_completed?: boolean
          phone?: string | null
          phone_verified?: boolean
          rating_avg?: number
          rating_count?: number
          referral_code?: string | null
          response_time_minutes?: number | null
          role?: Database["public"]["Enums"]["user_role_kind"] | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string | null
          referrer_user_id: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id?: string | null
          referrer_user_id: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          status?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_user_id: string
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_user_id: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_user_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target_type"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          is_hidden: boolean
          rating: number
          reviewee_user_id: string
          reviewer_user_id: string
          task_id: string
          text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_hidden?: boolean
          rating: number
          reviewee_user_id: string
          reviewer_user_id: string
          task_id: string
          text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_hidden?: boolean
          rating?: number
          reviewee_user_id?: string
          reviewer_user_id?: string
          task_id?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      service_listings: {
        Row: {
          category: string
          city: string | null
          cover_image_url: string | null
          created_at: string
          description: string
          id: string
          price_sek: number
          price_type: string
          status: string
          tasker_user_id: string
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          category: string
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description: string
          id?: string
          price_sek: number
          price_type?: string
          status?: string
          tasker_user_id: string
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          category?: string
          city?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          price_sek?: number
          price_type?: string
          status?: string
          tasker_user_id?: string
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_listings_tasker_user_id_fkey"
            columns: ["tasker_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_listings_tasker_user_id_fkey"
            columns: ["tasker_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_photos: {
        Row: {
          created_at: string
          id: string
          task_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          task_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          task_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_photos_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasker_profiles: {
        Row: {
          avg_rating: number | null
          bio: string | null
          completed_tasks_count: number | null
          created_at: string
          hourly_rate_sek: number | null
          id: string
          service_area_city: string | null
          service_radius_km: number | null
          skills: string[] | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          avg_rating?: number | null
          bio?: string | null
          completed_tasks_count?: number | null
          created_at?: string
          hourly_rate_sek?: number | null
          id?: string
          service_area_city?: string | null
          service_radius_km?: number | null
          skills?: string[] | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          avg_rating?: number | null
          bio?: string | null
          completed_tasks_count?: number | null
          created_at?: string
          hourly_rate_sek?: number | null
          id?: string
          service_area_city?: string | null
          service_radius_km?: number | null
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      tasker_services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          price_sek: number | null
          price_type: string
          sort_order: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          price_sek?: number | null
          price_type?: string
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          price_sek?: number | null
          price_type?: string
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasker_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasker_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          address_optional: string | null
          address_text: string | null
          assigned_tasker_id: string | null
          auto_accept_price_sek: number | null
          budget_hint_sek: number | null
          budget_max_sek: number | null
          budget_min_sek: number | null
          budget_type: Database["public"]["Enums"]["budget_type"]
          category: string
          city: string
          created_at: string
          customer_user_id: string
          description: string | null
          id: string
          is_hidden: boolean
          is_remote_possible: boolean | null
          latitude: number | null
          location_confirmed: boolean
          longitude: number | null
          preferred_date: string | null
          preferred_time: string | null
          source_service_listing_id: string | null
          source_tasker_service_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          timing_type: string
          title: string
          updated_at: string
        }
        Insert: {
          address_optional?: string | null
          address_text?: string | null
          assigned_tasker_id?: string | null
          auto_accept_price_sek?: number | null
          budget_hint_sek?: number | null
          budget_max_sek?: number | null
          budget_min_sek?: number | null
          budget_type?: Database["public"]["Enums"]["budget_type"]
          category: string
          city: string
          created_at?: string
          customer_user_id: string
          description?: string | null
          id?: string
          is_hidden?: boolean
          is_remote_possible?: boolean | null
          latitude?: number | null
          location_confirmed?: boolean
          longitude?: number | null
          preferred_date?: string | null
          preferred_time?: string | null
          source_service_listing_id?: string | null
          source_tasker_service_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          timing_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          address_optional?: string | null
          address_text?: string | null
          assigned_tasker_id?: string | null
          auto_accept_price_sek?: number | null
          budget_hint_sek?: number | null
          budget_max_sek?: number | null
          budget_min_sek?: number | null
          budget_type?: Database["public"]["Enums"]["budget_type"]
          category?: string
          city?: string
          created_at?: string
          customer_user_id?: string
          description?: string | null
          id?: string
          is_hidden?: boolean
          is_remote_possible?: boolean | null
          latitude?: number | null
          location_confirmed?: boolean
          longitude?: number | null
          preferred_date?: string | null
          preferred_time?: string | null
          source_service_listing_id?: string | null
          source_tasker_service_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          timing_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_source_service_listing_id_fkey"
            columns: ["source_service_listing_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_tasker_service_id_fkey"
            columns: ["source_tasker_service_id"]
            isOneToOne: false
            referencedRelation: "tasker_services"
            referencedColumns: ["id"]
          },
        ]
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
      verifications: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["verification_state"]
          updated_at: string
          user_id: string
          verification_type: Database["public"]["Enums"]["verification_type"]
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["verification_state"]
          updated_at?: string
          user_id: string
          verification_type: Database["public"]["Enums"]["verification_type"]
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["verification_state"]
          updated_at?: string
          user_id?: string
          verification_type?: Database["public"]["Enums"]["verification_type"]
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          bankid_verified: boolean | null
          bio: string | null
          cancelled_tasks: number | null
          completed_tasks: number | null
          completion_rate: number | null
          created_at: string | null
          email_verified: boolean | null
          google_connected: boolean | null
          id: string | null
          id_verified: boolean | null
          name: string | null
          phone_verified: boolean | null
          rating_avg: number | null
          rating_count: number | null
          response_time_minutes: number | null
        }
        Insert: {
          avatar_url?: string | null
          bankid_verified?: boolean | null
          bio?: string | null
          cancelled_tasks?: number | null
          completed_tasks?: number | null
          completion_rate?: number | null
          created_at?: string | null
          email_verified?: boolean | null
          google_connected?: boolean | null
          id?: string | null
          id_verified?: boolean | null
          name?: string | null
          phone_verified?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          response_time_minutes?: number | null
        }
        Update: {
          avatar_url?: string | null
          bankid_verified?: boolean | null
          bio?: string | null
          cancelled_tasks?: number | null
          completed_tasks?: number | null
          completion_rate?: number | null
          created_at?: string | null
          email_verified?: boolean | null
          google_connected?: boolean | null
          id?: string | null
          id_verified?: boolean | null
          name?: string | null
          phone_verified?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          response_time_minutes?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_bid: { Args: { p_bid_id: string }; Returns: string }
      can_access_offer: { Args: { check_offer_id: string }; Returns: boolean }
      can_access_payment: {
        Args: { check_payment_id: string }
        Returns: boolean
      }
      can_access_thread: { Args: { check_thread_id: string }; Returns: boolean }
      can_view_task: { Args: { check_task_id: string }; Returns: boolean }
      get_task_address: { Args: { p_task_id: string }; Returns: string }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_tasker: { Args: { check_user_id: string }; Returns: boolean }
      recalc_user_rating: { Args: { p_user_id: string }; Returns: undefined }
      recalc_user_task_stats: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      tasker_can_instant_accept: {
        Args: { p_task_id: string; p_tasker_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "tasker"
      bid_status: "pending" | "accepted" | "rejected" | "withdrawn"
      budget_type: "fixed" | "hourly" | "open_for_bids"
      dispute_status: "open" | "under_review" | "resolved"
      offer_status: "sent" | "withdrawn" | "accepted" | "rejected"
      payment_status:
        | "not_started"
        | "authorized"
        | "held_in_escrow"
        | "released"
        | "refunded"
        | "failed"
      report_status: "open" | "reviewing" | "closed"
      report_target_type: "user" | "task" | "message"
      task_status:
        | "draft"
        | "published"
        | "instant_open"
        | "in_bidding"
        | "assigned"
        | "in_progress"
        | "completed_pending_release"
        | "paid"
        | "cancelled"
        | "disputed"
      user_role_kind: "bestallare" | "tasker" | "foretag"
      verification_state: "pending" | "verified" | "rejected"
      verification_status: "none" | "pending" | "verified"
      verification_type: "bankid" | "id" | "phone" | "email"
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
      app_role: ["admin", "customer", "tasker"],
      bid_status: ["pending", "accepted", "rejected", "withdrawn"],
      budget_type: ["fixed", "hourly", "open_for_bids"],
      dispute_status: ["open", "under_review", "resolved"],
      offer_status: ["sent", "withdrawn", "accepted", "rejected"],
      payment_status: [
        "not_started",
        "authorized",
        "held_in_escrow",
        "released",
        "refunded",
        "failed",
      ],
      report_status: ["open", "reviewing", "closed"],
      report_target_type: ["user", "task", "message"],
      task_status: [
        "draft",
        "published",
        "instant_open",
        "in_bidding",
        "assigned",
        "in_progress",
        "completed_pending_release",
        "paid",
        "cancelled",
        "disputed",
      ],
      user_role_kind: ["bestallare", "tasker", "foretag"],
      verification_state: ["pending", "verified", "rejected"],
      verification_status: ["none", "pending", "verified"],
      verification_type: ["bankid", "id", "phone", "email"],
    },
  },
} as const
