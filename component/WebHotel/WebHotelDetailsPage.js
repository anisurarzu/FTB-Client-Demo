"use client";

import React, { useEffect, useState } from "react";
import { Button, Card, message, Space, Table, Modal, Tag, Image, Row, Col, Divider, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import coreAxios from "@/utils/axiosInstance";
import WebHotelDetailsFormModal from "./WebHotelDetailsFormModal";

const { Text, Title } = Typography;

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

  const columns = [
    { 
      title: "Hotel Name", 
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Button type="link" onClick={() => handleViewDetails(record)}>
          {text}
        </Button>
      )
    },
    { 
      title: "Location", 
      dataIndex: "location",
      key: "location" 
    },
    { 
      title: "Rating", 
      dataIndex: "rating",
      key: "rating",
      render: (rating) => <Tag color={rating >= 4 ? 'green' : rating >= 3 ? 'orange' : 'red'}>{rating?.toFixed(1)}</Tag>
    },
    {
      title: "Room Types",
      key: "roomTypes",
      render: (_, record) => (
        <div>
          {record.roomTypes.map((room, i) => (
            <Tag key={i}>{room.name}</Tag>
          ))}
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
          <Button
            danger
            size="small"
            onClick={() => handleDelete(record._id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const renderRoomOptions = (options) => {
    return options.map((option, index) => (
      <div key={index} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>Type:</Text> {option.type}
          </Col>
          <Col span={8}>
            <Text strong>Price:</Text> {option.price} BDT
            {option.discountPercent > 0 && (
              <Text delete type="secondary" style={{ marginLeft: 8 }}>
                {option.originalPrice} BDT
              </Text>
            )}
          </Col>
          <Col span={8}>
            {option.discountPercent > 0 && (
              <Tag color="red">Save {option.discountPercent}%</Tag>
            )}
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>Adults:</Text> {option.adults}
          </Col>
          <Col span={8}>
            <Text strong>Breakfast:</Text> {option.breakfast ? 'Included' : 'Not included'}
          </Col>
          <Col span={8}>
            <Text strong>Cancellation:</Text> 
            <Tag color={option.cancellation === 'Refundable' ? 'green' : 'red'}>
              {option.cancellation}
            </Tag>
          </Col>
        </Row>
        <Divider dashed />
      </div>
    ));
  };

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
            <Text type="secondary">{currentDetail.location}</Text>
            
            <Divider orientation="left">Images</Divider>
            <Image.PreviewGroup>
              <Row gutter={16}>
                {currentDetail.images.map((img, index) => (
                  <Col span={8} key={index}>
                    <Image src={img} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                  </Col>
                ))}
              </Row>
            </Image.PreviewGroup>
            
            <Divider orientation="left">Rating</Divider>
            <Tag color={currentDetail.rating >= 4 ? 'green' : currentDetail.rating >= 3 ? 'orange' : 'red'}>
              {currentDetail.rating?.toFixed(1)}
            </Tag>
            
            <Divider orientation="left">Room Types</Divider>
            {currentDetail.roomTypes.map((room, index) => (
              <div key={index} style={{ marginBottom: 24 }}>
                <Title level={5}>{room.name}</Title>
                {room.description && <Text>{room.description}</Text>}
                
                {room.roomImages && room.roomImages.length > 0 && (
                  <Image.PreviewGroup>
                    <Row gutter={16} style={{ marginTop: 8 }}>
                      {room.roomImages.map((img, imgIndex) => (
                        <Col span={8} key={imgIndex}>
                          <Image src={img} style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                        </Col>
                      ))}
                    </Row>
                  </Image.PreviewGroup>
                )}
                
                <Divider orientation="left" style={{ marginTop: 16 }}>Options</Divider>
                {renderRoomOptions(room.options)}
              </div>
            ))}
            
            {currentDetail.whatsNearby && currentDetail.whatsNearby.length > 0 && (
              <>
                <Divider orientation="left">What's Nearby</Divider>
                {currentDetail.whatsNearby.map((item, index) => (
                  <div key={index}>
                    <Text strong>{item.name}</Text> - {item.distance}
                  </div>
                ))}
              </>
            )}
            
            {currentDetail.facilities && currentDetail.facilities.length > 0 && (
              <>
                <Divider orientation="left">Facilities</Divider>
                <Row gutter={16}>
                  {currentDetail.facilities.map((facility, index) => (
                    <Col span={8} key={index}>
                      <Text>{facility}</Text>
                    </Col>
                  ))}
                </Row>
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