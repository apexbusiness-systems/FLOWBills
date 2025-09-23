import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCompliance } from '@/hooks/useCompliance';
import { Plus, FileText, CalendarIcon, Flag } from 'lucide-react';

interface CreateComplianceDialogProps {
  trigger?: React.ReactNode;
}

const CreateComplianceDialog = ({ trigger }: CreateComplianceDialogProps) => {
  const { createRecord } = useCompliance();
  const [open, setOpen] = useState(false);
  const [complianceDateOpen, setComplianceDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    record_type: '',
    description: '',
    compliance_date: new Date().toISOString().split('T')[0],
    due_date: '',
    risk_level: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    responsible_party: ''
  });

  const complianceTypes = [
    { value: 'environmental', label: 'Environmental Compliance' },
    { value: 'safety', label: 'Safety & Health' },
    { value: 'financial', label: 'Financial Reporting' },
    { value: 'regulatory', label: 'Regulatory Filing' },
    { value: 'audit', label: 'Internal Audit' },
    { value: 'certification', label: 'Certification Renewal' },
    { value: 'training', label: 'Training & Certification' },
    { value: 'permit', label: 'Permit & Licensing' },
    { value: 'tax', label: 'Tax Compliance' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.record_type || !formData.compliance_date) {
      return;
    }

    const success = await createRecord({
      title: formData.title,
      record_type: formData.record_type,
      description: formData.description || undefined,
      compliance_date: formData.compliance_date,
      due_date: formData.due_date || undefined,
      risk_level: formData.risk_level,
      responsible_party: formData.responsible_party || undefined
    });

    if (success) {
      setOpen(false);
      setFormData({
        title: '',
        record_type: '',
        description: '',
        compliance_date: new Date().toISOString().split('T')[0],
        due_date: '',
        risk_level: 'medium',
        responsible_party: ''
      });
    }
  };

  const handleDateChange = (date: Date | undefined, field: 'compliance_date' | 'due_date') => {
    if (date) {
      setFormData(prev => ({ ...prev, [field]: date.toISOString().split('T')[0] }));
    }
    if (field === 'compliance_date') {
      setComplianceDateOpen(false);
    } else {
      setDueDateOpen(false);
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Pick a date';
    return format(new Date(dateString), 'PPP');
  };

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Create Record
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Create Compliance Record
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Environmental Impact Assessment"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="record_type">Compliance Type *</Label>
            <Select
              value={formData.record_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, record_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select compliance type" />
              </SelectTrigger>
              <SelectContent>
                {complianceTypes.map(type => (
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
              placeholder="Describe the compliance requirement..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Compliance Date *</Label>
              <Popover open={complianceDateOpen} onOpenChange={setComplianceDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.compliance_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateForDisplay(formData.compliance_date)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.compliance_date ? new Date(formData.compliance_date) : undefined}
                    onSelect={(date) => handleDateChange(date, 'compliance_date')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? formatDateForDisplay(formData.due_date) : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date ? new Date(formData.due_date) : undefined}
                    onSelect={(date) => handleDateChange(date, 'due_date')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk_level">Risk Level</Label>
            <Select
              value={formData.risk_level}
              onValueChange={(value) => setFormData(prev => ({ ...prev, risk_level: value as any }))}
            >
              <SelectTrigger>
                <Flag className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Minor impact if not completed</SelectItem>
                <SelectItem value="medium">Medium - Moderate business impact</SelectItem>
                <SelectItem value="high">High - Significant consequences</SelectItem>
                <SelectItem value="critical">Critical - Severe penalties or shutdown risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible_party">Responsible Party</Label>
            <Input
              id="responsible_party"
              placeholder="Department or person responsible"
              value={formData.responsible_party}
              onChange={(e) => setFormData(prev => ({ ...prev, responsible_party: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!formData.title || !formData.record_type || !formData.compliance_date}
            >
              Create Record
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateComplianceDialog;