import { Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { eq, and, desc, sql, count, inArray } from 'drizzle-orm';
import db from '../db/connection';
import { events, profiles, registrations, speakers } from '../db/schema';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { generateUniqueEventId } from '../utils/id-generator';

function cloudinaryConfigured(): boolean {
  const ok = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (!ok) return false;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return true;
}

function getCloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const marker = '/upload/';
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;

    let afterUpload = parsed.pathname.slice(idx + marker.length);

    // Drop transformations + version segment (e.g. c_limit,w_1200/.../v1234567890/)
    afterUpload = afterUpload.replace(/^.*?v\d+\//, '');

    // Remove extension
    afterUpload = afterUpload.replace(/\.[^/.]+$/, '');

    const publicId = decodeURIComponent(afterUpload);
    return publicId.length > 0 ? publicId : null;
  } catch {
    return null;
  }
}

async function safeDeleteCloudinaryAssetByUrl(url: unknown): Promise<void> {
  if (!url || typeof url !== 'string') return;
  if (!cloudinaryConfigured()) return;

  const publicId = getCloudinaryPublicIdFromUrl(url);
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // Best-effort cleanup: do not block the main operation.
    console.warn('Cloudinary delete failed (ignored):', error);
  }
}

export const getAllEvents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, category, search, limit = '20', offset = '0' } = req.query;

    console.log('getAllEvents query params:', { status, category, search, limit, offset });

    const conditions: any[] = [];

    if (status) {
      // Special case: allow dashboards to request all statuses
      if (String(status).toLowerCase() !== 'all') {
        conditions.push(eq(events.status, status as any));
      }
    } else {
      // Default: public event listing should only show published events
      conditions.push(eq(events.status, 'published'));
    }

    if (category) {
      conditions.push(eq(events.category, category as string));
    }

    if (search) {
      conditions.push(
        sql`(${events.title} ILIKE ${`%${search}%`} OR ${events.description} ILIKE ${`%${search}%`})`
      );
    }

    console.log('Query conditions count:', conditions.length);

    const eventsWithDetails = await db
      .select({
        event: events,
        organizerName: profiles.fullName,
        registrationCount: count(registrations.id),
      })
      .from(events)
      .leftJoin(profiles, eq(events.organizerId, profiles.id))
      .leftJoin(
        registrations,
        and(
          eq(events.id, registrations.eventId),
          sql`${registrations.status} != 'cancelled'`
        )
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(events.id, profiles.fullName)
      .orderBy(desc(events.startDate))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    console.log('Events fetched:', eventsWithDetails.length);

    // Fetch speakers for each event
    const eventIds = eventsWithDetails.map(e => e.event.id);
    const eventSpeakers = eventIds.length > 0
      ? await db.select().from(speakers).where(inArray(speakers.eventId, eventIds))
      : [];

    const eventsWithSpeakers = eventsWithDetails.map(item => ({
      ...item.event,
      organizerName: item.organizerName,
      registrationCount: item.registrationCount,
      speakers: eventSpeakers
        .filter(s => s.eventId === item.event.id)
        .map(s => ({ id: s.id, name: s.name, photoUrl: s.photoUrl })),
    }));

    res.json({
      events: eventsWithSpeakers,
      total: eventsWithDetails.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyEvents = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, category, search, limit = '20', offset = '0' } = req.query;

    if (!req.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const conditions: any[] = [eq(events.organizerId, req.user.id)];

    if (status && String(status).toLowerCase() !== 'all') {
      conditions.push(eq(events.status, status as any));
    }

    if (category) {
      conditions.push(eq(events.category, category as string));
    }

    if (search) {
      conditions.push(
        sql`(${events.title} ILIKE ${`%${search}%`} OR ${events.description} ILIKE ${`%${search}%`})`
      );
    }

    const eventsWithDetails = await db
      .select({
        event: events,
        organizerName: profiles.fullName,
        registrationCount: count(registrations.id),
      })
      .from(events)
      .leftJoin(profiles, eq(events.organizerId, profiles.id))
      .leftJoin(
        registrations,
        and(
          eq(events.id, registrations.eventId),
          sql`${registrations.status} != 'cancelled'`
        )
      )
      .where(and(...conditions))
      .groupBy(events.id, profiles.fullName)
      .orderBy(desc(events.startDate))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    const eventIds = eventsWithDetails.map(e => e.event.id);
    const eventSpeakers = eventIds.length > 0
      ? await db.select().from(speakers).where(inArray(speakers.eventId, eventIds))
      : [];

    const eventsWithSpeakers = eventsWithDetails.map(item => ({
      ...item.event,
      organizerName: item.organizerName,
      registrationCount: item.registrationCount,
      speakers: eventSpeakers
        .filter(s => s.eventId === item.event.id)
        .map(s => ({ id: s.id, name: s.name, photoUrl: s.photoUrl })),
    }));

    res.json({
      events: eventsWithSpeakers,
      total: eventsWithDetails.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const [eventData] = await db
      .select({
        event: events,
        organizerName: profiles.fullName,
        organizerAvatar: profiles.avatarUrl,
        registrationCount: count(registrations.id),
      })
      .from(events)
      .leftJoin(profiles, eq(events.organizerId, profiles.id))
      .leftJoin(
        registrations,
        and(
          eq(events.id, registrations.eventId),
          sql`${registrations.status} != 'cancelled'`
        )
      )
      .where(eq(events.id, id))
      .groupBy(events.id, profiles.fullName, profiles.avatarUrl)
      .limit(1);

    if (!eventData) {
      throw new AppError('Event not found', 404);
    }

    const eventSpeakers = await db
      .select()
      .from(speakers)
      .where(eq(speakers.eventId, id))
      .orderBy(speakers.orderIndex);

    res.json({
      ...eventData.event,
      organizerName: eventData.organizerName,
      organizerAvatar: eventData.organizerAvatar,
      registrationCount: eventData.registrationCount,
      speakers: eventSpeakers,
    });
  } catch (error) {
    next(error);
  }
};

export const getEventsByCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;

    const eventsList = await db
      .select({
        event: events,
        organizerName: profiles.fullName,
        registrationCount: count(registrations.id),
      })
      .from(events)
      .leftJoin(profiles, eq(events.organizerId, profiles.id))
      .leftJoin(
        registrations,
        and(
          eq(events.id, registrations.eventId),
          sql`${registrations.status} != 'cancelled'`
        )
      )
      .where(and(eq(events.category, category), eq(events.status, 'published')))
      .groupBy(events.id, profiles.fullName)
      .orderBy(desc(events.startDate));

    res.json(eventsList);
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      description,
      start_date,
      end_date,
      location,
      image_url,
      capacity,
      registration_fee,
      bank_account_name,
      bank_account_number,
      bank_name,
      category,
    } = req.body;

    // Generate unique 6-character ID
    const eventId = await generateUniqueEventId();

    console.log('Creating event with data:', {
      id: eventId,
      organizerId: req.user!.id,
      title,
      startDate: new Date(start_date),
      endDate: new Date(end_date),
      location,
      imageUrl: image_url,
      capacity,
      registrationFee: registration_fee,
      category,
    });

    const [event] = await db.insert(events).values({
      id: eventId,
      organizerId: req.user!.id,
      title,
      description,
      startDate: new Date(start_date),
      endDate: new Date(end_date),
      location,
      imageUrl: image_url,
      capacity,
      registrationFee: registration_fee,
      bankAccountName: bank_account_name,
      bankAccountNumber: bank_account_number,
      bankName: bank_name,
      category,
    }).returning();

    console.log('Event created successfully:', event);

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    next(error);
  }
};

