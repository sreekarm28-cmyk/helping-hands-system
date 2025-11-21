"use client";

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Store, Navigation2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Mart {
  id: number;
  name: string;
  type: string;
  size: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string | null;
}

export default function MartsPage() {
  const [marts, setMarts] = useState<Mart[]>([]);
  const [filteredMarts, setFilteredMarts] = useState<Mart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    fetchMarts();
  }, []);

  useEffect(() => {
    filterMarts();
  }, [searchQuery, typeFilter, sizeFilter, marts, userLocation]);

  const fetchMarts = async () => {
    try {
      const response = await fetch('/api/marts?limit=100');
      const data = await response.json();
      setMarts(data);
    } catch (error) {
      console.error('Failed to fetch marts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError('');
      },
      (error) => {
        setLocationError('Unable to retrieve your location');
        console.error('Geolocation error:', error);
      }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filterMarts = () => {
    let filtered = [...marts];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (mart) =>
          mart.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          mart.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((mart) => mart.type === typeFilter);
    }

    // Size filter
    if (sizeFilter !== 'all') {
      filtered = filtered.filter((mart) => mart.size === sizeFilter);
    }

    // Sort by distance if location is available
    if (userLocation) {
      filtered = filtered
        .map((mart) => ({
          ...mart,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            mart.latitude,
            mart.longitude
          ),
        }))
        .sort((a, b) => a.distance - b.distance);
    }

    setFilteredMarts(filtered);
  };

  const getMartTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mall: 'Mall',
      home_essentials: 'Home Essentials',
      electronics: 'Electronics',
      supermarket: 'Supermarket',
      other: 'Other',
    };
    return labels[type] || type;
  };

  return (
    <ProtectedRoute allowedRoles={['end_user']}>
      <div className="min-h-screen bg-gray-50">
        <Navigation />

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Find Marts</h1>
            <p className="text-muted-foreground">Discover nearby marts and book your volunteer slot</p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button onClick={getLocation} variant="outline" className="gap-2">
                    <Navigation2 className="h-4 w-4" />
                    Use My Location
                  </Button>
                </div>

                {locationError && (
                  <p className="text-sm text-destructive">{locationError}</p>
                )}

                <div className="flex gap-4">
                  <div className="flex-1">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="mall">Mall</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="supermarket">Supermarket</SelectItem>
                        <SelectItem value="home_essentials">Home Essentials</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Select value={sizeFilter} onValueChange={setSizeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Sizes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sizes</SelectItem>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Marts List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredMarts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Store className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p className="text-muted-foreground">No marts found matching your criteria</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMarts.map((mart: any) => (
                <Card key={mart.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{mart.name}</CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {mart.address}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">{getMartTypeLabel(mart.type)}</Badge>
                      <Badge variant="outline" className="capitalize">
                        {mart.size}
                      </Badge>
                      {userLocation && mart.distance && (
                        <Badge variant="outline" className="gap-1">
                          <Navigation2 className="h-3 w-3" />
                          {mart.distance.toFixed(1)} km
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {mart.description && (
                      <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                        {mart.description}
                      </p>
                    )}
                    <Link href={`/marts/${mart.id}`}>
                      <Button className="w-full gap-2">
                        View Details & Book
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
