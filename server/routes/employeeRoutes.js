const express = require('express');
const router = express.Router();
const employeeModel = require('../models/Employee');
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Helper function to generate unique employee ID
async function generateUniqueEmployeeId() {
    let unique = false;
    let employeeId;

    while (!unique) {
        const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
        employeeId = `E${randomNumber}`;
        
        const existingEmployee = await employeeModel.findOne({ employeeId });
        if (!existingEmployee) {
            unique = true;
        }
    }
    return employeeId;
}

// Fetch all employees
router.get('/getEmployees', async (req, res) => {
    try {
        const employees = await employeeModel.find();
        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Add new employee with image URL handling
router.post('/addEmployee', async (req, res) => {
    try {
        const { firstName, lastName, email, username, department, customerSatisfaction, tasksCompleted, recentAchievement, imageUrl } = req.body;

        // Check if employee or customer exists with the same email/username
        const existingEmployee = await employeeModel.findOne({ $or: [{ email }, { username }] });
        if (existingEmployee) {
            return res.status(400).json({ message: 'Email or Username already exists as Employee' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Email or Username already exists as Customer' });
        }

        // Generate unique Employee ID
        const employeeId = await generateUniqueEmployeeId();
        const randomPwd = Math.random().toString(36).substr(2, 9);

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPwd, salt);

        // Create new employee
        const newEmployee = new employeeModel({
            employeeId,
            userID: Math.random().toString(36).substr(2, 9),
            firstName,
            lastName,
            email,
            username,
            department,
            customerSatisfaction,
            tasksCompleted,
            recentAchievement,
            imageUrl,
            password: hashedPassword,
        });

        await newEmployee.save();

        // Register the employee as a user
        const newUser = new User({
            userID: employeeId,
            firstName,
            lastName,
            email,
            password: hashedPassword,
            username,
            userType: "Employee",
        });

        const savedUser = await newUser.save();

        const userResponse = {
            _id: savedUser._id,
            userID: savedUser.userID,
            firstName: savedUser.firstName,
            lastName: savedUser.lastName,
            email: savedUser.email,
            username: savedUser.username,
            userType: savedUser.userType,
            createdAt: savedUser.createdAt,
            updatedAt: savedUser.updatedAt
        };

        res.status(201).json({
            message: 'Employee added and registered as user successfully',
            employee: newEmployee,
            user: userResponse
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// Get employee spotlight (top performer)
router.get('/spotlight', async (req, res) => {
    try {
        const spotlightEmployee = await employeeModel.findOne().sort('-customerSatisfaction').limit(1);

        if (!spotlightEmployee) {
            return res.status(404).json({ message: 'No employees found' });
        }

        const spotlightData = {
            name: `${spotlightEmployee.firstName} ${spotlightEmployee.lastName}`,
            department: spotlightEmployee.department,
            imageUrl: spotlightEmployee.imageUrl,
            customerSatisfaction: spotlightEmployee.customerSatisfaction,
            tasksCompleted: spotlightEmployee.tasksCompleted,
            recentAchievement: spotlightEmployee.recentAchievement,
        };

        res.json(spotlightData);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Update employee details, including image URL
router.put('/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { firstName, lastName, email, username, department, imageUrl, customerSatisfaction, tasksCompleted, recentAchievement } = req.body;

        const updatedEmployee = await employeeModel.findOneAndUpdate(
            { employeeId },
            { 
                firstName, 
                lastName, 
                email, 
                username, 
                department, 
                imageUrl, 
                customerSatisfaction, 
                tasksCompleted, 
                recentAchievement 
            },
            { new: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Update the corresponding User document
        await User.findOneAndUpdate(
            { userID: employeeId },
            { 
                firstName, 
                lastName, 
                email, 
                username 
            }
        );

        res.json(updatedEmployee);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Delete employee and associated user
router.post('/deleteEmployee', async (req, res) => {
    try {
        const { employeeId } = req.body;
        const deletedEmployee = await employeeModel.findOneAndDelete({ employeeId });
        
        if (!deletedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Delete the corresponding User document
        await User.findOneAndDelete({ userID: employeeId });

        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
