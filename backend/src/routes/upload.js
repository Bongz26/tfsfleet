// backend/src/routes/upload.js
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const path = require('path');

// Upload receipt slip
router.post('/receipt', upload.single('receipt'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Return the file path relative to uploads directory
    const filePath = `/uploads/receipts/${req.file.filename}`;
    
    res.json({
      success: true,
      filePath: filePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Serve uploaded files
router.get('/receipts/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads/receipts', filename);
  res.sendFile(filePath);
});

module.exports = router;

