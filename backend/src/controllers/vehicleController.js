// backend/src/controllers/vehicleController.js
const db = require('../config/database');

const getVehicles = async (req, res) => {
  try {
    // Drivers can use any available vehicle - show all available vehicles
    const result = await db.query(
      'SELECT id, reg_number, type, status, available, current_location FROM vehicles WHERE available = true ORDER BY reg_number'
    );
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        registration: row.reg_number, // Map reg_number to registration
        make: null, // Not in existing schema
        model: row.type, // Use type as model
        year: null, // Not in existing schema
        current_odometer: null, // Not in existing schema - will need to track separately
        is_active: row.available
      }))
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM vehicles WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createVehicle = async (req, res) => {
  try {
    const { registration, make, model, year, current_odometer } = req.body;
    
    const result = await db.query(
      `INSERT INTO vehicles (registration, make, model, year, current_odometer) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [registration, make, model, year, current_odometer || 0]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ success: false, error: 'Vehicle registration already exists' });
    } else {
      res.status(400).json({ success: false, error: error.message });
    }
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { registration, make, model, year, current_odometer, is_active } = req.body;
    
    const result = await db.query(
      `UPDATE vehicles 
       SET registration = COALESCE($1, registration),
           make = COALESCE($2, make),
           model = COALESCE($3, model),
           year = COALESCE($4, year),
           current_odometer = COALESCE($5, current_odometer),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [registration, make, model, year, current_odometer, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
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
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle
};

