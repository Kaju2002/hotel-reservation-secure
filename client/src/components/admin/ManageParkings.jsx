import React, { useState, useEffect } from "react";
import { Table, message, DatePicker, Modal, Button, Input, Checkbox } from "antd";
import moment from "moment";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";

function ManageParkings() {
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
    ]); // State to hold selected columns for PDF generation

    // Fetch bookings on component mount
    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        let tempList = bookings;
        if (searchTerm !== "") {
            tempList = tempList.filter((item) =>
                item.vehicleNumber
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
            );
        }
        setFilteredBookings(tempList);
        const total = tempList.reduce((acc, booking) => acc + booking.price, 0);
        setTotalPrice(total);
        setTotalBookings(tempList.length);
    }, [searchTerm, bookings]);

    const fetchBookings = async () => {
        try {
            const response = await axios.get("/api/parking/getAllParkings");
            setBookings(response.data);
        } catch (error) {
            message.error("Failed to fetch bookings.");
        }
    };

    const showDeleteModal = (parkingId) => {
        setSelectedParkingId(parkingId);
        setIsDeleteModalVisible(true);
    };

    const handleDelete = async () => {
        try {
            await axios.post("/api/parking/delete", {
                parkingId: selectedParkingId,
            });
            message.success("Booking deleted successfully.");
            fetchBookings();
            setIsDeleteModalVisible(false);
        } catch (error) {
            message.error("Failed to delete booking.");
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
            fetchBookings();
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
                        style={{ marginRight: '10px' }} 
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
            title: "Actions",
            key: "actions",
            render: (text, record) => (
                <div className="actions-container2345">
                    <Button onClick={() => handleEdit(record)} className="edit-button2345">
                        Edit
                    </Button>
                    <Button onClick={() => showDeleteModal(record.parkingId)} className="delete-button2345">
                        Cancel
                    </Button>
                    <Button onClick={() => handleView(record)} style={{ backgroundColor: 'green', color: 'white' }} className="view-button2345">
                        View
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="admin-manage-parking-2313">
            <div className="parking-table-header-container">
                <h3>Parking Bookings</h3>
                <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input-42424"
                    disabled={isModalVisible || isDeleteModalVisible}
                />
                <button
                    onClick={generatePDF}
                    style={{
                        backgroundColor: "#27ae60",
                        color: "white",
                        padding: "6px 18px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "16px",
                        textAlign: "center",
                        display: "inline-block",
                        transition: "background-color 0.3s",
                    }}
                >
                    Download PDF
                </button>
            </div>

            <div className="totals-container">
                <p style={{ fontSize: "17px", fontWeight: "bold" }}>Total Bookings: {totalBookings}</p>
                <p style={{ fontSize: "17px", fontWeight: "bold" }}>Total Price: {totalPrice.toFixed(2)}</p>
            </div>

            <Table
                columns={columns}
                dataSource={filteredBookings}
                rowKey="parkingId"
                pagination={{
                    position: ['bottomCenter'],
                    pageSize: 6,
                }}
                onChange={(pagination, filters, sorter) => {
                    setPagination(pagination);
                }}
                style={{ fontSize: '16px' }}
            />

            <Modal
                title="Edit Booking"
                visible={isModalVisible}
                onOk={handleUpdate}
                onCancel={() => setIsModalVisible(false)}
                okText="Update"
                cancelText="Cancel"
            >
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div>
                        <label>Vehicle Number:</label>
                        <Input
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value)}
                        />
                    </div>
                    <div>
                        <label>Booking Date:</label>
                        <DatePicker
                            value={bookingDate}
                            onChange={handleDateChange}
                            format="YYYY-MM-DD"
                        />
                    </div>
                </div>
            </Modal>

            <Modal
                title="Confirm Delete"
                visible={isDeleteModalVisible}
                onOk={handleDelete}
                onCancel={() => setIsDeleteModalVisible(false)}
                okText="Yes"
                cancelText="No"
            >
                <p>Are you sure you want to cancel this booking?</p>
            </Modal>

            <Modal
                title="Booking Details"
                visible={viewModalVisible}
                onCancel={() => setViewModalVisible(false)}
                footer={null}
            >
                {selectedBooking && (
                    <div>
                        <p><strong>Vehicle Number:</strong> {selectedBooking.vehicleNumber}</p>
                        <p><strong>Booking Date:</strong> {selectedBooking.bookingDate}</p>
                        <p><strong>Price:</strong> {selectedBooking.price}</p>
                        <p><strong>Package Type:</strong> {selectedBooking.packageType}</p>
                        <p><strong>Parking ID:</strong> {selectedBooking.parkingId}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default ManageParkings;
