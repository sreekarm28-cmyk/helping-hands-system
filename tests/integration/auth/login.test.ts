import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock @/lib/auth
vi.mock('@/lib/auth', () => ({
    verifyCredentials: vi.fn(),
    createSession: vi.fn(),
}));

import { verifyCredentials, createSession } from '@/lib/auth';

describe('Login API Integration', () => {
    let POST: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        // Import the route handler dynamically to ensure mocks are applied
        const routeModule = await import('@/app/api/auth/login/route');
        POST = routeModule.POST;
    });

    it('should return 400 if email or password is missing', async () => {
        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: '' }),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.code).toBe('MISSING_CREDENTIALS');
    });

    it('should return 401 if credentials are invalid', async () => {
        (verifyCredentials as any).mockResolvedValue(null);

        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(401);
        expect(body.code).toBe('INVALID_CREDENTIALS');
        expect(verifyCredentials).toHaveBeenCalledWith('test@example.com', 'wrong');
    });

    it('should return 200 and token if login successful', async () => {
        const mockUser = { id: 1, email: 'test@example.com', name: 'Test User' };
        (verifyCredentials as any).mockResolvedValue(mockUser);
        (createSession as any).mockResolvedValue('mock_token');

        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'correct' }),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.message).toBe('Login successful');
        expect(body.user).toEqual(mockUser);
        expect(body.token).toBe('mock_token');
        expect(createSession).toHaveBeenCalledWith(1);
    });

    it('should return 500 if an error occurs', async () => {
        (verifyCredentials as any).mockRejectedValue(new Error('Database error'));

        const req = new NextRequest('http://localhost/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'correct' }),
        });

        const res = await POST(req);
        const body = await res.json();

        expect(res.status).toBe(500);
        expect(body.error).toContain('Internal server error');
    });
});
