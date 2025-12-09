import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Send,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Globe,
  Shield,
  TestTube,
} from "lucide-react";

interface CountryAdapter {
  code: string;
  name: string;
  adapter: string;
  enabled: boolean;
  testing: boolean;
}

const adapters: CountryAdapter[] = [
  { code: "PL", name: "Poland KSeF", adapter: "pl-ksef", enabled: false, testing: false },
  { code: "ES", name: "Spain Veri*factu", adapter: "es-verifactu", enabled: false, testing: false },
  { code: "PINT", name: "PINT OpenPeppol", adapter: "pint", enabled: false, testing: false },
];

const CountryPacksManager = () => {
  const [selectedAdapter, setSelectedAdapter] = useState<CountryAdapter | null>(null);
  const [xmlInput, setXmlInput] = useState("");
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeAdapters, setActiveAdapters] = useState(adapters);
  const { toast } = useToast();

  const handleToggleAdapter = (code: string) => {
    setActiveAdapters((prev) =>
      prev.map((adapter) =>
        adapter.code === code ? { ...adapter, enabled: !adapter.enabled } : adapter
      )
    );
  };

  const handleTestAdapter = async (operation: string) => {
    if (!selectedAdapter || !xmlInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please select an adapter and provide XML input",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        `adapters/${selectedAdapter.adapter}`,
        {
          body: {
            invoiceXml: xmlInput,
            operation: operation,
          },
        }
      );

      if (error) throw error;

      setTestResults(data);
      toast({
        title: "Test Completed",
        description: `${operation} operation completed successfully`,
      });
    } catch (error) {
      console.error("Adapter test error:", error);
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      setTestResults({
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Country Packs Manager</h2>
          <p className="text-muted-foreground">
            Configure and test country-specific e-invoicing adapters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {activeAdapters.filter((a) => a.enabled).length} active
          </span>
        </div>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Test adapters in sandbox mode before enabling for production use. All adapters currently
          operate in mock mode without requiring API tokens.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="configure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configure">Configure</TabsTrigger>
          <TabsTrigger value="test">Test & Validate</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeAdapters.map((adapter) => (
              <Card key={adapter.code}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{adapter.name}</CardTitle>
                    <Switch
                      checked={adapter.enabled}
                      onCheckedChange={() => handleToggleAdapter(adapter.code)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{adapter.code}</Badge>
                    <Badge variant={adapter.enabled ? "default" : "secondary"}>
                      {adapter.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">Adapter: {adapter.adapter}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSelectedAdapter(adapter)}
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Adapter
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Select Adapter</label>
                  <div className="mt-2 space-y-2">
                    {activeAdapters.map((adapter) => (
                      <div key={adapter.code} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`adapter-${adapter.code}`}
                          name="adapter"
                          checked={selectedAdapter?.code === adapter.code}
                          onChange={() => setSelectedAdapter(adapter)}
                          className="h-4 w-4"
                        />
                        <label htmlFor={`adapter-${adapter.code}`} className="text-sm">
                          {adapter.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">XML Input</label>
                  <Textarea
                    placeholder="Paste your invoice XML here..."
                    value={xmlInput}
                    onChange={(e) => setXmlInput(e.target.value)}
                    className="mt-2 min-h-[200px] font-mono text-xs"
                  />
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <Button
                    onClick={() => handleTestAdapter("serialize")}
                    disabled={isLoading || !selectedAdapter}
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Serialize
                  </Button>
                  <Button
                    onClick={() => handleTestAdapter("validate")}
                    disabled={isLoading || !selectedAdapter}
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Validate
                  </Button>
                  <Button
                    onClick={() => handleTestAdapter("send")}
                    disabled={isLoading || !selectedAdapter}
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send
                  </Button>
                  <Button
                    onClick={() => handleTestAdapter("status")}
                    disabled={isLoading || !selectedAdapter}
                    variant="outline"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    Status
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                {testResults ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {testResults.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                      <span className={testResults.success ? "text-green-700" : "text-red-700"}>
                        {testResults.success ? "Success" : "Failed"}
                      </span>
                    </div>

                    {testResults.referenceNumber && (
                      <div>
                        <span className="text-sm font-medium">Reference Number:</span>
                        <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                          {testResults.referenceNumber}
                        </p>
                      </div>
                    )}

                    {testResults.status && (
                      <div>
                        <span className="text-sm font-medium">Status:</span>
                        <p className="text-sm mt-1">{testResults.status}</p>
                      </div>
                    )}

                    {testResults.errors && testResults.errors.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Errors:</span>
                        <ul className="text-sm text-red-600 list-disc list-inside mt-1">
                          {testResults.errors.map((error: string, idx: number) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {testResults.ksefXml && (
                      <div>
                        <span className="text-sm font-medium">Generated XML:</span>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-40">
                          {testResults.ksefXml}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No test results yet. Run a test operation to see results here.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adapter Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeAdapters
                  .filter((a) => a.enabled)
                  .map((adapter) => (
                    <div key={adapter.code} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{adapter.name}</h3>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">0</div>
                          <div className="text-sm text-muted-foreground">Successful</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">0</div>
                          <div className="text-sm text-muted-foreground">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">0</div>
                          <div className="text-sm text-muted-foreground">Pending</div>
                        </div>
                      </div>
                    </div>
                  ))}
                {activeAdapters.filter((a) => a.enabled).length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No active adapters to monitor. Enable adapters in the Configure tab.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CountryPacksManager;
