import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Clock, Globe, FileText, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";

interface CountryPack {
  code: string;
  name: string;
  format: string;
  mandatory_date: string;
  status: "ready" | "testing" | "pending";
  enabled: boolean;
  readiness_score: number;
  description: string;
  features: string[];
  legal_deadline: string;
}

const countryPacks: CountryPack[] = [
  {
    code: "PL",
    name: "Poland",
    format: "KSeF",
    mandatory_date: "2026-02-01",
    status: "testing",
    enabled: false,
    readiness_score: 85,
    description: "KSeF (Krajowy System e-Faktur) mandatory from 1 Feb 2026",
    features: ["Serialize", "Validate", "Send", "Status Check"],
    legal_deadline: "Royal Decree: 1 Feb 2026 (phased roll-in Apr 2026)",
  },
  {
    code: "ES",
    name: "Spain",
    format: "Veri*factu",
    mandatory_date: "2026-01-01",
    status: "testing",
    enabled: false,
    readiness_score: 78,
    description: "Veri*factu secure logging for corporates by 1 Jan 2026",
    features: ["Tamper-evident logbook", "Hash chain", "QR generation", "AEAT integration"],
    legal_deadline: "Royal Decree 254/2025: Corporates 1 Jan 2026, broader 1 Jul 2026",
  },
  {
    code: "FR",
    name: "France",
    format: "Factur-X",
    mandatory_date: "2026-09-01",
    status: "pending",
    enabled: false,
    readiness_score: 45,
    description: "B2B e-invoicing/e-reporting from 1 Sep 2026",
    features: ["Factur-X format", "E-reporting", "Receive-ready checks", "Size-based rules"],
    legal_deadline: "Finance Ministry: Receive 1 Sep 2026, size-based issuance 2026-2027",
  },
  {
    code: "DE",
    name: "Germany",
    format: "XRechnung",
    mandatory_date: "2025-01-01",
    status: "ready",
    enabled: true,
    readiness_score: 95,
    description: "Must receive from 1 Jan 2025, issuance phases through 2028",
    features: ["XRechnung format", "Strict mode", "Readiness scoring", "Timeline hints"],
    legal_deadline: "EU Directive: Receive 1 Jan 2025, issuance phased to 2028",
  },
  {
    code: "PINT",
    name: "PINT",
    format: "OpenPeppol",
    mandatory_date: "2025-12-31",
    status: "testing",
    enabled: false,
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

const CountryPacks = () => {
  const [packs, setPacks] = useState(countryPacks);
  const [selectedPack, setSelectedPack] = useState<CountryPack | null>(null);

  const handleToggle = (code: string) => {
    setPacks((prev) =>
      prev.map((pack) => (pack.code === code ? { ...pack, enabled: !pack.enabled } : pack))
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "testing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800";
      case "testing":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BreadcrumbNav className="mb-2" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Country Packs</h1>
          <p className="text-lg text-muted-foreground">Manage e-invoicing compliance by country</p>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {packs.filter((p) => p.enabled).length} of {packs.length} enabled
          </span>
        </div>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Country packs ensure compliance with local e-invoicing regulations. Enable packs based on
          your business operations and legal requirements.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="testing">Testing & Validation</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => (
              <Card key={pack.code} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-mono font-bold">{pack.code}</span>
                      {getStatusIcon(pack.status)}
                    </div>
                    <Switch
                      checked={pack.enabled}
                      onCheckedChange={() => handleToggle(pack.code)}
                    />
                  </div>
                  <CardTitle className="text-xl">{pack.name}</CardTitle>
                  <CardDescription>{pack.format}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Readiness</span>
                    <Badge className={getStatusColor(pack.status)}>{pack.status}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{pack.readiness_score}%</span>
                    </div>
                    <Progress value={pack.readiness_score} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Features:</span>
                    <div className="flex flex-wrap gap-1">
                      {pack.features.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Deadline: {new Date(pack.mandatory_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs font-medium">
                      {getDaysUntilDeadline(pack.mandatory_date)} days remaining
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedPack(pack)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testing & Validation</CardTitle>
              <CardDescription>Test country-specific adapters and validate formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {packs
                .filter((p) => p.enabled || p.status === "testing")
                .map((pack) => (
                  <div key={pack.code} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">
                        {pack.name} ({pack.code})
                      </h3>
                      <Badge className={getStatusColor(pack.status)}>{pack.status}</Badge>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <Button variant="outline" size="sm">
                        Test Serialize
                      </Button>
                      <Button variant="outline" size="sm">
                        Test Validate
                      </Button>
                      <Button variant="outline" size="sm">
                        Test Send
                      </Button>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Timeline</CardTitle>
              <CardDescription>Legal deadlines and requirements by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {packs
                  .sort(
                    (a, b) =>
                      new Date(a.mandatory_date).getTime() - new Date(b.mandatory_date).getTime()
                  )
                  .map((pack) => (
                    <div key={pack.code} className="border-l-4 border-primary pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{pack.name}</h3>
                        <span className="text-sm text-muted-foreground">
                          {new Date(pack.mandatory_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{pack.legal_deadline}</p>
                      <p className="text-sm">{pack.description}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedPack && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{selectedPack.name} Details</CardTitle>
            <CardDescription>{selectedPack.format} Implementation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>{selectedPack.description}</p>
              <div>
                <h4 className="font-semibold mb-2">Legal Requirements:</h4>
                <p className="text-sm text-muted-foreground">{selectedPack.legal_deadline}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Supported Features:</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {selectedPack.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CountryPacks;
