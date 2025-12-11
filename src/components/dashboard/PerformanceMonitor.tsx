import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Activity, Database, Image, Zap, Download, RefreshCw, Play, Square } from "lucide-react";
import { performanceMonitor } from "@/lib/performance-monitor";
import { queryOptimizer } from "@/lib/query-optimizer";
import { assetOptimizer } from "@/lib/asset-optimizer";
import { loadTester, LoadTestScenarios } from "@/lib/load-tester";
import { toast } from "@/hooks/use-toast";

const PerformanceMonitor: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [queryData, setQueryData] = useState<any>(null);
  const [assetData, setAssetData] = useState<any>(null);
  const [loadTestStatus, setLoadTestStatus] = useState<any>(null);
  const [isLoadTesting, setIsLoadTesting] = useState(false);

  // Refresh all performance data
  const refreshData = () => {
    setPerformanceData(performanceMonitor.getPerformanceSummary());
    setQueryData(queryOptimizer.getQueryAnalytics());
    setAssetData(assetOptimizer.getAssetAnalytics());
  };

  // Update load test status
  const updateLoadTestStatus = () => {
    setLoadTestStatus(loadTester.getTestStatus());
  };

  useEffect(() => {
    refreshData();
    updateLoadTestStatus();
    
    // Refresh data every 5 seconds
    const interval = setInterval(() => {
      refreshData();
      updateLoadTestStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Run load test
  const runLoadTest = async (scenario: 'light' | 'medium' | 'heavy') => {
    if (isLoadTesting) return;

    setIsLoadTesting(true);
    try {
      const config = LoadTestScenarios[scenario]();
      await loadTester.runLoadTest(config);
    } catch (error) {
      toast({
        title: "Load Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoadTesting(false);
    }
  };

  // Export performance data
  const exportData = () => {
    const data = {
      performance: performanceMonitor.exportPerformanceData(),
      queries: queryOptimizer.exportQueryData(),
      assets: assetOptimizer.exportAssetData(),
      loadTest: loadTester.getDetailedResults()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Performance Report Exported",
      description: "Performance data has been downloaded"
    });
  };

  // Get status color based on performance
  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return "status-approved";
    if (value <= thresholds.warning) return "status-processing";
    return "status-rejected";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Performance Monitor</h2>
          <p className="text-muted-foreground">Real-time performance tracking and optimization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="load-test">Load Testing</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.metrics?.[0]?.pageLoadTime?.toFixed(0) || 0}ms
                </div>
                <Badge className={getStatusColor(performanceData?.metrics?.[0]?.pageLoadTime || 0, { good: 2000, warning: 4000 })}>
                  {(performanceData?.metrics?.[0]?.pageLoadTime || 0) < 2000 ? 'Good' : 
                   (performanceData?.metrics?.[0]?.pageLoadTime || 0) < 4000 ? 'Fair' : 'Poor'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Query Cache Hit Rate</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{queryData?.cacheHitRate || '0%'}</div>
                <p className="text-xs text-muted-foreground">
                  {queryData?.totalQueries || 0} total queries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Asset Cache Rate</CardTitle>
                <Image className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assetData?.cacheHitRate || '0%'}</div>
                <p className="text-xs text-muted-foreground">
                  {assetData?.totalSize || '0MB'} total size
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-status-approved">Healthy</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Web Vitals</CardTitle>
                <CardDescription>Core Web Vitals performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Largest Contentful Paint</span>
                      <span>{performanceData?.metrics?.[0]?.largestContentfulPaint?.toFixed(0) || 0}ms</span>
                    </div>
                    <Progress value={Math.min((performanceData?.metrics?.[0]?.largestContentfulPaint || 0) / 2500 * 100, 100)} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>First Input Delay</span>
                      <span>{performanceData?.metrics?.[0]?.firstInputDelay?.toFixed(0) || 0}ms</span>
                    </div>
                    <Progress value={Math.min((performanceData?.metrics?.[0]?.firstInputDelay || 0) / 100 * 100, 100)} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Cumulative Layout Shift</span>
                      <span>{performanceData?.metrics?.[0]?.cumulativeLayoutShift?.toFixed(3) || 0}</span>
                    </div>
                    <Progress value={Math.min((performanceData?.metrics?.[0]?.cumulativeLayoutShift || 0) / 0.1 * 100, 100)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Slow Components</CardTitle>
                <CardDescription>Components taking longer than 16ms to render</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceData?.slowComponents?.length > 0 ? (
                  <div className="space-y-2">
                    {performanceData.slowComponents.slice(0, 5).map((component: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <span className="font-medium">{component.name}</span>
                        <Badge variant="outline">{component.renderTime.toFixed(2)}ms</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No slow components detected</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Query Performance</CardTitle>
                <CardDescription>Database query optimization metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{queryData?.totalQueries || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Queries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{queryData?.cacheHitRate || '0%'}</div>
                    <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{queryData?.avgDuration || '0ms'}</div>
                    <div className="text-sm text-muted-foreground">Avg Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{queryData?.cacheSize || 0}</div>
                    <div className="text-sm text-muted-foreground">Cache Size</div>
                  </div>
                </div>
                <Button variant="outline" onClick={() => queryOptimizer.clearCache()}>
                  Clear Cache
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Slow Queries</CardTitle>
                <CardDescription>Queries taking longer than 1 second</CardDescription>
              </CardHeader>
              <CardContent>
                {queryData?.slowQueries?.length > 0 ? (
                  <div className="space-y-2">
                    {queryData.slowQueries.slice(0, 5).map((query: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <span className="font-medium text-sm">{query.query}</span>
                        <Badge variant="outline">{query.duration.toFixed(2)}ms</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No slow queries detected</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Performance</CardTitle>
                <CardDescription>Asset loading and optimization metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{assetData?.totalAssets || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Assets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{assetData?.cacheHitRate || '0%'}</div>
                    <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{assetData?.totalSize || '0MB'}</div>
                    <div className="text-sm text-muted-foreground">Total Size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{assetData?.avgLoadTime || '0ms'}</div>
                    <div className="text-sm text-muted-foreground">Avg Load Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Large Assets</CardTitle>
                <CardDescription>Assets larger than 500KB</CardDescription>
              </CardHeader>
              <CardContent>
                {assetData?.largeAssets?.length > 0 ? (
                  <div className="space-y-2">
                    {assetData.largeAssets.slice(0, 5).map((asset: any, index: number) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <span className="font-medium text-sm truncate">{asset.url}</span>
                        <Badge variant="outline">{(asset.size / 1024 / 1024).toFixed(2)}MB</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No large assets detected</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Load Testing Tab */}
        <TabsContent value="load-test">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Load Testing</CardTitle>
                <CardDescription>Simulate load and test system performance under stress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Button
                    variant="outline"
                    onClick={() => runLoadTest('light')}
                    disabled={isLoadTesting}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Light Load (5 users)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => runLoadTest('medium')}
                    disabled={isLoadTesting}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Medium Load (20 users)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => runLoadTest('heavy')}
                    disabled={isLoadTesting}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Heavy Load (50 users)
                  </Button>
                </div>

                {loadTestStatus?.running && (
                  <Card className="mb-4">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-lg font-semibold">Load Test Running</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadTester.stopTest()}
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Stop Test
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{loadTestStatus.activeUsers}</div>
                          <div className="text-sm text-muted-foreground">Active Users</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{loadTestStatus.totalRequests}</div>
                          <div className="text-sm text-muted-foreground">Requests</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{loadTestStatus.duration}s</div>
                          <div className="text-sm text-muted-foreground">Duration</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitor;