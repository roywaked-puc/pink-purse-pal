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
          {
            foreignKeyName: "account_fee_types_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "permuta_transacoes_legadas"
            referencedColumns: ["conta_legada_id"]
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
          confirmation_sent_at: string | null
          confirmation_status: Database["public"]["Enums"]["confirmation_status_enum"]
          created_at: string
          date: string
          duration: number
          google_event_id: string | null
          id: string
          is_permuta: boolean
          maintenance_number: number | null
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
          confirmation_sent_at?: string | null
          confirmation_status?: Database["public"]["Enums"]["confirmation_status_enum"]
          created_at?: string
          date: string
          duration?: number
          google_event_id?: string | null
          id?: string
          is_permuta?: boolean
          maintenance_number?: number | null
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
          confirmation_sent_at?: string | null
          confirmation_status?: Database["public"]["Enums"]["confirmation_status_enum"]
          created_at?: string
          date?: string
          duration?: number
          google_event_id?: string | null
          id?: string
          is_permuta?: boolean
          maintenance_number?: number | null
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
      assinaturas: {
        Row: {
          atualizado_em: string
          cancelar_no_fim_do_periodo: boolean
          criado_em: string
          estorno_exclusao_em: string | null
          isento: boolean
          periodicidade: string | null
          periodo_atual_fim: string | null
          plano: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          teste_ate: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          cancelar_no_fim_do_periodo?: boolean
          criado_em?: string
          estorno_exclusao_em?: string | null
          isento?: boolean
          periodicidade?: string | null
          periodo_atual_fim?: string | null
          plano?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          teste_ate: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          cancelar_no_fim_do_periodo?: boolean
          criado_em?: string
          estorno_exclusao_em?: string | null
          isento?: boolean
          periodicidade?: string | null
          periodo_atual_fim?: string | null
          plano?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          teste_ate?: string
          user_id?: string
        }
        Relationships: []
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
          conta_permuta_padrao_id: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          paga_permuta: boolean
          phone: string
          recurrence_days: number | null
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          conta_permuta_padrao_id?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          paga_permuta?: boolean
          phone?: string
          recurrence_days?: number | null
          user_id: string
        }
        Update: {
          birth_date?: string | null
          conta_permuta_padrao_id?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          paga_permuta?: boolean
          phone?: string
          recurrence_days?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_conta_permuta_padrao_id_fkey"
            columns: ["conta_permuta_padrao_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_conta_permuta_padrao_id_fkey"
            columns: ["conta_permuta_padrao_id"]
            isOneToOne: false
            referencedRelation: "permuta_transacoes_legadas"
            referencedColumns: ["conta_legada_id"]
          },
        ]
      }
      contas_exclusao: {
        Row: {
          cancelada_em: string | null
          concluida_em: string | null
          email: string | null
          excluir_apos: string
          id: string
          reembolsado: boolean
          solicitado_em: string
          status: string
          stripe_customer_id: string | null
          ultimo_erro: string | null
          user_id: string
        }
        Insert: {
          cancelada_em?: string | null
          concluida_em?: string | null
          email?: string | null
          excluir_apos?: string
          id?: string
          reembolsado?: boolean
          solicitado_em?: string
          status?: string
          stripe_customer_id?: string | null
          ultimo_erro?: string | null
          user_id: string
        }
        Update: {
          cancelada_em?: string | null
          concluida_em?: string | null
          email?: string | null
          excluir_apos?: string
          id?: string
          reembolsado?: boolean
          solicitado_em?: string
          status?: string
          stripe_customer_id?: string | null
          ultimo_erro?: string | null
          user_id?: string
        }
        Relationships: []
      }
      eventos_stripe: {
        Row: {
          evento_id: string
          modo: string
          ocorrido_em: string
          processado_em: string
          tipo: string
        }
        Insert: {
          evento_id: string
          modo: string
          ocorrido_em: string
          processado_em?: string
          tipo: string
        }
        Update: {
          evento_id?: string
          modo?: string
          ocorrido_em?: string
          processado_em?: string
          tipo?: string
        }
        Relationships: []
      }
      modelos_iniciais: {
        Row: {
          ativo: boolean
          conteudo: Json
          created_at: string
          id: string
          nome: string
          segmento: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          conteudo: Json
          created_at?: string
          id?: string
          nome: string
          segmento: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          conteudo?: Json
          created_at?: string
          id?: string
          nome?: string
          segmento?: string
          updated_at?: string
        }
        Relationships: []
      }
      permuta_lancamentos: {
        Row: {
          client_id: string
          conta_legada_id: string | null
          created_at: string
          date: string
          descricao: string | null
          id: string
          tipo: string
          transaction_id: string | null
          user_id: string
          valor: number
        }
        Insert: {
          client_id: string
          conta_legada_id?: string | null
          created_at?: string
          date: string
          descricao?: string | null
          id?: string
          tipo: string
          transaction_id?: string | null
          user_id: string
          valor: number
        }
        Update: {
          client_id?: string
          conta_legada_id?: string | null
          created_at?: string
          date?: string
          descricao?: string | null
          id?: string
          tipo?: string
          transaction_id?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "permuta_lancamentos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permuta_lancamentos_conta_legada_id_fkey"
            columns: ["conta_legada_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permuta_lancamentos_conta_legada_id_fkey"
            columns: ["conta_legada_id"]
            isOneToOne: false
            referencedRelation: "permuta_transacoes_legadas"
            referencedColumns: ["conta_legada_id"]
          },
          {
            foreignKeyName: "permuta_lancamentos_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "permuta_transacoes_legadas"
            referencedColumns: ["transaction_id"]
          },
          {
            foreignKeyName: "permuta_lancamentos_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
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
          manutencao_ate_dias: number | null
          notes: string | null
          possui_manutencao: boolean
          servico_pai_id: string | null
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
          manutencao_ate_dias?: number | null
          notes?: string | null
          possui_manutencao?: boolean
          servico_pai_id?: string | null
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
          manutencao_ate_dias?: number | null
          notes?: string | null
          possui_manutencao?: boolean
          servico_pai_id?: string | null
          technique_name?: string | null
          tier_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_servico_pai_id_fkey"
            columns: ["servico_pai_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "permuta_transacoes_legadas"
            referencedColumns: ["conta_legada_id"]
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
          cancellation_fee: number
          cancellation_notice_hours: number
          confirm_message_template: string | null
          cor_primaria: string | null
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
          logo_path: string | null
          nome_negocio: string | null
          onboarding_concluido_em: string | null
          permuta_corte_em: string | null
          primeiros_passos_oculto_em: string | null
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
          cancellation_fee?: number
          cancellation_notice_hours?: number
          confirm_message_template?: string | null
          cor_primaria?: string | null
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
          logo_path?: string | null
          nome_negocio?: string | null
          onboarding_concluido_em?: string | null
          permuta_corte_em?: string | null
          primeiros_passos_oculto_em?: string | null
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
          cancellation_fee?: number
          cancellation_notice_hours?: number
          confirm_message_template?: string | null
          cor_primaria?: string | null
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
          logo_path?: string | null
          nome_negocio?: string | null
          onboarding_concluido_em?: string | null
          permuta_corte_em?: string | null
          primeiros_passos_oculto_em?: string | null
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
      permuta_extrato: {
        Row: {
          appointment_id: string | null
          client_id: string | null
          date: string | null
          descricao: string | null
          origem: string | null
          permuta_lancamento_id: string | null
          tipo: string | null
          user_id: string | null
          valor: number | null
        }
        Relationships: []
      }
      permuta_saldos: {
        Row: {
          client_id: string | null
          client_name: string | null
          qtd_lancamentos: number | null
          saldo: number | null
          ultimo_movimento: string | null
          user_id: string | null
        }
        Relationships: []
      }
      permuta_transacoes_legadas: {
        Row: {
          amount: number | null
          appointment_id: string | null
          category: string | null
          conta_legada_id: string | null
          conta_legada_nome: string | null
          date: string | null
          description: string | null
          gross_amount: number | null
          scope: string | null
          transaction_id: string | null
          type: string | null
          user_id: string | null
          valor_assinado_bruto: number | null
          valor_assinado_liquido: number | null
          valor_bruto: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      aplicar_evento_stripe: {
        Args: {
          p_cancelar: boolean
          p_customer: string
          p_evento_id: string
          p_fim: string
          p_modo: string
          p_ocorrido_em: string
          p_pago: boolean
          p_periodicidade: string
          p_status: string
          p_subscription: string
          p_tipo: string
          p_user_id: string
        }
        Returns: boolean
      }
      aplicar_modelo_inicial: {
        Args: { p_segmento?: string; p_user_id: string }
        Returns: boolean
      }
      ativar_conta_corrente_permuta: {
        Args: { p_itens: Json }
        Returns: string
      }
      caixa_reserva_apply: {
        Args: { p_appointment_id: string }
        Returns: undefined
      }
      exclusao_conta_pendente: { Args: never; Returns: Json }
      gerar_modelo_inicial: {
        Args: { p_email: string; p_nome?: string; p_segmento?: string }
        Returns: undefined
      }
      google_calendar_secret_configured: { Args: never; Returns: boolean }
      plano_efetivo: { Args: never; Returns: string }
      purgar_dados_conta: { Args: { p_user_id: string }; Returns: undefined }
      reativar_conta_exclusao: { Args: { p_user_id: string }; Returns: boolean }
      registrar_acerto_permuta: {
        Args: {
          p_account_id: string
          p_category_id: string
          p_client_id: string
          p_date: string
          p_descricao: string
          p_direcao: string
          p_scope: string
          p_valor: number
        }
        Returns: {
          permuta_lancamento_id: string
          transaction_id: string
        }[]
      }
      resumo_assinatura: { Args: never; Returns: Json }
      revisar_conta_corrente_permuta: { Args: never; Returns: Json }
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
