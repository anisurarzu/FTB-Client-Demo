"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Table,
  message,
  Popconfirm,
  Spin,
  Form,
  Input,
  DatePicker,
  Tooltip,
  Select,
  Row,
  Col,
  Pagination,
  Alert,
  Option,
  Switch,
} from "antd";

import { useFormik } from "formik";
import axios from "axios";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import moment from "moment";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { v4 as uuidv4 } from "uuid";
import coreAxios from "@/utils/axiosInstance";
import { CopyOutlined, PlusOutlined } from "@ant-design/icons";
import Link from "next/link";

const BookingInfo = () => {
  const [visible, setVisible] = useState(false);
  const [selectedHotel2, setSelectedHotel2] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [guestInfo, setGuestInfo] = useState(null);
  const [hotelInfo, setHotelInfo] = useState([]);
  const [roomCategories, setRoomCategories] = useState([]);
  const [roomNumbers, setRoomNumbers] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [prevData, setPrevData] = useState();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });
  const [searchText, setSearchText] = useState("");

  const fetchRoomCategories = async () => {
    try {
      const response = await coreAxios.get("hotelCategory");
      if (Array.isArray(response.data)) {
        setRoomCategories(response.data);
      } else {
        setRoomCategories([]);
      }
    } catch (error) {
      message.error("Failed to fetch room categories.");
    }
  };

  const fetchHotelInfo = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const userRole = userInfo?.role?.value;
      const userHotelID = userInfo?.hotelID;

      const response = await coreAxios.get("hotel");

      if (Array.isArray(response.data)) {
        let hotelData = response.data;

        if (userRole === "hoteladmin" && userHotelID) {
          hotelData = hotelData.filter(
            (hotel) => hotel.hotelID === userHotelID
          );
        }

        setHotelInfo(hotelData);
      } else {
        setHotelInfo([]);
      }
    } catch (error) {
      message.error("Failed to fetch hotel information.");
    }
  };

  const fetchHotelCategories = async (value) => {
    const hotel = hotelInfo.find((hotel) => hotel.hotelID === value);

    if (hotel && hotel.roomCategories) {
      setRoomCategories(hotel.roomCategories);
    } else {
      setRoomCategories([]);
    }
  };

  const areDatesOverlapping = (checkInDate, checkOutDate, bookedDates) => {
    return bookedDates.some((bookedDate) => {
      const booked = dayjs(bookedDate);
      const checkIn = dayjs(checkInDate);
      const checkOut = dayjs(checkOutDate);

      return (
        (booked.isAfter(checkIn, "day") && booked.isBefore(checkOut, "day")) ||
        booked.isSame(checkIn, "day") ||
        booked.isSame(checkOut, "day")
      );
    });
  };

  const fetchRoomNumbers = async (value) => {
    const room = roomCategories.find((room) => room._id === value);

    if (room && room.roomNumbers) {
      const availableRooms = room.roomNumbers.filter((roomNumber) => {
        if (roomNumber.bookedDates.length > 0) {
          const checkInDate = dayjs(formik.values.checkInDate);
          const checkOutDate = dayjs(formik.values.checkOutDate);

          const adjustedCheckOutDate = checkInDate.isSame(checkOutDate, "day")
            ? checkOutDate
            : checkOutDate.subtract(1, "day");

          const isOverlapping = areDatesOverlapping(
            checkInDate,
            adjustedCheckOutDate,
            roomNumber.bookedDates
          );

          return !isOverlapping;
        }
        return true;
      });

      setRoomNumbers(availableRooms);
    } else {
      setRoomNumbers([]);
    }
  };

  const fetchGuestInfo = async (name) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/guest?name=${name}`);
      if (response.data) {
        setGuestInfo(response.data);
        formik.setValues({
          fullName: response.data.fullName,
          nidPassport: response.data.nidPassport,
          address: response.data.address,
          phone: response.data.phone,
          email: response.data.email,
        });
      } else {
        setGuestInfo(null);
      }
    } catch (error) {
      message.error("Failed to fetch guest information.");
    } finally {
      setLoading(false);
    }
  };

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  const updateRoomBookingStatus = async (values) => {
    setLoading(true);

    const getBookedDates = (checkInDate, checkOutDate) => {
      const startDate = dayjs(checkInDate);
      const endDate = dayjs(checkOutDate);
      const bookedDates = [];

      for (let d = startDate; d.isBefore(endDate); d = d.add(1, "day")) {
        bookedDates.push(d.format("YYYY-MM-DD"));
      }
      return bookedDates;
    };

    // Calculate total paid amount from payments array
    const totalPaid = values.payments.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0),
      0
    );

    const bookingUpdatePayload = {
      hotelID: values?.hotelID,
      categoryName: values?.roomCategoryName,
      roomName: values?.roomNumberName,
      booking: {
        name: values.roomNumberName,
        bookedDates: getBookedDates(values.checkInDate, values.checkOutDate),
        bookings: [
          {
            guestName: values.fullName,
            checkIn: dayjs(values.checkInDate).format("YYYY-MM-DD"),
            checkOut: dayjs(values.checkOutDate).format("YYYY-MM-DD"),
            bookedBy: values.bookedBy,
            adults: values?.adults,
            children: values?.children,
            paymentDetails: {
              totalBill: values.totalBill,
              advancePayment: totalPaid, // Use calculated totalPaid
              duePayment: values.totalBill - totalPaid, // Calculate due payment
              paymentMethod: values.paymentMethod,
              transactionId: values.transactionId,
            },
          },
        ],
      },
    };

    try {
      if (isEditing) {
        const deleteResponse = await coreAxios.delete("/bookings/delete", {
          data: {
            hotelID: prevData?.hotelID,
            categoryName: prevData?.roomCategoryName,
            roomName: prevData?.roomNumberName,
            datesToDelete: getAllDatesBetween(
              prevData?.checkInDate,
              prevData?.checkOutDate
            ),
          },
        });
        if (deleteResponse.status === 200) {
          const updateBookingResponse = await coreAxios.put(
            `/hotel/room/updateBooking`,
            bookingUpdatePayload
          );

          if (updateBookingResponse.status === 200) {
            const newBooking = {
              ...values,
              checkIn: dayjs(values.checkInDate).format("YYYY-MM-DD"),
              checkOut: dayjs(values.checkOutDate).format("YYYY-MM-DD"),
              key: uuidv4(),
              bookingID: updateBookingResponse?.data?.hotel?._id,
              advancePayment: totalPaid, // Use calculated totalPaid
              duePayment: values.totalBill - totalPaid, // Calculate due payment
            };

            let response;
            if (isEditing) {
              response = await coreAxios.put(
                `booking/${editingKey}`,
                newBooking
              );
            } else {
              response = await coreAxios.post("booking", newBooking);
            }

            if (response.status === 200) {
              message.success("Booking created/updated successfully!");
            } else {
              message.error("Failed to create/update booking.");
            }

            setVisible(false);
            setIsEditing(false);
            setEditingKey(null);
            setBookings([]);
            setFilteredBookings([]);
            message.success("Room booking status updated successfully!");

            fetchHotelInfo();
            fetchBookings();
          } else {
            message.error("Failed to update room booking status.");
          }
        }
      } else {
        const updateBookingResponse = await coreAxios.put(
          `/hotel/room/updateBooking`,
          bookingUpdatePayload
        );
        if (updateBookingResponse.status === 200) {
          const newBooking = {
            ...values,
            checkIn: dayjs(values.checkInDate).format("YYYY-MM-DD"),
            checkOut: dayjs(values.checkOutDate).format("YYYY-MM-DD"),
            key: uuidv4(),
            bookingID: updateBookingResponse?.data?.hotel?._id,
            advancePayment: totalPaid, // Use calculated totalPaid
            duePayment: values.totalBill - totalPaid, // Calculate due payment
          };

          let response;
          if (isEditing) {
            response = await coreAxios.put(`booking/${editingKey}`, newBooking);
          } else {
            response = await coreAxios.post("booking", newBooking);
          }

          if (response.status === 200) {
            message.success("Booking created/updated successfully!");
          } else {
            message.error("Failed to create/update booking.");
          }

          setVisible(false);
          setIsEditing(false);
          setEditingKey(null);
          setBookings([]);
          setFilteredBookings([]);
          message.success("Room booking status updated successfully!");

          fetchHotelInfo();
          fetchBookings();
        } else {
          message.error("Failed to update room booking status.");
        }
      }
    } catch (error) {
      message.error("An error occurred while updating the booking.");
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      fullName: "",
      nidPassport: "",
      address: "",
      phone: "",
      email: "",
      hotelID: 0,
      hotelName: "",
      isKitchen: false,
      kitchenTotalBill: 0,
      extraBedTotalBill: 0,
      extraBed: false,
      roomCategoryID: 0,
      roomCategoryName: "",
      roomNumberID: 0,
      roomNumberName: "",
      roomPrice: 0,
      checkInDate: dayjs(),
      nights: 0,
      totalBill: 0,
      advancePayment: 0,
      duePayment: 0,
      payments: [
        {
          method: "",
          amount: "",
          transactionId: "",
        },
      ],
      transactionId: "",
      note: "",
      bookedBy: userInfo ? userInfo?.username : "",
      bookedByID: userInfo ? userInfo?.loginID : "",
      updatedByID: "Not Updated",
      reference: "",
      adults: 0,
      children: 0,
    },

    onSubmit: async (values, { resetForm }) => {
      try {
        // Calculate total payment amount
        const totalPaid = values.payments.reduce(
          (sum, p) => sum + (parseFloat(p.amount) || 0),
          0
        );

        // Validate that total paid doesn't exceed total bill
        if (totalPaid > values.totalBill) {
          message.error("Total payment amount cannot exceed total bill!");
          return;
        }

        setLoading(true);
        await updateRoomBookingStatus(values);
        resetForm();
      } catch (error) {
        message.error("Failed to add/update booking.");
      } finally {
        setLoading(false);
      }
    },
  });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const userRole = userInfo?.role?.value;
      const userHotelID = userInfo?.hotelID;

      const response = await coreAxios.get("bookings");

      if (response.status === 200) {
        let bookingsData = response?.data;

        if (userRole === "hoteladmin" && userHotelID) {
          bookingsData = bookingsData.filter(
            (booking) => booking.hotelID === userHotelID
          );
        }

        setBookings(bookingsData);
        setFilteredBookings(bookingsData);
      }
    } catch (error) {
      message.error("Failed to fetch bookings.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingsReportByBookingNo = async (bookingNo) => {
    setLoading(true);
    try {
      const response = await coreAxios.get(`bookings/bookingNo/${"FTB-01"}`);
      if (response.status === 200) {
        setReportData(response?.data);
      }
    } catch (error) {
      message.error("Failed to fetch bookings report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotelInfo();
    fetchBookings();
    fetchRoomCategories();
  }, []);

  const handleHotelInfo = (value) => {
    const selectedHotel = hotelInfo.find((hotel) => hotel.hotelID === value);

    formik.setFieldValue("roomCategoryID", 0);
    formik.setFieldValue("roomCategoryName", "");
    formik.setFieldValue("roomNumberID", "");
    formik.setFieldValue("roomNumberName", "");
    formik.setFieldValue("hotelID", value);
    formik.setFieldValue(
      "hotelName",
      selectedHotel ? selectedHotel.hotelName : ""
    );
    fetchHotelCategories(value);
  };

  const handleRoomCategoryChange = (value) => {
    const selectedCategory = roomCategories.find(
      (category) => category._id === value
    );

    formik.setFieldValue("roomNumberID", 0);
    formik.setFieldValue("roomNumberName", "");
    formik.setFieldValue("roomCategoryID", value);
    formik.setFieldValue(
      "roomCategoryName",
      selectedCategory ? selectedCategory.name : ""
    );
    fetchRoomNumbers(value);
  };

  const handleEdit = (record) => {
    setEditingKey(record?._id);
    setPrevData(record);
    fetchHotelCategories(record?.hotelID);
    fetchRoomNumbers(record?.roomCategoryID);

    const checkInDate = dayjs(record.checkInDate);
    const checkOutDate = dayjs(record.checkOutDate);

    // Calculate total paid from payments array
    const totalPaid = record.payments?.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0, 0) || 0
    );

    if (record) {
      formik.setValues({
        ...formik.values,
        bookedBy: record?.username,
        isKitchen: record?.isKitchen,
        kitchenTotalBill: record?.kitchenTotalBill,
        extraBed: record?.extraBed,
        extraBedTotalBill: record?.extraBedTotalBill,
        bookedByID: record?.loginID,
        updatedByID: userInfo ? userInfo?.loginID : "",
        fullName: record.fullName,
        nidPassport: record.nidPassport,
        address: record.address,
        phone: record.phone,
        email: record.email,
        hotelID: record.hotelID,
        hotelName: record.hotelName,
        roomCategoryName: record.roomCategoryName,
        roomNumberID: record.roomNumberID,
        roomNumberName: record?.roomNumberName,
        roomPrice: record.roomPrice,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        adults: record.adults,
        children: record.children,
        nights: record.nights,
        totalBill: record.totalBill,
        advancePayment: totalPaid, // Set from payments array
        duePayment: record.totalBill - totalPaid, // Calculate based on totalPaid
        paymentMethod: record.paymentMethod,
        transactionId: record.transactionId,
        note: record.note,
        payments: record.payments || [
          // Set payments array from record
          {
            method: "",
            amount: "",
            transactionId: "",
          },
        ],
      });
    }
    setVisible(true);
    setIsEditing(true);
  };

  function getAllDatesBetween(startDate, endDate) {
    const dates = [];
    let currentDate = dayjs(startDate);

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
      dates.push(currentDate.format("YYYY-MM-DD"));
      currentDate = currentDate.add(1, "day");
    }

    if (dayjs(startDate).date() !== 1) {
      dates.pop();
    }

    return dates;
  }

  const handleDelete = async (value) => {
    setLoading(true);
    try {
      const deleteResponse = await coreAxios.delete("/bookings/delete", {
        data: {
          hotelID: value?.hotelID,
          categoryName: value?.roomCategoryName,
          roomName: value?.roomNumberName,
          bookingID: value?.bookingID,
          datesToDelete: getAllDatesBetween(
            value?.checkInDate,
            value?.checkOutDate
          ),
        },
      });

      if (deleteResponse.status === 200) {
        handleDelete2(value?._id);
      }
    } catch (error) {
      message.error("Failed to delete booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete2 = async (key) => {
    setLoading(true);
    try {
      const canceledBy = userInfo?.loginID;

      const res = await coreAxios.put(`/booking/soft/${key}`, {
        canceledBy: canceledBy,
      });

      if (res.status === 200) {
        message.success("Booking deleted successfully!");
        fetchBookings();
      }
    } catch (error) {
      message.error("Failed to delete booking.");
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;

    formik.setFieldValue(name, value);

    const roomPrice = name === "roomPrice" ? value : formik.values.roomPrice;
    const nights = name === "nights" ? value : formik.values.nights;
    const totalBill = roomPrice * nights;

    const advancePayment = formik.values.advancePayment || 0;
    const duePayment = totalBill - advancePayment;

    formik.setFieldValue("totalBill", totalBill);
    formik.setFieldValue("duePayment", duePayment >= 0 ? duePayment : 0);
  };

  const handleNightsChange = (e) => {
    const nights = parseInt(e.target.value) || 0;
    formik.setFieldValue("nights", nights);

    const roomPrice = formik.values.roomPrice || 0;
    const totalBill = roomPrice * nights;

    let advancePayment = parseFloat(formik.values.advancePayment) || 0;

    if (advancePayment > totalBill) {
      advancePayment = totalBill;
    }

    const duePayment = totalBill - advancePayment;

    formik.setFieldValue("totalBill", totalBill);
    formik.setFieldValue("advancePayment", advancePayment);
    formik.setFieldValue("duePayment", duePayment >= 0 ? duePayment : 0);
  };

  const handleAdvancePaymentChange = (e) => {
    const advancePayment = e.target.value;
    const totalBill = formik.values.totalBill;

    const duePayment = totalBill - advancePayment;

    formik.setFieldValue("advancePayment", advancePayment);
    formik.setFieldValue("duePayment", duePayment >= 0 ? duePayment : 0);
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

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
    setPagination({ ...pagination, current: 1 });
  };

  const paginatedBookings = filteredBookings.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  const fetchBookingDetails = async (bookingNo) => {
    try {
      const response = await coreAxios.get(`/bookings/bookingNo/${bookingNo}`);
      if (response?.status === 200) {
        await fetchHotelCategories(response?.data?.[0]?.hotelID);
      }
      return response.data;
    } catch (error) {
      message.error(
        "Failed to fetch booking details. Please check the booking number."
      );
      return null;
    }
  };

  const handleBlur = async (e) => {
    const { value } = e.target;
    if (value) {
      const bookings = await fetchBookingDetails(value);
      const bookingDetails = bookings[0];

      const checkInDate = dayjs(bookingDetails.checkInDate);
      const checkOutDate = dayjs(bookingDetails.checkOutDate);
      if (bookingDetails) {
        formik.setValues({
          ...formik.values,
          fullName: bookingDetails.fullName,
          nidPassport: bookingDetails.nidPassport,
          address: bookingDetails.address,
          phone: bookingDetails.phone,
          email: bookingDetails.email,
          hotelName: bookingDetails.hotelName,
          hotelID: bookingDetails.hotelID,
          roomCategoryName: bookingDetails.roomCategoryID,
          roomNumberName: bookingDetails.roomNumberName,
          roomPrice: bookingDetails.roomPrice,
          adults: bookingDetails.adults,
          children: bookingDetails.children,
          nights: bookingDetails.nights,
          totalBill: bookingDetails.totalBill,
          advancePayment: bookingDetails.advancePayment,
          duePayment: bookingDetails.duePayment,
          paymentMethod: bookingDetails.paymentMethod,
          transactionId: bookingDetails.transactionId,
        });
        message.success("Booking details loaded successfully!");
      }
    }
  };

  const handleHotelChange = (hotelID) => {
    setLoading(true);
    setSelectedHotel2(hotelID);

    const selectedHotel = hotelInfo.find((hotel) => hotel.hotelID === hotelID);

    formik.setFieldValue("hotelID2", hotelID);
    formik.setFieldValue(
      "hotelName2",
      selectedHotel ? selectedHotel.hotelName : ""
    );

    const filteredData = bookings.filter(
      (booking) => booking.hotelID === hotelID
    );

    setFilteredBookings(filteredData);
    setPagination({ ...pagination, current: 1 });

    setLoading(false);
  };

  const handleCheckInChange = (date) => {
    if (!isEditing) {
      formik.setFieldValue("hotelName", "");
      formik.setFieldValue("hotelID", 0);
      formik.setFieldValue("roomCategoryID", 0);
      formik.setFieldValue("roomCategoryName", "");
      formik.setFieldValue("roomNumberID", 0);
      formik.setFieldValue("roomNumberName", "");
      formik.setFieldValue("checkOutDate", "");
    }
    formik.setFieldValue("checkInDate", date);
    calculateNights(date, formik.values.checkOutDate);
  };

  const handleCheckOutChange = (date) => {
    if (!isEditing) {
      formik.setFieldValue("hotelName", "");
      formik.setFieldValue("hotelID", 0);
      formik.setFieldValue("roomCategoryID", 0);
      formik.setFieldValue("roomCategoryName", "");
      formik.setFieldValue("roomNumberID", 0);
      formik.setFieldValue("roomNumberName", "");
    }
    formik.setFieldValue("checkOutDate", date);
    calculateNights(formik.values.checkInDate, date);
  };

  const calculateNights = (checkIn, checkOut) => {
    if (checkIn && checkOut) {
      const diffTime = Math.abs(checkOut - checkIn);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      formik.setFieldValue("nights", diffDays);
    } else {
      formik.setFieldValue("nights", 0);
    }
  };

  // Function to format payment methods for display
  const formatPaymentMethods = (payments) => {
    if (!payments || payments.length === 0) return "N/A";

    return payments
      .map(
        (payment) =>
          `${payment.method}: ${payment.amount}${
            payment.transactionId ? ` (${payment.transactionId})` : ""
          }`
      )
      .join(", ");
  };

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
            <Button
              type="primary"
              onClick={() => {
                formik.resetForm();
                setVisible(true);
                setIsEditing(false);
              }}
              className="mb-4 bg-[#8ABF55] hover:bg-[#7DA54E] text-white">
              Add New Booking
            </Button>

            <Select
              name="hotelName2"
              placeholder="Select a Hotel"
              value={formik.values.hotelName2}
              style={{ width: 300 }}
              onChange={handleHotelChange}>
              {hotelInfo.map((hotel) => (
                <Select.Option key={hotel.hotelID} value={hotel.hotelID}>
                  {hotel.hotelName}
                </Select.Option>
              ))}
            </Select>

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
                <thead className="text-xs  uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="border border-tableBorder text-center p-2">
                      Booking No.
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Invoice No.
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Guest Name
                    </th>
                    <th className="border border-tableBorder text-center p-2">
                      Phone
                    </th>
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
                      Payment Methods
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
                      <td className="border border-tableBorder text-center p-2">
                        {booking?.serialNo}
                      </td>

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
                      <td className="border border-tableBorder text-center p-2">
                        {booking.fullName}
                      </td>
                      <td className="border border-tableBorder text-center p-2">
                        {booking.phone}
                      </td>
                      <td className="border border-tableBorder text-center p-2">
                        {booking.roomCategoryName}
                      </td>
                      <td className="border border-tableBorder text-center p-2">
                        {booking.roomNumberName}
                      </td>
                      <td className="border border-tableBorder text-center p-2">
                        {moment(booking.createTime).format("D MMM YYYY")}
                      </td>
                      <td className="border border-tableBorder text-center p-2">
                        {moment(booking.checkInDate).format("D MMM YYYY")}
                      </td>
                      <td className="border border-tableBorder text-center p-2">
                        {moment(booking.checkOutDate).format("D MMM YYYY")}
                      </td>
                      <td className="border border-tableBorder text-center p-2">
                        {booking.nights}
                      </td>
                      <td className="border border-tableBorder text-center p-2">
                        {booking.advancePayment}
                      </td>
                      <td className="border border-tableBorder text-center p-2 font-bold text-green-900">
                        {booking.totalBill}
                      </td>
                      <td className="border border-tableBorder text-center p-2">
                        {formatPaymentMethods(booking.payments)}
                      </td>
                      <td
                        className="border border-tableBorder text-center p-2 font-bold"
                        style={{
                          color: booking.statusID === 255 ? "red" : "green",
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
                          : booking?.bookedByID}
                      </td>
                      <td className="border  border-tableBorder text-center   text-blue-900">
                        {booking?.updatedByID}{" "}
                        {booking?.updatedByID &&
                          dayjs(booking?.updatedAt).format(
                            "D MMM, YYYY (h:mm a)"
                          )}
                      </td>

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

            <div className="flex justify-center p-2">
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={filteredBookings?.length}
                onChange={(page, pageSize) =>
                  setPagination({ current: page, pageSize })
                }
                className="mt-4"
              />
            </div>
          </div>

          <Modal
            title={isEditing ? "Edit Booking" : "Create Booking"}
            open={visible}
            onCancel={() => setVisible(false)}
            footer={null}
            width={800}>
            <Form onFinish={formik.handleSubmit} layout="vertical">
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Prev Booking No." className="mb-2">
                    <Input
                      name="reference"
                      value={formik.values.reference}
                      onChange={formik.handleChange}
                      onBlur={handleBlur}
                    />
                  </Form.Item>
                </div>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Full Name" className="mb-2">
                    <Input
                      name="fullName"
                      value={formik.values.fullName}
                      onChange={formik.handleChange}
                      required={true}
                    />
                  </Form.Item>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <Form.Item label="NID/Passport" className="mb-2">
                    <Input
                      name="nidPassport"
                      value={formik.values.nidPassport}
                      onChange={formik.handleChange}
                      required={false}
                    />
                  </Form.Item>
                </div>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Address" className="mb-2">
                    <Input
                      name="address"
                      value={formik.values.address}
                      onChange={formik.handleChange}
                      required={false}
                    />
                  </Form.Item>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Phone Number" className="mb-2">
                    <Input
                      name="phone"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      required={true}
                    />
                  </Form.Item>
                </div>
                <div style={{ flex: 1 }}>
                  <Form.Item label="E-mail" className="mb-2">
                    <Input
                      name="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      required={false}
                    />
                  </Form.Item>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Check In Date" className="mb-2">
                    <DatePicker
                      name="checkInDate"
                      value={formik.values.checkInDate}
                      required={true}
                      onChange={handleCheckInChange}
                    />
                  </Form.Item>
                </div>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Check Out Date" className="mb-2">
                    <DatePicker
                      name="checkOutDate"
                      required={true}
                      value={formik.values.checkOutDate}
                      onChange={handleCheckOutChange}
                    />
                  </Form.Item>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Hotel Name" className="mb-2">
                    <Select
                      name="hotelName"
                      value={formik.values.hotelName}
                      onChange={handleHotelInfo}>
                      {hotelInfo.map((hotel) => (
                        <Select.Option
                          key={hotel.hotelID}
                          value={hotel.hotelID}>
                          {hotel.hotelName}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Room Categories" className="mb-2">
                    <Select
                      name="roomCategoryID"
                      value={formik.values.roomCategoryName}
                      onChange={handleRoomCategoryChange}>
                      {roomCategories.map((category) => (
                        <Select.Option key={category._id} value={category._id}>
                          {category.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Room Number" className="mb-2">
                    <Select
                      name="roomNumberID"
                      value={formik.values.roomNumberName}
                      onChange={(value) => {
                        const selectedRoom = roomNumbers.find(
                          (room) => room._id === value
                        );
                        formik.setFieldValue("roomNumberID", value);
                        formik.setFieldValue(
                          "roomNumberName",
                          selectedRoom ? selectedRoom.name : ""
                        );
                      }}>
                      {roomNumbers.map((room) => (
                        <Select.Option key={room._id} value={room._id}>
                          {room.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Room Price" className="mb-2">
                    <Input
                      name="roomPrice"
                      value={formik.values.roomPrice}
                      onChange={(e) => {
                        formik.handleChange(e);

                        const roomPrice = e.target.value;
                        const nights = formik.values.nights;
                        const kitchenTotalBill =
                          formik.values.kitchenTotalBill || 0;
                        const extraBedTotalBill =
                          formik.values.extraBedTotalBill || 0;

                        const totalBill =
                          (nights && roomPrice ? nights * roomPrice : 0) +
                          parseFloat(kitchenTotalBill) +
                          parseFloat(extraBedTotalBill);

                        formik.setFieldValue("totalBill", totalBill);
                      }}
                      required={true}
                    />
                  </Form.Item>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Number of Adults" className="mb-2">
                    <Input
                      name="adults"
                      value={formik.values.adults}
                      onChange={formik.handleChange}
                      required={false}
                    />
                  </Form.Item>
                </div>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Number of Children" className="mb-2">
                    <Input
                      name="children"
                      value={formik.values.children}
                      onChange={formik.handleChange}
                      required={false}
                    />
                  </Form.Item>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Number of Nights" className="mb-2">
                    <Input
                      name="nights"
                      value={formik.values.nights}
                      onChange={(e) => {
                        formik.handleChange(e);

                        const nights = e.target.value;
                        const roomPrice = formik.values.roomPrice;
                        const kitchenTotalBill =
                          formik.values.kitchenTotalBill || 0;
                        const extraBedTotalBill =
                          formik.values.extraBedTotalBill || 0;

                        const totalBill =
                          (nights && roomPrice ? nights * roomPrice : 0) +
                          parseFloat(kitchenTotalBill) +
                          parseFloat(extraBedTotalBill);

                        formik.setFieldValue("totalBill", totalBill);
                      }}
                      required={true}
                    />
                  </Form.Item>
                </div>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Total Bill" className="mb-2">
                    <Input
                      name="totalBill"
                      value={formik.values.totalBill}
                      readOnly
                    />
                  </Form.Item>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Payment Methods" className="mb-2">
                    {formik.values.payments.map((payment, index) => (
                      <div key={index} style={{ marginBottom: 16 }}>
                        <Row gutter={16}>
                          <Col span={8}>
                            <Form.Item label="Method" required={index === 0}>
                              <Select
                                value={payment.method}
                                onChange={(value) => {
                                  const payments = [...formik.values.payments];
                                  payments[index].method = value;
                                  formik.setFieldValue("payments", payments);
                                }}>
                                <Select.Option value="BKASH">
                                  BKASH
                                </Select.Option>
                                <Select.Option value="NAGAD">
                                  NAGAD
                                </Select.Option>
                                <Select.Option value="BANK">BANK</Select.Option>
                                <Select.Option value="CASH">CASH</Select.Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item label="Amount" required={index === 0}>
                              <Input
                                type="number"
                                value={payment.amount}
                                onChange={(e) => {
                                  const payments = [...formik.values.payments];
                                  payments[index].amount = e.target.value;
                                  formik.setFieldValue("payments", payments);

                                  // Calculate total paid amount
                                  const totalPaid = payments.reduce(
                                    (sum, p) =>
                                      sum + (parseFloat(p.amount) || 0),
                                    0
                                  );
                                  formik.setFieldValue(
                                    "advancePayment",
                                    totalPaid
                                  );
                                  formik.setFieldValue(
                                    "duePayment",
                                    formik.values.totalBill - totalPaid
                                  );
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item
                              label="Transaction ID"
                              required={index === 0}>
                              <Input
                                value={payment.transactionId}
                                onChange={(e) => {
                                  const payments = [...formik.values.payments];
                                  payments[index].transactionId =
                                    e.target.value;
                                  formik.setFieldValue("payments", payments);
                                }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    ))}

                    {formik.values.payments.length < 3 && (
                      <Button
                        type="dashed"
                        onClick={() => {
                          formik.setFieldValue("payments", [
                            ...formik.values.payments,
                            { method: "", amount: "", transactionId: "" },
                          ]);
                        }}
                        block
                        icon={<PlusOutlined />}>
                        Add Payment Method
                      </Button>
                    )}

                    <div style={{ marginTop: 16 }}>
                      <strong>Total Paid: </strong>
                      {formik.values.payments.reduce(
                        (sum, p) => sum + (parseFloat(p.amount) || 0),
                        0
                      )}
                      {formik.values.payments.reduce(
                        (sum, p) => sum + (parseFloat(p.amount) || 0),
                        0
                      ) > formik.values.totalBill && (
                        <Alert
                          message="Total payment amount exceeds total bill!"
                          type="error"
                          showIcon
                          style={{ marginTop: 8 }}
                        />
                      )}
                    </div>
                  </Form.Item>
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Is Kitchen?" className="mb-2">
                    <Switch
                      checked={formik.values.isKitchen}
                      onChange={(checked) =>
                        formik.setFieldValue("isKitchen", checked)
                      }
                    />
                  </Form.Item>
                  {formik.values.isKitchen && (
                    <Form.Item label="Total Bill (Kitchen)" className="mb-2">
                      <Input
                        type="number"
                        value={formik.values.kitchenTotalBill || ""}
                        onChange={(e) => {
                          formik.setFieldValue(
                            "kitchenTotalBill",
                            e.target.value
                          );

                          const kitchenTotalBill = e.target.value || 0;
                          const nights = formik.values.nights || 0;
                          const roomPrice = formik.values.roomPrice || 0;
                          const extraBedTotalBill =
                            formik.values.extraBedTotalBill || 0;

                          const totalBill =
                            (nights && roomPrice ? nights * roomPrice : 0) +
                            parseFloat(kitchenTotalBill) +
                            parseFloat(extraBedTotalBill);

                          formik.setFieldValue("totalBill", totalBill);
                        }}
                      />
                    </Form.Item>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Extra Bed?" className="mb-2">
                    <Switch
                      checked={formik.values.extraBed}
                      onChange={(checked) =>
                        formik.setFieldValue("extraBed", checked)
                      }
                    />
                  </Form.Item>
                  {formik.values.extraBed && (
                    <Form.Item label="Total Bill (Extra Bed)" className="mb-2">
                      <Input
                        type="number"
                        value={formik.values.extraBedTotalBill || ""}
                        onChange={(e) => {
                          formik.setFieldValue(
                            "extraBedTotalBill",
                            e.target.value
                          );

                          const extraBedTotalBill = e.target.value || 0;
                          const nights = formik.values.nights || 0;
                          const roomPrice = formik.values.roomPrice || 0;
                          const kitchenTotalBill =
                            formik.values.kitchenTotalBill || 0;

                          const totalBill =
                            (nights && roomPrice ? nights * roomPrice : 0) +
                            parseFloat(kitchenTotalBill) +
                            parseFloat(extraBedTotalBill);

                          formik.setFieldValue("totalBill", totalBill);
                        }}
                      />
                    </Form.Item>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <Form.Item label="Note" className="mb-2">
                    <Input
                      name="note"
                      value={formik.values.note}
                      onChange={formik.handleChange}
                    />
                  </Form.Item>
                </div>
              </div>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="bg-[#8ABF55] hover:bg-[#7DA54E]">
                {isEditing ? "Update Booking" : "Create Booking"}
              </Button>
            </Form>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default BookingInfo;
