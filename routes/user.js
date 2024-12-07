const express = require('express');
const jwt = require('jsonwebtoken');
const knex = require('knex')(require('../knexfile').development);

const router = express.Router();
const { JWT_SECRET } = process.env;

// Middleware for user authentication
const authenticateUser = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).send({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).send({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Get Seat Availability
router.get('/trains', authenticateUser, async (req, res) => {
  const { source, destination } = req.query;

  try {
    const trains = await knex('trains').where({ source, destination }).select('id', 'train_name', 'available_seats');
    res.send(trains);
  } catch (err) {
    res.status(400).send({ error: 'Failed to fetch trains' });
  }
});

// Book Seat
router.post('/book', authenticateUser, async (req, res) => {
  const { train_id, seat_count } = req.body;
  const user_id = req.user.id;

  try {
    await knex.transaction(async (trx) => {
      const train = await trx('trains').where({ id: train_id }).forUpdate().first();
      if (!train || train.available_seats < seat_count) {
        throw new Error('Insufficient seats');
      }
      await trx('trains').where({ id: train_id }).update({ available_seats: train.available_seats - seat_count });
      await trx('bookings').insert({ user_id, train_id, seat_count, status: 'confirmed' });
    });
    res.send({ message: 'Booking successful' });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

module.exports = router;
