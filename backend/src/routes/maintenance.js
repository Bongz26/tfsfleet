// backend/src/routes/maintenance.js
const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');

router.get('/', maintenanceController.getMaintenanceNotes);
router.get('/:id', maintenanceController.getMaintenanceNote);
router.post('/', maintenanceController.createMaintenanceNote);
router.put('/:id', maintenanceController.updateMaintenanceNote);
router.delete('/:id', maintenanceController.deleteMaintenanceNote);

module.exports = router;

