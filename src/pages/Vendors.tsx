import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFraudFlags } from '@/hooks/useFraudFlags';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Plus, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';

interface Vendor {
  id: string;
  vendor_name: string;
  vendor_code?: string;
  tax_id?: string;
  bank_account?: string;
  iban?: string;
  swift_code?: string;
  contact_info?: any;
  address?: any;
  risk_score: number;
  verification_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const Vendors = () => {
  const { user } = useAuth();
  const { checkVendorForFraud, createFraudFlag } = useFraudFlags();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [fraudCheckResults, setFraudCheckResults] = useState<{flags: string[], risk_score: number} | null>(null);

  const [newVendor, setNewVendor] = useState({
    vendor_name: '',
    vendor_code: '',
    tax_id: '',
    bank_account: '',
    iban: '',
    swift_code: '',
    contact_email: '',
    contact_phone: '',
    address_line1: '',
    city: '',
    country: '',
  });

  const fetchVendors = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch vendors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async () => {
    if (!user) return;

    try {
      // First, check for fraud indicators
      const fraudCheck = await checkVendorForFraud({
        bank_account: newVendor.bank_account || undefined,
        tax_id: newVendor.tax_id || undefined,
        vendor_name: newVendor.vendor_name,
      });

      setFraudCheckResults(fraudCheck);

      // If high risk, show warning but allow creation
      if (fraudCheck.risk_score >= 70) {
        toast({
          title: 'High Risk Vendor Detected',
          description: `Risk score: ${fraudCheck.risk_score}%. Review fraud indicators before proceeding.`,
          variant: 'destructive',
        });
      }

      const vendorData = {
        vendor_name: newVendor.vendor_name,
        vendor_code: newVendor.vendor_code || null,
        tax_id: newVendor.tax_id || null,
        bank_account: newVendor.bank_account || null,
        iban: newVendor.iban || null,
        swift_code: newVendor.swift_code || null,
        contact_info: {
          email: newVendor.contact_email || null,
          phone: newVendor.contact_phone || null,
        },
        address: {
          line1: newVendor.address_line1 || null,
          city: newVendor.city || null,
          country: newVendor.country || null,
        },
        risk_score: fraudCheck.risk_score,
        verification_status: fraudCheck.risk_score >= 50 ? 'review_required' : 'pending',
        is_active: true,
      };

      const { data: vendor, error } = await supabase
        .from('vendors')
        .insert([vendorData])
        .select()
        .single();

      if (error) throw error;

      // Create fraud flags if any were detected
      if (fraudCheck.flags.length > 0) {
        for (const flagDescription of fraudCheck.flags) {
          await createFraudFlag({
            entity_type: 'vendor',
            entity_id: vendor.id,
            flag_type: 'duplicate_data',
            risk_score: fraudCheck.risk_score,
            details: { 
              description: flagDescription,
              detected_at_creation: true 
            }
          });
        }
      }

      toast({
        title: 'Success',
        description: 'Vendor created successfully',
      });

      // Reset form and close dialog
      setNewVendor({
        vendor_name: '',
        vendor_code: '',
        tax_id: '',
        bank_account: '',
        iban: '',
        swift_code: '',
        contact_email: '',
        contact_phone: '',
        address_line1: '',
        city: '',
        country: '',
      });
      setCreateDialogOpen(false);
      setFraudCheckResults(null);
      fetchVendors();

    } catch (error: any) {
      console.error('Error creating vendor:', error);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        toast({
          title: 'Duplicate Vendor',
          description: 'A vendor with this Tax ID already exists',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create vendor',
          variant: 'destructive',
        });
      }
    }
  };

  const updateVendorStatus = async (vendorId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ verification_status: status })
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Vendor status updated',
      });
      
      fetchVendors();
    } catch (error) {
      console.error('Error updating vendor status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update vendor status',
        variant: 'destructive',
      });
    }
  };

  // Initialize vendors on component mount
  React.useEffect(() => {
    fetchVendors();
  }, [user]);

  return (
    <ProtectedRoute requiredRole="operator">
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        
        <main className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Vendor Management
              </h1>
              <p className="text-muted-foreground">
                Manage vendor records, bank details, and fraud detection
              </p>
            </div>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Vendor</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor_name">Vendor Name *</Label>
                    <Input
                      id="vendor_name"
                      value={newVendor.vendor_name}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, vendor_name: e.target.value }))}
                      placeholder="Enter vendor name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vendor_code">Vendor Code</Label>
                    <Input
                      id="vendor_code"
                      value={newVendor.vendor_code}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, vendor_code: e.target.value }))}
                      placeholder="e.g. VEND001"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">Tax ID</Label>
                    <Input
                      id="tax_id"
                      value={newVendor.tax_id}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, tax_id: e.target.value }))}
                      placeholder="Tax identification number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bank_account">Bank Account</Label>
                    <Input
                      id="bank_account"
                      value={newVendor.bank_account}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, bank_account: e.target.value }))}
                      placeholder="Bank account number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={newVendor.contact_email}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, contact_email: e.target.value }))}
                      placeholder="contact@vendor.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      value={newVendor.contact_phone}
                      onChange={(e) => setNewVendor(prev => ({ ...prev, contact_phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                
                {fraudCheckResults && (
                  <Alert className={`mt-4 ${fraudCheckResults.risk_score >= 70 ? 'border-destructive' : 'border-warning'}`}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold mb-2">
                        Risk Score: {fraudCheckResults.risk_score}%
                      </div>
                      {fraudCheckResults.flags.length > 0 && (
                        <ul className="list-disc list-inside space-y-1">
                          {fraudCheckResults.flags.map((flag, index) => (
                            <li key={index} className="text-sm">{flag}</li>
                          ))}
                        </ul>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateVendor}
                    disabled={!newVendor.vendor_name}
                  >
                    Create Vendor
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading vendors...</p>
              </div>
            ) : vendors.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No vendors found</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Vendor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              vendors.map((vendor) => (
                <Card key={vendor.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-3">
                          {vendor.vendor_name}
                          {vendor.risk_score >= 70 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              High Risk
                            </Badge>
                          )}
                          {vendor.verification_status === 'verified' && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Code: {vendor.vendor_code || 'N/A'} • Risk Score: {vendor.risk_score}%
                        </CardDescription>
                      </div>
                      
                      <Select
                        value={vendor.verification_status}
                        onValueChange={(status) => updateVendorStatus(vendor.id, status)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="review_required">Review Required</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Tax ID:</span>
                        <p className="text-muted-foreground">{vendor.tax_id || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Bank Account:</span>
                        <p className="text-muted-foreground">
                          {vendor.bank_account ? `****${vendor.bank_account.slice(-4)}` : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Contact:</span>
                        <p className="text-muted-foreground">
                          {vendor.contact_info?.email || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Created:</span>
                        <p className="text-muted-foreground">
                          {new Date(vendor.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Vendors;