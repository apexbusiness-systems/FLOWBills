import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { useCompliance, ComplianceRecord } from '@/hooks/useCompliance';
import { 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText,
  User,
  Flag
} from 'lucide-react';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';

const ComplianceList = () => {
  const { records, loading, fetchRecords, markCompleted } = useCompliance();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    const filters: any = {};
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (riskFilter !== 'all') filters.risk_level = riskFilter;
    if (typeFilter !== 'all') filters.record_type = typeFilter;
    
    fetchRecords(filters);
  }, [fetchRecords, statusFilter, riskFilter, typeFilter]);

  const filteredRecords = records.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.record_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.description && record.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'outline';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDeadlineStatus = (record: ComplianceRecord) => {
    if (!record.due_date || record.status === 'completed') return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(record.due_date);
    dueDate.setHours(0, 0, 0, 0);
    const weekFromNow = addDays(today, 7);

    if (isBefore(dueDate, today)) {
      return { status: 'overdue', color: 'destructive', text: 'Overdue' };
    } else if (isBefore(dueDate, weekFromNow)) {
      return { status: 'due_soon', color: 'secondary', text: 'Due Soon' };
    }
    return { status: 'upcoming', color: 'outline', text: 'Upcoming' };
  };

  const getProgressPercentage = (record: ComplianceRecord) => {
    if (record.status === 'completed') return 100;
    if (record.status === 'in_progress') return 50;
    if (record.status === 'pending') return 10;
    return 0;
  };

  const handleMarkCompleted = async (recordId: string) => {
    await markCompleted(recordId);
  };

  if (loading) {
    return <LoadingSkeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Compliance Records</h2>
          <p className="text-muted-foreground">Track and manage compliance requirements</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search compliance records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Records Grid */}
      <div className="grid gap-4">
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Compliance Records Found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== 'all' || riskFilter !== 'all'
                  ? 'No records match your current filters.'
                  : 'Create your first compliance record to start tracking requirements.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => {
            const deadlineStatus = getDeadlineStatus(record);
            const progress = getProgressPercentage(record);
            
            return (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(record.status)}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{record.title}</CardTitle>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline">{record.record_type}</Badge>
                            <Badge variant={getStatusColor(record.status)}>
                              {record.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant={getRiskColor(record.risk_level)}>
                              <Flag className="w-3 h-3 mr-1" />
                              {record.risk_level}
                            </Badge>
                            {deadlineStatus && (
                            <Badge variant={deadlineStatus.color as any}>
                              <Calendar className="w-3 h-3 mr-1" />
                              {deadlineStatus.text}
                            </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Description */}
                  {record.description && (
                    <p className="text-sm text-muted-foreground">{record.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Dates and Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Compliance Date:</span>
                      <div className="text-foreground">
                        {format(new Date(record.compliance_date), 'MMM d, yyyy')}
                      </div>
                    </div>
                    
                    {record.due_date && (
                      <div>
                        <span className="font-medium text-muted-foreground">Due Date:</span>
                        <div className={`text-foreground ${deadlineStatus?.status === 'overdue' ? 'text-destructive' : ''}`}>
                          {format(new Date(record.due_date), 'MMM d, yyyy')}
                          <div className="text-xs text-muted-foreground">
                            ({formatDistanceToNow(new Date(record.due_date), { addSuffix: true })})
                          </div>
                        </div>
                      </div>
                    )}

                    {record.responsible_party && (
                      <div>
                        <span className="font-medium text-muted-foreground">Responsible:</span>
                        <div className="flex items-center gap-1 text-foreground">
                          <User className="h-3 w-3" />
                          {record.responsible_party}
                        </div>
                      </div>
                    )}
                  </div>

                  {record.completed_date && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Completed on {format(new Date(record.completed_date), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Created {format(new Date(record.created_at), 'MMM d, yyyy')}
                    </p>
                    
                    <div className="flex gap-2">
                      {record.status !== 'completed' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkCompleted(record.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ComplianceList;