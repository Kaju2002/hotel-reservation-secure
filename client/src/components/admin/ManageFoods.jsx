import React, { useState, useEffect } from 'react';
import { Table, Input, Button, message, Modal, Form, Select, InputNumber, Image, Dropdown, Menu, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import fileDownload from 'js-file-download';

const { Search } = Input;
const { Option } = Select;

const ManageCateringFoods = () => {
  const [foods, setFoods] = useState([]);
  const [allFoods, setAllFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [previewFood, setPreviewFood] = useState(null);
  const [selectedFields, setSelectedFields] = useState([
    'ItemID',
    'Name',
    'Description',
    'Price',
    'Category',
    'Type',
    'ImageURL',
  ]);
  const [chefMealModalVisible, setChefMealModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [chefMealForm] = Form.useForm();
  const [file, setFile] = useState(null);
  const [chefMealFile, setChefMealFile] = useState(null); // Add state for chef meal file

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/catering/getItems');
      setFoods(response.data || []);
      setAllFoods(response.data || []);
    } catch (error) {
      message.error('Failed to fetch foods');
    } finally {
      setLoading(false);
    }
  };

  const showChefMealModal = () => {
    chefMealForm.resetFields();
    setChefMealFile(null); // Reset the file state
    setChefMealModalVisible(true);
  };

  const handleAddChefMeal = async () => {
    try {
      const values = await chefMealForm.validateFields();
      const formData = new FormData();
      formData.append('foodImage', chefMealFile); // Append the file
      Object.keys(values).forEach(key => {
        formData.append(key, values[key]); // Append other form fields
      });

      await axios.post('http://localhost:5000/api/cheff/addOrder', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Set the content type for the request
        },
      });
      message.success('Chef meal added successfully');
      setChefMealModalVisible(false);
      chefMealForm.resetFields(); // Reset the form after submission
      setChefMealFile(null); // Reset the file state
    } catch (error) {
      message.error('Failed to add chef meal: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSearch = (value) => {
    if (value.trim() === '') {
      setFoods(allFoods);
    } else {
      const filteredFoods = allFoods.filter((food) =>
        food.name.toLowerCase().includes(value.toLowerCase()) ||
        food.description.toLowerCase().includes(value.toLowerCase()) ||
        food.category.toLowerCase().includes(value.toLowerCase()) ||
        food.type.toLowerCase().includes(value.toLowerCase())
      );
      setFoods(filteredFoods);
    }
  };

  const showModal = (food = null) => {
    setEditingFood(food);
    setModalVisible(true);
    if (food) {
      form.setFieldsValue(food);
    } else {
      form.resetFields();
    }
  };

  const handlePreview = (food) => {
    setPreviewFood(food);
    setPreviewVisible(true);
  };

  const handleFileChange = (e) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleChefMealFileChange = (e) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      setChefMealFile(files[0]); // Set the chef meal file
    }
  };

  const handleOk = () => {
    form.validateFields().then(async (values) => {
      try {
        const formData = new FormData();
        // Append the image only if it's changed
        if (file) {
          formData.append('image', file);
        }
        Object.keys(values).forEach(key => {
          formData.append(key, values[key]);
        });
  
        if (editingFood) {
          // Include itemId in the formData for updates
          formData.append('itemId', editingFood.itemId);
          await axios.post('http://localhost:5000/api/catering/updateItem', formData);
          message.success('Food item updated successfully');
        } else {
          await axios.post('http://localhost:5000/api/catering/addItem', formData);
          message.success('Food item added successfully');
        }
        setModalVisible(false);
        fetchFoods();
      } catch (error) {
        message.error('Operation failed: ' + (error.response?.data?.error || error.message));
      }
    });
  };
  

  const handleDelete = async (itemId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this food item?',
      onOk: async () => {
        try {
          await axios.post('http://localhost:5000/api/catering/deleteItem', { itemId });
          message.success('Food item deleted successfully');
          fetchFoods();
        } catch (error) {
          message.error('Failed to delete food item');
        }
      },
    });
  };

  const exportToCSV = () => {
    const csvData = foods.map((food) => {
      const item = {};
      selectedFields.forEach((field) => {
        switch (field) {
          case 'ItemID':
            item[field] = food.itemId || '';
            break;
          case 'ImageURL':
            item[field] = food.imageUrl || '';
            break;
          case 'Name':
            item[field] = food.name || '';
            break;
          case 'Description':
            item[field] = food.description || '';
            break;
          case 'Price':
            item[field] = food.price ? `$${food.price.toFixed(2)}` : '';
            break;
          case 'Category':
            item[field] = food.category || '';
            break;
          case 'Type':
            item[field] = food.type || '';
            break;
          default:
            item[field] = '';
        }
      });
      return item;
    });

    const csvContent = [
      selectedFields,
      ...csvData.map((item) => selectedFields.map((field) => item[field]))
    ]
      .map((e) => e.join(','))
      .join('\n');

    fileDownload(csvContent, 'catering_foods_report.csv');
  };

  const menu = (
    <Menu>
      {['ItemID', 'Name', 'Description', 'Price', 'Category', 'Type', 'ImageURL'].map((field) => (
        <Menu.Item key={field}>
          <Checkbox
            checked={selectedFields.includes(field)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedFields([...selectedFields, field]);
              } else {
                setSelectedFields(selectedFields.filter((item) => item !== field));
              }
            }}
          >
            {field}
          </Checkbox>
        </Menu.Item>
      ))}
    </Menu>
  );

  const columns = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (text) => (
        <Image 
          src={text} 
          alt="food" 
          width={100} 
          height={100} 
        />
      ),
    },
    { title: 'Item ID', dataIndex: 'itemId', key: 'itemId' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (price) => `$${price.toFixed(2)}` },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <Button onClick={() => handlePreview(record)}>Preview</Button>
          <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          <Button icon={<DeleteOutlined />} onClick={() => handleDelete(record.itemId)} danger />
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Manage Catering Foods</h1>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Search
          placeholder="Search foods"
          onSearch={handleSearch}
          style={{ width: 300 }}
          enterButton
        />
        <div>
          <Button type="default" onClick={showChefMealModal} style={{ marginRight: 10 }}>
            Request
          </Button>
          <Dropdown overlay={menu} placement="bottomRight" trigger={['click']}>
            <Button type="default" style={{ marginRight: 10 }}>
              Select Fields
            </Button>
          </Dropdown>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={exportToCSV}
          >
            Export CSV
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal(null)}
            style={{ marginLeft: 10 }}
          >
            Add Food
          </Button>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={foods}
        rowKey="itemId"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Add Chef Meal"
        visible={chefMealModalVisible}
        onOk={handleAddChefMeal}
        onCancel={() => setChefMealModalVisible(false)}
      >
        <Form form={chefMealForm} layout="vertical">
          <Form.Item label="Food Image" required>
            <Input type="file" onChange={handleChefMealFileChange} accept="image/*" />
          </Form.Item>
          <Form.Item name="foodName" label="Food Name" rules={[{ required: true, message: 'Please enter the food name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="foodQuantity" label="Quantity" rules={[{ required: true, message: 'Please enter the quantity', type: 'number', min: 1 }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingFood ? 'Edit Food Item' : 'Add New Food Item'}
        visible={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="imageUrl" label="Image" valuePropName="file">
            <Input type="file" onChange={handleFileChange} />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true, type: 'number', min: 0.01 }]}>
            <InputNumber style={{ width: '100%' }} step={0.01} />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Option value="vegi">Veg</Option>
              <Option value="non-vegi">Non-Veg</Option>
            </Select>
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select>
              <Option value="breakfast">Breakfast</Option>
              <Option value="lunch">Lunch</Option>
              <Option value="dinner">Dinner</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Food Item Preview"
        visible={previewVisible}
        onOk={() => setPreviewVisible(false)}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="back" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {previewFood && (
          <div>
            <Image src={previewFood.imageUrl} alt={previewFood.name} width={200} />
            <h3>{previewFood.name}</h3>
            <p><strong>Description:</strong> {previewFood.description}</p>
            <p><strong>Price:</strong> ${previewFood.price.toFixed(2)}</p>
            <p><strong>Category:</strong> {previewFood.category}</p>
            <p><strong>Type:</strong> {previewFood.type}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageCateringFoods;
