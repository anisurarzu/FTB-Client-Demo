"use client";

import { useState, useEffect } from "react";
import {
  Button,
  message,
  Popconfirm,
  Input,
  Tooltip,
  Pagination,
  DatePicker,
  Skeleton,
  Modal,
  Select,
  Form,
} from "antd";
import { ReloadOutlined, CopyOutlined } from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Link from "next/link";
import dayjs from "dayjs";

const WebBooking = () => {
  const [webBookingInfo, setWebBookingInfo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [searchText, setSearchText] = useState("");
  const [filterDate, setFilterDate] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [form] = Form.useForm();

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

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    const filtered = webBookingInfo.filter((booking) =>
      [booking.bookingNo, booking.bookedByID, booking.fullName, booking.roomCategoryName, booking.roomNumberName, booking.hotelName, booking.phone]
        .some((field) => field?.toLowerCase().includes(value))
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

  const handleDelete = (booking) => {
    message.success(`Booking ${booking.bookingNo} cancelled.`);
  };

  const showStatusModal = (booking) => {
    setCurrentBooking(booking);
    form.setFieldsValue({
      status: booking.statusID === 1 ? 'pending' : 
             booking.statusID === 2 ? 'confirmed' : 
             booking.statusID === 255 ? 'cancel' : 'pending'
    });
    setIsModalVisible(true);
  };

  const handleStatusUpdate = async () => {
    try {
      const values = await form.validateFields();
      const { status, reason } = values;
      
      const payload = { status };
      if (status === 'cancel') {
        payload.canceledBy = 'admin'; // You might want to get this from auth context
        payload.reason = reason;
      }

      const response = await coreAxios.put(
        `/web/booking/status/${currentBooking._id}`,
        payload
      );

      if (response.status === 200) {
        message.success('Booking status updated successfully');
        fetchWebBookingInfo();
        setIsModalVisible(false);
      }
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to update booking status');
    }
  };

  const paginatedBookings = filteredBookings.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  const skeletonRows = Array(pagination.pageSize)
    .fill(0)
    .map((_, idx) => (
      <tr key={idx} style={{ background: "linear-gradient(to right, #e0f7fa, #e3f2fd)" }}>
        {Array(13)
          .fill(0)
          .map((_, colIdx) => (
            <td key={colIdx} style={{ padding: 8 }}>
              <Skeleton.Input active size="small" block />
            </td>
          ))}
      </tr>
    ));

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Input
          placeholder="Search bookings..."
          value={searchText}
          onChange={handleSearch}
          style={{ width: 200 }}
          allowClear
        />
        <DatePicker
          value={filterDate}
          onChange={handleDateFilter}
          format="YYYY-MM-DD"
          placeholder="Filter by date"
          allowClear
        />
        <Button icon={<ReloadOutlined />} onClick={fetchWebBookingInfo}>
          Refresh
        </Button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead style={{ backgroundColor: "#e3f2fd", color: "#333" }}>
            <tr>
              {[
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
              ].map((header) => (
                <th key={header} style={{ padding: 8, textAlign: "center" }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? skeletonRows
              : paginatedBookings.map((booking, i) => (
                  <tr
                    key={booking._id}
                    style={{
                      background: booking.statusID === 255 
                        ? '#fee2e2' 
                        : i % 2 === 0
                          ? "linear-gradient(to right, #f0fdf4, #e0f2f1)"
                          : "linear-gradient(to right, #e8f5e9, #f1f8e9)",
                    }}
                  >
                    <td style={{ padding: 8, textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4 }}>
                        <Link href={`/dashboard/${booking.bookingNo}`}>
                          <span style={{ color: "#1890ff", cursor: "pointer" }}>
                            {booking.bookingNo}
                          </span>
                        </Link>
                        <CopyToClipboard text={booking.bookingNo} onCopy={() => message.success("Copied!")}>
                          <CopyOutlined style={{ color: "#1890ff", cursor: "pointer" }} />
                        </CopyToClipboard>
                      </div>
                    </td>
                    <td style={{ padding: 8, textAlign: "center" }}>{booking.fullName}</td>
                    <td style={{ padding: 8, textAlign: "center" }}>{booking.phone}</td>
                    <td style={{ padding: 8, textAlign: "center" }}>{booking.roomCategoryName}</td>
                    <td style={{ padding: 8, textAlign: "center" }}>{booking.roomNumberName}</td>
                    <td style={{ padding: 8, textAlign: "center" }}>{dayjs(booking.createTime).format("MMM D")}</td>
                    <td style={{ padding: 8, textAlign: "center" }}>{dayjs(booking.checkInDate).format("MMM D")}</td>
                    <td style={{ padding: 8, textAlign: "center" }}>{dayjs(booking.checkOutDate).format("MMM D")}</td>
                    <td style={{ padding: 8, textAlign: "center" }}>{booking.nights}</td>
                    <td style={{ padding: 8, textAlign: "center" }}>{booking.advancePayment}</td>
                    <td style={{ padding: 8, textAlign: "center", fontWeight: "bold", color: "#0d9488" }}>
                      {booking.totalBill}
                    </td>
                    <td style={{ padding: 8, textAlign: "center" }}>
                      <span
                        style={{
                          padding: "2px 6px",
                          borderRadius: 12,
                          backgroundColor: booking.statusID === 255 
                            ? "#fee2e2" 
                            : booking.statusID === 2 
                              ? "#dcfce7" 
                              : "#fef9c3",
                          color: booking.statusID === 255 
                            ? "#b91c1c" 
                            : booking.statusID === 2 
                              ? "#15803d" 
                              : "#a16207",
                          fontSize: 11,
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
                      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                        <Button 
                          size="small" 
                          style={{ fontSize: 11 }}
                          onClick={() => showStatusModal(booking)}
                        >
                          Update Status
                        </Button>
                        {/* {booking.statusID === 1 && (
                          <Popconfirm
                            title="Cancel this booking?"
                            onConfirm={() => handleDelete(booking)}
                          >
                            <Button size="small" type="text" danger style={{ fontSize: 11 }}>
                              Cancel
                            </Button>
                          </Popconfirm>
                        )} */}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Status Update Modal */}
      <Modal
        title="Update Booking Status"
        visible={isModalVisible}
        onOk={handleStatusUpdate}
        onCancel={() => setIsModalVisible(false)}
        okText="Update"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="confirmed">Confirmed</Select.Option>
              <Select.Option value="cancel">Cancel</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
          >
            {({ getFieldValue }) => {
              return getFieldValue('status') === 'cancel' ? (
                <Form.Item
                  name="reason"
                  label="Reason for cancellation"
                  rules={[{ required: true, message: 'Please provide a reason' }]}
                >
                  <Input.TextArea rows={3} placeholder="Enter reason for cancellation" />
                </Form.Item>
              ) : null;
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* Pagination Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          marginTop: 12,
        }}
      >
        <div>
          Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{" "}
          {Math.min(pagination.current * pagination.pageSize, filteredBookings.length)} of{" "}
          {filteredBookings.length} entries
        </div>
        <Pagination
          size="small"
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={filteredBookings.length}
          onChange={(page) => setPagination({ ...pagination, current: page })}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
};

export default WebBooking;