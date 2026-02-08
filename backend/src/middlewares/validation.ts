import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
  institution: z.string().optional(),
  position: z.string().optional(),
  city: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  start_date: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid start date format' }
  ),
  end_date: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid end date format' }
  ),
  location: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')).or(z.null()),
  capacity: z.number().int().positive().optional().nullable(),
  registration_fee: z.number().nonnegative().optional().nullable(),
  category: z.string().optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
});

const registrationSchema = z.object({
  event_id: z.string().length(6, 'Invalid event ID format').regex(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/, 'Invalid event ID format'),
  // Zod v4 requires (keySchema, valueSchema)
  registration_data: z.record(z.string(), z.any()).optional(),
});

const broadcastSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(1, 'Message is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize sensitive data from logs
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '***';
      if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '***';
      if (sanitizedBody.currentPassword) sanitizedBody.currentPassword = '***';
      if (sanitizedBody.newPassword) sanitizedBody.newPassword = '***';

      console.log('Validating request body:', JSON.stringify(sanitizedBody, null, 2));
      schema.parse(req.body);
      console.log('Validation passed!');
      next();
      return;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Zod validation error:', error.issues);
        const errorDetails = error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        res.status(400).json({
          status: 'error',
          message: 'Validation error',
          errors: errorDetails,
        });
        return;
      }
      console.error('Non-Zod validation error:', error);
      next(error);
      return;
    }
  };
};

export const schemas = {
  register: registerSchema,
  login: loginSchema,
  event: eventSchema,
  registration: registrationSchema,
  broadcast: broadcastSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
};
