import express, { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { httpLogStream } from './loggers/logger';
import { isOriginAllowed } from './utils/cors.util';
import { checkHealth } from './services/health.service';
import uploadRoutes from './routes/upload.routes';
import authRoutes from './routes/auth.routes';
import publicRoutes from './routes/public.routes';
import customerRoutes from './routes/customer.routes';
import appointmentRoutes from './routes/appointment.routes';
import serviceRoutes from './routes/service.routes';
import intakeRoutes from './routes/intake.routes';
import workOrderRoutes from './routes/work-order.routes';
import userRoutes from './routes/user.routes';
import employeeRoutes from './routes/employee.routes';
import serviceCategoryRoutes from './routes/service-category.routes';

import jobTypeRoutes from './routes/job-type.routes';
import catalogRoutes from './routes/system-catalog.routes';
import vehicleRoutes from './routes/vehicle.routes';
import inventoryRoutes from './routes/inventory.routes';
import invoiceRoutes from './routes/invoice.routes';
import paymentRoutes from './routes/payment.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportRoutes from './routes/report.routes';
import quotationRoutes from './routes/quotation.routes';
import warrantyRoutes from './routes/warranty.routes';
import notificationRoutes from './routes/notification.routes';
import aiChatRoutes from './routes/ai-chat.routes';

const app = express();
const trustProxyHops =
  process.env.TRUST_PROXY_HOPS !== undefined ? Number(process.env.TRUST_PROXY_HOPS) : 1;
app.set('trust proxy', Number.isFinite(trustProxyHops) ? trustProxyHops : 1);

// Request correlation ID for observability across backend & AI workflows
app.use((req: Request, res: Response, next: NextFunction) => {
  const incomingId = req.headers['x-request-id'];
  const cleanId =
    typeof incomingId === 'string' && /^[a-zA-Z0-9\-_]{1,64}$/.test(incomingId.trim())
      ? incomingId.trim()
      : crypto.randomUUID();
  (req as Request & { requestId?: string }).requestId = cleanId;
  res.setHeader('X-Request-Id', cleanId);
  next();
});

// Middlewares
app.use(cors({ 
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  }, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-portal', 'Cookie', 'Accept', 'X-Requested-With', 'Cache-Control', 'Pragma', 'x-secret-key', 'X-Secret-Key'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(helmet());
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: httpLogStream,
    skip: (req) => req.path === '/health',
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Car Service Center API is running' });
});

app.get('/health', async (_req: Request, res: Response) => {
  const { httpStatus, report } = await checkHealth();
  const timestamp = new Date().toISOString();

  if (httpStatus === 200) {
    res.status(200).json({
      success: true,
      code: 200,
      message: report.status === 'ok' ? 'Service is healthy' : 'Service is running in degraded mode',
      data: report,
      timestamp,
    });
    return;
  }

  res.status(503).json({
    success: false,
    code: 503,
    message: 'Database connection unavailable',
    error: {
      code: 'SERVICE_UNAVAILABLE',
      details: report,
    },
    timestamp,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/intake', intakeRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/service-categories', serviceCategoryRoutes);

app.use('/api/job-types', jobTypeRoutes);
app.use('/api/system-catalogs', catalogRoutes);
app.use('/api/catalogs', catalogRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/warranty', warrantyRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/v1/ai-chat', aiChatRoutes);
app.use('/api/ai-chat', aiChatRoutes);

export default app;

