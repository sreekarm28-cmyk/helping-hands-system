"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Clock, Calendar, Users, Search, Award, AlertCircle } from 'lucide-react';

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
  hhpPoints: number;
}

interface Section {
  id: number;
  name: string;
}

export default function StoreAttendancePage() {
  const { user } = useAuth();
  const [mart, setMart] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<Record<number, User>>({});
  const [sections, setSections] = useState<Record<number, Section>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [markingAttendance, setMarkingAttendance] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchStoreData();
    }
  }, [user, dateFilter]);

  const fetchStoreData = async () => {
    try {
      const martsResponse = await fetch(`/api/marts?storeAdminId=${user?.id}`);
      const martsData = await martsResponse.json();
      
      if (martsData.length > 0) {
        const myMart = martsData[0];
        setMart(myMart);

        // Fetch bookings that need attendance marking (confirmed or completed)
        const bookingsResponse = await fetch(
          `/api/bookings?martId=${myMart.id}&limit=200`
        );
        const bookingsData = await bookingsResponse.json();
        
        // Filter for bookings that are eligible for attendance marking
        const eligibleBookings = bookingsData.filter((b: Booking) => {
          const bookingDate = new Date(b.slotDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return (
            (b.status === 'confirmed' || b.status === 'completed') &&
            bookingDate <= today
          );
        });
        
        setBookings(eligibleBookings);

        // Fetch sections
        const sectionsResponse = await fetch(`/api/sections?martId=${myMart.id}&limit=100`);
        const sectionsData = await sectionsResponse.json();
        const sectionsMap: Record<number, Section> = {};
        sectionsData.forEach((s: Section) => {
          sectionsMap[s.id] = s;
        });
        setSections(sectionsMap);

        // Fetch user details
        const userIds = [...new Set(eligibleBookings.map((b: Booking) => b.userId))];
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

  const calculateHHP = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const hours = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
    // Award 10 HHP per hour (rounded)
    return Math.round(hours * 10);
  };

  const handleMarkAttendance = async (booking: Booking) => {
    setMarkingAttendance(booking.id);
    setError('');
    setSuccess('');

    try {
      const hhpToAward = calculateHHP(booking.slotStartTime, booking.slotEndTime);

      // Update booking status
      const updateBookingResponse = await fetch(`/api/bookings?id=${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          attendanceMarked: true,
          hhpAwarded: hhpToAward,
        }),
      });

      if (!updateBookingResponse.ok) {
        throw new Error('Failed to mark attendance');
      }

      // Update user's HHP points
      const currentUser = users[booking.userId];
      const updateUserResponse = await fetch(`/api/users?id=${booking.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hhpPoints: currentUser.hhpPoints + hhpToAward,
        }),
      });

      if (!updateUserResponse.ok) {
        throw new Error('Failed to update HHP points');
      }

      setSuccess(`Attendance marked! ${hhpToAward} HHP points awarded to ${currentUser.name}`);
      
      // Refresh data
      await fetchStoreData();
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark attendance');
      setTimeout(() => setError(''), 5000);
    } finally {
      setMarkingAttendance(null);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter((b) => b.slotDate === dateFilter);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((b) => {
        const bookingUser = users[b.userId];
        const section = sections[b.sectionId];
        return (
          bookingUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookingUser?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section?.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    return filtered.sort((a, b) => {
      // Sort by date (most recent first), then by attendance status
      const dateCompare = b.slotDate.localeCompare(a.slotDate);
      if (dateCompare !== 0) return dateCompare;
      return a.attendanceMarked === b.attendanceMarked ? 0 : a.attendanceMarked ? 1 : -1;
    });
  };

  const filteredBookings = filterBookings();
  const pendingCount = filteredBookings.filter(b => !b.attendanceMarked).length;
  const markedCount = filteredBookings.filter(b => b.attendanceMarked).length;

  return (
    <ProtectedRoute allowedRoles={['store_admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Mark Attendance</h1>
            <p className="text-muted-foreground">
              {mart ? `Track volunteer attendance at ${mart.name}` : 'Loading...'}
            </p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting attendance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Marked</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{markedCount}</div>
                <p className="text-xs text-muted-foreground">Attendance confirmed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredBookings.length}</div>
                <p className="text-xs text-muted-foreground">Eligible bookings</p>
              </CardContent>
            </Card>
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

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or section..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="w-48">
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p className="text-muted-foreground">No bookings found for the selected date</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try selecting a different date or clearing filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const bookingUser = users[booking.userId];
                const section = sections[booking.sectionId];
                const hhpToAward = calculateHHP(booking.slotStartTime, booking.slotEndTime);

                return (
                  <Card key={booking.id} className={booking.attendanceMarked ? 'opacity-60' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-lg">{bookingUser?.name || 'Loading...'}</CardTitle>
                            {booking.attendanceMarked ? (
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Marked
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <Clock className="h-3 w-3" />
                                Pending
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1">
                            {bookingUser?.email || 'Loading...'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{section?.name || 'Loading...'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(booking.slotDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {booking.slotStartTime} - {booking.slotEndTime}
                            </span>
                          </div>
                        </div>

                        {booking.attendanceMarked ? (
                          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-900">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="font-medium">
                                Attendance marked • {booking.hhpAwarded} HHP points awarded
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Award className="h-4 w-4 text-primary" />
                              <span>Will award <strong>{hhpToAward} HHP</strong> points</span>
                            </div>
                            <Button
                              onClick={() => handleMarkAttendance(booking)}
                              disabled={markingAttendance === booking.id}
                              className="gap-2"
                            >
                              {markingAttendance === booking.id ? (
                                <>
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  Marking...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4" />
                                  Mark Present
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
