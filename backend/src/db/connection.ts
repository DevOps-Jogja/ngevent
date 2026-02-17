import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import * as schema from './schema';
import logger from '../utils/logger';

dotenv.config();

if (!process.env.DATABASE_URL) {
  logger.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

// Adjust pool size for serverless environments
const isProduction = process.env.NODE_ENV === 'production';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isProduction ? 5 : 20, // Smaller pool for serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

pool.on('connect', (client) => {
  logger.info('Database connected');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error:', err);
  process.exit(-1);
});

export const db = drizzle(pool, { schema });

// Export query function for tests
export const query = (text: string, params?: any[]) => pool.query(text, params);

export { pool };
export default db;
