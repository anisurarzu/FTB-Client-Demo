"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Table,
  message,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Spin,
  Pagination,
  DatePicker,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { useFormik } from "formik";
import dayjs from "dayjs";
import coreAxios from "@/utils/axiosInstance";
import { toast } from "react-toastify";

const ExpenseInfo = () => {
  const [visible, setVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [loading, setLoading] = useState(false);
  const [nextExpenseNo, setNextExpenseNo] = useState(1);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await coreAxios.get("/expenses");
      if (response.status === 200) {
        setExpenses(response.data);
        // Calculate next expense number
        if (response.data.length > 0) {
          const maxNo = Math.max(
            ...response.data.map(
              (e) => parseInt(e.expenseNo.replace("EXP-", "")) || 0
            )
          );
          setNextExpenseNo(maxNo + 1);
        }
        // Call dashboard API after fetching expenses

      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error(error.response?.data?.message || "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const formik = useFormik({
    initialValues: {
      expenseNo: `EXP-${nextExpenseNo}`,
      expenseReason: "",
      expenseAmount: 0,
      expenseDate: dayjs(),
      createdAt: dayjs(),
    },
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        // Format dates before sending to API
        const payload = {
          ...values,
          expenseDate: values.expenseDate.format("YYYY-MM-DD"),
          createdAt: values.createdAt.format("YYYY-MM-DD HH:mm:ss"),
        };

        if (isEditing) {
          const response = await coreAxios.put(
            `/expenses/${editingKey}`,
            payload
          );
          if (response?.status === 200) {
            toast.success("Expense updated successfully!");
          }
        } else {
          const response = await coreAxios.post("/expenses", payload);
          if (response?.status === 200) {
            toast.success("Expense created successfully!");
            setNextExpenseNo(nextExpenseNo + 1);
          }
        }

        resetForm({
          values: {
            expenseNo: `EXP-${nextExpenseNo + (isEditing ? 0 : 1)}`,
            expenseReason: "",
            expenseAmount: 0,
            expenseDate: dayjs(),
            createdAt: dayjs(),
          },
        });

        setVisible(false);
        setIsEditing(false);
        setEditingKey(null);
        await fetchExpenses();
      } catch (error) {
        console.error("Error saving expense:", error);
        toast.error(error.response?.data?.message || "Failed to save expense");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleEdit = (record) => {
    setEditingKey(record?._id);
    formik.setValues({
      expenseNo: record.expenseNo,
      expenseReason: record.expenseReason,
      expenseAmount: record.expenseAmount,
      expenseDate: dayjs(record.expenseDate),
      createdAt: dayjs(record.createdAt),
    });
    setVisible(true);
    setIsEditing(true);
  };

  const handleDelete = async (record) => {
    try {
      setLoading(true);
      const response = await coreAxios.delete(`/expenses/${record?._id}`);
      if (response?.status === 200) {
        toast.success("Expense deleted successfully!");
        await fetchExpenses();
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error(error.response?.data?.message || "Failed to delete expense");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Expense No",
      dataIndex: "expenseNo",
      key: "expenseNo",
      sorter: (a, b) => a.expenseNo.localeCompare(b.expenseNo),
    },
    {
      title: "Expense Name",
      dataIndex: "expenseReason",
      key: "expenseReason",
    },
    {
      title: "Amount (BDT)",
      dataIndex: "expenseAmount",
      key: "expenseAmount",
      render: (amount) => `৳${amount.toFixed(2)}`,
      sorter: (a, b) => a.expenseAmount - b.expenseAmount,
    },
    {
      title: "Expense Date",
      dataIndex: "expenseDate",
      key: "expenseDate",
      render: (date) => dayjs(date).format("YYYY-MM-DD"),
      sorter: (a, b) => new Date(a.expenseDate) - new Date(b.expenseDate),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="bg-blue-500 hover:bg-blue-600"
          />
          <Popconfirm
            title="Are you sure to delete this expense?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No">
            <Button
              danger
              icon={<DeleteOutlined />}
              className="hover:bg-red-500"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  return (
    <div className="container mx-auto p-4">
      <Button
        type="primary"
        onClick={() => {
          setIsEditing(false);
          formik.resetForm({
            values: {
              expenseNo: `EXP-${nextExpenseNo}`,
              expenseReason: "",
              expenseAmount: 0,
              expenseDate: dayjs(),
              createdAt: dayjs(),
            },
          });
          setVisible(true);
        }}
        className="mb-4 bg-[#8ABF55] hover:bg-[#7DA54E] text-white"
        icon={<PlusOutlined />}>
        Add New Expense
      </Button>

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={expenses}
          pagination={false}
          rowKey="id"
          onChange={handleTableChange}
          scroll={{ x: true }}
          bordered
          className="shadow-md"
        />

        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={expenses?.length}
          onChange={(page, pageSize) =>
            setPagination({ ...pagination, current: page, pageSize })
          }
          className="mt-4"
        />
      </Spin>

      <Modal
        title={isEditing ? "Edit Expense" : "Add New Expense"}
        open={visible}
        onCancel={() => {
          setVisible(false);
          formik.resetForm({
            values: {
              expenseNo: `EXP-${nextExpenseNo}`,
              expenseReason: "",
              expenseAmount: 0,
              expenseDate: dayjs(),
              createdAt: dayjs(),
            },
          });
        }}
        footer={null}>
        <form onSubmit={formik.handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1">Expense Number</label>
            <Input value={formik.values.expenseNo} disabled />
          </div>

          <div className="mb-4">
            <label className="block mb-1">Expense Name</label>
            <Input.TextArea
              name="expenseReason"
              rows={3}
              placeholder="Enter expense name"
              value={formik.values.expenseReason}
              onChange={formik.handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1">Amount (BDT)</label>
            <InputNumber
              name="expenseAmount"
              style={{ width: "100%" }}
              formatter={(value) =>
                `৳ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/৳\s?|(,*)/g, "")}
              step={0.01}
              precision={2}
              min={0}
              value={formik.values.expenseAmount}
              onChange={(value) => formik.setFieldValue("expenseAmount", value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1">Expense Date</label>
            <DatePicker
              name="expenseDate"
              style={{ width: "100%" }}
              value={formik.values.expenseDate}
              onChange={(date) => formik.setFieldValue("expenseDate", date)}
              required
            />
          </div>

          {isEditing && (
            <div className="mb-4">
              <label className="block mb-1">Created At</label>
              <DatePicker
                name="createdAt"
                style={{ width: "100%" }}
                showTime
                value={formik.values.createdAt}
                onChange={(date) => formik.setFieldValue("createdAt", date)}
                disabled
              />
            </div>
          )}

          <Button
            type="primary"
            loading={loading}
            htmlType="submit"
            className="w-full bg-[#8ABF55] hover:bg-[#7DA54E] mt-2">
            {isEditing ? "Update Expense" : "Add Expense"}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default ExpenseInfo;
