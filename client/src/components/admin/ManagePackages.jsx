import React, { useState, useEffect, useMemo } from "react";
import { Space, Table, Modal, Input, message, Form, InputNumber } from "antd";
import { Icon } from "@iconify/react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import PackageAlerts from "./PackageAlerts";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function ManagePackages() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [packages, setPackages] = useState([]);
  const [bookingData, setBookingData] = useState([]);
  const [editingPackage, setEditingPackage] = useState(null);
  const [searchText, setSearchText] = useState("");

  const [form] = Form.useForm(); // Form instance for adding a package
  const [updateForm] = Form.useForm(); // Form instance for updating a package

  const showModal = () => setIsModalOpen(true);
  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const showUpdateModal = (packageData) => {
    setEditingPackage(packageData);
    setIsUpdateModalOpen(true);
    updateForm.setFieldsValue(packageData);
  };

  const handleUpdateCancel = () => {
    setIsUpdateModalOpen(false);
    updateForm.resetFields();
    setEditingPackage(null);
  };

  // Fetch packages
  const fetchPackages = async () => {
    try {
      const response = await axios.get("/api/package/getPackages");
      setPackages(response.data.packages);
    } catch (err) {
      console.log(err);
    }
  };

  // Fetch booking data
  const fetchBookingData = async () => {
    try {
      const response = await axios.get("/api/package/getBookingData");
      setBookingData(response.data.reservations); // Access the "reservations" key
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchBookingData();
  }, []);

  // Add new package
  const addPackage = async () => {
    try {
      const values = await form.validateFields();
      await axios.post("/api/package/addPackage", values);
      setIsModalOpen(false);
      message.success("Package added successfully");
      fetchPackages();
      form.resetFields();
    } catch (err) {
      console.log(err);
      message.error(
        err.response?.data?.message || "Failed to add package"
      );
    }
  };

  // Update package
  const handleUpdate = async () => {
    try {
      const values = await updateForm.validateFields();
      await axios.put(
        `/api/package/updatePackage/${editingPackage._id}`,
        values
      );
      setIsUpdateModalOpen(false);
      message.success("Package updated successfully");
      fetchPackages();
      updateForm.resetFields();
    } catch (err) {
      console.log(err);
      message.error(
        err.response?.data?.message || "Failed to update package"
      );
    }
  };

  // Delete package
  const deletePackage = async (id) => {
    try {
      await axios.delete(`/api/package/deletePackage/${id}`);
      message.success("Package deleted successfully");
      fetchPackages(); // Refresh the list of packages after deletion
    } catch (err) {
      console.log(err);
      message.error("Failed to delete package");
    }
  };

  // Function to convert JSON to CSV and trigger download
  const downloadCSV = () => {
    const headers = ["Package Name", "Description", "Size", "Price", "Date Added"];
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(","));

    // Add data rows
    packages.forEach((pkg) => {
      const row = [
        pkg.packageName,
        pkg.description,
        pkg.size,
        pkg.price,
        new Date(pkg.createdAt).toLocaleDateString(),
      ];
      csvRows.push(row.join(","));
    });

    // Create CSV file
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    // Trigger download
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "packages.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Filter packages based on search input
  const filteredPackages = packages.filter((pkg) => {
    return (
      pkg.packageName.toLowerCase().includes(searchText.toLowerCase()) || // Filter by package name
      pkg.description.toLowerCase().includes(searchText.toLowerCase()) || // Filter by description
      pkg.price.toString().includes(searchText) // Filter by price
    );
  });

  // Define the columns for the table
  const columns = [
    {
      title: "Package Name",
      dataIndex: "packageName",
      key: "packageName",
      sorter: (a, b) => a.packageName.localeCompare(b.packageName),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
    {
      title: "Size (People)",
      dataIndex: "size",
      key: "size",
      sorter: (a, b) => a.size - b.size,
      render: (text) => `${text} Person(s)`,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
      render: (text) => `RS: ${text}`,
    },
    {
      title: "Date Added",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt), // Sort by createdAt in descending order
      render: (text) => new Date(text).toLocaleDateString(), // Format date
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Icon
            onClick={() => showUpdateModal(record)}
            icon="akar-icons:edit"
            width="24"
            height="24"
          />
          <Icon
            onClick={() => deletePackage(record._id)}
            icon="material-symbols:delete"
            width="24"
            height="24"
          />
        </Space>
      ),
    },
  ];

  let totalPackages = packages.length;

