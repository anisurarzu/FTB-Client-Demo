"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Table,
  message,
  Popconfirm,
  Spin,
  Pagination,
  Form,
  Input,
  Dropdown,
  Menu,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useFormik } from "formik";
import dayjs from "dayjs";
import coreAxios from "@/utils/axiosInstance";
import CopyToClipboard from "react-copy-to-clipboard";
import Link from "next/link";

const ExpenseInfo = () => {
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [invoiceInfo, setInvoiceInfo] = useState({});
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  // Fetch expenses from API
  const fetchExpense = async () => {
    setLoading(true);
    try {
      const response = await coreAxios.get("expense");
      if (response?.status === 200) {
        setExpenses(response.data?.expenses);
        setFilteredExpenses(response.data?.expenses);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to fetch expenses. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpense();
  }, []);

  // Fetch grandTotal by invoiceNo
  const fetchGrandTotal = async (invoiceNo) => {
    try {
      const response = await coreAxios.get(`/getOrderInfo/${invoiceNo}`);
      if (response?.status === 200) {
        setInvoiceInfo(response?.data);
        return response.data.grandTotal;
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to fetch invoice info. Please check the invoice number.";
      message.error(errorMessage);
      return null;
    }
  };

  // Calculate total cost dynamically
  const calculateTotalCost = (values) => {
    const { flowerCost, deliveryCost, additionalCost } = values;
    return Number(flowerCost) + Number(deliveryCost) + Number(additionalCost);
  };

  // Calculate cash in hand
  const calculateCashInHand = (grandTotal, totalCost) => {
    return Number(grandTotal) - Number(totalCost);
  };

  const formik = useFormik({
    initialValues: {
      invoiceNo: "",
      grandTotal: 0,
      flowerCost: 0,
      deliveryCost: 0,
      additionalCost: 0,
      totalCost: 0,
      cashInHand: 0,
      createdBy: userInfo?.loginID,
      createdDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      invoiceId: "",
    },
    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        const totalCost = calculateTotalCost(values);
        const cashInHand = calculateCashInHand(values.grandTotal, totalCost);
        const newExpense = {
          ...values,
          totalCost,
          cashInHand,
          invoiceId: invoiceInfo?._id,
        };

        let res;
        if (isEditing) {
          res = await coreAxios.put(`expense/${editingKey}`, newExpense);
        } else {
          res = await coreAxios.post("expense", newExpense);
        }

        if (res?.status === 200) {
          message.success(isEditing ? "Expense updated!" : "Expense added!");
          fetchExpense();
          resetForm();
          setVisible(false);
          setIsEditing(false);
          setEditingKey(null);
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to save expense. Please try again.";
        message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
  });

  // Handle form field changes
  const handleFieldChange = async (fieldName, value) => {
    // Update the field value
    await formik.setFieldValue(fieldName, value);

    // Get the latest form values
    const latestValues = { ...formik.values, [fieldName]: value };

    // If the field is "invoiceNo", fetch the grandTotal from the API
    if (fieldName === "invoiceNo") {
      const grandTotal = await fetchGrandTotal(value);
      if (grandTotal !== null) {
        await formik.setFieldValue("grandTotal", grandTotal);
        latestValues.grandTotal = grandTotal; // Update latestValues with the new grandTotal
      }
    }

    // Calculate totalCost
    const totalCost = calculateTotalCost(latestValues);
    await formik.setFieldValue("totalCost", totalCost);

    // Calculate cashInHand
    const cashInHand = calculateCashInHand(latestValues.grandTotal, totalCost);
    await formik.setFieldValue("cashInHand", cashInHand);
  };

  // Handle edit action
  const handleEdit = (record) => {
    setEditingKey(record._id);
    formik.setValues({
      invoiceNo: record.invoiceNo,
      grandTotal: record.grandTotal,
      flowerCost: record.flowerCost,
      deliveryCost: record.deliveryCost,
      additionalCost: record.additionalCost,
      totalCost: record.totalCost,
      cashInHand: record.cashInHand,
      createdBy: record.createdBy,
      createdDate: record.createdDate,
      invoiceId: record._id,
    });
    setVisible(true);
    setIsEditing(true);
  };

  // Handle delete action
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await coreAxios.delete(`expense/${id}`);
      if (res?.status === 200) {
        message.success("Expense deleted successfully!");
        fetchExpense();
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to delete expense. Please try again.";
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = expenses.filter((item) =>
      item.createdBy.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredExpenses(filtered);
    setPagination({ ...pagination, current: 1 });
  };

  const formatDeliveryDateTime = (dateTime) => {
    if (!dateTime) return "-";
    return dayjs.utc(dateTime).tz("Asia/Dhaka").format("DD MMM YYYY HH:mm");
  };

  // Table columns
  const columns = [
    {
      title: "Created Date & Time",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (text) => formatDeliveryDateTime(text),
    },

    {
      title: "Reason",
      dataIndex: "expenseReason",
      key: "expenseReason",
    },
    {
      title: "Amount",
      dataIndex: "expenseAmount",
      key: "expenseAmount",
    },

    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              {/* {userInfo.pagePermissions?.[2]?.editAccess && ( */}
              <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}>
                Edit
              </Menu.Item>
              {/* )} */}
              {/* <Menu.Item key="delete" icon={<DeleteOutlined />}>
                <Popconfirm
                  title="Are you sure you want to delete this expense?"
                  onConfirm={() => handleDelete(record._id)}>
                  Delete
                </Popconfirm>
              </Menu.Item> */}
            </Menu>
          }
          trigger={["click"]}>
          <Button>
            Actions <DownOutlined />
          </Button>
        </Dropdown>
      ),
    },
  ];

  // Render the form
  const renderForm = () => (
    <Form onFinish={formik.handleSubmit} layout="vertical">
      <Form.Item label="Invoice Number">
        <Input
          name="invoiceNo"
          value={formik.values.invoiceNo}
          disabled
          onChange={(e) => handleFieldChange("invoiceNo", e.target.value)}
        />
      </Form.Item>
      <Form.Item label="Grand Total">
        <Input name="grandTotal" value={formik.values.grandTotal} disabled />
      </Form.Item>
      <Form.Item label="Flower Cost">
        <Input
          name="flowerCost"
          value={formik.values.flowerCost}
          onChange={(e) => handleFieldChange("flowerCost", e.target.value)}
        />
      </Form.Item>
      <Form.Item label="Delivery Cost">
        <Input
          name="deliveryCost"
          value={formik.values.deliveryCost}
          onChange={(e) => handleFieldChange("deliveryCost", e.target.value)}
        />
      </Form.Item>
      <Form.Item label="Additional Cost">
        <Input
          name="additionalCost"
          value={formik.values.additionalCost}
          onChange={(e) => handleFieldChange("additionalCost", e.target.value)}
        />
      </Form.Item>
      <Form.Item label="Total Cost">
        <Input name="totalCost" value={formik.values.totalCost} disabled />
      </Form.Item>
      <Form.Item label="Cash In Hand">
        <Input name="cashInHand" value={formik.values.cashInHand} disabled />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          className="bg-[#8ABF55] hover:bg-[#7DA54E] text-white">
          {isEditing ? "Update" : "Create"}
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div>
      {/* {userInfo?.pagePermissions?.[2]?.viewAccess === true ? ( */}
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <Input.Search
            placeholder="Search by Created By"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          {/* {userInfo.pagePermissions?.[2]?.insertAccess && ( */}
          <Button
            type="primary"
            onClick={() => {
              formik.resetForm();
              setVisible(true);
              setIsEditing(false);
            }}
            style={{ marginLeft: 10 }}
            className="bg-[#8ABF55] hover:bg-[#7DA54E] text-white">
            Add New Expense
          </Button>
          {/* )} */}
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredExpenses}
            rowKey="_id"
            pagination={{
              ...pagination,
              total: filteredExpenses.length,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
            }}
          />
        </Spin>

        <Modal
          title={isEditing ? "Edit Expense" : "Create Expense"}
          open={visible}
          onCancel={() => setVisible(false)}
          footer={null}>
          {renderForm()}
        </Modal>
      </div>
      {/* ) : (
        <div>{`You don't have permission to view this page.`}</div>
      )} */}
    </div>
  );
};

export default ExpenseInfo;
