import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export type UserRole = 'end_user' | 'store_admin' | 'main_admin';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  hhpPoints: number;
}

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(userId: number): Promise<string> {
  const sessionToken = `session_${userId}_${Date.now()}_${Math.random().toString(36)}`;
  const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
  const createdAt = new Date().toISOString();
  
  // Store session in database
  await db.insert(sessions).values({
    token: sessionToken,
    userId,
    expiresAt,
    createdAt,
  });
  
  return sessionToken;
}

export async function getSessionFromToken(token: string): Promise<{ userId: number } | null> {
  if (!token) {
    return null;
  }

  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);
  
  if (session.length === 0) {
    return null;
  }

  const sessionData = session[0];
  
  // Check if session is expired
  if (new Date(sessionData.expiresAt) < new Date()) {
    await destroySession(token);
    return null;
  }

  return { userId: sessionData.userId };
}

export async function destroySession(token: string): Promise<void> {
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
}

export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  const session = await getSessionFromToken(token);
  
  if (!session) {
    return null;
  }

  const user = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      phone: users.phone,
      hhpPoints: users.hhpPoints,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (user.length === 0) {
    await destroySession(token);
    return null;
  }

  return user[0] as AuthUser;
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthUser | null> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user[0].password);

  if (!isValid) {
    return null;
  }

  const { password: _, ...userWithoutPassword } = user[0];
  return userWithoutPassword as AuthUser;
}

export function requireRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}