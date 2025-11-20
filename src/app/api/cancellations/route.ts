import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cancellations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single cancellation by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const cancellation = await db
        .select()
        .from(cancellations)
        .where(eq(cancellations.id, parseInt(id)))
        .limit(1);

      if (cancellation.length === 0) {
        return NextResponse.json(
          { error: 'Cancellation not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(cancellation[0], { status: 200 });
    }

    // List cancellations with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userId = searchParams.get('userId');
    const bookingId = searchParams.get('bookingId');
    const cancellationDate = searchParams.get('cancellationDate');

    let query = db.select().from(cancellations);

    // Build filter conditions
    const conditions = [];

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(cancellations.userId, parseInt(userId)));
    }

    if (bookingId) {
      if (isNaN(parseInt(bookingId))) {
        return NextResponse.json(
          { error: 'Valid bookingId is required', code: 'INVALID_BOOKING_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(cancellations.bookingId, parseInt(bookingId)));
    }

    if (cancellationDate) {
      // Validate date format YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(cancellationDate)) {
        return NextResponse.json(
          {
            error: 'Invalid date format. Use YYYY-MM-DD',
            code: 'INVALID_DATE_FORMAT',
          },
          { status: 400 }
        );
      }
      conditions.push(eq(cancellations.cancellationDate, cancellationDate));
    }

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
    const { userId, bookingId, cancellationDate } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required', code: 'MISSING_BOOKING_ID' },
        { status: 400 }
      );
    }

    if (!cancellationDate) {
      return NextResponse.json(
        { error: 'cancellationDate is required', code: 'MISSING_CANCELLATION_DATE' },
        { status: 400 }
      );
    }

    // Validate userId is a valid integer
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate bookingId is a valid integer
    if (isNaN(parseInt(bookingId))) {
      return NextResponse.json(
        { error: 'bookingId must be a valid integer', code: 'INVALID_BOOKING_ID' },
        { status: 400 }
      );
    }

    // Validate cancellationDate format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(cancellationDate)) {
      return NextResponse.json(
        {
          error: 'cancellationDate must be in YYYY-MM-DD format',
          code: 'INVALID_DATE_FORMAT',
        },
        { status: 400 }
      );
    }

    // Validate date is a real date
    const dateParts = cancellationDate.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);
    const dateObj = new Date(year, month - 1, day);

    if (
      dateObj.getFullYear() !== year ||
      dateObj.getMonth() !== month - 1 ||
      dateObj.getDate() !== day
    ) {
      return NextResponse.json(
        {
          error: 'cancellationDate is not a valid date',
          code: 'INVALID_DATE',
        },
        { status: 400 }
      );
    }

    // Create cancellation
    const newCancellation = await db
      .insert(cancellations)
      .values({
        userId: parseInt(userId),
        bookingId: parseInt(bookingId),
        cancellationDate: cancellationDate,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newCancellation[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
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

    // Check if cancellation exists
    const existing = await db
      .select()
      .from(cancellations)
      .where(eq(cancellations.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Cancellation not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete cancellation
    const deleted = await db
      .delete(cancellations)
      .where(eq(cancellations.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Cancellation deleted successfully',
        cancellation: deleted[0],
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