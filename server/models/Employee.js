const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
    {
        imageUrl: {
            type: String,
            required: true,
        },

        employeeId: {
            type: String,
            required: true,
        },
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
        email: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        leaves: [
            {
                leaveID: { type: String, required: true },
                fromDate: { type: Date, required: true },
                toDate: { type: Date, required: true },
                status: { type: String, enum: ['Pending', 'Approved', 'Denied'], default: 'Pending' }
            }
        ],
        department: {
            type: String,
            default: "General",
        },
        photoUrl: {
            type: String,
            default: "",
        },
        customerSatisfaction: {
            type: Number,
            default: 0,
        },
        tasksCompleted: {
            type: Number,
            default: 0,
        },
        recentAchievement: {
            type: String,
            default: "",
        },
        salary: {
            amount: {
                type: Number
            },
            bank: {
                type: String
            },
            bankBranchNumber: {
                type: String
            },
            accountNumber: {
                type: String
            },
            dateAdded: {
                type: Date,
                default: Date.now, // Automatically set to the current date when created
            }
        },
        dutyDate: {
            type: Date,
            default: "",
        },
    },
    { timestamps: true }
);

const employeeModel = mongoose.model("employees", employeeSchema);
module.exports = employeeModel;