// Create a Set to store unique booked package IDs
const uniqueBookedPackageIds = new Set(bookingData.map((booking) => booking.packageId.toString()));
// Filter the packages that are booked based on the unique package IDs
let bookedPackages = packages.filter((pkg) => uniqueBookedPackageIds.has(pkg._id.toString())).length;
// Calculate unbooked packages by subtracting the booked packages from total packages
let unbookedPackages = totalPackages - bookedPackages;
  let barChartData = {};
  let pieChartData = {};

  // Prepare data for the charts
  if (Array.isArray(bookingData)) {
    const bookingDates = bookingData.map((booking) =>
      new Date(booking.startDate).toLocaleDateString()
    );
    const bookingCountByDate = bookingDates.reduce((acc, date) => {
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    barChartData = {
      labels: Object.keys(bookingCountByDate),
      datasets: [
        {
          label: "Bookings by Date",
          data: Object.values(bookingCountByDate),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
          barThickness: 30,
          maxBarThickness: 50,
        },
      ],
    };

    pieChartData = {
      labels: ["Booked Packages", "Unbooked Packages"],
      datasets: [
        {
          label: "Package Booking Count",
          data: [bookedPackages, unbookedPackages],
          backgroundColor: ["rgba(255, 99, 132, 0.6)", "rgba(54, 162, 235, 0.6)"],
          borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)"],
          borderWidth: 1,
        },
      ],
    };
  }

  return (
    <div className="manage_packages">
      <div className="manage_Package_insight">
        <div>
          <h1>Package Insight</h1>
        </div>
        <div className="package_insight">
          <div className="package_bar">
            <h2>Package Booking Count</h2>
            <Pie data={pieChartData} />
          </div>
          <div className="package_chart">
            <h2>Package Booking by Date</h2>
            <Bar data={barChartData} />
          </div>
        </div>
        <div className="package_chart">
          <div className="package_card">
            <div className="package_insight_card">
              <h1>{totalPackages}</h1>
              <p>Total Packages</p>
            </div>
            <div className="package_insight_card">
              <h1>{bookedPackages}</h1>
              <p>Booked Packages</p>
            </div>
            <div className="package_insight_card">
              <h1>{unbookedPackages}</h1>
              <p>Unbooked Packages</p>
            </div>
            <PackageAlerts packages={packages} bookingData={bookingData} />
          </div>
        </div>
      </div>

      <div className="manage_packages_content">
        <div className="manage_packages_header">
          <h1>Manage Packages</h1>
          <div className="search-container-122313">
            <div className="search-bar_">
              <Input
                placeholder="Search packages"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  width: 300,
                  marginLeft: 20,
                }}
              />
            </div>
            <button className="add_new_package" onClick={showModal}>
              Add Package
            </button>
            <button className="download_pkg" onClick={downloadCSV}>
              Download CSV
            </button>
          </div>
          <Modal title="Add Package" open={isModalOpen} onOk={addPackage} onCancel={handleCancel}>
            <Form form={form} layout="vertical">
              <Form.Item
                label="Package Image"
                name="packageImage"
                rules={[{ required: true, message: "Please enter the package Image URL" }]}
              >
                <Input placeholder="Enter image URL" />
              </Form.Item>
              <Form.Item
                label="Package Name"
                name="packageName"
                rules={[{ required: true, message: "Please enter the package name" }]}
              >
                <Input placeholder="Enter package name" />
              </Form.Item>
              <Form.Item
                label="Description"
                name="description"
                rules={[{ required: true, message: "Please enter the package description" }]}
              >
                <Input placeholder="Enter package description" />
              </Form.Item>
              <Form.Item
                label="Size (People)"
                name="size"
                rules={[{ required: true, message: "Please enter the number of people" }]}
              >
                <InputNumber placeholder="Enter package size" style={{ width: "100%" }} min={1} />
              </Form.Item>
              <Form.Item
                label="Price"
                name="price"
                rules={[
                  { required: true, message: "Please enter the package price" },
                  { type: "number", min: 0, message: "Price must be a positive number" },
                ]}
              >
                <InputNumber placeholder="Enter package price" style={{ width: "100%" }} />
              </Form.Item>
            </Form>
          </Modal>
        </div>
        <div className="managepackages_table">
          <Table
            columns={columns}
            dataSource={filteredPackages} // Use the filtered data
            pagination={{ pageSize: 6 }} // Pagination with 6 rows per page
            rowKey="_id" // Ensure each row has a unique key
          />
        </div>
        <Modal title="Update Package" open={isUpdateModalOpen} onOk={handleUpdate} onCancel={handleUpdateCancel}>
          <Form form={updateForm} layout="vertical">
            <Form.Item
              label="Package Image"
              name="packageImage"
              rules={[{ required: true, message: "Please enter the package Image URL" }]}
            >
              <Input placeholder="Enter image URL" />
            </Form.Item>
            <Form.Item
              label="Package Name"
              name="packageName"
              rules={[{ required: true, message: "Please enter the package name" }]}
            >
              <Input placeholder="Enter package name" />
            </Form.Item>
            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true, message: "Please enter the package description" }]}
            >
              <Input placeholder="Enter package description" />
            </Form.Item>
            <Form.Item
              label="Size (People)"
              name="size"
              rules={[{ required: true, message: "Please enter the number of people" }]}
            >
              <InputNumber placeholder="Enter package size" style={{ width: "100%" }} min={1} />
            </Form.Item>
            <Form.Item
              label="Price"
              name="price"
              rules={[
                { required: true, message: "Please enter the package price" },
                { type: "number", min: 0, message: "Price must be a positive number" },
              ]}
            >
              <InputNumber placeholder="Enter package price" style={{ width: "100%" }} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

export default ManagePackages;
