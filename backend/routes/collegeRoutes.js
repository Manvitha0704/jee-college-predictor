const express = require('express');
const router = express.Router();

// Controller
const { predictCollege } = require('../controllers/collegeController');

// Route: POST /api/college/predict
router.post('/predict', predictCollege);

// // Optional: Health check or test route
// router.get('/seatmatrix',async(req, res) => {
//   res.send('🎓 College Routes API is working');
// });

// backend/routes/collegeRoutes.js (or another route file)
const SeatMatrix = require('../models/SeatMatrix');
router.get('/seatmatrix', async (req, res) => {
  try {
    const data = await SeatMatrix.find(); // Fetch all seat matrix data
    res.json(data);
  } catch (err) {
    console.error('❌ Error fetching seat matrix:', err);
    res.status(500).json({ message: 'Failed to fetch seat matrix data' });
  }
});


module.exports = router;
