"use client";

import { useState, useEffect } from "react";
import {
  Button,
  message,
  Input,
  Pagination,
  DatePicker,
  Skeleton,
  Modal,
  Select,
  Form,
  Descriptions,
  Divider,
  Tag,
  Image,
  Grid,
  Card,
  Space,
  Typography,
} from "antd";
import {
  ReloadOutlined,
  CopyOutlined,
  EyeOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Link from "next/link";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import CreateBookingPage from "./CreateBookingPage";

const { useBreakpoint } = Grid;
const { Text } = Typography;

const WebBookingDashboard = () => {
  const router = useRouter();
  const [webBookingInfo, setWebBookingInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState(null);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const fetchWebBookingInfo = async () => {
    setLoading(true);
    try {
      const response = await coreAxios.get("/web/bookings");
      if (response.status === 200) {
        setWebBookingInfo(response.data);
        setFilteredBookings(response.data);
      }
    } catch (error) {
      message.error("Failed to fetch bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebBookingInfo();
  }, []);

  const handleDeleteBooking = async (bookingId) => {
    try {
      const response = await coreAxios.delete(`/web/booking/${bookingId}`);
      if (response.status === 200) {
        message.success("Booking deleted successfully");
        fetchWebBookingInfo();
      }
    } catch (error) {
      message.error(
        error.response?.data?.error || "Failed to delete booking"
      );
    }
  };

  const showDeleteModal = (booking) => {
    setBookingToDelete(booking);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (bookingToDelete) {
      handleDeleteBooking(bookingToDelete._id);
      setIsDeleteModalVisible(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    const filtered = webBookingInfo.filter((booking) =>
      [
        booking.bookingNo,
        booking.bookedByID,
        booking.fullName,
        booking.roomCategoryName,
        booking.roomNumberName,
        booking.hotelName,
        booking.phone,
      ].some((field) => field?.toLowerCase().includes(value))
    );
    setFilteredBookings(filtered);
    setPagination({ ...pagination, current: 1 });
  };

  const handleDateFilter = (date) => {
    setFilterDate(date);
    if (!date) {
      setFilteredBookings(webBookingInfo);
      return;
    }
    const filtered = webBookingInfo.filter((booking) =>
      dayjs(booking.createdAt).isSame(date, "day")
    );
    setFilteredBookings(filtered);
    setPagination({ ...pagination, current: 1 });
  };

  const showStatusModal = (booking) => {
    setCurrentBooking(booking);
    form.setFieldsValue({
      status:
        booking.statusID === 1
          ? "pending"
          : booking.statusID === 2
          ? "confirmed"
          : booking.statusID === 255
          ? "cancel"
          : "pending",
    });
    setIsStatusModalVisible(true);
  };

  const showDetailsModal = (booking) => {
    setCurrentBooking(booking);
    setIsDetailsModalVisible(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalVisible(false);
    fetchWebBookingInfo();
  };

  const handleStatusUpdate = async () => {
    try {
      const values = await form.validateFields();
      const { status, reason } = values;

      const payload = { status };
      if (status === "cancel") {
        payload.canceledBy = "admin";
        payload.reason = reason;
      }

      const response = await coreAxios.put(
        `/web/booking/status/${currentBooking._id}`,
        payload
      );

      if (response.status === 200) {
        message.success("Booking status updated successfully");
        fetchWebBookingInfo();
        setIsStatusModalVisible(false);
      }
    } catch (error) {
      message.error(
        error.response?.data?.error || "Failed to update booking status"
      );
    }
  };

  const paginatedBookings = filteredBookings.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  const getStatusTag = (statusID) => {
    switch (statusID) {
      case 1:
        return <Tag color="orange">Pending</Tag>;
      case 2:
        return <Tag color="green">Confirmed</Tag>;
      case 255:
        return <Tag color="red">Canceled</Tag>;
      default:
        return <Tag color="blue">Unknown</Tag>;
    }
  };

  const getStatusColor = (statusID) => {
    switch (statusID) {
      case 1:
        return { bg: "#fef9c3", text: "#a16207" };
      case 2:
        return { bg: "#dcfce7", text: "#15803d" };
      case 255:
        return { bg: "#fee2e2", text: "#b91c1c" };
      default:
        return { bg: "#e0f2fe", text: "#0369a1" };
    }
  };

  // Responsive table columns
  const tableColumns = screens.md
    ? [
        "Booking No.",
        "Guest",
        "Phone",
        "Type",
        "Unit",
        "Booked",
        "Check In",
        "Check Out",
        "Nights",
        "Adv.",
        "Total",
        "Status",
        "Actions",
      ]
    : ["Booking", "Guest", "Type", "Check In", "Status", "Actions"];

  return (
    <div style={{ padding: screens.xs ? 8 : 20 }}>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
        }}
      >
        <Input
          placeholder="Search bookings..."
          value={searchText}
          onChange={handleSearch}
          style={{ width: screens.xs ? "100%" : 200 }}
          allowClear
        />
        <DatePicker
          value={filterDate}
          onChange={handleDateFilter}
          format="YYYY-MM-DD"
          placeholder="Filter by date"
          allowClear
          style={{ width: screens.xs ? "100%" : 200 }}
        />
        <Button
          icon={!screens.xs && <ReloadOutlined />}
          onClick={fetchWebBookingInfo}
          style={screens.xs ? { width: "100%" } : {}}
        >
          {screens.xs ? "Refresh" : screens.sm ? "Refresh" : <ReloadOutlined />}
        </Button>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalVisible(true)}
          style={screens.xs ? { width: "100%" } : {}}
        >
          {screens.xs ? (
            "New Booking"
          ) : screens.sm ? (
            "New Booking"
          ) : (
            <PlusOutlined />
          )}
        </Button>
      </div>

      {screens.md ? (
        // Desktop table view
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
          >
            <thead style={{ backgroundColor: "#e3f2fd", color: "#333" }}>
              <tr>
                {tableColumns.map((header) => (
                  <th key={header} style={{ padding: 8, textAlign: "center" }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(pagination.pageSize)
                    .fill(0)
                    .map((_, idx) => (
                      <tr
                        key={idx}
                        style={{
                          background:
                            "linear-gradient(to right, #e0f7fa, #e3f2fd)",
                        }}
                      >
                        {tableColumns.map((_, colIdx) => (
                          <td key={colIdx} style={{ padding: 8 }}>
                            <Skeleton.Input active size="small" block />
                          </td>
                        ))}
                      </tr>
                    ))
                : paginatedBookings.map((booking, i) => (
                    <tr
                      key={booking._id}
                      style={{
                        background:
                          booking.statusID === 255
                            ? "#fee2e2"
                            : i % 2 === 0
                            ? "linear-gradient(to right, #f0fdf4, #e0f2f1)"
                            : "linear-gradient(to right, #e8f5e9, #f1f8e9)",
                      }}
                    >
                      <td style={{ padding: 8, textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Link
                            target="_blank"
                            href={`/dashboard/${booking.bookingNo}`}
                            passHref
                          >
                            <p
                              style={{
                                color: "#1890ff",
                                cursor: "pointer",
                                marginRight: 8,
                              }}
                            >
                              {booking.bookingNo}
                            </p>
                          </Link>
                          <CopyToClipboard
                            text={booking.bookingNo}
                            onCopy={() => message.success("Copied!")}
                          >
                            <CopyOutlined
                              style={{ color: "#1890ff", cursor: "pointer" }}
                            />
                          </CopyToClipboard>
                        </div>
                      </td>
                      <td style={{ padding: 8, textAlign: "center" }}>
                        {booking.fullName}
                      </td>
                      {screens.md && (
                        <td style={{ padding: 8, textAlign: "center" }}>
                          {booking.phone}
                        </td>
                      )}
                      <td style={{ padding: 8, textAlign: "center" }}>
                        {booking.roomCategoryName}
                      </td>
                      {screens.md && (
                        <td style={{ padding: 8, textAlign: "center" }}>
                          {booking.roomNumberName}
                        </td>
                      )}
                      {screens.md && (
                        <td style={{ padding: 8, textAlign: "center" }}>
                          {dayjs(booking.createdAt).format("MMM D")}
                        </td>
                      )}
                      <td style={{ padding: 8, textAlign: "center" }}>
                        {dayjs(booking.checkInDate).format("MMM D")}
                      </td>
                      {screens.md && (
                        <td style={{ padding: 8, textAlign: "center" }}>
                          {dayjs(booking.checkOutDate).format("MMM D")}
                        </td>
                      )}
                      {screens.md && (
                        <td style={{ padding: 8, textAlign: "center" }}>
                          {booking.nights}
                        </td>
                      )}
                      {screens.md && (
                        <td style={{ padding: 8, textAlign: "center" }}>
                          {booking.advancePayment}
                        </td>
                      )}
                      {screens.md && (
                        <td
                          style={{
                            padding: 8,
                            textAlign: "center",
                            fontWeight: "bold",
                            color: "#0d9488",
                          }}
                        >
                          {booking.totalBill}
                        </td>
                      )}
                      <td style={{ padding: 8, textAlign: "center" }}>
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: 12,
                            fontSize: 11,
                            ...getStatusColor(booking.statusID),
                          }}
                        >
                          {booking.statusID === 255
                            ? "Canceled"
                            : booking.statusID === 2
                            ? "Confirmed"
                            : "Pending"}
                        </span>
                      </td>
                      <td style={{ padding: 8, textAlign: "center" }}>
                        <Space size="small">
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => showDetailsModal(booking)}
                          />
                          <Button
                            size="small"
                            onClick={() => showStatusModal(booking)}
                          >
                            Status
                          </Button>
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => showDeleteModal(booking)}
                          >
                            {screens.md ? "Delete" : ""}
                          </Button>
                        </Space>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Mobile card view
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading
            ? Array(pagination.pageSize)
                .fill(0)
                .map((_, idx) => (
                  <Card key={idx} style={{ width: "100%" }}>
                    <Skeleton active />
                  </Card>
                ))
            : paginatedBookings.map((booking) => (
                <Card
                  key={booking._id}
                  title={
                    <Space direction="vertical" size={0}>
                      <Text strong>{booking.bookingNo}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {booking.fullName}
                      </Text>
                    </Space>
                  }
                  extra={getStatusTag(booking.statusID)}
                  style={{
                    backgroundColor:
                      booking.statusID === 255 ? "#fee2e2" : "#fff",
                  }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <div>
                      <Text strong>Room: </Text>
                      <Text>{booking.roomCategoryName}</Text>
                    </div>
                    <div>
                      <Text strong>Check In: </Text>
                      <Text>
                        {dayjs(booking.checkInDate).format("MMM D, YYYY")}
                      </Text>
                    </div>
                    <div>
                      <Text strong>Total: </Text>
                      <Text strong style={{ color: "#0d9488" }}>
                        {booking.totalBill}
                      </Text>
                    </div>
                    <Divider style={{ margin: "12px 0" }} />
                    <Space>
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => showDetailsModal(booking)}
                      />
                      <Button
                        size="small"
                        onClick={() => showStatusModal(booking)}
                      >
                        Status
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => showDeleteModal(booking)}
                      >
                        Delete
                      </Button>
                    </Space>
                  </Space>
                </Card>
              ))}
        </div>
      )}

      {/* Status Update Modal */}
      <Modal
        title="Update Booking Status"
        open={isStatusModalVisible}
        onOk={handleStatusUpdate}
        onCancel={() => setIsStatusModalVisible(false)}
        okText="Update"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select a status" }]}
          >
            <Select>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="confirmed">Confirmed</Select.Option>
              <Select.Option value="cancel">Cancel</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.status !== currentValues.status
            }
          >
            {({ getFieldValue }) => {
              return getFieldValue("status") === "cancel" ? (
                <Form.Item
                  name="reason"
                  label="Reason for cancellation"
                  rules={[
                    { required: true, message: "Please provide a reason" },
                  ]}
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Enter reason for cancellation"
                  />
                </Form.Item>
              ) : null;
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Booking Details Modal */}
      <Modal
        title="Booking Details"
        open={isDetailsModalVisible}
        onCancel={() => setIsDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailsModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={screens.xs ? "100%" : 800}
        style={{ maxWidth: "100%", top: screens.xs ? 0 : 20 }}
      >
        {currentBooking && (
          <>
            <Descriptions bordered column={screens.xs ? 1 : 2} size="small">
              <Descriptions.Item label="Booking No.">
                {currentBooking.bookingNo}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(currentBooking.statusID)}
              </Descriptions.Item>
              <Descriptions.Item label="Guest Name">
                {currentBooking.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {currentBooking.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {currentBooking.email || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="NID/Passport">
                {currentBooking.nidPassport || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Hotel">
                {currentBooking.hotelName}
              </Descriptions.Item>
              <Descriptions.Item label="Room Type">
                {currentBooking.roomCategoryName}
              </Descriptions.Item>
              <Descriptions.Item label="Room Number">
                {currentBooking.roomNumberName || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Check In">
                {dayjs(currentBooking.checkInDate).format("MMMM D, YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Check Out">
                {dayjs(currentBooking.checkOutDate).format("MMMM D, YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Nights">
                {currentBooking.nights}
              </Descriptions.Item>
              <Descriptions.Item label="Adults">
                {currentBooking.adults}
              </Descriptions.Item>
              <Descriptions.Item label="Children">
                {currentBooking.children}
              </Descriptions.Item>
              <Descriptions.Item label="Room Price">
                {currentBooking.roomPrice}
              </Descriptions.Item>
              <Descriptions.Item label="Total Bill">
                {currentBooking.totalBill}
              </Descriptions.Item>
              <Descriptions.Item label="Advance Paid">
                {currentBooking.advancePayment}
              </Descriptions.Item>
              <Descriptions.Item label="Due Payment">
                {currentBooking.duePayment}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">
                {currentBooking.paymentMethod}
              </Descriptions.Item>
              <Descriptions.Item label="Transaction ID">
                {currentBooking.transactionId || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Booked By">
                {currentBooking.bookedBy}
              </Descriptions.Item>
              <Descriptions.Item label="Booking Date">
                {dayjs(currentBooking.createdAt).format("MMMM D, YYYY h:mm A")}
              </Descriptions.Item>
              <Descriptions.Item label="Notes" span={screens.xs ? 1 : 2}>
                {currentBooking.note || "N/A"}
              </Descriptions.Item>
            </Descriptions>

            {currentBooking.paymentScreenshot && (
              <>
                <Divider orientation="left">Payment Screenshot</Divider>
                <div style={{ textAlign: "center" }}>
                  <Image
                    src={currentBooking.paymentScreenshot}
                    alt="Payment Screenshot"
                    style={{ maxWidth: "100%", maxHeight: 300 }}
                    preview={{
                      mask: <EyeOutlined style={{ color: "#fff" }} />,
                    }}
                  />
                </div>
              </>
            )}
          </>
        )}
      </Modal>

      {/* Create Booking Modal */}
      <Modal
        title="Create New Booking"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        footer={null}
        width={screens.xs ? "100%" : 800}
        style={{ maxWidth: "100%", top: screens.xs ? 0 : 20 }}
      >
        <CreateBookingPage
          isModal={true}
          onSuccess={handleCreateSuccess}
          setIsCreateModalVisible={setIsCreateModalVisible}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        open={isDeleteModalVisible}
        onOk={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete booking {bookingToDelete?.bookingNo}?</p>
        <p>This action cannot be undone.</p>
      </Modal>

      {/* Pagination Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: screens.xs ? "center" : "space-between",
          alignItems: "center",
          fontSize: 12,
          marginTop: 12,
          flexDirection: screens.xs ? "column" : "row",
          gap: screens.xs ? 8 : 0,
        }}
      >
        {!screens.xs && (
          <div>
            Showing {(pagination.current - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(
              pagination.current * pagination.pageSize,
              filteredBookings.length
            )}{" "}
            of {filteredBookings.length} entries
          </div>
        )}
        <Pagination
          size="small"
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={filteredBookings.length}
          onChange={(page) => setPagination({ ...pagination, current: page })}
          showSizeChanger={false}
          showTotal={screens.xs ? (total) => `Total ${total} items` : undefined}
        />
      </div>
    </div>
  );
};

export default WebBookingDashboard;