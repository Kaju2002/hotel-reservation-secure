const mongoose = require('mongoose');

const CheffMealSchema = new mongoose.Schema({
    foodImageUrl: { type: String, required: true },
    foodName: { type: String, required: true },
    foodQuantity: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

const CheffMeal = mongoose.model('CheffMeal', CheffMealSchema);
module.exports = CheffMeal;
