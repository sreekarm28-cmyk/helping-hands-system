import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSession, getSessionFromToken, destroySession, getUserFromToken, verifyCredentials, requireRole } from '@/lib/auth';
import { db } from '@/db';
import bcrypt from 'bcrypt';

// Mock db and bcrypt
vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
  },
}));

describe('Auth Library', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session and return a token', async () => {
      const userId = 1;
      const mockInsert = { values: vi.fn().mockResolvedValue(undefined) };
      (db.insert as any).mockReturnValue(mockInsert);

      const token = await createSession(userId);

      expect(token).toContain(`session_${userId}_`);
      expect(db.insert).toHaveBeenCalled();
      expect(mockInsert.values).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        token: expect.any(String),
        expiresAt: expect.any(String),
        createdAt: expect.any(String),
      }));
    });
  });

  describe('getSessionFromToken', () => {
    it('should return null if token is empty', async () => {
      const result = await getSessionFromToken('');
      expect(result).toBeNull();
    });

    it('should return null if session not found', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
      (db.select as any).mockReturnValue(mockSelect);

      const result = await getSessionFromToken('invalid_token');
      expect(result).toBeNull();
    });

    it('should return null and destroy session if expired', async () => {
      const expiredSession = {
        userId: 1,
        expiresAt: new Date(Date.now() - 10000).toISOString(),
        token: 'expired_token',
      };
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([expiredSession]),
          }),
        }),
      };
      (db.select as any).mockReturnValue(mockSelect);
      
      const mockDelete = { where: vi.fn().mockResolvedValue(undefined) };
      (db.delete as any).mockReturnValue(mockDelete);

      const result = await getSessionFromToken('expired_token');
      
      expect(result).toBeNull();
      expect(db.delete).toHaveBeenCalled();
    });

    it('should return session data if valid', async () => {
      const validSession = {
        userId: 1,
        expiresAt: new Date(Date.now() + 10000).toISOString(),
        token: 'valid_token',
      };
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([validSession]),
          }),
        }),
      };
      (db.select as any).mockReturnValue(mockSelect);

      const result = await getSessionFromToken('valid_token');
      expect(result).toEqual({ userId: 1 });
    });
  });

  describe('destroySession', () => {
    it('should delete session from db', async () => {
      const mockDelete = { where: vi.fn().mockResolvedValue(undefined) };
      (db.delete as any).mockReturnValue(mockDelete);

      await destroySession('token_to_destroy');
      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('getUserFromToken', () => {
    it('should return null if session is invalid', async () => {
      // Mock getSessionFromToken behavior (empty return)
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
      (db.select as any).mockReturnValue(mockSelect);

      const result = await getUserFromToken('invalid');
      expect(result).toBeNull();
    });

    it('should return user if session and user exist', async () => {
      // Mock session found
      const validSession = {
        userId: 1,
        expiresAt: new Date(Date.now() + 10000).toISOString(),
        token: 'valid_token',
      };
      
      // Mock user found
      const validUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'end_user',
        phone: '1234567890',
        hhpPoints: 0,
      };

      // We need to mock sequential db calls. 
      // First call is for session, second for user.
      const mockSelectSession = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([validSession]),
          }),
        }),
      };
      
      const mockSelectUser = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([validUser]),
          }),
        }),
      };

      (db.select as any)
        .mockReturnValueOnce(mockSelectSession) // for getSessionFromToken
        .mockReturnValueOnce(mockSelectUser);   // for getUserFromToken

      const result = await getUserFromToken('valid_token');
      expect(result).toEqual(validUser);
    });
  });

  describe('verifyCredentials', () => {
    it('should return null if user not found', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
      (db.select as any).mockReturnValue(mockSelect);

      const result = await verifyCredentials('test@example.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password invalid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
      };
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      };
      (db.select as any).mockReturnValue(mockSelect);
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await verifyCredentials('test@example.com', 'wrong_password');
      expect(result).toBeNull();
    });

    it('should return user without password if valid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test',
        role: 'end_user',
      };
      const mockSelect = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      };
      (db.select as any).mockReturnValue(mockSelect);
      (bcrypt.compare as any).mockResolvedValue(true);

      const result = await verifyCredentials('test@example.com', 'password');
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test',
        role: 'end_user',
      });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('requireRole', () => {
    it('should return true if user has allowed role', () => {
      expect(requireRole('store_admin', ['store_admin', 'main_admin'])).toBe(true);
    });

    it('should return false if user does not have allowed role', () => {
      expect(requireRole('end_user', ['store_admin', 'main_admin'])).toBe(false);
    });
  });
});
