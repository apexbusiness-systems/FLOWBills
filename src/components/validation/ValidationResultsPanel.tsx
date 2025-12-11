import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Clock,
  RefreshCw
} from 'lucide-react';
import { InvoiceValidationResult, ValidationResult } from '@/hooks/useValidationRules';

interface ValidationResultsPanelProps {
  validationResult: InvoiceValidationResult | null;
  loading?: boolean;
  onRevalidate?: () => void;
}

const ValidationResultsPanel = ({ 
  validationResult, 
  loading = false, 
  onRevalidate 
}: ValidationResultsPanelProps) => {
  if (!validationResult && !loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Validation Results</h3>
          <p className="text-muted-foreground text-center">
            Save the invoice to run validation checks automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Running Validation...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={undefined} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Checking invoice against validation rules...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validationResult) return null;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'default';
    }
  };

  const passedCount = validationResult.results.filter(r => r.passed).length;
  const totalCount = validationResult.results.length;
  const passRate = totalCount > 0 ? (passedCount / totalCount) * 100 : 100;

  const criticalIssues = validationResult.results.filter(r => !r.passed && r.severity === 'critical');
  const errors = validationResult.results.filter(r => !r.passed && r.severity === 'error');
  const warnings = validationResult.results.filter(r => !r.passed && r.severity === 'warning');

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {validationResult.overall_passed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              Validation Results
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={validationResult.overall_passed ? 'default' : 'destructive'}>
                {validationResult.overall_passed ? 'PASSED' : 'FAILED'}
              </Badge>
              {onRevalidate && (
                <Button variant="outline" size="sm" onClick={onRevalidate}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Rules Passed</span>
                <span>{passedCount} of {totalCount}</span>
              </div>
              <Progress value={passRate} className="h-2" />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{passedCount}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{warnings.length}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{errors.length}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{criticalIssues.length}</div>
                <div className="text-sm text-muted-foreground">Critical</div>
              </div>
            </div>

            {/* Execution Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Validated at {new Date(validationResult.executed_at).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues Alert */}
      {criticalIssues.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Critical Issues Found:</strong> {criticalIssues.length} critical validation{criticalIssues.length > 1 ? 's' : ''} failed. 
            This invoice cannot be processed until these issues are resolved.
          </AlertDescription>
        </Alert>
      )}

      {/* Individual Results */}
      <div className="space-y-2">
        {validationResult.results.map((result, index) => (
          <Card key={index} className={`${!result.passed ? 'border-destructive/20' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {getSeverityIcon(result.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{result.rule_name}</h4>
                    <Badge variant={getSeverityBadgeVariant(result.severity)}>
                      {result.severity}
                    </Badge>
                    {result.passed && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Passed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                  
                  {result.suggested_action && !result.passed && (
                    <div className="bg-muted/50 rounded-md p-2 mt-2">
                      <p className="text-sm text-foreground">
                        <strong>Suggested Action:</strong> {result.suggested_action}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results Message */}
      {validationResult.results.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Info className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No validation rules were executed.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ValidationResultsPanel;