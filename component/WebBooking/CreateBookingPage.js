"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Row,
  Col,
  Typography,
  message,
  Card,
  Space,
  Grid,
  Modal,
  Checkbox,
  Divider,
  Collapse,
} from "antd";
import { PlusOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;
const { Panel } = Collapse;

export const CreateBookingForm = ({
  onSuccess,
  onCancel,
  isModal = false,
  setIsCreateModalVisible,
}) => {
  const router = useRouter();
  const [form] = Form.useForm();
  const [hotels, setHotels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prevBookings, setPrevBookings] = useState([]);
  const [isKitchen, setIsKitchen] = useState(false);
  const [isExtraBed, setIsExtraBed] = useState(false);
  const screens = useBreakpoint();

  // Generate unique IDs for required fields
  const bookingID = uuidv4();
  const transactionId = uuidv4();

  const fetchHotels = async () => {
    try {
      const response = await coreAxios.get("/web-hotel-details");
      if (response.status === 200) {
        setHotels(response.data);
      }
    } catch (error) {
      message.error("Failed to fetch hotels.");
    }
  };

  const fetchCategories = async (hotelId) => {
    try {
      const response = await coreAxios.get(`/web-hotel-details/${hotelId}`);
      if (response.status === 200) {
        setCategories(response.data.categories || []);
        // Set hotel name when categories are fetched
        const selectedHotel = hotels.find((h) => h.hotelId === hotelId);
        if (selectedHotel) {
          form.setFieldsValue({
            hotelName: selectedHotel.name,
            hotelID: selectedHotel.hotelId,
          });
        }
      }
    } catch (error) {
      message.error("Failed to fetch categories.");
    }
  };

  const fetchRooms = async (hotelId, categoryId) => {
    try {
      const response = await coreAxios.get(
        `/room-numbers/hotel/${hotelId}/category/${categoryId}`
      );
      if (response.status === 200) {
        setRooms(response.data || []);
        // Set room category name when rooms are fetched
        const selectedCategory = categories.find(
          (c) => c.categoryName === categoryId
        );
        if (selectedCategory) {
          form.setFieldsValue({
            roomCategoryName: selectedCategory.categoryName,
          });
        }
      }
    } catch (error) {
      message.error("Failed to fetch rooms.");
    }
  };

  const fetchPrevBookingData = async (bookingNo) => {
    try {
      const response = await coreAxios.get(`/web/booking/${bookingNo}`);
      if (response.status === 200) {
        setPrevBookings((prev) => [...prev, response.data]);
      }
    } catch (error) {
      message.error("Failed to fetch previous booking data.");
    }
  };

  useEffect(() => {
    fetchHotels();
    // Set initial values for required fields
    form.setFieldsValue({
      bookingID,
      transactionId,
      bookedByID: "admin", // Assuming admin is making the booking
      statusID: 2, // Default to confirmed
    });
  }, []);

  const handleHotelChange = (hotelId) => {
    form.setFieldsValue({
      roomCategoryId: undefined,
      roomNumberId: undefined,
      roomCategoryName: undefined,
    });
    setCategories([]);
    setRooms([]);
    if (hotelId) {
      fetchCategories(hotelId);
    }
  };

  const handleCategoryChange = (categoryId) => {
    const hotelId = form.getFieldValue("hotelId");
    form.setFieldsValue({ roomNumberId: undefined });
    setRooms([]);
    if (categoryId && hotelId) {
      fetchRooms(hotelId, categoryId);
    }
  };

  const calculateTotalAmount = () => {
    const checkInDate = form.getFieldValue("checkInDate");
    const checkOutDate = form.getFieldValue("checkOutDate");
    const roomPrice = form.getFieldValue("roomPrice") || 0;
    const kitchenPrice = form.getFieldValue("kitchenPrice") || 0;
    const extraBedPrice = form.getFieldValue("extraBedPrice") || 0;
    const vat = form.getFieldValue("vat") || 0;
    const tax = form.getFieldValue("tax") || 0;

    if (checkInDate && checkOutDate) {
      const nights = dayjs(checkOutDate).diff(dayjs(checkInDate), "day");
      form.setFieldsValue({ nights });

      const baseAmount = nights * roomPrice;
      const additionalCharges = kitchenPrice + extraBedPrice;
      const totalBeforeTax = baseAmount + additionalCharges;
      const totalTax = (totalBeforeTax * (vat + tax)) / 100;
      const totalBill = totalBeforeTax + totalTax;

      form.setFieldsValue({
        totalBill,
        duePayment: totalBill - (form.getFieldValue("advancePayment") || 0),
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Calculate final amounts
      const nights = dayjs(values.checkOutDate).diff(
        dayjs(values.checkInDate),
        "day"
      );
      const baseAmount = nights * values.roomPrice;
      const additionalCharges =
        (values.kitchenPrice || 0) + (values.extraBedPrice || 0);
      const totalBeforeTax = baseAmount + additionalCharges;
      const totalTax =
        (totalBeforeTax * ((values.vat || 0) + (values.tax || 0))) / 100;
      const totalBill = totalBeforeTax + totalTax;

      const payload = {
        ...values,
        bookingID, // Include generated booking ID
        transactionId, // Include generated transaction ID
        bookedByID: "admin", // Hardcoded for now, replace with actual user ID
        nights,
        totalBill,
        statusID: 2, // Default to confirmed
        bookedBy: "admin",
        isKitchen,
        isExtraBed,
        duePayment: totalBill - (values.advancePayment || 0),
        // Include additional required fields
        roomCategoryName: values.roomCategoryId, // Using categoryId as name
        hotelID: values.hotelId,
        hotelName: hotels.find((h) => h.hotelId === values.hotelId)?.name || "",
        roomNumberName:
          rooms.find((h) => h._id === values.roomNumberId)?.roomNumber || "",
      };

      const response = await coreAxios.post("/web/booking", payload);

      if (response.status === 201) {
        message.success("Booking created successfully");
        setIsCreateModalVisible(false);
      }
    } catch (error) {
      message.error(error.response?.data?.error || "Failed to create booking");
      console.error("Booking error:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        adults: 1,
        children: 0,
        advancePayment: 0,
        vat: 0,
        tax: 0,
        bookingID,
        transactionId,
        bookedByID: "admin",
        statusID: 2,
      }}
      onValuesChange={calculateTotalAmount}
    >
      {/* Hidden required fields */}
      <Form.Item name="bookingID" hidden>
        <Input />
      </Form.Item>

      <Form.Item name="bookedByID" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="hotelID" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="hotelName" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="roomCategoryName" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="statusID" hidden>
        <Input />
      </Form.Item>

      {/* Previous Bookings Section */}
      <Collapse ghost>
        <Panel header="Previous Bookings" key="1">
          <Form.Item name="bookingNo" label="Search by Booking No">
            <Input.Search
              placeholder="Enter booking number"
              onSearch={fetchPrevBookingData}
              enterButton
            />
          </Form.Item>

          {prevBookings.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Text strong>Previous Bookings:</Text>
              {prevBookings.map((booking, index) => (
                <Card key={index} size="small" style={{ marginTop: 8 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Text>Booking No: {booking.bookingNo}</Text>
                    </Col>
                    <Col span={8}>
                      <Text>
                        Date: {dayjs(booking.createdAt).format("DD/MM/YYYY")}
                      </Text>
                    </Col>
                    <Col span={8}>
                      <Text>Amount: ৳{booking.totalBill}</Text>
                    </Col>
                  </Row>
                </Card>
              ))}
            </div>
          )}
        </Panel>
      </Collapse>

      {/* Booking Information Section */}
      <Divider orientation="left">Booking Information</Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="hotelId"
            label="Hotel"
            rules={[{ required: true, message: "Please select a hotel" }]}
          >
            <Select
              placeholder="Select hotel"
              onChange={handleHotelChange}
              options={hotels.map((hotel) => ({
                value: hotel.hotelId,
                label: hotel.name,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="roomCategoryId"
            label="Room Category"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select
              placeholder="Select category"
              onChange={handleCategoryChange}
              disabled={!form.getFieldValue("hotelId")}
              options={categories.map((category) => ({
                value: category.categoryName,
                label: category.categoryName,
              }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="roomNumberId"
            label="Room Number"
            rules={[{ required: true, message: "Please select a room" }]}
          >
            <Select
              placeholder="Select room"
              disabled={!form.getFieldValue("roomCategoryId")}
              options={rooms.map((room) => ({
                value: room._id,
                label: room.roomNumber,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="roomPrice"
            label="Room Price (per night)"
            rules={[{ required: true, message: "Please enter room price" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              formatter={(value) =>
                `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/৳\s?|(,*)/g, "")}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="checkInDate"
            label="Check In Date"
            rules={[{ required: true, message: "Please select check-in date" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(current) => {
                return current && current < dayjs().startOf("day");
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="checkOutDate"
            label="Check Out Date"
            rules={[
              { required: true, message: "Please select check-out date" },
            ]}
          >
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(current) => {
                const checkInDate = form.getFieldValue("checkInDate");
                return (
                  current && (!checkInDate || current <= dayjs(checkInDate))
                );
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item name="nights" label="Nights">
            <InputNumber style={{ width: "100%" }} disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="adults"
            label="Adults"
            rules={[
              {
                required: true,
                message: "Please enter number of adults",
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={1} max={10} />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="children" label="Children">
            <InputNumber style={{ width: "100%" }} min={0} max={10} />
          </Form.Item>
        </Col>
      </Row>

      {/* Additional Services */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item label="Additional Services">
            <Space>
              <Checkbox
                checked={isKitchen}
                onChange={(e) => {
                  setIsKitchen(e.target.checked);
                  if (!e.target.checked) {
                    form.setFieldsValue({ kitchenPrice: 0 });
                  }
                  calculateTotalAmount();
                }}
              >
                Include Kitchen
              </Checkbox>
              <Checkbox
                checked={isExtraBed}
                onChange={(e) => {
                  setIsExtraBed(e.target.checked);
                  if (!e.target.checked) {
                    form.setFieldsValue({ extraBedPrice: 0 });
                  }
                  calculateTotalAmount();
                }}
              >
                Extra Bed
              </Checkbox>
            </Space>
          </Form.Item>
        </Col>
        {isKitchen && (
          <Col xs={24} md={6}>
            <Form.Item
              name="kitchenPrice"
              label="Kitchen Price"
              rules={[
                { required: isKitchen, message: "Please enter kitchen price" },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                formatter={(value) =>
                  `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/৳\s?|(,*)/g, "")}
              />
            </Form.Item>
          </Col>
        )}
        {isExtraBed && (
          <Col xs={24} md={6}>
            <Form.Item
              name="extraBedPrice"
              label="Extra Bed Price"
              rules={[
                {
                  required: isExtraBed,
                  message: "Please enter extra bed price",
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                formatter={(value) =>
                  `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/৳\s?|(,*)/g, "")}
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      {/* Personal Information Section */}
      <Divider orientation="left">Personal Information</Divider>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="fullName"
            label="Guest Name"
            rules={[{ required: true, message: "Please enter guest name" }]}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item name="nidPassport" label="NID/Passport">
            <Input />
          </Form.Item>
        </Col>
      </Row>

      {/* Payment Information Section */}
      <Divider orientation="left">Payment Information</Divider>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item name="vat" label="VAT (%)">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              max={100}
              formatter={(value) => `${value}%`}
              parser={(value) => value.replace("%", "")}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="tax" label="Tax (%)">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              max={100}
              formatter={(value) => `${value}%`}
              parser={(value) => value.replace("%", "")}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="totalBill" label="Total Bill">
            <InputNumber
              style={{ width: "100%" }}
              disabled
              formatter={(value) =>
                `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Form.Item name="advancePayment" label="Advance Payment">
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              formatter={(value) =>
                `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/৳\s?|(,*)/g, "")}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item name="duePayment" label="Due Payment">
            <InputNumber
              style={{ width: "100%" }}
              disabled
              formatter={(value) =>
                `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[
              { required: true, message: "Please select payment method" },
            ]}
          >
            <Select
              placeholder="Select payment method"
              options={[
                { value: "cash", label: "Cash" },
                { value: "card", label: "Card" },
                { value: "mobile_banking", label: "Mobile Banking" },
                { value: "bank_transfer", label: "Bank Transfer" },
              ]}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item name="transactionId" label="Tnx ID">
        <Input.TextArea rows={1} />
      </Form.Item>
      <Form.Item name="note" label="Notes">
        <Input.TextArea rows={3} />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          icon={<PlusOutlined />}
        >
          Create Booking
        </Button>
        {isModal && (
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => {
              if (onCancel) {
                onCancel();
              }
            }}
          >
            Cancel
          </Button>
        )}
      </Form.Item>
    </Form>
  );
};

const CreateBookingPage = () => {
  const router = useRouter();
  const screens = useBreakpoint();

  return (
    <div style={{ padding: screens.xs ? 8 : 24 }}>
      <CreateBookingForm />
    </div>
  );
};

export default CreateBookingPage;
