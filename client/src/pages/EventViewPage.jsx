import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { Modal, Form, Input, Button, message, DatePicker } from "antd";
import moment from "moment";

function EventViewPage() {
    const { id } = useParams(); // Get the event ID from the URL parameters
    const [event, setEvent] = useState(null); // State to hold the event data
    const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
    const [loading, setLoading] = useState(true); // State to show loading status
    const [reminderDate, setReminderDate] = useState(null); // State to set reminder time
    const [form] = Form.useForm(); // Create form instance

    useEffect(() => {
        // Fetch event data when the component mounts or ID changes
        const fetchEvent = async () => {
            try {
                const response = await axios.get(`/api/event/getEvent/${id}`);
                console.log("Fetched Event Data:", response.data); // Debugging: Log the fetched event data
                setEvent(response.data.event); // Update event state with fetched data
            } catch (error) {
                console.error("Error fetching event:", error);
                message.error("Failed to load event data."); // Show error message if fetching fails
            } finally {
                setLoading(false); // Set loading to false once data is fetched
            }
        };

        fetchEvent(); // Trigger the fetch function
    }, [id]); // Dependency array: re-fetch if ID changes

    // Function to handle reminder button click
    const handleSetReminder = async () => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser')); // Get current user from localStorage

            if (!currentUser || !currentUser.userID || !currentUser.email) {
                message.error("No user data found in localStorage. Please login.");
                return;
            }

            const reminderTime = reminderDate || moment(event.eventDate).subtract(1, 'days').toISOString(); // Default reminder is 1 day before the event

            // Send the reminder request to backend
            await axios.post('/api/reminder/setReminder', {
                userId: currentUser.userID,
                userEmail: currentUser.email,  // Send user email
                eventId: event.eventId,
                reminderTime
            });

            message.success('Reminder set successfully!');
        } catch (error) {
            message.error('Failed to set reminder. Please try again.');
        }
    };

    const handleOk = async () => {
        try {
            // Validate form and get values
            const values = await form.validateFields();
            const currentUser = JSON.parse(localStorage.getItem('currentUser')); // Get current user from localStorage

            // Prepare reservation data
            const reservationData = {
                eventId: event.eventId,
                guestName: values.name,
                guestEmail: values.email,
                guestPhone: values.phone,
                eventDate: values.eventDate.format('YYYY-MM-DD'), // Format selected date
                totalAmount: event.price,
                userID: currentUser.userID // Include user ID for reservation
            };

            console.log("Reservation Data:", reservationData); // Debugging: Log reservation data

            // Send reservation data to the server
            const response = await axios.post(`/api/event/reserveEvent/${event.eventId}`, reservationData);

            console.log("Reservation Response:", response.data); // Debugging: Log the response data
            message.success(`Booking successful!`); // Show success message with booking ID

            setIsModalOpen(false); // Close modal on successful reservation
            form.resetFields(); // Reset form fields
        } catch (error) {
            console.error("Failed to reserve:", error);
            message.error("Booking failed. Please try again."); // Show error message if reservation fails
        }
    };

    const showModal = () => {
        setIsModalOpen(true); // Open modal
    };

    const handleCancel = () => {
        setIsModalOpen(false); // Close modal
    };

    if (loading) return <p>Loading...</p>; // Display loading state while data is being fetched
    if (!event && !loading) return <p>Event with ID {id} not found.</p>; // Handle case where event is not found

    return (
        <div className="event-details-page">
            <div className="event-image">
                <img
                    src={event.baseImage || "https://via.placeholder.com/650"} // Use default image if no event image
                    alt={event.eventName || "Event Image"} // Fallback alt text
                />
            </div>
            <div className="event-info">
                <h1>{event.eventName}</h1>
                <p>{event.description}</p>
                <h3>Event Type: {event.eventType}</h3>
                <h3>Price: Rs {event.price}</h3>

                {/* Remind me button */}
                <div style={{ marginTop: '20px' }}>
                    <DatePicker
                        onChange={(date) => setReminderDate(date)}
                        placeholder="Set custom reminder date"
                    />
                    <Button
                        type="primary"
                        onClick={() => {
                            if (!reminderDate) {
                                // Show an Ant Design error message if no date is selected
                                message.error('Please pick a date before setting a reminder.');
                                return;
                            }
                            handleSetReminder(); // Call the reminder function if a date is selected
                        }}
                        style={{ marginLeft: '20px', height: "40px" }}
                    >
                        Remind me 1 day before
                    </Button>
                </div>

                <button className="reserve-button" onClick={showModal}>
                    Reserve
                </button>

                <Modal
                    title="Reserve Event"
                    open={isModalOpen}
                    onOk={handleOk}
                    onCancel={handleCancel}
                    footer={[
                        <Button key="cancel" onClick={handleCancel} className="custom-cancel-button">
                            Cancel
                        </Button>,
                        <Button key="submit" type="primary" onClick={handleOk} className="custom-submit-button">
                            Reserve
                        </Button>,
                    ]}
                    className="custom-event-reservation-modal"
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            label="Name"
                            name="name"
                            rules={[
                                { required: true, message: "Please enter your name" },
                                { min: 2, message: "Name must be at least 2 characters" },
                                { max: 50, message: "Name must be at most 50 characters" }
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: "Please enter your email" },
                                { type: "email", message: "Please enter a valid email" }
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Phone Number"
                            name="phone"
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
                            rules={[
                                { required: true, message: "Please select an event date" },
                                {
                                    validator: (_, value) => {
                                        if (!value) {
                                            return Promise.reject(new Error('Please select an event date'));
                                        }
                                        if (value.isBefore(moment().startOf('day'))) {
                                            return Promise.reject(new Error('Event date must be a future date'));
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <DatePicker format="YYYY-MM-DD" />
                        </Form.Item>

                        <p className="total-cost">Total Cost: Rs {event.price}</p>
                    </Form>
                </Modal>
            </div>
        </div>
    );
}

export default EventViewPage;
