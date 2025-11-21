// backend/src/config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Test mode - skip database if TEST_MODE is enabled
const TEST_MODE = process.env.TEST_MODE === 'true' || process.env.SKIP_DB === 'true';

let pool = null;

if (!TEST_MODE) {
  // Support Supabase connection string or individual parameters
  let poolConfig;
  
  if (process.env.DATABASE_URL) {
    // Use connection string (Supabase format)
    // Supabase connection strings require SSL
    poolConfig = {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Supabase requires SSL
      connectionTimeoutMillis: 15000,
      max: 10, // Connection pool size
    };
    console.log('🔗 Using DATABASE_URL connection string');
  } else if (process.env.DB_HOST) {
    // Use individual parameters
    poolConfig = {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST,
      database: process.env.DB_NAME || 'postgres',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT) || 5432,
      ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 15000,
      max: 10,
    };
    console.log(`🔗 Connecting to ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}`);
  } else {
    console.error('❌ No database configuration found!');
    console.error('   Set either DATABASE_URL or DB_HOST in .env file');
    pool = null;
  }

  pool = new Pool(poolConfig);

  // Handle connection errors gracefully
  pool.on('error', (err) => {
    console.error('Database pool error:', err.message);
    console.error('Error code:', err.code);
    // Don't exit - allow server to continue
  });
  
  // Test connection on startup
  pool.connect()
    .then((client) => {
      console.log('✅ Database pool created successfully');
      client.release();
    })
    .catch((err) => {
      console.error('❌ Failed to create database pool:', err.message);
      console.error('Error code:', err.code);
      if (err.code === 'ENOTFOUND') {
        console.error('⚠️  Check your DATABASE_URL or DB_HOST - hostname not found');
      } else if (err.code === '28P01') {
        console.error('⚠️  Authentication failed - check your database password');
      } else if (err.code === '3D000') {
        console.error('⚠️  Database does not exist - check your database name');
      }
    });
}

// Mock query function for test mode
const query = (text, params) => {
  if (TEST_MODE || !pool) {
    console.warn('⚠️  Database not connected - running in test mode');
    return Promise.resolve({ rows: [], rowCount: 0 });
  }
  return pool.query(text, params).catch(err => {
    console.error('Database query error:', err.message);
    console.error('Query:', text);
    console.error('Params:', params);
    throw err;
  });
};

module.exports = {
  query,
  pool: pool || { 
    connect: () => Promise.resolve({ 
      query: () => Promise.resolve({ rows: [], rowCount: 0 }),
      release: () => {}
    })
  },
  isConnected: () => !TEST_MODE && pool !== null
};