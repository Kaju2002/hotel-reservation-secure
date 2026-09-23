import React, { useState, useEffect } from "react";
import { Table, message, DatePicker, Modal, Button, Input, Checkbox ,Select ,Avatar} from "antd";
import moment from "moment";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Link } from "react-router-dom";
import {
    UserOutlined
  } from "@ant-design/icons";

function ManageParkings() {
    const [selectedDate, setSelectedDate] = useState("");
    const [employeesOnDutyToday, setEmployeesOnDutyToday] = useState([]);
    const [loading, setLoading] = useState(false);
    const [availability, setAvailability] = useState([]);
    const [parkingCount, setParkingCount] = useState(0);
    const [bookings, setBookings] = useState([]);
    const [editingBooking, setEditingBooking] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [selectedParkingId, setSelectedParkingId] = useState(null);
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [bookingDate, setBookingDate] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [totalBookings, setTotalBookings] = useState(0);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 6 });
    const [selectedColumns, setSelectedColumns] = useState([
        "vehicleNumber", "price", "bookingDate", "packageType", "parkingId"
    ]);
    const [selectedSecurityEmployee, setSelectedSecurityEmployee] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
    const [department, setDepartment] = useState('');

    // New state for booking date filter
    const [filterBookingDate, setFilterBookingDate] = useState(null);
    const [employeeId, setEmployeeId] = useState('');
    const [dutyDate, setDutyDate] = useState('');
    const [message, setMessage] = useState('');

    // Fetch bookings on component mount
    useEffect(() => {
        fetchBookings();
        fetchAvailability();
        fetchPakingCount();
    }, []);

    useEffect(() => {
        let tempList = bookings;

        // Search by vehicle number
        if (searchTerm !== "") {
            tempList = tempList.filter((item) =>
                item.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by booking date
        if (filterBookingDate) {
            const formattedDate = filterBookingDate.format("YYYY-MM-DD");
            tempList = tempList.filter((item) =>
                moment(item.bookingDate).isSame(formattedDate)
            );
        }

        setFilteredBookings(tempList);
        const total = tempList.reduce((acc, booking) => acc + booking.price, 0);
        setTotalPrice(total);
        setTotalBookings(tempList.length);
    }, [searchTerm, bookings, filterBookingDate]);

    const fetchBookings = async () => {
        try {
            const response = await axios.get("/api/parking/getAllParkings");
            setBookings(response.data);
        } catch (error) {
           
        }
    };

    const fetchEmployeesByDepartment = async (department) => {
        try {
            const response = await axios.get(`/api/employee/getEmployeesByDepartment/${department}`);
            setEmployees(response.data);
        } catch (error) {
           
        }
    };

    const handleShowSecurityEmployees = () => {
        fetchEmployeesByDepartment("Security");
    };

    const fetchPakingCount = async () => {
        try {
            const response = await axios.get('/api/parking/availability/today');
            setParkingCount(response.data.totalAvailableSlots);
        } catch (error) {
            console.error('Error fetching booking count', error);
        }
    };

    const fetchAvailability = async () => {
        try {
            const response = await axios.get(`/api/parking/availability`, {
                params: { date: selectedDate },
            });
            setAvailability(response.data);
        } catch (error) {
            
        }
    };

    const showDeleteModal = (parkingId) => {
        setSelectedParkingId(parkingId);
        setIsDeleteModalVisible(true);
    };

    const fetchTodayDutyEmployees = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/employee/getTodayDutyEmployees/${department}`);
            setEmployeesOnDutyToday(response.data);
            message.success("Fetched employees with today's duty.");
        } catch (error) {
           
        } finally {
            setLoading(false);
        }
    };

    // Call fetchTodayDutyEmployees when component mounts
    useEffect(() => {
        fetchTodayDutyEmployees("Security");
    }, []);

  // Handles the deletion of a booking
  const handleDelete = async () => {
    try {
        await axios.post("/api/parking/delete", {
            parkingId: selectedParkingId,
        });
        message.success("Booking deleted successfully.");
        fetchBookings(); // Refresh the bookings list after deletion
        setIsDeleteModalVisible(false); // Close delete modal
        window.location.reload();
    } catch (error) {
        
    }
};
    const handleApproveDecline = async (parkingId, action) => {
        try {
            await axios.post("/api/parking/cancel-booking", {
                parkingId,
                action,
            });
            message.success(`Cancellation request ${action === 'approve' ? 'approved' : 'declined'} successfully.`);
            fetchBookings(); // Refresh the bookings list after approval or decline
            window.location.reload();
        } catch (error) {
            message.error(`Failed to ${action === 'approve' ? 'approve' : 'decline'} cancellation request.`);
        }
    };

    const handleEdit = (record) => {
        setEditingBooking(record);
        setVehicleNumber(record.vehicleNumber);
        setBookingDate(moment(record.bookingDate, "YYYY-MM-DD"));
        setIsModalVisible(true);
    };

    const handleUpdate = async () => {
        try {
            await axios.post("/api/parking/update", {
                parkingId: editingBooking.parkingId,
                vehicleNumber,
                bookingDate: bookingDate.format("YYYY-MM-DD"),
            });
            message.success("Booking updated successfully.");
            setIsModalVisible(false);
            fetchBookings(); // Refresh the bookings list after update
        } catch (error) {
           message.error("Failed to update booking.");
        }
    };

    const handleDateChange = (date) => {
        setBookingDate(date);
    };

    const handleView = (record) => {
        setSelectedBooking(record);
        setViewModalVisible(true);
    };

    const handleAssignClick = async () => {
        try {
            const response = await axios.put(`/api/employee/updateDutyDate/${employeeId}`, {
                dutyDate,
            });
    
    
            setMessage(`Duty date updated successfully: ${response.data.dutyDate}`);
            setEmployeeId(''); // Clear employee ID
            setDutyDate('');
        } catch (error) {
           
        }
    };
    

     // Internal CSS styles
     const styles = {
        container: {
            padding: '20px',
            backgroundColor: '#f7f9fc',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            maxWidth: '400px',
            margin: 'auto',
            textAlign: 'center',
        },
        input: {
            width: '80%',
            padding: '10px',
            margin: '10px 0',
            border: '1px solid #ccc',
            borderRadius: '5px',
        },
        button: {
            backgroundColor: '#27ae60',
            color: 'white',
            padding: '10px 18px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s',
        },
        buttonHover: {
            backgroundColor: '#219150',
        },
        message: {
            marginTop: '15px',
            color: '#e74c3c', // Red color for error messages
        },
    };

    const handleDepartmentChange = (e) => {
        const selectedDepartment = e.target.value;
        setDepartment(selectedDepartment);
        fetchEmployeesByDepartment(selectedDepartment);
    };

    // Generate PDF with selected columns
    const generatePDF = () => {
        const doc = new jsPDF();
        const columns = selectedColumns.map((column) => {
            switch (column) {
                case "vehicleNumber":
                    return { header: "Vehicle Number", dataKey: "vehicleNumber" };
                case "price":
                    return { header: "Price", dataKey: "price" };
                case "bookingDate":
                    return { header: "Booking Date", dataKey: "bookingDate" };
                case "packageType":
                    return { header: "Package Type", dataKey: "packageType" };
                case "parkingId":
                    return { header: "Parking ID", dataKey: "parkingId" };
                default:
                    return { header: column, dataKey: column };
            }
        });

        const data = filteredBookings.map((booking) =>
            selectedColumns.reduce((acc, column) => {
                acc[column] = booking[column];
                return acc;
            }, {})
        );

        doc.autoTable({
            columns,
            body: data,
        });
        doc.save("parking-bookings.pdf");
    };

    const handleEmployeeSelection = (employeeId) => {
        const selectedEmployee = employees.find(emp => emp._id === employeeId);
        setSelectedSecurityEmployee(employeeId);
        setSelectedEmployeeData({
            name: selectedEmployee.firstName,
            imageUrl: selectedEmployee.profilePictureUrl || null,
        });
    };

    // Handle column selection for PDF generation
    const handleColumnChange = (checkedValues) => {
        setSelectedColumns(checkedValues);
    };

    const columns = [
        {
            title: (
                <>
                    <Checkbox
                        onChange={(e) => handleColumnChange(["vehicleNumber"])}
                        checked={selectedColumns.includes("vehicleNumber")}
                        style={{ marginRight: '0px' }} 
                    />
                    Vehicle Number
                </>
            ),
            dataIndex: "vehicleNumber",
            key: "vehicleNumber",
            
        },
        {
            title: (
                <>
                    <Checkbox
                        onChange={(e) => handleColumnChange(["price"])}
                        checked={selectedColumns.includes("price")}
                        style={{ marginRight: '10px' }} 
                    />
                    Price
                </>
            ),
            dataIndex: "price",
            key: "price",
        },
        {
            title: (
                <>
                    <Checkbox
                        onChange={(e) => handleColumnChange(["bookingDate"])}
                        checked={selectedColumns.includes("bookingDate")}
                        style={{ marginRight: '10px' }} 
                    />
                    Booking Date
                </>
            ),
            dataIndex: "bookingDate",
            key: "bookingDate",
        },
        {
            title: (
                <>
                    <Checkbox
                        onChange={(e) => handleColumnChange(["packageType"])}
                        checked={selectedColumns.includes("packageType")}
                        style={{ marginRight: '10px' }} 
                    />
                    Package Type
                </>
            ),
            dataIndex: "packageType",
            key: "packageType",
        },
        {
            title: (
                <>
                    <Checkbox
                        onChange={(e) => handleColumnChange(["parkingId"])}
                        checked={selectedColumns.includes("parkingId")}
                        style={{ marginRight: '10px' }} 
                    />
                    Parking ID
                </>
            ),
            dataIndex: "parkingId",
            key: "parkingId",
        },
        {
                title: "Cancellation Status",
                dataIndex: "status",
                key: "status",
            },
        {
            title: "Actions",
            key: "actions",
            render: (text, record) => (
                <div className="actions-container2345">
                        {record.status === 'pending' && (
                    <>
                        <Button onClick={() => {handleApproveDecline(record.parkingId, 'approve');
                            window.location.reload();
                        }}>Approve</Button>
                        <Button onClick={() =>{ handleApproveDecline(record.parkingId, 'decline');
                            window.location.reload();
                        }}>Decline</Button>
                    </>
                )}
                    <Button onClick={() => handleEdit(record)} className="edit-button2345"  style={{ marginRight: '20px' }} >
                        Edit
                    </Button>
                    <Button onClick={() => showDeleteModal(record.parkingId)} className="delete-button2345"  style={{ marginRight: '20px' }}>
                        Cancel
                    </Button>
                    <Button onClick={() => handleView(record)} style={{ backgroundColor: 'green', color: 'white' }} className="view-button2345" >
                        View
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="admin-manage-parking-2313">
            <div className="parking-table-header-container">
                <h1>Parking Bookings</h1>
                <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input-42424"
                    disabled={isModalVisible || isDeleteModalVisible}
                />
                {/* Date Picker for Booking Date Filter */}
            <DatePicker
                onChange={(date) => setFilterBookingDate(date)}
                style={{ marginBottom: '16px', width: '200px' }} 
                placeholder="Filter by Booking Date"
            />
                <button
                    onClick={generatePDF}
                    style={{
                        backgroundColor: "#27ae60",
                        color: "white",
                        padding: "6px 18px",
                        border: "none",
                        borderRadius: "5px",
                    }}
                >
                    Generate PDF
                </button>
            </div>

            

            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", padding: "20px", marginTop: "20px", marginBottom: "20px" }}>
  {/* Left Column - Assign Duty Date */}
  <div style={{ ...styles.container, textAlign: "left", width: "30%" }}>
    <h2>Assign Security</h2>
    <select
      value={employeeId}
      onChange={(e) => setEmployeeId(e.target.value)}
      style={styles.input}
      onFocus={handleShowSecurityEmployees}
    >
      <option value="" disabled>Select Employee</option>
      {employees.length > 0 ? (
        employees.map((employee) => (
          <option key={employee.id} value={employee.employeeId}>
            {employee.firstName}
          </option>
        ))
      ) : (
        <option disabled>No Employees Available</option>
      )}
    </select>
    
    <input
      type="date"
      value={dutyDate}
      onChange={(e) => setDutyDate(e.target.value)}
      style={styles.input}
    />
    
    <button
      onClick={handleAssignClick}
      style={styles.button}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
    >
      Assign
    </button>
    
    {message && <p style={styles.message}>{message}</p>}
  </div>

  {/* Middle Column - Employees on Duty Today */}
  <div style={{ ...styles.container, textAlign: "left", width: "30%" }}>
    <h2>Securities on Duty Today</h2>
    {loading ? (
      <p>Loading employees...</p>
    ) : employeesOnDutyToday.length > 0 ? (
      employeesOnDutyToday.map((employee) => (
        <div
          key={employee._id}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "10px",
            padding: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Gray shadow
            borderRadius: "8px",
          }}
        >
          <Avatar
            size={50}
            src={employee.imageUrl || null}
            icon={<UserOutlined />}
            style={{ marginRight: "10px" }}
          />
          <span>{employee.firstName} {employee.lastName}</span>
        </div>
      ))
    ) : (
      <p>No employees are on duty today.</p>
    )}
  </div>

  {/* Right Column - Total Bookings and Available Parkings */}
  <div style={{ ...styles.container, textAlign: "left", width: "30%" }}>
    <h4>Total Bookings: {totalBookings}</h4>
    <h4>Total Price: ${totalPrice}</h4>
    <h1 style={{ fontSize: "30px" }}>Available Parkings</h1>
    <h2 style={{ fontSize: "32px" }}>{parkingCount}</h2>
    <Link to="/admin/bookings" style={{ textDecoration: "none" }}>
      {/* Link content */}
    </Link>
  </div>
</div>




<Table
  columns={columns}
  dataSource={filteredBookings}
  pagination={{
    position: ['bottomCenter'],
    current: pagination.current,
    pageSize: pagination.pageSize,
    onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
    style: { marginBottom: '-200px' }, // Inline style to adjust pagination spacing
  }}
  rowKey="parkingId"
/>

            {/* Edit Modal */}
            <Modal
                title="Edit Booking"
                visible={isModalVisible}
                onOk={handleUpdate}
                onCancel={() => {setIsModalVisible(false);
                    window.location.reload();}}
                okText="Update"
                cancelText="Cancel"
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                    }}
                >
                    <div>
                        <label>Vehicle Number:</label>
                        <Input
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value)}
                        />
                    </div>
                    <div className="date-picker-21313">
                        <label>Booking Date:</label>
                        <DatePicker
                            value={bookingDate}
                            onChange={handleDateChange}
                        />
                        
                    </div>
                    <hr />
                    <div>
                        <label>Parking ID:</label>
                        <Input value={editingBooking?.parkingId} disabled />
                    </div>
                    <div>
                        <label>Package Type:</label>
                        <Input value={editingBooking?.packageType} disabled />
                    </div>
                    <div>
                        <label>Price:</label>
                        <Input value={editingBooking?.price} disabled />
                    </div>
                </div>
            </Modal>

            <Modal
                title="Confirm Delete"
                visible={isDeleteModalVisible}
                onOk={handleDelete}
                onCancel={() => {setIsDeleteModalVisible(false);
                    window.location.reload();}
                }
                okText="Yes, Delete"
                cancelText="Cancel"
            >
                <p>Are you sure you want to delete this booking?</p>
            </Modal>
        

            {/* View Modal */}
            <Modal
                title="Booking Details"
                visible={viewModalVisible}
                onOk={() => {setViewModalVisible(false);
                    window.location.reload();}
                }
                onCancel={() => {setViewModalVisible(false);
                    window.location.reload();}
                }
            >
                {selectedBooking && (
                    <div>
                        <p>Vehicle Number: {selectedBooking.vehicleNumber}</p>
                        <p>Price: {selectedBooking.price}</p>
                        <p>Booking Date: {selectedBooking.bookingDate}</p>
                        <p>Package Type: {selectedBooking.packageType}</p>
                        <p>Parking ID: {selectedBooking.parkingId}</p>
                    </div>
                )}
            </Modal>
            

            
            
        </div>
    );
}

export default ManageParkings;

