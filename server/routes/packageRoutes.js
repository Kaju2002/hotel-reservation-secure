const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const packageModel = require("../models/Package");
const PackageBooking = require("../models/PackageBooking");

// Email sending function
const sendEmail = async (reservationData) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // You can use any service like Gmail, Outlook, etc.
      auth: {
            user: process.env.GMAIL_EMAIL, // Gmail email from .env
            pass: process.env.GMAIL_PASSWORD, // Gmail password from .env
      },
    });

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: reservationData.guestEmail,
      subject: 'Reservation Confirmation',
      text: `Dear Cutomer,${reservationData.guestName},\n\nThank you for reserving the package "${reservationData.packageName}" with us. Your reservation details are as follows:\n\nPackage: ${reservationData.packageName}\nStart Date: ${reservationData.startDate}\nEnd Date: ${reservationData.endDate}\nTotal Amount: Rs ${reservationData.totalAmount}\n\nWe look forward to serving you.Please feel free to contact us anytime.!\n\nBest regards,\nSixth Gear`,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Function to generate a unique package ID
const generatePackageId = async () => {
  const lastPackage = await packageModel.findOne().sort({ packageId: -1 });
  if (!lastPackage) {
    return "PKG0001"; // Starting ID
  }
  const lastIdNumber = parseInt(lastPackage.packageId.replace("PKG", ""), 10);
  const newIdNumber = lastIdNumber + 1;
  return `PKG${newIdNumber.toString().padStart(4, "0")}`;
};

// Get all packages
router.get("/getPackages", async (req, res) => {
  try {
    const packages = await packageModel.find();
    res.json({ packages });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch packages" });
  }
});

// Get a single package
router.get("/getPackage/:id", async (req, res) => {
  try {
    const package = await packageModel.findById(req.params.id);
    res.json({ package });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch package" });
  }
});

// Add new package
router.post("/addPackage", async (req, res) => {
  const packageId = await generatePackageId();
  const { packageImage, packageName, description, size, price } = req.body;

  try {
    const existingPackage = await packageModel.findOne({ packageName });
    if (existingPackage) {
      return res.status(400).json({
        message: "Package with this name already exists",
      });
    }

    const newPackage = new packageModel({
      packageId,
      packageImage,
      packageName,
      description,
      size,
      price,
    });
    const savedPackage = await newPackage.save();
    res.status(201).json(savedPackage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update package
router.put("/updatePackage/:id", async (req, res) => {
  try {
    const { packageName } = req.body;
    const existingPackage = await packageModel.findOne({
      packageName,
      _id: { $ne: req.params.id },
    });
    if (existingPackage) {
      return res.status(400).json({
        message: "Package with this name already exists",
      });
    }

    await packageModel.findByIdAndUpdate(req.params.id, req.body);
    res.json({ message: "Package updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update package" });
  }
});

// Delete package
router.delete("/deletePackage/:id", async (req, res) => {
  try {
    await packageModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Package deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete package" });
  }
});

// Function to generate a unique booking ID
const generateBookingID = async () => {
  const lastBooking = await PackageBooking.findOne().sort({ bookingID: -1 });
  if (!lastBooking) {
    return "Res001"; // Starting ID
  }
  const lastIdNumber = parseInt(lastBooking.bookingID.replace("Res", ""), 10);
  const newIdNumber = lastIdNumber + 1;
  return `Res${newIdNumber.toString().padStart(3, "0")}`;
};

// Route to create a new package reservation
// New part
router.post("/reservePackage/:id", async (req, res) => {
      const {
        userID,
        guestName,
        guestEmail,
        guestPhone,
        startDate,
        endDate,
        totalAmount,
      } = req.body;
    
      try {
        const bookingID = await generateBookingID(); // Generate Booking ID
        const pkg = await packageModel.findById(req.params.id); // Fetch the package
    
        if (!pkg) {
          return res.status(404).json({ message: "Package not found" });
        }
    
        const newBooking = new PackageBooking({
          bookingID,
          userID,
          packageId: pkg._id,
          guestName,
          guestEmail,
          guestPhone,
          startDate,
          endDate,
          totalAmount,
        });
    
        await newBooking.save();
    
        // Send email after reservation is saved
        // Ensure packageName is correctly passed here
        await sendEmail({
          guestName,
          guestEmail,
          packageName: pkg.packageName, // Pass the correct packageName
          startDate,
          endDate,
          totalAmount,
        });
    
        //email notification sent
        res.status(201).json({ message: "Reservation successful! ", booking: newBooking });
      } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Server error" });
      }
    });
    

// Route to get all reservations
router.get("/getBookingData", async (req, res) => {
  try {
    const reservations = await PackageBooking.find();
    res.json({ reservations });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
