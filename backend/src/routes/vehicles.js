// backend/src/routes/vehicles.js
const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const authenticate = require('../middleware/auth');

// Get vehicles - requires authentication to show only assigned vehicle
router.get('/', authenticate, vehicleController.getVehicles);
router.get('/:id', authenticate, vehicleController.getVehicle);
router.post('/', vehicleController.createVehicle);
router.put('/:id', vehicleController.updateVehicle);

module.exports = router;

