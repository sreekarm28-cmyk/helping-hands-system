"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, Users, Calendar, Clock, CheckCircle2 } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  hhpPoints: number;
}

interface Booking {
  id: number;
  userId: number;
  slotDate: string;
  slotStartTime: string;
  slotEndTime: string;
  status: string;
  hhpAwarded: number;
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalHHP: 0,
    totalHours: 0,
    completedBookings: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, bookingsRes] = await Promise.all([
        fetch('/api/users?role=end_user&limit=1000'),
        fetch('/api/bookings?limit=10000'),
      ]);

      const usersData = await usersRes.json();
      const bookingsData = await bookingsRes.json();

      setUsers(usersData);
      setBookings(bookingsData);

      // Calculate stats
      const totalHHP = usersData.reduce((sum: number, u: User) => sum + u.hhpPoints, 0);
      const completedBookings = bookingsData.filter((b: Booking) => b.status === 'completed').length;
      const activeUsers = usersData.filter((u: User) => u.hhpPoints > 0).length;

      const totalHours = bookingsData
        .filter((b: Booking) => b.status === 'completed')
        .reduce((sum: number, b: Booking) => {
          const [startHour, startMin] = b.slotStartTime.split(':').map(Number);
          const [endHour, endMin] = b.slotEndTime.split(':').map(Number);
          const hours = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
          return sum + hours;
        }, 0);

      setStats({
        totalHHP,
        totalHours: Math.round(totalHours),
        completedBookings,
        activeUsers,
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const topPerformers = [...users]
    .sort((a, b) => b.hhpPoints - a.hhpPoints)
    .slice(0, 10);

  const recentCompletedBookings = [...bookings]
    .filter(b => b.status === 'completed')
    .sort((a, b) => b.slotDate.localeCompare(a.slotDate))
    .slice(0, 10);

  return (
    <ProtectedRoute allowedRoles={['main_admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">System performance and HHP reports</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="mb-8 grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total HHP Awarded</CardTitle>
                    <Award className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalHHP}</div>
                    <p className="text-xs text-muted-foreground">Points distributed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalHours}</div>
                    <p className="text-xs text-muted-foreground">Volunteer hours</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.completedBookings}</div>
                    <p className="text-xs text-muted-foreground">Successful bookings</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active Volunteers</CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    <p className="text-xs text-muted-foreground">With HHP earned</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Top Performers
                    </CardTitle>
                    <CardDescription>Volunteers with highest HHP points</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topPerformers.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <Users className="mx-auto mb-2 h-12 w-12 opacity-20" />
                        <p>No performance data yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {topPerformers.map((user, index) => (
                          <div key={user.id} className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="gap-1">
                              <Award className="h-3 w-3" />
                              {user.hhpPoints}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Recent Completed Sessions
                    </CardTitle>
                    <CardDescription>Latest volunteer activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentCompletedBookings.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <Calendar className="mx-auto mb-2 h-12 w-12 opacity-20" />
                        <p>No completed sessions yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentCompletedBookings.map((booking) => {
                          const user = users.find(u => u.id === booking.userId);
                          return (
                            <div key={booking.id} className="rounded-lg border p-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{user?.name || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(booking.slotDate).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {booking.slotStartTime} - {booking.slotEndTime}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="gap-1">
                                  <Award className="h-3 w-3" />
                                  {booking.hhpAwarded}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Summary Stats */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>Overall system metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Average HHP per User</p>
                      <p className="text-2xl font-bold">
                        {users.length > 0 ? Math.round(stats.totalHHP / users.length) : 0}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Average Hours per Session</p>
                      <p className="text-2xl font-bold">
                        {stats.completedBookings > 0
                          ? (stats.totalHours / stats.completedBookings).toFixed(1)
                          : 0}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Participation Rate</p>
                      <p className="text-2xl font-bold">
                        {users.length > 0 ? Math.round((stats.activeUsers / users.length) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
