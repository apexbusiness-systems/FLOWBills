import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface MatchedSet {
  id: string;
  invoice_id: string;
  invoice_number: string;
  invoice_amount: number;
  invoice_date: string;
  vendor_name: string;
  afe_id: string | null;
  afe_number: string | null;
  afe_budget: number | null;
  field_tickets: Array<{
    id: string;
    ticket_number: string;
    amount: number;
    service_date: string;
  }>;
  match_status: "perfect" | "partial" | "mismatch";
  match_confidence: number;
  issues: string[];
  total_ticket_amount: number;
  amount_variance: number;
  created_at: string;
}

export const useThreeWayMatching = () => {
  const [loading, setLoading] = useState(false);
  const [matchedSets, setMatchedSets] = useState<MatchedSet[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const calculateMatchStatus = useCallback(
    (
      invoiceAmount: number,
      ticketAmount: number,
      hasAFE: boolean
    ): { status: "perfect" | "partial" | "mismatch"; confidence: number; issues: string[] } => {
      const issues: string[] = [];
      let confidence = 100;

      if (!hasAFE) {
        issues.push("No AFE match found");
        confidence -= 40;
      }

      const variance = Math.abs(invoiceAmount - ticketAmount);
      const variancePercent = (variance / invoiceAmount) * 100;

      if (variancePercent > 10) {
        issues.push(`Amount variance: ${variancePercent.toFixed(1)}% (${variance.toFixed(2)})`);
        confidence -= 30;
      } else if (variancePercent > 5) {
        issues.push(`Minor amount variance: ${variancePercent.toFixed(1)}%`);
        confidence -= 15;
      }

      if (ticketAmount === 0) {
        issues.push("No field tickets found");
        confidence -= 50;
      }

      let status: "perfect" | "partial" | "mismatch";
      if (confidence >= 90) status = "perfect";
      else if (confidence >= 60) status = "partial";
      else status = "mismatch";

      return { status, confidence, issues };
    },
    []
  );

  const fetchMatchedSets = useCallback(
    async (filters?: { status?: "perfect" | "partial" | "mismatch"; minConfidence?: number }) => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch invoices with extractions
        const { data: invoices, error: invError } = await supabase
          .from("invoices")
          .select(
            `
          id,
          invoice_number,
          amount,
          invoice_date,
          vendor_name,
          created_at,
          invoice_extractions (
            afe_id,
            afe_number,
            field_ticket_refs
          )
        `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (invError) throw invError;

        // Fetch all AFEs
        const { data: afes, error: afeError } = await supabase
          .from("afes")
          .select("id, afe_number, budget_amount")
          .eq("user_id", user.id);

        if (afeError) throw afeError;

        // Fetch all field tickets
        const { data: tickets, error: ticketError } = await supabase
          .from("field_tickets")
          .select("id, ticket_number, amount, service_date, invoice_id")
          .eq("user_id", user.id);

        if (ticketError) throw ticketError;

        // Build matched sets
        const matched: MatchedSet[] = [];

        for (const invoice of invoices || []) {
          const extraction = invoice.invoice_extractions?.[0];

          // Find matching AFE
          let matchedAFE = null;
          if (extraction?.afe_number) {
            matchedAFE = afes?.find((a) => a.afe_number === extraction.afe_number);
          }

          // Find matching field tickets
          const matchedTickets =
            tickets?.filter((t) => {
              // Match by invoice_id or ticket number reference
              if (t.invoice_id === invoice.id) return true;
              if (extraction?.field_ticket_refs?.includes(t.ticket_number)) return true;
              return false;
            }) || [];

          const totalTicketAmount = matchedTickets.reduce((sum, t) => sum + Number(t.amount), 0);
          const amountVariance = Number(invoice.amount) - totalTicketAmount;

          const { status, confidence, issues } = calculateMatchStatus(
            Number(invoice.amount),
            totalTicketAmount,
            !!matchedAFE
          );

          // Apply filters
          if (filters?.status && status !== filters.status) continue;
          if (filters?.minConfidence && confidence < filters.minConfidence) continue;

          matched.push({
            id: invoice.id,
            invoice_id: invoice.id,
            invoice_number: invoice.invoice_number,
            invoice_amount: Number(invoice.amount),
            invoice_date: invoice.invoice_date,
            vendor_name: invoice.vendor_name,
            afe_id: matchedAFE?.id || null,
            afe_number: matchedAFE?.afe_number || null,
            afe_budget: matchedAFE ? Number(matchedAFE.budget_amount) : null,
            field_tickets: matchedTickets.map((t) => ({
              id: t.id,
              ticket_number: t.ticket_number,
              amount: Number(t.amount),
              service_date: t.service_date,
            })),
            match_status: status,
            match_confidence: confidence,
            issues,
            total_ticket_amount: totalTicketAmount,
            amount_variance: amountVariance,
            created_at: invoice.created_at,
          });
        }

        setMatchedSets(matched);
      } catch (error) {
        console.error("Error fetching matched sets:", error);
        toast({
          title: "Error",
          description: "Failed to fetch matching data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [user, toast, calculateMatchStatus]
  );

  const approveMatch = useCallback(
    async (matchId: string) => {
      if (!user) return false;

      try {
        // Update invoice status to approved
        const { error } = await supabase
          .from("invoices")
          .update({ status: "approved" })
          .eq("id", matchId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Invoice approved successfully",
        });

        await fetchMatchedSets();
        return true;
      } catch (error: any) {
        console.error("Error approving match:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to approve invoice",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast, fetchMatchedSets]
  );

  const rejectMatch = useCallback(
    async (matchId: string, reason: string) => {
      if (!user) return false;

      try {
        // Update invoice status to rejected with notes
        const { error } = await supabase
          .from("invoices")
          .update({
            status: "rejected",
            notes: reason,
          })
          .eq("id", matchId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Invoice rejected",
        });

        await fetchMatchedSets();
        return true;
      } catch (error: any) {
        console.error("Error rejecting match:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to reject invoice",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast, fetchMatchedSets]
  );

  const getMatchStats = useCallback(() => {
    const total = matchedSets.length;
    const perfect = matchedSets.filter((m) => m.match_status === "perfect").length;
    const partial = matchedSets.filter((m) => m.match_status === "partial").length;
    const mismatch = matchedSets.filter((m) => m.match_status === "mismatch").length;
    const avgConfidence =
      total > 0 ? matchedSets.reduce((sum, m) => sum + m.match_confidence, 0) / total : 0;

    return {
      total,
      perfect,
      partial,
      mismatch,
      avgConfidence,
      perfectRate: total > 0 ? (perfect / total) * 100 : 0,
    };
  }, [matchedSets]);

  useEffect(() => {
    fetchMatchedSets();
  }, [fetchMatchedSets]);

  return {
    matchedSets,
    loading,
    fetchMatchedSets,
    approveMatch,
    rejectMatch,
    getMatchStats,
  };
};
