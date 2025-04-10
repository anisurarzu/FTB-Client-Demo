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

const DailyStatement = () => {
  const [bookings, setBookings] = useState({
    regularInvoice: [],
    unPaidInvoice: [],
  });
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [submitting, setSubmitting] = useState({});
  const [dailySummary, setDailySummary] = useState({
    openingBalance: 0,
    dailyIncome: 0,
    totalBalance: 0,
    dailyExpenses: 0,
    closingBalance: 0,
  });
  const [previousDayClosingBalance, setPreviousDayClosingBalance] = useState(0);

  const formik = useFormik({
    initialValues: {},
    onSubmit: async (values, { resetForm }) => {},
  });

  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const fetchPreviousDayClosingBalance = async (date) => {
    try {
      const prevDate = date.subtract(1, "day").format("YYYY-MM-DD");
      const response = await coreAxios.get(`/daily-summary/${prevDate}`);
      if (response.status === 200) {
        setPreviousDayClosingBalance(response.data.closingBalance || 0);
      }
    } catch (error) {
      setPreviousDayClosingBalance(0);
    }
  };

  const fetchBookingsByDate = async (date) => {
    setLoading(true);
    try {
      await fetchPreviousDayClosingBalance(date);

      const formattedDate = date.format("YYYY-MM-DD");
      const response = await coreAxios.get(
        `/bookings/check-in/${formattedDate}`
      );

      if (response.status === 200) {
        const data = response.data.data || {
          regularInvoice: [],
          unPaidInvoice: [],
        };

        // Filter out unpaid invoices that are already in regular invoices
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

        // Process regular invoices
        data.regularInvoice?.forEach((booking) => {
          const dateEntry = booking.invoiceDetails?.find((entry) =>
            isSameDay(new Date(entry.date), date.toDate())
          );

          initialValues[booking._id] = {
            totalPaid: booking.totalPaid || 0,
            dailyAmount: dateEntry?.dailyAmount || 0,
          };
        });

        // Process unpaid invoices
        filteredUnpaidInvoices?.forEach((booking) => {
          const dateEntry = booking.invoiceDetails?.find((entry) =>
            isSameDay(new Date(entry.date), date.toDate())
          );

          initialValues[booking._id] = {
            totalPaid: booking.totalPaid || 0,
            dailyAmount: dateEntry?.dailyAmount || 0,
          };
        });

        formik.setValues(initialValues);

        // Calculate daily income (total daily amount)
        const regularIncome = data.regularInvoice?.reduce((sum, booking) => {
          const dateEntry = booking.invoiceDetails?.find((entry) =>
            isSameDay(new Date(entry.date), date.toDate())
          );
          return sum + (dateEntry?.dailyAmount || 0);
        }, 0);

        const unpaidIncome = filteredUnpaidInvoices?.reduce((sum, booking) => {
          const dateEntry = booking.invoiceDetails?.find((entry) =>
            isSameDay(new Date(entry.date), date.toDate())
          );
          return sum + (dateEntry?.dailyAmount || 0);
        }, 0);

        const dailyIncome = (regularIncome || 0) + (unpaidIncome || 0);

        // Calculate daily summary based on new requirements
        const openingBalance = previousDayClosingBalance;
        const totalBalance = openingBalance + dailyIncome;
        const dailyExpenses = 0; // Temporary value
        const closingBalance = totalBalance - dailyExpenses;

        setDailySummary({
          openingBalance,
          dailyIncome,
          totalBalance,
          dailyExpenses,
          closingBalance,
        });
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
      const dailyAmount = formik.values[bookingId]?.dailyAmount || 0;

      // Find the booking to get totalBill
      const booking = [
        ...bookings.regularInvoice,
        ...bookings.unPaidInvoice,
      ].find((b) => b._id === bookingId);

      if (!booking) {
        throw new Error("Booking not found");
      }

      // Calculate new totalPaid (current total + new daily amount)
      const currentTotalPaid = booking.totalPaid || 0;
      const newTotalPaid = currentTotalPaid + dailyAmount;
      const newDuePayment = (booking.totalBill || 0) - newTotalPaid;

      const response = await coreAxios.put(`/booking/details/${bookingId}`, {
        totalPaid: newTotalPaid,
        duePayment: newDuePayment,
        dailyAmount: dailyAmount,
        searchDate: selectedDate.toDate(),
      });

      if (response.status === 200) {
        message.success("Payment updated successfully");
        await fetchBookingsByDate(selectedDate);
      }
    } catch (error) {
      message.error("Failed to update payment");
    } finally {
      setSubmitting((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const getCumulativeTotals = (booking) => {
    if (!booking.invoiceDetails || !Array.isArray(booking.invoiceDetails)) {
      return {
        totalPaid: booking.totalPaid || 0,
        dailyAmount: booking.dailyAmount || 0,
        dueAmount: (booking.totalBill || 0) - (booking.totalPaid || 0),
      };
    }

    const sumTotalPaid = booking.invoiceDetails.reduce(
      (sum, entry) => sum + (entry.totalPaid || 0),
      0
    );

    return {
      totalPaid: sumTotalPaid,
      dailyAmount: booking.dailyAmount || 0,
      dueAmount: (booking.totalBill || 0) - sumTotalPaid,
    };
  };

  useEffect(() => {
    fetchBookingsByDate(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (date) => setSelectedDate(date);
  const handlePreviousDay = () =>
    setSelectedDate((prev) => prev.subtract(1, "day"));
  const handleNextDay = () => setSelectedDate((prev) => prev.add(1, "day"));

  // Calculate totals for regular invoices
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
      };
    },
    { totalBill: 0, totalPaid: 0, dailyAmount: 0, dueAmount: 0 }
  );

  // Calculate totals for unpaid invoices
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
      };
    },
    { totalBill: 0, totalPaid: 0, dailyAmount: 0, dueAmount: 0 }
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
                  <td colSpan="15" className="text-center p-4">
                    <Spin tip="Loading data..." />
                  </td>
                </tr>
              ) : bookings.regularInvoice?.length === 0 &&
                bookings.unPaidInvoice?.length === 0 ? (
                <tr>
                  <td colSpan="15" className="text-center p-4">
                    <Alert message="No bookings found" type="info" />
                  </td>
                </tr>
              ) : (
                <>
                  {/* Regular Invoices */}
                  {bookings.regularInvoice?.map((booking, index) => {
                    const totals = getCumulativeTotals(booking);
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
                          {booking.roomNumberName || "-"}
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
                          {booking.paymentMethod === "bkash"
                            ? booking.advancePayment
                            : "-"}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {booking.paymentMethod === "bank"
                            ? booking.advancePayment
                            : "-"}
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
                            value={formik.values[booking._id]?.dailyAmount || 0}
                            onChange={(value) =>
                              formik.setFieldValue(
                                `${booking._id}.dailyAmount`,
                                value
                              )
                            }
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
                        <td className="border border-green-600 p-2 text-center">
                          -
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          -
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
                        <td colSpan="15" className="p-2"></td>
                      </tr>
                    </>
                  )}

                  {/* Unpaid Invoices Header */}
                  {bookings.unPaidInvoice?.length > 0 && (
                    <tr style={{ backgroundColor: "#fffacd" }}>
                      <td
                        colSpan="15"
                        className="border border-green-600 p-2 text-center font-bold">
                        UNPAID INVOICES
                      </td>
                    </tr>
                  )}

                  {/* Unpaid Invoices */}
                  {bookings.unPaidInvoice?.map((booking, index) => {
                    const totals = getCumulativeTotals(booking);
                    return (
                      <tr
                        key={booking._id}
                        className="hover:bg-gray-50"
                        style={{ backgroundColor: "rgba(255, 255, 0, 0.3)" }}>
                        <td className="border border-green-600 p-2 text-center">
                          {index + 1}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {booking.roomNumberName || "-"}
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
                          {booking.paymentMethod === "bkash"
                            ? booking.advancePayment
                            : "-"}
                        </td>
                        <td className="border border-green-600 p-2 text-center">
                          {booking.paymentMethod === "bank"
                            ? booking.advancePayment
                            : "-"}
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
                            value={formik.values[booking._id]?.dailyAmount || 0}
                            onChange={(value) =>
                              formik.setFieldValue(
                                `${booking._id}.dailyAmount`,
                                value
                              )
                            }
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
                      <td className="border border-green-600 p-2 text-center">
                        -
                      </td>
                      <td className="border border-green-600 p-2 text-center">
                        -
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

      {/* Daily Summary Table */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Daily Summary</h3>
        <table className="w-full max-w-md border border-green-600">
          <thead>
            <tr style={{ backgroundColor: "#4CAF50", color: "white" }}>
              <th className="border border-green-600 p-2 text-left">Item</th>
              <th className="border border-green-600 p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-green-600 p-2">Opening Balance</td>
              <td className="border border-green-600 p-2 text-right">
                {dailySummary.openingBalance}
              </td>
            </tr>
            <tr>
              <td className="border border-green-600 p-2">Daily Income</td>
              <td className="border border-green-600 p-2 text-right">
                {dailySummary.dailyIncome}
              </td>
            </tr>
            <tr>
              <td className="border border-green-600 p-2 font-bold">
                Total Balance
              </td>
              <td className="border border-green-600 p-2 text-right font-bold">
                {dailySummary.totalBalance}
              </td>
            </tr>
            <tr>
              <td className="border border-green-600 p-2">Daily Expenses</td>
              <td className="border border-green-600 p-2 text-right">
                {dailySummary.dailyExpenses}
              </td>
            </tr>
            <tr>
              <td className="border border-green-600 p-2 font-bold">
                Closing Balance
              </td>
              <td className="border border-green-600 p-2 text-right font-bold">
                {dailySummary.closingBalance}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyStatement;
