const express = require('express');
const router = express.Router();
const employeeModel = require('../models/Employee');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const EmailService = require('../utils/emailService');
const upload = require('../utils/upload');




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
// Add new employee with profile picture upload handling
router.post('/addEmployee', upload.single('profilePicture'), async (req, res) => {
    try {
        const { firstName, lastName, email, username, department, customerSatisfaction, tasksCompleted, recentAchievement } = req.body;
        
        // Check if employee or user exists with the same email/username
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
        console.log(randomPwd);

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPwd, salt);

        // If an image is uploaded, save the file path
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

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
            imageUrl,  // Store the file URL
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

        // Send welcome email with temporary password
        await EmailService.sendWelcomeEmail(email, { firstName, lastName, password: randomPwd });

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
// Update employee details with profile picture upload handling
router.put('/:employeeId', upload.single('profilePicture'), async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { firstName, lastName, email, username, department, customerSatisfaction, tasksCompleted, recentAchievement } = req.body;

        // If an image is uploaded, save the file path
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

        const updatedFields = {
            firstName, 
            lastName, 
            email, 
            username, 
            department, 
            customerSatisfaction, 
            tasksCompleted, 
            recentAchievement
        };

        // Only update imageUrl if a new file is uploaded
        if (imageUrl) {
            updatedFields.imageUrl = imageUrl;
        }

        const updatedEmployee = await employeeModel.findOneAndUpdate(
            { employeeId },
            updatedFields,
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

// Route to get leave details for an employee
router.get('/getLeave/:empID', async (req, res) => {
    const { empID } = req.params;

    try {
        const employee = await employeeModel.findOne({ employeeId: empID });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({ leaves: employee.leaves });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Route to add a leave for an employee
router.post('/addLeave', async (req, res) => {
    const { empID, fromDate, toDate } = req.body;

    try {
        const employee = await employeeModel.findOne({ employeeId: empID });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
        leaveID = `L${randomNumber}`;

        const newLeave = {
            leaveID,
            fromDate: new Date(fromDate),
            toDate: new Date(toDate),
            status: 'Pending',
        };

        employee.leaves.push(newLeave);
        await employee.save();

        res.status(200).json({ message: 'Leave added successfully', leaves: employee.leaves });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Route to get all leaves for all employees
router.get('/getAllLeaves', async (req, res) => {
    try {
        const employees = await employeeModel.find().populate('leaves'); // Assuming 'leaves' is a populated reference, if not, just remove it

        const allLeaves = employees.reduce((acc, employee) => {
            if (employee.leaves) {
                acc.push(...employee.leaves);
            }
            return acc;
        }, []);

        res.status(200).json({ leaves: allLeaves });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


// Route to get employee count
router.get('/getEmployeeCount', async (req, res) => {
    try {
        const employeeCount = await employeeModel.countDocuments();
        res.json({ count: employeeCount });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Route to approve a leave request
router.post('/approveLeave', async (req, res) => {
    const { empID, leaveID } = req.body;

    try {
        const employee = await employeeModel.findOne({ employeeId: empID });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Find the leave request
        const leave = employee.leaves.find(leave => leave.leaveID === leaveID);
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Update leave status to Approved
        leave.status = 'Approved';
        await employee.save();

        res.status(200).json({ message: 'Leave request approved successfully', leaves: employee.leaves });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Route to deny a leave request
router.post('/denyLeave', async (req, res) => {
    const { empID, leaveID } = req.body;

    try {
        const employee = await employeeModel.findOne({ employeeId: empID });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Find the leave request
        const leave = employee.leaves.find(leave => leave.leaveID === leaveID);
        if (!leave) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Update leave status to Denied
        leave.status = 'Denied';
        await employee.save();

        res.status(200).json({ message: 'Leave request denied successfully', leaves: employee.leaves });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


router.get('/getEmployeesByDepartment/:department', async (req, res) => {
    const { department } = req.params;

    try {
        const employees = await employeeModel.find({ department });

        if (employees.length === 0) {
            return res.status(404).json({ message: 'No employees found in this department' });
        }

        res.json(employees);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.post('/addSalary', async (req, res) => {
    const { employeeId, amount, bank, bankBranchNumber, accountNumber } = req.body;

    try {
        const employee = await employeeModel.findOne({ employeeId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Update or add salary details
        employee.salary = {
            amount,
            bank,
            bankBranchNumber,
            accountNumber,
            dateAdded: Date.now() // Set the current date when adding the salary
        };
        
        await employee.save();

        res.status(200).json({
            message: 'Salary added successfully',
            salary: employee.salary
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Route to view salary by employee ID
router.get('/viewSalary/:employeeId', async (req, res) => {
    const { employeeId } = req.params;

    try {
        const employee = await employeeModel.findOne({ employeeId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json({ salary: employee.salary });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Route to update employee dutyDate
router.put('/updateDutyDate/:employeeId', async (req, res) => {
    const { employeeId } = req.params;
    const { dutyDate } = req.body;

    try {
        const updatedEmployee = await employeeModel.findOneAndUpdate(
            { employeeId },
            { dutyDate: new Date(dutyDate) },
            { new: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Send duty date email notification
        await EmailService.sendDutyDateMail(updatedEmployee.email, dutyDate);

        res.json(updatedEmployee);
    } catch (err) {
        console.error("Error updating duty date:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get('/getTodayDutyEmployees', async (req, res) => {
    try {
        const today = new Date();
        // Remove the time part from the current date for an accurate date comparison
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));

        const employees = await employeeModel.find({
            dutyDate: {
                $gte: todayStart,
                $lte: todayEnd
            }
        });

        if (employees.length === 0) {
            return res.status(404).json({ message: 'No employees found with duty today' });
        }

        res.status(200).json(employees);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get('/getTodayDutyEmployees/:department', async (req, res) => {
    const { department } = req.params;

    try {
        const today = new Date();
        // Remove the time part from the current date for an accurate date comparison
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));

        // Find employees who have duty today and belong to the specified department
        const employees = await employeeModel.find({
            dutyDate: {
                $gte: todayStart,
                $lte: todayEnd
            },
            department: department  // Filter by department
        });

        if (employees.length === 0) {
            return res.status(404).json({ message: 'No employees found with duty today in this department' });
        }

        res.status(200).json(employees);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});



module.exports = router;
