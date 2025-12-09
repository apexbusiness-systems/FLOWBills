import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface FieldTicket {
  id: string;
  user_id: string;
  invoice_id: string | null;
  afe_id: string | null;
  uwi_id: string | null;
  ticket_number: string;
  vendor_name: string;
  service_type: string | null;
  service_date: string;
  hours: number | null;
  rate: number | null;
  amount: number;
  equipment: string | null;
  personnel: string | null;
  location: string | null;
  gps_coordinates: { lat: number; lng: number } | null;
  notes: string | null;
  verified: boolean | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useFieldTickets = () => {
  const [loading, setLoading] = useState(false);
  const [fieldTickets, setFieldTickets] = useState<FieldTicket[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFieldTickets = useCallback(
    async (filters?: {
      verified?: boolean;
      invoice_id?: string;
      afe_id?: string;
      search?: string;
    }) => {
      if (!user) return;

      setLoading(true);
      try {
        let query = supabase
          .from("field_tickets")
          .select("*")
          .eq("user_id", user.id)
          .order("service_date", { ascending: false });

        if (filters?.verified !== undefined) {
          query = query.eq("verified", filters.verified);
        }

        if (filters?.invoice_id) {
          query = query.eq("invoice_id", filters.invoice_id);
        }

        if (filters?.afe_id) {
          query = query.eq("afe_id", filters.afe_id);
        }

        if (filters?.search) {
          query = query.or(
            `ticket_number.ilike.%${filters.search}%,vendor_name.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
          );
        }

        const { data, error } = await query;

        if (error) throw error;
        setFieldTickets((data || []) as FieldTicket[]);
      } catch (error) {
        console.error("Error fetching field tickets:", error);
        toast({
          title: "Error",
          description: "Failed to fetch field tickets",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  const createFieldTicket = useCallback(
    async (ticketData: {
      ticket_number: string;
      vendor_name: string;
      service_date: string;
      amount: number;
      invoice_id?: string;
      afe_id?: string;
      uwi_id?: string;
      service_type?: string;
      hours?: number;
      rate?: number;
      equipment?: string;
      personnel?: string;
      location?: string;
      gps_coordinates?: { lat: number; lng: number };
      notes?: string;
    }) => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from("field_tickets")
          .insert({
            ...ticketData,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: `Field ticket ${ticketData.ticket_number} created successfully`,
        });

        await fetchFieldTickets();
        return data;
      } catch (error: any) {
        console.error("Error creating field ticket:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to create field ticket",
          variant: "destructive",
        });
        return null;
      }
    },
    [user, toast, fetchFieldTickets]
  );

  const updateFieldTicket = useCallback(
    async (
      ticketId: string,
      updates: Partial<Omit<FieldTicket, "id" | "user_id" | "created_at" | "updated_at">>
    ) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("field_tickets")
          .update(updates)
          .eq("id", ticketId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Field ticket updated successfully",
        });

        await fetchFieldTickets();
        return true;
      } catch (error: any) {
        console.error("Error updating field ticket:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to update field ticket",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast, fetchFieldTickets]
  );

  const verifyFieldTicket = useCallback(
    async (ticketId: string, notes?: string) => {
      if (!user) return false;

      try {
        const updates: any = {
          verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        };

        if (notes) {
          updates.notes = notes;
        }

        const { error } = await supabase
          .from("field_tickets")
          .update(updates)
          .eq("id", ticketId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Field ticket verified successfully",
        });

        await fetchFieldTickets();
        return true;
      } catch (error: any) {
        console.error("Error verifying field ticket:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to verify field ticket",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast, fetchFieldTickets]
  );

  const linkToInvoice = useCallback(
    async (ticketId: string, invoiceId: string) => {
      return updateFieldTicket(ticketId, { invoice_id: invoiceId });
    },
    [updateFieldTicket]
  );

  const deleteFieldTicket = useCallback(
    async (ticketId: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("field_tickets")
          .delete()
          .eq("id", ticketId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Field ticket deleted successfully",
        });

        await fetchFieldTickets();
        return true;
      } catch (error: any) {
        console.error("Error deleting field ticket:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete field ticket",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast, fetchFieldTickets]
  );

  const getFieldTicketById = useCallback(
    (id: string) => {
      return fieldTickets.find((ticket) => ticket.id === id);
    },
    [fieldTickets]
  );

  const getUnverifiedCount = useCallback(() => {
    return fieldTickets.filter((t) => !t.verified).length;
  }, [fieldTickets]);

  useEffect(() => {
    fetchFieldTickets();
  }, [fetchFieldTickets]);

  return {
    fieldTickets,
    loading,
    fetchFieldTickets,
    createFieldTicket,
    updateFieldTicket,
    verifyFieldTicket,
    linkToInvoice,
    deleteFieldTicket,
    getFieldTicketById,
    getUnverifiedCount,
  };
};
