import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { initDb } from './db/initDb.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for client applications
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body parsing with 50mb limit to safely handle user photo uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded user photos statically
app.use('/uploads', express.static(uploadsDir));

// Simple logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Urban Intelligence Platform API',
    database: 'PostgreSQL (Neon Cloud)',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.',
  });
});

// Start Express Server
app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(` Urban Intelligence Platform (UIP) - Node.js Server`);
  console.log(` Server active on: http://localhost:${PORT}`);
  console.log(` Health check:    http://localhost:${PORT}/api/health`);
  console.log(` Issues API:      http://localhost:${PORT}/api/issues`);
  console.log(` Admin API:       http://localhost:${PORT}/api/admin`);
  console.log(` Auth endpoints:  http://localhost:${PORT}/api/auth`);
  console.log(`====================================================`);

  // Initialize DB tables and seed data if needed
  try {
    await initDb();
  } catch (err) {
    console.error('Failed to initialize database on startup:', err.message);
  }
});
