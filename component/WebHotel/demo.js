"use client";
import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  InputNumber,
  Upload,
  message,
  Divider,
  Card,
  Image,
  Row,
  Col,
  Tabs,
  DatePicker,
  Collapse,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import coreAxios from "@/utils/axiosInstance";
import dayjs from "dayjs";

const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

const amenityOptions = [
  "Ceiling Fan",
  "Air Conditioning",
  "Toiletries",
  "Wi-Fi",
  "Sea View",
  "Beach View",
  "TV",
  "Minibar",
  "Safe",
  "Balcony",
  "Private Pool",
  "Bathtub",
  "Shower",
  "Hair Dryer",
  "Desk",
  "Sofa",
  "Telephone",
  "Coffee Maker",
  "Iron",
  "Kitchenette",
];

const WebHotelDetailsFormModal = ({
  visible,
  onCancel,
  onSubmit,
  editMode,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const [hotels, setHotels] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [activeTab, setActiveTab] = useState("1");
  const [categoryImages, setCategoryImages] = useState({});

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await coreAxios.get("/web-hotels");
        setHotels(res.data);
      } catch (error) {
        message.error("Failed to fetch hotels");
        console.error("Hotels fetch error:", error);
      }
    };
    fetchHotels();
  }, []);

  useEffect(() => {
    if (visible) {
      const formattedInitialValues = initialValues
        ? {
            ...initialValues,
            categories: initialValues.categories?.map((category, index) => ({
              ...category,
              images: category.images?.map((img) => ({
                uid: Math.random().toString(36).substring(2, 9),
                name: img.name || "image",
                status: "done",
                url: img.url,
                size: img.size || 0,
                type: img.type || "image/jpeg",
              })),
              priceRanges: category.priceRanges?.map((range) => ({
                ...range,
                dates: [
                  range.dates?.[0] ? dayjs(range.dates[0]) : dayjs(),
                  range.dates?.[1]
                    ? dayjs(range.dates[1])
                    : dayjs().add(1, "day"),
                ],
              })),
            })),
          }
        : { categories: [getDefaultCategory()] };

      form.setFieldsValue(formattedInitialValues);

      // Initialize category images state
      if (initialValues?.categories) {
        const initialImages = {};
        initialValues.categories.forEach((category, index) => {
          initialImages[index] = category.images || [];
        });
        setCategoryImages(initialImages);
      } else {
        setCategoryImages({ 0: [] });
      }
    } else {
      form.resetFields();
      setCategoryImages({});
    }
  }, [visible, initialValues, form]);

  const getDefaultCategory = () => ({
    categoryName: "",
    categoryDetails: "",
    amenities: [],
    adultCount: 0,
    childCount: 0,
    images: [],
    priceRanges: [
      {
        dates: [dayjs(), dayjs().add(1, "day")],
        price: 0,
        discountPercent: 0,
        taxes: 0,
      },
    ],
  });

  const handleImageUpload = async (
    { file, onSuccess, onError },
    categoryIndex
  ) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      setImageUploading(true);
      const res = await axios.post(
        `https://api.imgbb.com/1/upload?key=06b717af6db1d3e1fd24a7d34d1ad80f`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data?.data?.url) {
        const imageData = {
          url: res.data.data.url,
          name: file.name,
          size: file.size,
          type: file.type,
        };

        onSuccess(imageData);

        // Update the category images state
        setCategoryImages((prev) => ({
          ...prev,
          [categoryIndex]: [...(prev[categoryIndex] || []), imageData],
        }));

        message.success(`${file.name} uploaded successfully`);
      } else {
        throw new Error("Invalid response from image upload service");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      onError(error);
      message.error(`${file.name} upload failed: ${error.message}`);
    } finally {
      setImageUploading(false);
    }
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG files!");
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Image must be smaller than 5MB!");
      return false;
    }
    return true;
  };

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      try {
        file.preview = await getBase64(file.originFileObj);
      } catch (error) {
        console.error("Preview error:", error);
        message.error("Failed to generate image preview");
        return;
      }
    }
    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
  };

  const disabledDate = (current) => {
    return current && current < dayjs().startOf("day");
  };

  const handleOk = async () => {
    try {
      await form.validateFields();

      const values = await form.getFieldsValue();
      const selectedHotel = hotels.find((h) => h.name === values.name);

      const formattedValues = {
        ...values,
        hotelId: selectedHotel?._id,
        categories: values.categories.map((category, index) => ({
          ...category,
          images: categoryImages[index] || [], // Use the images from state
          priceRanges: (category.priceRanges || []).map((range) => ({
            ...range,
            dates: [
              range.dates?.[0]?.toISOString() || new Date().toISOString(),
              range.dates?.[1]?.toISOString() || new Date().toISOString(),
            ],
            price: Number(range.price) || 0,
            discountPercent: Number(range.discountPercent) || 0,
            taxes: Number(range.taxes) || 0,
          })),
        })),
        whatsNearby: values.whatsNearby || [],
        policies: values.policies || [],
      };

      onSubmit(formattedValues);
    } catch (error) {
      console.error("Form submission error:", error);
      if (error.errorFields) {
        message.error("Please fill all required fields correctly");
      } else {
        message.error("Failed to submit form");
      }
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={() => {
        onCancel();
        form.resetFields();
      }}
      onOk={handleOk}
      title={editMode ? "Edit Hotel Details" : "Add Hotel Details"}
      width={900}
      okButtonProps={{ loading: imageUploading }}
      okText={editMode ? "Update" : "Create"}
      cancelText="Cancel"
      bodyStyle={{ padding: "16px 24px" }}
      style={{ top: 20 }}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="small"
          tabPosition="left"
        >
          <TabPane tab="Basic" key="1">
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="name"
                  label="Hotel Name"
                  rules={[
                    { required: true, message: "Please select hotel name" },
                  ]}
                >
                  <Select
                    placeholder="Select hotel name"
                    showSearch
                    optionFilterProp="children"
                  >
                    {hotels.map((hotel) => (
                      <Option key={hotel._id} value={hotel.name}>
                        {hotel.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left">Categories</Divider>

            <Form.List name="categories">
              {(fields, { add, remove }) => (
                <>
                  <Collapse accordion>
                    {fields.map(({ key, name, ...restField }) => (
                      <Panel
                        key={key}
                        header={
                          form.getFieldValue([
                            "categories",
                            name,
                            "categoryName",
                          ]) || `Category ${name + 1}`
                        }
                        extra={
                          <Button
                            danger
                            type="text"
                            size="small"
                            icon={<MinusCircleOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(name);
                            }}
                          />
                        }
                      >
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "categoryName"]}
                              label="Category Name"
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter category name",
                                },
                              ]}
                            >
                              <Input placeholder="E.g., Deluxe Room, Suite, etc." />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "adultCount"]}
                              label="Adult Count"
                            >
                              <InputNumber
                                min={0}
                                max={10}
                                style={{ width: "100%" }}
                                placeholder="Number of adults"
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              {...restField}
                              name={[name, "childCount"]}
                              label="Child Count"
                            >
                              <InputNumber
                                min={0}
                                max={10}
                                style={{ width: "100%" }}
                                placeholder="Number of children"
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item
                          {...restField}
                          name={[name, "categoryDetails"]}
                          label="Category Details"
                        >
                          <Input.TextArea
                            rows={3}
                            placeholder="Describe this category..."
                          />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, "amenities"]}
                          label="Amenities"
                        >
                          <Select
                            mode="multiple"
                            placeholder="Select amenities"
                            options={amenityOptions.map((amenity) => ({
                              value: amenity,
                              label: amenity,
                            }))}
                            style={{ width: "100%" }}
                          />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          label="Category Images"
                          name={[name, "images"]}
                        >
                          <Upload
                            customRequest={({ file, onSuccess, onError }) =>
                              handleImageUpload(
                                { file, onSuccess, onError },
                                name
                              )
                            }
                            listType="picture-card"
                            onPreview={handlePreview}
                            beforeUpload={beforeUpload}
                            multiple
                            accept="image/*"
                            maxCount={10}
                            fileList={form.getFieldValue([
                              "categories",
                              name,
                              "images",
                            ])}
                          >
                            <div>
                              <PlusOutlined />
                              <div style={{ marginTop: 8 }}>Upload</div>
                            </div>
                          </Upload>
                        </Form.Item>

                        <Divider orientation="left">Price Ranges</Divider>

                        <Form.List name={[name, "priceRanges"]}>
                          {(
                            priceFields,
                            { add: addPrice, remove: removePrice }
                          ) => (
                            <>
                              {priceFields.map(
                                ({ key: priceKey, name: priceName }) => (
                                  <Card
                                    key={priceKey}
                                    size="small"
                                    style={{ marginBottom: 16 }}
                                    extra={
                                      <Button
                                        danger
                                        type="text"
                                        size="small"
                                        icon={<MinusCircleOutlined />}
                                        onClick={() => removePrice(priceName)}
                                      />
                                    }
                                  >
                                    <Row gutter={16}>
                                      <Col span={12}>
                                        <Form.Item
                                          name={[priceName, "dates"]}
                                          label="Date Range"
                                          rules={[
                                            {
                                              required: true,
                                              message:
                                                "Please select date range",
                                            },
                                          ]}
                                        >
                                          <RangePicker
                                            style={{ width: "100%" }}
                                            disabledDate={disabledDate}
                                          />
                                        </Form.Item>
                                      </Col>
                                      <Col span={12}>
                                        <Form.Item
                                          name={[priceName, "price"]}
                                          label="Price per night"
                                          rules={[
                                            {
                                              required: true,
                                              message: "Please enter price",
                                            },
                                          ]}
                                        >
                                          <InputNumber
                                            min={0}
                                            style={{ width: "100%" }}
                                            addonAfter="৳"
                                          />
                                        </Form.Item>
                                      </Col>
                                    </Row>

                                    <Row gutter={16}>
                                      <Col span={12}>
                                        <Form.Item
                                          name={[priceName, "discountPercent"]}
                                          label="Discount Percentage"
                                        >
                                          <InputNumber
                                            min={0}
                                            max={100}
                                            style={{ width: "100%" }}
                                            addonAfter="%"
                                          />
                                        </Form.Item>
                                      </Col>
                                      <Col span={12}>
                                        <Form.Item
                                          name={[priceName, "taxes"]}
                                          label="Taxes & Fees"
                                        >
                                          <InputNumber
                                            min={0}
                                            style={{ width: "100%" }}
                                            addonAfter="৳"
                                          />
                                        </Form.Item>
                                      </Col>
                                    </Row>
                                  </Card>
                                )
                              )}

                              <Button
                                type="dashed"
                                onClick={() =>
                                  addPrice({
                                    dates: [dayjs(), dayjs().add(1, "day")],
                                    price: 0,
                                    discountPercent: 0,
                                    taxes: 0,
                                  })
                                }
                                icon={<PlusOutlined />}
                                block
                                size="small"
                              >
                                Add Price Range
                              </Button>
                            </>
                          )}
                        </Form.List>
                      </Panel>
                    ))}
                  </Collapse>

                  <Button
                    type="dashed"
                    onClick={() => add(getDefaultCategory())}
                    icon={<PlusOutlined />}
                    block
                    style={{ marginTop: 16 }}
                  >
                    Add Category
                  </Button>
                </>
              )}
            </Form.List>
          </TabPane>

          <TabPane tab="Nearby" key="2">
            <Form.List name="whatsNearby">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Row gutter={16} key={key} style={{ marginBottom: 16 }}>
                      <Col span={14}>
                        <Form.Item
                          name={[name, "name"]}
                          label="Place Name"
                          rules={[
                            {
                              required: true,
                              message: "Please enter place name",
                            },
                          ]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name={[name, "distance"]}
                          label="Distance"
                          rules={[
                            {
                              required: true,
                              message: "Please enter distance",
                            },
                          ]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col
                        span={2}
                        style={{ display: "flex", alignItems: "flex-end" }}
                      >
                        <Button
                          danger
                          type="text"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        />
                      </Col>
                    </Row>
                  ))}

                  <Button
                    type="dashed"
                    onClick={() => add({ name: "", distance: "" })}
                    icon={<PlusOutlined />}
                    block
                    size="small"
                  >
                    Add Nearby Place
                  </Button>
                </>
              )}
            </Form.List>
          </TabPane>

          <TabPane tab="Policies" key="3">
            <Form.List name="policies">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Row gutter={16} key={key} style={{ marginBottom: 16 }}>
                      <Col span={22}>
                        <Form.Item
                          name={[name]}
                          label={`Policy ${name + 1}`}
                          rules={[
                            { required: true, message: "Please enter policy" },
                          ]}
                        >
                          <Input.TextArea rows={2} />
                        </Form.Item>
                      </Col>
                      <Col
                        span={2}
                        style={{ display: "flex", alignItems: "flex-end" }}
                      >
                        <Button
                          danger
                          type="text"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        />
                      </Col>
                    </Row>
                  ))}

                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                    block
                    size="small"
                  >
                    Add Policy
                  </Button>
                </>
              )}
            </Form.List>
          </TabPane>
        </Tabs>

        <Image
          width={200}
          style={{ display: "none" }}
          src={previewImage}
          preview={{
            visible: previewVisible,
            src: previewImage,
            onVisibleChange: (value) => setPreviewVisible(value),
          }}
        />
      </Form>
    </Modal>
  );
};

const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export default WebHotelDetailsFormModal;
