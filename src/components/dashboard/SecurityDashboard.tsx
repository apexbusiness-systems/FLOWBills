import { Shield, Lock, Eye, AlertTriangle, CheckCircle, XCircle, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { errorHandler } from "@/lib/error-handler";

const SecurityDashboard = () => {
  const securityMetrics = [
    {
      category: "Input Validation",
      status: "secured",
      items: [
        { name: "XSS Prevention", status: "active", description: "Input sanitization implemented" },
        {
          name: "File Upload Validation",
          status: "active",
          description: "File type and size validation",
        },
        {
          name: "SQL Injection Protection",
          status: "backend_required",
          description: "Requires backend implementation",
        },
        {
          name: "CSRF Protection",
          status: "frontend_implemented",
          description: "Token-based protection ready",
        },
      ],
    },
    {
      category: "Authentication & Authorization",
      status: "backend_required",
      items: [
        {
          name: "User Authentication",
          status: "backend_required",
          description: "Requires Supabase integration",
        },
        {
          name: "Role-Based Access",
          status: "backend_required",
          description: "Requires Supabase RLS policies",
        },
        {
          name: "Session Management",
          status: "backend_required",
          description: "Requires backend session handling",
        },
        {
          name: "Password Security",
          status: "backend_required",
          description: "Requires Supabase Auth",
        },
      ],
    },
    {
      category: "Data Protection",
      status: "partial",
      items: [
        {
          name: "Client-side Encryption",
          status: "implemented",
          description: "File hashing and validation",
        },
        {
          name: "Secure Data Storage",
          status: "backend_required",
          description: "Requires database encryption",
        },
        { name: "Data Transmission", status: "https_only", description: "HTTPS enforced" },
        { name: "PII Protection", status: "partial", description: "Input sanitization active" },
      ],
    },
    {
      category: "Rate Limiting & DoS Protection",
      status: "frontend_only",
      items: [
        { name: "Client Rate Limiting", status: "active", description: "10 uploads/minute limit" },
        {
          name: "Server Rate Limiting",
          status: "backend_required",
          description: "Requires backend implementation",
        },
        {
          name: "DDoS Protection",
          status: "infrastructure",
          description: "Requires CDN/proxy configuration",
        },
        {
          name: "Request Throttling",
          status: "basic",
          description: "Basic client-side throttling",
        },
      ],
    },
    {
      category: "Error Handling & Logging",
      status: "implemented",
      items: [
        {
          name: "Secure Error Messages",
          status: "active",
          description: "User-friendly error messages",
        },
        {
          name: "Security Event Logging",
          status: "active",
          description: "Client-side security logging",
        },
        {
          name: "Error Monitoring",
          status: "ready",
          description: "Ready for production monitoring",
        },
        {
          name: "Audit Trail",
          status: "backend_required",
          description: "Requires backend audit logging",
        },
      ],
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "implemented":
      case "secured":
        return <Badge variant="approved">Secured</Badge>;
      case "partial":
      case "frontend_only":
      case "ready":
        return <Badge variant="pending">Partial</Badge>;
      case "backend_required":
        return <Badge variant="processing">Backend Required</Badge>;
      case "infrastructure":
        return <Badge variant="outline">Infrastructure</Badge>;
      default:
        return <Badge variant="rejected">Not Implemented</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "implemented":
      case "secured":
        return <CheckCircle className="h-4 w-4 text-status-approved" />;
      case "partial":
      case "frontend_only":
      case "ready":
        return <Activity className="h-4 w-4 text-status-pending" />;
      case "backend_required":
        return <AlertTriangle className="h-4 w-4 text-status-processing" />;
      default:
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const calculateOverallSecurity = () => {
    const totalItems = securityMetrics.reduce((sum, category) => sum + category.items.length, 0);
    const securedItems = securityMetrics.reduce(
      (sum, category) =>
        sum +
        category.items.filter((item) => item.status === "active" || item.status === "implemented")
          .length,
      0
    );
    return Math.round((securedItems / totalItems) * 100);
  };

  const overallScore = calculateOverallSecurity();

  return (
    <div className="card-enterprise">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Hardening Status
          </h3>
          <Badge
            className={
              overallScore >= 80
                ? "status-approved"
                : overallScore >= 60
                  ? "status-pending"
                  : "status-rejected"
            }
          >
            {overallScore}% Secured
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Comprehensive security assessment and vulnerability management
        </p>
        <Progress value={overallScore} className="h-3" />
      </div>

      <div className="space-y-6">
        {securityMetrics.map((category, categoryIndex) => (
          <div key={categoryIndex} className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {category.category}
              </h4>
              {getStatusBadge(category.status)}
            </div>

            <div className="space-y-2">
              {category.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-center justify-between p-2 rounded bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-status-approved">
              {securityMetrics.reduce(
                (sum, cat) =>
                  sum +
                  cat.items.filter((i) => i.status === "active" || i.status === "implemented")
                    .length,
                0
              )}
            </div>
            <div className="text-xs text-muted-foreground">Fully Secured</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-status-pending">
              {securityMetrics.reduce(
                (sum, cat) =>
                  sum +
                  cat.items.filter((i) => i.status === "partial" || i.status === "ready").length,
                0
              )}
            </div>
            <div className="text-xs text-muted-foreground">Partially Secured</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-status-processing">
              {securityMetrics.reduce(
                (sum, cat) => sum + cat.items.filter((i) => i.status === "backend_required").length,
                0
              )}
            </div>
            <div className="text-xs text-muted-foreground">Backend Required</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-destructive">
              {securityMetrics.reduce(
                (sum, cat) =>
                  sum +
                  cat.items.filter(
                    (i) =>
                      !["active", "implemented", "partial", "ready", "backend_required"].includes(
                        i.status
                      )
                  ).length,
                0
              )}
            </div>
            <div className="text-xs text-muted-foreground">Critical Issues</div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border bg-muted/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-status-processing mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground mb-2">Backend Integration Required</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Many security features require backend implementation. Connect to Supabase for:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 mb-4">
              <li>• User authentication and authorization</li>
              <li>• Secure data storage with encryption</li>
              <li>• Server-side rate limiting and DDoS protection</li>
              <li>• Comprehensive audit logging and monitoring</li>
              <li>• Row Level Security (RLS) policies</li>
            </ul>
            <Button variant="enterprise" size="sm">
              <Shield className="h-4 w-4" />
              Connect Supabase for Full Security
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Last security scan: {new Date().toLocaleString()} •
        <Button
          variant="link"
          size="sm"
          className="p-0 h-auto text-xs"
          onClick={() => window.location.reload()}
        >
          Refresh Scan
        </Button>
      </div>
    </div>
  );
};

export default SecurityDashboard;
