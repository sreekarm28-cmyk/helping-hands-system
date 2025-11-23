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
    users: {
        id: 'id',
        email: 'email',
        name: 'name',
        role: 'role',
        phone: 'phone',
        hhpPoints: 'hhpPoints',
        password: 'password',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    },
}));

vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn().mockResolvedValue('hashed_password'),
    },
}));

describe('Users API Integration', () => {
    let GET: any;
    let POST: any;
    let PUT: any;
    let DELETE: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        // Reset mock implementations
        mockDb.select.mockReturnThis();
        mockDb.insert.mockReturnThis();
        mockDb.update.mockReturnThis();
        mockDb.delete.mockReturnThis();

        // Import route handler
        const routeModule = await import('@/app/api/users/route');
        GET = routeModule.GET;
        POST = routeModule.POST;
        PUT = routeModule.PUT;
        DELETE = routeModule.DELETE;
    });

    describe('GET', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/users?id=invalid');
            const res = await GET(req);
            const body = await res.json();
            expect(res.status).toBe(400);
            expect(body.code).toBe('INVALID_ID');
        });

        it('should return 404 if user not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/users?id=999');
            const res = await GET(req);
            expect(res.status).toBe(404);
        });

        it('should return user if found', async () => {
            const mockUser = { id: 1, name: 'Test', email: 'test@example.com' };
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([mockUser]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/users?id=1');
            const res = await GET(req);
            const body = await res.json();
            expect(res.status).toBe(200);
            expect(body).toEqual(mockUser);
        });

        it('should list users with pagination', async () => {
            const mockUsers = [{ id: 1 }, { id: 2 }];
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                        offset: vi.fn().mockResolvedValue(mockUsers),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/users?limit=5&offset=0');
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

            const req = new NextRequest('http://localhost/api/users?id=1');
            const res = await GET(req);
            expect(res.status).toBe(500);
        });
    });

    describe('POST', () => {
        const validUser = {
            email: 'new@example.com',
            password: 'password123',
            name: 'New User',
            role: 'end_user',
        };

        it('should return 400 if required fields are missing', async () => {
            const req = new NextRequest('http://localhost/api/users', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('should return 400 if email is invalid', async () => {
            const req = new NextRequest('http://localhost/api/users', {
                method: 'POST',
                body: JSON.stringify({ ...validUser, email: 'invalid-email' }),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('should return 400 if email exists', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([{ id: 1 }]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/users', {
                method: 'POST',
                body: JSON.stringify(validUser),
            });
            const res = await POST(req);
            expect(res.status).toBe(400);
            expect((await res.json()).code).toBe('EMAIL_EXISTS');
        });

        it('should create user if valid', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ ...validUser, id: 1 }]),
                }),
            });

            const req = new NextRequest('http://localhost/api/users', {
                method: 'POST',
                body: JSON.stringify(validUser),
            });
            const res = await POST(req);
            expect(res.status).toBe(201);
        });

        it('should return 500 if database error occurs', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            mockDb.insert.mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockRejectedValue(new Error('Database error')),
                }),
            });

            const req = new NextRequest('http://localhost/api/users', {
                method: 'POST',
                body: JSON.stringify(validUser),
            });
            const res = await POST(req);
            expect(res.status).toBe(500);
        });
    });

    describe('PUT', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/users?id=invalid', {
                method: 'PUT',
                body: JSON.stringify({}),
            });
            const res = await PUT(req);
            expect(res.status).toBe(400);
        });

        it('should return 404 if user not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/users?id=999', {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated' }),
            });
            const res = await PUT(req);
            expect(res.status).toBe(404);
        });

        it('should update user if valid', async () => {
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

            const req = new NextRequest('http://localhost/api/users?id=1', {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated' }),
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

            const req = new NextRequest('http://localhost/api/users?id=1', {
                method: 'PUT',
                body: JSON.stringify({ name: 'Updated' }),
            });
            const res = await PUT(req);
            expect(res.status).toBe(500);
        });
    });

    describe('DELETE', () => {
        it('should return 400 if ID is invalid', async () => {
            const req = new NextRequest('http://localhost/api/users?id=invalid', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(400);
        });

        it('should return 404 if user not found', async () => {
            mockDb.select.mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        limit: vi.fn().mockResolvedValue([]),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost/api/users?id=999', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(404);
        });

        it('should delete user if found', async () => {
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

            const req = new NextRequest('http://localhost/api/users?id=1', {
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

            const req = new NextRequest('http://localhost/api/users?id=1', {
                method: 'DELETE',
            });
            const res = await DELETE(req);
            expect(res.status).toBe(500);
        });
    });
});
