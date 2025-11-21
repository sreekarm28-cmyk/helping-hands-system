"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Trash2, Search, Award, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  hhpPoints: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'end_user',
    password: 'password123',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('bearer_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?limit=1000', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      setUsers(data.filter((u: User) => u.role !== 'main_admin'));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      setSuccess('User created successfully!');
      await fetchUsers();
      
      setTimeout(() => {
        setDialogOpen(false);
        setSuccess('');
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: 'end_user',
          password: 'password123',
        });
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    
    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users?id=${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Show success toast
      toast.success(`User "${userToDelete.name}" has been removed successfully`);
      
      // Close dialog
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      
      // Refresh the user list immediately
      await fetchUsers();
      
    } catch (err) {
      toast.error('Failed to delete user. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filterUsers = (role: string) => {
    let filtered = users;

    if (role !== 'all') {
      filtered = filtered.filter((u) => u.role === role);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      end_user: 'default',
      store_admin: 'secondary',
    };
    const labels: Record<string, string> = {
      end_user: 'End User',
      store_admin: 'Store Admin',
    };
    return (
      <Badge variant={variants[role] || 'default'}>
        {labels[role] || role}
      </Badge>
    );
  };

  const renderUserCard = (user: User) => (
    <Card key={user.id}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{user.name}</CardTitle>
            <CardDescription className="mt-1 space-y-1">
              <div className="text-sm">{user.email}</div>
              {user.phone && <div className="text-sm">{user.phone}</div>}
            </CardDescription>
          </div>
          {getRoleBadge(user.role)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {user.role === 'end_user' && (
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-3">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{user.hhpPoints} HHP Points</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => handleOpenDeleteDialog(user)}
          >
            <Trash2 className="h-3 w-3" />
            Remove User
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const endUsers = filterUsers('end_user');
  const storeAdmins = filterUsers('store_admin');
  const allFiltered = filterUsers('all');

  return (
    <ProtectedRoute allowedRoles={['main_admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">Register and manage system users</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Register User
            </Button>
          </div>

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All ({allFiltered.length})</TabsTrigger>
              <TabsTrigger value="end_user">End Users ({endUsers.length})</TabsTrigger>
              <TabsTrigger value="store_admin">Store Admins ({storeAdmins.length})</TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <>
                <TabsContent value="all" className="space-y-4">
                  {allFiltered.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Users className="mx-auto mb-4 h-12 w-12 opacity-20" />
                        <p className="text-muted-foreground">No users found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {allFiltered.map(renderUserCard)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="end_user" className="space-y-4">
                  {endUsers.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Users className="mx-auto mb-4 h-12 w-12 opacity-20" />
                        <p className="text-muted-foreground">No end users found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {endUsers.map(renderUserCard)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="store_admin" className="space-y-4">
                  {storeAdmins.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Users className="mx-auto mb-4 h-12 w-12 opacity-20" />
                        <p className="text-muted-foreground">No store admins found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {storeAdmins.map(renderUserCard)}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register New User</DialogTitle>
            <DialogDescription>
              Create a new user account for the system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91-1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="end_user">End User</SelectItem>
                    <SelectItem value="store_admin">Store Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Default Password *</Label>
                <Input
                  id="password"
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  User can change this after first login
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{userToDelete?.name}"? This action cannot be undone and will permanently delete their account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)} disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}