import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, Input, DatePicker, message } from "antd";
import moment from 'moment'; // Import moment for date formatting

function EventBookings() {
    const [bookings, setBookings] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [form] = Form.useForm();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 2;

    // Fetch bookings data
    const getBookings = async () => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const response = await axios.get("/api/event/getBookings", {
                params: { userID: currentUser.userID } // Pass userID as query parameter
            });
            setBookings(response.data.bookings);
        } catch (error) {
            console.log(error);
        }
    };

    // Delete booking function
    const deleteBooking = async (bookingId) => {
        try {
            await axios.delete(`/api/event/deleteBooking/${bookingId}`);
            message.success("Booking deleted successfully");
            getBookings(); // Refresh bookings after deletion
        } catch (error) {
            console.log(error);
            message.error("Failed to delete booking");
        }
    };

    // Handle edit button click
    const handleEdit = (booking) => {
        setSelectedBooking(booking);
        setIsEditModalOpen(true);
        form.setFieldsValue({
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            guestPhone: booking.guestPhone,
            eventDate: moment(booking.eventDate), // Set moment date
            totalAmount: booking.totalAmount,
        });
    };

    // Handle modal cancel
    const handleCancel = () => {
        setIsEditModalOpen(false);
    };

    // Handle form submission for editing booking
    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            await axios.put(`/api/event/updateBooking/${selectedBooking._id}`, {
                guestName: values.guestName,
                guestEmail: values.guestEmail,
                guestPhone: values.guestPhone,
                eventDate: values.eventDate.format('YYYY-MM-DD'), // Format date
                totalAmount: values.totalAmount,
            });
            message.success("Booking updated successfully");
            setIsEditModalOpen(false);
            getBookings(); // Refresh bookings after update
        } catch (error) {
            console.log(error);
            message.error("Failed to update booking");
        }
    };

    // Pagination
    const indexOfLastBooking = currentPage * itemsPerPage;
    const indexOfFirstBooking = indexOfLastBooking - itemsPerPage;
    const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking);

    // Change page
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Fetch bookings when the component mounts
    useEffect(() => {
        getBookings();
    }, []);

    return (
        <div className="event-bookings-container">
            <h2>Your Event Bookings</h2>
            {bookings.length === 0 ? (
                <p>No bookings found</p>
            ) : (
                <>
                    <div className="event-booking-cards">
                        {currentBookings.map((booking) => (
                            <div key={booking._id} className="event-booking-card">
                                <h3>Booking ID: {booking.bookingID}</h3>
                                <p>Event ID: {booking.eventId}</p>
                                <p>Guest Name: {booking.guestName}</p>
                                <p>Email: {booking.guestEmail}</p>
                                <p>Phone: {booking.guestPhone}</p>
                                <p>Event Date: {moment(booking.eventDate).format('YYYY-MM-DD')}</p> {/* Format date */}
                                <h5>Total Amount: Rs {booking.totalAmount}</h5>
                                <div className="card-buttons-event">
                                    <Button type="primary" onClick={() => handleEdit(booking)}>Edit</Button>
                                    <Button type="danger" onClick={() => deleteBooking(booking._id)}>Delete</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pagination-event-booking">
                        <Button
                            type="default"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span>Page {currentPage}</span>
                        <Button
                            type="default"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={indexOfLastBooking >= bookings.length}
                        >
                            Next
                        </Button>
                    </div>
                </>
            )}

            {/* Edit Booking Modal */}
            <Modal
                title="Edit Booking"
                open={isEditModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="Update"
                cancelText="Cancel"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Guest Name"
                        name="guestName"
                        rules={[
                            { required: true, message: "Please enter your name" },
                            { min: 2, message: "Name must be at least 2 characters" },
                            { max: 50, message: "Name must be at most 50 characters" }
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Guest Email"
                        name="guestEmail"
                        rules={[
                            { required: true, message: "Please enter your email" },
                            { type: "email", message: "Please enter a valid email" }
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Guest Phone"
                        name="guestPhone"
                        rules={[
                            { required: true, message: "Please enter your phone number" },
                            {
                                validator: (_, value) => {
                                    if (!value) {
                                        return Promise.reject(new Error('Please enter your phone number'));
                                    }
                                    if (!/^[0-9]+$/.test(value)) {
                                        return Promise.reject(new Error('Phone number must contain only digits'));
                                    }
                                    if (value.length !== 10) {
                                        return Promise.reject(new Error('Phone number must be exactly 10 digits long'));
                                    }
                                    return Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="Event Date"
                        name="eventDate"
                        rules={[{ required: true, message: "Please select event date" }]}
                    >
                        <DatePicker format="YYYY-MM-DD" />
                    </Form.Item>

                    <Form.Item
                        label="Total Amount"
                        name="totalAmount"
                        rules={[
                            { required: true, message: "Please enter total amount" },
                            { type: "number", message: "Total amount must be a number" }
                        ]}
                    >
                        <Input type="number" disabled={true} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default EventBookings;
