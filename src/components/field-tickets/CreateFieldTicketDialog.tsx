import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFieldTickets } from "@/hooks/useFieldTickets";
import { useAFEs } from "@/hooks/useAFEs";
import { useInvoices } from "@/hooks/useInvoices";
import { MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  ticket_number: z.string().min(1, "Ticket number is required"),
  vendor_name: z.string().min(1, "Vendor name is required"),
  service_date: z.string().min(1, "Service date is required"),
  amount: z.string().min(1, "Amount is required"),
  invoice_id: z.string().optional(),
  afe_id: z.string().optional(),
  service_type: z.string().optional(),
  hours: z.string().optional(),
  rate: z.string().optional(),
  equipment: z.string().optional(),
  personnel: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

interface CreateFieldTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateFieldTicketDialog = ({ open, onOpenChange }: CreateFieldTicketDialogProps) => {
  const { createFieldTicket } = useFieldTickets();
  const { afes } = useAFEs();
  const { invoices } = useInvoices();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ticket_number: "",
      vendor_name: "",
      service_date: "",
      amount: "",
      service_type: "",
      location: "",
    },
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setGpsCoordinates(coords);
        toast({
          title: "Location Captured",
          description: `GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`,
        });
        setGpsLoading(false);
      },
      (error) => {
        console.error("GPS error:", error);
        toast({
          title: "Location Error",
          description:
            "Unable to get your location. Please ensure location permissions are enabled.",
          variant: "destructive",
        });
        setGpsLoading(false);
      }
    );
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    const ticketData = {
      ticket_number: values.ticket_number,
      vendor_name: values.vendor_name,
      service_date: values.service_date,
      amount: parseFloat(values.amount),
      invoice_id: values.invoice_id || undefined,
      afe_id: values.afe_id || undefined,
      service_type: values.service_type || undefined,
      hours: values.hours ? parseFloat(values.hours) : undefined,
      rate: values.rate ? parseFloat(values.rate) : undefined,
      equipment: values.equipment || undefined,
      personnel: values.personnel || undefined,
      location: values.location || undefined,
      gps_coordinates: gpsCoordinates || undefined,
      notes: values.notes || undefined,
    };

    const result = await createFieldTicket(ticketData);

    setIsSubmitting(false);

    if (result) {
      form.reset();
      setGpsCoordinates(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Field Ticket</DialogTitle>
          <DialogDescription>
            Create a new field ticket with GPS validation and invoice linking
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ticket_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="FT-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendor_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC Services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="service_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Drilling, Completion, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="hours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="8.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate ($/hr)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="150.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="1275.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="afe_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AFE</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select AFE" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {afes.map((afe) => (
                          <SelectItem key={afe.id} value={afe.id}>
                            {afe.afe_number} - {afe.description || "No description"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoice_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Invoice</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Invoice" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {invoices.map((invoice) => (
                          <SelectItem key={invoice.id} value={invoice.id}>
                            {invoice.invoice_number} - {invoice.vendor_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment</FormLabel>
                  <FormControl>
                    <Input placeholder="Rig #5, Truck #12, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personnel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personnel</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe, Jane Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Site name or address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={gpsLoading}
                className="w-full"
              >
                {gpsLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="mr-2 h-4 w-4" />
                )}
                {gpsCoordinates ? "GPS Captured ✓" : "Capture GPS Location"}
              </Button>

              {gpsCoordinates && (
                <p className="text-xs text-muted-foreground">
                  GPS: {gpsCoordinates.lat.toFixed(6)}, {gpsCoordinates.lng.toFixed(6)}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Field Ticket
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
