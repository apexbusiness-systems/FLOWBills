import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import LoadingSkeleton from '@/components/ui/loading-skeleton';
import { useExceptions, Exception } from '@/hooks/useExceptions';
import { AlertTriangle, CheckCircle, Clock, Search, Filter, Eye } from 'lucide-react';
import { format } from 'date-fns';

const ExceptionList = () => {
  const { exceptions, loading, fetchExceptions, updateException } = useExceptions();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  useEffect(() => {
    const filters: any = {};
    if (severityFilter !== 'all') filters.severity = severityFilter;
    
    fetchExceptions(filters);
  }, [fetchExceptions, severityFilter]);

  const filteredExceptions = exceptions.filter(exception => {
    const matchesSearch = searchTerm === '' || 
      exception.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exception.exception_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleViewException = (exception: Exception) => {
    setSelectedException(exception);
  };

  const handleResolveException = (exception: Exception) => {
    setSelectedException(exception);
    setResolveDialogOpen(true);
    setResolutionNotes('');
  };

  const handleMarkResolved = async () => {
    if (!selectedException) return;

    const success = await updateException(selectedException.id, {
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes
    });

    if (success) {
      setResolveDialogOpen(false);
      setSelectedException(null);
      setResolutionNotes('');
    }
  };

  const formatExceptionType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exception Management</CardTitle>
          <CardDescription>
            Review and resolve invoice processing exceptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search exceptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredExceptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No exceptions found matching your criteria</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExceptions.map((exception) => (
                    <TableRow key={exception.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(exception.severity)}
                          <span className="font-medium">
                            {formatExceptionType(exception.exception_type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm">{exception.description}</p>
                          {exception.invoice_id && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Invoice: {exception.invoice_id}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(exception.severity)}>
                          {exception.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(exception.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {exception.resolved_at ? (
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge variant="default">
                            <Clock className="h-3 w-3 mr-1" />
                            Open
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewException(exception)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!exception.resolved_at && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResolveException(exception)}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Exception Dialog */}
      {selectedException && !resolveDialogOpen && (
        <Dialog open={!!selectedException} onOpenChange={() => setSelectedException(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Exception Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <p className="text-sm mt-1">{formatExceptionType(selectedException.exception_type)}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm mt-1">{selectedException.description}</p>
              </div>
              <div>
                <Label>Severity</Label>
                <Badge variant={getSeverityColor(selectedException.severity)} className="mt-1">
                  {selectedException.severity}
                </Badge>
              </div>
              <div>
                <Label>Created At</Label>
                <p className="text-sm mt-1">{format(new Date(selectedException.created_at), 'PPP pp')}</p>
              </div>
              {selectedException.resolved_at && (
                <>
                  <div>
                    <Label>Resolved At</Label>
                    <p className="text-sm mt-1">{format(new Date(selectedException.resolved_at), 'PPP pp')}</p>
                  </div>
                  {selectedException.resolution_notes && (
                    <div>
                      <Label>Resolution Notes</Label>
                      <p className="text-sm mt-1">{selectedException.resolution_notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedException(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Resolve Exception Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Exception</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="resolution-notes">Resolution Notes</Label>
              <Textarea
                id="resolution-notes"
                placeholder="Describe how this exception was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkResolved}>
              Mark as Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExceptionList;