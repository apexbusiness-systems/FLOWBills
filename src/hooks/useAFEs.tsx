import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface AFE {
  id: string;
  user_id: string;
  afe_number: string;
  description: string | null;
  budget_amount: number;
  spent_amount: number;
  status: "active" | "closed" | "cancelled";
  well_name: string | null;
  project_type: string | null;
  approval_date: string | null;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useAFEs = () => {
  const [loading, setLoading] = useState(false);
  const [afes, setAfes] = useState<AFE[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAFEs = useCallback(
    async (filters?: { status?: string; search?: string }) => {
      if (!user) return;

      setLoading(true);
      try {
        let query = supabase
          .from("afes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (filters?.status) {
          query = query.eq("status", filters.status);
        }

        if (filters?.search) {
          query = query.or(
            `afe_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%,well_name.ilike.%${filters.search}%`
          );
        }

        const { data, error } = await query;

        if (error) throw error;
        setAfes((data || []) as AFE[]);
      } catch (error) {
        console.error("Error fetching AFEs:", error);
        toast({
          title: "Error",
          description: "Failed to fetch AFEs",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  const createAFE = useCallback(
    async (afeData: {
      afe_number: string;
      description?: string;
      budget_amount: number;
      well_name?: string;
      project_type?: string;
      approval_date?: string;
      expiry_date?: string;
    }) => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from("afes")
          .insert({
            ...afeData,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: `AFE ${afeData.afe_number} created successfully`,
        });

        await fetchAFEs();
        return data;
      } catch (error: any) {
        console.error("Error creating AFE:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to create AFE",
          variant: "destructive",
        });
        return null;
      }
    },
    [user, toast, fetchAFEs]
  );

  const updateAFE = useCallback(
    async (
      afeId: string,
      updates: Partial<Omit<AFE, "id" | "user_id" | "created_at" | "updated_at">>
    ) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("afes")
          .update(updates)
          .eq("id", afeId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "AFE updated successfully",
        });

        await fetchAFEs();
        return true;
      } catch (error: any) {
        console.error("Error updating AFE:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to update AFE",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast, fetchAFEs]
  );

  const deleteAFE = useCallback(
    async (afeId: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("afes")
          .delete()
          .eq("id", afeId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "AFE deleted successfully",
        });

        await fetchAFEs();
        return true;
      } catch (error: any) {
        console.error("Error deleting AFE:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete AFE",
          variant: "destructive",
        });
        return false;
      }
    },
    [user, toast, fetchAFEs]
  );

  const getAFEById = useCallback(
    (id: string) => {
      return afes.find((afe) => afe.id === id);
    },
    [afes]
  );

  const getAFEStats = useCallback(() => {
    const total = afes.length;
    const active = afes.filter((a) => a.status === "active").length;
    const totalBudget = afes.reduce((sum, a) => sum + Number(a.budget_amount), 0);
    const totalSpent = afes.reduce((sum, a) => sum + Number(a.spent_amount), 0);
    const utilizationRate = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      total,
      active,
      totalBudget,
      totalSpent,
      utilizationRate,
    };
  }, [afes]);

  useEffect(() => {
    fetchAFEs();
  }, [fetchAFEs]);

  return {
    afes,
    loading,
    fetchAFEs,
    createAFE,
    updateAFE,
    deleteAFE,
    getAFEById,
    getAFEStats,
  };
};
