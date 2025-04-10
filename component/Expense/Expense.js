import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message, Spin } from "antd";
import { useFormik } from "formik";
import dayjs from "dayjs";
import coreAxios from "@/utils/axiosInstance";

const Expense = ({
  visible,
  onCancel,
  invoiceNo,
  invoiceId,
  fetchExpenses,
}) => {
  const [loading, setLoading] = useState(false);
  const [grandTotal, setGrandTotal] = useState(0);
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));

  // Fetch grandTotal by invoiceNo
  const fetchGrandTotal = async (invoiceId) => {
    try {
      const response = await coreAxios.get(`/orders/${invoiceId}`);
      if (response?.status === 200) {
        setGrandTotal(response.data.grandTotal);
        formik.setFieldValue("grandTotal", response.data.grandTotal);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to fetch invoice info. Please check the invoice number.";
      message.error(errorMessage);
    }
  };

  // Fetch grandTotal when invoiceNo changes
  useEffect(() => {
    if (invoiceId) {
      fetchGrandTotal(invoiceId);
    }
  }, [invoiceId]);

  const formik = useFormik({
    initialValues: {
      invoiceNo: invoiceNo,
      grandTotal: 0,
      flowerCost: 0,
      deliveryCost: 0,
      additionalCost: 0,
      totalCost: 0,
      cashInHand: 0,
      createdBy: userInfo?.loginID,
      createdDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      invoiceId: invoiceId,
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
          invoiceNo: invoiceNo,
          invoiceId: values.invoiceId || invoiceId,
        };

        const res = await coreAxios.post("expense", newExpense);
        if (res?.status === 200) {
          message.success("Expense added!");
          fetchExpenses();
          resetForm();
          onCancel();
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

  const calculateTotalCost = (values) => {
    const { flowerCost, deliveryCost, additionalCost } = values;
    return Number(flowerCost) + Number(deliveryCost) + Number(additionalCost);
  };

  const calculateCashInHand = (grandTotal, totalCost) => {
    return Number(grandTotal) - Number(totalCost);
  };

  const handleFieldChange = async (fieldName, value) => {
    await formik.setFieldValue(fieldName, value);
    const latestValues = { ...formik.values, [fieldName]: value };
    const totalCost = calculateTotalCost(latestValues);
    await formik.setFieldValue("totalCost", totalCost);
    const cashInHand = calculateCashInHand(latestValues.grandTotal, totalCost);
    await formik.setFieldValue("cashInHand", cashInHand);
  };

  return (
    <Modal
      title="Add Expense"
      visible={visible}
      onCancel={onCancel}
      footer={null}>
      <Form onFinish={formik.handleSubmit} layout="vertical">
        <Form.Item label="Expense Reason">
          <Input name="expenseReason" value={invoiceNo} disabled />
        </Form.Item>
        <Form.Item label="Expense Amount">
          <Input
            name="expenseAmount"
            value={formik.values.grandTotal}
            disabled
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="bg-[#8ABF55] hover:bg-[#7DA54E] text-white">
            Create
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Expense;
