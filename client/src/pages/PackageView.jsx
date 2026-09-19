import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { Modal, Form, Input, Button, DatePicker, message } from "antd";
import moment from "moment";
import packageImg from "../assets/Images/roomimg.jpg"; // Use a default image if no image is provided

function PackageView() {
        const { id } = useParams(); // Get package ID from the URL
        const navigate = useNavigate(); // Initialize navigate for redirection
        const [packageDetails, setPackageDetails] = useState(null);
        const [totalPrice, setTotalPrice] = useState(0);
        const [calculatedPrice, setCalculatedPrice] = useState(0);
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [form] = Form.useForm(); // Ant Design Form instance

        // Fetch the package data from the server
        useEffect(() => {
                const fetchPackage = async () => {
                        try {
                                const response = await axios.get(
                                        `/api/package/getPackage/${id}`
                                );
                                setPackageDetails(response.data.package);
                                setTotalPrice(response.data.package.price); // Initialize total price with package price
                        } catch (error) {
                                console.error("Error fetching package:", error);
                        }
                };

                fetchPackage();
        }, [id]);

        // Handle date change and calculate the total price
        const onDateChange = (dates) => {
                if (dates && dates.length === 2) {
                        const [startDate, endDate] = dates;
                        const duration = endDate.diff(startDate, "days");
                        const newTotalPrice = packageDetails.price * duration;
                        setCalculatedPrice(newTotalPrice);
                } else {
                        setCalculatedPrice(totalPrice);
                }
        };

        // Handle form submission
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));

        // Redirect to login if not logged in
        useEffect(() => {
                if (!currentUser) {
                        message.error(
                                "You must be logged in to make a reservation."
                        );
                        navigate("/login"); // Redirect to login page
                }
        }, [currentUser, navigate]);

        if (!currentUser) {
                return null; // Prevent further rendering if user is not logged in
        }
        const userID = currentUser.userID;

        const handleOk = async () => {
            try {
              const values = await form.validateFields(); // Get form values
              const reservationData = {
                userID, // String userID from localStorage or another source
                packageId: packageDetails._id, // Assuming packageId is stored
                guestName: values.name,
                guestEmail: values.email,
                guestPhone: values.phone,
                startDate: values.dates[0].format("YYYY-MM-DD"), // Dates in moment format
                endDate: values.dates[1].format("YYYY-MM-DD"),
                totalAmount: calculatedPrice,
              };
          
              // Save the reservation data to the database
              await axios.post(`/api/package/reservePackage/${packageDetails._id}`, reservationData);
          
              setIsModalOpen(false); // Close the modal after saving
              form.resetFields(); // Reset the form
              message.success("Reservation successful!");
            } catch (error) {
              console.error("Failed to reserve:", error);
              message.error("Reservation failed. Please try again.");
            }
          };
          
        // Function to show the modal
        const showModal = () => {
                setIsModalOpen(true);
        };

        const handleCancel = () => {
                setIsModalOpen(false);
        };

        // Calculate the partial refund date
        const fullRefundDate = moment().add(2, "days").format("MMM Do YYYY");
        const partialRefundDate = moment().add(3, "days").format("MMM Do YYYY");

        if (!packageDetails) return <p>Loading...</p>;

        return (
                <div className="package-details-page">
                        <div className="package-image">
                                <img
                                        src={
                                                packageDetails.imageUrl ||
                                                packageImg
                                        }
                                        alt={packageDetails.packageName}
                                />
                        </div>
                        <div className="package-info">
                                <h1>{packageDetails.packageName}</h1>
                                <p className="package-description">
                                        {packageDetails.description}
                                </p>

                                <h3>Cancellation Rules</h3>
                                <p className="cancellation-rules">
                                        Free cancellation until{" "}
                                        <strong>{fullRefundDate}</strong>.
                                        <br />
                                        After{" "}
                                        <strong>
                                                {partialRefundDate}
                                        </strong>: <span>50% refund.</span>
                                </p>

                                <div className="pricing">
                                        <div className="add-prices">
                                                <p>Package Price</p>
                                                <p>
                                                        Rs:{" "}
                                                        {packageDetails.price}
                                                </p>
                                        </div>
                                        <div className="total-save">
                                                <p>Total Cost</p>
                                                <p>Rs: {calculatedPrice}</p>
                                        </div>
                                        <button
                                                className="choose-button"
                                                onClick={showModal}
                                        >
                                                Reserve
                                        </button>
                                </div>

                                {/* Reservation Modal */}
                                <Modal
                                        title="Reserve Package"
                                        open={isModalOpen}
                                        onOk={handleOk}
                                        onCancel={handleCancel}
                                        footer={[
                                                <Button
                                                        key="cancel"
                                                        onClick={handleCancel}
                                                        className="custom-cancel-button"
                                                >
                                                        Cancel
                                                </Button>,
                                                <Button
                                                        key="submit"
                                                        type="primary"
                                                        onClick={handleOk}
                                                        className="custom-submit-button"
                                                >
                                                        Reserve
                                                </Button>,
                                        ]}
                                        className="custom-reservation-modal"
                                >
                                        <Form form={form} layout="vertical">
                                                <Form.Item
                                                        label="Name"
                                                        name="name"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please enter your name",
                                                                },
                                                        ]}
                                                >
                                                        <Input />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Email"
                                                        name="email"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please enter your email",
                                                                },
                                                                {
                                                                        type: "email",
                                                                        message: "Please enter a valid email",
                                                                },
                                                        ]}
                                                >
                                                        <Input />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Phone"
                                                        name="phone"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please enter your phone number",
                                                                },
                                                                {
                                                                        pattern: /^[0-9]+$/,
                                                                        message: "Please enter a valid phone number",
                                                                },
                                                        ]}
                                                >
                                                        <Input />
                                                </Form.Item>
                                                <Form.Item
                                                        label="Start & End Dates"
                                                        name="dates"
                                                        rules={[
                                                                {
                                                                        required: true,
                                                                        message: "Please select the start and end dates",
                                                                },
                                                        ]}
                                                >
                                                        <DatePicker.RangePicker
                                                                format="YYYY-MM-DD"
                                                                onChange={
                                                                        onDateChange
                                                                }
                                                        />
                                                </Form.Item>
                                        </Form>
                                </Modal>
                        </div>
                </div>
        );
}

export default PackageView;
