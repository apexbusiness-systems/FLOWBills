import { Shield, Eye, Lock, FileCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const complianceItems = [
  {
    id: "soc2",
    title: "SOC 2 Type II",
    status: "compliant",
    score: 98,
    lastAudit: "March 2024",
    icon: Shield
  },
  {
    id: "pipeda",
    title: "PIPEDA/Alberta PIPA",
    status: "compliant", 
    score: 95,
    lastAudit: "February 2024",
    icon: Eye
  },
  {
    id: "pci",
    title: "PCI DSS 4.0.1",
    status: "review",
    score: 87,
    lastAudit: "January 2024",
    icon: Lock
  },
  {
    id: "iso27001",
    title: "ISO/IEC 27001 ISMS",
    status: "compliant",
    score: 92,
    lastAudit: "March 2024", 
    icon: FileCheck
  }
];

const CompliancePanel = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant":
        return <Badge className="status-approved">Compliant</Badge>;
      case "review":
        return <Badge className="status-pending">Under Review</Badge>;
      case "action_required":
        return <Badge className="status-rejected">Action Required</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const overallScore = Math.round(
    complianceItems.reduce((sum, item) => sum + item.score, 0) / complianceItems.length
  );

  return (
    <div className="card-enterprise">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground">
            Compliance & Security
          </h3>
          <Badge className="status-approved">
            {overallScore}% Overall
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Enterprise security and regulatory compliance status
        </p>
        <Progress value={overallScore} className="mt-2" />
      </div>

      <div className="space-y-3">
        {complianceItems.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">
                    {item.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Last audit: {item.lastAudit}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {item.score}%
                  </div>
                  <Progress value={item.score} className="w-16 h-1 mt-1" />
                </div>
                {getStatusBadge(item.status)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-status-pending" />
          <span className="text-muted-foreground">
            Next security review scheduled for 
            <span className="font-medium text-foreground ml-1">June 2024</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CompliancePanel;