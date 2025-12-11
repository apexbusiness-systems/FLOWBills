import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Shield, 
  Globe,
  Calendar,
  TrendingUp
} from "lucide-react";

interface ReadinessScore {
  country: string;
  code: string;
  score: number;
  status: 'ready' | 'warning' | 'urgent';
  daysUntilDeadline: number;
  requirements: {
    name: string;
    completed: boolean;
    critical: boolean;
  }[];
  recommendations: string[];
}

const readinessData: ReadinessScore[] = [
  {
    country: 'Germany',
    code: 'DE',
    score: 95,
    status: 'ready',
    daysUntilDeadline: 67, // From Jan 1, 2025
    requirements: [
      { name: 'XRechnung format support', completed: true, critical: true },
      { name: 'Receive capability', completed: true, critical: true },
      { name: 'Validation rules', completed: true, critical: false },
      { name: 'Error handling', completed: true, critical: false }
    ],
    recommendations: [
      'Monitor for XRechnung updates',
      'Prepare for issuance phases (2025-2028)'
    ]
  },
  {
    country: 'Poland',
    code: 'PL',
    score: 78,
    status: 'warning',
    daysUntilDeadline: 398, // Until Feb 1, 2026
    requirements: [
      { name: 'KSeF API integration', completed: true, critical: true },
      { name: 'Token authentication', completed: false, critical: true },
      { name: 'Rate limiting handling', completed: true, critical: false },
      { name: 'Error recovery', completed: true, critical: false }
    ],
    recommendations: [
      'Configure KSeF production tokens',
      'Test against KSeF 2.0 sandbox',
      'Implement retry logic for rate limits'
    ]
  },
  {
    country: 'Spain',
    code: 'ES',
    score: 65,
    status: 'warning',
    daysUntilDeadline: 336, // Until Jan 1, 2026
    requirements: [
      { name: 'Veri*factu format', completed: true, critical: true },
      { name: 'Hash chain implementation', completed: true, critical: true },
      { name: 'AEAT certificates', completed: false, critical: true },
      { name: 'QR code generation', completed: true, critical: false }
    ],
    recommendations: [
      'Obtain AEAT production certificates',
      'Test tamper-evident logbook',
      'Validate hash chain integrity'
    ]
  },
  {
    country: 'France',
    code: 'FR',
    score: 42,
    status: 'urgent',
    daysUntilDeadline: 580, // Until Sep 1, 2026
    requirements: [
      { name: 'Factur-X support', completed: true, critical: true },
      { name: 'E-reporting capability', completed: false, critical: true },
      { name: 'Size-based rules', completed: false, critical: true },
      { name: 'Receive readiness', completed: false, critical: false }
    ],
    recommendations: [
      'Implement e-reporting features',
      'Configure size-based issuance rules',
      'Prepare for phased rollout (2026-2027)',
      'Monitor Finance Ministry updates'
    ]
  }
];

const ReadinessIndicator = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'urgent': return <Clock className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDaysUntilDeadline = (days: number) => {
    if (days < 0) return 'Overdue';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  const overallReadiness = Math.round(
    readinessData.reduce((sum, item) => sum + item.score, 0) / readinessData.length
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">E-Invoicing Readiness</h2>
          <p className="text-muted-foreground">Monitor compliance readiness across all markets</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{overallReadiness}%</div>
            <div className="text-sm text-muted-foreground">Overall</div>
          </div>
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
      </div>

      <Alert className={getStatusColor(overallReadiness >= 90 ? 'ready' : overallReadiness >= 60 ? 'warning' : 'urgent')}>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          {overallReadiness >= 90 
            ? "Your organization is well-prepared for e-invoicing compliance across all markets."
            : overallReadiness >= 60
            ? "Some markets require attention to meet compliance deadlines."
            : "Urgent action required to meet upcoming e-invoicing deadlines."
          }
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {readinessData.map((item) => (
          <Card key={item.code} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-xl">{item.country}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{item.code}</Badge>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {getStatusIcon(item.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Readiness Score</span>
                  <span className="text-sm font-bold">{item.score}%</span>
                </div>
                <Progress 
                  value={item.score} 
                  className="h-2"
                  color={getProgressColor(item.score)}
                />
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Deadline in:</span>
                <span className="font-medium">{formatDaysUntilDeadline(item.daysUntilDeadline)}</span>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Requirements</span>
                <div className="space-y-1">
                  {item.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {req.completed ? (
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      ) : req.critical ? (
                        <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                      ) : (
                        <Clock className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                      )}
                      <span className={req.completed ? 'text-muted-foreground' : req.critical ? 'text-red-700' : ''}>
                        {req.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {item.recommendations.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Next Steps</span>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {item.recommendations.slice(0, 2).map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-primary">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReadinessIndicator;