import { Router } from 'express';
import * as registrationController from '../controllers/registration.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { apiLimiter } from '../middlewares/rateLimiter';
import { validateSchema, schemas } from '../middlewares/validation';

const router = Router();

// Protected routes
router.post('/', authenticate, apiLimiter, validateSchema(schemas.registration), registrationController.registerForEvent);
router.get('/my-events', authenticate, registrationController.getMyRegistrations);
router.get('/previous/:eventId', authenticate, registrationController.getPreviousRegistration);
router.delete('/:id', authenticate, registrationController.cancelRegistration);

// Organizer routes
router.get('/event/:eventId', authenticate, authorize('organizer', 'admin'), registrationController.getEventRegistrations);
router.put('/:id/status', authenticate, authorize('organizer', 'admin'), registrationController.updateRegistrationStatus);

export default router;
