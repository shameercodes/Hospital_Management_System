const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();
connectDB();

const app = express();

// Behind a reverse proxy (nginx, ALB, Render, Heroku, etc.) so req.ip is honest
// and rate limits cannot be bypassed by spoofing X-Forwarded-For.
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS — explicit allowlist driven by env. In dev we permit any localhost port
// for convenience; in prod we strictly require an exact match against CLIENT_URL.
const clientUrls = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // No-origin requests (curl, server-to-server) — block in prod, allow in dev
    if (!origin) {
      if (process.env.NODE_ENV === 'production') return callback(null, false);
      return callback(null, true);
    }
    if (clientUrls.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' &&
        (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parsers with sensible size limits (defends against memory-DoS).
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Global rate limit — generous, applies to all /api/*
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Strict limiter for login (brute-force defense). 10 attempts / 15 min / IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes and try again.' },
});
app.use('/api/auth/login', loginLimiter);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Skip noisy 2xx/3xx in prod, keep 4xx/5xx for forensic value
  app.use(morgan('combined', { skip: (req, res) => res.statusCode < 400 }));
}

// Static files (uploaded documents/images). Note: contents may be PHI —
// gate behind authenticated routes for production deployments.
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/patients',     require('./routes/patients'));
app.use('/api/doctors',      require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/wards',        require('./routes/wards'));
app.use('/api/billing',      require('./routes/billing'));
app.use('/api/pharmacy',     require('./routes/pharmacy'));
app.use('/api/staff',        require('./routes/staff'));
app.use('/api/reports',      require('./routes/reports'));
app.use('/api/lab',          require('./routes/lab'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/audit',        require('./routes/audit'));

// Liveness — process is up
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Readiness — process is up AND DB connection is healthy
const mongoose = require('mongoose');
app.get('/api/ready', (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  if (dbState === 1) return res.json({ status: 'READY', db: 'connected' });
  return res.status(503).json({ status: 'NOT_READY', db: ['disconnected','connected','connecting','disconnecting'][dbState] || 'unknown' });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🏥 HMS Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown — give in-flight requests up to 10s before forcing exit.
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully…`);
  server.close(() => {
    mongoose.connection.close(false).finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled rejection: ${err.message}`);
  shutdown('unhandledRejection');
});

module.exports = server;
