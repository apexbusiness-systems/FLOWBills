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
  Zap,
  Workflow,
  Search
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatusCard from "@/components/dashboard/StatusCard";
import WorkflowPipeline from "@/components/dashboard/WorkflowPipeline";
import RecentActivity from "@/components/dashboard/RecentActivity";
import CompliancePanel from "@/components/dashboard/CompliancePanel";
import NOVIntegrationStatus from "@/components/dashboard/NOVIntegrationStatus";
import ValidationRules from "@/components/dashboard/ValidationRules";
import ExceptionQueue from "@/components/dashboard/ExceptionQueue";
import SystemHealthCheck from "@/components/dashboard/SystemHealthCheck";
import SecurityDashboard from "@/components/dashboard/SecurityDashboard";
import QuickUpload from "@/components/dashboard/QuickUpload";
import FloatingActionButton from "@/components/ui/floating-action-button";
import OilGasAssistant from "@/components/ai/OilGasAssistant";
import SmartSuggestions from "@/components/ai/SmartSuggestions";
import { ProductSnapshot } from "@/components/marketing/ProductSnapshot";
import heroImage from "@/assets/hero-oilgas.jpg";

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showQuickActions, setShowQuickActions] = useState(false);
  const navigate = useNavigate();

  const quickActions = [
    { icon: Upload, label: "Upload Invoice", action: () => navigate('/invoices') },
    { icon: AlertTriangle, label: "View Exceptions", action: () => setActiveTab("exceptions") },
    { icon: Zap, label: "Create Workflow", action: () => navigate('/workflows') },
    { icon: Search, label: "Global Search", action: () => navigate('/search') },
    { icon: Settings, label: "Manage Rules", action: () => setActiveTab("validation") },
    { icon: Bell, label: "Notifications", action: () => console.log("Show notifications") }
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      {/* Streamlined Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Good morning! Here's your dashboard
              </h1>
              <p className="text-muted-foreground">
                Monitor your billing operations and key metrics
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="default" 
                className="gap-2"
                onClick={() => navigate('/invoices')}
              >
                <Upload className="h-4 w-4" />
                Upload Invoice
              </Button>
              <Button variant="outline" className="gap-2 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive"></span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="p-6 pb-32">
        {/* Key Metrics - Gmail-style cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatusCard
            title="Monthly Volume"
            value="$2.4M"
            change="+12.5%"
            changeType="increase"
            icon={DollarSign}
            description="Total processed"
          />
          <StatusCard
            title="Active Invoices"
            value="847"
            change="+23 today"
            changeType="increase"
            icon={FileText}
            status="processing"
            description="In pipeline"
          />
          <StatusCard
            title="Success Rate"
            value="94.2%"
            change="+2.1%"
            changeType="increase"
            icon={TrendingUp}
            status="approved"
            description="Auto-processed"
          />
          <StatusCard
            title="Exceptions" 
            value="12"
            change="3 urgent"
            changeType="decrease"
            icon={AlertTriangle}
            status="pending"
            description="Need review"
          />
        </div>

        {/* Quick Actions - Slack-style */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
          <Button variant="ghost" className="h-20 flex-col gap-2" onClick={() => navigate('/invoices')}>
            <Upload className="h-6 w-6" />
            <span className="text-sm">Upload</span>
          </Button>
          <Button variant="ghost" className="h-20 flex-col gap-2" onClick={() => setActiveTab("exceptions")}>
            <AlertTriangle className="h-6 w-6" />
            <span className="text-sm">Exceptions</span>
          </Button>
          <Button variant="ghost" className="h-20 flex-col gap-2" onClick={() => navigate('/workflows')}>
            <Zap className="h-6 w-6" />
            <span className="text-sm">Workflows</span>
          </Button>
          <Button variant="ghost" className="h-20 flex-col gap-2" onClick={() => navigate('/search')}>
            <Search className="h-6 w-6" />
            <span className="text-sm">Search</span>
          </Button>
          <Button variant="ghost" className="h-20 flex-col gap-2" onClick={() => setActiveTab("validation")}>
            <Settings className="h-6 w-6" />
            <span className="text-sm">Rules</span>
          </Button>
          <Button variant="ghost" className="h-20 flex-col gap-2">
            <FileText className="h-6 w-6" />
            <span className="text-sm">Reports</span>
          </Button>
        </div>

        {/* Simplified Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Dashboard</TabsTrigger>
            <TabsTrigger value="exceptions" className="relative">
              Exceptions
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive"></span>
            </TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Workflow Pipeline */}
            <WorkflowPipeline />

            {/* Activity and Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity />
              <CompliancePanel />
            </div>
          </TabsContent>

          <TabsContent value="inbox" className="animate-fade-in">
            <section aria-labelledby="inbox-heading">
              <h2 id="inbox-heading" className="text-2xl font-semibold text-foreground mb-4">
                Invoice Management & Upload
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <p className="text-muted-foreground mb-4">
                    Access the full invoice management system to create, edit, and manage invoices with document attachments.
                  </p>
                  <Button 
                    onClick={() => navigate('/invoices')}
                    className="w-full sm:w-auto"
                  >
                    Open Invoice Management
                  </Button>
                </div>
                <div>
                  <QuickUpload />
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="workflows" className="animate-fade-in">
            <section aria-labelledby="workflows-heading">
              <h2 id="workflows-heading" className="text-2xl font-semibold text-foreground mb-4">
                Workflow Automation
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <p className="text-muted-foreground mb-4">
                    Create and manage automated workflows for invoice processing, compliance checks, and system integrations.
                  </p>
                  <Button 
                    onClick={() => navigate('/workflows')}
                    className="w-full sm:w-auto gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Open Workflow Manager
                  </Button>
                </div>
                <div className="card-enterprise p-4">
                  <h3 className="font-semibold mb-2">Quick Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Active Workflows:</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Running Instances:</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Automation Rate:</span>
                      <span className="font-medium text-status-approved">85%</span>
                    </div>
                  </div>
                </div>
              </div>
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

          <TabsContent value="validation" className="animate-fade-in">
            <section aria-labelledby="validation-heading">
              <h2 id="validation-heading" className="text-2xl font-semibold text-foreground mb-4">
                Validation Rules Management
              </h2>
              <ValidationRules />
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

      {/* Smart Suggestions Panel */}
      <SmartSuggestions
        onApplySuggestion={(suggestion) => {
          console.log('Applying suggestion:', suggestion);
          // Auto-navigate to relevant section based on suggestion
          if (suggestion.category === 'compliance') {
            setActiveTab('compliance');
          } else if (suggestion.category === 'workflow') {
            setActiveTab('validation');
          }
        }}
        onDismiss={(id) => console.log('Dismissed suggestion:', id)}
      />

      {/* AI Assistant */}
      <OilGasAssistant 
        onTaskSuggestion={(task) => console.log('Task suggestion:', task)}
        onNavigate={(section) => setActiveTab(section)}
      />

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
