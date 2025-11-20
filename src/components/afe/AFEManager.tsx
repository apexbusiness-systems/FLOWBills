import { useState } from 'react';
import { useAFEs } from '@/hooks/useAFEs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, TrendingUp, AlertCircle } from 'lucide-react';
import { CreateAFEDialog } from './CreateAFEDialog';
import { Progress } from '@/components/ui/progress';

export const AFEManager = () => {
  const { afes, loading, getAFEStats } = useAFEs();
  const [search, setSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const stats = getAFEStats();

  const filteredAFEs = afes.filter(afe => 
    afe.afe_number.toLowerCase().includes(search.toLowerCase()) ||
    afe.description?.toLowerCase().includes(search.toLowerCase()) ||
    afe.well_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getBudgetUtilization = (afe: any) => {
    const budget = Number(afe.budget_amount);
    const spent = Number(afe.spent_amount);
    return budget > 0 ? (spent / budget) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total AFEs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">{stats.active} active</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalBudget.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Spent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Utilization Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.utilizationRate.toFixed(1)}%</div>
            <Progress value={stats.utilizationRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Search and Create */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Authorization for Expenditure (AFE)</CardTitle>
              <CardDescription>Manage project budgets and track spending</CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create AFE
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search AFEs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading AFEs...</div>
          ) : filteredAFEs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? 'No AFEs match your search' : 'No AFEs created yet'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAFEs.map((afe) => {
                const utilization = getBudgetUtilization(afe);
                const budget = Number(afe.budget_amount);
                const spent = Number(afe.spent_amount);
                const remaining = budget - spent;

                return (
                  <Card key={afe.id} className="border-l-4" style={{ borderLeftColor: utilization > 90 ? '#ef4444' : utilization > 75 ? '#f59e0b' : '#10b981' }}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{afe.afe_number}</h3>
                            <Badge className={getStatusColor(afe.status)}>
                              {afe.status}
                            </Badge>
                          </div>
                          {afe.description && (
                            <p className="text-sm text-muted-foreground">{afe.description}</p>
                          )}
                          {afe.well_name && (
                            <p className="text-xs text-muted-foreground mt-1">Well: {afe.well_name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <TrendingUp className="w-4 h-4" />
                            {utilization.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="font-medium">${budget.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Spent:</span>
                          <span className="font-medium">${spent.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Remaining:</span>
                          <span className={`font-medium ${remaining < 0 ? 'text-destructive' : ''}`}>
                            ${remaining.toFixed(2)}
                          </span>
                        </div>
                        <Progress value={utilization} className="mt-2" />
                        
                        {utilization > 90 && (
                          <div className="flex items-center gap-2 text-xs text-destructive mt-2">
                            <AlertCircle className="w-3 h-3" />
                            Budget limit approaching
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAFEDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
};
