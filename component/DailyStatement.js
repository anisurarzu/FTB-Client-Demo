"use client";

import { useState, useEffect } from "react";
import { Button, message, Spin, Alert, Tooltip, InputNumber } from "antd";
import dayjs from "dayjs";
import moment from "moment";
import { CopyToClipboard } from "react-copy-to-clipboard";
import coreAxios from "@/utils/axiosInstance";
import { CopyOutlined } from "@ant-design/icons";
import Link from "next/link";
import DatePicker from "antd/es/date-picker";
import { useFormik } from "formik";
import DailySummary from "./DailySummary";

const DailyStatement = () => {
  const [bookings, setBookings] = useState({
    regularInvoice: [],
    unPaidInvoice: [],
  });
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [submitting, setSubmitting] = useState({});
  const [dailyIncome, setDailyIncome] = useState(0);

  const formik = useFormik({
    initialValues: {},
    onSubmit: async (values, { resetForm }) => {},
  });

  const isSameDay = (date1, date2) => {
    return dayjs(date1).isSame(dayjs(date2), "day");
  };

  // Calculate payment totals by method
  const getPaymentTotals = (payments) => {
    return (
      payments?.reduce(
        (acc, payment) => {
          if (payment.method === "BKASH") {
            acc.bkash += payment.amount || 0;
          } else if (payment.method === "CASH") {
            acc.cash += payment.amount || 0;
          } else if (payment.method === "BANK") {
            acc.bank += payment.amount || 0;
          }
          return acc;
        },
        { bkash: 0, cash: 0, bank: 0 }
      ) || { bkash: 0, cash: 0, bank: 0 }
    );
  };

  const getCumulativeTotals = (booking) => {
    const paymentTotals = getPaymentTotals(booking.payments);

    // Use the booking.totalPaid directly if it exists, otherwise calculate from payments
    const totalPaid =
      booking.totalPaid !== undefined
        ? booking.totalPaid
        : (booking.payments || []).reduce(
            (sum, payment) => sum + (payment.amount || 0),
            0
          );

    return {
      totalPaid: totalPaid,
      dailyAmount: booking.dailyAmount || 0,
      dueAmount: (booking.totalBill || 0) - totalPaid,
      bkash: paymentTotals.bkash,
      cash: paymentTotals.cash,
      bank: paymentTotals.bank,
    };
  };

  const fetchBookingsByDate = async (date) => {
    setLoading(true);
    try {
      const formattedDate = date.format("YYYY-MM-DD");
      const response = await coreAxios.get(
        `/bookings/check-in/${formattedDate}`
      );

      if (response.status === 200) {
        const data = response.data.data || {
          regularInvoice: [],
          unPaidInvoice: [],
        };

        const regularInvoiceIds = data.regularInvoice.map(
          (invoice) => invoice._id
        );
        const filteredUnpaidInvoices = data.unPaidInvoice.filter(
          (invoice) => !regularInvoiceIds.includes(invoice._id)
        );

        setBookings({
          regularInvoice: data.regularInvoice || [],
          unPaidInvoice: filteredUnpaidInvoices || [],
        });

        const initialValues = {};

        // Process all invoices
        [...data.regularInvoice, ...filteredUnpaidInvoices].forEach(
          (booking) => {
            const dateEntry = booking.invoiceDetails?.find((entry) =>
              isSameDay(new Date(entry.date), date.toDate())
            );

            initialValues[booking._id] = {
              totalPaid: getCumulativeTotals(booking).totalPaid || 0,
              dailyAmount: dateEntry?.dailyAmount || 0,
            };
          }
        );

        formik.setValues(initialValues);

        // Calculate daily income
        const calculatedDailyIncome = Object.values(initialValues).reduce(
          (sum, value) => sum + (value.dailyAmount || 0),
          0
        );
        setDailyIncome(calculatedDailyIncome);
      }
    } catch (error) {
      message.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (bookingId) => {
    setSubmitting((prev) => ({ ...prev, [bookingId]: true }));
    try {
      const dailyAmount = Number(formik.values[bookingId]?.dailyAmount) || 0;
      const booking = [
        ...bookings.regularInvoice,
        ...bookings.unPaidInvoice,
      ].find((b) => b._id === bookingId);

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Get existing payment for the selected date if any
      const existingPayment = booking.invoiceDetails?.find((payment) =>
        dayjs(payment.date).isSame(selectedDate, "day")
      );

      // Get current totals from the booking
      const currentTotals = getCumulativeTotals(booking);
      const currentTotalPaid = currentTotals.totalPaid;
      const currentDailyAmount = existingPayment?.dailyAmount || 0;

      // Calculate new total paid
      const newTotalPaid = currentTotalPaid - currentDailyAmount + dailyAmount;
      const newDuePayment = booking.totalBill - newTotalPaid;

      // Validations
      if (newTotalPaid > booking.totalBill) {
        throw new Error("Total paid cannot exceed total bill");
      }
      if (dailyAmount < 0) {
        throw new Error("Daily amount cannot be negative");
      }

      const response = await coreAxios.put(`/booking/details/${bookingId}`, {
        totalPaid: newTotalPaid,
        duePayment: newDuePayment,
        dailyAmount: dailyAmount,
        searchDate: selectedDate.toISOString(),
        isUpdate: !!existingPayment,
      });

      if (response.status === 200) {
        message.success(
          existingPayment
            ? "Payment updated successfully"
            : "Payment added successfully"
        );
        await fetchBookingsByDate(selectedDate);
      }
    } catch (error) {
      message.error(error.message || "Failed to update payment");
    } finally {
      setSubmitting((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  useEffect(() => {
    fetchBookingsByDate(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (date) => setSelectedDate(date);
  const handlePreviousDay = () =>
    setSelectedDate((prev) => prev.subtract(1, "day"));
  const handleNextDay = () => setSelectedDate((prev) => prev.add(1, "day"));

  // Calculate totals
  const regularTotals = bookings.regularInvoice?.reduce(
    (acc, booking) => {
      const totals = getCumulativeTotals(booking);
      const dateEntry = booking.invoiceDetails?.find((entry) =>
        isSameDay(new Date(entry.date), selectedDate.toDate())
      );

      return {
        totalBill: acc.totalBill + (booking.totalBill || 0),
        totalPaid: acc.totalPaid + (totals.totalPaid || 0),
        dailyAmount: acc.dailyAmount + (dateEntry?.dailyAmount || 0),
        dueAmount: acc.dueAmount + (totals.dueAmount || 0),
        bkash: acc.bkash + (totals.bkash || 0),
        cash: acc.cash + (totals.cash || 0),
        bank: acc.bank + (totals.bank || 0),
      };
    },
    {
      totalBill: 0,
      totalPaid: 0,
      dailyAmount: 0,
      dueAmount: 0,
      bkash: 0,
      cash: 0,
      bank: 0,
    }
  );

  const unpaidTotals = bookings.unPaidInvoice?.reduce(
    (acc, booking) => {
      const totals = getCumulativeTotals(booking);
      const dateEntry = booking.invoiceDetails?.find((entry) =>
        isSameDay(new Date(entry.date), selectedDate.toDate())
      );

      return {
        totalBill: acc.totalBill + (booking.totalBill || 0),
        totalPaid: acc.totalPaid + (totals.totalPaid || 0),
        dailyAmount: acc.dailyAmount + (dateEntry?.dailyAmount || 0),
        dueAmount: acc.dueAmount + (totals.dueAmount || 0),
        bkash: acc.bkash + (totals.bkash || 0),
        cash: acc.cash + (totals.cash || 0),
        bank: acc.bank + (totals.bank || 0),
      };
    },
    {
      totalBill: 0,
      totalPaid: 0,
      dailyAmount: 0,
      dueAmount: 0,
      bkash: 0,
      cash: 0,
      bank: 0,
    }
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold uppercase">Daily Statement</h2>
        <div className="flex items-center gap-4">
          <Button
            type="primary"
            onClick={handlePreviousDay}
            style={{ backgroundColor: "#4CAF50" }}>
            Previous Day
          </Button>
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            format="YYYY-MM-DD"
            allowClear={false}
            style={{ width: "150px" }}
          />
          <Button
            type="primary"
            onClick={handleNextDay}
            style={{ backgroundColor: "#4CAF50" }}>
            Next Day
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto shadow-md">
        <div className="min-w-[1200px]">
          <table className="w-full text-xs">
            <thead
              className="text-xs uppercase"
              style={{ backgroundColor: "#4CAF50", color: "white" }}>
              <tr>
                <th className="border border-green-600 p-2 text-center">
                  Sl No.
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Flat No.
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Invoice No.
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Guest Name
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Phone No.
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Check In
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Check Out
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Nights
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Total Bill
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Bkash
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Cash
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Bank
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Total Paid
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Daily Amount
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Due Amount
                </th>
                <th className="border border-green-600 p-2 text-center">
                  Update
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="16" className="text-center p-4">
                    <Spin tip="Loading data..." />
                  </td>
                </tr>
              ) : bookings.regularInvoice?.length === 0 &&
                bookings.unPaidInvoice?.length === 0 ? (
                <tr>
                  <td colSpan="16" className="text-center p-4">
                    <Alert message="No bookings found" type="info" />
                  </td>
                </tr>
              ) : (
                <>
                  {/* Regular Invoices */}
                  {bookings.regularInvoice?.map((booking, index) => {
                    const totals = getCumulativeTotals(booking);
                    const remainingAmount =
                      booking.totalBill - totals.totalPaid;

                    return (
                      <tr
                        key={booking._id}
                        className="hover:bg-gray-50"
                        style={{
                          backgroundColor:
                            booking.statusID === 255
                              ? "rgba(255, 99, 99, 0.5)"
                              : "",
                        }}>
                        <td className="border border-green-600 p-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {booking.roomNumberName || 0}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          <div className="flex items-center justify-center">
                            <Link
                              href={`/dashboard/${booking.bookingNo}`}
                              passHref>
                              <span className="text-blue-500 cursor-pointer mr-2">
                                {booking.bookingNo}
                              </span>
                            </Link>
                            <Tooltip title="Copy">
                              <CopyToClipboard
                                text={booking.bookingNo}
                                onCopy={() => message.success("Copied!")}>
                                <CopyOutlined className="cursor-pointer text-blue-500" />
                              </CopyToClipboard>
                            </Tooltip>
                          </div>
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {booking.fullName}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {booking.phone}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {moment(booking.checkInDate).format("D MMM YYYY")}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {moment(booking.checkOutDate).format("D MMM YYYY")}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {booking.nights}
                        </td>
                        <td className="border border-green-600 p-2 text-center font-bold text-green-900">
                          {booking.totalBill}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {totals.bkash || 0}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {totals.cash || 0}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {totals.bank || 0}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          <InputNumber
                            min={0}
                            value={totals.totalPaid}
                            disabled
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          <InputNumber
                            min={0}
                            max={remainingAmount}
                            value={formik.values[booking._id]?.dailyAmount || 0}
                            onChange={(value) => {
                              if (value > remainingAmount) {
                                message.warning(
                                  "Daily amount cannot exceed due amount"
                                );
                                return;
                              }
                              formik.setFieldValue(
                                `${booking._id}.dailyAmount`,
                                value
                              );
                              const newDailyIncome =
                                dailyIncome -
                                (formik.values[booking._id]?.dailyAmount || 0) +
                                value;
                              setDailyIncome(newDailyIncome);
                            }}
                            disabled={totals.dueAmount <= 0}
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {totals.dueAmount}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleUpdate(booking._id)}
                            loading={submitting[booking._id]}
                            disabled={totals.dueAmount <= 0}
                            style={{ backgroundColor: "#4CAF50" }}>
                            Update
                          </Button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Regular Invoices Total Row */}
                  {bookings.regularInvoice?.length > 0 && (
                    <>
                      <tr style={{ backgroundColor: "#f0f0f0" }}>
                        <td
                          colSpan="8"
                          className="border border-green-600 p-2 text-right font-bold">
                          Regular Invoices Total:
                        </td>
                        <td className="border border-green-600 p-2 text-center font-bold">
                          {regularTotals?.totalBill}
                        </td>
                        <td className="border border-green-600 p-2 text-center font-bold">
                          {regularTotals?.bkash}
                        </td>
                        <td className="border border-green-600 p-2 text-center font-bold">
                          {regularTotals?.cash}
                        </td>
                        <td className="border border-green-600 p-2 text-center font-bold">
                          {regularTotals?.bank}
                        </td>
                        <td className="border border-green-600 p-2 text-center font-bold">
                          {regularTotals?.totalPaid}
                        </td>
                        <td className="border border-green-600 p-2 text-center font-bold">
                          {regularTotals?.dailyAmount}
                        </td>
                        <td className="border border-green-600 p-2 text-center font-bold">
                          {regularTotals?.dueAmount}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          -
                        </td>
                      </tr>
                      <tr>
                        <td colSpan="16" className="p-2"></td>
                      </tr>
                    </>
                  )}

                  {/* Unpaid Invoices Header */}
                  {bookings.unPaidInvoice?.length > 0 && (
                    <tr style={{ backgroundColor: "#fffacd" }}>
                      <td
                        colSpan="16"
                        className="border border-green-600 p-2 text-center font-bold">
                        UNPAID INVOICES
                      </td>
                    </tr>
                  )}

                  {/* Unpaid Invoices */}
                  {bookings.unPaidInvoice?.map((booking, index) => {
                    const totals = getCumulativeTotals(booking);
                    const remainingAmount =
                      booking.totalBill - totals.totalPaid;

                    return (
                      <tr
                        key={booking._id}
                        className="hover:bg-gray-50"
                        style={{ backgroundColor: "rgba(255, 255, 0, 0.3)" }}>
                        <td className="border border-green-600 p-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {booking.roomNumberName || 0}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          <div className="flex items-center justify-center">
                            <Link
                              href={`/dashboard/${booking.bookingNo}`}
                              passHref>
                              <span className="text-blue-500 cursor-pointer mr-2">
                                {booking.bookingNo}
                              </span>
                            </Link>
                            <Tooltip title="Copy">
                              <CopyToClipboard
                                text={booking.bookingNo}
                                onCopy={() => message.success("Copied!")}>
                                <CopyOutlined className="cursor-pointer text-blue-500" />
                              </CopyToClipboard>
                            </Tooltip>
                          </div>
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {booking.fullName}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {booking.phone}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {moment(booking.checkInDate).format("D MMM YYYY")}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {moment(booking.checkOutDate).format("D MMM YYYY")}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {booking.nights}
                        </td>
                        <td className="border border-green-600 p-2 text-center font-bold text-green-900">
                          {booking.totalBill}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {totals.bkash || 0}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {totals.cash || 0}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {totals.bank || 0}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          <InputNumber
                            min={0}
                            value={totals.totalPaid}
                            disabled
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          <InputNumber
                            min={0}
                            max={remainingAmount}
                            value={formik.values[booking._id]?.dailyAmount || 0}
                            onChange={(value) => {
                              if (value > remainingAmount) {
                                message.warning(
                                  "Daily amount cannot exceed due amount"
                                );
                                return;
                              }
                              formik.setFieldValue(
                                `${booking._id}.dailyAmount`,
                                value
                              );
                              const newDailyIncome =
                                dailyIncome -
                                (formik.values[booking._id]?.dailyAmount || 0) +
                                value;
                              setDailyIncome(newDailyIncome);
                            }}
                            disabled={totals.dueAmount <= 0}
                            style={{ width: "80px" }}
                          />
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {totals.dueAmount}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleUpdate(booking._id)}
                            loading={submitting[booking._id]}
                            disabled={totals.dueAmount <= 0}
                            style={{ backgroundColor: "#4CAF50" }}>
                            Update
                          </Button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Unpaid Invoices Total Row */}
                  {bookings.unPaidInvoice?.length > 0 && (
                    <tr style={{ backgroundColor: "#fffacd" }}>
                      <td
                        colSpan="8"
                        className="border border-green-600 p-2 text-right font-bold">
                        Unpaid Invoices Total:
                      </td>
                      <td className="border border-green-600 p-2 text-center font-bold">
                        {unpaidTotals?.totalBill}
                      </td>
                      <td className="border border-green-600 p-2 text-center font-bold">
                        {unpaidTotals?.bkash}
                      </td>
                      <td className="border border-green-600 p-2 text-center font-bold">
                        {unpaidTotals?.cash}
                      </td>
                      <td className="border border-green-600 p-2 text-center font-bold">
                        {unpaidTotals?.bank}
                      </td>
                      <td className="border border-green-600 p-2 text-center font-bold">
                        {unpaidTotals?.totalPaid}
                      </td>
                      <td className="border border-green-600 p-2 text-center font-bold">
                        {unpaidTotals?.dailyAmount}
                      </td>
                      <td className="border border-green-600 p-2 text-center font-bold">
                        {unpaidTotals?.dueAmount}
                      </td>
                      <td className="border border-green-600 p-2 text-center">
                        -
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DailySummary selectedDate={selectedDate} dailyIncome={dailyIncome} />
    </div>
  );
};

export default DailyStatement;
