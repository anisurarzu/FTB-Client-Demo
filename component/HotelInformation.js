"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Table,
  message,
  Spin,
  Form,
  Input,
  Popconfirm,
} from "antd";
import { useFormik } from "formik";
import coreAxios from "@/utils/axiosInstance";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

const HotelInformation = () => {
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hotelInfo, setHotelInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // Fetch hotel data
  const fetchHotelInformation = async () => {
    setLoading(true);
    try {
      const response = await coreAxios.get("hotel");
      if (response?.status === 200) {
        setHotelInfo(response.data);
      }
    } catch (error) {
      message.error("Failed to fetch hotel information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotelInformation();
  }, []);

  // Formik for handling form data and submission
  const formik = useFormik({
    initialValues: {
      hotelName: "",
      hotelDescription: "",
      roomCategories: [
        {
          name: "",
          roomNumbers: [
            {
              name: "",
              bookedDates: [],
              bookings: [],
            },
          ],
        },
      ],
    },
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);

        // Construct the new hotel info object
        const newHotelInfo = {
          hotelName: values.hotelName,
          hotelDescription: values.hotelDescription,
          roomCategories: values.roomCategories.map((category) => ({
            name: category.name,
            roomNumbers: category.roomNumbers.map((room) => ({
              name: room.name,
              bookedDates: room.bookedDates,
              bookings: room.bookings,
            })),
          })),
        };

        // Handle Update or Create
        if (isEditing) {
          await coreAxios.put(`/hotel/${editId}`, newHotelInfo);
          message.success("Hotel information updated successfully!");
        } else {
          const res = await coreAxios.post(`/hotel`, newHotelInfo);
          if (res?.status === 200) {
            message.success("Hotel information submitted successfully!");
          }
        }

        resetForm();
        setVisible(false);
        setIsEditing(false);
        fetchHotelInformation();
      } catch (error) {
        message.error("Failed to submit hotel information. Please try again.");
      } finally {
        setLoading(false);
      }
    },
  });

  // Handle Edit action
  const handleEdit = (hotel) => {
    setIsEditing(true);
    setVisible(true);
    setEditId(hotel._id);

    // Pre-fill the form with hotel data
    formik.setValues({
      hotelName: hotel.hotelName,
      hotelDescription: hotel.hotelDescription,
      roomCategories: hotel.roomCategories.map((category) => ({
        name: category.name,
        roomNumbers: category.roomNumbers.map((room) => ({
          name: room.name,
          bookedDates: room.bookedDates,
          bookings: room.bookings,
        })),
      })),
    });
  };

  // Handle Delete action
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await coreAxios.delete(`/hotel/${id}`);
      message.success("Hotel deleted successfully!");
      fetchHotelInformation();
    } catch (error) {
      message.error("Failed to delete hotel. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add new room category
  const addRoomCategory = () => {
    formik.setFieldValue("roomCategories", [
      ...formik.values.roomCategories,
      {
        name: "",
        roomNumbers: [
          {
            name: "",
            bookedDates: [],
            bookings: [],
          },
        ],
      },
    ]);
  };

  // Remove a room category
  const removeRoomCategory = (index) => {
    const updatedCategories = [...formik.values.roomCategories];
    updatedCategories.splice(index, 1);
    formik.setFieldValue("roomCategories", updatedCategories);
  };

  // Add a room number to a specific category
  const addRoomNumber = (index) => {
    const updatedCategories = [...formik.values.roomCategories];
    updatedCategories[index].roomNumbers.push({
      name: "",
      bookedDates: [],
      bookings: [],
    });
    formik.setFieldValue("roomCategories", updatedCategories);
  };

  // Remove a room number from a specific category
  const removeRoomNumber = (catIndex, roomIndex) => {
    const updatedCategories = [...formik.values.roomCategories];
    updatedCategories[catIndex].roomNumbers.splice(roomIndex, 1);
    formik.setFieldValue("roomCategories", updatedCategories);
  };

  return (
    <div className="">
      <Button
        type="primary"
        onClick={() => {
          formik.resetForm();
          setVisible(true);
          setIsEditing(false);
        }}
        className="mb-4 bg-[#8ABF55] hover:bg-[#7DA54E] text-white">
        Add New Hotel Information
      </Button>

      <Spin spinning={loading}>
        <Table
          columns={[
            {
              title: "Hotel Name",
              dataIndex: "hotelName",
              key: "hotelName",
            },
            {
              title: "Hotel Description",
              dataIndex: "hotelDescription",
              key: "hotelDescription",
            },
            {
              title: "Room Categories & Numbers",
              dataIndex: "roomCategories",
              key: "roomCategories",
              render: (categories) =>
                categories?.map((cat) => (
                  <div key={cat?.name}>
                    {cat?.name}:{" "}
                    {cat?.roomNumbers?.map((room) => room.name).join(", ")}
                  </div>
                )),
            },
            {
              title: "Actions",
              key: "actions",
              render: (_, record) => (
                <>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                    className="mr-2">
                    Edit
                  </Button>
                  <Popconfirm
                    title="Are you sure you want to delete this hotel?"
                    onConfirm={() => handleDelete(record._id)}>
                    <Button icon={<DeleteOutlined />} danger>
                      Delete
                    </Button>
                  </Popconfirm>
                </>
              ),
            },
          ]}
          dataSource={hotelInfo}
          pagination={false}
          rowKey="_id"
        />
      </Spin>

      {/* Modal for Hotel Info */}
      <Modal
        title={
          isEditing ? "Edit Hotel Information" : "Create Hotel Information"
        }
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}>
        <Form onFinish={formik.handleSubmit} layout="vertical">
          <Form.Item label="Hotel Name">
            <Input
              name="hotelName"
              value={formik.values.hotelName}
              onChange={formik.handleChange}
            />
          </Form.Item>

          <Form.Item label="Hotel Description">
            <Input
              name="hotelDescription"
              value={formik.values.hotelDescription}
              onChange={formik.handleChange}
            />
          </Form.Item>

          {/* Dynamic Room Categories & Rooms */}
          {formik.values.roomCategories.map((category, catIndex) => (
            <div key={catIndex} className="mb-4">
              <Form.Item label={`Room Category ${catIndex + 1}`}>
                <div className="flex">
                  <Input
                    name={`roomCategories[${catIndex}].name`}
                    value={category.name}
                    onChange={formik.handleChange}
                    placeholder="Enter room category"
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="link"
                    onClick={() => removeRoomCategory(catIndex)}
                    danger
                    style={{ marginLeft: 10 }}>
                    -
                  </Button>
                </div>
              </Form.Item>

              {category.roomNumbers.map((room, roomIndex) => (
                <Form.Item key={roomIndex} label={`Room ${roomIndex + 1} Name`}>
                  <div className="flex">
                    <Input
                      name={`roomCategories[${catIndex}].roomNumbers[${roomIndex}].name`}
                      value={room.name}
                      onChange={formik.handleChange}
                      placeholder="Enter room name"
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="link"
                      onClick={() => removeRoomNumber(catIndex, roomIndex)}
                      danger
                      style={{ marginLeft: 10 }}>
                      -
                    </Button>
                  </div>
                </Form.Item>
              ))}

              <Button
                type="dashed"
                onClick={() => addRoomNumber(catIndex)}
                block>
                Add Room
              </Button>
            </div>
          ))}

          <Button
            type="dashed"
            onClick={addRoomCategory}
            block
            className="mb-3">
            Add Room Category
          </Button>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {isEditing
                ? "Update Hotel Information"
                : "Submit Hotel Information"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HotelInformation;
