import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marts } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

const VALID_TYPES = ['mall', 'home_essentials', 'electronics', 'supermarket', 'other'];
const VALID_SIZES = ['small', 'medium', 'large'];

function validateType(type: string): boolean {
  return VALID_TYPES.includes(type);
}

function validateSize(size: string): boolean {
  return VALID_SIZES.includes(size);
}

function validateLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

function validateLongitude(lng: number): boolean {
  return lng >= -180 && lng <= 180;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single mart by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const mart = await db.select()
        .from(marts)
        .where(eq(marts.id, parseInt(id)))
        .limit(1);

      if (mart.length === 0) {
        return NextResponse.json({ 
          error: 'Mart not found',
          code: 'MART_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(mart[0], { status: 200 });
    }

    // List all marts with filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const type = searchParams.get('type');
    const size = searchParams.get('size');
    const storeAdminId = searchParams.get('storeAdminId');

    let query = db.select().from(marts);
    const conditions = [];

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(marts.name, `%${search}%`),
          like(marts.address, `%${search}%`)
        )
      );
    }

    // Type filter
    if (type) {
      if (!validateType(type)) {
        return NextResponse.json({ 
          error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
          code: 'INVALID_TYPE' 
        }, { status: 400 });
      }
      conditions.push(eq(marts.type, type));
    }

    // Size filter
    if (size) {
      if (!validateSize(size)) {
        return NextResponse.json({ 
          error: `Invalid size. Must be one of: ${VALID_SIZES.join(', ')}`,
          code: 'INVALID_SIZE' 
        }, { status: 400 });
      }
      conditions.push(eq(marts.size, size));
    }

    // Store admin filter
    if (storeAdminId) {
      if (isNaN(parseInt(storeAdminId))) {
        return NextResponse.json({ 
          error: "Valid storeAdminId is required",
          code: "INVALID_STORE_ADMIN_ID" 
        }, { status: 400 });
      }
      conditions.push(eq(marts.storeAdminId, parseInt(storeAdminId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, size, description, address, latitude, longitude, storeAdminId } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ 
        error: "Name is required and must be a non-empty string",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!type || typeof type !== 'string') {
      return NextResponse.json({ 
        error: "Type is required",
        code: "MISSING_TYPE" 
      }, { status: 400 });
    }

    if (!validateType(type)) {
      return NextResponse.json({ 
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        code: 'INVALID_TYPE' 
      }, { status: 400 });
    }

    if (!size || typeof size !== 'string') {
      return NextResponse.json({ 
        error: "Size is required",
        code: "MISSING_SIZE" 
      }, { status: 400 });
    }

    if (!validateSize(size)) {
      return NextResponse.json({ 
        error: `Invalid size. Must be one of: ${VALID_SIZES.join(', ')}`,
        code: 'INVALID_SIZE' 
      }, { status: 400 });
    }

    if (!address || typeof address !== 'string' || address.trim() === '') {
      return NextResponse.json({ 
        error: "Address is required and must be a non-empty string",
        code: "MISSING_ADDRESS" 
      }, { status: 400 });
    }

    if (latitude === undefined || latitude === null || typeof latitude !== 'number') {
      return NextResponse.json({ 
        error: "Latitude is required and must be a number",
        code: "MISSING_LATITUDE" 
      }, { status: 400 });
    }

    if (!validateLatitude(latitude)) {
      return NextResponse.json({ 
        error: "Latitude must be between -90 and 90",
        code: 'INVALID_LATITUDE' 
      }, { status: 400 });
    }

    if (longitude === undefined || longitude === null || typeof longitude !== 'number') {
      return NextResponse.json({ 
        error: "Longitude is required and must be a number",
        code: "MISSING_LONGITUDE" 
      }, { status: 400 });
    }

    if (!validateLongitude(longitude)) {
      return NextResponse.json({ 
        error: "Longitude must be between -180 and 180",
        code: 'INVALID_LONGITUDE' 
      }, { status: 400 });
    }

    // Validate optional storeAdminId
    if (storeAdminId !== undefined && storeAdminId !== null) {
      if (typeof storeAdminId !== 'number' || isNaN(storeAdminId)) {
        return NextResponse.json({ 
          error: "storeAdminId must be a valid number",
          code: "INVALID_STORE_ADMIN_ID" 
        }, { status: 400 });
      }
    }

    const now = new Date().toISOString();

    const insertData: any = {
      name: name.trim(),
      type,
      size,
      address: address.trim(),
      latitude,
      longitude,
      createdAt: now,
      updatedAt: now,
    };

    if (description !== undefined && description !== null && description.trim() !== '') {
      insertData.description = description.trim();
    }

    if (storeAdminId !== undefined && storeAdminId !== null) {
      insertData.storeAdminId = storeAdminId;
    }

    const newMart = await db.insert(marts)
      .values(insertData)
      .returning();

    return NextResponse.json(newMart[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if mart exists
    const existing = await db.select()
      .from(marts)
      .where(eq(marts.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Mart not found',
        code: 'MART_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, type, size, description, address, latitude, longitude, storeAdminId } = body;

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    // Validate and add name
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ 
          error: "Name must be a non-empty string",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
      updates.name = name.trim();
    }

    // Validate and add type
    if (type !== undefined) {
      if (!validateType(type)) {
        return NextResponse.json({ 
          error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
          code: 'INVALID_TYPE' 
        }, { status: 400 });
      }
      updates.type = type;
    }

    // Validate and add size
    if (size !== undefined) {
      if (!validateSize(size)) {
        return NextResponse.json({ 
          error: `Invalid size. Must be one of: ${VALID_SIZES.join(', ')}`,
          code: 'INVALID_SIZE' 
        }, { status: 400 });
      }
      updates.size = size;
    }

    // Validate and add address
    if (address !== undefined) {
      if (typeof address !== 'string' || address.trim() === '') {
        return NextResponse.json({ 
          error: "Address must be a non-empty string",
          code: "INVALID_ADDRESS" 
        }, { status: 400 });
      }
      updates.address = address.trim();
    }

    // Validate and add latitude
    if (latitude !== undefined) {
      if (typeof latitude !== 'number') {
        return NextResponse.json({ 
          error: "Latitude must be a number",
          code: "INVALID_LATITUDE" 
        }, { status: 400 });
      }
      if (!validateLatitude(latitude)) {
        return NextResponse.json({ 
          error: "Latitude must be between -90 and 90",
          code: 'INVALID_LATITUDE' 
        }, { status: 400 });
      }
      updates.latitude = latitude;
    }

    // Validate and add longitude
    if (longitude !== undefined) {
      if (typeof longitude !== 'number') {
        return NextResponse.json({ 
          error: "Longitude must be a number",
          code: "INVALID_LONGITUDE" 
        }, { status: 400 });
      }
      if (!validateLongitude(longitude)) {
        return NextResponse.json({ 
          error: "Longitude must be between -180 and 180",
          code: 'INVALID_LONGITUDE' 
        }, { status: 400 });
      }
      updates.longitude = longitude;
    }

    // Add description (allow null)
    if (description !== undefined) {
      updates.description = description && description.trim() !== '' ? description.trim() : null;
    }

    // Validate and add storeAdminId
    if (storeAdminId !== undefined) {
      if (storeAdminId !== null && (typeof storeAdminId !== 'number' || isNaN(storeAdminId))) {
        return NextResponse.json({ 
          error: "storeAdminId must be a valid number or null",
          code: "INVALID_STORE_ADMIN_ID" 
        }, { status: 400 });
      }
      updates.storeAdminId = storeAdminId;
    }

    const updated = await db.update(marts)
      .set(updates)
      .where(eq(marts.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if mart exists
    const existing = await db.select()
      .from(marts)
      .where(eq(marts.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Mart not found',
        code: 'MART_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(marts)
      .where(eq(marts.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Mart deleted successfully',
      mart: deleted[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}