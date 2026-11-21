import http from 'http';
import app from './app';
import dotenv from 'dotenv';
import { connectRedis } from './utils/redis.util';
import { startAppointmentReminderJob } from './jobs/appointment-reminder.job';
import { initSocketServer } from './socket';

dotenv.config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Connect Redis
    await connectRedis();
  } catch (error) {
    console.warn('[Warning] Failed to connect to Redis, some cache/OTP features might not work.', error);
  }

  // Khởi động các Job chạy nền
  startAppointmentReminderJob();

  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
