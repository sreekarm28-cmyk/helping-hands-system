"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Calendar, MapPin, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Booking {
  id: number;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
  status: string;
  hhpAwarded: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    totalHours: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user) return;
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/bookings?userId=${user.id}&limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        
        setBookings(data);
        
        const upcoming = data.filter((b: Booking) => b.status === 'confirmed').length;
        const completed = data.filter((b: Booking) => b.status === 'completed').length;
        
        // Calculate total hours from completed bookings
        const totalHours = data
          .filter((b: Booking) => b.status === 'completed')
          .reduce((sum: number, b: Booking) => {
            const [startHour, startMin] = b.slotStartTime.split(':').map(Number);
            const [endHour, endMin] = b.slotEndTime.split(':').map(Number);
            const hours = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
            return sum + hours;
          }, 0);
        
        setStats({ upcoming, completed, totalHours: Math.round(totalHours) });
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed')
    .sort((a, b) => a.slotDate.localeCompare(b.slotDate))
    .slice(0, 3);

  return (
    <ProtectedRoute allowedRoles={['end_user']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="text-muted-foreground">Track your volunteer activities and earn Helping Hands Points</p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">HHP Points</CardTitle>
                <Award className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user?.hhpPoints || 0}</div>
                <p className="text-xs text-muted-foreground">Total points earned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Slots</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.upcoming}</div>
                <p className="text-xs text-muted-foreground">Confirmed bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.completed}</div>
                <p className="text-xs text-muted-foreground">Total sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <Clock className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.totalHours}</div>
                <p className="text-xs text-muted-foreground">Hours volunteered</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Find marts and book your next volunteer slot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/marts">
                  <Button className="w-full justify-start gap-2" size="lg">
                    <MapPin className="h-5 w-5" />
                    Find Nearby Marts
                  </Button>
                </Link>
                <Link href="/bookings">
                  <Button variant="outline" className="w-full justify-start gap-2" size="lg">
                    <Calendar className="h-5 w-5" />
                    View My Bookings
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Upcoming Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Slots</CardTitle>
                <CardDescription>Your confirmed volunteer sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Calendar className="mx-auto mb-2 h-12 w-12 opacity-20" />
                    <p>No upcoming bookings</p>
                    <Link href="/marts">
                      <Button variant="link" className="mt-2">Book a slot</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map((booking) => (
                      <div key={booking.id} className="rounded-lg border p-4">
                        <div className="flex items-start justify-between">
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
                          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                            Confirmed
                          </span>
                        </div>
                      </div>
                    ))}
                    {upcomingBookings.length > 0 && (
                      <Link href="/bookings">
                        <Button variant="ghost" className="w-full">View All</Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Your Impact
              </CardTitle>
              <CardDescription>Track your contribution over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
                <div className="text-center text-muted-foreground">
                  <Award className="mx-auto mb-2 h-12 w-12 opacity-20" />
                  <p>Keep volunteering to see your progress!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}