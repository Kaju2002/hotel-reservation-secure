const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userID: {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: false,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    userType: {
        type: String,
        default: "Customer",
    },
    profilePic: {
        type: String, // You can change this to `Buffer` if you're storing the image binary data instead
        required: false, // Set to true if the profile picture is mandatory
    },
}, { timestamps: true });

const User = mongoose.model("users", userSchema);

module.exports = User;
