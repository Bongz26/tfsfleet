// backend/src/controllers/fuelPurchaseController.js
const db = require('../config/database');

const getFuelPurchases = async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date, limit = 50, offset = 0 } = req.query;
    
    // Build base URL for receipt links
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const params = [];
    let paramCount = 1;
    
    // Get driver ID from auth if available
    const driverId = req.user?.driver_id;
    
    let query = `
      SELECT fp.*, v.reg_number as registration, v.type,
             CASE 
               WHEN fp.receipt_slip_path IS NOT NULL 
               THEN CONCAT($${paramCount}, fp.receipt_slip_path)
               ELSE NULL 
             END as receipt_slip_url
      FROM fuel_purchases fp
      LEFT JOIN vehicles v ON fp.vehicle_id = v.id
      WHERE 1=1
    `;
    params.push(baseUrl);
    paramCount++;
    
    // If driver is logged in, only show their assigned vehicle's purchases
    if (driverId) {
      query += ` AND EXISTS (
        SELECT 1 FROM driver_vehicle_assignments dva 
        WHERE dva.vehicle_id = fp.vehicle_id 
        AND dva.driver_id = $${paramCount} 
        AND dva.active = true
      )`;
      params.push(driverId);
      paramCount++;
    }
    
    if (vehicle_id) {
      query += ` AND fp.vehicle_id = $${paramCount}`;
      params.push(vehicle_id);
      paramCount++;
    }
    
    if (start_date) {
      query += ` AND fp.purchase_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND fp.purchase_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    query += ` ORDER BY fp.purchase_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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

const getFuelPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT fp.*,
              CASE 
                WHEN fp.receipt_slip_path IS NOT NULL 
                THEN CONCAT('${req.protocol}://${req.get('host')}', fp.receipt_slip_path)
                ELSE NULL 
              END as receipt_slip_url
       FROM fuel_purchases fp
       WHERE fp.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Fuel purchase not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createFuelPurchase = async (req, res) => {
  try {
    const { 
      vehicle_id, 
      liters, 
      amount, 
      receipt_number, 
      purchase_date,
      odometer_reading,
      station_name,
      notes,
      receipt_slip_path
    } = req.body;
    
    console.log('📝 createFuelPurchase called with:', {
      vehicle_id,
      liters,
      amount,
      receipt_number,
      purchase_date,
      odometer_reading,
      station_name,
      notes,
      receipt_slip_path
    });
    
    // Validate required fields
    if (!vehicle_id) {
      return res.status(400).json({ success: false, error: 'Vehicle ID is required' });
    }
    if (!liters || liters <= 0) {
      return res.status(400).json({ success: false, error: 'Liters must be greater than 0' });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be greater than 0' });
    }
    
    const result = await db.query(
      `INSERT INTO fuel_purchases 
       (vehicle_id, liters, amount, receipt_number, purchase_date, odometer_reading, station_name, notes, receipt_slip_path) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [vehicle_id, liters, amount, receipt_number, purchase_date || new Date(), odometer_reading, station_name, notes, receipt_slip_path || null]
    );
    
    console.log('✅ Fuel purchase created:', result.rows[0]?.id);
    
    // Update vehicle odometer tracking if provided
    if (vehicle_id && odometer_reading) {
      try {
        await db.query(
          `INSERT INTO vehicle_odometer (vehicle_id, odometer_reading, recorded_by, notes)
           VALUES ($1, $2, NULL, 'Recorded from fuel purchase')
           ON CONFLICT DO NOTHING`,
          [vehicle_id, odometer_reading]
        );
      } catch (error) {
        // Table might not exist yet
        console.log('Odometer tracking update:', error.message);
      }
    }
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error creating fuel purchase:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint
    });
    res.status(400).json({ 
      success: false, 
      error: error.message,
      details: error.detail || error.message
    });
  }
};

const updateFuelPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { liters, amount, receipt_number, purchase_date, odometer_reading, station_name, notes, receipt_slip_path } = req.body;
    
    const result = await db.query(
      `UPDATE fuel_purchases 
       SET liters = COALESCE($1, liters),
           amount = COALESCE($2, amount),
           receipt_number = COALESCE($3, receipt_number),
           purchase_date = COALESCE($4, purchase_date),
           odometer_reading = COALESCE($5, odometer_reading),
           station_name = COALESCE($6, station_name),
           notes = COALESCE($7, notes),
           receipt_slip_path = COALESCE($8, receipt_slip_path),
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [liters, amount, receipt_number, purchase_date, odometer_reading, station_name, notes, receipt_slip_path, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Fuel purchase not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const getFuelSummary = async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as total_purchases,
        SUM(liters) as total_liters,
        SUM(amount) as total_amount,
        AVG(amount / NULLIF(liters, 0)) as avg_price_per_liter
      FROM fuel_purchases
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (vehicle_id) {
      query += ` AND vehicle_id = $${paramCount}`;
      params.push(vehicle_id);
      paramCount++;
    }
    
    if (start_date) {
      query += ` AND purchase_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND purchase_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    const result = await db.query(query, params);
    
    // Get fuel usage from trips
    let tripQuery = `
      SELECT 
        SUM(fuel_used) as total_fuel_used,
        SUM(fuel_cost) as total_fuel_cost,
        SUM(distance) as total_distance
      FROM trips
      WHERE fuel_used IS NOT NULL AND 1=1
    `;
    const tripParams = [];
    let tripParamCount = 1;
    
    if (vehicle_id) {
      tripQuery += ` AND vehicle_id = $${tripParamCount}`;
      tripParams.push(vehicle_id);
      tripParamCount++;
    }
    
    if (start_date) {
      tripQuery += ` AND created_at >= $${tripParamCount}`;
      tripParams.push(start_date);
      tripParamCount++;
    }
    
    if (end_date) {
      tripQuery += ` AND created_at <= $${tripParamCount}`;
      tripParams.push(end_date);
      tripParamCount++;
    }
    
    const tripResult = await db.query(tripQuery, tripParams);
    
    res.json({
      success: true,
      summary: {
        purchases: result.rows[0],
        usage: tripResult.rows[0]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getFuelPurchases,
  getFuelPurchase,
  createFuelPurchase,
  updateFuelPurchase,
  getFuelSummary
};

