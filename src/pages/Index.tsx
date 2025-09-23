import { 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Upload,
  Settings,
  Bell,
  Plus,
  Zap
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
import SecurityDashboard from "@/components/dashboard/SecurityDashboard";
import FloatingActionButton from "@/components/ui/floating-action-button";
import heroImage from "@/assets/hero-oilgas.jpg";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showQuickActions, setShowQuickActions] = useState(false);

  const quickActions = [
    { icon: Upload, label: "Upload Invoice", action: () => setActiveTab("inbox") },
    { icon: AlertTriangle, label: "View Exceptions", action: () => setActiveTab("exceptions") },
    { icon: Settings, label: "Manage Rules", action: () => setActiveTab("validation") },
    { icon: Bell, label: "Notifications", action: () => console.log("Show notifications") }
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      {/* Enhanced Hero Section */}
      <div 
        className="relative h-64 bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: `url(${heroImage})` }}
        role="img"
        aria-label="Oil and gas industrial facility"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="relative h-full flex items-center justify-center px-6">
          <div className="text-center text-black animate-fade-in drop-shadow-lg">
            <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">
              OilField Billing Platform
            </h1>
            <p className="text-xl opacity-90 mb-4 drop-shadow-md">
              Enterprise-grade NOV-compatible billing automation for Canada's oil & gas industry
            </p>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2 glass-effect rounded-full px-3 py-1">
                <CheckCircle className="h-4 w-4" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2 glass-effect rounded-full px-3 py-1">
                <CheckCircle className="h-4 w-4" />
                <span>PIPEDA/PIPA Ready</span>
              </div>
              <div className="flex items-center gap-2 glass-effect rounded-full px-3 py-1">
                <CheckCircle className="h-4 w-4" />
                <span>NOV Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="p-6">
        {/* Enhanced Quick Actions Bar */}
        <div className="mb-6 animate-fade-in">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <Button variant="enterprise" className="gap-2 hover-scale">
                <Upload className="h-4 w-4" />
                Upload Invoices
              </Button>
              <Button variant="outline" className="gap-2 hover-scale">
                <FileText className="h-4 w-4" />
                Generate Report
              </Button>
              <Button variant="outline" className="gap-2 hover-scale">
                <Settings className="h-4 w-4" />
                Configure Rules
              </Button>
            </div>
            <Button variant="ghost" className="gap-2 relative hover-scale">
              <Bell className="h-4 w-4" />
              Notifications
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center animate-bounce-subtle">
                3
              </span>
            </Button>
          </div>
        </div>

        {/* Enhanced Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6 p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="overview" className="hover-scale">Overview</TabsTrigger>
            <TabsTrigger value="inbox" className="hover-scale">Inbox</TabsTrigger>
            <TabsTrigger value="validation" className="hover-scale">Validation</TabsTrigger>
            <TabsTrigger value="exceptions" className="hover-scale relative">
              Exceptions
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive"></span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="hover-scale">Compliance</TabsTrigger>
            <TabsTrigger value="integrations" className="hover-scale">Systems</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-fade-in">
            {/* Key Metrics */}
            <section aria-labelledby="metrics-heading">
              <h2 id="metrics-heading" className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Key Performance Metrics
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
              <h2 id="workflow-heading" className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
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

          <TabsContent value="inbox" className="animate-fade-in">
            <section aria-labelledby="inbox-heading">
              <h2 id="inbox-heading" className="text-2xl font-semibold text-foreground mb-4">
                Invoice Inbox & Upload
              </h2>
              <InvoiceUpload />
            </section>
          </TabsContent>

          <TabsContent value="validation" className="animate-fade-in">
            <section aria-labelledby="validation-heading">
              <h2 id="validation-heading" className="text-2xl font-semibold text-foreground mb-4">
                Validation Rules Management
              </h2>
              <ValidationRules />
            </section>
          </TabsContent>

          <TabsContent value="exceptions" className="animate-fade-in">
            <section aria-labelledby="exceptions-heading">
              <h2 id="exceptions-heading" className="text-2xl font-semibold text-foreground mb-4">
                Exception Queue Management
              </h2>
              <ExceptionQueue />
            </section>
          </TabsContent>

          <TabsContent value="compliance" className="animate-fade-in">
            <section aria-labelledby="compliance-tab-heading">
              <h2 id="compliance-tab-heading" className="text-2xl font-semibold text-foreground mb-4">
                Security & Compliance Dashboard
              </h2>
              <div className="grid grid-cols-1 gap-8">
                <SecurityDashboard />
                <CompliancePanel />
              </div>
            </section>
          </TabsContent>

          <TabsContent value="integrations" className="animate-fade-in">
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

      {/* Floating Action Button with Quick Actions */}
      <FloatingActionButton
        variant="primary"
        ariaLabel="Quick actions menu"
        onClick={() => setShowQuickActions(!showQuickActions)}
      >
        <Plus className={`h-6 w-6 transition-transform duration-300 ${showQuickActions ? 'rotate-45' : ''}`} />
      </FloatingActionButton>

      {/* Quick Actions Menu */}
      {showQuickActions && (
        <div className="fixed bottom-20 right-6 z-40 animate-scale-in">
          <div className="flex flex-col gap-3 p-4 bg-card border border-border rounded-lg shadow-xl backdrop-blur-sm">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => {
                  action.action();
                  setShowQuickActions(false);
                }}
                className="justify-start gap-3 hover-scale"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close quick actions */}
      {showQuickActions && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowQuickActions(false)}
        />
      )}
    </div>
  );
};

export default Index;
