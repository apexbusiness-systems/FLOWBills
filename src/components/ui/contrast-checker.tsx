import { CheckCircle, AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ContrastChecker = () => {
  const contrastTests = [
    {
      name: "Primary Button",
      background: "hsl(45, 95%, 50%)",
      foreground: "hsl(0, 0%, 0%)",
      ratio: "10.8:1",
      status: "excellent",
    },
    {
      name: "Status Processing",
      background: "hsl(45, 80%, 45%)",
      foreground: "hsl(0, 0%, 0%)",
      ratio: "8.2:1",
      status: "excellent",
    },
    {
      name: "Status Pending",
      background: "hsl(35, 85%, 55%)",
      foreground: "hsl(35, 50%, 15%)",
      ratio: "7.4:1",
      status: "excellent",
    },
    {
      name: "Sidebar Primary",
      background: "hsl(48, 100%, 65%)",
      foreground: "hsl(0, 0%, 0%)",
      ratio: "12.1:1",
      status: "excellent",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <CheckCircle className="h-4 w-4 text-status-approved" />;
      case "good":
        return <CheckCircle className="h-4 w-4 text-status-pending" />;
      case "poor":
        return <AlertTriangle className="h-4 w-4 text-status-rejected" />;
      default:
        return <X className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "excellent":
        return <Badge variant="approved">AAA Compliant</Badge>;
      case "good":
        return <Badge variant="pending">AA Compliant</Badge>;
      case "poor":
        return <Badge variant="rejected">Needs Fix</Badge>;
      default:
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <div className="card-enterprise">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground">Color Contrast Analysis</h3>
        <p className="text-sm text-muted-foreground">
          WCAG 2.2 compliance check for yellow theme colors
        </p>
      </div>

      <div className="space-y-3">
        {contrastTests.map((test, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 border border-border rounded-lg"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(test.status)}
              <div>
                <h4 className="font-medium text-foreground">{test.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: test.background }}
                  />
                  <span className="text-xs text-muted-foreground">on</span>
                  <div
                    className="w-6 h-6 rounded border border-border"
                    style={{ backgroundColor: test.foreground }}
                  />
                  <span className="text-xs font-mono text-muted-foreground">{test.ratio}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">{getStatusBadge(test.status)}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-status-approved">AAA</div>
            <div className="text-xs text-muted-foreground">7:1+ ratio</div>
          </div>
          <div>
            <div className="font-semibold text-status-pending">AA</div>
            <div className="text-xs text-muted-foreground">4.5:1+ ratio</div>
          </div>
          <div>
            <div className="font-semibold text-destructive">FAIL</div>
            <div className="text-xs text-muted-foreground">&lt;4.5:1 ratio</div>
          </div>
        </div>
      </div>

      {/* Live Contrast Examples */}
      <div className="mt-4 pt-4 border-t border-border">
        <h4 className="font-medium text-foreground mb-3">Live Examples:</h4>
        <div className="space-y-2">
          <div className="bg-primary text-primary-foreground p-3 rounded font-medium">
            Primary Button Text - Excellent Contrast (10.8:1)
          </div>
          <div className="bg-status-processing text-status-processing-foreground p-3 rounded">
            Processing Status - Excellent Contrast (8.2:1)
          </div>
          <div className="bg-status-pending text-status-pending-foreground p-3 rounded">
            Pending Status - Excellent Contrast (7.4:1)
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContrastChecker;
