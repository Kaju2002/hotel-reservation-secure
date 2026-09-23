import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  message,
  Table,
  Card,
  Avatar,
  Row,
  Col,
  Statistic,
  Spin,
  Input,
  Button,
  Modal,
  Form,
  Typography,
  Tag,
  Tooltip,
  Progress,
  Space,
  Popconfirm,
  Select,
  Checkbox,
} from "antd";
import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Import the jsPDF autotable plugin
import {
  UserOutlined,
  TrophyOutlined,
  SmileOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  DownloadOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined
} from "@ant-design/icons";


const { Title, Text } = Typography;
const { Option } = Select;

function ManageEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spotlightData, setSpotlightData] = useState(null);
  const [spotlightLoading, setSpotlightLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSalaryModalVisible, setIsSalaryModalVisible] = useState(false);
const [selectedEmployee, setSelectedEmployee] = useState(null);
const [salaryForm] = Form.useForm();
const [salaryDetails, setSalaryDetails] = useState(null);
const [isSalaryDetailsModalVisible, setIsSalaryDetailsModalVisible] = useState(false);
const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);

  // State to manage selected fields for PDF report
  const [selectedFields, setSelectedFields] = useState([
    "employeeId", // Added Employee ID
    "firstName",
    "lastName",
    "email",
    "username",
    "department",
    "customerSatisfaction",
    "tasksCompleted",
    "recentAchievement",
  ]);

  useEffect(() => {
    fetchEmployees();
    fetchSpotlightData();
  }, []);

  const fetchSpotlightData = async () => {
    setSpotlightLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/employee/spotlight");
      setSpotlightData(response.data);
    } catch (error) {
      message.error("Failed to fetch employee spotlight data");
    } finally {
      setSpotlightLoading(false);
    }
  };
  const showAddSalaryModal = (employee) => {
    setSelectedEmployee(employee);
    salaryForm.resetFields(); // Reset fields in case of re-opening modal
    setIsSalaryModalVisible(true);
  };

  const showViewEmployeeModal = (employee) => {
    setViewEmployee(employee);
    setIsViewModalVisible(true);
  };

  const handleAddSalary = async (values) => {
    try {
      await axios.post("http://localhost:5000/api/employee/addSalary", {
        employeeId: selectedEmployee.employeeId,
        ...values, // This will include amount, bank, bankBranchNumber, and accountNumber
      });
      message.success("Salary added successfully");
      setIsSalaryModalVisible(false);
      fetchEmployees(); // Refresh employee data
    } catch (error) {
      message.error("Failed to add salary");
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/employee/getEmployees");
      const employeesWithLeaves = await Promise.all(
        response.data.map(async (employee) => {
          const leaveResponse = await axios.get(`http://localhost:5000/api/employee/getLeave/${employee.employeeId}`);
          return { ...employee, leaves: leaveResponse.data.leaves || [] };
        })
      );
      setEmployees(employeesWithLeaves);
    } catch (error) {
      message.error("Failed to fetch employees and leaves");
    } finally {
      setLoading(false);
    }
  };

  const handleViewSalary = async (employeeId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/employee/viewSalary/${employeeId}`);
      setSalaryDetails(response.data.salary); // Assuming salary data is returned directly
      setIsSalaryDetailsModalVisible(true);
    } catch (error) {
      message.error("Failed to fetch salary details");
    }
  };

  const handleApproveLeave = async (employeeId, leaveId) => {
    try {
      await axios.post("http://localhost:5000/api/employee/approveLeave", { empID: employeeId, leaveID: leaveId });
      message.success("Leave approved successfully");
      fetchEmployees(); // Refresh the data
    } catch (error) {
      message.error("Failed to approve leave");
    }
  };

  const handleDenyLeave = async (employeeId, leaveId) => {
    try {
      await axios.post("http://localhost:5000/api/employee/denyLeave", { empID: employeeId, leaveID: leaveId });
      message.success("Leave denied successfully");
      fetchEmployees(); // Refresh the data
    } catch (error) {
      message.error("Failed to deny leave");
    }
  };

  // Function to generate PDF report
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    const headers = selectedFields.map((field) => {
      switch (field) {
        case "employeeId": return "Employee ID"; // Added Employee ID header
        case "firstName": return "First Name";
        case "lastName": return "Last Name";
        case "email": return "Email";
        case "username": return "Username";
        case "department": return "Department";
        case "customerSatisfaction": return "Customer Satisfaction";
        case "tasksCompleted": return "Tasks Completed";
        case "recentAchievement": return "Recent Achievement";
        default: return "";
      }
    });

    const data = employees.map((employee) =>
      selectedFields.map((field) => employee[field])
    );

    doc.autoTable({
      head: [headers],
      body: data,
    });

    doc.save("employees_report.pdf");
  };

  const handleFieldChange = (checkedValues) => {
    setSelectedFields(checkedValues);
  };

  const availableFields = [
    { label: "Employee ID", value: "employeeId" }, // Added Employee ID option
    { label: "First Name", value: "firstName" },
    { label: "Last Name", value: "lastName" },
    { label: "Email", value: "email" },
    { label: "Username", value: "username" },
    { label: "Department", value: "department" },
    { label: "Customer Satisfaction", value: "customerSatisfaction" },
    { label: "Tasks Completed", value: "tasksCompleted" },
    { label: "Recent Achievement", value: "recentAchievement" },
  ];

  const handleAddEdit = async (values) => {
    const formData = new FormData();
    formData.append("firstName", values.firstName);
    formData.append("lastName", values.lastName);
    formData.append("email", values.email);
    formData.append("username", values.username);
    formData.append("department", values.department);
    formData.append("customerSatisfaction", values.customerSatisfaction);
    formData.append("tasksCompleted", values.tasksCompleted);
    formData.append("recentAchievement", values.recentAchievement);
    if (selectedFile) {
      formData.append("profilePicture", selectedFile);
    }
  
    try {
      const config = {
        headers: { "Content-Type": "multipart/form-data" },
      };
  
      if (editingEmployee) {
        await axios.put(`http://localhost:5000/api/employee/${editingEmployee.employeeId}`, formData, config);
        message.success("Employee updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/employee/addEmployee", formData, config);
        message.success("Employee added successfully");
      }
      setIsModalVisible(false);
      fetchEmployees();
      fetchSpotlightData();
    } catch (error) {
      message.error("Failed to save employee");
    }
  };

  const handleDelete = async (employeeId) => {
    try {
      await axios.post("http://localhost:5000/api/employee/deleteEmployee", { employeeId });
      message.success("Employee deleted successfully");
      fetchEmployees();
      fetchSpotlightData();
    } catch (error) {
      message.error("Failed to delete employee");
    }
  };

  const showModal = (employee = null) => {
    setEditingEmployee(employee);
    if (employee) {
      form.setFieldsValue(employee);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: "Employee",
      key: "employee",
      render: (_, record) => (
        <Space>
          <Avatar src={record.imageUrl || undefined} icon={<UserOutlined />} />
          <span>
            {record.firstName} {record.lastName}
          </span>
        </Space>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (department) => <Tag color="blue">{department}</Tag>,
    },
    {
      title: "Customer Satisfaction",
      dataIndex: "customerSatisfaction",
      key: "customerSatisfaction",
      render: (satisfaction) => (
        <Tooltip title={`${satisfaction}/5`}>
          <Progress percent={satisfaction * 20} steps={5} />
        </Tooltip>
      ),
    },
    {
      title: "Tasks Completed",
      dataIndex: "tasksCompleted",
      key: "tasksCompleted",
      render: (tasks) => <Text strong>{tasks}</Text>,
    },
    {
      title: "Leave Action",
      key: "leaveAction",
      render: (_, employee) => {
        const pendingLeave = employee.leaves.find((leave) => leave.status === "Pending");
        if (pendingLeave) {
          return (
            <Space>
              <Tooltip title="Approve Leave">
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleApproveLeave(employee.employeeId, pendingLeave.leaveID)}
                />
              </Tooltip>
              <Tooltip title="Deny Leave">
                <Popconfirm
                  title="Are you sure you want to deny this leave?"
                  onConfirm={() => handleDenyLeave(employee.employeeId, pendingLeave.leaveID)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="danger" icon={<CloseOutlined />} />
                </Popconfirm>
              </Tooltip>
            </Space>
          );
        }
        return <Tag color="green">No Pending Leave</Tag>;
      },
    },
    {
      title: "Salary Actions",
      key: "salaryActions",
      render: (_, employee) => (
        <Space>
          <Tooltip title="Add Salary">
            <Button
              type="primary"
              onClick={() => showAddSalaryModal(employee)}
            >
              Add Salary
            </Button>
          </Tooltip>
          <Tooltip title="View Salary">
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewSalary(employee.employeeId)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, employee) => (
        <Space>
          <Tooltip title="View Employee Details">
            <Button
              icon={<EyeOutlined />}
              onClick={() => showViewEmployeeModal(employee)} // Show view modal on click
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => showModal(employee)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this employee?"
              onConfirm={() => handleDelete(employee.employeeId)}
              okText="Yes"
              cancelText="No"
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];
  

  const EmployeeSpotlight = () => {
    if (spotlightLoading) {
      return (
        <Card>
          <Spin />
        </Card>
      );
    }
    if (!spotlightData) {
      return <Card>No spotlight data available</Card>;
    }
    return (
      <Card
        title={
          <Title level={4}>
            <TrophyOutlined /> Employee Spotlight
          </Title>
        }
        extra={<Tag color="gold">Top Performer</Tag>}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Avatar
              size={120}
              icon={<UserOutlined />}
              src={spotlightData.imageUrl || undefined}
            />
            <Title level={3} style={{ marginTop: "16px", marginBottom: "4px" }}>
              {spotlightData.name}
            </Title>
            <Text type="secondary">{spotlightData.department}</Text>
          </Col>
          <Col xs={24} sm={16}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Customer Satisfaction"
                  value={spotlightData.customerSatisfaction}
                  suffix="/ 5"
                  prefix={<SmileOutlined style={{ color: "#52c41a" }} />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Tasks Completed"
                  value={spotlightData.tasksCompleted}
                  prefix={<ClockCircleOutlined style={{ color: "#1890ff" }} />}
                />
              </Col>
            </Row>
            <div style={{ marginTop: "20px" }}>
              <Title level={5}>Recent Achievement</Title>
              <Text>{spotlightData.recentAchievement}</Text>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div className="manage-employees-1234" style={{ padding: "24px" }}>
      <EmployeeSpotlight />
      <Card
        className="margin-top"
        title={<Title level={4}>Existing Employees</Title>}
        extra={
          <Space>
            <Button type="primary" onClick={() => showModal(null)} icon={<PlusOutlined />}>
              Add Employee
            </Button>
            
          </Space>
        }
      >
        <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ marginLeft: '60%', width: 'calc(100% - 10px)', marginRight: '10px' }}>
  <Select
    mode="multiple" // Use multiple selection
    placeholder="Select fields"
    value={selectedFields}
    onChange={handleFieldChange}
    style={{ width: '100%' }} // Adjust the width to fill the parent div
  >
    {availableFields.map((field) => (
      <Select.Option key={field.value} value={field.value}>
        {field.label}
      </Select.Option>
    ))}
  </Select>
</div>
  <Button type="primary" icon={<DownloadOutlined />} onClick={downloadPDF}>
    Download PDF
  </Button>
</div>
        <Input
          placeholder="Search employees"
          className="margin-top"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: "16px" }}
          prefix={<SearchOutlined />}
        />
        <Table
          columns={columns}
          dataSource={employees.filter((employee) => 
            employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.lastName.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          rowKey="employeeId"
          loading={loading}
        />
      </Card>
      <Modal
        title={
          <Title level={4}>
            {editingEmployee ? "Edit Employee" : "Add New Employee"}
          </Title>
        }
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleAddEdit} layout="vertical">
        <Form.Item
  name="profilePicture"
  label="Profile Picture"
  rules={[{ required: true, message: "Please upload a profile picture" }]}
>
  <Input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} />
</Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="department"
            label="Department"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select a department">
              <Option value="HR">Human Resources</Option>
              <Option value="IT">Information Technology</Option>
              <Option value="Finance">Finance</Option>
              <Option value="Marketing">Marketing</Option>
              <Option value="Operations">Operations</Option>
              <Option value="Security">Security</Option>
              <Option value="Cleaner">Cleaner</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="customerSatisfaction"
            label="Customer Satisfaction"
            rules={[{ required: true }]}
          >
            <Input type="number" min={0} max={5} />
          </Form.Item>
          <Form.Item
            name="tasksCompleted"
            label="Tasks Completed"
            rules={[{ required: true }]}
          >
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="recentAchievement" label="Recent Achievement">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingEmployee ? "Update" : "Add"} Employee
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
  title="Add Salary"
  visible={isSalaryModalVisible}
  onCancel={() => setIsSalaryModalVisible(false)}
  footer={null}
>
  <Form form={salaryForm} onFinish={handleAddSalary} layout="vertical">
    <Form.Item
      name="amount"
      label="Salary Amount"
      //rules={[{ required: true, type: "number", min: 0 }]}
    >
      <Input type="number" />
    </Form.Item>
    <Form.Item
      name="bank"
      label="Bank Name"
      rules={[{ required: true }]}
    >
      <Input />
    </Form.Item>
    <Form.Item
      name="bankBranchNumber"
      label="Bank Branch Number"
      rules={[{ required: true }]}
    >
      <Input />
    </Form.Item>
    <Form.Item
      name="accountNumber"
      label="Account Number"
      rules={[{ required: true }]}
    >
      <Input />
    </Form.Item>
    <Form.Item>
      <Button type="primary" htmlType="submit" block>
        Add Salary
      </Button>
    </Form.Item>
  </Form>
</Modal>

<Modal
  title="Salary Details"
  visible={isSalaryDetailsModalVisible}
  onCancel={() => setIsSalaryDetailsModalVisible(false)}
  footer={null}
>
  {salaryDetails ? (
    <div>
      <p><strong>Salary Amount:</strong> {salaryDetails.amount}</p>
      <p><strong>Bank Name:</strong> {salaryDetails.bank}</p>
      <p><strong>Bank Branch Number:</strong> {salaryDetails.bankBranchNumber}</p>
      <p><strong>Account Number:</strong> {salaryDetails.accountNumber}</p>
    </div>
  ) : (
    <Spin />
  )}
</Modal>
<Modal
  title="Employee Details"
  visible={isViewModalVisible}
  onCancel={() => setIsViewModalVisible(false)}
  footer={null}
>
  {viewEmployee ? (
    <Row gutter={16}>
      <Col span={8}>
        <Avatar
          size={100}
          src={viewEmployee.imageUrl || undefined}
          icon={<UserOutlined />}
        />
      </Col>
      <Col span={16}>
        <Title level={4}>{`${viewEmployee.firstName} ${viewEmployee.lastName}`}</Title>
        <p><strong>Email:</strong> {viewEmployee.email}</p>
        <p><strong>Username:</strong> {viewEmployee.username}</p>
        <p><strong>Department:</strong> {viewEmployee.department}</p>
        <p><strong>Customer Satisfaction:</strong> {viewEmployee.customerSatisfaction}/5</p>
        <p><strong>Tasks Completed:</strong> {viewEmployee.tasksCompleted}</p>
        <p><strong>Recent Achievement:</strong> {viewEmployee.recentAchievement}</p>
      </Col>
    </Row>
  ) : (
    <Spin />
  )}
</Modal>
      
    </div>
  );
}

export default ManageEmployees;
