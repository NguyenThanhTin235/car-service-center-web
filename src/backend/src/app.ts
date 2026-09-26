import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import uploadRoutes from './routes/upload.routes';
import authRoutes from './routes/auth.routes';
import publicRoutes from './routes/public.routes';
import customerRoutes from './routes/customer.routes';
import appointmentRoutes from './routes/appointment.routes';
import serviceRoutes from './routes/service.routes';
import intakeRoutes from './routes/intake.routes';
import workOrderRoutes from './routes/work-order.routes';

const app = express();

// Middlewares
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Car Service Center API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/intake', intakeRoutes);
app.use('/api/work-orders', workOrderRoutes);

export default app;
