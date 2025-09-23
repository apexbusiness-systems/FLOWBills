import { 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Upload,
  Settings,
  Bell
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusCard from "@/components/dashboard/StatusCard";
import WorkflowPipeline from "@/components/dashboard/WorkflowPipeline";
import RecentActivity from "@/components/dashboard/RecentActivity";
import CompliancePanel from "@/components/dashboard/CompliancePanel";
import NOVIntegrationStatus from "@/components/dashboard/NOVIntegrationStatus";
import InvoiceUpload from "@/components/dashboard/InvoiceUpload";
import ValidationRules from "@/components/dashboard/ValidationRules";
import ExceptionQueue from "@/components/dashboard/ExceptionQueue";
import SystemHealthCheck from "@/components/dashboard/SystemHealthCheck";
import heroImage from "@/assets/hero-oilgas.jpg";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      {/* Hero Section */}
      <div 
        className="relative h-64 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
        role="img"
        aria-label="Oil and gas industrial facility"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        <div className="relative h-full flex items-center justify-center px-6">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-2">
              OilField Billing Platform
            </h1>
            <p className="text-xl opacity-90 mb-4">
              Enterprise-grade NOV-compatible billing automation for Canada's oil & gas industry
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>PIPEDA/PIPA Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>NOV Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="p-6">
        {/* Quick Actions */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="enterprise" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Invoices
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Configure Rules
            </Button>
            <Button variant="ghost" className="gap-2 relative">
              <Bell className="h-4 w-4" />
              Notifications
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
        </div>

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="integrations">Systems</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Key Metrics */}
            <section aria-labelledby="metrics-heading">
              <h2 id="metrics-heading" className="text-2xl font-semibold text-foreground mb-4">
                Key Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatusCard
                  title="Monthly Volume"
                  value="$2.4M"
                  change="+12.5% vs last month"
                  changeType="increase"
                  icon={DollarSign}
                  description="Total invoice value processed"
                />
                <StatusCard
                  title="Active Invoices"
                  value="847"
                  change="+23 today"
                  changeType="increase"
                  icon={FileText}
                  status="processing"
                  description="In processing pipeline"
                />
                <StatusCard
                  title="Processing Rate"
                  value="94.2%"
                  change="+2.1% improvement"
                  changeType="increase"
                  icon={TrendingUp}
                  status="approved"
                  description="Automated processing success"
                />
                <StatusCard
                  title="Exception Queue" 
                  value="12"
                  change="3 require attention"
                  changeType="decrease"
                  icon={AlertTriangle}
                  status="pending"
                  description="Manual review needed"
                />
              </div>
            </section>

            {/* Workflow Pipeline */}
            <section aria-labelledby="workflow-heading">
              <h2 id="workflow-heading" className="text-2xl font-semibold text-foreground mb-4">
                Invoice Processing Workflow
              </h2>
              <WorkflowPipeline />
            </section>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-8">
                <section aria-labelledby="activity-heading">
                  <h2 id="activity-heading" className="text-2xl font-semibold text-foreground mb-4">
                    Recent Activity
                  </h2>
                  <RecentActivity />
                </section>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                <section aria-labelledby="compliance-heading">
                  <h2 id="compliance-heading" className="text-2xl font-semibold text-foreground mb-4">
                    Security & Compliance
                  </h2>
                  <CompliancePanel />
                </section>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inbox">
            <section aria-labelledby="inbox-heading">
              <h2 id="inbox-heading" className="text-2xl font-semibold text-foreground mb-4">
                Invoice Inbox & Upload
              </h2>
              <InvoiceUpload />
            </section>
          </TabsContent>

          <TabsContent value="validation">
            <section aria-labelledby="validation-heading">
              <h2 id="validation-heading" className="text-2xl font-semibold text-foreground mb-4">
                Validation Rules Management
              </h2>
              <ValidationRules />
            </section>
          </TabsContent>

          <TabsContent value="exceptions">
            <section aria-labelledby="exceptions-heading">
              <h2 id="exceptions-heading" className="text-2xl font-semibold text-foreground mb-4">
                Exception Queue Management
              </h2>
              <ExceptionQueue />
            </section>
          </TabsContent>

          <TabsContent value="compliance">
            <section aria-labelledby="compliance-tab-heading">
              <h2 id="compliance-tab-heading" className="text-2xl font-semibold text-foreground mb-4">
                Security & Compliance Dashboard
              </h2>
              <div className="grid grid-cols-1 gap-8">
                <CompliancePanel />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="integrations">
            <section aria-labelledby="integrations-heading">
              <h2 id="integrations-heading" className="text-2xl font-semibold text-foreground mb-4">
                System Integrations & NOV Status
              </h2>
              <div className="grid grid-cols-1 gap-8">
                <NOVIntegrationStatus />
                <SystemHealthCheck />
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
