import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock db
const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
};

vi.mock('@/db', () => ({
    db: mockDb,
}));

vi.mock('@/db/schema', () => ({
    bookings: {
        id: 'id',
        userId: 'userId',
        martId: 'martId',
        sectionId: 'sectionId',
        slotDate: 'slotDate',
        slotStartTime: 'slotStartTime',
        slotEndTime: 'slotEndTime',
        status: 'status',
        attendanceMarked: 'attendanceMarked',
        hhpAwarded: 'hhpAwarded',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    },
}));

describe('Bookings API Integration', () => {
    let GET: any;
    let POST: any;
    let PUT: any;
    let DELETE: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        mockDb.select.mockReturnThis();
        mockDb.insert.mockReturnThis();
        mockDb.update.mockReturnThis();
        mockDb.delete.mockReturnThis();

        const routeModule = await import('@/app/api/bookings/route');
        GET = routeModule.GET;
        POST = routeModule.POST;
        PUT = routeModule.PUT;
        DELETE = routeModule.DELETE;
    });

    describe('GET', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/bookings?id=invalid');
            const res = await GET(req);
            expect(res.status).toBe(400);
        });

        it('should return 404 if booking not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/bookings?id=999');
            const res = await GET(req);
            expect(res.status).toBe(404);
        });

        it('should return booking if found', async () => {
            const mockBooking = { id: 1, userId: 1 };
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([mockBooking]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/bookings?id=1');
            const res = await GET(req);
            const body = await res.json();
            expect(res.status).toBe(200);
            expect(body).toEqual(mockBooking);
        });

        it('should list bookings with filters', async () => {
            const mockBookings = [{ id: 1 }, { id: 2 }];
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                            offset: vi.fn().mockResolvedValue(mockBookings),
                        }),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/bookings?userId=1&status=confirmed');
            const res = await GET(req);
            const body = await res.json();
            expect(res.status).toBe(200);
            expect(body).toHaveLength(2);
        });

        it('should return 500 if database error occurs', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockRejectedValue(new Error('Database error')),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/bookings?id=1');
            const res = await GET(req);
            expect(res.status).toBe(500);
        });
    });

    describe('POST', () => {
        const validBooking = {
            userId: '1',
            martId: '1',
            sectionId: '1',
            slotDate: '2025-12-01',
            slotStartTime: '10:00',
            slotEndTime: '11:00',
        };

        it('should return 400 if required fields are missing', async () => {
            const req = new NextRequest('http://localhost/api/bookings', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('should return 400 if time range is invalid', async () => {
            const req = new NextRequest('http://localhost/api/bookings', {
                method: 'POST',
                body: JSON.stringify({ ...validBooking, slotStartTime: '11:00', slotEndTime: '10:00' }),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('should create booking if valid', async () => {
            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ ...validBooking, id: 1 }]),
                }),
            });

            const req = new NextRequest('http://localhost/api/bookings', {
                method: 'POST',
                body: JSON.stringify(validBooking),
            });
            const res = await POST(req);
            expect(res.status).toBe(201);
        });

        it('should return 500 if database error occurs', async () => {
            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockRejectedValue(new Error('Database error')),
                }),
            });

            const req = new NextRequest('http://localhost/api/bookings', {
                method: 'POST',
                body: JSON.stringify(validBooking),
            });
            const res = await POST(req);
            expect(res.status).toBe(500);
        });
    });

    describe('PUT', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/bookings?id=invalid', {
                method: 'PUT',
                body: JSON.stringify({}),
            });
            const res = await PUT(req);
            expect(res.status).toBe(400);
        });

        it('should return 404 if booking not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/bookings?id=999', {
                method: 'PUT',
                body: JSON.stringify({ status: 'cancelled' }),
            });
            const res = await PUT(req);
            expect(res.status).toBe(404);
        });

        it('should update booking if valid', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([{ id: 1 }]),
                    }),
                }),
            });

            mockDb.update.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 1, status: 'cancelled' }]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/bookings?id=1', {
                method: 'PUT',
                body: JSON.stringify({ status: 'cancelled' }),
            });
            const res = await PUT(req);
            expect(res.status).toBe(200);
        });

        it('should return 500 if database error occurs', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([{ id: 1 }]),
                    }),
                }),
            });

            mockDb.update.mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        returning: vi.fn().mockRejectedValue(new Error('Database error')),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/bookings?id=1', {
                method: 'PUT',
                body: JSON.stringify({ status: 'cancelled' }),
            });
            const res = await PUT(req);
            expect(res.status).toBe(500);
        });
    });

    describe('DELETE', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/bookings?id=invalid', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(400);
        });

        it('should return 404 if booking not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/bookings?id=999', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(404);
        });

        it('should delete booking if found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([{ id: 1 }]),
                    }),
                }),
            });

            mockDb.delete.mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 1 }]),
                }),
            });

            const req = new NextRequest('http://localhost/api/bookings?id=1', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(200);
        });

        it('should return 500 if database error occurs', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([{ id: 1 }]),
                    }),
                }),
            });

            mockDb.delete.mockReturnValue({
                where: vi.fn().mockReturnValue({
                    returning: vi.fn().mockRejectedValue(new Error('Database error')),
                }),
            });

            const req = new NextRequest('http://localhost/api/bookings?id=1', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(500);
        });
    });
});
