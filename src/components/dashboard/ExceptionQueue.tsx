import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { useExceptions } from '@/hooks/useExceptions';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const ExceptionQueue = () => {
  const { exceptions, fetchExceptions, getExceptionStats } = useExceptions();
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExceptions({});
    getExceptionStats().then(setStats);
  }, [fetchExceptions, getExceptionStats]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4" />;
      case 'investigating': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const displayExceptions = exceptions.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Exception Queue
        </CardTitle>
        {stats && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{stats.open} open</span>
            {stats.critical > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.critical} critical
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayExceptions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No open exceptions</p>
            </div>
          ) : (
            displayExceptions.map((exception) => (
              <div key={exception.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <AlertTriangle className="h-4 w-4" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{exception.exception_type}</p>
                    <p className="text-sm text-muted-foreground truncate">{exception.description}</p>
                    <div className="text-sm text-muted-foreground">
                      Severity: {exception.severity}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getSeverityColor(exception.severity)}>
                    {exception.severity}
                  </Badge>
                </div>
              </div>
            ))
          )}
          
          {exceptions.length > 0 && (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/exceptions')}
            >
              View All Exceptions
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExceptionQueue;