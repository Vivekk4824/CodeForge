import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import passport from './config/passport.js';

import authRoutes from './routes/authRoutes.js';
import codeRoutes from './routes/codeRoutes.js';
import aiRoutes from './routes/aiRoutes.js';


connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('AI Coding Platform API is running');
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'CodeForge API is healthy', uptime: process.uptime() });
});

// Basic Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
