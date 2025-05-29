const express = require('express');
const router = express.Router();
const bookingController = require('../controller/bookingController');

// Book a room
router.post('/bookings', bookingController.bookRoom);

// Cancel a booking
router.delete('/cancel/:bookingId', bookingController.cancelBooking);

// View current bookings
router.get('/bookings', bookingController.getAllBookings);

// Check available rooms for a slot
router.get('/rooms/available', bookingController.getAvailableRooms);

module.exports = router;
