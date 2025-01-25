"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Upload,
  Table,
  Select,
  message,
  Input,
  Radio,
  Image,
  Spin,
  Pagination,
  Menu,
  Popconfirm,
  Dropdown,
} from "antd";
import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import { useFormik } from "formik";
import axios from "axios";
import coreAxios from "@/utils/axiosInstance";
import { toast } from "react-toastify";

const roleInfo = [
  { id: 1, value: "agentadmin", label: "Agent Admin" },
  { id: 2, value: "superadmin", label: "Super Admin" },
  { id: 3, value: "hoteladmin", label: "Hotel Admin" },
  { id: 4, value: "admin", label: "Admin" },
];

const AgentInformation = () => {
  const token = localStorage.getItem("token");
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await coreAxios.get("/auth/users");
      if (response.status === 200) {
        setLoading(false);
        setUsers(response.data);
      }
    } catch (error) {
      message.error("Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formik = useFormik({
    initialValues: {
      image: null,
      username: "",
      email: "",
      phoneNumber: "",
      password: "",
      currentAddress: "",
      role: "",
      gender: "",
      loginID: "",
    },
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        if (isEditing) {
          const newUser = {
            key: uuidv4(),
            image: values?.image,
            username: values.username,
            email: values.email,
            phoneNumber: values.phoneNumber,

            password: values?.password,
            plainPassword: values?.password,
            currentAddress: values.currentAddress,
            gender: values.gender,
            loginID: values.loginID,
            role: roleInfo.find((role) => role.value === values.role),
          };
          const response = await coreAxios.put(
            `auth/users/${editingKey}`,
            newUser
          );
          if (response?.status === 200) {
            message.success("User updated successfully!");
          }
        } else {
          if (values?.image) {
            const imageUrl = await handleImageUpload(values?.image);

            const newUser = {
              key: uuidv4(),
              image: imageUrl,
              username: values.username,
              email: values.email,
              phoneNumber: values.phoneNumber,

              password: values?.password,
              plainPassword: values?.password,
              currentAddress: values.currentAddress,
              gender: values.gender,
              loginID: values.loginID,
              role: roleInfo.find((role) => role.value === values.role),
            };
            const response = await coreAxios.post("/auth/register", newUser);

            if (response?.status === 200) {
              message.success("User added successfully!");
            } else {
              message.error(response?.error);
            }
          } else {
            const newUser = {
              key: uuidv4(),
              image: "",
              username: values.username,
              email: values.email,
              phoneNumber: values.phoneNumber,

              password: values?.password,
              plainPassword: values?.password,
              currentAddress: values.currentAddress,
              gender: values.gender,
              loginID: values.loginID,
              role: roleInfo.find((role) => role.value === values.role),
            };
            const response = await coreAxios.post("/auth/register", newUser);

            if (response?.status === 200) {
              message.success("User added successfully!");
            } else {
              message.error(response?.error);
            }
          }
        }
        resetForm();
        setVisible(false);
        setIsEditing(false);
        setEditingKey(null);
        fetchUsers();
      } catch (error) {
        message.error("Failed to add/update user. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleImageUpload = async (imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=0d928e97225b72fcd198fa40d99a15d5`,
        formData
      );
      return response.data.data.url;
    } catch (error) {
      // message.error("Image upload failed. Please try again.");
      // return null;
    }
  };

  const handleEdit = (record) => {
    setEditingKey(record?.id);
    formik.setValues({
      image: record.image,
      username: record.username,
      email: record.email,
      phoneNumber: record.phoneNumber,

      currentAddress: record.currentAddress,
      role: record.role.value,
      gender: record.gender,
      loginID: record.loginID,
      status: "",
    });
    setVisible(true);
    setIsEditing(true);
  };

  const handleDelete = async (key) => {
    try {
      const data = {
        ...key,
        status: "deleted",
      };
      setLoading(true);
      const response = await coreAxios.delete(`auth/users/hard/${key?.id}`);
      if (response?.status === 200) {
        setLoading(false);
        message.success("User deleted successfully!");
        fetchUsers();
      }
    } catch (error) {
      setLoading(false);
      message.error(error);
    }
  };

  const columns = [
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (image, record) => {
        // Check for gender and provide a fallback image based on gender
        const defaultMaleImage =
          "https://static.vecteezy.com/system/resources/thumbnails/003/773/576/small/business-man-icon-free-vector.jpg";
        const defaultFemaleImage =
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQWAtOLEsziFIaBIl6r27R6f0Rh1eU-Ha0Y-g&s";

        return (
          <Image
            src={
              image ||
              (record.gender === "male" ? defaultMaleImage : defaultFemaleImage)
            }
            alt="Profile"
            width={40} // Reduced width for smaller design
            height={40} // Reduced height for smaller design
            style={{ borderRadius: "50%" }} // Make image rounded
          />
        );
      },
    },

    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      width: "15%", // Adjust width for compact design
    },
    {
      title: "User ID",
      dataIndex: "loginID",
      key: "loginID",
      width: "20%", // Adjust width for compact design
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: "20%", // Adjust width for compact design
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: "15%", // Adjust width for compact design
    },

    {
      title: "Address",
      dataIndex: "currentAddress",
      key: "currentAddress",
      width: "20%", // Adjust width for compact design
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      width: "10%", // Adjust width for compact design
    },
    {
      title: "Role",
      dataIndex: ["role", "label"],
      key: "role",
      width: "10%", // Adjust width for compact design
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
                onConfirm={() => handleDelete(record)}>
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
  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  return (
    <div className="">
      <Button
        type="primary"
        onClick={() => {
          setIsEditing(false);
          formik.resetForm();
          setVisible(true);
        }}
        className="mb-4 bg-[#8ABF55] hover:bg-[#7DA54E] text-white">
        Add New User
      </Button>
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={users?.users}
          pagination={false}
          rowKey="key"
          onChange={handleTableChange}
          scroll={{ x: true }}
        />
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={users?.users?.length}
          onChange={(page, pageSize) =>
            setPagination({ ...pagination, current: page, pageSize })
          }
        />
      </Spin>

      {/* User Modal */}
      <Modal
        title={isEditing ? "Edit User" : "Add New User"}
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}>
        <form onSubmit={formik.handleSubmit}>
          <div className="mb-4">
            <label htmlFor="username" className="block mb-1">
              Username
            </label>
            <Input
              id="username"
              name="username"
              placeholder="Enter username"
              value={formik.values.username}
              onChange={formik.handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="loginID" className="block mb-1">
              User ID
            </label>
            <Input
              id="loginID"
              name="loginID"
              placeholder="Enter User ID"
              value={formik.values.loginID}
              onChange={formik.handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-1">
              Email
            </label>
            <Input
              id="email"
              name="email"
              placeholder="Enter email"
              value={formik.values.email}
              onChange={formik.handleChange}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block mb-1">
              Phone Number
            </label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              placeholder="Enter phone number"
              value={formik.values.phoneNumber}
              onChange={formik.handleChange}
              required={true}
            />
          </div>
          {!isEditing && (
            <div className="mb-4">
              <label htmlFor="password" className="block mb-1">
                Password
              </label>
              <Input.Password
                id="password"
                name="password"
                placeholder="Enter password"
                value={formik.values.password}
                required
                onChange={formik.handleChange}
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="currentAddress" className="block mb-1">
              Current Address
            </label>
            <Input
              id="currentAddress"
              name="currentAddress"
              placeholder="Enter current address"
              value={formik.values.currentAddress}
              onChange={formik.handleChange}
              required={true}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="gender" className="block mb-1">
              Gender
            </label>
            <Radio.Group
              id="gender"
              name="gender"
              required
              onChange={(e) => formik.setFieldValue("gender", e.target.value)}
              value={formik.values.gender}>
              <Radio value="male">Male</Radio>
              <Radio value="female">Female</Radio>
              <Radio value="other">Other</Radio>
            </Radio.Group>
          </div>
          <div className="mb-4 pb-2">
            <label htmlFor="role" className="block mb-1">
              Role
            </label>
            <Select
              className="w-full" // Full width
              id="role"
              placeholder="Select Role"
              showSearch // Enable search functionality
              optionFilterProp="children" // Filter based on option label
              value={formik.values.role}
              onChange={(value) => formik.setFieldValue("role", value)}>
              {roleInfo.map((role) => (
                <Select.Option key={role.id} value={role.value}>
                  {role.label}
                </Select.Option>
              ))}
            </Select>
          </div>

          {!isEditing && (
            <div className="mb-4">
              <label htmlFor="image" className="block mb-1">
                Profile Picture
              </label>
              <Upload
                name="image"
                listType="picture"
                maxCount={1}
                beforeUpload={() => false}
                onChange={({ fileList }) =>
                  formik.setFieldValue("image", fileList[0]?.originFileObj)
                }>
                <Button icon={<UploadOutlined />}>Upload</Button>
              </Upload>
            </div>
          )}
          <Button
            type="primary"
            loading={loading}
            htmlType="submit"
            className="w-full bg-[#8ABF55] hover:bg-[#7DA54E] mt-2">
            {isEditing ? "Update User" : "Add User"}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default AgentInformation;
