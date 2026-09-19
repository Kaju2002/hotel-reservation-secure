const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const packageModel = require("../models/Package");
const PackageBooking = require("../models/PackageBooking")

// Function to generate a unique package ID
const generatePackageId = async () => {
      const lastPackage = await packageModel.findOne().sort({ packageId: -1 });
      if (!lastPackage) {
            return "PKG0001"; // Starting ID
      }

      const lastIdNumber = parseInt(
            lastPackage.packageId.replace("PKG", ""),
            10
      );
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
      const { packageImage,packageName, description,size, price } = req.body;

      try {
            // Check if a package with the same name already exists
            const existingPackage = await packageModel.findOne({ packageName });
            if (existingPackage) {
                  return res
                        .status(400)
                        .json({
                              message: "Package with this name already exists",
                        });
            }

            // Create a new package if it doesn't exist
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
            // Check if another package with the same name exists (excluding the current package)
            const existingPackage = await packageModel.findOne({
                  packageName,
                  _id: { $ne: req.params.id },
            });
            if (existingPackage) {
                  return res
                        .status(400)
                        .json({
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
      // Fetch the latest booking, sorted by bookingID in descending order
      const lastBooking = await PackageBooking.findOne().sort({ bookingID: -1 });
    
      // If no bookings are found, start with the initial booking ID
      if (!lastBooking) {
        return "Res001"; // Starting ID
      }
    
      // Extract the numeric part of the bookingID, e.g., '001' from 'Res001'
      const lastIdNumber = parseInt(lastBooking.bookingID.replace("Res", ""), 10);
      
      // Increment the numeric part by 1
      const newIdNumber = lastIdNumber + 1;
    
      // Format the new bookingID, ensuring it's 3 digits
      return `Res${newIdNumber.toString().padStart(3, "0")}`;
    };
    

// Route to create a new package reservation
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
        // Generate a custom booking ID by fetching the latest one from the database
        const bookingID = await generateBookingID();
    
        // Find the package using its _id
        const pkg = await packageModel.findById(req.params.id);
        if (!pkg) {
          return res.status(404).json({ message: "Package not found" });
        }
    
        // Create a new booking with the custom booking ID
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
    
        // Save the booking to the database
        await newBooking.save();
    
        res.status(201).json({ message: "Reservation successful!", booking: newBooking });
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

