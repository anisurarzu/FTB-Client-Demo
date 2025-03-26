"use client";

import { useState, useEffect } from "react";
import { Button, message, Spin, Alert, Tooltip, InputNumber } from "antd";
import dayjs from "dayjs";
import moment from "moment";
import { CopyToClipboard } from "react-copy-to-clipboard";
import coreAxios from "@/utils/axiosInstance";
import { CopyOutlined } from "@ant-design/icons";
import Link from "next/link";
import DatePicker from "antd/es/date-picker";
import { useFormik } from "formik";

const DailyStatement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [submitting, setSubmitting] = useState({});

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  // Formik form for all editable fields
  const formik = useFormik({
    initialValues: {},
    onSubmit: async (values, { resetForm }) => {
      // Not used directly
    },
  });

  const fetchBookingsByDate = async (date) => {
    setLoading(true);
    try {
      const formattedDate = date.format("YYYY-MM-DD");
      const response = await coreAxios.get(
        `/bookings/check-in/${formattedDate}`
      );

      if (response.status === 200) {
        setBookings(response.data);
        // Initialize form values with 0 as default
        const initialValues = {};
        response.data.forEach((booking) => {
          initialValues[booking._id] = {
            totalPaid: 0,
            dailyAmount: 0,
          };
        });
        formik.setValues(initialValues);
      }
    } catch (error) {
      message.error("Failed to fetch bookings for the selected date.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (bookingId) => {
    setSubmitting((prev) => ({ ...prev, [bookingId]: true }));
    try {
      const response = await coreAxios.put(`/bookings/${bookingId}`, {
        totalPaid: formik.values[bookingId]?.totalPaid || 0,
        dailyAmount: formik.values[bookingId]?.dailyAmount || 0,
      });

      if (response.status === 200) {
        message.success("Booking updated successfully");
        setBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? response.data : b))
        );
      }
    } catch (error) {
      message.error("Failed to update booking");
    } finally {
      setSubmitting((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  useEffect(() => {
    fetchBookingsByDate(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handlePreviousDay = () => {
    const newDate = selectedDate.subtract(1, "day");
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = selectedDate.add(1, "day");
    setSelectedDate(newDate);
  };

  return (
    <div>
      <div
        className="flex justify-between items-center "
        style={{ marginBottom: "10px" }}>
        <h2 className="text-lg font-semibold uppercase">Daily Statement</h2>
        <div className="flex items-center gap-4">
          <Button
            type="primary"
            onClick={handlePreviousDay}
            style={{ backgroundColor: "#4CAF50", borderColor: "#4CAF50" }}>
            Previous Day
          </Button>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            format="YYYY-MM-DD"
            allowClear={false}
            style={{ width: "150px" }}
          />
          <Button
            type="primary"
            onClick={handleNextDay}
            style={{ backgroundColor: "#4CAF50", borderColor: "#4CAF50" }}>
            Next Day
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto shadow-md">
        <div className="min-w-[1200px]">
          <table className="w-full text-xs">
            <thead
              className="text-xs uppercase"
              style={{ backgroundColor: "#4CAF50", color: "white" }}>
              <tr>
                <th className="border border-green-600 text-center p-2">
                  Sl No.
                </th>
                <th className="border border-green-600 text-center p-2">
                  Flat No.
                </th>
                <th className="border border-green-600 text-center p-2">
                  Invoice No.
                </th>
                <th className="border border-green-600 text-center p-2">
                  Guest Name
                </th>
                <th className="border border-green-600 text-center p-2">
                  Phone No.
                </th>
                <th className="border border-green-600 text-center p-2">
                  Check In
                </th>
                <th className="border border-green-600 text-center p-2">
                  Check Out
                </th>
                <th className="border border-green-600 text-center p-2">
                  Nights
                </th>
                <th className="border border-green-600 text-center p-2">
                  Total Bill
                </th>
                <th className="border border-green-600 text-center p-2">
                  Bkash
                </th>
                <th className="border border-green-600 text-center p-2">
                  Bank
                </th>
                <th className="border border-green-600 text-center p-2">
                  Total Paid
                </th>
                <th className="border border-green-600 text-center p-2">
                  Daily Amount
                </th>
                <th className="border border-green-600 text-center p-2">
                  Due Amount
                </th>
                <th className="border border-green-600 text-center p-2">
                  Update
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="15" className="text-center p-4">
                    <Spin tip="Loading data..." />
                  </td>
                </tr>
              ) : (
                bookings.map((booking, index) => (
                  <tr
                    key={booking._id}
                    className="hover:bg-gray-50"
                    style={{
                      backgroundColor:
                        booking.statusID === 255
                          ? "rgba(255, 99, 99, 0.5)"
                          : "",
                    }}>
                    <td className="border border-green-600 text-center p-2">
                      {index + 1}
                    </td>
                    <td className="border border-green-600 text-center p-2">
                      {booking.roomNumberName || "-"}
                    </td>
                    <td className="border border-green-600 text-center p-2">
                      <div className="flex items-center justify-center">
                        <Link href={`/dashboard/${booking.bookingNo}`} passHref>
                          <span className="text-blue-500 cursor-pointer mr-2">
                            {booking.bookingNo}
                          </span>
                        </Link>
                        <Tooltip title="Copy">
                          <CopyToClipboard
                            text={booking.bookingNo}
                            onCopy={() => message.success("Copied!")}>
                            <CopyOutlined className="cursor-pointer text-blue-500" />
                          </CopyToClipboard>
                        </Tooltip>
                      </div>
                    </td>
                    <td className="border border-green-600 text-center p-2">
                      {booking.fullName}
                    </td>
                    <td className="border border-green-600 text-center p-2">
                      {booking.phone}
                    </td>
                    <td className="border border-green-600 text-center p-2">
                      {moment(booking.checkInDate).format("D MMM YYYY")}
                    </td>
                    <td className="border border-green-600 text-center p-2">
                      {moment(booking.checkOutDate).format("D MMM YYYY")}
                    </td>
                    <td className="border border-green-600 text-center p-2">
                      {booking.nights}
                    </td>
                    <td className="border border-green-600 text-center p-2 font-bold text-green-900">
                      {booking.totalBill}
                    </td>
                    <td className="border border-green-600 text-center p-2">
                      {booking.paymentMethod === "bkash"
                        ? booking.advancePayment
                        : "-"}
                    </td>
                    <td className="border border-green-600 text-center p-2">
                      {booking.paymentMethod === "bank"
                        ? booking.advancePayment
                        : "-"}
                    </td>

                    {/* Editable Total Paid */}
                    <td className="border border-green-600 text-center p-2">
                      <InputNumber
                        min={0}
                        value={formik.values[booking._id]?.totalPaid || 0}
                        onChange={(value) =>
                          formik.setFieldValue(
                            `${booking._id}.totalPaid`,
                            value
                          )
                        }
                        style={{ width: "80px" }}
                      />
                    </td>

                    {/* Editable Daily Amount */}
                    <td className="border border-green-600 text-center p-2">
                      <InputNumber
                        min={0}
                        value={formik.values[booking._id]?.dailyAmount || 0}
                        onChange={(value) =>
                          formik.setFieldValue(
                            `${booking._id}.dailyAmount`,
                            value
                          )
                        }
                        style={{ width: "80px" }}
                      />
                    </td>

                    {/* Due Amount (from dataset, not calculated) */}
                    <td className="border border-green-600 text-center p-2">
                      {booking.dueAmount || 0}
                    </td>

                    {/* Update Button */}
                    <td className="border border-green-600 text-center p-2">
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleUpdate(booking._id)}
                        loading={submitting[booking._id]}
                        style={{
                          backgroundColor: "#4CAF50",
                          borderColor: "#4CAF50",
                        }}>
                        Update
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyStatement;
