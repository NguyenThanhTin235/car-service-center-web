import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import uploadRoutes from './routes/upload.routes';
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true })); // Configure CORS to allow cookies
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Car Service Center API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/customers', customerRoutes);

export default app;
