import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface CreateIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    integration_name: string;
    integration_type: string;
    config: Record<string, any>;
  }) => Promise<any>;
}

const integrationTypes = [
  { value: 'Portal Access', label: 'Portal Access' },
  { value: 'ERP Integration', label: 'ERP Integration' },
  { value: 'Electronic Data Interchange', label: 'Electronic Data Interchange' },
  { value: 'Invoice Automation', label: 'Invoice Automation' },
  { value: 'API Integration', label: 'API Integration' },
];

const CreateIntegrationDialog = ({
  open,
  onOpenChange,
  onSubmit
}: CreateIntegrationDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    integration_name: '',
    integration_type: '',
    description: '',
    endpoint_url: '',
    api_key: '',
    username: '',
    password: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.integration_name || !formData.integration_type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const config = {
        description: formData.description,
        endpoint_url: formData.endpoint_url,
        api_key: formData.api_key,
        username: formData.username,
        password: formData.password
      };

      await onSubmit({
        integration_name: formData.integration_name,
        integration_type: formData.integration_type,
        config
      });

      // Reset form
      setFormData({
        integration_name: '',
        integration_type: '',
        description: '',
        endpoint_url: '',
        api_key: '',
        username: '',
        password: ''
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Integration</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="integration_name">Integration Name *</Label>
            <Input
              id="integration_name"
              value={formData.integration_name}
              onChange={(e) => setFormData(prev => ({ ...prev, integration_name: e.target.value }))}
              placeholder="e.g., NOV AccessNOV Portal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="integration_type">Integration Type *</Label>
            <Select 
              value={formData.integration_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, integration_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select integration type" />
              </SelectTrigger>
              <SelectContent>
                {integrationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this integration..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint_url">Endpoint URL</Label>
            <Input
              id="endpoint_url"
              type="url"
              value={formData.endpoint_url}
              onChange={(e) => setFormData(prev => ({ ...prev, endpoint_url: e.target.value }))}
              placeholder="https://api.example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
              placeholder="API Key (if applicable)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Integration'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIntegrationDialog;