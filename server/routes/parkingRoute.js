const express = require('express');
const router = express.Router();
const parkingMail = require('../utils/parkingMail');

const parkingModel = require('../models/Parking');

router.get('/availability', async (req, res) => {
    const { date, userID } = req.query;
    try {
        const bookings = await parkingModel.find({ bookingDate: date, userID });
        const bookedSlots = bookings.map(booking => booking.parkingId);
        const allSlots = Array.from({ length: 50 }, (_, i) => i < 20 ? `B${i + 1}` : `C${i - 19}`);
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
        res.status(200).json(availableSlots);
    } catch (error) {
        res.status(500).json({ message: "Error fetching availability" });
    }
});

// Endpoint to book a parking slot
router.post('/book', async (req, res) => {
    const { vehicleNumber, parkingSlot, date, duration, userID, Price } = req.body;
    try {
        const existingBooking = await parkingModel.findOne({ parkingId: parkingSlot, date });
        if (existingBooking) {
            return res.status(400).json({ message: "Slot already booked for this date." });
        }
        const newBooking = new parkingModel({
            parkingId: parkingSlot,
            vehicleNumber,
            bookingDate: date,
            packageType: duration,
            userID,
            price : Price
        });
        await newBooking.save();
        res.status(200).json({ message: "Parking slot booked successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error booking the parking slot." });
    }
});

// Endpoint to retrieve parking bookings for a specific user
router.post('/getUserParking', async (req, res) => {
    const { userID } = req.body;

    try {
        const bookings = await parkingModel.find({ userID });
        if (bookings.length === 0) {
            return res.status(404).json({ message: "No bookings found for this user." });
        }
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving parking bookings." });
    }
});

module.exports = router;

// Endpoint to delete a parking booking using POST
router.post('/delete', async (req, res) => {
    const { parkingId } = req.body;
    try {
        const deletedBooking = await parkingModel.findOneAndDelete({ parkingId });
        if (!deletedBooking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        res.json({ message: "Parking booking deleted successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error deleting the parking booking." });
    }
});

router.post('/request-cancel', async (req, res) => {
    const { parkingId } = req.body;
    try {
        const booking = await parkingModel.findOne({ parkingId });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        booking.status = 'pending';
        await booking.save();
        res.json({ message: "Cancellation request submitted." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error submitting cancellation request." });
    }
});

router.post('/cancel-booking', async (req, res) => {
    const { parkingId, action } = req.body; // action can be 'approve' or 'decline'
    try {
        const booking = await parkingModel.findOne({ parkingId });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        if (action === 'approve') {
            await parkingModel.findOneAndDelete({ parkingId }); // Delete the booking if approved
            res.json({ message: "Booking canceled successfully." });
        } else if (action === 'decline') {
            booking.status = 'declined'; // Update status to declined
            await booking.save();
            res.json({ message: "Cancellation request declined." });
        } else {
            return res.status(400).json({ message: "Invalid action." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error processing cancellation request." });
    }
});



// Endpoint to update a parking booking using POST
router.post('/update', async (req, res) => {
    const { parkingId, bookingDate, vehicleNumber } = req.body;
    try {
        const updatedBooking = await parkingModel.findOneAndUpdate(
            { parkingId },
            { bookingDate, vehicleNumber },
            { new: true }
        );
        if (!updatedBooking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        res.json({ message: "Parking booking updated successfully.", updatedBooking });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error updating the parking booking." });
    }
});

// Endpoint to retrieve all parking bookings
router.get('/getAllParkings', async (req, res) => {
    try {
        const bookings = await parkingModel.find({});
        if (bookings.length === 0) {
            return res.status(404).json({ message: "No bookings found." });
        }
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving parking bookings." });
    }
});

router.post('/send-gatepass', async (req, res) => {
    const { userEmail, bookingDetails, qrCode } = req.body;

    try {
        // Send the gate pass email
        await parkingMail.sendGatePassEmail(userEmail, bookingDetails, qrCode);
        res.status(200).json({ message: "Gate pass email sent successfully." });
    } catch (error) {
        res.status(500).json({ message: "Failed to send gate pass email.", error });
    }
    
});
router.get('/availability/today', async (req, res) => {
    const systemDate = new Date().toISOString().split('T')[0]; // Get the system date in YYYY-MM-DD format
    const { userID } = req.query;

    try {
        // Fetch bookings for the current date and the specified user
        const bookings = await parkingModel.find({ bookingDate: systemDate, userID });

        // Get the list of already booked parking slots
        const bookedSlots = bookings.map(booking => booking.parkingId);

        // Define all possible parking slots (assuming 50 total slots, B1-B20 and C1-C30)
        const allSlots = Array.from({ length: 50 }, (_, i) => i < 20 ? `B${i + 1}` : `C${i - 19}`);

        // Calculate the available slots by filtering out booked ones
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

        // Return the count of available slots
        res.json({ totalAvailableSlots: availableSlots.length });
    } catch (error) {
        res.status(500).json({ message: "Error fetching availability for today's date" });
    }
});

router.get('/availability/date', async (req, res) => {
    const { date, userID } = req.query; // Get the date from query parameters

    if (!date) {
        return res.status(400).json({ message: "Please provide a valid date." });
    }

    try {
        const bookings = await parkingModel.find({ bookingDate: date, userID });
        const bookedSlots = bookings.map(booking => booking.parkingId);
        const allSlots = Array.from({ length: 50 }, (_, i) => i < 20 ? `B${i + 1}` : `C${i - 19}`);
        const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
        res.json(availableSlots);
    } catch (error) {
        res.status(500).json({ message: "Error fetching availability for the specified date." });
    }
});



module.exports = router;

