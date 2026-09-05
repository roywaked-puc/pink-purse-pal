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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_fee_types: {
        Row: {
          account_id: string
          created_at: string
          fee_percentage: number
          id: string
          label: string
          order_index: number
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          fee_percentage?: number
          id?: string
          label: string
          order_index?: number
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          fee_percentage?: number
          id?: string
          label?: string
          order_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_fee_types_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
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
      anamnese_answers: {
        Row: {
          created_at: string
          id: string
          question_id: string
          response_id: string
          user_id: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          response_id: string
          user_id: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          response_id?: string
          user_id?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "anamnese_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnese_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "anamnese_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_questions: {
        Row: {
          created_at: string
          id: string
          label: string
          options: Json
          order_index: number
          required: boolean
          section: string
          type: Database["public"]["Enums"]["anamnese_question_type"]
          user_id: string
          version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          options?: Json
          order_index?: number
          required?: boolean
          section?: string
          type: Database["public"]["Enums"]["anamnese_question_type"]
          user_id: string
          version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          options?: Json
          order_index?: number
          required?: boolean
          section?: string
          type?: Database["public"]["Enums"]["anamnese_question_type"]
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_questions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "anamnese_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_responses: {
        Row: {
          client_id: string
          created_at: string
          filled_at: string | null
          id: string
          pdf_path: string | null
          share_token: string
          signature_data: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["anamnese_response_status"]
          template_id: string
          updated_at: string
          user_id: string
          version_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          filled_at?: string | null
          id?: string
          pdf_path?: string | null
          share_token?: string
          signature_data?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["anamnese_response_status"]
          template_id: string
          updated_at?: string
          user_id: string
          version_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          filled_at?: string | null
          id?: string
          pdf_path?: string | null
          share_token?: string
          signature_data?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["anamnese_response_status"]
          template_id?: string
          updated_at?: string
          user_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_responses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnese_responses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "anamnese_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamnese_responses_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "anamnese_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_template_versions: {
        Row: {
          created_at: string
          id: string
          is_current: boolean
          locked: boolean
          template_id: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_current?: boolean
          locked?: boolean
          template_id: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean
          locked?: boolean
          template_id?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "anamnese_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "anamnese_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      anamnese_templates: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          amount: number
          caixa_reserva_valor_aplicado: number | null
          client_id: string | null
          client_name: string
          confirmation_status: Database["public"]["Enums"]["confirmation_status_enum"]
          created_at: string
          date: string
          duration: number
          google_event_id: string | null
          id: string
          is_permuta: boolean
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
          caixa_reserva_valor_aplicado?: number | null
          client_id?: string | null
          client_name: string
          confirmation_status?: Database["public"]["Enums"]["confirmation_status_enum"]
          created_at?: string
          date: string
          duration?: number
          google_event_id?: string | null
          id?: string
          is_permuta?: boolean
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
          caixa_reserva_valor_aplicado?: number | null
          client_id?: string | null
          client_name?: string
          confirmation_status?: Database["public"]["Enums"]["confirmation_status_enum"]
          created_at?: string
          date?: string
          duration?: number
          google_event_id?: string | null
          id?: string
          is_permuta?: boolean
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
          dias_max: number | null
          dias_min: number | null
          duration: number
          id: string
          notes: string | null
          technique_name: string | null
          tier_type: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          color?: string | null
          created_at?: string
          description: string
          dias_max?: number | null
          dias_min?: number | null
          duration?: number
          id?: string
          notes?: string | null
          technique_name?: string | null
          tier_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          color?: string | null
          created_at?: string
          description?: string
          dias_max?: number | null
          dias_min?: number | null
          duration?: number
          id?: string
          notes?: string | null
          technique_name?: string | null
          tier_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account: string
          account_fee_type_id: string | null
          account_id: string | null
          amount: number
          appointment_id: string | null
          caixa_amount_original: number | null
          caixa_scope_original: string | null
          category: string
          category_id: string | null
          client_name: string | null
          created_at: string
          date: string
          description: string | null
          gross_amount: number | null
          id: string
          is_caixa_reserva_split: boolean
          payment_type: string | null
          scope: string
          type: string
          user_id: string
        }
        Insert: {
          account: string
          account_fee_type_id?: string | null
          account_id?: string | null
          amount?: number
          appointment_id?: string | null
          caixa_amount_original?: number | null
          caixa_scope_original?: string | null
          category: string
          category_id?: string | null
          client_name?: string | null
          created_at?: string
          date: string
          description?: string | null
          gross_amount?: number | null
          id?: string
          is_caixa_reserva_split?: boolean
          payment_type?: string | null
          scope: string
          type: string
          user_id: string
        }
        Update: {
          account?: string
          account_fee_type_id?: string | null
          account_id?: string | null
          amount?: number
          appointment_id?: string | null
          caixa_amount_original?: number | null
          caixa_scope_original?: string | null
          category?: string
          category_id?: string | null
          client_name?: string | null
          created_at?: string
          date?: string
          description?: string | null
          gross_amount?: number | null
          id?: string
          is_caixa_reserva_split?: boolean
          payment_type?: string | null
          scope?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_fee_type_id_fkey"
            columns: ["account_fee_type_id"]
            isOneToOne: false
            referencedRelation: "account_fee_types"
            referencedColumns: ["id"]
          },
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
          caixa_inicio_em: string | null
          caixa_reserva_ativo: boolean
          caixa_reserva_valor: number
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
          caixa_inicio_em?: string | null
          caixa_reserva_ativo?: boolean
          caixa_reserva_valor?: number
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
          caixa_inicio_em?: string | null
          caixa_reserva_ativo?: boolean
          caixa_reserva_valor?: number
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
      caixa_reserva_apply: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
    }
    Enums: {
      anamnese_question_type:
        | "texto_curto"
        | "texto_longo"
        | "sim_nao"
        | "multipla_escolha"
        | "selecao_unica"
        | "data"
        | "numero"
        | "checkbox"
      anamnese_response_status:
        | "pendente"
        | "preenchida"
        | "assinada"
        | "arquivada"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      anamnese_question_type: [
        "texto_curto",
        "texto_longo",
        "sim_nao",
        "multipla_escolha",
        "selecao_unica",
        "data",
        "numero",
        "checkbox",
      ],
      anamnese_response_status: [
        "pendente",
        "preenchida",
        "assinada",
        "arquivada",
      ],
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
