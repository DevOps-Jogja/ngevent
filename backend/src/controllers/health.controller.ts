import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/connection';
import { testTelegramConnection, isTelegramConfigured } from '../utils/telegram';

export const healthCheck = async (_req: Request, res: Response, _next: NextFunction) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

export const databaseHealth = async (_req: Request, res: Response, _next: NextFunction) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].now,
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const telegramHealth = async (_req: Request, res: Response, _next: NextFunction) => {
  try {
    if (!isTelegramConfigured()) {
      res.status(503).json({
        status: 'error',
        telegram: 'not_configured',
        message: 'Telegram bot token or chat ID not provided',
      });
      return;
    }

    const isConnected = await testTelegramConnection();

    if (isConnected) {
      res.json({
        status: 'ok',
        telegram: 'connected',
        message: 'Test message sent successfully',
      });
    } else {
      res.status(503).json({
        status: 'error',
        telegram: 'failed',
        message: 'Failed to send test message. Check logs for details.',
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      telegram: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
