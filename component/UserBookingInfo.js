import React from "react";

import {
  Card,
  Col,
  Row,
  Statistic,
  Typography,
  Alert,
  Spin,
  Select,
  message,
  Table,
} from "antd";
const { Title } = Typography;

export default function UserBookingInfo({ userTableData, title }) {
  return (
    <div>
      {" "}
      <div className="bg-white p-4 lg:p-6 rounded-lg shadow-lg mt-4">
        <Title
          level={4}
          className="text-[#8ABF55] mb-4 text-center lg:text-left">
          {title}
        </Title>

        {/* Responsive Table */}
        <div className="relative overflow-x-auto shadow-md">
          <div style={{ overflowX: "auto" }}>
            <table className="w-full text-xs text-left rtl:text-right dark:text-gray-400">
              {/* Table Header */}
              <thead>
                <tr style={{ backgroundColor: "#8CA0ED", color: "white" }}>
                  <th className="border border-tableBorder text-center p-2">
                    User ID
                  </th>
                  <th className="border border-tableBorder text-center p-2">
                    {`Today's Booking`}
                  </th>
                  <th className="border border-tableBorder text-center p-2">
                    Last 7 Days Booking
                  </th>
                  <th className="border border-tableBorder text-center p-2">
                    Last 30 Days Booking
                  </th>
                  <th className="border border-tableBorder text-center p-2">
                    Overall Booking
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {userTableData?.map((user, index) => (
                  <tr
                    key={user.key}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#9CDFFB" : "#ABCDF5",
                      transition: "background-color 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#8CA0ED")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        index % 2 === 0 ? "#9CDFFB" : "#ABCDF5")
                    }>
                    <td className="border border-tableBorder text-center p-2">
                      {user.username}
                    </td>
                    <td className="border border-tableBorder text-center p-2">
                      {user.totalBillForTodayByFTB}
                    </td>
                    <td className="border border-tableBorder text-center p-2">
                      {user.totalBillForUserLast7Days}
                    </td>
                    <td className="border border-tableBorder text-center p-2">
                      {user.totalBillForLast30DaysByFTB}
                    </td>
                    <td className="border border-tableBorder text-center p-2">
                      {user.totalBillOverall}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
