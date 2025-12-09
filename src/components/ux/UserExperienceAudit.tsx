import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Smartphone,
  Monitor,
  Shield,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { mobileAuditor, MobileAuditResult } from "@/lib/mobile-audit";
import { accessibilityChecker, AccessibilityAuditResult } from "@/lib/accessibility-checker";

const UserExperienceAudit: React.FC = () => {
  const [mobileResults, setMobileResults] = useState<MobileAuditResult | null>(null);
  const [accessibilityResults, setAccessibilityResults] = useState<AccessibilityAuditResult | null>(
    null
  );
  const [isRunning, setIsRunning] = useState(false);

  const runCompleteAudit = async () => {
    setIsRunning(true);
    try {
      const [mobile, accessibility] = await Promise.all([
        mobileAuditor.runAudit(),
        accessibilityChecker.runCompleteAudit(),
      ]);
      setMobileResults(mobile);
      setAccessibilityResults(accessibility);
    } catch (error) {
      console.error("Audit failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runCompleteAudit();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">User Experience Audit</h1>
        <p className="text-lg text-muted-foreground">
          Comprehensive audit of mobile responsiveness, accessibility compliance, and user
          experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Mobile Responsiveness</span>
            </CardTitle>
            <CardDescription>Mobile compatibility and responsive design audit</CardDescription>
          </CardHeader>
          <CardContent>
            {mobileResults ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">Score:</span>
                  <span className={`text-3xl font-bold ${getScoreColor(mobileResults.score)}`}>
                    {mobileResults.score}/100
                  </span>
                </div>
                <Progress value={mobileResults.score} className="h-3" />
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div
                      className={`font-semibold ${mobileResults.deviceCompatibility.mobile ? "text-green-600" : "text-red-600"}`}
                    >
                      Mobile
                    </div>
                    <CheckCircle
                      className={`h-4 w-4 mx-auto ${mobileResults.deviceCompatibility.mobile ? "text-green-600" : "text-red-600"}`}
                    />
                  </div>
                  <div className="text-center">
                    <div
                      className={`font-semibold ${mobileResults.deviceCompatibility.tablet ? "text-green-600" : "text-red-600"}`}
                    >
                      Tablet
                    </div>
                    <CheckCircle
                      className={`h-4 w-4 mx-auto ${mobileResults.deviceCompatibility.tablet ? "text-green-600" : "text-red-600"}`}
                    />
                  </div>
                  <div className="text-center">
                    <div
                      className={`font-semibold ${mobileResults.deviceCompatibility.desktop ? "text-green-600" : "text-red-600"}`}
                    >
                      Desktop
                    </div>
                    <CheckCircle
                      className={`h-4 w-4 mx-auto ${mobileResults.deviceCompatibility.desktop ? "text-green-600" : "text-red-600"}`}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Running mobile audit...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Accessibility Compliance</span>
            </CardTitle>
            <CardDescription>WCAG 2.1 AA compliance audit</CardDescription>
          </CardHeader>
          <CardContent>
            {accessibilityResults ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">Score:</span>
                  <span
                    className={`text-3xl font-bold ${getScoreColor(accessibilityResults.score)}`}
                  >
                    {accessibilityResults.score}/100
                  </span>
                </div>
                <Progress value={accessibilityResults.score} className="h-3" />
                <div className="flex items-center justify-between">
                  <span>WCAG Level:</span>
                  <Badge
                    variant={
                      accessibilityResults.wcagLevel === "AA" ||
                      accessibilityResults.wcagLevel === "AAA"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {accessibilityResults.wcagLevel}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-green-600">{accessibilityResults.passes} Passes</span>
                  </div>
                  <div>
                    <span className="text-red-600">
                      {accessibilityResults.violations.length} Issues
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Running accessibility audit...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="mobile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="mobile">Mobile Issues</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="mobile" className="mt-6">
          {mobileResults && (
            <div className="space-y-4">
              {mobileResults.issues.map((issue, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {issue.type === "critical" ? (
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      ) : issue.type === "warning" ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      ) : (
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{issue.description}</h4>
                          <Badge
                            variant="outline"
                            className={
                              issue.type === "critical"
                                ? "border-red-200 text-red-800"
                                : issue.type === "warning"
                                  ? "border-yellow-200 text-yellow-800"
                                  : "border-blue-200 text-blue-800"
                            }
                          >
                            {issue.type}
                          </Badge>
                        </div>
                        {issue.element && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Element: {issue.element}
                          </p>
                        )}
                        {issue.fix && (
                          <p className="text-sm bg-muted/50 p-2 rounded">{issue.fix}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="accessibility" className="mt-6">
          {accessibilityResults && (
            <div className="space-y-4">
              {accessibilityResults.violations.map((violation, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle
                        className={`h-5 w-5 mt-0.5 ${
                          violation.impact === "critical"
                            ? "text-red-600"
                            : violation.impact === "serious"
                              ? "text-orange-600"
                              : violation.impact === "moderate"
                                ? "text-yellow-600"
                                : "text-blue-600"
                        }`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold">{violation.description}</h4>
                          <Badge variant="outline">WCAG {violation.level}</Badge>
                          <Badge variant="outline">{violation.impact}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Guideline: {violation.guideline}
                        </p>
                        {violation.element && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Element: {violation.element}
                          </p>
                        )}
                        <p className="text-sm bg-muted/50 p-2 rounded">{violation.fix}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Mobile Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {mobileResults && (
                  <ul className="space-y-2 text-sm">
                    {mobileResults.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accessibility Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {accessibilityResults && (
                  <ul className="space-y-2 text-sm">
                    {accessibilityResults.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <Smartphone className="h-6 w-6" />
              <span>Test Mobile View</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <Monitor className="h-6 w-6" />
              <span>Test Desktop View</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <Shield className="h-6 w-6" />
              <span>Run Accessibility Test</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <BookOpen className="h-6 w-6" />
              <span>View Documentation</span>
            </Button>
            <Button
              onClick={runCompleteAudit}
              disabled={isRunning}
              className="h-24 flex flex-col items-center justify-center space-y-2"
            >
              <CheckCircle className="h-6 w-6" />
              <span>{isRunning ? "Running..." : "Rerun Audit"}</span>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserExperienceAudit;
