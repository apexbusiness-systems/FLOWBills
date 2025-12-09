import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { performanceProfiler } from "@/lib/performance-profiler";
import { Activity, AlertTriangle, TrendingUp, Download, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const PerformanceDashboard = () => {
  const [report, setReport] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadReport = () => {
    const newReport = performanceProfiler.getReport();
    setReport(newReport);
  };

  useEffect(() => {
    loadReport();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadReport, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === "critical" || severity === "high") {
      return <AlertTriangle className="h-4 w-4" />;
    }
    return <Activity className="h-4 w-4" />;
  };

  const exportData = () => {
    const data = performanceProfiler.exportMetrics();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!report) {
    return <div className="p-4">Loading performance data...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time performance profiling and bottleneck analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto" : "Manual"}
          </Button>
          <Button variant="outline" size="sm" onClick={loadReport}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              performanceProfiler.clear();
              loadReport();
            }}
          >
            Clear Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.totalMetrics}</div>
            <p className="text-xs text-muted-foreground">Performance measurements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Components Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.totalComponents}</div>
            <p className="text-xs text-muted-foreground">Unique components</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {report.summary.criticalBottlenecks}
            </div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {report.summary.highBottlenecks}
            </div>
            <p className="text-xs text-muted-foreground">Performance concerns</p>
          </CardContent>
        </Card>
      </div>

      {/* Bottlenecks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Performance Bottlenecks
          </CardTitle>
          <CardDescription>
            Identified performance issues with optimization suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.bottlenecks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium text-green-600">No bottlenecks detected!</p>
              <p className="text-sm">Your application is performing well.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {report.bottlenecks.map((bottleneck: any, index: number) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(bottleneck.severity)}
                      <div>
                        <h4 className="font-semibold">{bottleneck.component}</h4>
                        <p className="text-sm text-muted-foreground">
                          Estimated complexity: {bottleneck.complexity}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getSeverityColor(bottleneck.severity)}>
                      {bottleneck.severity}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Avg Render Time</p>
                      <p className="font-semibold">{bottleneck.renderTime.toFixed(2)}ms</p>
                      <Progress
                        value={Math.min((bottleneck.renderTime / 50) * 100, 100)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <p className="text-muted-foreground">Re-render Count</p>
                      <p className="font-semibold">{bottleneck.reRenderCount}</p>
                      <Progress
                        value={Math.min((bottleneck.reRenderCount / 50) * 100, 100)}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded p-3">
                    <p className="text-xs font-semibold mb-2">Optimization Suggestions:</p>
                    <ul className="text-xs space-y-1">
                      {bottleneck.suggestions.map((suggestion: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary">→</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Slow Components */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Slowest Components
          </CardTitle>
          <CardDescription>Components with highest average render times</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.topSlowComponents.slice(0, 10).map((comp: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{comp.component}</p>
                  <p className="text-xs text-muted-foreground">{comp.renderCount} renders</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{comp.avgTime.toFixed(2)}ms</p>
                  <p className="text-xs text-muted-foreground">Max: {comp.maxTime.toFixed(2)}ms</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
