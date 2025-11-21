"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Calendar, Clock, MapPin, Award, X, AlertCircle, CheckCircle2, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Booking {
  id: number;
  martId: number;
  sectionId: number;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
  status: string;
  attendanceMarked: boolean;
  hhpAwarded: number;
  createdAt: string;
}

interface Mart {
  id: number;
  name: string;
  address: string;
}

interface Section {
  id: number;
  name: string;
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [marts, setMarts] = useState<Record<number, Mart>>({});
  const [sections, setSections] = useState<Record<number, Section>>({});
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');
  const [todayCancellations, setTodayCancellations] = useState(0);

  useEffect(() => {
    if (user) {
      fetchBookings();
      fetchTodayCancellations();
    }
  }, [user]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchBookings = async () => {
    try {
      if (!user) return;

      const response = await fetch(`/api/bookings?userId=${user.id}&limit=100`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const bookingsData = await response.json();
      setBookings(bookingsData);

      // Fetch mart and section details
      const martIds = [...new Set(bookingsData.map((b: Booking) => b.martId))];
      const sectionIds = [...new Set(bookingsData.map((b: Booking) => b.sectionId))];

      const martsData: Record<number, Mart> = {};
      const sectionsData: Record<number, Section> = {};

      await Promise.all([
        ...martIds.map(async (id) => {
          const res = await fetch(`/api/marts?id=${id}`, {
            headers: getAuthHeaders()
          });
          if (res.ok) {
            martsData[id] = await res.json();
          }
        }),
        ...sectionIds.map(async (id) => {
          const res = await fetch(`/api/sections?id=${id}`, {
            headers: getAuthHeaders()
          });
          if (res.ok) {
            sectionsData[id] = await res.json();
          }
        }),
      ]);

      setMarts(martsData);
      setSections(sectionsData);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayCancellations = async () => {
    try {
      if (!user) return;
      
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/cancellations?userId=${user.id}&cancellationDate=${today}`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setTodayCancellations(data.length);
      }
    } catch (error) {
      console.error('Failed to fetch cancellations:', error);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    setError('');

    if (todayCancellations >= 2) {
      setError('You have reached the maximum of 2 cancellations per day');
      toast.error('Maximum cancellations reached for today');
      setCancellingId(null);
      return;
    }

    setIsCancelling(true);

    try {
      // Get booking details for toast message
      const booking = bookings.find(b => b.id === bookingId);
      const martName = booking ? marts[booking.martId]?.name : '';

      // Update booking status
      const updateResponse = await fetch(`/api/bookings?id=${bookingId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Record cancellation
      const today = new Date().toISOString().split('T')[0];
      await fetch('/api/cancellations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: user?.id,
          bookingId,
          cancellationDate: today,
        }),
      });

      setTodayCancellations((prev) => prev + 1);
      await fetchBookings();
      setCancellingId(null);
      
      toast.success(`Booking at ${martName || 'mart'} has been cancelled successfully`);
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      setError('Failed to cancel booking. Please try again.');
      toast.error('Failed to cancel booking. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      confirmed: { variant: 'default', icon: CheckCircle2 },
      completed: { variant: 'secondary', icon: CheckCircle2 },
      cancelled: { variant: 'destructive', icon: X },
      waitlisted: { variant: 'outline', icon: HelpCircle },
    };

    const { variant, icon: Icon } = variants[status] || variants.confirmed;

    return (
      <Badge variant={variant} className="gap-1 capitalize">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filterBookings = (status: string) => {
    if (status === 'all') return bookings;
    if (status === 'upcoming') {
      return bookings.filter(
        (b) => (b.status === 'confirmed' || b.status === 'waitlisted') && new Date(b.slotDate) >= new Date()
      );
    }
    return bookings.filter((b) => b.status === status);
  };

  const renderBookingCard = (booking: Booking) => {
    const mart = marts[booking.martId];
    const section = sections[booking.sectionId];
    const canCancel = booking.status === 'confirmed' && new Date(booking.slotDate) >= new Date();
    const isBeingCancelled = cancellingId === booking.id && isCancelling;

    return (
      <Card key={booking.id}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{mart?.name || 'Loading...'}</CardTitle>
              <CardDescription className="mt-1 space-y-1">
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3" />
                  {mart?.address || 'Loading...'}
                </div>
                <div className="text-sm font-medium text-foreground">
                  {section?.name || 'Loading...'}
                </div>
              </CardDescription>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
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

            {booking.status === 'completed' && (
              <div className="rounded-lg bg-green-50 p-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Earned {booking.hhpAwarded} HHP Points
                </span>
              </div>
            )}

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setCancellingId(booking.id)}
                disabled={todayCancellations >= 2 || isBeingCancelled}
              >
                {isBeingCancelled ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    Cancel Booking
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ProtectedRoute allowedRoles={['end_user']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">My Bookings</h1>
            <p className="text-muted-foreground">View and manage your volunteer bookings</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {todayCancellations > 0 && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have cancelled {todayCancellations} booking{todayCancellations > 1 ? 's' : ''} today.
                {todayCancellations >= 2 && ' Maximum limit reached.'}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              <TabsTrigger value="waitlisted">Waitlisted</TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <>
                <TabsContent value="all" className="space-y-4">
                  {filterBookings('all').length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="mx-auto mb-4 h-12 w-12 opacity-20" />
                        <p className="text-muted-foreground">No bookings yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {filterBookings('all').map(renderBookingCard)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="upcoming" className="space-y-4">
                  {filterBookings('upcoming').length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="mx-auto mb-4 h-12 w-12 opacity-20" />
                        <p className="text-muted-foreground">No upcoming bookings</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {filterBookings('upcoming').map(renderBookingCard)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4">
                  {filterBookings('completed').length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 opacity-20" />
                        <p className="text-muted-foreground">No completed bookings</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {filterBookings('completed').map(renderBookingCard)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="cancelled" className="space-y-4">
                  {filterBookings('cancelled').length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <X className="mx-auto mb-4 h-12 w-12 opacity-20" />
                        <p className="text-muted-foreground">No cancelled bookings</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {filterBookings('cancelled').map(renderBookingCard)}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="waitlisted" className="space-y-4">
                  {filterBookings('waitlisted').length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <HelpCircle className="mx-auto mb-4 h-12 w-12 opacity-20" />
                        <p className="text-muted-foreground">No waitlisted bookings</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {filterBookings('waitlisted').map(renderBookingCard)}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>

      <AlertDialog open={cancellingId !== null} onOpenChange={() => !isCancelling && setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This will count towards your daily cancellation limit (2 per day).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancellingId && handleCancelBooking(cancellingId)}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Booking'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}