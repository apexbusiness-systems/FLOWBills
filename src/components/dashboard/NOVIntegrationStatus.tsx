import {
  Database,
  FileText,
  Network,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIntegrations } from "@/hooks/useIntegrations";
import { useNavigate } from "react-router-dom";

const NOVIntegrationStatus = () => {
  const { integrations, getIntegrationStats } = useIntegrations();
  const navigate = useNavigate();
  const stats = getIntegrationStats();

  const getIntegrationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "portal access":
        return Network;
      case "erp integration":
        return Database;
      case "electronic data interchange":
        return FileText;
      default:
        return Database;
    }
  };

  const formatLastSync = (lastSyncAt?: string) => {
    if (!lastSyncAt) return "Never";

    const now = new Date();
    const syncTime = new Date(lastSyncAt);
    const diffMinutes = Math.floor((now.getTime() - syncTime.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return `${Math.floor(diffMinutes / 1440)} days ago`;
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-status-approved" />;
      case "processing":
        return <Clock className="h-4 w-4 text-status-processing" />;
      case "attention":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="status-approved">Online</Badge>;
      case "processing":
        return <Badge className="status-processing">Processing</Badge>;
      case "attention":
        return <Badge className="status-rejected">Attention</Badge>;
      default:
        return <Badge variant="secondary">Offline</Badge>;
    }
  };

  // Show sample data if no integrations exist
  const displayIntegrations =
    integrations.length > 0
      ? integrations.slice(0, 4)
      : [
          {
            id: "sample-nov",
            integration_name: "NOV AccessNOV",
            integration_type: "Portal Access",
            status: "disconnected" as const,
            last_sync_at: undefined,
            config: { description: "MYNOV portal integration" },
          },
          {
            id: "sample-oracle",
            integration_name: "Oracle E-Business Suite",
            integration_type: "ERP Integration",
            status: "disconnected" as const,
            last_sync_at: undefined,
            config: { description: "JIB CSV import/export" },
          },
        ];

  return (
    <div className="card-enterprise">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground">NOV & System Integrations</h3>
          <Badge className="status-approved">
            {stats.connected}/{stats.total} Active
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          National Oilwell Varco and enterprise system connectivity
        </p>
      </div>

      <div className="space-y-3">
        {displayIntegrations.map((integration) => {
          const Icon = getIntegrationIcon(integration.integration_type);
          return (
            <div
              key={integration.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {integration.integration_name}
                    </h4>
                    {getStatusIcon(integration.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {integration.integration_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {integration.config?.description || "Integration description"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1">Last sync</div>
                  <div className="text-xs font-medium text-foreground">
                    {formatLastSync(integration.last_sync_at)}
                  </div>
                </div>
                {getStatusBadge(integration.status)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            NOV certification status:
            <span className="font-medium text-status-approved ml-1">Active</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => navigate("/integrations")}
          >
            Manage Integrations
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NOVIntegrationStatus;
