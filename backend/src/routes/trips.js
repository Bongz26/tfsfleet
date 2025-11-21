// backend/src/routes/trips.js
const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const authenticate = require('../middleware/auth');

// Data-efficient endpoints
router.get('/last-odometer', authenticate, tripController.getLastTripOdometer); // Get suggested start odometer
router.post('/', authenticate, tripController.createTrip);
router.post('/bulk', authenticate, tripController.createBulkTrips); // For offline sync
router.get('/', authenticate, tripController.getTrips);
router.get('/summary', authenticate, tripController.getTripSummary); // Lightweight stats

module.exports = router;