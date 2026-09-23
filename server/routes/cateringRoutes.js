const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../utils/upload'); // Adjust path as necessary
const cateringModel = require('../models/Catering');

// Function to generate a unique item ID
async function generateUniqueItemId() {
    let unique = false;
    let itemId;

    while (!unique) {
        const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
        itemId = `I${randomNumber}`;

        const existingItem = await cateringModel.findOne({ itemId });
        if (!existingItem) {
            unique = true;
        }
    }

    return itemId;
}

// Route to get all food items
router.get('/getItems', async (req, res) => {
    try {
        const items = await cateringModel.find();
        res.json(items);
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).send('Error fetching items');
    }
});

// Route to add a new food item with image upload
router.post('/addItem', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category, type } = req.body;
        const itemId = await generateUniqueItemId();

        // Store only the relative path for the image URL
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : ''; // Only keep the relative path

        console.log('Generated itemId:', itemId); // Log generated ID

        const newItem = new cateringModel({
            imageUrl,
            itemId,
            name,
            description,
            price,
            category,
            type,
        });

        await newItem.save();

        console.log('New item added successfully:', newItem);
        res.status(201).json(newItem);
    } catch (err) {
        console.error('Error adding item:', err); // Log any errors
        res.status(500).send('Error adding item');
    }
});

// Route to update a food item
router.post('/updateItem', upload.single('image'), async (req, res) => {
    try {
        const { itemId, name, description, price, category, type } = req.body;

        // Validation to check if itemId is provided
        if (!itemId) {
            console.error('ItemId is missing in the update request');
            return res.status(400).send('itemId is required');
        }

        // Log the incoming data for debugging
        console.log('Update request received with:', { itemId, name, description, price, category, type });

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

        // Log the image update status
        if (imageUrl) {
            console.log('New image uploaded:', imageUrl);
        } else {
            console.log('No new image uploaded.');
        }

        // Find and update the item by itemId
        const updatedItem = await cateringModel.findOneAndUpdate(
            { itemId },
            {
                name,
                description,
                price,
                category,
                type,
                ...(imageUrl && { imageUrl }) // Only update imageUrl if a new image is uploaded
            },
            { new: true }
        );

        if (!updatedItem) {
            console.error('Item not found with itemId:', itemId);
            return res.status(404).send('Item not found');
        }

        console.log('Item successfully updated:', updatedItem);
        res.json(updatedItem);
    } catch (err) {
        console.error('Error updating item:', err);
        res.status(500).send('Error updating item');
    }
});

// Route to delete a food item
router.post('/deleteItem', async (req, res) => {
    try {
        const { itemId } = req.body;

        if (!itemId) {
            console.error('ItemId is missing in the delete request');
            return res.status(400).send('itemId is required');
        }

        const deletedItem = await cateringModel.findOneAndDelete({ itemId });

        if (!deletedItem) {
            console.error('Item not found with itemId:', itemId);
            return res.status(404).send('Item not found');
        }

        console.log('Item deleted successfully:', deletedItem);
        res.send('Item deleted successfully');
    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(500).send('Error deleting item');
    }
});

module.exports = router;