export const updateEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check ownership
    const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const [profile] = await db.select().from(profiles).where(eq(profiles.id, req.user!.id)).limit(1);
    if (event.organizerId !== req.user!.id && profile?.role !== 'admin') {
      throw new AppError('Unauthorized to update this event', 403);
    }

    const hasProp = (key: string) => Object.prototype.hasOwnProperty.call(updates ?? {}, key);

    // Build update object (use existence checks so 0/null/empty are handled correctly)
    const updateData: any = {};
    if (hasProp('title')) updateData.title = updates.title;
    if (hasProp('description')) updateData.description = updates.description;

    if (hasProp('start_date') && updates.start_date) updateData.startDate = new Date(updates.start_date);
    if (hasProp('end_date') && updates.end_date) updateData.endDate = new Date(updates.end_date);

    if (hasProp('location')) updateData.location = updates.location;

    if (hasProp('image_url')) {
      updateData.imageUrl = updates.image_url ? updates.image_url : null;
    }

    // If the image was explicitly updated/cleared, delete the previous Cloudinary asset.
    if (hasProp('image_url')) {
      const newUrl = updates.image_url ? String(updates.image_url) : null;
      const oldUrl = event.imageUrl;
      if (oldUrl && oldUrl !== newUrl) {
        await safeDeleteCloudinaryAssetByUrl(oldUrl);
      }
    }

    if (hasProp('capacity')) {
      updateData.capacity = updates.capacity;
    }

    if (hasProp('registration_fee')) {
      updateData.registrationFee = updates.registration_fee;
    }

    if (hasProp('bank_account_name')) {
      updateData.bankAccountName = updates.bank_account_name;
    }

    if (hasProp('bank_account_number')) {
      updateData.bankAccountNumber = updates.bank_account_number;
    }

    if (hasProp('bank_name')) {
      updateData.bankName = updates.bank_name;
    }

    if (hasProp('category')) updateData.category = updates.category;
    if (hasProp('status')) updateData.status = updates.status;
    updateData.updatedAt = new Date();

    const [updatedEvent] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();

    res.json(updatedEvent);
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check ownership
    const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const [profile] = await db.select().from(profiles).where(eq(profiles.id, req.user!.id)).limit(1);
    if (event.organizerId !== req.user!.id && profile?.role !== 'admin') {
      throw new AppError('Unauthorized to delete this event', 403);
    }

    // Best-effort cleanup: remove the event image from Cloudinary.
    await safeDeleteCloudinaryAssetByUrl(event.imageUrl);

    await db.delete(events).where(eq(events.id, id));

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const publishEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const [event] = await db
      .update(events)
      .set({ status: 'published', updatedAt: new Date() })
      .where(and(eq(events.id, id), eq(events.organizerId, req.user!.id)))
      .returning();

    if (!event) {
      throw new AppError('Event not found or unauthorized', 404);
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
};

