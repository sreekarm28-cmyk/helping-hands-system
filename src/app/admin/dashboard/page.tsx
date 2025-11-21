"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Store, Calendar, Award, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMarts: 0,
    totalBookings: 0,
    totalHHP: 0,
    endUsers: 0,
    storeAdmins: 0,
    activeBookings: 0,
    completedBookings: 0,
  });

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const [usersRes, martsRes, bookingsRes] = await Promise.all([
        fetch('/api/users?limit=1000'),
        fetch('/api/marts?limit=1000'),
        fetch('/api/bookings?limit=10000'),
      ]);

      const users = await usersRes.json();
      const marts = await martsRes.json();
      const bookings = await bookingsRes.json();

      const endUsers = users.filter((u: any) => u.role === 'end_user').length;
      const storeAdmins = users.filter((u: any) => u.role === 'store_admin').length;
      const activeBookings = bookings.filter((b: any) => b.status === 'confirmed').length;
      const completedBookings = bookings.filter((b: any) => b.status === 'completed').length;
      const totalHHP = users.reduce((sum: number, u: any) => sum + (u.hhpPoints || 0), 0);

      setStats({
        totalUsers: users.length,
        totalMarts: marts.length,
        totalBookings: bookings.length,
        totalHHP,
        endUsers,
        storeAdmins,
        activeBookings,
        completedBookings,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['main_admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">System-wide overview and management</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Main Stats */}
              <div className="mb-8 grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.endUsers} volunteers, {stats.storeAdmins} store admins
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Marts</CardTitle>
                    <Store className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalMarts}</div>
                    <p className="text-xs text-muted-foreground">Registered stores</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalBookings}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.activeBookings} active, {stats.completedBookings} completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total HHP</CardTitle>
                    <Award className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalHHP}</div>
                    <p className="text-xs text-muted-foreground">Points awarded</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="grid gap-8 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage system users and roles</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/admin/users">
                      <Button className="w-full justify-start gap-2" size="lg">
                        <Users className="h-5 w-5" />
                        Manage Users
                      </Button>
                    </Link>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="rounded-lg border p-3">
                        <p className="text-sm text-muted-foreground">End Users</p>
                        <p className="text-2xl font-bold">{stats.endUsers}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-sm text-muted-foreground">Store Admins</p>
                        <p className="text-2xl font-bold">{stats.storeAdmins}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Mart Management</CardTitle>
                    <CardDescription>Manage stores and assignments</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/admin/marts">
                      <Button className="w-full justify-start gap-2" size="lg" variant="outline">
                        <Store className="h-5 w-5" />
                        Manage Marts
                      </Button>
                    </Link>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm text-muted-foreground">Registered Marts</p>
                      <p className="text-2xl font-bold">{stats.totalMarts}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reports & Analytics</CardTitle>
                    <CardDescription>View performance and HHP reports</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/admin/reports">
                      <Button className="w-full justify-start gap-2" size="lg" variant="outline">
                        <TrendingUp className="h-5 w-5" />
                        View Reports
                      </Button>
                    </Link>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="rounded-lg border p-3">
                        <p className="text-sm text-muted-foreground">Active</p>
                        <p className="text-2xl font-bold">{stats.activeBookings}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold">{stats.completedBookings}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Overview</CardTitle>
                    <CardDescription>Key metrics and statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <Activity className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Avg HHP per User</p>
                            <p className="text-lg font-bold">
                              {stats.endUsers > 0 ? Math.round(stats.totalHHP / stats.endUsers) : 0}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                            <Calendar className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Completion Rate</p>
                            <p className="text-lg font-bold">
                              {stats.totalBookings > 0
                                ? Math.round((stats.completedBookings / stats.totalBookings) * 100)
                                : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
