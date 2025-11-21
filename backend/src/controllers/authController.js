// backend/src/controllers/authController.js
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// Simple driver login - using driver ID (you can enhance this with password later)
const login = async (req, res) => {
  try {
    const { driver_id } = req.body;
    
    if (!driver_id) {
      return res.status(400).json({ success: false, error: 'Driver ID is required' });
    }
    
    // Get driver from existing database
    const driver = await db.query(
      'SELECT id, name, contact, active FROM drivers WHERE id = $1 AND active = true',
      [driver_id]
    );
    
    if (driver.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Driver not found or inactive' });
    }
    
    // Drivers can use any available vehicle - no pre-assignment needed
    // Optionally get the last vehicle they used for convenience
    let lastUsedVehicle = null;
    
    try {
      const lastTrip = await db.query(
        `SELECT v.id, v.reg_number, v.type, v.status 
         FROM trips t
         INNER JOIN vehicles v ON t.vehicle_id = v.id
         WHERE t.driver_id = $1 AND v.available = true
         ORDER BY t.created_at DESC
         LIMIT 1`,
        [driver_id]
      );
      
      if (lastTrip.rows.length > 0) {
        lastUsedVehicle = lastTrip.rows[0];
      }
    } catch (error) {
      // Trips table might not exist yet - that's OK
      if (error.code !== '42P01' && !error.message.includes('does not exist')) {
        console.log('Error getting last used vehicle:', error.message);
      }
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        driver_id: driver.rows[0].id,
        name: driver.rows[0].name
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      driver: {
        id: driver.rows[0].id,
        name: driver.rows[0].name,
        contact: driver.rows[0].contact
      },
      lastUsedVehicle: lastUsedVehicle // Optional: last vehicle they used (for convenience)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get current logged-in driver info
const getCurrentDriver = async (req, res) => {
  try {
    const driverId = req.user?.driver_id;
    
    if (!driverId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    
    const driver = await db.query(
      'SELECT id, name, contact, active FROM drivers WHERE id = $1',
      [driverId]
    );
    
    if (driver.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    
    // Get last used vehicle (optional, for convenience)
    let lastUsedVehicle = null;
    try {
      const lastTrip = await db.query(
        `SELECT v.id, v.reg_number, v.type, v.status, v.current_location
         FROM trips t
         INNER JOIN vehicles v ON t.vehicle_id = v.id
         WHERE t.driver_id = $1 AND v.available = true
         ORDER BY t.created_at DESC
         LIMIT 1`,
        [driverId]
      );
      
      if (lastTrip.rows.length > 0) {
        lastUsedVehicle = lastTrip.rows[0];
      }
    } catch (error) {
      // Trips table might not exist yet - that's OK
    }
    
    res.json({
      success: true,
      driver: driver.rows[0],
      lastUsedVehicle
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  login,
  getCurrentDriver
};

