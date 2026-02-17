
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { requestLogger } from './middlewares/requestLogger';
import { apiBasicAuth } from './middlewares/apiBasicAuth';
import logger from './utils/logger';
import { swaggerSpec } from './config/swagger';

// Import routes
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import profileRoutes from './routes/profile.routes';
import registrationRoutes from './routes/registration.routes';
import uploadRoutes from './routes/upload.routes';
import healthRoutes from './routes/health.routes';
import broadcastRoutes from './routes/broadcast.routes';
import notificationRoutes from './routes/notification.routes';
import formFieldRoutes from './routes/formField.routes';
import speakerRoutes from './routes/speaker.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;
const BASIC_AUTH_HEADER = process.env.BASIC_AUTH_HEADER || 'X-Basic-Auth';

// Middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
// Dynamic CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Basic-Auth', BASIC_AUTH_HEADER],
  exposedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(requestLogger);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cache control for user profile endpoints (includes avatar_url from Google)
app.use('/api/profile', (req, res, next) => {
  if (req.method === 'GET') {
    // Cache profile data for 5 minutes
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
  }
  next();
});

// Optional API Basic Auth gate for sensitive endpoints.
// Configure via BASIC_AUTH_* env vars. Uses X-Basic-Auth by default.
app.use('/api', apiBasicAuth);

// Swagger Documentation (Protected with the same Basic Auth gate as API)
app.use('/api-docs', apiBasicAuth, swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NGEvent API Docs',
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/broadcast', broadcastRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/form-fields', formFieldRoutes);
app.use('/api/speakers', speakerRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'NGEvent API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api-docs'
  });
});

// Error handlers (should be last)
app.use(notFoundHandler);
app.use(errorHandler);

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  });
}

// Export for Vercel serverless
export default app;
