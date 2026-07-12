require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { errorHandler } = require('./src/middlewares/errorHandler');
const { startCronJobs } = require('./src/jobs/licenseCron');

// Route imports
const authRoutes = require('./src/routes/auth');
const vehicleRoutes = require('./src/routes/vehicles');
const driverRoutes = require('./src/routes/drivers');
const tripRoutes = require('./src/routes/trips');
const maintenanceRoutes = require('./src/routes/maintenance');
const fuelExpenseRoutes = require('./src/routes/fuelExpenses');
const analyticsRoutes = require('./src/routes/analytics');
const settingsRoutes = require('./src/routes/settings');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }
});
// Attach io to the app so routes can use it
app.set('io', io);

const PORT = process.env.PORT || 5000;

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use(helmet({ crossOriginResourcePolicy: false })); // allow images to be loaded cross-origin
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());
// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiter — auth routes are stricter
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many requests. Try again later.' } });
const globalLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 200 });
app.use(globalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'TransitOps API', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api', fuelExpenseRoutes); // mounts /api/fuel and /api/expenses
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.', code: 'NOT_FOUND' });
});

// ─── Centralized Error Handler ────────────────────────────────────────────────

app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────

// Start scheduled jobs
startCronJobs();

httpServer.listen(PORT, () => {
  console.log(`🚌 TransitOps API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
