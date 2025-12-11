import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUWIs } from '@/hooks/useUWIs';
import { Building2, MapPin, Calendar, FileText, Drill, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface UWIDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uwiId: string;
}

export const UWIDetailsDialog = ({
  open,
  onOpenChange,
  uwiId,
}: UWIDetailsDialogProps) => {
  const { getUWIById, getAssociatedData } = useUWIs();
  const [associatedData, setAssociatedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const uwi = getUWIById(uwiId);

  useEffect(() => {
    if (open && uwiId) {
      setLoading(true);
      getAssociatedData(uwiId).then((data) => {
        setAssociatedData(data);
        setLoading(false);
      });
    }
  }, [open, uwiId, getAssociatedData]);

  if (!uwi) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {uwi.uwi}
            <Badge variant="secondary">
              {uwi.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {uwi.well_name || 'Well details and associations'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="associations">
              Associations
              {!loading && associatedData && (
                <Badge variant="secondary" className="ml-2">
                  {(associatedData.invoices?.length || 0) + (associatedData.fieldTickets?.length || 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Operator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{uwi.operator || 'N/A'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Province
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{uwi.province || 'N/A'}</p>
                </CardContent>
              </Card>
            </div>

            {uwi.location && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{uwi.location}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              {uwi.spud_date && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Drill className="h-4 w-4" />
                      Spud Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">
                      {format(new Date(uwi.spud_date), 'MMMM dd, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              )}

              {uwi.completion_date && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Completion Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">
                      {format(new Date(uwi.completion_date), 'MMMM dd, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="text-base px-4 py-1">{uwi.status}</Badge>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="associations" className="space-y-4 mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading associations...
              </div>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Invoice Extractions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {associatedData?.invoices?.length > 0 ? (
                      <div className="text-sm">
                        <p className="font-semibold">
                          {associatedData.invoices.length} invoice(s) linked to this UWI
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No invoices linked to this UWI yet
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Field Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {associatedData?.fieldTickets?.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold mb-3">
                          {associatedData.fieldTickets.length} field ticket(s)
                        </p>
                        {associatedData.fieldTickets.map((ticket: any) => (
                          <div
                            key={ticket.id}
                            className="border rounded-lg p-3 text-sm space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{ticket.ticket_number}</span>
                              {ticket.verified && (
                                <Badge variant="default" className="bg-green-500">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              {ticket.vendor_name} - ${ticket.amount.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No field tickets linked to this UWI yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">Created</p>
                    <p className="text-muted-foreground">
                      {format(new Date(uwi.created_at), 'MMMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">Last Updated</p>
                    <p className="text-muted-foreground">
                      {format(new Date(uwi.updated_at), 'MMMM dd, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
