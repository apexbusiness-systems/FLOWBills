import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Shield, 
  Users, 
  Search, 
  UserCog, 
  Loader2,
  Settings,
  Eye,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type AppRole = 'admin' | 'operator' | 'viewer';

interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: AppRole | null;
  assigned_at: string | null;
  last_login_at: string | null;
}

const roleConfig = {
  admin: { 
    label: 'Administrator', 
    description: 'Full access to all features including user management',
    icon: Shield, 
    variant: 'default' as const,
    color: 'text-destructive'
  },
  operator: { 
    label: 'Operator', 
    description: 'Can manage invoices, workflows, and validations',
    icon: Settings, 
    variant: 'secondary' as const,
    color: 'text-primary'
  },
  viewer: { 
    label: 'Viewer', 
    description: 'Read-only access to dashboards and reports',
    icon: Eye, 
    variant: 'outline' as const,
    color: 'text-muted-foreground'
  },
};

export default function UserRoleManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<AppRole>('viewer');
  const [saving, setSaving] = useState(false);

  // Fetch users with their roles
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, last_login_at')
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, assigned_at');

      if (rolesError) throw rolesError;

      // Create a map of user_id to role
      const roleMap = new Map(roles?.map(r => [r.user_id, r]) || []);

      // We need to get emails from auth - use RPC or edge function in production
      // For now, we'll display what we have from profiles
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const roleData = roleMap.get(profile.user_id);
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: `user-${profile.user_id.slice(0, 8)}@...`, // Placeholder - emails from auth
          full_name: profile.full_name,
          role: roleData?.role as AppRole | null,
          assigned_at: roleData?.assigned_at || null,
          last_login_at: profile.last_login_at,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search
  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle role change
  const handleEditRole = (userToEdit: UserWithRole) => {
    setSelectedUser(userToEdit);
    setNewRole(userToEdit.role || 'viewer');
    setIsEditDialogOpen(true);
  };

  const handleConfirmRoleChange = () => {
    setIsEditDialogOpen(false);
    setIsConfirmDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser || !user) return;

    setSaving(true);
    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedUser.user_id)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ 
            role: newRole,
            assigned_at: new Date().toISOString(),
            assigned_by: user.id
          })
          .eq('user_id', selectedUser.user_id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUser.user_id,
            role: newRole,
            assigned_by: user.id
          });

        if (error) throw error;
      }

      toast.success(`Role updated to ${roleConfig[newRole].label}`);
      setIsConfirmDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const RoleBadge = ({ role }: { role: AppRole | null }) => {
    if (!role) {
      return <Badge variant="outline" className="text-muted-foreground">No Role</Badge>;
    }
    const config = roleConfig[role];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <BreadcrumbNav className="mb-4" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <UserCog className="h-8 w-8 text-primary" />
            User Role Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Assign and manage user roles across the organization
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(Object.entries(roleConfig) as [AppRole, typeof roleConfig.admin][]).map(([role, config]) => {
          const count = users.filter(u => u.role === role).length;
          const Icon = config.icon;
          return (
            <Card key={role}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{config.label}s</CardTitle>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {config.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users
              </CardTitle>
              <CardDescription>
                {users.length} users in the system
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Role Assigned</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((userRow) => (
                  <TableRow key={userRow.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {userRow.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {userRow.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={userRow.role} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {userRow.assigned_at 
                        ? format(new Date(userRow.assigned_at), 'MMM d, yyyy')
                        : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {userRow.last_login_at 
                        ? format(new Date(userRow.last_login_at), 'MMM d, yyyy')
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditRole(userRow)}
                        disabled={userRow.user_id === user?.id}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Edit Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.full_name || 'this user'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div>
                <RoleBadge role={selectedUser?.role || null} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-role">New Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(roleConfig) as [AppRole, typeof roleConfig.admin][]).map(([role, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {roleConfig[newRole].description}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmRoleChange}
              disabled={newRole === selectedUser?.role}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Role Change
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change <strong>{selectedUser?.full_name}</strong>'s role 
              from <strong>{selectedUser?.role ? roleConfig[selectedUser.role].label : 'No Role'}</strong> to{' '}
              <strong>{roleConfig[newRole].label}</strong>.
              <br /><br />
              This will immediately affect their access permissions. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveRole} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
