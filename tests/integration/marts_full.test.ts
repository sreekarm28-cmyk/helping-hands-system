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
    marts: {
        id: 'id',
        name: 'name',
        type: 'type',
        size: 'size',
        address: 'address',
        latitude: 'latitude',
        longitude: 'longitude',
        description: 'description',
        storeAdminId: 'storeAdminId',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    },
}));

describe('Marts API Integration', () => {
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

        const routeModule = await import('@/app/api/marts/route');
        GET = routeModule.GET;
        POST = routeModule.POST;
        PUT = routeModule.PUT;
        DELETE = routeModule.DELETE;
    });

    describe('GET', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/marts?id=invalid');
            const res = await GET(req);
            expect(res.status).toBe(400);
        });

        it('should return 404 if mart not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/marts?id=999');
            const res = await GET(req);
            expect(res.status).toBe(404);
        });

        it('should return mart if found', async () => {
            const mockMart = { id: 1, name: 'Test Mart' };
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([mockMart]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/marts?id=1');
            const res = await GET(req);
            const body = await res.json();
            expect(res.status).toBe(200);
            expect(body).toEqual(mockMart);
        });
    });

    describe('POST', () => {
        const validMart = {
            name: 'New Mart',
            type: 'mall',
            size: 'large',
            address: '123 St',
            latitude: 10,
            longitude: 20,
        };

        it('should return 400 if required fields are missing', async () => {
            const req = new NextRequest('http://localhost/api/marts', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('should return 400 if type is invalid', async () => {
            const req = new NextRequest('http://localhost/api/marts', {
                method: 'POST',
                body: JSON.stringify({ ...validMart, type: 'invalid' }),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('should return 400 if storeAdminId is invalid', async () => {
            const req = new NextRequest('http://localhost/api/marts', {
                method: 'POST',
                body: JSON.stringify({ ...validMart, storeAdminId: 'invalid' }),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('should return 400 if latitude is invalid', async () => {
            const req = new NextRequest('http://localhost/api/marts', {
                method: 'POST',
                body: JSON.stringify({ ...validMart, latitude: 'invalid' }),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('should return 400 if longitude is invalid', async () => {
            const req = new NextRequest('http://localhost/api/marts', {
                method: 'POST',
                body: JSON.stringify({ ...validMart, longitude: 'invalid' }),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('should create mart if valid', async () => {
            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ ...validMart, id: 1 }]),
                }),
            });

            const req = new NextRequest('http://localhost/api/marts', {
                method: 'POST',
                body: JSON.stringify(validMart),
            });
            const res = await POST(req);
            expect(res.status).toBe(201);
        });
    });

    describe('PUT', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/marts?id=invalid', {
                method: 'PUT',
                body: JSON.stringify({}),
            });
            const res = await PUT(req);
            expect(res.status).toBe(400);
        });

        it('should return 404 if mart not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/marts?id=999', {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated' }),
            });
            const res = await PUT(req);
            expect(res.status).toBe(404);
        });

        it('should update mart if valid', async () => {
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
                        returning: vi.fn().mockResolvedValue([{ id: 1, name: 'Updated' }]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/marts?id=1', {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated' }),
            });
            const res = await PUT(req);
            expect(res.status).toBe(200);
        });

        it('should return 400 if update payload contains invalid type', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([{ id: 1 }]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/marts?id=1', {
                method: 'PUT',
                body: JSON.stringify({ type: 'invalid' }),
            });
            const res = await PUT(req);
            expect(res.status).toBe(400);
        });

        it('should return 400 if update payload contains invalid size', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([{ id: 1 }]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/marts?id=1', {
                method: 'PUT',
                body: JSON.stringify({ size: 'invalid' }),
            });
            const res = await PUT(req);
            expect(res.status).toBe(400);
        });
    });

    describe('DELETE', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/marts?id=invalid', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(400);
        });

        it('should return 404 if mart not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/marts?id=999', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(404);
        });

        it('should delete mart if found', async () => {
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

            const req = new NextRequest('http://localhost/api/marts?id=1', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(200);
        });
    });
});
