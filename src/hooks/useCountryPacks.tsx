import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CountryPack {
  code: string;
  name: string;
  format: string;
  adapter: string;
  enabled: boolean;
  mandatory_date: string;
  status: "ready" | "testing" | "pending";
  readiness_score: number;
  description: string;
  features: string[];
  legal_deadline: string;
}

export interface AdapterTestResult {
  success: boolean;
  referenceNumber?: string;
  status?: string;
  errors?: string[];
  ksefXml?: string;
  verifactuData?: any;
  pintDocument?: any;
}

const COUNTRY_PACKS: CountryPack[] = [
  {
    code: "PL",
    name: "Poland",
    format: "KSeF",
    adapter: "pl-ksef",
    enabled: false,
    mandatory_date: "2026-02-01",
    status: "testing",
    readiness_score: 85,
    description: "KSeF (Krajowy System e-Faktur) mandatory from 1 Feb 2026",
    features: ["Serialize", "Validate", "Send", "Status Check"],
    legal_deadline: "Royal Decree: 1 Feb 2026 (phased roll-in Apr 2026)",
  },
  {
    code: "ES",
    name: "Spain",
    format: "Veri*factu",
    adapter: "es-verifactu",
    enabled: false,
    mandatory_date: "2026-01-01",
    status: "testing",
    readiness_score: 78,
    description: "Veri*factu secure logging for corporates by 1 Jan 2026",
    features: ["Tamper-evident logbook", "Hash chain", "QR generation", "AEAT integration"],
    legal_deadline: "Royal Decree 254/2025: Corporates 1 Jan 2026, broader 1 Jul 2026",
  },
  {
    code: "FR",
    name: "France",
    format: "Factur-X",
    adapter: "factur-x",
    enabled: false,
    mandatory_date: "2026-09-01",
    status: "pending",
    readiness_score: 45,
    description: "B2B e-invoicing/e-reporting from 1 Sep 2026",
    features: ["Factur-X format", "E-reporting", "Receive-ready checks", "Size-based rules"],
    legal_deadline: "Finance Ministry: Receive 1 Sep 2026, size-based issuance 2026-2027",
  },
  {
    code: "DE",
    name: "Germany",
    format: "XRechnung",
    adapter: "xrechnung",
    enabled: true,
    mandatory_date: "2025-01-01",
    status: "ready",
    readiness_score: 95,
    description: "Must receive from 1 Jan 2025, issuance phases through 2028",
    features: ["XRechnung format", "Strict mode", "Readiness scoring", "Timeline hints"],
    legal_deadline: "EU Directive: Receive 1 Jan 2025, issuance phased to 2028",
  },
  {
    code: "PINT",
    name: "PINT",
    format: "OpenPeppol",
    adapter: "pint",
    enabled: false,
    mandatory_date: "2025-12-31",
    status: "testing",
    readiness_score: 72,
    description: "Pan-European Invoice Transaction standard",
    features: [
      "Multi-format conversion",
      "UBL/CII support",
      "Identifier validation",
      "Cross-format mapping",
    ],
    legal_deadline: "OpenPeppol: PINT readiness by Q4 2025",
  },
];

export const useCountryPacks = () => {
  const [countryPacks, setCountryPacks] = useState<CountryPack[]>(COUNTRY_PACKS);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const toggleCountryPack = useCallback(
    async (code: string) => {
      try {
        setCountryPacks((prev) =>
          prev.map((pack) => (pack.code === code ? { ...pack, enabled: !pack.enabled } : pack))
        );

        toast({
          title: "Country Pack Updated",
          description: `${code} adapter has been ${countryPacks.find((p) => p.code === code)?.enabled ? "disabled" : "enabled"}`,
        });
      } catch (error) {
        console.error("Error toggling country pack:", error);
        toast({
          title: "Error",
          description: "Failed to update country pack",
          variant: "destructive",
        });
      }
    },
    [countryPacks, toast]
  );

  const testAdapter = useCallback(
    async (
      code: string,
      operation: "serialize" | "validate" | "send" | "status",
      xmlInput: string,
      referenceNumber?: string
    ): Promise<AdapterTestResult> => {
      setIsLoading(true);
      try {
        const pack = countryPacks.find((p) => p.code === code);
        if (!pack) {
          throw new Error(`Country pack ${code} not found`);
        }

        const body: any = {
          invoiceXml: xmlInput,
          operation: operation,
        };

        if (referenceNumber) {
          body.referenceNumber = referenceNumber;
        }

        const { data, error } = await supabase.functions.invoke(`adapters/${pack.adapter}`, {
          body,
        });

        if (error) throw error;

        toast({
          title: "Test Completed",
          description: `${operation} operation completed for ${pack.name}`,
        });

        return data as AdapterTestResult;
      } catch (error) {
        console.error("Adapter test error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

        toast({
          title: "Test Failed",
          description: errorMessage,
          variant: "destructive",
        });

        return {
          success: false,
          errors: [errorMessage],
        };
      } finally {
        setIsLoading(false);
      }
    },
    [countryPacks, toast]
  );

  const getReadinessStats = useCallback(() => {
    const enabled = countryPacks.filter((p) => p.enabled).length;
    const ready = countryPacks.filter((p) => p.status === "ready").length;
    const testing = countryPacks.filter((p) => p.status === "testing").length;
    const pending = countryPacks.filter((p) => p.status === "pending").length;
    const averageScore = Math.round(
      countryPacks.reduce((sum, pack) => sum + pack.readiness_score, 0) / countryPacks.length
    );

    return {
      enabled,
      ready,
      testing,
      pending,
      total: countryPacks.length,
      averageScore,
    };
  }, [countryPacks]);

  const getUpcomingDeadlines = useCallback(() => {
    const today = new Date();
    return countryPacks
      .map((pack) => ({
        ...pack,
        daysUntilDeadline: Math.ceil(
          (new Date(pack.mandatory_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        ),
      }))
      .filter((pack) => pack.daysUntilDeadline > 0)
      .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline)
      .slice(0, 3);
  }, [countryPacks]);

  return {
    countryPacks,
    isLoading,
    toggleCountryPack,
    testAdapter,
    getReadinessStats,
    getUpcomingDeadlines,
  };
};
