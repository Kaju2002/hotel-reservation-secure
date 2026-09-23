import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { message, Modal, Button } from "antd";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import "../../css/users/SalaryDetails.css";

function SalaryDetails() {
    const [salaryDetails, setSalaryDetails] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const qrRef = useRef();
    const employeeId = JSON.parse(localStorage.getItem("currentUser")).userID;

    const getSalaryDetails = async () => {
        try {
            const response = await axios.get(`/api/employee/viewSalary/${employeeId}`);
            setSalaryDetails(response.data.salary);
            console.log(response.data.salary);
        } catch (error) {
            console.log(error);
            message.error("Failed to fetch salary details");
        }
    };

    useEffect(() => {
        getSalaryDetails();
    }, []);

    const downloadQR = () => {
        html2canvas(qrRef.current).then((canvas) => {
            const link = document.createElement("a");
            link.download = `Salary_QR_${employeeId}.png`;
            link.href = canvas.toDataURL();
            link.click();
        });
    };

    return (
        <div className="salary-details-container">
            <h2>Your Salary for This Month Credited</h2>
            {salaryDetails === null ? (
                <p>Loading salary details...</p>
            ) : (
                <div className="salary-card">
                    <h3>Salary Details</h3>
                    <p><strong>Amount:</strong> Rs {salaryDetails.amount}</p>
                    <p><strong>Bank:</strong> {salaryDetails.bank}</p>
                    <p><strong>Bank Branch Number:</strong> {salaryDetails.bankBranchNumber}</p>
                    <p><strong>Account Number:</strong> {salaryDetails.accountNumber}</p>
                    <p><strong>Date Added:</strong> {new Date(salaryDetails.dateAdded).toLocaleDateString()}</p>
                    <Button type="primary" onClick={() => setIsModalOpen(true)}>
                        Show QR Code
                    </Button>
                </div>
            )}

            {/* QR Code Modal */}
            <Modal
                title="Salary QR Code"
                open={isModalOpen}
                onOk={downloadQR}
                onCancel={() => setIsModalOpen(false)}
                okText="Download QR"
                cancelText="Close"
            >
                {salaryDetails && (
                    <div style={{ textAlign: 'center' }} ref={qrRef}>
                        <QRCodeCanvas
                            value={`Amount: Rs ${salaryDetails.amount}\nBank: ${salaryDetails.bank}\nBranch: ${salaryDetails.bankBranchNumber}\nAccount: ${salaryDetails.accountNumber}\nDate: ${new Date(salaryDetails.dateAdded).toLocaleDateString()}`}
                            size={250}
                        />
                        <p>Scan to view salary details!</p>
                    </div>
                )}
            </Modal>
        </div>
    );
}

export default SalaryDetails;
