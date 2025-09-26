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
      approvals: {
        Row: {
          amount_approved: number | null
          approval_date: string | null
          approval_level: number | null
          approver_id: string | null
          auto_approved: boolean | null
          comments: string | null
          created_at: string
          id: string
          invoice_id: string
          status: Database["public"]["Enums"]["approval_status"] | null
          updated_at: string
        }
        Insert: {
          amount_approved?: number | null
          approval_date?: string | null
          approval_level?: number | null
          approver_id?: string | null
          auto_approved?: boolean | null
          comments?: string | null
          created_at?: string
          id?: string
          invoice_id: string
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string
        }
        Update: {
          amount_approved?: number | null
          approval_date?: string | null
          approval_level?: number | null
          approver_id?: string | null
          auto_approved?: boolean | null
          comments?: string | null
          created_at?: string
          id?: string
          invoice_id?: string
          status?: Database["public"]["Enums"]["approval_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      compliance_records: {
        Row: {
          audit_notes: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          last_audit_date: string | null
          next_audit_date: string | null
          regulation: string
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          status: string | null
          updated_at: string
        }
        Insert: {
          audit_notes?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          last_audit_date?: string | null
          next_audit_date?: string | null
          regulation: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          audit_notes?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          last_audit_date?: string | null
          next_audit_date?: string | null
          regulation?: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      consent_logs: {
        Row: {
          consent_given: boolean
          consent_text: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at: string
          email: string | null
          id: string
          ip_address: unknown | null
          phone: string | null
          user_agent: string | null
          user_id: string | null
          withdrawal_date: string | null
        }
        Insert: {
          consent_given: boolean
          consent_text?: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: unknown | null
          phone?: string | null
          user_agent?: string | null
          user_id?: string | null
          withdrawal_date?: string | null
        }
        Update: {
          consent_given?: boolean
          consent_text?: string | null
          consent_type?: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: unknown | null
          phone?: string | null
          user_agent?: string | null
          user_id?: string | null
          withdrawal_date?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_template: string
          created_at: string
          id: string
          is_active: boolean
          subject_template: string
          template_name: string
          template_type: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body_template: string
          created_at?: string
          id?: string
          is_active?: boolean
          subject_template: string
          template_name: string
          template_type: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body_template?: string
          created_at?: string
          id?: string
          is_active?: boolean
          subject_template?: string
          template_name?: string
          template_type?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      exceptions: {
        Row: {
          created_at: string
          description: string
          exception_type: Database["public"]["Enums"]["exception_type"]
          id: string
          invoice_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["risk_level"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          exception_type: Database["public"]["Enums"]["exception_type"]
          id?: string
          invoice_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["risk_level"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          exception_type?: Database["public"]["Enums"]["exception_type"]
          id?: string
          invoice_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["risk_level"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exceptions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_flags: {
        Row: {
          created_at: string
          details: Json
          entity_id: string
          entity_type: string
          flag_type: string
          id: string
          resolved_at: string | null
          resolved_by: string | null
          risk_score: number
          status: string
        }
        Insert: {
          created_at?: string
          details: Json
          entity_id: string
          entity_type: string
          flag_type: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number
          status?: string
        }
        Update: {
          created_at?: string
          details?: Json
          entity_id?: string
          entity_type?: string
          flag_type?: string
          id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          risk_score?: number
          status?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          approval_policy_id: string | null
          confidence_score: number | null
          created_at: string
          currency: string | null
          description: string | null
          due_date: string | null
          duplicate_hash: string | null
          extracted_data: Json | null
          field_confidence_scores: Json | null
          file_url: string | null
          id: string
          invoice_date: string
          invoice_number: string
          line_items: Json | null
          ocr_metadata: Json | null
          po_number: string | null
          raw_text: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          tax_amount: number | null
          updated_at: string
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          amount: number
          approval_policy_id?: string | null
          confidence_score?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string | null
          duplicate_hash?: string | null
          extracted_data?: Json | null
          field_confidence_scores?: Json | null
          file_url?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          line_items?: Json | null
          ocr_metadata?: Json | null
          po_number?: string | null
          raw_text?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          tax_amount?: number | null
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          approval_policy_id?: string | null
          confidence_score?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          due_date?: string | null
          duplicate_hash?: string | null
          extracted_data?: Json | null
          field_confidence_scores?: Json | null
          file_url?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          line_items?: Json | null
          ocr_metadata?: Json | null
          po_number?: string | null
          raw_text?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          tax_amount?: number | null
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          interest_type: string | null
          lead_source: string | null
          lead_status: string | null
          message: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          interest_type?: string | null
          lead_source?: string | null
          lead_status?: string | null
          message?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          interest_type?: string | null
          lead_source?: string | null
          lead_status?: string | null
          message?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          id: string
          is_active: boolean
          policy_name: string
          policy_type: string
          priority: number
          updated_at: string
        }
        Insert: {
          actions: Json
          conditions: Json
          created_at?: string
          id?: string
          is_active?: boolean
          policy_name: string
          policy_type: string
          priority?: number
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          policy_name?: string
          policy_type?: string
          priority?: number
          updated_at?: string
        }
        Relationships: []
      }
      review_queue: {
        Row: {
          assigned_to: string | null
          confidence_score: number | null
          created_at: string
          flagged_fields: Json | null
          id: string
          invoice_id: string
          priority: number | null
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          confidence_score?: number | null
          created_at?: string
          flagged_fields?: Json | null
          id?: string
          invoice_id: string
          priority?: number | null
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          confidence_score?: number | null
          created_at?: string
          flagged_fields?: Json | null
          id?: string
          invoice_id?: string
          priority?: number | null
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: Json | null
          bank_account: string | null
          contact_info: Json | null
          created_at: string
          iban: string | null
          id: string
          is_active: boolean | null
          payment_terms: number | null
          risk_score: number | null
          swift_code: string | null
          tax_id: string | null
          updated_at: string
          vendor_code: string | null
          vendor_name: string
          verification_status: string | null
        }
        Insert: {
          address?: Json | null
          bank_account?: string | null
          contact_info?: Json | null
          created_at?: string
          iban?: string | null
          id?: string
          is_active?: boolean | null
          payment_terms?: number | null
          risk_score?: number | null
          swift_code?: string | null
          tax_id?: string | null
          updated_at?: string
          vendor_code?: string | null
          vendor_name: string
          verification_status?: string | null
        }
        Update: {
          address?: Json | null
          bank_account?: string | null
          contact_info?: Json | null
          created_at?: string
          iban?: string | null
          id?: string
          is_active?: boolean | null
          payment_terms?: number | null
          risk_score?: number | null
          swift_code?: string | null
          tax_id?: string | null
          updated_at?: string
          vendor_code?: string | null
          vendor_name?: string
          verification_status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_uuid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      approval_status: "pending" | "approved" | "rejected"
      consent_type: "email" | "sms" | "data_processing" | "marketing"
      exception_type:
        | "duplicate"
        | "amount_variance"
        | "vendor_mismatch"
        | "missing_po"
        | "compliance_issue"
      invoice_status:
        | "pending"
        | "approved"
        | "rejected"
        | "processing"
        | "duplicate"
      risk_level: "low" | "medium" | "high" | "critical"
      user_role: "admin" | "operator" | "viewer"
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
      approval_status: ["pending", "approved", "rejected"],
      consent_type: ["email", "sms", "data_processing", "marketing"],
      exception_type: [
        "duplicate",
        "amount_variance",
        "vendor_mismatch",
        "missing_po",
        "compliance_issue",
      ],
      invoice_status: [
        "pending",
        "approved",
        "rejected",
        "processing",
        "duplicate",
      ],
      risk_level: ["low", "medium", "high", "critical"],
      user_role: ["admin", "operator", "viewer"],
    },
  },
} as const
