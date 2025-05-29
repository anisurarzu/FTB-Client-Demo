"use client"
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
  Switch,
  Tabs,
} from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import coreAxios from "@/utils/axiosInstance";

const { Option } = Select;
const { TabPane } = Tabs;

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
  const [hotelImages, setHotelImages] = useState([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [activeTab, setActiveTab] = useState('1');

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
      form.setFieldsValue(initialValues || {});

      const validImages = (initialValues?.images || [])
        .filter(url => url && typeof url === 'string')
        .map(url => ({
          uid: url,
          name: url.split('/').pop() || 'hotel_image',
          status: 'done',
          url: url
        }));

      setHotelImages(validImages);
    } else {
      form.resetFields();
      setHotelImages([]);
    }
  }, [visible, initialValues]);

  const handleImageUpload = async ({ file, onSuccess, onError }) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      setImageUploading(true);
      const res = await axios.post(
        `https://api.imgbb.com/1/upload?key=0d928e97225b72fcd198fa40d99a15d5`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (res.data?.data?.url) {
        onSuccess({
          url: res.data.data.url,
          name: file.name,
          size: file.size,
          type: file.type
        });
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
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG files!');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
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

  const handleHotelImagesChange = ({ fileList }) => {
    setHotelImages(fileList);
  };

  const handleOk = async () => {
    try {
      await form.validateFields();

      const values = await form.getFieldsValue();

      const selectedHotel = hotels.find(h => h.name === values.name);

      const formattedValues = {
        ...values,
        hotelId: selectedHotel?._id,
        images: hotelImages
          .map(file => file.response?.url || file.url)
          .filter(url => url),
        roomTypes: (values.roomTypes || []).map(roomType => ({
          ...roomType,
          options: (roomType.options || []).map(option => ({
            ...option,
            adults: Number(option.adults) || 1,
            price: Number(option.price) || 0,
            originalPrice: Number(option.originalPrice) || 0,
            discountPercent: Number(option.discountPercent) || 0,
            taxes: Number(option.taxes) || 0,
            breakfast: !!option.breakfast
          }))
        })),
        whatsNearby: values.whatsNearby || [],
        facilities: values.facilities || [],
        policies: values.policies || []
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
        setHotelImages([]);
      }}
      onOk={handleOk}
      title={editMode ? "Edit Hotel Details" : "Add Hotel Details"}
      width={900}
      okButtonProps={{ loading: imageUploading }}
      okText={editMode ? "Update" : "Create"}
      cancelText="Cancel"
      bodyStyle={{ padding: '16px 24px' }}
      style={{ top: 20 }}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues || {}}
      >
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
                  rules={[{ required: true, message: 'Please select hotel name' }]}
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
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="location"
                  label="Location"
                  rules={[{ required: true, message: 'Please enter location' }]}
                >
                  <Input placeholder="Enter hotel location" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="rating"
                  label="Rating"
                  rules={[{ 
                    required: true, 
                    message: 'Please enter rating',
                    type: 'number',
                    min: 0,
                    max: 5
                  }]}
                >
                  <InputNumber 
                    min={0} 
                    max={5} 
                    step={0.1}
                    style={{ width: '100%' }} 
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Hotel Images">
              <Upload
                customRequest={handleImageUpload}
                listType="picture-card"
                fileList={hotelImages}
                onPreview={handlePreview}
                onChange={handleHotelImagesChange}
                beforeUpload={beforeUpload}
                multiple
                accept="image/*"
                maxCount={10}
              >
                {hotelImages.length >= 10 ? null : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <Image
              width={200}
              style={{ display: 'none' }}
              src={previewImage}
              preview={{
                visible: previewVisible,
                src: previewImage,
                onVisibleChange: (value) => setPreviewVisible(value),
              }}
            />
          </TabPane>
          <TabPane tab="Rooms" key="2">
            <Form.List name="roomTypes">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      size="small"
                      title={`Room Type ${name + 1}`}
                      style={{ marginBottom: 16 }}
                      extra={
                        <Button
                          danger
                          type="text"
                          size="small"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        />
                      }
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'name']}
                            label="Room Type Name"
                            rules={[{ required: true, message: 'Please enter room type name' }]}
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            {...restField}
                            name={[name, 'amenities']}
                            label="Amenities"
                          >
                            <Select mode="tags" placeholder="Add amenities" />
                          </Form.Item>
                        </Col>
                      </Row>
                      
                      <Form.Item
                        {...restField}
                        name={[name, 'description']}
                        label="Description"
                      >
                        <Input.TextArea rows={3} />
                      </Form.Item>

                      <Divider orientation="left">Room Options</Divider>
                      
                      <Form.List name={[name, 'options']}>
                        {(optionFields, { add: addOption, remove: removeOption }) => (
                          <>
                            {optionFields.map(({ key: optionKey, name: optionName, ...optionRestField }) => (
                              <div key={optionKey} style={{ marginBottom: 16 }}>
                                <Row gutter={16} align="middle">
                                  <Col span={18}>
                                    <Form.Item
                                      {...optionRestField}
                                      name={[optionName, 'type']}
                                      label="Option Type"
                                      rules={[{ required: true, message: 'Please enter option type' }]}
                                    >
                                      <Input />
                                    </Form.Item>
                                  </Col>
                                  <Col span={6} style={{ textAlign: 'right' }}>
                                    <Button
                                      danger
                                      type="text"
                                      size="small"
                                      icon={<MinusCircleOutlined />}
                                      onClick={() => removeOption(optionName)}
                                    />
                                  </Col>
                                </Row>
                                
                                <Row gutter={16}>
                                  <Col span={8}>
                                    <Form.Item
                                      {...optionRestField}
                                      name={[optionName, 'adults']}
                                      label="Adults"
                                      rules={[{ required: true, message: 'Please enter adults count' }]}
                                    >
                                      <InputNumber min={1} style={{ width: '100%' }} />
                                    </Form.Item>
                                  </Col>
                                  <Col span={8}>
                                    <Form.Item
                                      {...optionRestField}
                                      name={[optionName, 'price']}
                                      label="Price"
                                      rules={[{ required: true, message: 'Please enter price' }]}
                                    >
                                      <InputNumber min={0} style={{ width: '100%' }} />
                                    </Form.Item>
                                  </Col>
                                  <Col span={8}>
                                    <Form.Item
                                      {...optionRestField}
                                      name={[optionName, 'breakfast']}
                                      label="Breakfast Included"
                                      valuePropName="checked"
                                    >
                                      <Switch />
                                    </Form.Item>
                                  </Col>
                                </Row>
                                
                                <Row gutter={16}>
                                  <Col span={8}>
                                    <Form.Item
                                      {...optionRestField}
                                      name={[optionName, 'originalPrice']}
                                      label="Original Price"
                                    >
                                      <InputNumber min={0} style={{ width: '100%' }} />
                                    </Form.Item>
                                  </Col>
                                  <Col span={8}>
                                    <Form.Item
                                      {...optionRestField}
                                      name={[optionName, 'discountPercent']}
                                      label="Discount %"
                                    >
                                      <InputNumber min={0} max={100} style={{ width: '100%' }} />
                                    </Form.Item>
                                  </Col>
                                  <Col span={8}>
                                    <Form.Item
                                      {...optionRestField}
                                      name={[optionName, 'taxes']}
                                      label="Taxes"
                                    >
                                      <InputNumber min={0} style={{ width: '100%' }} />
                                    </Form.Item>
                                  </Col>
                                </Row>
                                
                                <Form.Item
                                  {...optionRestField}
                                  name={[optionName, 'cancellation']}
                                  label="Cancellation Policy"
                                >
                                  <Input.TextArea rows={2} />
                                </Form.Item>
                              </div>
                            ))}
                            
                            <Button
                              type="dashed"
                              onClick={() => addOption({
                                type: 'Standard',
                                adults: 2,
                                price: 0,
                                originalPrice: 0,
                                discountPercent: 0,
                                taxes: 0,
                                breakfast: false,
                                cancellation: 'Non-refundable'
                              })}
                              icon={<PlusOutlined />}
                              block
                              size="small"
                            >
                              Add Room Option
                            </Button>
                          </>
                        )}
                      </Form.List>
                    </Card>
                  ))}
                  
                  <Button
                    type="dashed"
                    onClick={() => add({
                      name: '',
                      amenities: [],
                      description: '',
                      options: [{
                        type: 'Standard',
                        adults: 2,
                        price: 0,
                        originalPrice: 0,
                        discountPercent: 0,
                        taxes: 0,
                        breakfast: false,
                        cancellation: 'Non-refundable'
                      }]
                    })}
                    icon={<PlusOutlined />}
                    block
                    size="small"
                  >
                    Add Room Type
                  </Button>
                </>
              )}
            </Form.List>
          </TabPane>

          <TabPane tab="Nearby" key="3">
            <Form.List name="whatsNearby">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Row gutter={16} key={key} style={{ marginBottom: 16 }}>
                      <Col span={14}>
                        <Form.Item
                          name={[name, 'name']}
                          label="Place Name"
                          rules={[{ required: true, message: 'Please enter place name' }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          name={[name, 'distance']}
                          label="Distance"
                          rules={[{ required: true, message: 'Please enter distance' }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={2} style={{ display: 'flex', alignItems: 'flex-end' }}>
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
                    onClick={() => add({ name: '', distance: '' })}
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

          <TabPane tab="Others" key="4">
            <Form.Item
              name="facilities"
              label="Facilities"
            >
              <Select mode="tags" placeholder="Add facilities" />
            </Form.Item>

            <Form.List name="policies">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name }) => (
                    <Row gutter={16} key={key} style={{ marginBottom: 16 }}>
                      <Col span={22}>
                        <Form.Item
                          name={[name]}
                          label={`Policy ${name + 1}`}
                          rules={[{ required: true, message: 'Please enter policy' }]}
                        >
                          <Input.TextArea rows={2} />
                        </Form.Item>
                      </Col>
                      <Col span={2} style={{ display: 'flex', alignItems: 'flex-end' }}>
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
      </Form>
    </Modal>
  );
};

export default WebHotelDetailsFormModal;
