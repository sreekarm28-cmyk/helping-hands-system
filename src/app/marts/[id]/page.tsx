"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Store, Users, Calendar, Clock, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Mart {
  id: number;
  name: string;
  type: string;
  size: string;
  address: string;
  description: string | null;
}

interface Section {
  id: number;
  name: string;
  manpowerRequired: number;
  description: string | null;
}

export default function MartDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const martId = parseInt(params.id as string);

  const [mart, setMart] = useState<Mart | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Booking form state
  const [selectedSection, setSelectedSection] = useState('');
  const [slotDate, setSlotDate] = useState('');
  const [slotStartTime, setSlotStartTime] = useState('');
  const [slotEndTime, setSlotEndTime] = useState('');

  useEffect(() => {
    fetchMartDetails();
    fetchSections();
  }, [martId]);

  const fetchMartDetails = async () => {
    try {
      const response = await fetch(`/api/marts?id=${martId}`);
      if (!response.ok) throw new Error('Mart not found');
      const data = await response.json();
      setMart(data);
    } catch (error) {
      setError('Failed to load mart details');
    }
  };

  const fetchSections = async () => {
    try {
      const response = await fetch(`/api/sections?martId=${martId}&limit=100`);
      const data = await response.json();
      setSections(data);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setBookingLoading(true);

    try {
      if (!user) throw new Error('User not authenticated');

      // Check if slot date is in the future
      const selectedDate = new Date(slotDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        throw new Error('Cannot book slots for past dates');
      }

      // Validate time range
      if (slotStartTime >= slotEndTime) {
        throw new Error('End time must be after start time');
      }

      // Check existing bookings for this slot
      const existingBookings = await fetch(
        `/api/bookings?martId=${martId}&sectionId=${selectedSection}&slotDate=${slotDate}&status=confirmed`
      );
      const bookingsData = await existingBookings.json();

      const section = sections.find(s => s.id === parseInt(selectedSection));
      const isSlotFull = bookingsData.length >= (section?.manpowerRequired || 0);

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          martId,
          sectionId: parseInt(selectedSection),
          slotDate,
          slotStartTime,
          slotEndTime,
          status: isSlotFull ? 'waitlisted' : 'confirmed',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book slot');
      }

      const data = await response.json();
      
      if (data.status === 'waitlisted') {
        setSuccess('Slot is full. You have been added to the waitlist.');
      } else {
        setSuccess('Slot booked successfully!');
      }

      // Reset form
      setSelectedSection('');
      setSlotDate('');
      setSlotStartTime('');
      setSlotEndTime('');

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/bookings');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book slot');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['end_user']}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!mart) {
    return (
      <ProtectedRoute allowedRoles={['end_user']}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Mart not found</AlertDescription>
            </Alert>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <ProtectedRoute allowedRoles={['end_user']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          <Link href="/marts">
            <Button variant="ghost" className="mb-4 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Marts
            </Button>
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Mart Details */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{mart.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {mart.address}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {mart.type.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {mart.size}
                    </Badge>
                  </div>
                  {mart.description && (
                    <p className="text-sm text-muted-foreground">{mart.description}</p>
                  )}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Available Sections</p>
                    <p className="text-2xl font-bold">{sections.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Book Your Volunteer Slot</CardTitle>
                  <CardDescription>Select a section and time slot to volunteer</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBookSlot} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert className="border-green-200 bg-green-50 text-green-800">
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="section">Section *</Label>
                      <Select value={selectedSection} onValueChange={setSelectedSection} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id.toString()}>
                              <div className="flex items-center justify-between gap-4">
                                <span>{section.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  <Users className="inline h-3 w-3 mr-1" />
                                  {section.manpowerRequired} needed
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedSection && (
                        <p className="text-sm text-muted-foreground">
                          {sections.find(s => s.id === parseInt(selectedSection))?.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        min={today}
                        value={slotDate}
                        onChange={(e) => setSlotDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time *</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={slotStartTime}
                          onChange={(e) => setSlotStartTime(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">End Time *</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={slotEndTime}
                          onChange={(e) => setSlotEndTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Note:</strong> If the slot is full, you will be automatically added to the waitlist.
                        Maximum 2 cancellations allowed per day.
                      </AlertDescription>
                    </Alert>

                    <Button
                      type="submit"
                      className="w-full gap-2"
                      disabled={bookingLoading}
                    >
                      <Calendar className="h-4 w-4" />
                      {bookingLoading ? 'Booking...' : 'Book Slot'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
