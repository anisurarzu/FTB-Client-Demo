"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  message,
  Space,
  Table,
  Modal,
  Tag,
  Image,
  Row,
  Col,
  Divider,
  Typography,
  Collapse,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import WebHotelDetailsFormModal from "./WebHotelDetailsFormModal";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const { Panel } = Collapse;

export default function WebHotelDetailsPage() {
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentDetail, setCurrentDetail] = useState(null);
  const [editRecord, setEditRecord] = useState(null);
  const [editMode, setEditMode] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await coreAxios.get("/web-hotel-details");
      setDetails(res.data);
    } catch (error) {
      message.error("Failed to fetch hotel details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleEdit = (record) => {
    setEditRecord(record);
    setEditMode(true);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await coreAxios.delete(`/web-hotel-details/${id}`);
      message.success("Deleted successfully");
      fetchDetails();
    } catch (error) {
      message.error("Failed to delete");
      console.error(error);
    }
  };

  const handleViewDetails = (record) => {
    setCurrentDetail(record);
    setDetailModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editMode) {
        await coreAxios.put(`/web-hotel-details/${editRecord._id}`, values);
        message.success("Updated successfully");
      } else {
        await coreAxios.post("/web-hotel-details", values);
        message.success("Created successfully");
      }
      fetchDetails();
      setModalVisible(false);
      setEditRecord(null);
      setEditMode(false);
    } catch (error) {
      message.error(error.response?.data?.error || "Operation failed");
      console.error(error);
    }
  };

  const renderCategoryPriceRanges = (priceRanges) => {
    if (!priceRanges || priceRanges.length === 0) {
      return <Text type="secondary">No price ranges defined</Text>;
    }

    return priceRanges.map((range, index) => {
      const startDate = dayjs(range.dates[0]).format("MMM D, YYYY");
      const endDate = dayjs(range.dates[1]).format("MMM D, YYYY");
      const discountedPrice =
        range.price - range.price * (range.discountPercent / 100);

      return (
        <div key={index} style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>Date Range:</Text> {startDate} - {endDate}
            </Col>
            <Col span={8}>
              <Text strong>Price:</Text> {discountedPrice.toFixed(2)} BDT
              {range.discountPercent > 0 && (
                <Text delete type="secondary" style={{ marginLeft: 8 }}>
                  {range.price} BDT
                </Text>
              )}
            </Col>
            <Col span={8}>
              {range.discountPercent > 0 && (
                <Tag color="red">Save {range.discountPercent}%</Tag>
              )}
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Taxes:</Text> {range.taxes} BDT
            </Col>
            <Col span={12}>
              <Text strong>Total:</Text>{" "}
              {(discountedPrice + range.taxes).toFixed(2)} BDT
            </Col>
          </Row>
          <Divider dashed />
        </div>
      );
    });
  };

  const columns = [
    {
      title: "Hotel Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Button type="link" onClick={() => handleViewDetails(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: "Categories",
      key: "categories",
      render: (_, record) => (
        <div>
          {record.categories?.slice(0, 2).map((category, i) => (
            <Tag key={i}>{category.categoryName}</Tag>
          ))}
          {record.categories?.length > 2 && (
            <Tag>+{record.categories.length - 2} more</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => handleViewDetails(record)}>
            View
          </Button>
          <Button size="small" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button danger size="small" onClick={() => handleDelete(record._id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Hotel Details Management"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditRecord(null);
            setEditMode(false);
            setModalVisible(true);
          }}
        >
          Add Details
        </Button>
      }
    >
      <Table
        dataSource={details}
        loading={loading}
        rowKey="_id"
        columns={columns}
        pagination={{ pageSize: 10 }}
      />

      <WebHotelDetailsFormModal
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditRecord(null);
          setEditMode(false);
        }}
        onSubmit={handleSubmit}
        editMode={editMode}
        initialValues={editRecord}
      />

      <Modal
        title="Hotel Details"
        width={800}
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {currentDetail && (
          <div>
            <Title level={4}>{currentDetail.name}</Title>

            <Divider orientation="left">Categories</Divider>
            <Collapse accordion>
              {currentDetail.categories?.map((category, index) => (
                <Panel
                  key={index}
                  header={category.categoryName || `Category ${index + 1}`}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>Adults:</Text> {category.adultCount || 0}
                    </Col>
                    <Col span={12}>
                      <Text strong>Children:</Text> {category.childCount || 0}
                    </Col>
                  </Row>

                  {category.categoryDetails && (
                    <>
                      <Divider orientation="left">Details</Divider>
                      <Text>{category.categoryDetails}</Text>
                    </>
                  )}

                  {category.images && category.images.length > 0 && (
                    <>
                      <Divider orientation="left">Images</Divider>
                      <Image.PreviewGroup>
                        <Row gutter={16}>
                          {category.images?.map((img, imgIndex) => (
                            <Col span={8} key={imgIndex}>
                              <Image
                                src={img.url || img}
                                style={{
                                  width: "100%",
                                  height: 120,
                                  objectFit: "cover",
                                }}
                              />
                            </Col>
                          ))}
                        </Row>
                      </Image.PreviewGroup>
                    </>
                  )}

                  {category.amenities && category.amenities.length > 0 && (
                    <>
                      <Divider orientation="left">Amenities</Divider>
                      <Row gutter={16}>
                        {category.amenities.map((amenity, amenityIndex) => (
                          <Col span={8} key={amenityIndex}>
                            <Text>{amenity}</Text>
                          </Col>
                        ))}
                      </Row>
                    </>
                  )}

                  {category.priceRanges && category.priceRanges.length > 0 && (
                    <>
                      <Divider orientation="left">Price Ranges</Divider>
                      {renderCategoryPriceRanges(category.priceRanges)}
                    </>
                  )}
                </Panel>
              ))}
            </Collapse>

            {currentDetail.whatsNearby &&
              currentDetail.whatsNearby.length > 0 && (
                <>
                  <Divider orientation="left">What's Nearby</Divider>
                  {currentDetail.whatsNearby.map((item, index) => (
                    <div key={index}>
                      <Text strong>{item.name}</Text> - {item.distance}
                    </div>
                  ))}
                </>
              )}

            {currentDetail.policies && currentDetail.policies.length > 0 && (
              <>
                <Divider orientation="left">Policies</Divider>
                {currentDetail.policies.map((policy, index) => (
                  <div key={index}>
                    <Text>{policy}</Text>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
