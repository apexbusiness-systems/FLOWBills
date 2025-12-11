import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  Calendar,
  Target,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

interface PredictiveInsight {
  id: string;
  type: 'forecast' | 'alert' | 'opportunity' | 'savings';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  value?: number;
  change?: number;
  confidence: number;
}

export function PredictiveInsights() {
  const insights: PredictiveInsight[] = [
    {
      id: '1',
      type: 'forecast',
      title: 'Cash Flow Prediction',
      description: 'Expected outflow next 30 days based on approval patterns',
      impact: 'high',
      value: 245000,
      change: 12,
      confidence: 87
    },
    {
      id: '2',
      type: 'opportunity',
      title: 'Early Payment Discount',
      description: '3 vendors offer 2% discount for payment within 10 days',
      impact: 'medium',
      value: 4200,
      confidence: 92
    },
    {
      id: '3',
      type: 'alert',
      title: 'Duplicate Risk Detected',
      description: '2 invoices from same vendor with similar amounts pending review',
      impact: 'high',
      confidence: 78
    },
    {
      id: '4',
      type: 'savings',
      title: 'Vendor Consolidation',
      description: 'Consolidating 3 similar vendors could save ~$8.5K annually',
      impact: 'medium',
      value: 8500,
      confidence: 71
    }
  ];

  const getIcon = (type: PredictiveInsight['type']) => {
    switch (type) {
      case 'forecast': return TrendingUp;
      case 'alert': return AlertTriangle;
      case 'opportunity': return Zap;
      case 'savings': return DollarSign;
    }
  };

  const getColor = (impact: PredictiveInsight['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
    }
  };

  const getBgColor = (impact: PredictiveInsight['impact']) => {
    switch (impact) {
      case 'high': return 'bg-red-500/10';
      case 'medium': return 'bg-yellow-500/10';
      case 'low': return 'bg-blue-500/10';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          AI-Powered Insights
        </CardTitle>
        <CardDescription>
          Predictive analytics and smart recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = getIcon(insight.type);
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`p-4 rounded-lg border ${getBgColor(insight.impact)} hover:shadow-md transition-shadow`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getBgColor(insight.impact)}`}>
                      <Icon className={`h-5 w-5 ${getColor(insight.impact)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {insight.confidence}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      {insight.value && (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                              ${insight.value.toLocaleString()}
                            </span>
                          </div>
                          {insight.change && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {insight.change > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              )}
                              <span>{Math.abs(insight.change)}% vs last period</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
