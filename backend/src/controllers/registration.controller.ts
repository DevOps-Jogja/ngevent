import { Response, NextFunction } from 'express';
import { query } from '../db/connection';
import { AppError } from '../middlewares/errorHandler';
import { AuthRequest } from '../middlewares/auth';
import { sendEventRegistrationEmail } from '../utils/email';
import { sendEventRegistrationToTelegram } from '../utils/telegram';
import logger from '../utils/logger';

export const registerForEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { event_id, eventId, registration_data } = req.body;

    // Support both snake_case and camelCase
    const finalEventId = event_id || eventId;

    // Validate required field
    if (!finalEventId) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: [{ field: 'eventId', message: 'Event ID is required' }],
      });
      return;
    }

    // Check if event exists and has capacity
    const eventResult = await query(
      'SELECT capacity, status, (SELECT COUNT(*) FROM registrations WHERE event_id = $1) as current_registrations FROM events WHERE id = $1',
      [finalEventId]
    );

    if (eventResult.rows.length === 0) {
      throw new AppError('Event not found', 404);
    }

    const event = eventResult.rows[0];

    if (event.status !== 'published') {
      throw new AppError('Event is not available for registration', 400);
    }

    if (event.capacity && event.current_registrations >= event.capacity) {
      throw new AppError('Event is full', 400);
    }

    // Get profile data first (needed for validation and email)
    const profileResult = await query(
      'SELECT full_name, phone, institution, position, city FROM profiles WHERE id = $1',
      [req.user!.id]
    );

    const profile = profileResult.rows[0];
    const missingFields = [];

    if (!profile?.full_name || profile.full_name.trim().length === 0) {
      missingFields.push('Nama Lengkap');
    }
    if (!profile?.phone || profile.phone.trim().length === 0) {
      missingFields.push('Nomor Telepon');
    }
    if (!profile?.institution || profile.institution.trim().length === 0) {
      missingFields.push('Institusi');
    }
    if (!profile?.position || profile.position.trim().length === 0) {
      missingFields.push('Posisi/Jabatan');
    }
    if (!profile?.city || profile.city.trim().length === 0) {
      missingFields.push('Kota');
    }

    if (missingFields.length > 0) {
      throw new AppError(
        `Lengkapi profil terlebih dahulu: ${missingFields.join(', ')}`,
        403
      );
    }

    // Check if already registered
    const existingRegistration = await query(
      'SELECT id, status FROM registrations WHERE event_id = $1 AND user_id = $2',
      [finalEventId, req.user!.id]
    );

    if (existingRegistration.rows.length > 0) {
      const registration = existingRegistration.rows[0];

      // If status is 'cancelled', allow re-registration by updating the existing record
      if (registration.status === 'cancelled') {
        // Update existing cancelled registration
        const updateResult = await query(
          'UPDATE registrations SET registration_data = $1, status = $2, registered_at = NOW() WHERE id = $3 RETURNING *',
          [JSON.stringify(registration_data), 'registered', registration.id]
        );

        // Get user email for sending confirmation
        const userResult = await query(
          'SELECT email FROM users WHERE id = $1',
          [req.user!.id]
        );

        // Get event details for email
        const eventDetailResult = await query(
          'SELECT id, title, start_date, location, capacity FROM events WHERE id = $1',
          [finalEventId]
        );

        // Get total registrations count
        const totalRegResult = await query(
          'SELECT COUNT(*) as total FROM registrations WHERE event_id = $1 AND status != $2',
          [finalEventId, 'cancelled']
        );

        // Send registration confirmation email (don't block response)
        if (userResult.rows.length > 0 && eventDetailResult.rows.length > 0) {
          const userEmail = userResult.rows[0].email;
          const eventDetail = eventDetailResult.rows[0];
          const totalRegistrations = parseInt(totalRegResult.rows[0]?.total || '0');

          // Extract payment proof URL from registration_data (from request body)
          let paymentProofUrl: string | undefined;
          logger.info('Registration data from request (re-registration):', { registration_data });

          if (registration_data && typeof registration_data === 'object') {
            // Look for payment proof field (case insensitive)
            const paymentProofKey = Object.keys(registration_data).find(key =>
              key.toLowerCase().includes('bukti') ||
              key.toLowerCase().includes('payment') ||
              key.toLowerCase().includes('proof') ||
              key.toLowerCase().includes('pembayaran')
            );

            if (paymentProofKey) {
              paymentProofUrl = registration_data[paymentProofKey];
              logger.info('Payment proof extracted (re-registration):', { key: paymentProofKey, url: paymentProofUrl });
            } else {
              logger.warn('No payment proof field found in registration_data (re-registration)', {
                availableKeys: Object.keys(registration_data)
              });
            }
          }

          sendEventRegistrationEmail(
            userEmail,
            profile.full_name,
            {
              id: eventDetail.id,
              title: eventDetail.title,
              startDate: eventDetail.start_date,
              location: eventDetail.location,
            }
          ).catch(err => {
            logger.error('Failed to send event registration email:', err);
          });

          // Send Telegram notification (don't block response)
          sendEventRegistrationToTelegram({
            eventTitle: eventDetail.title,
            eventId: eventDetail.id,
            eventDate: eventDetail.start_date,
            eventLocation: eventDetail.location,
            userName: profile.full_name,
            userEmail: userEmail,
            userPhone: profile.phone,
            userInstitution: profile.institution,
            userPosition: profile.position,
            userCity: profile.city,
            totalRegistrations: totalRegistrations,
            capacity: eventDetail.capacity,
            paymentProofUrl: paymentProofUrl,
          }).catch(err => {
            logger.error('Failed to send Telegram notification:', err);
          });
        }

        res.status(201).json(updateResult.rows[0]);
        return;
      }

      // If status is not cancelled (registered or attended), throw error
      throw new AppError('Already registered for this event', 400);
    }

    // Create registration
    const result = await query(
      'INSERT INTO registrations (event_id, user_id, registration_data) VALUES ($1, $2, $3) RETURNING *',
      [finalEventId, req.user!.id, JSON.stringify(registration_data)]
    );

    // Get user email for sending confirmation
    const userResult = await query(
      'SELECT email FROM users WHERE id = $1',
      [req.user!.id]
    );

    // Get event details for email
    const eventDetailResult = await query(
      'SELECT id, title, start_date, location, capacity FROM events WHERE id = $1',
      [finalEventId]
    );

    // Get total registrations count
    const totalRegResult = await query(
      'SELECT COUNT(*) as total FROM registrations WHERE event_id = $1 AND status != $2',
      [finalEventId, 'cancelled']
    );

    // Send registration confirmation email (don't block response)
    if (userResult.rows.length > 0 && eventDetailResult.rows.length > 0) {
      const userEmail = userResult.rows[0].email;
      const eventDetail = eventDetailResult.rows[0];
      const totalRegistrations = parseInt(totalRegResult.rows[0]?.total || '0');

      // Extract payment proof URL from registration_data (from request body)
      let paymentProofUrl: string | undefined;
      logger.info('Registration data from request (new registration):', { registration_data });

      if (registration_data && typeof registration_data === 'object') {
        // Look for payment proof field (case insensitive)
        const paymentProofKey = Object.keys(registration_data).find(key =>
          key.toLowerCase().includes('bukti') ||
          key.toLowerCase().includes('payment') ||
          key.toLowerCase().includes('proof') ||
          key.toLowerCase().includes('pembayaran')
        );

        if (paymentProofKey) {
          paymentProofUrl = registration_data[paymentProofKey];
          logger.info('Payment proof extracted (new registration):', { key: paymentProofKey, url: paymentProofUrl });
        } else {
          logger.warn('No payment proof field found in registration_data (new registration)', {
            availableKeys: Object.keys(registration_data)
          });
        }
      }

      sendEventRegistrationEmail(
        userEmail,
        profile.full_name,
        {
          id: eventDetail.id,
          title: eventDetail.title,
          startDate: eventDetail.start_date,
          location: eventDetail.location,
        }
      ).catch(err => {
        logger.error('Failed to send event registration email:', err);
      });

      // Send Telegram notification (don't block response)
      sendEventRegistrationToTelegram({
        eventTitle: eventDetail.title,
        eventId: eventDetail.id,
        eventDate: eventDetail.start_date,
        eventLocation: eventDetail.location,
        userName: profile.full_name,
        userEmail: userEmail,
        userPhone: profile.phone,
        userInstitution: profile.institution,
        userPosition: profile.position,
        userCity: profile.city,
        totalRegistrations: totalRegistrations,
        capacity: eventDetail.capacity,
        paymentProofUrl: paymentProofUrl,
      }).catch(err => {
        logger.error('Failed to send Telegram notification:', err);
      });
    }

    res.status(201).json(result.rows[0]);
    return;
  } catch (error) {
    next(error);
    return;
  }
};

