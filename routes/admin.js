const express = require('express');
const knex = require('knex')(require('../knexfile').development);

const router = express.Router();
const { ADMIN_API_KEY } = process.env;

// Middleware for API key validation
const verifyAdmin = (req, res, next) => {
  if (req.headers['x-api-key'] !== ADMIN_API_KEY) {
    return res.status(403).send({ error: 'Forbidden' });
  }
  next();
};

// Add Train
router.post('/train', verifyAdmin, async (req, res) => {
  const { train_name, source, destination, total_seats } = req.body;

  try {
    await knex('trains').insert({ train_name, source, destination, total_seats, available_seats: total_seats });
    res.status(201).send({ message: 'Train added successfully' });
  } catch (err) {
    res.status(400).send({ error: 'Failed to add train' });
  }
});

module.exports = router;
