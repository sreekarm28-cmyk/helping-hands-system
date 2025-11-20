import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const VALID_STATUSES = ['confirmed', 'cancelled', 'completed', 'waitlisted'] as const;

function validateDateFormat(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
}

function validateTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

function isTimeAfter(startTime: string, endTime: string): boolean {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  if (endHour > startHour) return true;
  if (endHour === startHour && endMinute > startMinute) return true;
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const booking = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, parseInt(id)))
        .limit(1);

      if (booking.length === 0) {
        return NextResponse.json(
          { error: 'Booking not found', code: 'BOOKING_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(booking[0], { status: 200 });
    }

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userId = searchParams.get('userId');
    const martId = searchParams.get('martId');
    const sectionId = searchParams.get('sectionId');
    const status = searchParams.get('status');
    const slotDate = searchParams.get('slotDate');

    const conditions = [];

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(bookings.userId, parseInt(userId)));
    }

    if (martId) {
      if (isNaN(parseInt(martId))) {
        return NextResponse.json(
          { error: 'Valid martId is required', code: 'INVALID_MART_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(bookings.martId, parseInt(martId)));
    }

    if (sectionId) {
      if (isNaN(parseInt(sectionId))) {
        return NextResponse.json(
          { error: 'Valid sectionId is required', code: 'INVALID_SECTION_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(bookings.sectionId, parseInt(sectionId)));
    }

    if (status) {
      if (!VALID_STATUSES.includes(status as any)) {
        return NextResponse.json(
          { 
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
            code: 'INVALID_STATUS' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(bookings.status, status));
    }

    if (slotDate) {
      if (!validateDateFormat(slotDate)) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD', code: 'INVALID_DATE_FORMAT' },
          { status: 400 }
        );
      }
      conditions.push(eq(bookings.slotDate, slotDate));
    }

    let query = db.select().from(bookings);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      martId, 
      sectionId, 
      slotDate, 
      slotStartTime, 
      slotEndTime,
      status = 'confirmed',
      attendanceMarked = false,
      hhpAwarded = 0
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!martId) {
      return NextResponse.json(
        { error: 'martId is required', code: 'MISSING_MART_ID' },
        { status: 400 }
      );
    }

    if (!sectionId) {
      return NextResponse.json(
        { error: 'sectionId is required', code: 'MISSING_SECTION_ID' },
        { status: 400 }
      );
    }

    if (!slotDate) {
      return NextResponse.json(
        { error: 'slotDate is required', code: 'MISSING_SLOT_DATE' },
        { status: 400 }
      );
    }

    if (!slotStartTime) {
      return NextResponse.json(
        { error: 'slotStartTime is required', code: 'MISSING_SLOT_START_TIME' },
        { status: 400 }
      );
    }

    if (!slotEndTime) {
      return NextResponse.json(
        { error: 'slotEndTime is required', code: 'MISSING_SLOT_END_TIME' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(martId))) {
      return NextResponse.json(
        { error: 'martId must be a valid integer', code: 'INVALID_MART_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(sectionId))) {
      return NextResponse.json(
        { error: 'sectionId must be a valid integer', code: 'INVALID_SECTION_ID' },
        { status: 400 }
      );
    }

    if (!validateDateFormat(slotDate)) {
      return NextResponse.json(
        { error: 'slotDate must be in YYYY-MM-DD format', code: 'INVALID_DATE_FORMAT' },
        { status: 400 }
      );
    }

    if (!validateTimeFormat(slotStartTime)) {
      return NextResponse.json(
        { error: 'slotStartTime must be in HH:MM format (24-hour)', code: 'INVALID_TIME_FORMAT' },
        { status: 400 }
      );
    }

    if (!validateTimeFormat(slotEndTime)) {
      return NextResponse.json(
        { error: 'slotEndTime must be in HH:MM format (24-hour)', code: 'INVALID_TIME_FORMAT' },
        { status: 400 }
      );
    }

    if (!isTimeAfter(slotStartTime, slotEndTime)) {
      return NextResponse.json(
        { error: 'slotEndTime must be after slotStartTime', code: 'INVALID_TIME_RANGE' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status as any)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const newBooking = await db
      .insert(bookings)
      .values({
        userId: parseInt(userId),
        martId: parseInt(martId),
        sectionId: parseInt(sectionId),
        slotDate,
        slotStartTime,
        slotEndTime,
        status,
        attendanceMarked: attendanceMarked ? 1 : 0,
        hhpAwarded: parseInt(hhpAwarded) || 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newBooking[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Booking not found', code: 'BOOKING_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { 
      status, 
      attendanceMarked, 
      hhpAwarded, 
      slotDate, 
      slotStartTime, 
      slotEndTime,
      userId,
      martId,
      sectionId
    } = body;

    if (userId !== undefined || martId !== undefined || sectionId !== undefined) {
      return NextResponse.json(
        { 
          error: 'Cannot update userId, martId, or sectionId. Booking ownership cannot be changed.', 
          code: 'IMMUTABLE_FIELDS' 
        },
        { status: 400 }
      );
    }

    const updates: any = {};

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status as any)) {
        return NextResponse.json(
          { 
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
            code: 'INVALID_STATUS' 
          },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    if (attendanceMarked !== undefined) {
      updates.attendanceMarked = attendanceMarked ? 1 : 0;
    }

    if (hhpAwarded !== undefined) {
      if (isNaN(parseInt(hhpAwarded))) {
        return NextResponse.json(
          { error: 'hhpAwarded must be a valid integer', code: 'INVALID_HHP_AWARDED' },
          { status: 400 }
        );
      }
      updates.hhpAwarded = parseInt(hhpAwarded);
    }

    if (slotDate !== undefined) {
      if (!validateDateFormat(slotDate)) {
        return NextResponse.json(
          { error: 'slotDate must be in YYYY-MM-DD format', code: 'INVALID_DATE_FORMAT' },
          { status: 400 }
        );
      }
      updates.slotDate = slotDate;
    }

    if (slotStartTime !== undefined) {
      if (!validateTimeFormat(slotStartTime)) {
        return NextResponse.json(
          { error: 'slotStartTime must be in HH:MM format (24-hour)', code: 'INVALID_TIME_FORMAT' },
          { status: 400 }
        );
      }
      updates.slotStartTime = slotStartTime;
    }

    if (slotEndTime !== undefined) {
      if (!validateTimeFormat(slotEndTime)) {
        return NextResponse.json(
          { error: 'slotEndTime must be in HH:MM format (24-hour)', code: 'INVALID_TIME_FORMAT' },
          { status: 400 }
        );
      }
      updates.slotEndTime = slotEndTime;
    }

    const finalStartTime = updates.slotStartTime || existing[0].slotStartTime;
    const finalEndTime = updates.slotEndTime || existing[0].slotEndTime;

    if ((slotStartTime !== undefined || slotEndTime !== undefined) && 
        !isTimeAfter(finalStartTime, finalEndTime)) {
      return NextResponse.json(
        { error: 'slotEndTime must be after slotStartTime', code: 'INVALID_TIME_RANGE' },
        { status: 400 }
      );
    }

    updates.updatedAt = new Date().toISOString();

    const updated = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Booking not found', code: 'BOOKING_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(bookings)
      .where(eq(bookings.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      { 
        message: 'Booking deleted successfully', 
        booking: deleted[0] 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}