export const getMyRegistrations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `
      SELECT r.*, e.title, e.start_date, e.end_date, e.location, e.image_url, e.status as event_status
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = $1
      ORDER BY r.registered_at DESC
      `,
      [req.user!.id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getPreviousRegistration = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;

    // Get the most recent registration (including cancelled) for this user and event
    const result = await query(
      `
      SELECT id, event_id, user_id, registration_data, status, registered_at
      FROM registrations
      WHERE event_id = $1 AND user_id = $2
      ORDER BY registered_at DESC
      LIMIT 1
      `,
      [eventId, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.json(null);
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const cancelRegistration = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE registrations 
       SET status = 'cancelled' 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Registration not found', 404);
    }

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

export const getEventRegistrations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;

    // Check if user is organizer of this event
    const eventCheck = await query('SELECT organizer_id FROM events WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0) {
      throw new AppError('Event not found', 404);
    }

    const profileCheck = await query('SELECT role FROM profiles WHERE id = $1', [req.user!.id]);
    if (
      eventCheck.rows[0].organizer_id !== req.user!.id &&
      profileCheck.rows[0]?.role !== 'admin'
    ) {
      throw new AppError('Unauthorized', 403);
    }

    const result = await query(
      `
      SELECT r.*, p.full_name, u.email, p.phone, p.institution
      FROM registrations r
      JOIN profiles p ON r.user_id = p.id
      JOIN users u ON p.id = u.id
      WHERE r.event_id = $1
      ORDER BY r.registered_at DESC
      `,
      [eventId]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const updateRegistrationStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await query(
      'UPDATE registrations SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Registration not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};
