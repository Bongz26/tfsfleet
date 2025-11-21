// backend/src/routes/fuelPurchases.js
const express = require('express');
const router = express.Router();
const fuelPurchaseController = require('../controllers/fuelPurchaseController');
const authenticate = require('../middleware/auth');

router.get('/', authenticate, fuelPurchaseController.getFuelPurchases);
router.get('/summary', authenticate, fuelPurchaseController.getFuelSummary);
router.get('/:id', authenticate, fuelPurchaseController.getFuelPurchase);
router.post('/', authenticate, fuelPurchaseController.createFuelPurchase);
router.put('/:id', authenticate, fuelPurchaseController.updateFuelPurchase);

module.exports = router;

