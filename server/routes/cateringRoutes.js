const express = require('express');
const router = express.Router();

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
        res.status(500).send(err);
    }
});

// Route to add a new food item
router.post('/addItem', async (req, res) => {
    try {
      const { name, description, price, category, type, imageUrl } = req.body;
      const itemId = await generateUniqueItemId();
  
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
  
      res.status(201).json(newItem);
    } catch (err) {
      console.error("Error adding item:", err); // Log any errors
      res.status(500).send(err);
    }
  });
  

// Route to update a food item
router.post('/updateItem', async (req, res) => {
    try {
        const { itemId, name, description, price, category, type, imageUrl } = req.body;
        
        // Validation to check if itemId is provided
        if (!itemId) {
            return res.status(400).send('itemId is required');
        }

        // Find and update the item by itemId
        const updatedItem = await cateringModel.findOneAndUpdate(
            { itemId },
            { name, description, price, category, type ,imageUrl },
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).send('Item not found');
        }

        res.json(updatedItem);
    } catch (err) {
        res.status(500).send(err);
    }
});


// Route to delete a food item
router.post('/deleteItem', async (req, res) => {
    try {
        const { itemId } = req.body;

        const deletedItem = await cateringModel.findOneAndDelete({ itemId });

        if (!deletedItem) {
            return res.status(404).send('Item not found');
        }

        res.send('Item deleted successfully');
    } catch (err) {
        res.status(500).send(err);
    }
});



module.exports = router;
