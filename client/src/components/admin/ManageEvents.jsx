import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Pagination, message } from 'antd';
import axios from 'axios';
import { Icon } from '@iconify/react';
import { DatePicker } from 'antd';
import moment from 'moment';
import { PrinterOutlined } from '@ant-design/icons';
import { CSVLink } from "react-csv"; // Import CSVLink for CSV download

const { confirm } = Modal;

const ManageEvents = () => {
    const [events, setEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]); // State to hold all events for CSV download
    const [pagination, setPagination] = useState({ current: 1, pageSize: 7, total: 0 });
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [searchText, setSearchText] = useState("");

    const [form] = Form.useForm();

    useEffect(() => {
        fetchEvents();
        fetchAllEvents(); // Fetch all events for the CSV download
    }, [pagination.current, searchText]);

    // Fetch paginated events for table view
    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('/api/Event/getEvents', {
                params: {
                    page: pagination.current,
                    limit: pagination.pageSize,
                    search: searchText,
                }
            });
            setEvents(data.events);
            setPagination({ ...pagination, total: data.totalPages * pagination.pageSize });
        } catch (error) {
            message.error("Error fetching events");
        } finally {
            setLoading(false);
        }
    };

    // Fetch all events for CSV download
    const fetchAllEvents = async () => {
        try {
            const { data } = await axios.get('/api/Event/getEvents', {
                params: { page: 1, limit: 1000, search: searchText }, // Request all events (adjust limit if needed)
            });
            setAllEvents(data.events); // Save all events for CSV download
        } catch (error) {
            message.error("Error fetching all events");
        }
    };

    const handleAddNewEvent = () => {
        setIsEditMode(false);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEditEvent = (record) => {
        setIsEditMode(true);
        setSelectedEvent(record);
        form.setFieldsValue({
            ...record,
        });
        setIsModalVisible(true);
    };

    const showDeleteConfirm = (eventId) => {
        confirm({
            title: 'Are you sure you want to delete this event?',
            content: 'This action cannot be undone',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await axios.post('/api/Event/deleteEvent', { eventId });
                    message.success('Event deleted successfully');
                    fetchEvents();
                } catch (error) {
                    message.error('Error deleting event');
                }
            },
            onCancel() {
                console.log('Cancel');
            },
        });
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedEvent(null);
    };

    const handleSubmit = async (values) => {
        try {
            if (isEditMode) {
                await axios.post('/api/Event/updateEvent', { ...values, eventId: selectedEvent.eventId });
                message.success('Event updated successfully');
            } else {
                await axios.post('/api/Event/addEvent', values);
                message.success('Event added successfully');
            }
            setIsModalVisible(false);
            fetchEvents();
            fetchAllEvents(); // Refresh all events list after adding/editing an event
        } catch (error) {
            message.error(isEditMode ? 'Error updating event' : 'Error adding event');
        }
    };

    const columns = [
        { title: 'Event ID', dataIndex: 'eventId', key: 'eventId' },
        { title: 'Event Name', dataIndex: 'eventName', key: 'eventName' },
        { title: 'Event Type', dataIndex: 'eventType', key: 'eventType' },
        { title: 'Price', dataIndex: 'price', key: 'price' },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        {
            title: 'Action',
            key: 'action',
            render: (text, record) => (
                <div className="action-buttons-manageEvent">
                    <Icon
                        onClick={() => handleEditEvent(record)}
                        icon="akar-icons:edit"
                        width="24"
                        height="24"
                        style={{ cursor: 'pointer', marginRight: '10px' }}
                    />
                    <Icon
                        onClick={() => showDeleteConfirm(record.eventId)}
                        icon="material-symbols:delete"
                        width="24"
                        height="24"
                        style={{ cursor: 'pointer', color: 'red' }}
                    />
                </div>
            ),
        },
    ];

    // CSV Headers and CSV Data
    const csvHeaders = [
        { label: "Event ID", key: "eventId" },
        { label: "Event Name", key: "eventName" },
        { label: "Event Type", key: "eventType" },
        { label: "Price", key: "price" },
        { label: "Description", key: "description" },
    ];

    const handleSearch = (e) => {
        setSearchText(e.target.value);
    };

    return (
        <div className="sg_eventManage_table_bg">
            <div className="manage-events">
                <div className="search-add-container">
                    <Input placeholder="Search events" value={searchText} onChange={handleSearch} className="search-bar-eventmanage" />
                    
                    <div className="Event_button_group"> 
                        {/* CSV Download Button */}
                        <CSVLink
                            data={allEvents} // Use allEvents instead of events for the full list
                            headers={csvHeaders}
                            filename={"events_report.csv"}
                            className="csv_button_event"
                        >
                            <Button type="primary" className="Event_generate_report_button">
                                    <PrinterOutlined style={{ marginRight: '5px' }} /> 
                                    Export
                                </Button>
                        </CSVLink>

                        <Button type="primary" onClick={handleAddNewEvent} className="add_event_button" style={{ backgroundColor: '#25b05f' }}>Add Event</Button>
                    </div>
                </div>
                <Table
                    columns={columns}
                    dataSource={events}
                    pagination={false}
                    loading={loading}
                    rowKey="eventId"
                />
                <Pagination
                    {...pagination}
                    onChange={(page) => setPagination({ ...pagination, current: page })}
                    className="pagination-eventMange"
                />
                <Modal
                    title={isEditMode ? "Edit Event" : "Add New Event"}
                    visible={isModalVisible}
                    onCancel={handleCancel}
                    onOk={() => form.submit()}
                >
                    <Form
                        form={form}
                        onFinish={handleSubmit}
                        layout="vertical"
                    >
                        <Form.Item label="Event Name" name="eventName" rules={[{ required: true, message: 'Please input the event name!' }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Event Type" name="eventType" rules={[{ required: true, message: 'Please input the event type!' }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Price" name="price" rules={[{ required: true, message: 'Please input the price!' }]}>
                            <Input type="number" />
                        </Form.Item>
                        <Form.Item label="Description" name="description" rules={[{ required: true, message: 'Please input the description!' }]}>
                            <Input.TextArea />
                        </Form.Item>
                        <Form.Item label="Image Link" name="baseImage" rules={[{ required: true, message: 'Please input the image link!' }]}>
                            <Input />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
}

export default ManageEvents;
