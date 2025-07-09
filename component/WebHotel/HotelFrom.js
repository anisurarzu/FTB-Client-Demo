"use client";

import React from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Upload,
  Button,
  Image,
  Divider,
  Spin,
  Row,
  Col,
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import { useFormik } from "formik";
import * as Yup from "yup";

const { Option } = Select;
const { Dragger } = Upload;

export default function HotelFormModal({
  visible,
  onCancel,
  onSubmit,
  editMode,
  initialValues,
  imageUploading,
  handleImageUpload,
  previewImage,
  setPreviewImage,
}) {
  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().required("Hotel name is required"),
      location: Yup.string().required("Location is required"),
      price: Yup.number().min(1).required("Price is required"),
      rating: Yup.number().min(0).max(5),
    }),
    onSubmit,
  });

  const uploadProps = {
    name: "file",
    multiple: true,
    showUploadList: false,
    accept: "image/*",
    beforeUpload: async (file) => {
      if (previewImage.length >= 4) {
        message.warning("Maximum 4 images allowed.");
        return false;
      }

      await handleImageUpload(file); // No base64 needed
      return false; // prevent Ant from auto-uploading
    },
  };

  return (
    <Modal
      title={editMode ? "Edit Hotel" : "Add New Hotel"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
    >
      <Form layout="vertical" onFinish={formik.handleSubmit}>
        <Form.Item label="Hotel Images (Max 4)">
          <Dragger {...uploadProps}>
            {previewImage.length > 0 ? (
              <Row gutter={[8, 8]}>
                {previewImage.map((img, index) => (
                  <Col span={6} key={index}>
                    <Image
                      src={img}
                      alt={`Preview ${index + 1}`}
                      height={100}
                      style={{
                        objectFit: "cover",
                        borderRadius: 4,
                        width: "100%",
                      }}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <UploadOutlined style={{ fontSize: 24 }} />
                <p>Click or drag images (max 4) to upload</p>
              </div>
            )}
          </Dragger>
          {imageUploading && (
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <Spin size="small" /> Uploading...
            </div>
          )}
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="Hotel Name"
              validateStatus={formik.errors.name && "error"}
              help={formik.errors.name}
            >
              <Input
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label="Location"
              validateStatus={formik.errors.location && "error"}
              help={formik.errors.location}
            >
              <Input
                name="location"
                value={formik.values.location}
                onChange={formik.handleChange}
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label="Price"
              validateStatus={formik.errors.price && "error"}
              help={formik.errors.price}
            >
              <InputNumber
                name="price"
                value={formik.values.price}
                onChange={(value) => formik.setFieldValue("price", value)}
                style={{ width: "100%" }}
                size="large"
                min={0}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              label="Rating"
              validateStatus={formik.errors.rating && "error"}
              help={formik.errors.rating}
            >
              <Select
                value={formik.values.rating}
                onChange={(val) => formik.setFieldValue("rating", val)}
                size="large"
              >
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <Option key={num} value={num}>
                    {num} star{num !== 1 ? "s" : ""}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Discount">
              <Input
                name="discount"
                value={formik.values.discount}
                onChange={formik.handleChange}
                size="large"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item label="Top Selling">
              <Switch
                checked={formik.values.topSelling}
                onChange={(checked) =>
                  formik.setFieldValue("topSelling", checked)
                }
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Amenities">
              <Select
                mode="tags"
                value={formik.values.amenities}
                onChange={(value) => formik.setFieldValue("amenities", value)}
                size="large"
              >
                {["WiFi", "Spa", "Pool", "Parking", "Restaurant"].map(
                  (item) => (
                    <Option key={item}>{item}</Option>
                  )
                )}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={imageUploading}>
            {editMode ? "Update Hotel" : "Add Hotel"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