export const addSpeaker = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, title, company, bio, photo_url, linkedin_url, twitter_url, website_url, order_index } = req.body;

    const [speaker] = await db.insert(speakers).values({
      eventId: id,
      name,
      title,
      company,
      bio,
      photoUrl: photo_url,
      linkedinUrl: linkedin_url,
      twitterUrl: twitter_url,
      websiteUrl: website_url,
      orderIndex: order_index || 0,
    }).returning();

    res.status(201).json(speaker);
  } catch (error) {
    next(error);
  }
};

export const updateSpeaker = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { speakerId } = req.params;
    const updates = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (updates.name) updateData.name = updates.name;
    if (updates.title) updateData.title = updates.title;
    if (updates.company) updateData.company = updates.company;
    if (updates.bio) updateData.bio = updates.bio;
    if (updates.photo_url) updateData.photoUrl = updates.photo_url;
    if (updates.linkedin_url) updateData.linkedinUrl = updates.linkedin_url;
    if (updates.twitter_url) updateData.twitterUrl = updates.twitter_url;
    if (updates.website_url) updateData.websiteUrl = updates.website_url;
    if (updates.order_index !== undefined) updateData.orderIndex = updates.order_index;

    const [speaker] = await db
      .update(speakers)
      .set(updateData)
      .where(eq(speakers.id, speakerId))
      .returning();

    if (!speaker) {
      throw new AppError('Speaker not found', 404);
    }

    res.json(speaker);
  } catch (error) {
    next(error);
  }
};

export const deleteSpeaker = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { speakerId } = req.params;

    await db.delete(speakers).where(eq(speakers.id, speakerId));

    res.json({ message: 'Speaker deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getRegistrationCount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await db
      .select({ count: count(registrations.id) })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, id),
          sql`${registrations.status} != 'cancelled'`
        )
      );

    res.json({ count: result[0]?.count || 0 });
  } catch (error) {
    next(error);
  }
};

export const getEventRegistrants = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verify event exists
    const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
    if (!event) {
      throw new AppError('Event not found', 404);
    }

    // Fetch registrants with public information only
    const registrantsList = await db
      .select({
        fullName: profiles.fullName,
        institution: profiles.institution,
        avatarUrl: profiles.avatarUrl,
        registeredAt: registrations.registeredAt,
      })
      .from(registrations)
      .innerJoin(profiles, eq(registrations.userId, profiles.id))
      .where(
        and(
          eq(registrations.eventId, id),
          sql`${registrations.status} != 'cancelled'`
        )
      )
      .orderBy(desc(registrations.registeredAt));

    res.json(registrantsList);
  } catch (error) {
    next(error);
  }
};
