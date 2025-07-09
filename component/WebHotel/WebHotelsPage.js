"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Card,
  message,
  Skeleton,
  Pagination,
  Tooltip,
  Modal,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import axios from "axios";
import HotelFormModal from "./HotelFrom";

const { confirm } = Modal;

export default function WebHotelsPage() {
  const [hotels, setHotels] = useState([]);
  const [filteredHotels, setFilteredHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentHotel, setCurrentHotel] = useState(null);
  const [previewImage, setPreviewImage] = useState([]); // ✅ should be an array

  const [imageUploading, setImageUploading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await coreAxios.get("/web-hotels");
        setHotels(res.data);
        setFilteredHotels(res.data);
      } catch (err) {
        message.error("Failed to load hotels");
      } finally {
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  useEffect(() => {
    setFilteredHotels(
      searchText
        ? hotels.filter((h) =>
            h.name.toLowerCase().includes(searchText.toLowerCase())
          )
        : hotels
    );
    setPagination((prev) => ({ ...prev, current: 1 }));
  }, [searchText, hotels]);

  const handleImageUpload = async (file) => {
    if (previewImage.length >= 4) {
      message.warning("You can upload up to 4 images only.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      setImageUploading(true);
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=06b717af6db1d3e1fd24a7d34d1ad80f`,
        formData
      );
      const url = response?.data?.data?.url;
      if (url) {
        setPreviewImage((prev) => [...prev, url]);
      }
    } catch {
      message.error("Image upload failed");
    } finally {
      setImageUploading(false);
    }
  };

  const handleEdit = (hotel) => {
    setEditMode(true);
    setCurrentHotel(hotel);
    setPreviewImage(hotel.image);
    setModalVisible(true);
  };

  const handleDelete = (hotelId) => {
    confirm({
      title: "Are you sure you want to delete this hotel?",
      icon: <ExclamationCircleOutlined />,
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      async onOk() {
        try {
          await coreAxios.delete(`/web-hotels/${hotelId}`);
          setHotels((prev) => prev.filter((h) => h.id !== hotelId));
          message.success("Hotel deleted successfully");
        } catch {
          message.error("Failed to delete hotel");
        }
      },
    });
  };

  const handleFormSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        image: previewImage, // image is an array of imgBB URLs
      };

      const updated = editMode
        ? await coreAxios.put(`/web-hotels/${currentHotel.id}`, payload)
        : await coreAxios.post("/web-hotels", payload);

      const updatedHotel = updated.data;
      setHotels((prev) =>
        editMode
          ? prev.map((h) => (h.id === updatedHotel.id ? updatedHotel : h))
          : [...prev, updatedHotel]
      );
      message.success(`Hotel ${editMode ? "updated" : "added"} successfully`);
      setModalVisible(false);
      setPreviewImage([]);
    } catch {
      message.error("Failed to save hotel");
    }
  };

  const paginatedHotels = filteredHotels.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  );

  const skeletonRows = Array(pagination.pageSize)
    .fill(0)
    .map((_, idx) => (
      <tr key={idx}>
        {Array(5)
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
      <Card
        title="Hotel Management"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditMode(false);
              setCurrentHotel(null);
              setPreviewImage("");
              setModalVisible(true);
            }}
          >
            Add Hotel
          </Button>
        }
      >
        <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
          <Input
            placeholder="Search hotels..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
          >
            <thead style={{ backgroundColor: "#e3f2fd", color: "#333" }}>
              <tr>
                {["Image", "Name", "Location", "Price", "Actions"].map(
                  (header) => (
                    <th
                      key={header}
                      style={{ padding: 8, textAlign: "center" }}
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading
                ? skeletonRows
                : paginatedHotels.map((hotel, i) => (
                    <tr
                      key={hotel.id}
                      style={{
                        background:
                          i % 2 === 0
                            ? "linear-gradient(to right, #f0fdf4, #e0f2f1)"
                            : "linear-gradient(to right, #e8f5e9, #f1f8e9)",
                      }}
                    >
                      <td style={{ padding: 8, textAlign: "center" }}>
                        <img
                          src={hotel.image}
                          alt="hotel"
                          style={{
                            width: 60,
                            height: 40,
                            objectFit: "cover",
                          }}
                        />
                      </td>
                      <td style={{ padding: 8, textAlign: "center" }}>
                        {hotel.name}
                      </td>
                      <td style={{ padding: 8, textAlign: "center" }}>
                        {hotel.location}
                      </td>
                      <td style={{ padding: 8, textAlign: "center" }}>
                        ${hotel.price}
                      </td>
                      <td style={{ padding: 8, textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: 8,
                          }}
                        >
                          <Tooltip title="Edit">
                            <Button
                              size="small"
                              onClick={() => handleEdit(hotel)}
                            >
                              Edit
                            </Button>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <Button
                              size="small"
                              danger
                              onClick={() => handleDelete(hotel.id)}
                            >
                              <DeleteOutlined />
                            </Button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

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
            Showing {(pagination.current - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(
              pagination.current * pagination.pageSize,
              filteredHotels.length
            )}{" "}
            of {filteredHotels.length} entries
          </div>
          <Pagination
            size="small"
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={filteredHotels.length}
            onChange={(page) => setPagination({ ...pagination, current: page })}
            showSizeChanger={false}
          />
        </div>
      </Card>

      <HotelFormModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleFormSubmit}
        editMode={editMode}
        initialValues={
          currentHotel || {
            name: "",
            location: "",
            price: 0,
            rating: 0,
            amenities: [],
            discount: "",
            topSelling: false,
            image: "",
          }
        }
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
        imageUploading={imageUploading}
        handleImageUpload={handleImageUpload}
      />
    </div>
  );
}
