import { SupabaseClient } from '@supabase/supabase-js';
import { Tables } from '@/integrations/supabase/types';

export interface UWIProductionData {
  uwi: string;
  well_name: string | null;
  status: string;
  total_invoices: number;
  total_amount: number;
  total_field_tickets: number;
  province: string | null;
  operator: string | null;
}

type UWI = Tables<'uwis'>;

export async function fetchUWIProductionDataOptimized(
  uwis: UWI[],
  userId: string,
  supabase: SupabaseClient
): Promise<UWIProductionData[]> {

  if (!uwis || uwis.length === 0) return [];

  const uwiIds = uwis.map(u => u.id);

  // BULK QUERIES - Only 3 total regardless of UWI count
  const [extractionsResult, fieldTicketsResult, invoicesResult] = await Promise.all([
    supabase
      .from('invoice_extractions')
      .select('uwi_id, invoice_id, extracted_data')
      .in('uwi_id', uwiIds)
      .eq('user_id', userId),

    supabase
      .from('field_tickets')
      .select('id, uwi_id')
      .in('uwi_id', uwiIds)
      .eq('user_id', userId),

    supabase
      .from('invoices')
      .select('id, amount')
      .eq('user_id', userId)  // Pre-fetch all invoices for this user
  ]);

  // IN-MEMORY AGGREGATION
  const extractionsByUWI = new Map<string, any[]>();
  const ticketsByUWI = new Map<string, number>();
  const invoicesById = new Map<string, number>();

  // Build lookup tables
  (extractionsResult.data || []).forEach(ext => {
    if (ext.uwi_id) {
        if (!extractionsByUWI.has(ext.uwi_id)) {
            extractionsByUWI.set(ext.uwi_id, []);
        }
        extractionsByUWI.get(ext.uwi_id)!.push(ext);
    }
  });

  (fieldTicketsResult.data || []).forEach(ticket => {
    if (ticket.uwi_id) {
        ticketsByUWI.set(ticket.uwi_id, (ticketsByUWI.get(ticket.uwi_id) || 0) + 1);
    }
  });

  (invoicesResult.data || []).forEach(inv => {
    invoicesById.set(inv.id, Number(inv.amount));
  });

  // Map results
  return uwis.map(uwi => {
    const extractions = extractionsByUWI.get(uwi.id) || [];
    const totalAmount = extractions.reduce((sum, ext) =>
      sum + (invoicesById.get(ext.invoice_id) || 0), 0
    );

    return {
      uwi: uwi.uwi,
      well_name: uwi.well_name,
      status: uwi.status,
      total_invoices: extractions.length,
      total_amount: totalAmount,
      total_field_tickets: ticketsByUWI.get(uwi.id) || 0,
      province: uwi.province,
      operator: uwi.operator,
    };
  });
}

export async function fetchUWIProductionDataLegacy(
    uwis: UWI[],
    userId: string,
    supabase: SupabaseClient
): Promise<UWIProductionData[]> {
    if (!uwis || uwis.length === 0) return [];

    const report: UWIProductionData[] = await Promise.all(
        uwis.map(async (uwi) => {
            const [extractionsResult, fieldTicketsResult] = await Promise.all([
                supabase
                    .from('invoice_extractions')
                    .select('invoice_id, extracted_data')
                    .eq('uwi_id', uwi.id)
                    .eq('user_id', userId),
                supabase
                    .from('field_tickets')
                    .select('id')
                    .eq('uwi_id', uwi.id)
                    .eq('user_id', userId),
            ]);

            // Get invoice amounts
            let totalAmount = 0;
            if (extractionsResult.data && extractionsResult.data.length > 0) {
                const invoiceIds = extractionsResult.data.map(e => e.invoice_id);
                const { data: invoices } = await supabase
                    .from('invoices')
                    .select('amount')
                    .in('id', invoiceIds);

                totalAmount = (invoices || []).reduce((sum, inv) => sum + Number(inv.amount), 0);
            }

            return {
                uwi: uwi.uwi,
                well_name: uwi.well_name,
                status: uwi.status,
                total_invoices: extractionsResult.data?.length || 0,
                total_amount: totalAmount,
                total_field_tickets: fieldTicketsResult.data?.length || 0,
                province: uwi.province,
                operator: uwi.operator,
            };
        })
    );

    return report;
}
