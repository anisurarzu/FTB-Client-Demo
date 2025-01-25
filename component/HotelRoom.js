"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Table,
  message,
  Popconfirm,
  Spin,
  Pagination,
  Form,
  Input,
  Dropdown,
  Menu,
} from "antd";
import { EditOutlined, DeleteOutlined, DownOutlined } from "@ant-design/icons";
import { useFormik } from "formik";
import coreAxios from "@/utils/axiosInstance";

const HotelRoom = () => {
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [room, setRoom] = useState([]);
  const [filteredRoom, setFilteredRoom] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50 });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Fetch categories from API
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const response = await coreAxios.get("bookings");
      if (response?.status === 200) {
        setLoading(false);
        setRoom(response.data);
        setFilteredRoom(response.data); // Set filtered room initially to all rooms
      }
    } catch (error) {
      message.error("Failed to fetch rooms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
    },
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        const newRoom = {
          name: values.name,
          description: values.description,
        };

        if (isEditing) {
          const res = await coreAxios.put(`hotelRoom/${editingKey}`, newRoom);
          if (res?.status === 200) {
            message.success("Room updated successfully!");
            fetchRooms();
          }
        } else {
          const res = await coreAxios.post("hotelRoom", newRoom);
          if (res?.status === 200) {
            message.success("Room created successfully!");
            fetchRooms();
          }
        }

        resetForm();
        setVisible(false);
        setIsEditing(false);
        setEditingKey(null);
      } catch (error) {
        message.error("Failed to add/update room. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleEdit = (record) => {
    setEditingKey(record._id);
    formik.setValues({
      name: record.name, // Fixed typo here, it was "mame"
      description: record.description,
    });
    setVisible(true);
    setIsEditing(true);
  };

  const handleDelete = async (key) => {
    setLoading(true);
    try {
      const res = await coreAxios.delete(`hotelRoom/${key}`);
      if (res?.status === 200) {
        message.success("Room deleted successfully!");
        fetchRooms();
      }
    } catch (error) {
      console.log("---", error);
      message.error("Failed to delete room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Flat/Room No.", // Updated the header name
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "Room Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const menu = (
          <Menu>
            <Menu.Item
              key="edit"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}>
              Edit
            </Menu.Item>
            <Menu.Item key="delete" icon={<DeleteOutlined />}>
              <Popconfirm
                title="Are you sure you want to delete this room?"
                onConfirm={() => handleDelete(record._id)}>
                Delete
              </Popconfirm>
            </Menu.Item>
          </Menu>
        );

        return (
          <Dropdown overlay={menu} trigger={["click"]}>
            <Button>
              Actions <DownOutlined />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  // Paginate the filtered data
  const paginatedRooms = filteredRoom.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  // Global search
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    const filteredData = room.filter(
      (r) =>
        r.name.toLowerCase().includes(value) ||
        r.description.toLowerCase().includes(value)
    );
    setFilteredRoom(filteredData);
    setPagination({ ...pagination, current: 1 }); // Reset to page 1 after filtering
  };

  // Set row styles to reduce height
  const rowClassName = () => {
    return "small-row-height";
  };

  return (
    <div>
      {/* Global Search */}

      <div className="flex justify-between">
        <Button
          type="primary"
          onClick={() => {
            formik.resetForm();
            setVisible(true);
            setIsEditing(false);
          }}
          className="mb-4 bg-[#8ABF55] hover:bg-[#7DA54E] text-white mr-2">
          Add New Room
        </Button>

        <Input
          placeholder="Search by Flat No/Unit or Description"
          value={searchText}
          onChange={handleSearch}
          style={{ marginBottom: 16, width: 300 }}
        />
      </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={paginatedRooms}
          pagination={false} // Disable default pagination
          rowKey="_id"
          onChange={handleTableChange}
          scroll={{ x: true }}
          rowClassName={rowClassName} // Apply custom row class
        />
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={filteredRoom?.length}
          onChange={(page, pageSize) =>
            setPagination({ current: page, pageSize })
          } // Update both current page and pageSize
          className="mt-4"
        />
      </Spin>

      <Modal
        title={isEditing ? "Edit Room" : "Create Room"}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}>
        <Form onFinish={formik.handleSubmit} layout="vertical">
          <Form.Item label="Room Name">
            <Input
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
            />
          </Form.Item>
          <Form.Item label="Room Description">
            <Input.TextArea
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              rows={4}
            />
          </Form.Item>
          <Form.Item>
            <Button
              loading={loading}
              type="primary"
              htmlType="submit"
              className="bg-[#8ABF55] hover:bg-[#7DA54E] text-white">
              {isEditing ? "Update" : "Create"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx>{`
        .small-row-height td {
          padding: 8px !important; /* Adjust the padding to reduce row height */
        }
      `}</style>
    </div>
  );
};

export default HotelRoom;
