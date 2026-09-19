const express = require("express");
require("dotenv").config(); // Load environment variables from .env file
const cors = require("cors");
const cron = require("node-cron"); // Schedule tasks (cron jobs)
const { sendReminderEmail } = require('./utils/emailService'); // Email sending service
const Reminder = require('./models/reminder'); // Reminder model
const Event = require('./models/Event'); // Event model
const app = express();

// Database configuration
const dbConfig = require("./config/db");

// Importing route files
const cateringRoutes = require("./routes/cateringRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const eventRoutes = require("./routes/eventRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const orderRoutes = require("./routes/OrderRoutes");
const packageRoutes = require("./routes/packageRoutes");
const parkingRoutes = require("./routes/parkingRoute");
const userRoutes = require("./routes/userRoute");
const roomRoutes = require("./routes/roomRoutes");
const reminderRoutes = require('./routes/reminderRoutes');


// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies


// Middleware to parse incoming requests with JSON payloads
app.use(express.json());

// Define routes (ensure routes are applied after middleware)
app.use("/api/catering", cateringRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/package", packageRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/user", userRoutes);
app.use("/api/room", roomRoutes);
app.use("/api/reminder", reminderRoutes);

// Cron job to check reminders every hour
// Cron job to check reminders every minute
// Cron job to check reminders every minute
cron.schedule('* * * * *', async () => { // Runs every minute
    try {
        const now = new Date();

        // Find reminders that are due and haven't been sent yet
        const reminders = await Reminder.find({
            reminderTime: { $lte: now }, // Reminder time is in the past or right now
            sentStatus: false // Only get reminders that haven't been sent yet
        });

        for (const reminder of reminders) {
            // Get the event associated with the reminder
            const event = await Event.findOne({ eventId: reminder.eventId });

            // If the event exists, send the email
            if (event) {
                await sendReminderEmail(reminder.userEmail, event);

                // Mark the reminder as sent
                reminder.sentStatus = true;
                await reminder.save();

                console.log(`Reminder email sent to ${reminder.userEmail} for event ${event.eventName}`);
            } else {
                // Log that the event was not found
                console.log(`Event not found for reminder: ${reminder._id}`);
            }
        }
    } catch (error) {
        console.error('Error sending reminders:', error);
    }
});

// Basic Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({
        error: "Something went wrong, please try again later."
    });
});

// Catch all 404 errors
app.use((req, res, next) => {
    res.status(404).send({
        error: "Route not found"
    });
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
