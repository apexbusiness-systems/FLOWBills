import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Shield, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CSPViolation {
  id: string;
  blocked_uri: string;
  violated_directive: string;
  original_policy: string;
  disposition: string;
  document_uri: string;
  user_agent: string;
  timestamp: string;
  metadata: any;
}

export const CSPDashboard = () => {
  const [violations, setViolations] = useState<CSPViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, unique: 0, recent: 0 });

  useEffect(() => {
    fetchViolations();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('csp_violations')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'csp_violations' 
      }, () => {
        fetchViolations();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchViolations = async () => {
    try {
      const { data, error } = await supabase
        .from('csp_violations')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      setViolations(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const uniqueDirectives = new Set(data?.map(v => v.violated_directive)).size;
      const last24h = data?.filter(v => 
        new Date(v.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length || 0;

      setStats({ total, unique: uniqueDirectives, recent: last24h });
    } catch (error) {
      console.error('Error fetching CSP violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (directive: string) => {
    if (directive.includes('script-src')) return 'destructive';
    if (directive.includes('style-src')) return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Directives</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unique}</div>
            <p className="text-xs text-muted-foreground">Different violation types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 24 Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent}</div>
            <p className="text-xs text-muted-foreground">Recent violations</p>
          </CardContent>
        </Card>
      </div>

      {/* Violations List */}
      <Card>
        <CardHeader>
          <CardTitle>CSP Violation Reports</CardTitle>
          <CardDescription>
            Content Security Policy violations detected in production
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading violations...</div>
            ) : violations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No CSP violations detected</p>
              </div>
            ) : (
              <div className="space-y-4">
                {violations.map((violation) => (
                  <div
                    key={violation.id}
                    className="border rounded-lg p-4 space-y-2 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(violation.violated_directive)}>
                            {violation.violated_directive}
                          </Badge>
                          <Badge variant="outline">{violation.disposition}</Badge>
                        </div>
                        <div className="text-sm font-medium break-all">
                          Blocked: <code className="text-xs bg-muted px-1 py-0.5 rounded">{violation.blocked_uri}</code>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Page: {violation.document_uri}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {formatDistanceToNow(new Date(violation.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
