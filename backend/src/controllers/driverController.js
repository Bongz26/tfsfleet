// backend/src/controllers/driverController.js
const db = require('../config/database');

const getDrivers = async (req, res) => {
  try {
    // Check if database is connected
    if (!db.isConnected()) {
      console.warn('Database not connected - returning empty array');
      return res.json({
        success: true,
        data: []
      });
    }
    
    // Use existing schema: id, name, contact, active
    // Handle case where 'active' column might be NULL
    const result = await db.query(
      'SELECT id, name, contact, active FROM drivers WHERE (active = true OR active IS NULL) ORDER BY name'
    );
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        phone: row.contact, // Map contact to phone for frontend compatibility
        email: null, // Not in existing schema
        is_active: row.active
      }))
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        detail: error.detail,
        hint: error.hint
      } : undefined
    });
  }
};

const getDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM drivers WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createDriver = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    
    const result = await db.query(
      `INSERT INTO drivers (name, phone, email) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, phone, email]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, is_active } = req.body;
    
    const result = await db.query(
      `UPDATE drivers 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, phone, email, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver
};

