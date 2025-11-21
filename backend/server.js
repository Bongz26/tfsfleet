// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Initialize database connection
const db = require('./src/config/database');

// Test database connection (non-blocking)
if (!process.env.TEST_MODE && !process.env.SKIP_DB) {
  db.pool.connect()
    .then((client) => {
      console.log('✅ Database connected successfully');
      client.release();
    })
    .catch((err) => {
      console.warn('⚠️  Database connection failed:', err.message);
      console.warn('⚠️  Server will continue in test mode (no database operations)');
      console.warn('⚠️  To skip DB checks, set TEST_MODE=true or SKIP_DB=true in .env');
    });
} else {
  console.log('⚠️  Running in TEST_MODE - database operations disabled');
}

const app = express();

// Middleware
app.use(helmet());
app.use(compression()); // Reduces data transfer size
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limit payload size

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/trips', require('./src/routes/trips'));
app.use('/api/vehicles', require('./src/routes/vehicles'));
app.use('/api/drivers', require('./src/routes/drivers'));
app.use('/api/sync', require('./src/routes/sync'));
app.use('/api/fuel-purchases', require('./src/routes/fuelPurchases'));
app.use('/api/maintenance', require('./src/routes/maintenance'));
app.use('/api/upload', require('./src/routes/upload'));

// Serve static files (receipts)
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: db.isConnected() ? 'connected' : 'not connected',
    testMode: process.env.TEST_MODE === 'true' || process.env.SKIP_DB === 'true'
  });
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as current_time, current_database() as db_name');
    res.json({ 
      success: true, 
      connected: true,
      database: result.rows[0].db_name,
      time: result.rows[0].current_time
    });
  } catch (error) {
    res.json({ 
      success: false, 
      connected: false,
      error: error.message,
      code: error.code
    });
  }
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`Please either:`);
    console.error(`  1. Stop the process using port ${PORT}`);
    console.error(`  2. Use a different port by setting PORT in .env file`);
    console.error(`\nTo find what's using the port, run: netstat -ano | findstr :${PORT}`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});