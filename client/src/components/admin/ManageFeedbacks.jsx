import React, { useEffect, useState } from "react";
import { Table, Button, Input } from "antd";
import axios from "axios";
import { CSVLink } from "react-csv";
import { AiFillPrinter } from "react-icons/ai";

function ManageFeedbacks() {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [allFeedbacks, setAllFeedbacks] = useState([]);
    const [searchTitle, setSearchTitle] = useState("");
    const [selectedRowKeys, setSelectedRowKeys] = useState([]); // Store selected feedback IDs
    const limit = 7;

    useEffect(() => {
        fetchFeedbacks(page);
        fetchAllFeedbacks();
    }, [page]);

    const fetchFeedbacks = async (page) => {
        setLoading(true);
        try {
            const response = await axios.post("/api/feedback/getFeedback", { page, limit });
            setFeedbacks(response.data.feedbacks);
            setTotal(response.data.total);
        } catch (error) {
            console.error("Error fetching feedbacks:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllFeedbacks = async () => {
        try {
            const response = await axios.post("/api/feedback/getFeedback", { page: 1, limit: 0 });
            setAllFeedbacks(response.data.feedbacks);
        } catch (error) {
            console.error("Error fetching all feedbacks:", error);
        }
    };

    const columns = [
        {
            title: "Feedback ID",
            dataIndex: "_id",
            key: "feedbackId",
            render: (text, record, index) => String.fromCharCode(65 + index),
        },
        {
            title: "Title",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "Category",
            dataIndex: "category",
            key: "category",
        },
        {
            title: "Username",
            dataIndex: "username",
            key: "username",
        },
        {
            title: "User ID",
            dataIndex: "userID",
            key: "userID",
        },
        {
            title: "Rating",
            dataIndex: "rating",
            key: "rating",
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (text) => (text.length > 30 ? `${text.substring(0, 30)}...` : text),
        },
        {
            title: "Timestamp",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (text) => new Date(text).toLocaleString(),
        },
    ];

    // Function to get CSV data excluding certain columns
    const getFilteredCSVData = () => {
        const filteredFeedbacks = selectedRowKeys.length > 0
            ? allFeedbacks.filter(feedback => selectedRowKeys.includes(feedback._id)) // Use selected feedback IDs
            : allFeedbacks.filter(feedback => feedback.title.toLowerCase().includes(searchTitle.toLowerCase())); // Fallback to search title

        // Return feedback data but exclude the specified columns
        return filteredFeedbacks.map(feedback => ({
            // Add the columns you want to keep (in this case, nothing, but you can modify this)
            // We are keeping it empty to exclude all specified columns
        }));
    };

    const getCSVFilename = () => {
        const filteredFeedbacks = getFilteredCSVData();
        if (filteredFeedbacks.length > 0) {
            const title = filteredFeedbacks[0].Title ? filteredFeedbacks[0].Title.replace(/\s+/g, '_') : "filtered";
            return `${title}-feedbacks.csv`;
        }
        return "filtered-feedbacks.csv";
    };

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys); // Update selected feedback IDs
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    return (
        <div className="manage_feedback_main_container_admin_123">
            <h1>Manage Feedbacks</h1>

            {/* Title Search Input */}
            <Input
                placeholder="Search by Title"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                style={{ width: 200, marginBottom: '20px' }}
            />

            <div className="csv_button_container_123">
                <Button type="primary" className="csv_button_admin_123">
                    <CSVLink
                        data={getFilteredCSVData()}
                        filename={getCSVFilename()}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        Export <AiFillPrinter style={{ marginLeft: '8px' }} />
                    </CSVLink>
                </Button>
            </div>

            <Table
                rowSelection={rowSelection} // Enable row selection
                columns={columns}
                dataSource={feedbacks.filter(feedback =>
                    feedback.title.toLowerCase().includes(searchTitle.toLowerCase())
                )}
                loading={loading}
                pagination={{
                    current: page,
                    total: total,
                    pageSize: limit,
                    onChange: (page) => setPage(page),
                }}
                rowKey="_id"
            />
        </div>
    );
}

export default ManageFeedbacks;
