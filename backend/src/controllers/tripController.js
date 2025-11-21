// backend/src/controllers/tripController.js
const db = require('../config/database');

const getLastTripOdometer = async (req, res) => {
  try {
    const { vehicle_id } = req.query;
    
    if (!vehicle_id) {
      return res.status(400).json({ success: false, error: 'vehicle_id is required' });
    }
    
    let suggestedOdometer = null;
    
    // Try to get last trip's end odometer
    try {
      const lastTrip = await db.query(
        `SELECT end_odometer FROM trips 
         WHERE vehicle_id = $1 AND end_odometer IS NOT NULL 
         ORDER BY created_at DESC LIMIT 1`,
        [vehicle_id]
      );
      
      if (lastTrip.rows.length > 0) {
        suggestedOdometer = lastTrip.rows[0].end_odometer;
      }
    } catch (error) {
      // Trips table might not exist yet - that's OK, we'll try other methods
      // Log only if it's not a "table doesn't exist" error
      const isTableMissing = error.code === '42P01' || 
                            error.message?.includes('does not exist') ||
                            error.message?.includes('relation') ||
                            error.message?.includes('undefined table');
      
      if (!isTableMissing) {
        console.log('Error querying trips table:', error.message, error.code);
      }
    }
    
    // If no trips found, try to get from vehicle_odometer tracking table
    if (suggestedOdometer === null) {
      try {
        const odometer = await db.query(
          `SELECT odometer_reading FROM vehicle_odometer 
           WHERE vehicle_id = $1 
           ORDER BY recorded_at DESC LIMIT 1`,
          [vehicle_id]
        );
        
        if (odometer.rows.length > 0) {
          suggestedOdometer = odometer.rows[0].odometer_reading;
        }
      } catch (error) {
        // vehicle_odometer table might not exist yet - that's OK
        const isTableMissing = error.code === '42P01' || 
                              error.message?.includes('does not exist') ||
                              error.message?.includes('relation') ||
                              error.message?.includes('undefined table');
        
        if (!isTableMissing) {
          console.log('Error querying vehicle_odometer table:', error.message, error.code);
        }
      }
    }
    
    // Final fallback: return 0 if nothing found (tables don't exist or no data)
    if (suggestedOdometer === null || suggestedOdometer === undefined) {
      suggestedOdometer = 0;
    }
    
    // Always return success with a valid odometer value (even if 0)
    res.json({
      success: true,
      suggested_start_odometer: suggestedOdometer
    });
  } catch (error) {
    // If something completely unexpected happens, still return 0 instead of error
    console.error('Unexpected error in getLastTripOdometer:', error);
    res.json({
      success: true,
      suggested_start_odometer: 0
    });
  }
};

const createTrip = async (req, res) => {
  try {
    // Use logged-in driver's ID from token
    const loggedInDriverId = req.user?.driver_id;
    const { driver_id, vehicle_id, start_odo, end_odo, purpose } = req.body;
    
    console.log('📝 createTrip called with:', {
      loggedInDriverId,
      body: req.body,
      user: req.user
    });
    
    // Use logged-in driver ID if available, otherwise use provided driver_id
    const actualDriverId = loggedInDriverId || driver_id;
    
    if (!actualDriverId) {
      console.error('❌ No driver ID found - loggedInDriverId:', loggedInDriverId, 'driver_id:', driver_id);
      return res.status(400).json({ 
        success: false, 
        error: 'Driver ID is required' 
      });
    }
    
    if (!vehicle_id) {
      console.error('❌ No vehicle_id provided');
      return res.status(400).json({ 
        success: false, 
        error: 'Vehicle ID is required' 
      });
    }
    
    if (!end_odo) {
      console.error('❌ No end_odo provided');
      return res.status(400).json({ 
        success: false, 
        error: 'End odometer is required' 
      });
    }
    
    // Start odometer is calculated automatically from last trip or vehicle's current odometer
    // This ensures continuity - each trip starts where the last trip ended
    let actualStartOdo = start_odo; // Allow manual override if needed, but usually calculated
    
    if (!actualStartOdo && vehicle_id) {
      // Get last trip's end odometer for this vehicle (handles multiple drivers using same vehicle)
      const lastTrip = await db.query(
        `SELECT end_odometer FROM trips 
         WHERE vehicle_id = $1 AND end_odometer IS NOT NULL 
         ORDER BY created_at DESC LIMIT 1`,
        [vehicle_id]
      );
      
      if (lastTrip.rows.length > 0) {
        actualStartOdo = lastTrip.rows[0].end_odometer;
      } else {
        // Fall back to vehicle's current odometer from tracking table
        try {
          const odometer = await db.query(
            'SELECT get_current_odometer($1) as current_odometer',
            [vehicle_id]
          );
          if (odometer.rows.length > 0 && odometer.rows[0].current_odometer) {
            actualStartOdo = odometer.rows[0].current_odometer;
          } else {
            actualStartOdo = 0;
          }
        } catch (error) {
          // If function doesn't exist, try direct query
          const odometer = await db.query(
            'SELECT odometer_reading FROM vehicle_odometer WHERE vehicle_id = $1 ORDER BY recorded_at DESC LIMIT 1',
            [vehicle_id]
          );
          if (odometer.rows.length > 0) {
            actualStartOdo = odometer.rows[0].odometer_reading || 0;
          } else {
            actualStartOdo = 0;
          }
        }
      }
    }
    
    if (!actualStartOdo && actualStartOdo !== 0) {
      console.error('❌ Could not determine start odometer for vehicle:', vehicle_id);
      return res.status(400).json({ 
        success: false, 
        error: 'Could not determine start odometer. Please ensure vehicle exists and has odometer reading.' 
      });
    }
    
    console.log('✅ Calculated start odometer:', actualStartOdo, 'for vehicle:', vehicle_id);
    
    // Validate end odometer is greater than or equal to start
    if (actualStartOdo && end_odo && parseInt(end_odo) < parseInt(actualStartOdo)) {
      return res.status(400).json({ 
        success: false, 
        error: 'End odometer must be greater than or equal to start odometer' 
      });
    }
    
    console.log('💾 Inserting trip:', {
      driver_id: actualDriverId,
      vehicle_id,
      start_odometer: actualStartOdo,
      end_odometer: end_odo,
      purpose
    });
    
    const result = await db.query(
      `INSERT INTO trips (driver_id, vehicle_id, start_odometer, end_odometer, purpose) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [actualDriverId, vehicle_id, actualStartOdo, end_odo, purpose]
    );
    
    console.log('✅ Trip created successfully:', result.rows[0]?.id);
    
    // Update vehicle's odometer tracking
    if (vehicle_id && end_odo) {
      try {
        await db.query(
          `INSERT INTO vehicle_odometer (vehicle_id, odometer_reading, recorded_by)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [vehicle_id, end_odo, actualDriverId]
        );
      } catch (error) {
        // Table might not exist yet, log but don't fail
        console.log('Odometer tracking update:', error.message);
      }
    }
    
    // Auto-assign vehicle to driver when they use it (tracks current usage)
    // This allows drivers to use any available vehicle, and we track which one they're using
    if (vehicle_id && actualDriverId) {
      try {
        // Deactivate any existing active assignments for this driver
        // (only one active assignment per driver at a time)
        await db.query(
          `UPDATE driver_vehicle_assignments 
           SET active = false 
           WHERE driver_id = $1 AND active = true`,
          [actualDriverId]
        );
        
        // Create new assignment for this vehicle
        // Since we already deactivated old assignments, this should insert cleanly
        await db.query(
          `INSERT INTO driver_vehicle_assignments (driver_id, vehicle_id, active, notes)
           VALUES ($1, $2, true, 'Auto-assigned from trip')`,
          [actualDriverId, vehicle_id]
        );
      } catch (error) {
        // Assignment table might not exist - that's OK, drivers can still use vehicles
        if (error.code !== '42P01' && !error.message.includes('does not exist')) {
          console.log('Assignment update:', error.message);
        }
      }
    }
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      size: JSON.stringify(result.rows[0]).length // For monitoring
    });
  } catch (error) {
    console.error('❌ Error creating trip:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack
    });
    res.status(400).json({ 
      success: false, 
      error: error.message,
      details: error.detail || error.message
    });
  }
};

