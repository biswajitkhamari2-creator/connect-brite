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
      agreement_acceptances: {
        Row: {
          accepted_at: string
          agreement_title: string
          agreement_version: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          ip_address: string | null
          phone: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          agreement_title?: string
          agreement_version: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          ip_address?: string | null
          phone?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          agreement_title?: string
          agreement_version?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          ip_address?: string | null
          phone?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      claims: {
        Row: {
          city: string
          claim_amount: number
          claim_id: string
          created_at: string
          declared_payout_paise: number | null
          discount_paise: number
          documents: string[] | null
          email: string
          full_name: string
          gst_paise: number | null
          id: string
          insurance_company: string
          insurance_type: string
          payment_amount_paise: number | null
          payment_id: string | null
          payment_order_id: string | null
          payment_paid_at: string | null
          payment_status: string
          payout_declared_at: string | null
          payout_insurer_name: string | null
          payout_proof_path: string | null
          payout_verification_status: string
          payout_verified_at: string | null
          payout_verified_by: string | null
          phone: string
          policy_number: string
          promo_code_applied: string | null
          rejection_date: string
          rejection_reason: string
          state: string
          status: string
          success_fee_due_date: string | null
          success_fee_invoice_no: string | null
          success_fee_paise: number | null
          success_fee_status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city: string
          claim_amount: number
          claim_id: string
          created_at?: string
          declared_payout_paise?: number | null
          discount_paise?: number
          documents?: string[] | null
          email: string
          full_name: string
          gst_paise?: number | null
          id?: string
          insurance_company: string
          insurance_type: string
          payment_amount_paise?: number | null
          payment_id?: string | null
          payment_order_id?: string | null
          payment_paid_at?: string | null
          payment_status?: string
          payout_declared_at?: string | null
          payout_insurer_name?: string | null
          payout_proof_path?: string | null
          payout_verification_status?: string
          payout_verified_at?: string | null
          payout_verified_by?: string | null
          phone: string
          policy_number: string
          promo_code_applied?: string | null
          rejection_date: string
          rejection_reason: string
          state: string
          status?: string
          success_fee_due_date?: string | null
          success_fee_invoice_no?: string | null
          success_fee_paise?: number | null
          success_fee_status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city?: string
          claim_amount?: number
          claim_id?: string
          created_at?: string
          declared_payout_paise?: number | null
          discount_paise?: number
          documents?: string[] | null
          email?: string
          full_name?: string
          gst_paise?: number | null
          id?: string
          insurance_company?: string
          insurance_type?: string
          payment_amount_paise?: number | null
          payment_id?: string | null
          payment_order_id?: string | null
          payment_paid_at?: string | null
          payment_status?: string
          payout_declared_at?: string | null
          payout_insurer_name?: string | null
          payout_proof_path?: string | null
          payout_verification_status?: string
          payout_verified_at?: string | null
          payout_verified_by?: string | null
          phone?: string
          policy_number?: string
          promo_code_applied?: string | null
          rejection_date?: string
          rejection_reason?: string
          state?: string
          status?: string
          success_fee_due_date?: string | null
          success_fee_invoice_no?: string | null
          success_fee_paise?: number | null
          success_fee_status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      defaulters: {
        Row: {
          created_at: string
          first_flagged_at: string
          last_reminder_at: string | null
          notes: string | null
          reminder_count: number
          status: string
          total_outstanding_paise: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_flagged_at?: string
          last_reminder_at?: string | null
          notes?: string | null
          reminder_count?: number
          status?: string
          total_outstanding_paise?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_flagged_at?: string
          last_reminder_at?: string | null
          notes?: string | null
          reminder_count?: number
          status?: string
          total_outstanding_paise?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoice_counter: {
        Row: {
          fiscal_year: string
          id: number
          next_no: number
          prefix: string
          updated_at: string
        }
        Insert: {
          fiscal_year?: string
          id?: number
          next_no?: number
          prefix?: string
          updated_at?: string
        }
        Update: {
          fiscal_year?: string
          id?: number
          next_no?: number
          prefix?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          base_amount_paise: number
          claim_id: string
          created_at: string
          due_date: string
          gst_paise: number
          id: string
          invoice_no: string
          issued_at: string
          notes: string | null
          paid_at: string | null
          pdf_path: string | null
          razorpay_payment_id: string | null
          status: string
          total_paise: number
          updated_at: string
          user_id: string
        }
        Insert: {
          base_amount_paise: number
          claim_id: string
          created_at?: string
          due_date: string
          gst_paise: number
          id?: string
          invoice_no: string
          issued_at?: string
          notes?: string | null
          paid_at?: string | null
          pdf_path?: string | null
          razorpay_payment_id?: string | null
          status?: string
          total_paise: number
          updated_at?: string
          user_id: string
        }
        Update: {
          base_amount_paise?: number
          claim_id?: string
          created_at?: string
          due_date?: string
          gst_paise?: number
          id?: string
          invoice_no?: string
          issued_at?: string
          notes?: string | null
          paid_at?: string | null
          pdf_path?: string | null
          razorpay_payment_id?: string | null
          status?: string
          total_paise?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          active: boolean
          body: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_defaulter: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_defaulter?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_defaulter?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          times_used: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          times_used?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          times_used?: number
          updated_at?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          admin_notes: string | null
          admin_remarks: string | null
          awb: string | null
          claim_id: string | null
          courier: string | null
          created_at: string
          currency: string
          decided_at: string | null
          decided_by: string | null
          delivered_at: string | null
          eligibility_snapshot: Json
          gift_type: string | null
          gift_value_inr: number | null
          id: string
          issue_reference: string | null
          issued_at: string | null
          policy_reference: string | null
          program_type: string
          rejection_reason: string | null
          reward_type: string
          reward_value: number
          shipping_status: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          admin_remarks?: string | null
          awb?: string | null
          claim_id?: string | null
          courier?: string | null
          created_at?: string
          currency?: string
          decided_at?: string | null
          decided_by?: string | null
          delivered_at?: string | null
          eligibility_snapshot?: Json
          gift_type?: string | null
          gift_value_inr?: number | null
          id?: string
          issue_reference?: string | null
          issued_at?: string | null
          policy_reference?: string | null
          program_type?: string
          rejection_reason?: string | null
          reward_type: string
          reward_value?: number
          shipping_status?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          admin_remarks?: string | null
          awb?: string | null
          claim_id?: string | null
          courier?: string | null
          created_at?: string
          currency?: string
          decided_at?: string | null
          decided_by?: string | null
          delivered_at?: string | null
          eligibility_snapshot?: Json
          gift_type?: string | null
          gift_value_inr?: number | null
          id?: string
          issue_reference?: string | null
          issued_at?: string | null
          policy_reference?: string | null
          program_type?: string
          rejection_reason?: string | null
          reward_type?: string
          reward_value?: number
          shipping_status?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rewards_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          config_id: string | null
          created_at: string
          id: string
          notes: string | null
          reward_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          config_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reward_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          config_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reward_id?: string | null
        }
        Relationships: []
      }
      rewards_config: {
        Row: {
          appreciation_enabled: boolean
          currency: string
          disclaimer: string
          eligibility_rules: Json
          enabled: boolean
          id: string
          reward_type: string
          reward_value: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          appreciation_enabled?: boolean
          currency?: string
          disclaimer?: string
          eligibility_rules?: Json
          enabled?: boolean
          id?: string
          reward_type?: string
          reward_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          appreciation_enabled?: boolean
          currency?: string
          disclaimer?: string
          eligibility_rules?: Json
          enabled?: boolean
          id?: string
          reward_type?: string
          reward_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      signup_otps: {
        Row: {
          attempts: number
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          full_name: string
          id: string
          ip: string | null
          otp_hash: string
          password_hash: string
          phone: string
          user_agent: string | null
        }
        Insert: {
          attempts?: number
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          full_name: string
          id?: string
          ip?: string | null
          otp_hash: string
          password_hash: string
          phone: string
          user_agent?: string | null
        }
        Update: {
          attempts?: number
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          ip?: string | null
          otp_hash?: string
          password_hash?: string
          phone?: string
          user_agent?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      get_appreciation_enabled: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      issue_success_fee_invoice: {
        Args: { _claim_id: string }
        Returns: {
          base_paise: number
          gst_paise: number
          invoice_id: string
          invoice_no: string
          total_paise: number
        }[]
      }
      mark_invoice_overdue: {
        Args: { _invoice_id: string }
        Returns: undefined
      }
      mark_invoice_paid: {
        Args: { _invoice_id: string; _razorpay_payment_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
