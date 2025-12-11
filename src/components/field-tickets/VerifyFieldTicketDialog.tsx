import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFieldTickets } from '@/hooks/useFieldTickets';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const formSchema = z.object({
  notes: z.string().optional(),
});

interface VerifyFieldTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
}

export const VerifyFieldTicketDialog = ({
  open,
  onOpenChange,
  ticketId,
}: VerifyFieldTicketDialogProps) => {
  const { verifyFieldTicket, getFieldTicketById } = useFieldTickets();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ticket = getFieldTicketById(ticketId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const result = await verifyFieldTicket(ticketId, values.notes);
    setIsSubmitting(false);
    
    if (result) {
      form.reset();
      onOpenChange(false);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Verify Field Ticket</DialogTitle>
          <DialogDescription>
            Review and verify the field ticket details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{ticket.ticket_number}</h3>
              {ticket.gps_coordinates && (
                <Badge variant="outline">GPS Validated</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Vendor:</span>
                <p className="font-medium">{ticket.vendor_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Service Date:</span>
                <p className="font-medium">
                  {format(new Date(ticket.service_date), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <p className="font-medium">${ticket.amount.toLocaleString()}</p>
              </div>
              {ticket.service_type && (
                <div>
                  <span className="text-muted-foreground">Service Type:</span>
                  <p className="font-medium">{ticket.service_type}</p>
                </div>
              )}
              {ticket.hours && (
                <div>
                  <span className="text-muted-foreground">Hours:</span>
                  <p className="font-medium">{ticket.hours}</p>
                </div>
              )}
              {ticket.rate && (
                <div>
                  <span className="text-muted-foreground">Rate:</span>
                  <p className="font-medium">${ticket.rate}/hr</p>
                </div>
              )}
            </div>

            {ticket.equipment && (
              <div className="text-sm">
                <span className="text-muted-foreground">Equipment:</span>
                <p className="font-medium">{ticket.equipment}</p>
              </div>
            )}

            {ticket.personnel && (
              <div className="text-sm">
                <span className="text-muted-foreground">Personnel:</span>
                <p className="font-medium">{ticket.personnel}</p>
              </div>
            )}

            {ticket.location && (
              <div className="text-sm">
                <span className="text-muted-foreground">Location:</span>
                <p className="font-medium">{ticket.location}</p>
              </div>
            )}

            {ticket.gps_coordinates && (
              <div className="text-sm">
                <span className="text-muted-foreground">GPS Coordinates:</span>
                <p className="font-medium font-mono text-xs">
                  {ticket.gps_coordinates.lat.toFixed(6)}, {ticket.gps_coordinates.lng.toFixed(6)}
                </p>
              </div>
            )}

            {ticket.notes && (
              <div className="text-sm">
                <span className="text-muted-foreground">Existing Notes:</span>
                <p className="font-medium">{ticket.notes}</p>
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any verification notes or comments..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Verify Ticket
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
