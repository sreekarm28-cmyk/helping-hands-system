"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/ui/card';
import { Badge } from '@/components/ui/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Users, Search, Filter } from 'lucide-react';

interface Booking {
  id: number;
  userId: number;
  sectionId: number;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
  status: string;
  attendanceMarked: boolean;
  hhpAwarded: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

interface Section {
  id: number;
  name: string;
}

export default function StoreBookingsPage() {
  const { user } = useAuth();
  const [mart, setMart] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<Record<number, User>>({});
  const [sections, setSections] = useState<Record<number, Section>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (user) {
      fetchStoreData();
    }
  }, [user]);

  const fetchStoreData = async () => {
    try {
      const martsResponse = await fetch(`/api/marts?storeAdminId=${user?.id}`);
      const martsData = await martsResponse.json();
      
      if (martsData.length > 0) {
        const myMart = martsData[0];
        setMart(myMart);

        // Fetch bookings
        const bookingsResponse = await fetch(`/api/bookings?martId=${myMart.id}&limit=200`);
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);

        // Fetch sections
        const sectionsResponse = await fetch(`/api/sections?martId=${myMart.id}&limit=100`);
        const sectionsData = await sectionsResponse.json();
        const sectionsMap: Record<number, Section> = {};
        sectionsData.forEach((s: Section) => {
          sectionsMap[s.id] = s;
        });
        setSections(sectionsMap);

        // Fetch user details
        const userIds = [...new Set(bookingsData.map((b: Booking) => b.userId))];
        const usersMap: Record<number, User> = {};
        await Promise.all(
          userIds.map(async (id) => {
            const res = await fetch(`/api/users?id=${id}`);
            usersMap[id] = await res.json();
          })
        );
        setUsers(usersMap);
      }
    } catch (error) {
      console.error('Failed to fetch store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = (status: string) => {
    let filtered = bookings;

    // Status filter
    if (status !== 'all') {
      filtered = filtered.filter((b) => b.status === status);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((b) => {
        const user = users[b.userId];
        const section = sections[b.sectionId];
        return (
          user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // Section filter
    if (sectionFilter !== 'all') {
      filtered = filtered.filter((b) => b.sectionId === parseInt(sectionFilter));
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter((b) => b.slotDate === dateFilter);
    }

    return filtered.sort((a, b) => b.slotDate.localeCompare(a.slotDate));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      confirmed: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
      waitlisted: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'default'} className="capitalize">
        {status}
      </Badge>
    );
  };

  const renderBookingCard = (booking: Booking) => {
    const bookingUser = users[booking.userId];
    const section = sections[booking.sectionId];

    return (
      <Card key={booking.id}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{bookingUser?.name || 'Loading...'}</CardTitle>
              <CardDescription className="mt-1 space-y-1">
                <div className="text-sm">{bookingUser?.email || 'Loading...'}</div>
                {bookingUser?.phone && (
                  <div className="text-sm">{bookingUser.phone}</div>
                )}
              </CardDescription>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{section?.name || 'Loading...'}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {new Date(booking.slotDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {booking.slotStartTime} - {booking.slotEndTime}
                </span>
              </div>
            </div>
            {booking.attendanceMarked && (
              <div className="rounded-lg bg-green-50 p-2 text-sm text-green-900">
                ✓ Attendance marked • {booking.hhpAwarded} HHP awarded
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['store_admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Bookings Overview</h1>
            <p className="text-muted-foreground">
              {mart ? `All bookings for ${mart.name}` : 'Loading...'}
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by user name, email, or section..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Filter className="h-9 w-9 rounded-md border p-2 text-muted-foreground" />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Select value={sectionFilter} onValueChange={setSectionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Sections" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sections</SelectItem>
                        {Object.values(sections).map((section) => (
                          <SelectItem key={section.id} value={section.id.toString()}>
                            {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      placeholder="Filter by date"
                    />
                  </div>
                  {(searchQuery || sectionFilter !== 'all' || dateFilter) && (
                    <div className="flex items-center">
                      <button
                        className="text-sm text-primary hover:underline"
                        onClick={() => {
                          setSearchQuery('');
                          setSectionFilter('all');
                          setDateFilter('');
                        }}
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
              <TabsTrigger value="confirmed">
                Confirmed ({bookings.filter((b) => b.status === 'confirmed').length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({bookings.filter((b) => b.status === 'completed').length})
              </TabsTrigger>
              <TabsTrigger value="waitlisted">
                Waitlisted ({bookings.filter((b) => b.status === 'waitlisted').length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Cancelled ({bookings.filter((b) => b.status === 'cancelled').length})
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <>
                {['all', 'confirmed', 'completed', 'waitlisted', 'cancelled'].map((status) => (
                  <TabsContent key={status} value={status} className="space-y-4">
                    {filterBookings(status).length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Calendar className="mx-auto mb-4 h-12 w-12 opacity-20" />
                          <p className="text-muted-foreground">No bookings found</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filterBookings(status).map(renderBookingCard)}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </>
            )}
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}
