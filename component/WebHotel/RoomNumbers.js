"use client";

import { useState, useEffect } from "react";
import {
  Button,
  message,
  Input,
  Pagination,
  Modal,
  Select,
  Form,
  Descriptions,
  Divider,
  Tag,
  Table,
  Card,
  Space,
  Typography,
  Popconfirm,
  Tooltip,
  Image,
  Spin,
  Row,
  Col,
} from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CloseOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import dayjs from "dayjs";

const { Text } = Typography;

const RoomNumbers = () => {
  const [roomNumbers, setRoomNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [form] = Form.useForm();
  const [multipleRooms, setMultipleRooms] = useState([
    { roomNumber: "", roomDetails: "" },
  ]);

  // State for hotels and categories
  const [hotels, setHotels] = useState([]);
  const [categories, setCategories] = useState([]);

  // State for filters
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filterCategories, setFilterCategories] = useState([]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setHotelsLoading(true);

        // Fetch hotels (without categories to reduce payload)
        const hotelsResponse = await coreAxios.get("/web-hotel-details");
        if (hotelsResponse.status === 200) {
          setHotels(hotelsResponse.data);
        }

        // Fetch room numbers and include hotelName
        const roomsResponse = await coreAxios.get("/room-numbers");
        if (roomsResponse.status === 200) {
          const roomsWithHotelNames = roomsResponse.data.map((room) => {
            const hotel = hotelsResponse.data.find(
              (h) => h._id === room.hotelId
            );
            return {
              ...room,
              hotelName: hotel?.name || "N/A",
            };
          });
          setRoomNumbers(roomsWithHotelNames);
        }
      } catch (error) {
        message.error("Failed to fetch initial data");
      } finally {
        setLoading(false);
        setHotelsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const fetchCategoriesByHotelId = async (hotelId) => {
    try {
      setCategoriesLoading(true);
      const response = await coreAxios.get(`/web-hotel-details/${hotelId}`);

      // Ensure we always have an array
      const categoriesData = Array.isArray(response?.data?.categories)
        ? response.data?.categories
        : [];
      setCategories(categoriesData);
    } catch (error) {
      message.error("Failed to fetch categories");
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };

  const showModal = (room = null) => {
    setCurrentRoom(room);
    form.resetFields();
    setMultipleRooms([{ roomNumber: "", roomDetails: "" }]);

    if (room) {
      // Set form values first
      form.setFieldsValue({
        hotelId: room.hotelId,
        categoryId: room.categoryId,
        roomNumber: room.roomNumber,
        roomDetails: room.roomDetails,
        roomImage: room.roomImage,
      });

      // Then fetch categories for this hotel
      fetchCategoriesByHotelId(room.hotelId);
    } else {
      setCategories([]);
    }

    setIsModalVisible(true);
  };

  const handleHotelChange = async (hotelId) => {
    try {
      setCategoriesLoading(true);
      // Reset category first
      form.setFieldsValue({ categoryId: undefined });

      // Fetch categories for the selected hotel
      await fetchCategoriesByHotelId(hotelId);

      // If editing and the selected hotel is the same as current room's hotel,
      // try to preserve the category if it exists in the new hotel's categories
      if (currentRoom && currentRoom.hotelId === hotelId) {
        const hasOriginalCategory = categories.some(
          (c) => c._id === currentRoom.categoryId
        );
        if (hasOriginalCategory) {
          form.setFieldsValue({ categoryId: currentRoom.categoryId });
        }
      }
    } catch (error) {
      console.error("Error handling hotel change:", error);
      message.error("Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleAddRoomField = () => {
    setMultipleRooms([...multipleRooms, { roomNumber: "", roomDetails: "" }]);
  };

  const handleRemoveRoomField = (index) => {
    if (multipleRooms.length === 1) return; // Don't remove the last one
    const newRooms = [...multipleRooms];
    newRooms.splice(index, 1);
    setMultipleRooms(newRooms);
  };

  const handleRoomFieldChange = (index, field, value) => {
    const newRooms = [...multipleRooms];
    newRooms[index][field] = value;
    setMultipleRooms(newRooms);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Additional validation
      if (!values.hotelId || !values.categoryId) {
        message.error("Please select both hotel and category");
        return;
      }

      // Validate all room numbers
      const invalidRooms = multipleRooms.filter(
        (room) => !room.roomNumber.trim()
      );
      if (invalidRooms.length > 0) {
        message.error("Please enter room numbers for all fields");
        return;
      }

      if (currentRoom) {
        // Update existing room (single room mode)
        const response = await coreAxios.put(
          `/room-numbers/${currentRoom._id}`,
          values
        );
        if (response.status === 200) {
          message.success("Room number updated successfully");
          fetchRoomNumbers();
          setIsModalVisible(false);
        }
      } else {
        // Create multiple rooms
        const promises = multipleRooms.map((room) => {
          const roomData = {
            hotelId: values.hotelId,
            categoryId: values.categoryId,
            roomNumber: room.roomNumber,
            roomDetails: room.roomDetails,
            roomImage: values.roomImage,
          };
          return coreAxios.post("/room-numbers", roomData);
        });

        const results = await Promise.all(promises);
        const allSuccess = results.every((res) => res.status === 201);

        if (allSuccess) {
          message.success(`Successfully added ${results.length} room numbers`);
          fetchRoomNumbers();
          setIsModalVisible(false);
        } else {
          message.error("Some room numbers failed to save");
        }
      }
    } catch (error) {
      message.error(
        error.response?.data?.error || "Failed to save room number(s)"
      );
      console.error("Submission error:", error);
    }
  };

  const fetchRoomNumbers = async () => {
    try {
      setLoading(true);
      const response = await coreAxios.get("/room-numbers");
      if (response.status === 200) {
        // Fetch hotels to get names
        const hotelsResponse = await coreAxios.get("/web-hotel-details");
        if (hotelsResponse.status === 200) {
          const roomsWithHotelNames = response.data.map((room) => {
            const hotel = hotelsResponse.data.find(
              (h) => h._id === room.hotelId
            );
            return {
              ...room,
              hotelName: hotel?.name || "N/A",
            };
          });
          setRoomNumbers(roomsWithHotelNames);
        }
      }
    } catch (error) {
      message.error("Failed to fetch room numbers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await coreAxios.delete(`/room-numbers/${id}`);
      if (response.status === 200) {
        message.success("Room number deleted successfully");
        fetchRoomNumbers();
      }
    } catch (error) {
      message.error("Failed to delete room number");
    }
  };

  // Handle hotel filter change
  const handleHotelFilterChange = async (hotelId) => {
    setSelectedHotel(hotelId);
    setSelectedCategory(null); // Reset category when hotel changes

    if (hotelId) {
      try {
        const response = await coreAxios.get(`/web-hotel-details/${hotelId}`);
        const categoriesData = Array.isArray(response?.data?.categories)
          ? response.data?.categories
          : [];
        setFilterCategories(categoriesData);
      } catch (error) {
        message.error("Failed to fetch categories for filter");
        setFilterCategories([]);
      }
    } else {
      setFilterCategories([]);
    }
  };

  // Handle category filter change
  const handleCategoryFilterChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedHotel(null);
    setSelectedCategory(null);
    setFilterCategories([]);
    setSearchText("");
  };

  const filteredRooms = roomNumbers.filter((room) => {
    // Apply search text filter
    const matchesSearch = [
      room.roomNumber,
      room.roomDetails,
      room.hotelName,
      room.categoryId,
    ].some((field) => field?.toLowerCase().includes(searchText.toLowerCase()));

    // Apply hotel filter if selected
    const matchesHotel = selectedHotel ? room.hotelId === selectedHotel : true;

    // Apply category filter if selected
    const matchesCategory = selectedCategory
      ? room.categoryId === selectedCategory
      : true;

    return matchesSearch && matchesHotel && matchesCategory;
  });

  const paginatedRooms = filteredRooms.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  const columns = [
    {
      title: "Room Number",
      dataIndex: "roomNumber",
      key: "roomNumber",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Hotel",
      dataIndex: "hotelName",
      key: "hotelName",
    },
    {
      title: "Category",
      dataIndex: "categoryId",
      key: "categoryId",
      render: (text) => text || "N/A",
    },
    {
      title: "Details",
      dataIndex: "roomDetails",
      key: "roomDetails",
      render: (text) => text || "N/A",
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("MMM D, YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button icon={<EyeOutlined />} onClick={() => showModal(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          </Tooltip>
          <Popconfirm
            title="Are you sure to delete this room number?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (hotelsLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" tip="Loading hotel data..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Input
            placeholder="Search room numbers..."
            value={searchText}
            onChange={handleSearch}
            style={{ width: 200 }}
            allowClear
          />

          <Select
            placeholder="Filter by Hotel"
            style={{ width: 200 }}
            value={selectedHotel}
            onChange={handleHotelFilterChange}
            allowClear
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {hotels.map((hotel) => (
              <Select.Option key={hotel.hotelId} value={hotel.hotelId}>
                {hotel.name}
              </Select.Option>
            ))}
          </Select>

          <Select
            placeholder="Filter by Category"
            style={{ width: 200 }}
            value={selectedCategory}
            onChange={handleCategoryFilterChange}
            allowClear
            disabled={!selectedHotel}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {filterCategories.map((category) => (
              <Select.Option key={category._id} value={category._id}>
                {category.categoryName}
              </Select.Option>
            ))}
          </Select>

          {(selectedHotel || selectedCategory || searchText) && (
            <Button
              icon={<FilterOutlined />}
              onClick={resetFilters}
              style={{ marginRight: 8 }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchRoomNumbers}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
          >
            Add Room(s)
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={paginatedRooms}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: filteredRooms.length,
          onChange: (page) => setPagination({ ...pagination, current: page }),
          showSizeChanger: false,
        }}
        scroll={{ x: true }}
      />

      {/* Add/Edit Room Modal */}
      <Modal
        title={currentRoom ? "Edit Room Number" : "Add New Room Number(s)"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={currentRoom ? "Update" : "Create"}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="hotelId"
            label="Hotel"
            rules={[{ required: true, message: "Please select a hotel" }]}
          >
            <Select
              placeholder="Select hotel"
              onChange={handleHotelChange}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {hotels.map((hotel) => (
                <Select.Option key={hotel.hotel} value={hotel.hotelId}>
                  {hotel.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="categoryId"
            label="Room Category"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select
              placeholder={
                categoriesLoading
                  ? "Loading categories..."
                  : categories.length
                  ? "Select category"
                  : "Select hotel first"
              }
              loading={categoriesLoading}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
              disabled={!categories.length || categoriesLoading}
            >
              {categories.map((category) => (
                <Select.Option
                  key={category.categoryName}
                  value={category.categoryName}
                >
                  {category.categoryName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {currentRoom ? (
            // Single room edit mode
            <>
              <Form.Item
                name="roomNumber"
                label="Room Number"
                rules={[
                  { required: true, message: "Please enter room number" },
                ]}
              >
                <Input placeholder="Enter room number" />
              </Form.Item>

              <Form.Item name="roomDetails" label="Room Details">
                <Input.TextArea
                  rows={3}
                  placeholder="Enter room details (optional)"
                />
              </Form.Item>
            </>
          ) : (
            // Multiple rooms add mode
            <>
              {multipleRooms.map((room, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <Row gutter={16} align="middle">
                    <Col span={20}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            label={index === 0 ? "Room Number" : ""}
                            required
                          >
                            <Input
                              placeholder="Enter room number"
                              value={room.roomNumber}
                              onChange={(e) =>
                                handleRoomFieldChange(
                                  index,
                                  "roomNumber",
                                  e.target.value
                                )
                              }
                            />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item label={index === 0 ? "Room Details" : ""}>
                            <Input
                              placeholder="Enter details (optional)"
                              value={room.roomDetails}
                              onChange={(e) =>
                                handleRoomFieldChange(
                                  index,
                                  "roomDetails",
                                  e.target.value
                                )
                              }
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Col>
                    <Col span={4} style={{ textAlign: "right" }}>
                      {index === 0 ? (
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={handleAddRoomField}
                          style={{ marginTop: index === 0 ? 30 : 0 }}
                        />
                      ) : (
                        <Button
                          danger
                          type="text"
                          icon={<CloseOutlined />}
                          onClick={() => handleRemoveRoomField(index)}
                          style={{ marginTop: index === 0 ? 30 : 0 }}
                        />
                      )}
                    </Col>
                  </Row>
                </div>
              ))}
            </>
          )}

          <Form.Item name="roomImage" label="Room Image URL">
            <Input placeholder="Enter image URL (optional)" />
          </Form.Item>

          {form.getFieldValue("roomImage") && (
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Image
                src={form.getFieldValue("roomImage")}
                alt="Room preview"
                style={{ maxWidth: "100%", maxHeight: 200 }}
                fallback="https://via.placeholder.com/200?text=Image+Not+Available"
              />
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default RoomNumbers;
