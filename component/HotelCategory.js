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

const HotelCategory = () => {
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  // Fetch categories from API
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await coreAxios.get("hotelCategory");
      if (response?.status === 200) {
        setLoading(false);
        setCategories(response.data);
        setFilteredCategories(response.data); // Initially set filtered categories to all categories
      }
    } catch (error) {
      message.error("Failed to fetch categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
    },
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        const newCategory = {
          name: values.name,
          description: values.description,
        };

        if (isEditing) {
          const res = await coreAxios.put(
            `hotelCategory/${editingKey}`,
            newCategory
          );
          if (res?.status === 200) {
            message.success("Category updated successfully!");
            fetchCategories();
          }
        } else {
          const res = await coreAxios.post("hotelCategory", newCategory);
          if (res?.status === 200) {
            message.success("Category created successfully!");
            fetchCategories();
          }
        }

        resetForm();
        setVisible(false);
        setIsEditing(false);
        setEditingKey(null);
      } catch (error) {
        message.error("Failed to add/update category. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleEdit = (record) => {
    setEditingKey(record._id);
    formik.setValues({
      name: record.name,
      description: record.description,
    });
    setVisible(true);
    setIsEditing(true);
  };

  const handleDelete = async (key) => {
    setLoading(true);
    try {
      const res = await coreAxios.delete(`hotelCategory/${key}`);
      if (res?.status === 200) {
        message.success("Category deleted successfully!");
        fetchCategories();
      }
    } catch (error) {
      message.error("Failed to delete category. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Flat/Room Type",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
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
                title="Are you sure you want to delete this category?"
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

  // Global search
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    const filteredData = categories.filter(
      (c) =>
        c.name.toLowerCase().includes(value) ||
        c.description.toLowerCase().includes(value)
    );
    setFilteredCategories(filteredData);
    setPagination({ ...pagination, current: 1 }); // Reset to page 1 after filtering
  };

  // Paginate the filtered data
  const paginatedCategories = filteredCategories.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  return (
    <div>
      {/* Global Search */}
     <div className='flex justify-between'>
     <Input
        placeholder="Search by Flat/Room Name or Description"
        value={searchText}
        onChange={handleSearch}
        style={{ marginBottom: 16, width: 300 }}
      />

      <Button
        type="primary"
        onClick={() => {
          formik.resetForm();
          setVisible(true);
          setIsEditing(false);
        }}
        className="mb-4 bg-[#8ABF55] hover:bg-[#7DA54E] text-white">
        Add New Falt/Room Type
      </Button>
     </div>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={paginatedCategories}
          pagination={false} // Disable default pagination
          rowKey="_id"
          onChange={handleTableChange}
          scroll={{ x: true }}
        />
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={filteredCategories?.length}
          onChange={(page) => setPagination({ ...pagination, current: page })}
          className="mt-4"
        />
      </Spin>

      <Modal
        title={isEditing ? "Edit Category" : "Create Category"}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}>
        <Form onFinish={formik.handleSubmit} layout="vertical">
          <Form.Item label="Flat/Room Type">
            <Input
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
            />
          </Form.Item>
          <Form.Item label="Description">
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
    </div>
  );
};

export default HotelCategory;
