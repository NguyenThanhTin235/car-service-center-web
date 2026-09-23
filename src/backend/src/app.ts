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
import userRoutes from './routes/user.routes';
import employeeRoutes from './routes/employee.routes';
import serviceCategoryRoutes from './routes/service-category.routes';
import serviceTemplateRoutes from './routes/service-template.routes';
import jobTypeRoutes from './routes/job-type.routes';
import catalogRoutes from './routes/system-catalog.routes';

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
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/service-categories', serviceCategoryRoutes);
app.use('/api/service-templates', serviceTemplateRoutes);
app.use('/api/job-types', jobTypeRoutes);
app.use('/api/catalogs', catalogRoutes);

export default app;
