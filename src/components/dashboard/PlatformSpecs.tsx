import { 
  Shield, 
  Zap, 
  Database, 
  Cloud, 
  FileCheck, 
  Users, 
  Globe, 
  Lock,
  Cpu,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Server,
  Workflow,
  AlertTriangle,
  Clock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PlatformSpecs = () => {
  const securityFeatures = [
    { name: "SOC 2 Type II", status: "Certified", icon: Shield },
    { name: "PIPEDA/PIPA Compliance", status: "Compliant", icon: Lock },
    { name: "256-bit AES Encryption", status: "Active", icon: Lock },
    { name: "Multi-Factor Authentication", status: "Enforced", icon: Shield },
    { name: "Role-Based Access Control", status: "Active", icon: Users },
    { name: "Audit Trail Logging", status: "24/7", icon: FileCheck }
  ];

  const integrationCapabilities = [
    { system: "NOV (National Oilwell Varco)", type: "EDI X12", status: "Certified" },
    { system: "Oracle E-Business Suite", type: "API & Batch", status: "Active" },
    { system: "SAP ERP", type: "RFC/BAPI", status: "Available" },
    { system: "QuickBooks Enterprise", type: "SDK/API", status: "Active" },
    { system: "Sage 300/500", type: "ODBC/API", status: "Available" },
    { system: "Microsoft Dynamics", type: "Web API", status: "Available" }
  ];

  const processingCapabilities = [
    { capability: "Invoice Processing Volume", spec: "Up to 50,000 invoices/month" },
    { capability: "Processing Speed", spec: "< 30 seconds per invoice" },
    { capability: "Accuracy Rate", spec: "99.7% automated processing" },
    { capability: "File Format Support", spec: "PDF, Excel, CSV, XML, EDI" },
    { capability: "OCR Accuracy", spec: "98.5% field extraction" },
    { capability: "Validation Rules", spec: "Unlimited custom rules" }
  ];

  const complianceStandards = [
    { standard: "Canadian Energy Industry", framework: "CAPP Guidelines", status: "Compliant" },
    { standard: "Provincial Regulations", framework: "Alberta/BC/SK", status: "Updated" },
    { standard: "GST/HST Compliance", framework: "CRA Requirements", status: "Automated" },
    { standard: "Environmental Reporting", framework: "ECCC Standards", status: "Integrated" },
    { standard: "Safety Compliance", framework: "CSA Standards", status: "Monitored" },
    { standard: "Financial Reporting", framework: "IFRS/ASPE", status: "Supported" }
  ];

  return (
    <div className="space-y-8">
      {/* Platform Overview */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Zap className="h-6 w-6 text-primary" />
            FLOW Billing Platform Specifications
          </CardTitle>
          <CardDescription className="text-lg">
            Enterprise-grade billing automation specifically designed for Canada's oil & gas industry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold text-primary">99.7%</div>
              <div className="text-sm text-muted-foreground">Automation Rate</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Monthly Capacity</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-3xl font-bold text-primary">&lt; 30s</div>
              <div className="text-sm text-muted-foreground">Processing Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security & Compliance Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <feature.icon className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="font-medium">{feature.name}</div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.status}
                  </Badge>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processing Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Processing Capabilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {processingCapabilities.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-4 rounded-lg bg-muted/30">
                <div className="font-medium">{item.capability}</div>
                <div className="text-primary font-semibold">{item.spec}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            System Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {integrationCapabilities.map((integration, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{integration.system}</div>
                    <div className="text-sm text-muted-foreground">{integration.type}</div>
                  </div>
                </div>
                <Badge 
                  variant={integration.status === 'Certified' ? 'default' : 
                           integration.status === 'Active' ? 'secondary' : 'outline'}
                >
                  {integration.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Industry Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Industry Compliance Standards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceStandards.map((standard, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div>
                  <div className="font-medium">{standard.standard}</div>
                  <div className="text-sm text-muted-foreground">{standard.framework}</div>
                </div>
                <Badge variant="secondary">{standard.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Specifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            Technical Infrastructure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <Globe className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-semibold">Cloud Native</div>
              <div className="text-sm text-muted-foreground">AWS/Azure Ready</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-semibold">99.9% Uptime</div>
              <div className="text-sm text-muted-foreground">SLA Guaranteed</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-semibold">24/7 Support</div>
              <div className="text-sm text-muted-foreground">Canadian Team</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <Workflow className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="font-semibold">API First</div>
              <div className="text-sm text-muted-foreground">RESTful APIs</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformSpecs;