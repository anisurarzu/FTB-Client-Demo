"use client";
import React, { useState, useEffect } from "react";
import { Select, DatePicker, Button, Spin, Alert } from "antd";
import dayjs from "dayjs";
import coreAxios from "@/utils/axiosInstance";

const { Option } = Select;
const { RangePicker } = DatePicker;

const formatDate = (date) => {
  return dayjs(date).format("DD MMM YYYY");
};

const RoomAvailabilityPage = () => {
  const [hotelData, setHotelData] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomOptions, setRoomOptions] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHotelInformation();
  }, []);

  const fetchHotelInformation = async () => {
    try {
      setLoading(true);

      // Retrieve user information from local storage
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const userRole = userInfo?.role?.value;
      const userHotelID = userInfo?.hotelID;

      // Fetch hotel data
      const res = await coreAxios.get(`hotel`);
      setLoading(false);

      if (res?.status === 200) {
        let hotelData = res?.data;

        // Apply filtering for "hoteladmin" role
        if (userRole === "hoteladmin" && userHotelID) {
          hotelData = hotelData.filter(
            (hotel) => hotel.hotelID === userHotelID
          );
        }

        setHotelData(hotelData);
      }
    } catch (error) {
      setLoading(false);
      console.error("Failed to fetch hotel data", error);
    }
  };

  const handleHotelChange = (hotel) => {
    setSelectedHotel(hotel);
    setSelectedCategory(null);
    setSelectedRoom(null);
    const selectedHotelData = hotelData.find((h) => h.hotelName === hotel);
    if (selectedHotelData) {
      setRoomOptions(selectedHotelData.roomCategories || []);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedRoom(null);
  };

  const searchAvailableRooms = () => {
    if (!selectedHotel || !selectedCategory || dates.length < 2) {
      return;
    }

    const [startDate, endDate] = dates.map((date) => dayjs(date).toDate());

    const bookedDatesRange = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateString = d.toISOString().split("T")[0];
      bookedDatesRange.push(dateString);
    }

    const availableDates = {};

    const selectedHotelData = hotelData.find(
      (hotel) => hotel.hotelName === selectedHotel
    );
    if (!selectedHotelData) return;

    const selectedCategoryData = selectedHotelData.roomCategories.find(
      (category) => category.name === selectedCategory
    );
    if (!selectedCategoryData) return;

    selectedCategoryData.roomNumbers.forEach((room) => {
      const bookedDates = new Set(room.bookedDates);
      const available = bookedDatesRange.filter(
        (date) => !bookedDates.has(date)
      );

      if (selectedRoom) {
        if (room.name === selectedRoom && available.length) {
          availableDates[room.name] = available;
        }
      } else if (available.length) {
        availableDates[room.name] = available;
      }
    });

    const formattedAvailableRooms = Object.entries(availableDates).map(
      ([roomName, available]) => ({
        name: roomName,
        availableDates: available,
        bookedDates: Array.from(
          new Set(
            selectedCategoryData.roomNumbers.find((r) => r.name === roomName)
              ?.bookedDates || []
          )
        ),
        category: selectedCategory,
      })
    );

    setAvailableRooms(formattedAvailableRooms);
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
        Room Availability Search
      </h3>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <Select
          placeholder="Select a Hotel"
          value={selectedHotel}
          onChange={handleHotelChange}
          style={{ width: "25%" }}>
          {hotelData.map((hotel) => (
            <Option key={hotel.hotelName} value={hotel.hotelName}>
              {hotel.hotelName}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Select Category"
          value={selectedCategory}
          onChange={handleCategoryChange}
          style={{ width: "25%" }}
          disabled={!selectedHotel}>
          {roomOptions.map((category) => (
            <Option key={category.name} value={category.name}>
              {category.name}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Select Room (Optional)"
          value={selectedRoom}
          onChange={(room) => setSelectedRoom(room)}
          style={{ width: "25%" }}
          disabled={!selectedCategory}>
          {roomOptions
            .find((cat) => cat.name === selectedCategory)
            ?.roomNumbers.map((room) => (
              <Option key={room.name} value={room.name}>
                {room.name}
              </Option>
            ))}
        </Select>

        <RangePicker
          value={dates.length ? dates : null}
          onChange={(dates) => setDates(dates || [])}
          disabled={!selectedCategory}
          style={{ width: "25%" }}
        />
      </div>

      <Button
        type="primary"
        onClick={searchAvailableRooms}
        disabled={!selectedHotel || !selectedCategory || dates.length < 2}>
        Search
      </Button>

      {loading ? (
        <Spin style={{ marginTop: "20px" }} tip="Loading, please wait...">
          <Alert
            message="Processing your request"
            description="This may take a moment, thank you for your patience."
            type="info"
          />
        </Spin>
      ) : (
        <div style={{ marginTop: "20px" }}>
          {availableRooms.length > 0 ? (
            availableRooms.map((room) => (
              <div key={room.name} style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "18px", fontWeight: "600" }}>
                  {room.name}
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "10px",
                  }}>
                  {room.availableDates.length ? (
                    room.availableDates.map((date, index) => (
                      <div
                        key={`${date}-${index}`}
                        style={{
                          padding: "8px",
                          border: "1px solid #38a169",
                          color: "#38a169",
                          backgroundColor: "#e6fffa",
                          textAlign: "center",
                          borderRadius: "5px",
                          fontWeight: "bold",
                        }}>
                        {formatDate(date)}
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        gridColumn: "span 5",
                        padding: "8px",
                        border: "1px solid #e53e3e",
                        color: "#e53e3e",
                        backgroundColor: "#fff5f5",
                        textAlign: "center",
                        borderRadius: "5px",
                        fontWeight: "bold",
                      }}>
                      No Available Dates
                    </div>
                  )}
                  {room.bookedDates.length > 0 &&
                    room.bookedDates.map((date, index) => (
                      <div
                        key={`${date}-${index}`}
                        style={{
                          padding: "8px",
                          border: "1px solid #e53e3e",
                          color: "#e53e3e",
                          backgroundColor: "#fff5f5",
                          textAlign: "center",
                          borderRadius: "5px",
                          fontWeight: "bold",
                        }}>
                        {formatDate(date)}
                      </div>
                    ))}
                </div>
              </div>
            ))
          ) : (
            <p>No rooms available for the selected criteria.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomAvailabilityPage;
