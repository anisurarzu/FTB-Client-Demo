"use client";

import React, { useEffect, useState } from "react";
import { Button, Card, message, Space, Table } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import WebHotelDetailsFormModal from "./WebHotelDetailsFormModal";

export default function WebHotelDetailsPage() {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await coreAxios.get("/web-hotel-details");
      setDetails(res.data);
    } catch (error) {
      message.error("Failed to fetch hotel details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleEdit = (record) => {
    setEditRecord(record);
    setEditMode(true);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await coreAxios.delete(`/web-hotel-details/${id}`);
      message.success("Deleted successfully");
      fetchDetails();
    } catch (error) {
      message.error("Failed to delete");
      console.error(error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editMode) {
        await coreAxios.put(`/web-hotel-details/${editRecord._id}`, values);
        message.success("Updated successfully");
      } else {
        await coreAxios.post("/web-hotel-details", values);
        message.success("Created successfully");
      }
      fetchDetails();
      setModalVisible(false);
      setEditRecord(null);
      setEditMode(false);
    } catch (error) {
      message.error(error.response?.data?.error || "Operation failed");
      console.error(error);
    }
  };

  const columns = [
    { 
      title: "Hotel Name", 
      dataIndex: "name",
      key: "name"
    },
    { 
      title: "Location", 
      dataIndex: "location",
      key: "location" 
    },
    { 
      title: "Rating", 
      dataIndex: "rating",
      key: "rating",
      render: (rating) => rating?.toFixed(1)
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button
            danger
            size="small"
            onClick={() => handleDelete(record._id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Hotel Details Management"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditRecord(null);
            setEditMode(false);
            setModalVisible(true);
          }}
        >
          Add Details
        </Button>
      }
    >
      <Table
        dataSource={details}
        loading={loading}
        rowKey="_id"
        columns={columns}
        pagination={{ pageSize: 10 }}
      />

      <WebHotelDetailsFormModal
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditRecord(null);
          setEditMode(false);
        }}
        onSubmit={handleSubmit}
        editMode={editMode}
        initialValues={editRecord}
      />
    </Card>
  );
}