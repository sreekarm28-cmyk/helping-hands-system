"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HandHeart, User, LogOut, LayoutDashboard, MapPin, Calendar, Award, Store, Users, Settings } from 'lucide-react';

export default function Navigation() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getNavLinks = () => {
    if (user.role === 'end_user') {
      return [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/marts', label: 'Find Marts', icon: MapPin },
        { href: '/bookings', label: 'My Bookings', icon: Calendar },
        { href: '/profile', label: 'Profile', icon: User },
      ];
    } else if (user.role === 'store_admin') {
      return [
        { href: '/store/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/store/bookings', label: 'Bookings', icon: Calendar },
        { href: '/store/sections', label: 'Sections', icon: Store },
        { href: '/store/attendance', label: 'Attendance', icon: Users },
      ];
    } else {
      return [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/marts', label: 'Marts', icon: Store },
        { href: '/admin/reports', label: 'Reports', icon: Award },
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href={user.role === 'main_admin' ? '/admin/dashboard' : user.role === 'store_admin' ? '/store/dashboard' : '/dashboard'} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <HandHeart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">KollabHands</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" className="gap-2">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user.role === 'end_user' && (
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{user.hhpPoints} HHP</span>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden md:inline">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="mt-1 text-xs font-normal text-muted-foreground">
                    {user.role === 'end_user' ? 'End User' : user.role === 'store_admin' ? 'Store Admin' : 'Main Admin'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.role === 'end_user' && (
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
