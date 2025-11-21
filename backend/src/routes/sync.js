// backend/src/routes/sync.js
const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const vehicleController = require('../controllers/vehicleController');
const driverController = require('../controllers/driverController');

// Bulk sync endpoint for offline data
router.post('/trips', tripController.createBulkTrips);

// Sync reference data (drivers and vehicles)
router.get('/drivers', driverController.getDrivers);
router.get('/vehicles', vehicleController.getVehicles);

module.exports = router;

