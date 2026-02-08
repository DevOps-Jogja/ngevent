import { pgTable, uuid, varchar, text, timestamp, boolean, integer, numeric, jsonb, pgEnum, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['participant', 'organizer', 'admin']);
export const eventStatusEnum = pgEnum('event_status', ['draft', 'published', 'cancelled', 'completed']);
export const registrationStatusEnum = pgEnum('registration_status', ['registered', 'attended', 'cancelled']);
export const notificationTypeEnum = pgEnum('notification_type', ['registration', 'event_update', 'reminder', 'general', 'payment']);
export const authProviderEnum = pgEnum('auth_provider', ['email', 'google']);

// Users Table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  verificationToken: text('verification_token'),
  resetPasswordToken: text('reset_password_token'),
  resetPasswordExpires: timestamp('reset_password_expires', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Profiles Table
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  fullName: text('full_name'),
  phone: varchar('phone', { length: 20 }),
  institution: varchar('institution', { length: 255 }),
  position: varchar('position', { length: 255 }),
  city: varchar('city', { length: 255 }),
  role: roleEnum('role').default('participant').notNull(),
  authProvider: authProviderEnum('auth_provider').default('email').notNull(),
  avatarUrl: text('avatar_url'),
  welcomeEmailSent: boolean('welcome_email_sent').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Events Table
export const events = pgTable('events', {
  id: varchar('id', { length: 6 }).primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  organizerId: uuid('organizer_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  location: text('location'),
  imageUrl: text('image_url'),
  capacity: integer('capacity'),
  registrationFee: numeric('registration_fee', { precision: 10, scale: 2 }).default('0'),
  status: eventStatusEnum('status').default('draft').notNull(),
  category: text('category'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Speakers Table
export const speakers = pgTable('speakers', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: varchar('event_id', { length: 6 }).notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }),
  company: varchar('company', { length: 255 }),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  linkedinUrl: text('linkedin_url'),
  twitterUrl: text('twitter_url'),
  websiteUrl: text('website_url'),
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Registrations Table
export const registrations = pgTable('registrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: varchar('event_id', { length: 6 }).notNull().references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  registrationData: jsonb('registration_data'),
  status: registrationStatusEnum('status').default('registered').notNull(),
  registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueEventUser: unique().on(table.eventId, table.userId),
}));

// Form Fields Table
export const formFields = pgTable('form_fields', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: varchar('event_id', { length: 6 }).notNull().references(() => events.id, { onDelete: 'cascade' }),
  fieldName: text('field_name').notNull(),
  fieldType: text('field_type').notNull(),
  isRequired: boolean('is_required').default(false).notNull(),
  options: jsonb('options'),
  orderIndex: integer('order_index').notNull(),
});

// Notifications Table
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: varchar('event_id', { length: 6 }).references(() => events.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').notNull(),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Broadcast History Table
export const broadcastHistory = pgTable('broadcast_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: varchar('event_id', { length: 6 }).notNull().references(() => events.id, { onDelete: 'cascade' }),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  recipientCount: integer('recipient_count').default(0).notNull(),
  status: varchar('status', { length: 20 }).default('sent').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.id],
  }),
  notifications: many(notifications),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, {
    fields: [profiles.id],
    references: [users.id],
  }),
  organizedEvents: many(events),
  registrations: many(registrations),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(profiles, {
    fields: [events.organizerId],
    references: [profiles.id],
  }),
  speakers: many(speakers),
  registrations: many(registrations),
  formFields: many(formFields),
  notifications: many(notifications),
  broadcastHistory: many(broadcastHistory),
}));

export const speakersRelations = relations(speakers, ({ one }) => ({
  event: one(events, {
    fields: [speakers.eventId],
    references: [events.id],
  }),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
  user: one(profiles, {
    fields: [registrations.userId],
    references: [profiles.id],
  }),
}));

export const formFieldsRelations = relations(formFields, ({ one }) => ({
  event: one(events, {
    fields: [formFields.eventId],
    references: [events.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [notifications.eventId],
    references: [events.id],
  }),
}));

export const broadcastHistoryRelations = relations(broadcastHistory, ({ one }) => ({
  event: one(events, {
    fields: [broadcastHistory.eventId],
    references: [events.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Speaker = typeof speakers.$inferSelect;
export type NewSpeaker = typeof speakers.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type FormField = typeof formFields.$inferSelect;
export type NewFormField = typeof formFields.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type BroadcastHistory = typeof broadcastHistory.$inferSelect;
export type NewBroadcastHistory = typeof broadcastHistory.$inferInsert;
