"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Store, Users, Calendar, CheckCircle2, Clock, TrendingUp, Pencil, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Mart {
  id: number;
  name: string;
  type: string;
  size: string;
  address: string;
  description: string | null;
  latitude: number;
  longitude: number;
}

interface Booking {
  id: number;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
  status: string;
  attendanceMarked: boolean;
}

export default function StoreDashboardPage() {
  const { user } = useAuth();
  const [mart, setMart] = useState<Mart | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalSections: 0,
    todayBookings: 0,
    pendingAttendance: 0,
    totalVolunteers: 0,
  });

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    size: '',
    description: '',
  });

  useEffect(() => {
    if (user) {
      fetchStoreData();
    }
  }, [user]);

  const fetchStoreData = async () => {
    try {
      // Fetch mart managed by this store admin
      const martsResponse = await fetch(`/api/marts?storeAdminId=${user?.id}`);
      const martsData = await martsResponse.json();
      
      if (martsData.length > 0) {
        const myMart = martsData[0];
        setMart(myMart);

        // Fetch sections
        const sectionsResponse = await fetch(`/api/sections?martId=${myMart.id}&limit=100`);
        const sectionsData = await sectionsResponse.json();
        setSections(sectionsData);

        // Fetch bookings
        const bookingsResponse = await fetch(`/api/bookings?martId=${myMart.id}&limit=100`);
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);

        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookingsData.filter(
          (b: Booking) => b.slotDate === today && b.status === 'confirmed'
        ).length;
        
        const pendingAttendance = bookingsData.filter(
          (b: Booking) => b.status === 'confirmed' && !b.attendanceMarked && new Date(b.slotDate) <= new Date()
        ).length;

        const uniqueVolunteers = new Set(bookingsData.map((b: any) => b.userId)).size;

        setStats({
          totalSections: sectionsData.length,
          todayBookings,
          pendingAttendance,
          totalVolunteers: uniqueVolunteers,
        });
      }
    } catch (error) {
      console.error('Failed to fetch store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = () => {
    if (mart) {
      setFormData({
        name: mart.name,
        type: mart.type,
        size: mart.size,
        description: mart.description || '',
      });
      setEditDialogOpen(true);
      setError('');
      setSuccess('');
    }
  };

  const handleUpdateMart = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!mart) throw new Error('No mart found');

      const response = await fetch(`/api/marts?id=${mart.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          size: formData.size,
          description: formData.description || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update mart');
      }

      const updatedMart = await response.json();
      setMart(updatedMart);
      setSuccess('Store details updated successfully!');
      
      setTimeout(() => {
        setEditDialogOpen(false);
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update store');
    }
  };

  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed' && new Date(b.slotDate) >= new Date())
    .sort((a, b) => a.slotDate.localeCompare(b.slotDate))
    .slice(0, 5);

  return (
    <ProtectedRoute allowedRoles={['store_admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Store Dashboard</h1>
            <p className="text-muted-foreground">
              {mart ? `Managing ${mart.name}` : 'Loading your store...'}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !mart ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Store className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p className="text-muted-foreground">No mart assigned to your account</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please contact the main admin to assign a mart to your account
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="mb-8 grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
                    <Store className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalSections}</div>
                    <p className="text-xs text-muted-foreground">Active sections</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.todayBookings}</div>
                    <p className="text-xs text-muted-foreground">Confirmed volunteers</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Pending Attendance</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingAttendance}</div>
                    <p className="text-xs text-muted-foreground">Needs marking</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Volunteers</CardTitle>
                    <Users className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalVolunteers}</div>
                    <p className="text-xs text-muted-foreground">Unique users</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Store Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Store Information</CardTitle>
                        <CardDescription>Your assigned mart details</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={handleOpenEditDialog}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Store Name</p>
                      <p className="text-lg font-semibold">{mart.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="text-sm">{mart.address}</p>
                    </div>
                    {mart.description && (
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="text-sm">{mart.description}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {mart.type.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {mart.size}
                      </Badge>
                    </div>
                    <div className="pt-4 space-y-2">
                      <Link href="/store/sections">
                        <Button className="w-full" variant="outline">
                          Manage Sections
                        </Button>
                      </Link>
                      <Link href="/store/bookings">
                        <Button className="w-full" variant="outline">
                          View All Bookings
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common store management tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/store/attendance">
                      <Button className="w-full justify-start gap-2" size="lg">
                        <CheckCircle2 className="h-5 w-5" />
                        Mark Attendance
                      </Button>
                    </Link>
                    <Link href="/store/sections">
                      <Button variant="outline" className="w-full justify-start gap-2" size="lg">
                        <Store className="h-5 w-5" />
                        Manage Sections
                      </Button>
                    </Link>
                    <Link href="/store/bookings">
                      <Button variant="outline" className="w-full justify-start gap-2" size="lg">
                        <Calendar className="h-5 w-5" />
                        View Bookings
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Bookings */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Upcoming Bookings
                  </CardTitle>
                  <CardDescription>Next volunteer sessions at your store</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingBookings.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <Calendar className="mx-auto mb-2 h-12 w-12 opacity-20" />
                      <p>No upcoming bookings</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingBookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <p className="font-medium">
                              {new Date(booking.slotDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.slotStartTime} - {booking.slotEndTime}
                            </p>
                          </div>
                          <Badge>Confirmed</Badge>
                        </div>
                      ))}
                      <Link href="/store/bookings">
                        <Button variant="ghost" className="w-full">View All Bookings</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Edit Mart Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Store Details</DialogTitle>
            <DialogDescription>
              Update your mart's information (FR-10)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateMart}>
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
                <Label htmlFor="name">Store Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Store Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mall">Mall</SelectItem>
                    <SelectItem value="home_essentials">Home Essentials</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="supermarket">Supermarket</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Store Size *</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => setFormData({ ...formData, size: value })}
                >
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

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of your store"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Store</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}