import { useState } from 'react';
import { useUWIs } from '@/hooks/useUWIs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, MapPin, Calendar, Building2, FileText } from 'lucide-react';
import { CreateUWIDialog } from './CreateUWIDialog';
import { UWIDetailsDialog } from './UWIDetailsDialog';
import { format } from 'date-fns';

const STATUS_COLORS = {
  active: 'bg-green-500',
  drilling: 'bg-blue-500',
  completed: 'bg-gray-500',
  suspended: 'bg-orange-500',
  abandoned: 'bg-red-500',
};

export const UWIRegistry = () => {
  const { uwis, loading, getUWIStats } = useUWIs();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [provinceFilter, setProvinceFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedUWIId, setSelectedUWIId] = useState<string | null>(null);

  const stats = getUWIStats();

  const filteredUWIs = uwis.filter(uwi => {
    const matchesSearch = searchQuery === '' || 
      uwi.uwi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uwi.well_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uwi.operator?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || uwi.status === statusFilter;
    const matchesProvince = provinceFilter === 'all' || uwi.province === provinceFilter;

    return matchesSearch && matchesStatus && matchesProvince;
  });

  const provinces = Array.from(new Set(uwis.map(u => u.province).filter(Boolean)));

  const handleViewDetails = (uwiId: string) => {
    setSelectedUWIId(uwiId);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">UWI Registry</h2>
          <p className="text-muted-foreground">
            Manage Unique Well Identifiers and track well status
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add UWI
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wells</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drilling</CardTitle>
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.drilling}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="h-2 w-2 rounded-full bg-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Well Identifiers</CardTitle>
          <CardDescription>
            Browse and manage your UWI registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by UWI, well name, or operator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="drilling">Drilling</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>
            {provinces.length > 0 && (
              <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Provinces</SelectItem>
                  {provinces.map((province) => (
                    <SelectItem key={province} value={province!}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading UWIs...</div>
          ) : filteredUWIs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No UWIs found. Add your first well identifier to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUWIs.map((uwi) => (
                <Card key={uwi.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleViewDetails(uwi.id)}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{uwi.uwi}</h3>
                          <Badge 
                            variant="secondary" 
                            className={STATUS_COLORS[uwi.status as keyof typeof STATUS_COLORS] || 'bg-gray-500'}
                          >
                            {uwi.status}
                          </Badge>
                        </div>
                        
                        {uwi.well_name && (
                          <p className="text-muted-foreground">{uwi.well_name}</p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {uwi.operator && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{uwi.operator}</span>
                            </div>
                          )}
                          {uwi.province && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{uwi.province}</span>
                            </div>
                          )}
                          {uwi.location && (
                            <div className="text-muted-foreground">
                              {uwi.location}
                            </div>
                          )}
                          {uwi.spud_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Spud: {format(new Date(uwi.spud_date), 'MMM yyyy')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUWIDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedUWIId && (
        <UWIDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          uwiId={selectedUWIId}
        />
      )}
    </div>
  );
};
