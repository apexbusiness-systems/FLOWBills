import { useState, useMemo, useCallback, memo } from 'react';
import { useAFEs, AFE } from '@/hooks/useAFEs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, DollarSign, TrendingUp, Percent, Plus, Search } from 'lucide-react';
import { CreateAFEDialog } from './CreateAFEDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { VirtualList } from '@/components/ui/virtual-list';
import { usePerformanceProfiler } from '@/lib/performance-profiler';

/**
 * Optimized AFE Card - Memoized to prevent unnecessary re-renders
 */
const AFECard = memo(({ afe }: { afe: AFE }) => {
  const budgetUtilization = (Number(afe.spent_amount) / Number(afe.budget_amount)) * 100;
  const remaining = Number(afe.budget_amount) - Number(afe.spent_amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'closed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getBorderColor = () => {
    if (budgetUtilization >= 95) return 'border-l-destructive';
    if (budgetUtilization >= 80) return 'border-l-orange-500';
    if (budgetUtilization >= 60) return 'border-l-yellow-500';
    return 'border-l-green-500';
  };

  return (
    <Card className={`border-l-4 ${getBorderColor()}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{afe.afe_number}</CardTitle>
            {afe.description && (
              <CardDescription className="line-clamp-1">
                {afe.description}
              </CardDescription>
            )}
            {afe.well_name && (
              <p className="text-sm text-muted-foreground">
                Well: {afe.well_name}
              </p>
            )}
          </div>
          <Badge variant={getStatusColor(afe.status)}>
            {afe.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Budget Utilization</span>
              <span className="font-semibold">{budgetUtilization.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  budgetUtilization >= 95 ? 'bg-destructive' :
                  budgetUtilization >= 80 ? 'bg-orange-500' :
                  budgetUtilization >= 60 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Budget</p>
              <p className="font-semibold">${Number(afe.budget_amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Spent</p>
              <p className="font-semibold">${Number(afe.spent_amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Remaining</p>
              <p className="font-semibold">${remaining.toLocaleString()}</p>
            </div>
          </div>

          {budgetUtilization >= 80 && (
            <Alert variant={budgetUtilization >= 95 ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {budgetUtilization >= 95
                  ? 'Critical: Budget nearly exhausted!'
                  : 'Warning: Approaching budget limit'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal memoization
  return (
    prevProps.afe.id === nextProps.afe.id &&
    prevProps.afe.spent_amount === nextProps.afe.spent_amount &&
    prevProps.afe.status === nextProps.afe.status
  );
});

AFECard.displayName = 'AFECard';

/**
 * Optimized Stats Card - Memoized
 */
const StatsCard = memo(({ 
  icon: Icon, 
  title, 
  value, 
  description 
}: { 
  icon: any; 
  title: string; 
  value: string | number; 
  description: string;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
));

StatsCard.displayName = 'StatsCard';

/**
 * Optimized AFE Manager - O(n log n) filtering with memoization and virtual scrolling
 */
export const AFEManagerOptimized = () => {
  usePerformanceProfiler('AFEManagerOptimized');
  
  const { afes, loading, getAFEStats } = useAFEs();
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Memoized stats calculation - O(n) only when afes change
  const stats = useMemo(() => getAFEStats(), [afes]);

  // Memoized filtering - O(n log n) with optimized search
  const filteredAFEs = useMemo(() => {
    if (!search.trim()) return afes;

    const searchLower = search.toLowerCase();
    return afes.filter(afe => 
      afe.afe_number.toLowerCase().includes(searchLower) ||
      afe.description?.toLowerCase().includes(searchLower) ||
      afe.well_name?.toLowerCase().includes(searchLower)
    );
  }, [afes, search]);

  // Memoized render callback for virtual list
  const renderAFE = useCallback((afe: AFE) => (
    <AFECard key={afe.id} afe={afe} />
  ), []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview - Memoized */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          icon={DollarSign}
          title="Total AFEs"
          value={stats.total}
          description={`${stats.active} active projects`}
        />
        <StatsCard
          icon={TrendingUp}
          title="Total Budget"
          value={`$${stats.totalBudget.toLocaleString()}`}
          description="Across all AFEs"
        />
        <StatsCard
          icon={DollarSign}
          title="Total Spent"
          value={`$${stats.totalSpent.toLocaleString()}`}
          description="Current expenditure"
        />
        <StatsCard
          icon={Percent}
          title="Utilization Rate"
          value={`${stats.utilizationRate.toFixed(1)}%`}
          description="Average across AFEs"
        />
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by AFE number, description, or well name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create AFE
        </Button>
      </div>

      {/* AFE List with Virtual Scrolling */}
      {filteredAFEs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {search ? 'No AFEs match your search' : 'No AFEs found'}
            </p>
            {!search && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First AFE
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filteredAFEs.length > 20 ? (
        // Use virtual scrolling for large lists (O(visible items) render complexity)
        <VirtualList
          items={filteredAFEs}
          itemHeight={250}
          containerHeight={800}
          renderItem={renderAFE}
          overscan={2}
          className="rounded-lg border"
        />
      ) : (
        // Standard rendering for small lists
        <div className="grid grid-cols-1 gap-4">
          {filteredAFEs.map(afe => (
            <AFECard key={afe.id} afe={afe} />
          ))}
        </div>
      )}

      <CreateAFEDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};
