// backend/src/routes/drivers.js
const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');

router.get('/', driverController.getDrivers);
router.get('/:id', driverController.getDriver);
router.post('/', driverController.createDriver);
router.put('/:id', driverController.updateDriver);

module.exports = router;

