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
      accounts: {
        Row: {
          created_at: string
          fee_percentage: number | null
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fee_percentage?: number | null
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          fee_percentage?: number | null
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          amount: number
          client_id: string | null
          client_name: string
          confirmation_status: Database["public"]["Enums"]["confirmation_status_enum"]
          created_at: string
          date: string
          duration: number
          google_event_id: string | null
          id: string
          notes: string | null
          paid_amount: number
          parent_appointment_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status_enum"]
          service: string
          service_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          client_id?: string | null
          client_name: string
          confirmation_status?: Database["public"]["Enums"]["confirmation_status_enum"]
          created_at?: string
          date: string
          duration?: number
          google_event_id?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          parent_appointment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          service: string
          service_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          client_name?: string
          confirmation_status?: Database["public"]["Enums"]["confirmation_status_enum"]
          created_at?: string
          date?: string
          duration?: number
          google_event_id?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          parent_appointment_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status_enum"]
          service?: string
          service_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          scope: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          scope: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          scope?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      client_photos: {
        Row: {
          appointment_id: string | null
          client_id: string
          created_at: string
          id: string
          observation: string | null
          photo_date: string
          service_name: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          observation?: string | null
          photo_date?: string
          service_name?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          observation?: string | null
          photo_date?: string
          service_name?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          birth_date: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string
          recurrence_days: number | null
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string
          recurrence_days?: number | null
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          recurrence_days?: number | null
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          amount: number
          color: string | null
          created_at: string
          description: string
          duration: number
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          color?: string | null
          created_at?: string
          description: string
          duration?: number
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          color?: string | null
          created_at?: string
          description?: string
          duration?: number
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account: string
          account_id: string | null
          amount: number
          appointment_id: string | null
          category: string
          category_id: string | null
          client_name: string | null
          created_at: string
          date: string
          description: string | null
          gross_amount: number | null
          id: string
          payment_type: string | null
          scope: string
          type: string
          user_id: string
        }
        Insert: {
          account: string
          account_id?: string | null
          amount?: number
          appointment_id?: string | null
          category: string
          category_id?: string | null
          client_name?: string | null
          created_at?: string
          date: string
          description?: string | null
          gross_amount?: number | null
          id?: string
          payment_type?: string | null
          scope: string
          type: string
          user_id: string
        }
        Update: {
          account?: string
          account_id?: string | null
          amount?: number
          appointment_id?: string | null
          category?: string
          category_id?: string | null
          client_name?: string | null
          created_at?: string
          date?: string
          description?: string | null
          gross_amount?: number | null
          id?: string
          payment_type?: string | null
          scope?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string | null
          crm_confirm_days: number
          crm_inactive_days: number
          crm_monthly_goal: number
          crm_vip_count: number
          google_access_token: string | null
          google_calendar_enabled: boolean | null
          google_client_id: string | null
          google_client_secret: string | null
          google_refresh_token: string | null
          google_token_expiry: string | null
          id: string
          retention_color_aguardando: string
          retention_color_confirmado: string
          retention_color_previsto: string
          retention_intervals: number[]
          retention_reminder_days: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          crm_confirm_days?: number
          crm_inactive_days?: number
          crm_monthly_goal?: number
          crm_vip_count?: number
          google_access_token?: string | null
          google_calendar_enabled?: boolean | null
          google_client_id?: string | null
          google_client_secret?: string | null
          google_refresh_token?: string | null
          google_token_expiry?: string | null
          id?: string
          retention_color_aguardando?: string
          retention_color_confirmado?: string
          retention_color_previsto?: string
          retention_intervals?: number[]
          retention_reminder_days?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          crm_confirm_days?: number
          crm_inactive_days?: number
          crm_monthly_goal?: number
          crm_vip_count?: number
          google_access_token?: string | null
          google_calendar_enabled?: boolean | null
          google_client_id?: string | null
          google_client_secret?: string | null
          google_refresh_token?: string | null
          google_token_expiry?: string | null
          id?: string
          retention_color_aguardando?: string
          retention_color_confirmado?: string
          retention_color_previsto?: string
          retention_intervals?: number[]
          retention_reminder_days?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      confirmation_status_enum:
        | "pendente"
        | "confirmado"
        | "atendido"
        | "cancelado"
        | "retorno_previsto"
      payment_status_enum: "pago" | "nao_pago" | "sinal"
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
      confirmation_status_enum: [
        "pendente",
        "confirmado",
        "atendido",
        "cancelado",
        "retorno_previsto",
      ],
      payment_status_enum: ["pago", "nao_pago", "sinal"],
    },
  },
} as const
