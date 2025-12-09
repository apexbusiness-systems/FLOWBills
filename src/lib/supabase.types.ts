// This file is generated automatically - do not edit manually
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      einvoice_documents: {
        Row: {
          id: string;
          document_id: string;
          format: "bis30" | "xrechnung" | "facturx";
          xml_content: string | null;
          status: "pending" | "validated" | "sent" | "failed";
          tenant_id: string;
          country_code: string | null;
          total_amount: number | null;
          currency: string | null;
          issue_date: string | null;
          due_date: string | null;
          sender_id: string | null;
          receiver_id: string | null;
          confidence_score: number | null;
          validation_results: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          format: "bis30" | "xrechnung" | "facturx";
          xml_content?: string | null;
          status?: "pending" | "validated" | "sent" | "failed";
          tenant_id?: string;
          country_code?: string | null;
          total_amount?: number | null;
          currency?: string | null;
          issue_date?: string | null;
          due_date?: string | null;
          sender_id?: string | null;
          receiver_id?: string | null;
          confidence_score?: number | null;
          validation_results?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          format?: "bis30" | "xrechnung" | "facturx";
          xml_content?: string | null;
          status?: "pending" | "validated" | "sent" | "failed";
          tenant_id?: string;
          country_code?: string | null;
          total_amount?: number | null;
          currency?: string | null;
          issue_date?: string | null;
          due_date?: string | null;
          sender_id?: string | null;
          receiver_id?: string | null;
          confidence_score?: number | null;
          validation_results?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
