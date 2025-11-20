import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('end_user'), // 'end_user', 'store_admin', 'main_admin'
  hhpPoints: integer('hhp_points').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Marts table
export const marts = sqliteTable('marts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'mall', 'home_essentials', 'electronics', 'supermarket', 'other'
  size: text('size').notNull(), // 'small', 'medium', 'large'
  description: text('description'),
  address: text('address').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  storeAdminId: integer('store_admin_id').references(() => users.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Sections table
export const sections = sqliteTable('sections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  martId: integer('mart_id').notNull().references(() => marts.id),
  name: text('name').notNull(),
  manpowerRequired: integer('manpower_required').notNull().default(1),
  description: text('description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Bookings table
export const bookings = sqliteTable('bookings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  martId: integer('mart_id').notNull().references(() => marts.id),
  sectionId: integer('section_id').notNull().references(() => sections.id),
  slotDate: text('slot_date').notNull(),
  slotStartTime: text('slot_start_time').notNull(),
  slotEndTime: text('slot_end_time').notNull(),
  status: text('status').notNull().default('confirmed'), // 'confirmed', 'cancelled', 'completed', 'waitlisted'
  attendanceMarked: integer('attendance_marked', { mode: 'boolean' }).notNull().default(false),
  hhpAwarded: integer('hhp_awarded').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Cancellations table
export const cancellations = sqliteTable('cancellations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  bookingId: integer('booking_id').notNull().references(() => bookings.id),
  cancellationDate: text('cancellation_date').notNull(),
  createdAt: text('created_at').notNull(),
});

// Sessions table
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  token: text('token').notNull().unique(),
  userId: integer('user_id').notNull().references(() => users.id),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});