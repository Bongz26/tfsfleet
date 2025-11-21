// backend/src/controllers/maintenanceController.js
const db = require('../config/database');

const getMaintenanceNotes = async (req, res) => {
  try {
    const { vehicle_id, status, maintenance_type, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT mn.*, v.registration, v.make, v.model 
      FROM maintenance_notes mn
      LEFT JOIN vehicles v ON mn.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (vehicle_id) {
      query += ` AND mn.vehicle_id = $${paramCount}`;
      params.push(vehicle_id);
      paramCount++;
    }
    
    if (status) {
      query += ` AND mn.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (maintenance_type) {
      query += ` AND mn.maintenance_type = $${paramCount}`;
      params.push(maintenance_type);
      paramCount++;
    }
    
    query += ` ORDER BY mn.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getMaintenanceNote = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM maintenance_notes WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Maintenance note not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createMaintenanceNote = async (req, res) => {
  try {
    const { 
      vehicle_id, 
      note, 
      maintenance_type,
      status,
      cost,
      service_date,
      odometer_reading
    } = req.body;
    
    const result = await db.query(
      `INSERT INTO maintenance_notes 
       (vehicle_id, note, maintenance_type, status, cost, service_date, odometer_reading) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [vehicle_id, note, maintenance_type || 'general', status || 'pending', cost, service_date, odometer_reading]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const updateMaintenanceNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, maintenance_type, status, cost, service_date, odometer_reading } = req.body;
    
    const result = await db.query(
      `UPDATE maintenance_notes 
       SET note = COALESCE($1, note),
           maintenance_type = COALESCE($2, maintenance_type),
           status = COALESCE($3, status),
           cost = COALESCE($4, cost),
           service_date = COALESCE($5, service_date),
           odometer_reading = COALESCE($6, odometer_reading),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [note, maintenance_type, status, cost, service_date, odometer_reading, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Maintenance note not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const deleteMaintenanceNote = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM maintenance_notes WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Maintenance note not found' });
    }
    
    res.json({
      success: true,
      message: 'Maintenance note deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getMaintenanceNotes,
  getMaintenanceNote,
  createMaintenanceNote,
  updateMaintenanceNote,
  deleteMaintenanceNote
};

