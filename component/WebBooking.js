"use client";

import { useState, useEffect } from "react";
import {
  Button,
  message,
  Popconfirm,
  Spin,
  Input,
  Tooltip,
  Select,
  Pagination,
  Alert,
} from "antd";

import dayjs from "dayjs";
import moment from "moment";
import { CopyToClipboard } from "react-copy-to-clipboard";
import coreAxios from "@/utils/axiosInstance";
import { CopyOutlined } from "@ant-design/icons";
import Link from "next/link"; // For routing

const WebBooking = () => {
  const [webBookingInfo, setWebBookingInfo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [searchText, setSearchText] = useState("");

  const fetchWebBookingInfo = async () => {
    try {
      const response = await coreAxios.get("user-bookings");
      if (response.status === 200) {
        setWebBookingInfo(response.data);
        setFilteredBookings(response.data);
      } else {
        // or handle appropriately
      }
    } catch (error) {
      message.error("Failed to fetch room categories.");
    }
  };

  useEffect(() => {
    fetchWebBookingInfo();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchText(value);
    const filteredData = bookings.filter(
      (r) =>
        r.bookingNo.toLowerCase().includes(value) ||
        r.bookedByID.toLowerCase().includes(value) ||
        r.fullName.toLowerCase().includes(value) ||
        r.roomCategoryName.toLowerCase().includes(value) ||
        r.roomNumberName.toLowerCase().includes(value) ||
        r.hotelName.toLowerCase().includes(value) ||
        r.phone.toLowerCase().includes(value)
    );
    setFilteredBookings(filteredData);
    setPagination({ ...pagination, current: 1 }); // Reset to page 1 after filtering
  };

  // Paginate the filtered data
  const paginatedBookings = filteredBookings.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  return (
    <div>
      {loading ? (
        <Spin tip="Loading...">
          <Alert
            message="Alert message title"
            description="Further details about the context of this alert."
            type="info"
          />
        </Spin>
      ) : (
        <div className="">
          <div className="flex justify-between">
            {/* Global Search Input */}
            <Input
              placeholder="Search bookings..."
              value={searchText}
              onChange={handleSearch}
              style={{ width: 300, marginBottom: 20 }}
            />
          </div>

          <div className="relative overflow-x-auto shadow-md">
            <div style={{ overflowX: "auto" }}>
              <table className="w-full text-xs text-left rtl:text-right  dark:text-gray-400">
                {/* Table Header */}
                <thead className="text-xs  uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="border border-tableBorder text-center p-2">
                      Booking No.
                    </th>

                    <th className="border border-tableBorder text-center p-2">
                      Guest Name
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Phone
                    </th>
                    {/* <th className="border border-tableBorder text-center p-2">
                      Hotel
                    </th> */}
                    <th className="border border-tableBorder text-center p-2">
                      Flat Type
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Flat No/Unit
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Booking Date
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Check In
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Check Out
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Nights
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Advance
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Total
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Status
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Confirm/Cancel By
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Updated By
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Actions
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {paginatedBookings?.map((booking, idx) => (
                    <tr
                      key={booking._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      style={{
                        backgroundColor:
                          booking.statusID === 255
                            ? "rgba(255, 99, 99, 0.5)"
                            : "",
                      }}>
                      {/* Booking No with Link and Copy Feature */}

                      <td className="border border-tableBorder text-center p-2">
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                          <Link
                            target="_blank"
                            href={`/dashboard/${booking.bookingNo}`}
                            passHref>
                            <p
                              style={{
                                color: "#1890ff",
                                cursor: "pointer",
                                marginRight: 8,
                              }}>
                              {booking.bookingNo}
                            </p>
                          </Link>
                          <Tooltip title="Click to copy">
                            <CopyToClipboard
                              text={booking.bookingNo}
                              onCopy={() => message.success("Copied!")}>
                              <CopyOutlined
                                style={{ cursor: "pointer", color: "#1890ff" }}
                              />
                            </CopyToClipboard>
                          </Tooltip>
                        </span>
                      </td>
                      {/* Booked By */}
                      {/* Guest Name */}
                      <td className="border border-tableBorder text-center p-2">
                        {booking.userName}
                      </td>
                      <td className="border border-tableBorder text-center p-2">
                        {booking.userPhone}
                      </td>
                      {/* Hotel Name */}
                      {/* <td className="border border-tableBorder text-center p-2">
                        {booking.hotelName}
                      </td> */}
                      {/* Flat Type */}
                      <td className="border border-tableBorder text-center p-2">
                        {booking.roomCategory}
                      </td>
                      {/* Flat No/Unit */}
                      <td className="border border-tableBorder text-center p-2">
                        {booking.roomName}
                      </td>
                      {/* Check In */}
                      <td className="border border-tableBorder text-center p-2">
                        {moment(booking.createTime).format("D MMM YYYY")}
                      </td>
                      {/* Check In */}
                      <td className="border border-tableBorder text-center p-2">
                        {moment(booking.checkInDate).format("D MMM YYYY")}
                      </td>
                      {/* Check Out */}
                      <td className="border border-tableBorder text-center p-2">
                        {moment(booking.checkOutDate).format("D MMM YYYY")}
                      </td>
                      {/* Nights */}
                      <td className="border border-tableBorder text-center p-2">
                        {booking.noOfNights}
                      </td>
                      <td className="border border-tableBorder text-center p-2">
                        {booking.advancePayment}
                      </td>
                      {/* Total Bill */}
                      <td className="border border-tableBorder text-center p-2 font-bold text-green-900">
                        {booking.totalBill}
                      </td>
                      {/* Booking Status */}
                      <td
                        className="border border-tableBorder text-center p-2 font-bold"
                        style={{
                          color: booking.statusID === 255 ? "red" : "green", // Inline style for text color
                        }}>
                        {booking.statusID === 255 ? (
                          <p>Canceled</p>
                        ) : (
                          "Confirmed"
                        )}
                      </td>
                      <td className="border border-tableBorder text-center p-2 font-bold text-green-900">
                        {booking?.statusID === 255
                          ? booking?.canceledBy
                          : booking?.createdBy}
                      </td>
                      <td className="border  border-tableBorder text-center   text-blue-900">
                        {booking?.updatedByID}{" "}
                        {booking?.updatedByID &&
                          dayjs(booking?.updatedAt).format(
                            "D MMM, YYYY (h:mm a)"
                          )}
                      </td>

                      {/* Actions */}
                      <td className="border border-tableBorder text-center p-2">
                        {booking?.statusID === 1 && (
                          <div className="flex">
                            <Button onClick={() => handleEdit(booking)}>
                              Edit
                            </Button>
                            <Popconfirm
                              title="Are you sure to delete this booking?"
                              onConfirm={() => handleDelete(booking)}>
                              <Button type="link" danger>
                                Cancel
                              </Button>
                            </Popconfirm>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination (commented out) */}

            <div className="flex justify-center p-2">
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={filteredBookings?.length}
                onChange={(page, pageSize) =>
                  setPagination({ current: page, pageSize })
                } // Update both current page and pageSize
                className="mt-4"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebBooking;
