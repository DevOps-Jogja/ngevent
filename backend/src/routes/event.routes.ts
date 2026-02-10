import { Router } from 'express';
import * as eventController from '../controllers/event.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { apiLimiter } from '../middlewares/rateLimiter';
import { validateSchema, schemas } from '../middlewares/validation';

const router = Router();

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, cancelled, completed]
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/', apiLimiter, eventController.getAllEvents);

// Organizer/Admin: list only events created by the current user
router.get('/mine', apiLimiter, authenticate, authorize('organizer', 'admin'), eventController.getMyEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event details with speakers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */
router.get('/:id', apiLimiter, eventController.getEventById);

/**
 * @swagger
 * /api/events/{id}/registrations/count:
 *   get:
 *     summary: Get registration count
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registration count
 */
router.get('/:id/registrations/count', apiLimiter, eventController.getRegistrationCount);

/**
 * @swagger
 * /api/events/{id}/registrants:
 *   get:
 *     summary: Get public list of event registrants
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of registrants with public info
 */
router.get('/:id/registrants', apiLimiter, eventController.getEventRegistrants);

/**
 * @swagger
 * /api/events/category/{category}:
 *   get:
 *     summary: Get events by category
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Events in category
 */
router.get('/category/:category', apiLimiter, eventController.getEventsByCategory);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create event (Organizer/Admin)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               registrationFee:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Event created
 */
router.post('/', authenticate, authorize('organizer', 'admin'), validateSchema(schemas.event), eventController.createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update event (Organizer/Admin)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event updated
 */
router.put('/:id', authenticate, authorize('organizer', 'admin'), eventController.updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete event (Organizer/Admin)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted
 */
router.delete('/:id', authenticate, authorize('organizer', 'admin'), eventController.deleteEvent);

/**
 * @swagger
 * /api/events/{id}/publish:
 *   post:
 *     summary: Publish event (Organizer/Admin)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event published
 */
router.post('/:id/publish', authenticate, authorize('organizer', 'admin'), eventController.publishEvent);

/**
 * @swagger
 * /api/events/{id}/speakers:
 *   post:
 *     summary: Add speaker (Organizer/Admin)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Speaker'
 *     responses:
 *       201:
 *         description: Speaker added
 */
router.post('/:id/speakers', authenticate, authorize('organizer', 'admin'), eventController.addSpeaker);

/**
 * @swagger
 * /api/events/{id}/speakers/{speakerId}:
 *   put:
 *     summary: Update speaker (Organizer/Admin)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: speakerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Speaker updated
 */
router.put('/:id/speakers/:speakerId', authenticate, authorize('organizer', 'admin'), eventController.updateSpeaker);

/**
 * @swagger
 * /api/events/{id}/speakers/{speakerId}:
 *   delete:
 *     summary: Delete speaker (Organizer/Admin)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: speakerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Speaker deleted
 */
router.delete('/:id/speakers/:speakerId', authenticate, authorize('organizer', 'admin'), eventController.deleteSpeaker);

export default router;
