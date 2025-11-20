import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sections, marts } from '@/db/schema';
import { eq, like, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single section by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const section = await db
        .select()
        .from(sections)
        .where(eq(sections.id, parseInt(id)))
        .limit(1);

      if (section.length === 0) {
        return NextResponse.json(
          { error: 'Section not found', code: 'SECTION_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(section[0], { status: 200 });
    }

    // List all sections with filters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const martId = searchParams.get('martId');

    let query = db.select().from(sections);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(like(sections.name, `%${search}%`));
    }

    if (martId) {
      if (isNaN(parseInt(martId))) {
        return NextResponse.json(
          { error: 'Valid martId is required', code: 'INVALID_MART_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(sections.martId, parseInt(martId)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(sections.createdAt))
      .limit(limit)
      .offset(offset);

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
    const { martId, name, manpowerRequired, description } = body;

    // Validate required fields
    if (!martId) {
      return NextResponse.json(
        { error: 'martId is required', code: 'MISSING_MART_ID' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'name is required and must be a non-empty string', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    // Validate martId is valid integer
    if (isNaN(parseInt(martId))) {
      return NextResponse.json(
        { error: 'martId must be a valid integer', code: 'INVALID_MART_ID' },
        { status: 400 }
      );
    }

    // Validate manpowerRequired if provided
    let validatedManpower = 1;
    if (manpowerRequired !== undefined && manpowerRequired !== null) {
      if (isNaN(parseInt(manpowerRequired)) || parseInt(manpowerRequired) <= 0) {
        return NextResponse.json(
          { error: 'manpowerRequired must be a positive integer', code: 'INVALID_MANPOWER' },
          { status: 400 }
        );
      }
      validatedManpower = parseInt(manpowerRequired);
    }

    // Verify mart exists
    const mart = await db
      .select()
      .from(marts)
      .where(eq(marts.id, parseInt(martId)))
      .limit(1);

    if (mart.length === 0) {
      return NextResponse.json(
        { error: 'Mart not found', code: 'MART_NOT_FOUND' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const newSection = await db
      .insert(sections)
      .values({
        martId: parseInt(martId),
        name: name.trim(),
        manpowerRequired: validatedManpower,
        description: description ? description.trim() : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newSection[0], { status: 201 });
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

    // Check if section exists
    const existingSection = await db
      .select()
      .from(sections)
      .where(eq(sections.id, parseInt(id)))
      .limit(1);

    if (existingSection.length === 0) {
      return NextResponse.json(
        { error: 'Section not found', code: 'SECTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, manpowerRequired, description } = body;

    // Validate that martId is not being updated
    if ('martId' in body) {
      return NextResponse.json(
        { error: 'martId cannot be updated', code: 'MART_ID_UPDATE_NOT_ALLOWED' },
        { status: 400 }
      );
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    // Validate and add name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { error: 'name must be a non-empty string', code: 'INVALID_NAME' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }

    // Validate and add manpowerRequired if provided
    if (manpowerRequired !== undefined && manpowerRequired !== null) {
      if (isNaN(parseInt(manpowerRequired)) || parseInt(manpowerRequired) <= 0) {
        return NextResponse.json(
          { error: 'manpowerRequired must be a positive integer', code: 'INVALID_MANPOWER' },
          { status: 400 }
        );
      }
      updates.manpowerRequired = parseInt(manpowerRequired);
    }

    // Add description if provided
    if (description !== undefined) {
      updates.description = description ? description.trim() : null;
    }

    const updatedSection = await db
      .update(sections)
      .set(updates)
      .where(eq(sections.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedSection[0], { status: 200 });
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

    // Check if section exists
    const existingSection = await db
      .select()
      .from(sections)
      .where(eq(sections.id, parseInt(id)))
      .limit(1);

    if (existingSection.length === 0) {
      return NextResponse.json(
        { error: 'Section not found', code: 'SECTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(sections)
      .where(eq(sections.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Section deleted successfully',
        section: deleted[0],
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