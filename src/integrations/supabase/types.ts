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
      activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      afes: {
        Row: {
          afe_number: string
          approval_date: string | null
          budget_amount: number
          created_at: string
          description: string | null
          expiry_date: string | null
          id: string
          project_type: string | null
          spent_amount: number
          status: string
          updated_at: string
          user_id: string
          well_name: string | null
        }
        Insert: {
          afe_number: string
          approval_date?: string | null
          budget_amount: number
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          project_type?: string | null
          spent_amount?: number
          status?: string
          updated_at?: string
          user_id: string
          well_name?: string | null
        }
        Update: {
          afe_number?: string
          approval_date?: string | null
          budget_amount?: number
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          id?: string
          project_type?: string | null
          spent_amount?: number
          status?: string
          updated_at?: string
          user_id?: string
          well_name?: string | null
        }
        Relationships: []
      }
      budget_alert_logs: {
        Row: {
          afe_id: string
          alert_message: string
          alert_rule_id: string
          budget_utilization: number
          created_at: string
          id: string
          metadata: Json | null
          severity: string
          user_id: string
        }
        Insert: {
          afe_id: string
          alert_message: string
          alert_rule_id: string
          budget_utilization: number
          created_at?: string
          id?: string
          metadata?: Json | null
          severity: string
          user_id: string
        }
        Update: {
          afe_id?: string
          alert_message?: string
          alert_rule_id?: string
          budget_utilization?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_alert_logs_afe_id_fkey"
            columns: ["afe_id"]
            isOneToOne: false
            referencedRelation: "afes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_alert_logs_alert_rule_id_fkey"
            columns: ["alert_rule_id"]
            isOneToOne: false
            referencedRelation: "budget_alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_alert_rules: {
        Row: {
          afe_filter: Json | null
          alert_type: string
          created_at: string
          email_recipients: string[]
          id: string
          is_active: boolean
          last_triggered_at: string | null
          notification_channels: Json
          rule_name: string
          threshold_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          afe_filter?: Json | null
          alert_type: string
          created_at?: string
          email_recipients?: string[]
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          notification_channels?: Json
          rule_name: string
          threshold_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          afe_filter?: Json | null
          alert_type?: string
          created_at?: string
          email_recipients?: string[]
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          notification_channels?: Json
          rule_name?: string
          threshold_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_records: {
        Row: {
          completed_date: string | null
          compliance_date: string
          created_at: string | null
          description: string | null
          documents: Json | null
          due_date: string | null
          id: string
          record_type: string
          responsible_party: string | null
          risk_level: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_date?: string | null
          compliance_date: string
          created_at?: string | null
          description?: string | null
          documents?: Json | null
          due_date?: string | null
          id?: string
          record_type: string
          responsible_party?: string | null
          risk_level?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_date?: string | null
          compliance_date?: string
          created_at?: string | null
          description?: string | null
          documents?: Json | null
          due_date?: string | null
          id?: string
          record_type?: string
          responsible_party?: string | null
          risk_level?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      csp_violations: {
        Row: {
          blocked_uri: string | null
          disposition: string | null
          document_uri: string | null
          id: string
          metadata: Json | null
          original_policy: string | null
          timestamp: string
          user_agent: string | null
          violated_directive: string | null
        }
        Insert: {
          blocked_uri?: string | null
          disposition?: string | null
          document_uri?: string | null
          id?: string
          metadata?: Json | null
          original_policy?: string | null
          timestamp?: string
          user_agent?: string | null
          violated_directive?: string | null
        }
        Update: {
          blocked_uri?: string | null
          disposition?: string | null
          document_uri?: string | null
          id?: string
          metadata?: Json | null
          original_policy?: string | null
          timestamp?: string
          user_agent?: string | null
          violated_directive?: string | null
        }
        Relationships: []
      }
      exceptions: {
        Row: {
          created_at: string | null
          description: string
          exception_type: string
          id: string
          invoice_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          validation_rule_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          exception_type: string
          id?: string
          invoice_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          validation_rule_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          exception_type?: string
          id?: string
          invoice_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          validation_rule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exceptions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptions_validation_rule_id_fkey"
            columns: ["validation_rule_id"]
            isOneToOne: false
            referencedRelation: "validation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      field_tickets: {
        Row: {
          afe_id: string | null
          amount: number
          created_at: string
          equipment: string | null
          gps_coordinates: Json | null
          hours: number | null
          id: string
          invoice_id: string | null
          location: string | null
          notes: string | null
          personnel: string | null
          rate: number | null
          service_date: string
          service_type: string | null
          ticket_number: string
          updated_at: string
          user_id: string
          uwi_id: string | null
          vendor_name: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          afe_id?: string | null
          amount: number
          created_at?: string
          equipment?: string | null
          gps_coordinates?: Json | null
          hours?: number | null
          id?: string
          invoice_id?: string | null
          location?: string | null
          notes?: string | null
          personnel?: string | null
          rate?: number | null
          service_date: string
          service_type?: string | null
          ticket_number: string
          updated_at?: string
          user_id: string
          uwi_id?: string | null
          vendor_name: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          afe_id?: string | null
          amount?: number
          created_at?: string
          equipment?: string | null
          gps_coordinates?: Json | null
          hours?: number | null
          id?: string
          invoice_id?: string | null
          location?: string | null
          notes?: string | null
          personnel?: string | null
          rate?: number | null
          service_date?: string
          service_type?: string | null
          ticket_number?: string
          updated_at?: string
          user_id?: string
          uwi_id?: string | null
          vendor_name?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_tickets_afe_id_fkey"
            columns: ["afe_id"]
            isOneToOne: false
            referencedRelation: "afes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_tickets_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_tickets_uwi_id_fkey"
            columns: ["uwi_id"]
            isOneToOne: false
            referencedRelation: "uwis"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_status: {
        Row: {
          config: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          integration_name: string
          integration_type: string
          last_sync_at: string | null
          next_sync_at: string | null
          status: string | null
          sync_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_name: string
          integration_type: string
          last_sync_at?: string | null
          next_sync_at?: string | null
          status?: string | null
          sync_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          integration_name?: string
          integration_type?: string
          last_sync_at?: string | null
          next_sync_at?: string | null
          status?: string | null
          sync_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoice_documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          invoice_id: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          invoice_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          invoice_id?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_documents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_extractions: {
        Row: {
          afe_id: string | null
          afe_number: string | null
          budget_remaining: number | null
          budget_status: string | null
          confidence_scores: Json | null
          created_at: string
          extracted_at: string | null
          extracted_data: Json | null
          extraction_status: string
          field_ticket_refs: string[] | null
          id: string
          invoice_id: string
          line_items: Json | null
          po_number: string | null
          service_period_end: string | null
          service_period_start: string | null
          updated_at: string
          user_id: string
          uwi: string | null
          uwi_id: string | null
          validated_at: string | null
          validation_errors: string[] | null
          validation_results: Json | null
          validation_warnings: string[] | null
        }
        Insert: {
          afe_id?: string | null
          afe_number?: string | null
          budget_remaining?: number | null
          budget_status?: string | null
          confidence_scores?: Json | null
          created_at?: string
          extracted_at?: string | null
          extracted_data?: Json | null
          extraction_status?: string
          field_ticket_refs?: string[] | null
          id?: string
          invoice_id: string
          line_items?: Json | null
          po_number?: string | null
          service_period_end?: string | null
          service_period_start?: string | null
          updated_at?: string
          user_id: string
          uwi?: string | null
          uwi_id?: string | null
          validated_at?: string | null
          validation_errors?: string[] | null
          validation_results?: Json | null
          validation_warnings?: string[] | null
        }
        Update: {
          afe_id?: string | null
          afe_number?: string | null
          budget_remaining?: number | null
          budget_status?: string | null
          confidence_scores?: Json | null
          created_at?: string
          extracted_at?: string | null
          extracted_data?: Json | null
          extraction_status?: string
          field_ticket_refs?: string[] | null
          id?: string
          invoice_id?: string
          line_items?: Json | null
          po_number?: string | null
          service_period_end?: string | null
          service_period_start?: string | null
          updated_at?: string
          user_id?: string
          uwi?: string | null
          uwi_id?: string | null
          validated_at?: string | null
          validation_errors?: string[] | null
          validation_results?: Json | null
          validation_warnings?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_extractions_afe_id_fkey"
            columns: ["afe_id"]
            isOneToOne: false
            referencedRelation: "afes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_extractions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: true
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_extractions_uwi_id_fkey"
            columns: ["uwi_id"]
            isOneToOne: false
            referencedRelation: "uwis"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          vendor_name: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          vendor_name: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          vendor_name?: string
        }
        Relationships: []
      }
      lead_submissions: {
        Row: {
          blocked: boolean | null
          created_at: string
          id: string
          ip_address: unknown
          submission_count: number
          window_start: string
        }
        Insert: {
          blocked?: boolean | null
          created_at?: string
          id?: string
          ip_address: unknown
          submission_count?: number
          window_start?: string
        }
        Update: {
          blocked?: boolean | null
          created_at?: string
          id?: string
          ip_address?: unknown
          submission_count?: number
          window_start?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          interest_type: string
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
          interest_type: string
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
          interest_type?: string
          lead_source?: string | null
          lead_status?: string | null
          message?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string
          id: string
          labels: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          timestamp: string
        }
        Insert: {
          created_at?: string
          id?: string
          labels?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          timestamp?: string
        }
        Update: {
          created_at?: string
          id?: string
          labels?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          timestamp?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          department: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          job_title: string | null
          last_login_at: string | null
          manager_id: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          last_login_at?: string | null
          manager_id?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          job_title?: string | null
          last_login_at?: string | null
          manager_id?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          request_count: number
          resource_key: string
          resource_type: string
          user_id: string | null
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          request_count?: number
          resource_key: string
          resource_type: string
          user_id?: string | null
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          request_count?: number
          resource_key?: string
          resource_type?: string
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      slo_violations: {
        Row: {
          burn_rate: number | null
          created_at: string
          details: Json | null
          error_budget_consumed: number | null
          id: string
          resolved_at: string | null
          severity: string
          slo_name: string
          timestamp: string
          violation_type: string
          window_duration: string | null
        }
        Insert: {
          burn_rate?: number | null
          created_at?: string
          details?: Json | null
          error_budget_consumed?: number | null
          id?: string
          resolved_at?: string | null
          severity: string
          slo_name: string
          timestamp?: string
          violation_type: string
          window_duration?: string | null
        }
        Update: {
          burn_rate?: number | null
          created_at?: string
          details?: Json | null
          error_budget_consumed?: number | null
          id?: string
          resolved_at?: string | null
          severity?: string
          slo_name?: string
          timestamp?: string
          violation_type?: string
          window_duration?: string | null
        }
        Relationships: []
      }
      system_health_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          recorded_at: string | null
          status: string | null
          threshold_critical: number | null
          threshold_warning: number | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          recorded_at?: string | null
          status?: string | null
          threshold_critical?: number | null
          threshold_warning?: number | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          recorded_at?: string | null
          status?: string | null
          threshold_critical?: number | null
          threshold_warning?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      uwis: {
        Row: {
          completion_date: string | null
          created_at: string
          id: string
          location: string | null
          metadata: Json | null
          operator: string | null
          province: string | null
          spud_date: string | null
          status: string
          updated_at: string
          user_id: string
          uwi: string
          well_name: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          operator?: string | null
          province?: string | null
          spud_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
          uwi: string
          well_name?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          operator?: string | null
          province?: string | null
          spud_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          uwi?: string
          well_name?: string | null
        }
        Relationships: []
      }
      validation_rules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          rule_config: Json
          rule_name: string
          rule_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_config?: Json
          rule_name: string
          rule_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_config?: Json
          rule_name?: string
          rule_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workflow_instances: {
        Row: {
          completed_at: string | null
          current_step: number | null
          entity_id: string
          entity_type: string
          id: string
          started_at: string | null
          status: string | null
          step_data: Json | null
          updated_at: string | null
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number | null
          entity_id: string
          entity_type: string
          id?: string
          started_at?: string | null
          status?: string | null
          step_data?: Json | null
          updated_at?: string | null
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          started_at?: string | null
          status?: string | null
          step_data?: Json | null
          updated_at?: string | null
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_instances_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          steps: Json
          updated_at: string | null
          user_id: string
          workflow_type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          steps?: Json
          updated_at?: string | null
          user_id: string
          workflow_type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          steps?: Json
          updated_at?: string | null
          user_id?: string
          workflow_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_old_activities: { Args: never; Returns: undefined }
      assign_admin_role: { Args: never; Returns: undefined }
      assign_ceo_admin_role: { Args: never; Returns: undefined }
      check_lead_rate_limit: { Args: { check_ip: unknown }; Returns: boolean }
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "viewer"
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
      app_role: ["admin", "operator", "viewer"],
    },
  },
} as const
