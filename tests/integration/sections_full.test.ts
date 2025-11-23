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
    sections: {
        id: 'id',
        martId: 'martId',
        name: 'name',
        manpowerRequired: 'manpowerRequired',
        description: 'description',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    },
    marts: {
        id: 'id',
    },
}));

describe('Sections API Integration', () => {
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

        const routeModule = await import('@/app/api/sections/route');
        GET = routeModule.GET;
        POST = routeModule.POST;
        PUT = routeModule.PUT;
        DELETE = routeModule.DELETE;
    });

    describe('GET', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/sections?id=invalid');
            const res = await GET(req);
            expect(res.status).toBe(400);
        });

        it('should return 404 if section not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/sections?id=999');
            const res = await GET(req);
            expect(res.status).toBe(404);
        });

        it('should return section if found', async () => {
            const mockSection = { id: 1, name: 'Test Section' };
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([mockSection]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/sections?id=1');
            const res = await GET(req);
            const body = await res.json();
            expect(res.status).toBe(200);
            expect(body).toEqual(mockSection);
        });

        it('should list sections with filters', async () => {
            const mockSections = [{ id: 1 }, { id: 2 }];
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        orderBy: vi.fn().mockReturnValue({
                            limit: vi.fn().mockReturnValue({
                                offset: vi.fn().mockResolvedValue(mockSections),
                            }),
                        }),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/sections?martId=1');
            const res = await GET(req);
            const body = await res.json();
            expect(res.status).toBe(200);
            expect(body).toHaveLength(2);
        });
    });

    describe('POST', () => {
        const validSection = {
            martId: '1',
            name: 'New Section',
            manpowerRequired: '5',
        };

        it('should return 400 if required fields are missing', async () => {
            const req = new NextRequest('http://localhost/api/sections', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('should return 400 if mart not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/sections', {
                method: 'POST',
                body: JSON.stringify(validSection),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('should create section if valid', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([{ id: 1 }]),
                    }),
                }),
            });

            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ ...validSection, id: 1 }]),
                }),
            });

            const req = new NextRequest('http://localhost/api/sections', {
                method: 'POST',
                body: JSON.stringify(validSection),
            });
            const res = await POST(req);
            expect(res.status).toBe(201);
        });
    });

    describe('PUT', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/sections?id=invalid', {
                method: 'PUT',
                body: JSON.stringify({}),
            });
            const res = await PUT(req);
            expect(res.status).toBe(400);
        });

        it('should return 404 if section not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/sections?id=999', {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated' }),
            });
            const res = await PUT(req);
            expect(res.status).toBe(404);
        });

        it('should update section if valid', async () => {
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

            const req = new NextRequest('http://localhost/api/sections?id=1', {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated' }),
            });
            const res = await PUT(req);
            expect(res.status).toBe(200);
        });
    });

    describe('DELETE', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/sections?id=invalid', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(400);
        });

        it('should return 404 if section not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/sections?id=999', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(404);
        });

        it('should delete section if found', async () => {
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

            const req = new NextRequest('http://localhost/api/sections?id=1', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(200);
        });
    });
});