const createBulkTrips = async (req, res) => {
  try {
    const { trips } = req.body; // Array of trip objects
    
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const trip of trips) {
        // Calculate start odometer automatically (same logic as single trip)
        let actualStartOdo = trip.start_odo; // Allow manual override if needed
        
        if (!actualStartOdo && trip.vehicle_id) {
          const lastTrip = await client.query(
            `SELECT end_odometer FROM trips 
             WHERE vehicle_id = $1 AND end_odometer IS NOT NULL 
             ORDER BY created_at DESC LIMIT 1`,
            [trip.vehicle_id]
          );
          if (lastTrip.rows.length > 0) {
            actualStartOdo = lastTrip.rows[0].end_odometer;
          } else {
            const vehicle = await client.query(
              'SELECT current_odometer FROM vehicles WHERE id = $1',
              [trip.vehicle_id]
            );
            if (vehicle.rows.length > 0) {
              actualStartOdo = vehicle.rows[0].current_odometer || 0;
            }
          }
        }
        
        if (!actualStartOdo) {
          throw new Error(`Could not determine start odometer for vehicle ${trip.vehicle_id}`);
        }
        
        const result = await client.query(
          `INSERT INTO trips (driver_id, vehicle_id, start_odometer, end_odometer, purpose) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING id`,
          [trip.driver_id, trip.vehicle_id, actualStartOdo, trip.end_odo, trip.purpose]
        );
        results.push(result.rows[0].id);
      }
      
      await client.query('COMMIT');
      res.json({ success: true, synced_ids: results, count: results.length });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error creating trip:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack
    });
    res.status(400).json({ 
      success: false, 
      error: error.message,
      details: error.detail || error.message
    });
  }
};

const getTrips = async (req, res) => {
  try {
    const { limit = 50, offset = 0, driver_id, vehicle_id } = req.query;
    
    // Check if trips table exists first
    try {
      let query = 'SELECT * FROM trips WHERE 1=1';
      const params = [];
      let paramCount = 1;
      
      if (driver_id) {
        query += ` AND driver_id = $${paramCount}`;
        params.push(driver_id);
        paramCount++;
      }
      
      if (vehicle_id) {
        query += ` AND vehicle_id = $${paramCount}`;
        params.push(vehicle_id);
        paramCount++;
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(parseInt(limit), parseInt(offset));
      
      const result = await db.query(query, params);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      // If trips table doesn't exist, return empty array
      const isTableMissing = error.code === '42P01' || 
                            error.message?.includes('does not exist') ||
                            error.message?.includes('relation') ||
                            error.message?.includes('undefined table');
      
      if (isTableMissing) {
        console.log('Trips table does not exist yet - returning empty array');
        return res.json({
          success: true,
          data: [],
          count: 0
        });
      }
      
      // Re-throw if it's a different error
      throw error;
    }
  } catch (error) {
    console.error('Error in getTrips:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getTripSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        COUNT(*) as total_trips,
        SUM(distance) as total_distance,
        SUM(fuel_used) as total_fuel,
        SUM(fuel_cost) as total_cost
      FROM trips
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (start_date) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      summary: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getLastTripOdometer, createTrip, createBulkTrips, getTrips, getTripSummary };
