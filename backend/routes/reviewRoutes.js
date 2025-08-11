const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// GET all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// POST a new review
router.post('/', async (req, res) => {
  const { name, college, review } = req.body;

  try {
    const newReview = new Review({ name, college, review });
    await newReview.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(400).json({ message: 'Error saving review' });
  }
});

module.exports = router;
