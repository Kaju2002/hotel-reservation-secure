import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, List, message } from 'antd';

const Cheff = () => {
  const [orders, setOrders] = useState([]);

  // Function to fetch all orders from the server
  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/cheff/getAllOrders');
      console.log(response.data); // Log the fetched orders for debugging
      setOrders(response.data);
    } catch (error) {
      message.error('Failed to fetch orders');
    }
  };

  useEffect(() => {
    fetchOrders(); // Fetch orders when the component mounts
  }, []);

  // Function to handle order deletion
  const handleDelete = async (orderId) => {
    try {
      await axios.delete(`http://localhost:5000/api/cheff/deleteOrder/${orderId}`);
      message.success('Order deleted successfully');
      fetchOrders(); // Refresh the order list after deletion
    } catch (error) {
      console.error('Error deleting order:', error.response ? error.response.data : error.message);
      message.error('Failed to delete order');
    }
  };

   // Function to handle order finishing
   const handleFinish = async (orderId) => {
    try {
      await axios.post(`http://localhost:5000/api/cheff/finishOrder/${orderId}`);
      message.success('Order finished successfully and email notification sent');
      fetchOrders(); // Refresh the order list after finishing
    } catch (error) {
      console.error('Error finishing order:', error.response ? error.response.data : error.message);
      message.error('Failed to finish order');
    }
  };
  return (
    <div style={{ padding: '24px' }}>
      <h1>Chef's Order List</h1>
      <List
        itemLayout="horizontal"
        dataSource={orders}
        renderItem={(order) => (
          <List.Item
            actions={[
              <Button type="primary" onClick={() => handleDelete(order._id)} danger>
                Delete
              </Button>,
              <Button type="default" onClick={() => handleFinish(order._id)}>
              Finish
            </Button>, // Finish button
            ]}
          >
            <List.Item.Meta
              avatar={
                <img
                  src={order.foodImageUrl}
                  alt={order.foodName}
                  style={{ width: 50, height: 50, borderRadius: '5px' }}
                />
              }
              title={`Food Name: ${order.foodName}`}
              description={`Quantity: ${order.foodQuantity}`}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default Cheff;
