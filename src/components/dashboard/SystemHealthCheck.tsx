import { useState, useEffect } from "react";
import { 
  Server, 
  Database, 
  Wifi, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SystemStatus {
  id: string;
  name: string;
  status: "healthy" | "warning" | "error" | "checking";
  responseTime: number;
  uptime: number;
  lastCheck: string;
  icon: any;
  description: string;
}

const SystemHealthCheck = () => {
  const [systems, setSystems] = useState<SystemStatus[]>([
    {
      id: "api",
      name: "API Server",
      status: "healthy",
      responseTime: 45,
      uptime: 99.8,
      lastCheck: new Date().toISOString(),
      icon: Server,
      description: "Core API endpoints and processing"
    },
    {
      id: "database",
      name: "PostgreSQL Database",
      status: "healthy", 
      responseTime: 12,
      uptime: 99.9,
      lastCheck: new Date().toISOString(),
      icon: Database,
      description: "Primary database cluster"
    },
    {
      id: "redis",
      name: "Job Queue",
      status: "warning",
      responseTime: 89,
      uptime: 98.5,
      lastCheck: new Date().toISOString(),
      icon: Activity,
      description: "Background job processing queue"
    },
    {
      id: "edi",
      name: "EDI Processing",
      status: "healthy",
      responseTime: 156,
      uptime: 99.2,
      lastCheck: new Date().toISOString(),
      icon: Wifi,
      description: "X12 810/820 EDI translation services"
    },
    {
      id: "security",
      name: "Security Scanner",
      status: "healthy",
      responseTime: 234,
      uptime: 99.7,
      lastCheck: new Date().toISOString(),
      icon: Shield,
      description: "Vulnerability scanning and compliance monitoring"
    }
  ]);

  const [isChecking, setIsChecking] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-status-approved" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-status-pending" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "checking":
        return <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge variant="approved">Healthy</Badge>;
      case "warning":
        return <Badge variant="pending">Warning</Badge>;
      case "error":
        return <Badge variant="rejected">Error</Badge>;
      case "checking":
        return <Badge variant="processing">Checking</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const runHealthCheck = async () => {
    setIsChecking(true);
    
    // Simulate health check process
    for (let i = 0; i < systems.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setSystems(prev => prev.map((system, index) => 
        index === i 
          ? { 
              ...system, 
              status: "checking",
              lastCheck: new Date().toISOString()
            }
          : system
      ));
    }

    // Simulate final results
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setSystems(prev => prev.map(system => ({
      ...system,
      status: Math.random() > 0.8 ? "warning" : "healthy",
      responseTime: Math.floor(Math.random() * 200) + 10,
      uptime: 98 + Math.random() * 2,
      lastCheck: new Date().toISOString()
    })));

    setIsChecking(false);
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(1)}%`;
  };

  const formatLastCheck = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-CA');
  };

  const overallHealth = systems.filter(s => s.status === "healthy").length / systems.length * 100;
  const warningCount = systems.filter(s => s.status === "warning").length;
  const errorCount = systems.filter(s => s.status === "error").length;

  return (
    <div className="card-enterprise">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Monitor
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="approved">{Math.round(overallHealth)}% Healthy</Badge>
            {warningCount > 0 && <Badge variant="pending">{warningCount} Warnings</Badge>}
            {errorCount > 0 && <Badge variant="rejected">{errorCount} Errors</Badge>}
            <Button 
              size="sm" 
              variant="outline"
              onClick={runHealthCheck}
              disabled={isChecking}
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              Check All
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time monitoring of critical system components
        </p>
        <Progress value={overallHealth} className="mt-2" />
      </div>

      <div className="space-y-3">
        {systems.map((system) => {
          const Icon = system.icon;
          return (
            <div 
              key={system.id}
              className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground">
                      {system.name}
                    </h4>
                    {getStatusIcon(system.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {system.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Response: {system.responseTime}ms</span>
                    <span>Uptime: {formatUptime(system.uptime)}</span>
                    <span>Last check: {formatLastCheck(system.lastCheck)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <Progress 
                    value={system.uptime} 
                    className="w-16 h-2 mb-1"
                  />
                  <div className="text-xs font-medium text-foreground">
                    {formatUptime(system.uptime)}
                  </div>
                </div>
                {getStatusBadge(system.status)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-status-approved">
              {systems.filter(s => s.status === "healthy").length}
            </div>
            <div className="text-xs text-muted-foreground">Healthy</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-status-pending">
              {warningCount}
            </div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-destructive">
              {errorCount}
            </div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthCheck;