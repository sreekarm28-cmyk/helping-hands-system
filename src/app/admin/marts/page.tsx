"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Store, Plus, Trash2, MapPin, User, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Mart {
  id: number;
  name: string;
  type: string;
  size: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string | null;
  storeAdminId: number | null;
}

interface StoreAdmin {
  id: number;
  name: string;
  email: string;
}

export default function AdminMartsPage() {
  const [marts, setMarts] = useState<Mart[]>([]);
  const [storeAdmins, setStoreAdmins] = useState<StoreAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'supermarket',
    size: 'medium',
    address: '',
    latitude: '',
    longitude: '',
    description: '',
    storeAdminId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [martsRes, usersRes] = await Promise.all([
        fetch('/api/marts?limit=1000'),
        fetch('/api/users?role=store_admin&limit=1000'),
      ]);

      const martsData = await martsRes.json();
      const usersData = await usersRes.json();

      setMarts(martsData);
      setStoreAdmins(usersData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Please enter valid latitude and longitude');
      }

      const response = await fetch('/api/marts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          size: formData.size,
          address: formData.address,
          latitude: lat,
          longitude: lng,
          description: formData.description || null,
          storeAdminId: formData.storeAdminId ? parseInt(formData.storeAdminId) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create mart');
      }

      setSuccess('Mart registered successfully!');
      await fetchData();
      
      setTimeout(() => {
        setDialogOpen(false);
        setSuccess('');
        setFormData({
          name: '',
          type: 'supermarket',
          size: 'medium',
          address: '',
          latitude: '',
          longitude: '',
          description: '',
          storeAdminId: '',
        });
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mart');
    }
  };

  const handleDeleteMart = async (martId: number, martName: string) => {
    if (!confirm(`Are you sure you want to delete ${martName}? This will also delete all associated sections and bookings.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/marts?id=${martId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete mart');
      }

      setSuccess('Mart deleted successfully!');
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete mart');
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredMarts = marts.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAssignedAdmin = (adminId: number | null) => {
    if (!adminId) return null;
    return storeAdmins.find((a) => a.id === adminId);
  };

  return (
    <ProtectedRoute allowedRoles={['main_admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mart Management</h1>
              <p className="text-muted-foreground">Register and manage marts</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Register Mart
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
                  placeholder="Search by name or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredMarts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Store className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p className="text-muted-foreground">No marts found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMarts.map((mart) => {
                const admin = getAssignedAdmin(mart.storeAdminId);
                return (
                  <Card key={mart.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{mart.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {mart.address}
                      </CardDescription>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {mart.type.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {mart.size}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {admin ? (
                        <div className="rounded-lg border p-3">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{admin.name}</p>
                              <p className="text-xs text-muted-foreground">{admin.email}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
                          No admin assigned
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDeleteMart(mart.id, mart.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove Mart
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Mart</DialogTitle>
            <DialogDescription>
              Add a new mart to the system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMart}>
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
                <Label htmlFor="name">Mart Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mall">Mall</SelectItem>
                      <SelectItem value="supermarket">Supermarket</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="home_essentials">Home Essentials</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Size *</Label>
                  <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="12.9716"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="77.5946"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the mart"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin">Assign Store Admin (Optional)</Label>
                <Select 
                  value={formData.storeAdminId} 
                  onValueChange={(value) => setFormData({ ...formData, storeAdminId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select admin (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No admin</SelectItem>
                    {storeAdmins.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id.toString()}>
                        {admin.name} ({admin.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Register Mart</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
