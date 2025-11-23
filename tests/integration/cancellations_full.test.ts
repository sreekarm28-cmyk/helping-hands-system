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
    cancellations: {
        id: 'id',
        userId: 'userId',
        bookingId: 'bookingId',
        cancellationDate: 'cancellationDate',
        createdAt: 'createdAt',
    },
}));

describe('Cancellations API Integration', () => {
    let GET: any;
    let POST: any;
    let DELETE: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        mockDb.select.mockReturnThis();
        mockDb.insert.mockReturnThis();
        mockDb.update.mockReturnThis();
        mockDb.delete.mockReturnThis();

        const routeModule = await import('@/app/api/cancellations/route');
        GET = routeModule.GET;
        POST = routeModule.POST;
        DELETE = routeModule.DELETE;
    });

    describe('GET', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/cancellations?id=invalid');
            const res = await GET(req);
            expect(res.status).toBe(400);
        });

        it('should return 404 if cancellation not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/cancellations?id=999');
            const res = await GET(req);
            expect(res.status).toBe(404);
        });

        it('should return cancellation if found', async () => {
            const mockCancellation = { id: 1, userId: 1 };
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([mockCancellation]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/cancellations?id=1');
            const res = await GET(req);
            const body = await res.json();
            expect(res.status).toBe(200);
            expect(body).toEqual(mockCancellation);
        });

        it('should list cancellations with filters', async () => {
            const mockCancellations = [{ id: 1 }, { id: 2 }];
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                            offset: vi.fn().mockResolvedValue(mockCancellations),
                        }),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/cancellations?userId=1&cancellationDate=2025-12-01');
            const res = await GET(req);
            const body = await res.json();
            expect(res.status).toBe(200);
            expect(body).toHaveLength(2);
        });
    });

    describe('POST', () => {
        const validCancellation = {
            userId: '1',
            bookingId: '1',
            cancellationDate: '2025-12-01',
        };

        it('should return 400 if required fields are missing', async () => {
            const req = new NextRequest('http://localhost/api/cancellations', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('should return 400 if date format is invalid', async () => {
            const req = new NextRequest('http://localhost/api/cancellations', {
                method: 'POST',
                body: JSON.stringify({ ...validCancellation, cancellationDate: 'invalid-date' }),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('should create cancellation if valid', async () => {
            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ ...validCancellation, id: 1 }]),
                }),
            });

            const req = new NextRequest('http://localhost/api/cancellations', {
                method: 'POST',
                body: JSON.stringify(validCancellation),
            });
            const res = await POST(req);
            expect(res.status).toBe(201);
        });
    });

    describe('DELETE', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/cancellations?id=invalid', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(400);
        });

        it('should return 404 if cancellation not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/cancellations?id=999', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(404);
        });

        it('should delete cancellation if found', async () => {
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

            const req = new NextRequest('http://localhost/api/cancellations?id=1', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(200);
        });
    });
});
