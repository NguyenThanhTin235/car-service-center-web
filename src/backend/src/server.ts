import http from 'http';
import app from './app';
import dotenv from 'dotenv';
import { connectRedis } from './utils/redis.util';
import { startAppointmentReminderJob } from './jobs/appointment-reminder.job';
import logger from './loggers/logger';
import { initSocketServer } from './socket';

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Connect Redis
    await connectRedis();
  } catch (error) {
    logger.warn('Failed to connect to Redis, using in-memory fallback cache', {
      error: (error as Error).message,
    });
  }

  // Khởi động các Job chạy nền
  startAppointmentReminderJob();

  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`, { port: PORT });
  });
};

start().catch((err) => {
  logger.error('Failed to start server', { error: (err as Error).message, stack: (err as Error).stack });
  process.exit(1);
});
