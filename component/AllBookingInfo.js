"use client";
import React, { useState, useEffect } from "react";
import { Select, DatePicker, Button, Spin, Alert, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import coreAxios from "@/utils/axiosInstance";

const { RangePicker } = DatePicker;
const { Option } = Select;

const AllBookingInfo = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedHotelName, setSelectedHotelName] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHotelInformation();
    fetchUsers();
  }, []);

  const fetchHotelInformation = async () => {
    try {
      setLoading(true);

      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const userRole = userInfo?.role?.value;
      const userHotelID = userInfo?.hotelID;

      const res = await coreAxios.get(`hotel`);
      setLoading(false);

      if (res?.status === 200) {
        let hotelData = res?.data;

        if (userRole === "hoteladmin" && userHotelID) {
          hotelData = hotelData.filter(
            (hotel) => hotel.hotelID === userHotelID
          );
        }

        setHotels(hotelData);
      }
    } catch (error) {
      setLoading(false);
      console.error("Failed to fetch hotel data", error);
      message.error("Failed to load hotels. Please try again.");
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await coreAxios.get("auth/users");
      if (response.status === 200) {
        setUsers(response.data?.users);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
      message.error("Failed to load users. Please try again.");
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const userLoginID = selectedUser; // Use selected user for login ID

      // Fetch bookings from API
      const response = await coreAxios.get("bookings");

      if (response.status === 200) {
        const filtered = response.data.filter((data) => data.statusID !== 255); // Filter out statusID 255

        const [startDate, endDate] = dates.map((date) =>
          dayjs(date).format("YYYY-MM-DD")
        );

        // Apply filters based on the provided criteria
        const filteredByCriteria = filtered.filter((booking) => {
          const matchHotel = selectedHotel
            ? booking.hotelID === selectedHotel
            : true;
          const matchUser = selectedUser
            ? booking.bookedByID === selectedUser
            : true;
          const matchLoginID = userLoginID
            ? booking.bookedByID === userLoginID
            : true;
          const matchDate =
            dates.length > 0
              ? dayjs(booking.checkInDate).isBetween(
                  startDate,
                  endDate,
                  "day",
                  "[]"
                )
              : true;

          return matchHotel && matchUser && matchLoginID && matchDate;
        });

        // Sort the bookings by checkInDate (sequential order)
        const sortedBookings = filteredByCriteria.sort((a, b) =>
          dayjs(a.checkInDate).isBefore(dayjs(b.checkInDate)) ? -1 : 1
        );

        setFilteredBookings(sortedBookings);
      }
    } catch (error) {
      message.error("Failed to fetch bookings.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!filteredBookings.length) {
      message.error("No data to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredBookings);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
    XLSX.writeFile(workbook, `Bookings_${dayjs().format("YYYYMMDD")}.xlsx`);
  };

  const exportToPDF = () => {
    if (!filteredBookings.length) {
      message.error("No data to export.");
      return;
    }

    const doc = new jsPDF();

    // Prepare header data
    const startDate =
      dates.length > 0 ? dayjs(dates[0]).format("DD MMM YYYY") : "N/A";
    const endDate =
      dates.length > 1 ? dayjs(dates[1]).format("DD MMM YYYY") : "N/A";
    const userName = selectedUser
      ? users.find((user) => user.loginID === selectedUser)?.username || "N/A"
      : "All Users";
    const hotelName = selectedHotelName || "All Hotels";

    // Header Section
    doc.setFontSize(14); // Reduced font size
    doc.setFont("helvetica", "bold");
    doc.text("Booking Information", 14, 15);

    doc.setFontSize(10); // Reduced font size
    doc.setFont("helvetica", "normal");
    doc.text(`Hotel: ${hotelName}`, 14, 22);
    doc.text(`User: ${userName}`, 14, 27);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 32);

    // Add line break
    doc.setLineWidth(0.3);
    doc.line(14, 35, 196, 35);

    // Table Columns
    const columns = [
      "Booking No",
      "Full Name",
      "Check-In",
      "Check-Out",
      "No Of Nights",
      "Room",
      "Method",
      "TrxID",
      "Total Bill",
      /* "Advance",
      "Due", */
    ];

    // Table Rows
    const rows = filteredBookings.map((booking) => [
      booking.bookingNo,
      booking.fullName,
      dayjs(booking.checkInDate).format("DD MMM YYYY"),
      dayjs(booking.checkOutDate).format("DD MMM YYYY"),
      booking.nights,
      `${booking.roomCategoryName} (${booking.roomNumberName})`,

      booking.paymentMethod,
      booking.transactionId,
      booking.totalBill.toFixed(2),
      /*  booking.advancePayment.toFixed(2),
      booking.duePayment.toFixed(2), */
    ]);

    // Auto table (add the table data below the header)
    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 38,
      theme: "grid", // Modern grid theme
      headStyles: {
        fillColor: [22, 160, 133], // Header background color
        textColor: [255, 255, 255], // Header text color
        fontSize: 9, // Reduced header font size
      },
      bodyStyles: {
        fontSize: 8, // Reduced body font size
        halign: "center", // Center align text
      },
      alternateRowStyles: { fillColor: [240, 240, 240] }, // Row striping
      margin: { top: 10, bottom: 10 }, // Reduced row height
    });

    // Totals Row
    const totals = {
      totalBill: filteredBookings
        .reduce((acc, b) => acc + b.totalBill, 0)
        .toFixed(2),
      advancePayment: filteredBookings
        .reduce((acc, b) => acc + b.advancePayment, 0)
        .toFixed(2),
      duePayment: filteredBookings
        .reduce((acc, b) => acc + b.duePayment, 0)
        .toFixed(2),
    };

    // Add Totals Section
    doc.setFontSize(9); // Reduced font size
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40);
    const finalY = doc.lastAutoTable.finalY + 7;

    doc.text(`Summary`, 14, finalY);
    doc.autoTable({
      body: [
        [
          "",
          "",
          "",
          "",
          "",
          "Totals:",
          `Total Bill: ${totals.totalBill}`,
          `Advance Payment: ${totals.advancePayment}`,
          `Due Payment: ${totals.duePayment}`,
        ],
      ],
      startY: finalY + 4,
      styles: { fillColor: [240, 240, 240], fontSize: 8, halign: "center" }, // Adjusted font size
      columnStyles: { 5: { fontStyle: "bold" } },
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8); // Reduced font size
    const timestamp = dayjs().format("DD MMM YYYY HH:mm:ss");
    doc.text(`Generated on: ${timestamp}`, 14, pageHeight - 10);
    doc.text(`Page 1 of 1`, 190, pageHeight - 10, { align: "right" });

    // Save the file
    const fileName =
      `${hotelName}_${userName}_${startDate}_to_${endDate}_Bookings.pdf`.replace(
        /\s+/g,
        "_"
      );
    doc.save(fileName);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h3
        style={{
          color: "#38a169",
          fontWeight: "bold",
          textAlign: "center",
          fontSize: "24px",
          marginBottom: "20px",
        }}>
        Booking Information
      </h3>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <Select
          placeholder="Select Hotel"
          style={{ width: "25%" }}
          value={selectedHotel}
          onChange={(value) => {
            setSelectedHotel(value);

            // Find the selected hotel name
            const selectedHotelObj = hotels.find(
              (hotel) => hotel.hotelID === value
            );
            setSelectedHotelName(
              selectedHotelObj ? selectedHotelObj.hotelName : ""
            );
          }}>
          {hotels.map((hotel) => (
            <Option key={hotel.hotelID} value={hotel.hotelID}>
              {hotel.hotelName}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Select User"
          style={{ width: "25%" }}
          value={selectedUser}
          onChange={(value) => setSelectedUser(value)}>
          {users.map((user) => (
            <Option key={user.id} value={user.loginID}>
              {user.loginID}
            </Option>
          ))}
        </Select>

        <RangePicker
          value={dates}
          onChange={(dates) => setDates(dates || [])}
          style={{ width: "40%" }}
        />

        <Button type="primary" onClick={fetchBookings}>
          Apply Filters
        </Button>

        <Button
          icon={<DownloadOutlined />}
          onClick={exportToExcel}
          disabled={!filteredBookings.length}>
          Export to Excel
        </Button>

        <Button
          icon={<DownloadOutlined />}
          onClick={exportToPDF}
          disabled={!filteredBookings.length}>
          Export to PDF
        </Button>
      </div>

      {loading ? (
        <Spin style={{ marginTop: "20px" }} tip="Loading, please wait...">
          <Alert
            message="Fetching booking data"
            description="This may take a moment, thank you for your patience."
            type="info"
          />
        </Spin>
      ) : (
        <table border="1" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid black", textAlign: "center" }}>
                Booking No
              </th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>
                Full Name
              </th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>
                Check-In
              </th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>
                Check-Out
              </th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>
                Room
              </th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>
                No. Of Nights
              </th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>
                Method
              </th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>
                TrxID
              </th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>
                Total Bill
              </th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>
                Advance
              </th>
              <th style={{ border: "1px solid black", textAlign: "center" }}>
                Due
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length ? (
              filteredBookings.map((booking) => (
                <tr key={booking._id}>
                  <td
                    style={{ border: "1px solid black", textAlign: "center" }}>
                    {booking.bookingNo}
                  </td>
                  <td
                    style={{ border: "1px solid black", textAlign: "center" }}>
                    {booking.fullName}
                  </td>
                  <td
                    style={{ border: "1px solid black", textAlign: "center" }}>
                    {dayjs(booking.checkInDate).format("DD MMM YYYY")}
                  </td>
                  <td
                    style={{ border: "1px solid black", textAlign: "center" }}>
                    {dayjs(booking.checkOutDate).format("DD MMM YYYY")}
                  </td>
                  <td
                    style={{ border: "1px solid black", textAlign: "center" }}>
                    {booking.roomCategoryName} ({booking.roomNumberName})
                  </td>
                  <td
                    style={{ border: "1px solid black", textAlign: "center" }}>
                    {booking.nights}
                  </td>
                  <td
                    style={{ border: "1px solid black", textAlign: "center" }}>
                    {booking.paymentMethod}
                  </td>
                  <td
                    style={{ border: "1px solid black", textAlign: "center" }}>
                    {booking.transactionId}
                  </td>
                  <td
                    style={{ border: "1px solid black", textAlign: "center" }}>
                    {booking.totalBill}
                  </td>
                  <td
                    style={{ border: "1px solid black", textAlign: "center" }}>
                    {booking.advancePayment}
                  </td>
                  <td
                    style={{ border: "1px solid black", textAlign: "center" }}>
                    {booking.duePayment}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="11"
                  style={{
                    textAlign: "center",
                    border: "1px solid black",
                  }}>
                  No bookings available.
                </td>
              </tr>
            )}

            {/* Summary Row for Totals */}
            {filteredBookings.length > 0 && (
              <tr>
                <td
                  colSpan="8"
                  style={{
                    textAlign: "right",
                    fontWeight: "bold",
                    border: "1px solid black",
                  }}>
                  Total:
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}>
                  {filteredBookings.reduce(
                    (sum, booking) => sum + booking.totalBill,
                    0
                  )}
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}>
                  {filteredBookings.reduce(
                    (sum, booking) => sum + booking.advancePayment,
                    0
                  )}
                </td>
                <td
                  style={{
                    border: "1px solid black",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}>
                  {filteredBookings.reduce(
                    (sum, booking) => sum + booking.duePayment,
                    0
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AllBookingInfo;
