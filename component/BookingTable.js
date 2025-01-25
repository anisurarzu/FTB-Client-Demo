import React from "react";
import { Table, Tooltip, Button, Pagination, Popconfirm, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { CopyToClipboard } from "react-copy-to-clipboard";
import dayjs from "dayjs";
import Link from "next/link";

const BookingTable = ({
  bookings,
  pagination,
  setPagination,
  handleEdit,
  handleDelete,
}) => {
  const { current, pageSize } = pagination;

  // Calculate the paginated bookings based on current page and page size
  const startIndex = (current - 1) * pageSize;
  const paginatedBookings = bookings.slice(startIndex, startIndex + pageSize);

  const columns = [
    {
      title: "Booking No.",
      dataIndex: "serialNo",
      key: "serialNo",
      align: "center",
      render: (serialNo, record) => (
        <div className="flex items-center justify-center">
          <Link href={`/dashboard/${record.bookingNo}`} passHref>
            <p className="text-blue-600 cursor-pointer mr-2">
              {record.bookingNo}
            </p>
          </Link>
          <Tooltip title="Click to copy">
            <CopyToClipboard
              text={record.bookingNo}
              onCopy={() => message.success("Copied!")}>
              <CopyOutlined className="cursor-pointer text-blue-600" />
            </CopyToClipboard>
          </Tooltip>
        </div>
      ),
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Invoice No.",
      dataIndex: "invoiceNo",
      key: "invoiceNo",
      align: "center",
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Guest Name",
      dataIndex: "fullName",
      key: "fullName",
      align: "center",
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      align: "center",
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Flat Type",
      dataIndex: "roomCategoryName",
      key: "roomCategoryName",
      align: "center",
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Flat No/Unit",
      dataIndex: "roomNumberName",
      key: "roomNumberName",
      align: "center",
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Booking Date",
      dataIndex: "createTime",
      key: "createTime",
      align: "center",
      render: (createTime) => dayjs(createTime).format("D MMM YYYY"),
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Check In",
      dataIndex: "checkInDate",
      key: "checkInDate",
      align: "center",
      render: (checkInDate) => dayjs(checkInDate).format("D MMM YYYY"),
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Check Out",
      dataIndex: "checkOutDate",
      key: "checkOutDate",
      align: "center",
      render: (checkOutDate) => dayjs(checkOutDate).format("D MMM YYYY"),
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Nights",
      dataIndex: "nights",
      key: "nights",
      align: "center",
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Total",
      dataIndex: "totalBill",
      key: "totalBill",
      align: "center",
      render: (totalBill) => (
        <span className="font-bold text-green-900">{totalBill}</span>
      ),
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Status",
      dataIndex: "statusID",
      key: "statusID",
      align: "center",
      render: (statusID) => (
        <span className={statusID === 255 ? "text-red-600" : "text-green-600"}>
          {statusID === 255 ? "Canceled" : "Confirmed"}
        </span>
      ),
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Confirm/Cancel By",
      dataIndex: "statusID",
      key: "statusID",
      align: "center",
      render: (statusID, record) =>
        statusID === 255 ? record.canceledBy : record.bookedByID,
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Updated By",
      dataIndex: "updatedByID",
      key: "updatedByID",
      align: "center",
      render: (updatedByID, record) =>
        updatedByID
          ? `${updatedByID} ${dayjs(record.updatedAt).format(
              "D MMM, YYYY (h:mm a)"
            )}`
          : "",
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (text, record) =>
        record.statusID === 1 && (
          <div className="flex">
            <Button size="small" onClick={() => handleEdit(record)}>
              Edit
            </Button>
            <Popconfirm
              title="Are you sure to delete this booking?"
              onConfirm={() => handleDelete(record)}>
              <Button type="link" danger size="small">
                Cancel
              </Button>
            </Popconfirm>
          </div>
        ),
      onCell: () => ({
        className: "border border-gray-300 p-2",
      }),
    },
  ];

  return (
    <div className="relative overflow-x-auto shadow-md p-4">
      {/* Table */}
      <Table
        dataSource={paginatedBookings}
        columns={columns}
        rowKey="bookingNo"
        pagination={false} // Disable Ant Design pagination
        size="small"
        rowClassName={(record) =>
          record.statusID === 255 ? "bg-red-50 dark:bg-red-800" : ""
        }
        className="text-xs"
        scroll={{ x: "max-content" }}
      />

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <Pagination
          current={current}
          pageSize={pageSize}
          total={bookings.length} // Total number of items
          onChange={(page, pageSize) => {
            setPagination({ current: page, pageSize }); // Update current page and pageSize
          }}
          showSizeChanger={false} // Optional: set to true if you want to allow size changes
        />
      </div>
    </div>
  );
};

export default BookingTable;
