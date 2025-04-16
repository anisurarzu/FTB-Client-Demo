"use client";

import { useEffect, useState } from "react";
import { InputNumber, Button, message } from "antd";
import coreAxios from "@/utils/axiosInstance";

const DailySummary = ({ selectedDate, dailyIncome }) => {
  const [openingBalance, setOpeningBalance] = useState(0);
  const [dailyExpenses, setDailyExpenses] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch previous day's closing balance
  const fetchOpeningBalance = async () => {
    try {
      const prevDate = selectedDate.subtract(1, "day").format("YYYY-MM-DD");
      const res = await coreAxios.get(`/daily-summary/${prevDate}`);
      if (res.status === 200) {
        const prevClosing = res.data?.closingBalance || 0;
        setOpeningBalance(prevClosing);
      } else {
        setOpeningBalance(0);
      }
    } catch (err) {
      console.error("Failed to fetch previous day summary", err);
      setOpeningBalance(0);
    }
  };

  // Calculate balances when values change
  useEffect(() => {
    const total = openingBalance + dailyIncome;
    const closing = total - dailyExpenses;
    setTotalBalance(total);
    setClosingBalance(closing);
  }, [openingBalance, dailyIncome, dailyExpenses]);

  // Fetch opening balance when date changes
  useEffect(() => {
    fetchOpeningBalance();
  }, [selectedDate]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        date: selectedDate.format("YYYY-MM-DD"),
        openingBalance,
        dailyIncome,
        totalBalance,
        dailyExpenses,
        closingBalance,
      };

      const res = await coreAxios.post("/daily-summary", payload);

      if (res.status === 200 || res.status === 201) {
        message.success("Daily summary saved successfully");
      } else {
        throw new Error("Error saving summary");
      }
    } catch (err) {
      console.error("Save failed", err);
      message.error("Failed to save daily summary");
    } finally {
      setLoading(false);
    }
  };

  return (
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
              {openingBalance}
            </td>
          </tr>
          <tr>
            <td className="border border-green-600 p-2">Daily Income</td>
            <td className="border border-green-600 p-2 text-right">
              {dailyIncome}
            </td>
          </tr>
          <tr>
            <td className="border border-green-600 p-2 font-bold">
              Total Balance
            </td>
            <td className="border border-green-600 p-2 text-right font-bold">
              {totalBalance}
            </td>
          </tr>
          <tr>
            <td className="border border-green-600 p-2">Daily Expenses</td>
            <td className="border border-green-600 p-2 text-right">
              <InputNumber
                min={0}
                value={dailyExpenses}
                onChange={(value) => setDailyExpenses(value || 0)}
                style={{ width: "100%" }}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-green-600 p-2 font-bold">
              Closing Balance
            </td>
            <td className="border border-green-600 p-2 text-right font-bold">
              {closingBalance}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4">
        <Button
          type="primary"
          onClick={handleSave}
          loading={loading}
          style={{ backgroundColor: "#4CAF50" }}>
          Save Summary
        </Button>
      </div>
    </div>
  );
};

export default DailySummary;
