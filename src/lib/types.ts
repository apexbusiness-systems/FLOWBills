import type { Database } from "./supabase.types";

export type EinvoiceRow = Database["public"]["Tables"]["einvoice_documents"]["Row"];

export type EinvoiceVM = {
  id: string;
  format: EinvoiceRow["format"];
  countryCode?: string | null;
  createdAt: string;
  validated: boolean;
  issues: string[];
};

export function toVM(row: EinvoiceRow): EinvoiceVM {
  const errs = (row.validation_results as any) ?? []
  return {
    id: row.id,
    format: row.format,
    countryCode: row.country_code ?? null,
    createdAt: row.created_at,
    validated: row.status === 'validated',
    issues: Array.isArray(errs) ? errs : []
  }
}