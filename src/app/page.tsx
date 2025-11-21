"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { HandHeart, Users, Store, Award } from 'lucide-react';
import { Button } from '@/components/ui/ui/button';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'main_admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'store_admin') {
        router.push('/store/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary">
              <HandHeart className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>

          <h1 className="mb-4 text-5xl font-bold tracking-tight">KollabHands</h1>
          <p className="mb-2 text-xl text-muted-foreground">Helping Hands Volunteer System</p>
          <p className="mb-8 text-lg text-muted-foreground">
            Empowering employees to volunteer in marts during weekends and festivals
          </p>

          <div className="mb-12 flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                <Users className="h-5 w-5" />
                Sign In
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">For Volunteers</h3>
              <p className="text-sm text-muted-foreground">
                Find nearby marts, book slots, and earn Helping Hands Points for your contributions
              </p>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <Store className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">For Store Admins</h3>
              <p className="text-sm text-muted-foreground">
                Manage your mart, define sections, track bookings, and mark volunteer attendance
              </p>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-semibold">System Management</h3>
              <p className="text-sm text-muted-foreground">
                Complete oversight of users, marts, bookings, and performance analytics
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}