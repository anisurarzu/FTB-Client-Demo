"use client";

import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { Alert, Button, QRCode, Spin, Watermark, message } from "antd";
import html2pdf from "html2pdf.js";
import axios from "axios";
import Image from "next/image";
import coreAxios from "@/utils/axiosInstance";
import moment from "moment"; // Add moment for date formatting

const Invoice = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({
    totalAdvance: 0,
    extraBedTotalBill: 0,
    kitchenTotalBill: 0,
    totalDue: 0,
    totalBill: 0,
    finalTotal: 0,
  });
  const { id } = params;

  const fetchInvoiceInfo = async () => {
    try {
      setLoading(true);
      const response = await coreAxios.get(`/bookings/bookingNo/${id}`);
      if (response?.status === 200) {
        // Filter out items where statusID is 255
        const filteredData = response?.data.filter(
          (item) => item.statusID !== 255
        );

        calculateTotals(filteredData); // Calculate totals with filtered data
        setData(filteredData); // Set state with filtered data
        setLoading(false);
      } else {
        message.error("Failed to load data");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Error fetching data");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceInfo();
  }, []);

  const print = () => {
    const printContent = document.getElementById("invoice-card").innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
  };

  const downloadPDF = () => {
    const element = document.getElementById("invoice-card");
    const options = {
      margin: 0.5,
      filename: `Invoice-${data?.[0]?.bookingNo}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().from(element).set(options).save();
  };

  const calculateTotals = (bookings) => {
    const totalAdvance = bookings.reduce(
      (sum, booking) => sum + (booking?.advancePayment || 0),
      0
    );
    const totalDue = bookings.reduce(
      (sum, booking) => sum + (booking?.duePayment || 0),
      0
    );
    const totalBill = bookings.reduce(
      (sum, booking) => sum + (booking?.totalBill || 0),
      0
    );
    const kitchenTotalBill = bookings.reduce(
      (sum, booking) => sum + (booking?.kitchenTotalBill || 0),
      0
    );
    const extraBedTotalBill = bookings.reduce(
      (sum, booking) => sum + (booking?.extraBedTotalBill || 0),
      0
    );
    const finalTotal = totalBill + kitchenTotalBill + extraBedTotalBill;

    setTotals({
      totalAdvance,
      totalDue,
      totalBill,
      kitchenTotalBill,
      extraBedTotalBill,
      finalTotal,
    });
  };

  return (
    <Watermark
      content={`${
        data?.[0]?.hotelID === 1
          ? "Mermaid 2024"
          : data?.[0]?.hotelID === 2
          ? "Hotel Golden Hill"
          : data?.[0]?.hotelID === 3
          ? "Sea Paradise"
          : data?.[0]?.hotelID === 4
          ? "Shopno Bilash Holiday Suites"
          : "Samudra Bari 2024"
      }`}>
      {loading ? (
        <Spin tip="Loading...">
          <Alert
            message="Alert message title"
            description="Further details about the context of this alert."
            type="info"
          />
        </Spin>
      ) : (
        <div>
          <div className="mx-28">
            <div className="flex gap-8 w-full mt-8 mx-0">
              <Button
                type="primary"
                onClick={downloadPDF}
                className="p-mr-2"
                icon={<DownloadOutlined />}>
                Download PDF
              </Button>
              <Button
                type="primary"
                onClick={print}
                className="p-mb-3"
                icon={<PrinterOutlined />}>
                Print
              </Button>
            </div>
          </div>

          <div
            id="invoice-card"
            className="bg-white p-8 rounded-lg shadow-md border border-gray-300 w-full mt-4"
            style={{ fontSize: "12px" }} // Make the overall text smaller
          >
            <div>
              <div className="grid grid-cols-3 gap-4">
                <div className="logo-container flex items-center justify-center">
                  {data?.[0]?.hotelID === 1 ? (
                    <Image
                      src="/images/marmaid-logo.png"
                      alt="Logo"
                      width={150}
                      height={60}
                    />
                  ) : data?.[0]?.hotelID === 2 ? (
                    <Image
                      src="/images/goldenhil.png"
                      alt="Logo"
                      width={150}
                      height={60}
                    />
                  ) : data?.[0]?.hotelID === 3 ? (
                    <Image
                      src="/images/seaParaadise.png"
                      alt="Logo"
                      width={180}
                      height={80}
                    />
                  ) : data?.[0]?.hotelID === 4 ? (
                    <Image
                      src="/images/Sopno.png"
                      alt="Logo"
                      width={180}
                      height={80}
                    />
                  ) : (
                    <Image
                      src="/images/Shamudro-Bari.png"
                      alt="Logo"
                      width={180}
                      height={80}
                    />
                  )}
                </div>
                <div className="mt-8 text-center">
                  <h4
                    className={`uppercase ${
                      data?.[0]?.hotelID === 1
                        ? "text-blue-700"
                        : data?.[0]?.hotelID === 4
                        ? "text-[#2B388F]"
                        : "text-red-700"
                    } font-semibold text-xl`}>
                    {data?.[0]?.hotelName} INVOICE
                  </h4>
                </div>
                {data?.[0]?.hotelID === 1 ? (
                  <div className="text-center">
                    <div className="mt-8 text-black text-left">
                      <p>
                        Address: Block # A, Plot # 17, Kolatoli Main Road, Cox’s
                        Bazar 4700
                      </p>
                      <p>Front Desk no: 01818083949</p>
                      <p>Reservation no: 01898841012</p>
                    </div>
                  </div>
                ) : data?.[0]?.hotelID === 2 ? (
                  <div className="text-center">
                    <div className="mt-8 text-black text-left">
                      <p>
                        {`Address: Plot #65, Block# B, Sugandha Point, Kolatoli, Cox's Bazar`}
                      </p>
                      <p>Front Desk no: 01313708031</p>
                      <p>Reservation no: 01898841013</p>
                    </div>
                  </div>
                ) : data?.[0]?.hotelID === 3 ? (
                  <div className="text-center">
                    <div className="mt-8 text-black text-left">
                      <p>
                        {` Address: Kolatoli Beach Road, Kolatoli Cox's Bazar-4700.`}
                      </p>
                      <p>Front Desk no: 01898841012</p>
                      <p>Reservation no: 01321143586</p>
                    </div>
                  </div>
                ) : data?.[0]?.hotelID === 4 ? (
                  <div className="mt-8 text-black text-left">
                    <p>
                      {`Address: Shopno Bilash Holiday Suites, Block # A, Plot #
                      28, kolatoli Residential Area, Cox's Bazar`}
                    </p>
                    <p>Front Desk no: 01711877621</p>
                    <p>Reservation no: 01898841013</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mt-8 text-black text-left">
                      <p>
                        Address: N.H.A building No- 09, Samudra Bari, Kolatoli,
                        Cox’s Bazar
                      </p>
                      <p>Front Desk no: 01886628295</p>
                      <p>Reservation no: 01886628296</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <h3
                  className={`font-bold ${
                    data?.[0]?.hotelID === 1
                      ? "text-blue-700"
                      : data?.[0]?.hotelID === 4
                      ? "text-[#2B388F]"
                      : "text-red-700"
                  } `}>
                  Invoice Number: {data?.[0]?.bookingNo || "N/A"}
                </h3>
                <p
                  className={`${
                    data?.[0]?.hotelID === 1
                      ? "text-blue-700"
                      : data?.[0]?.hotelID === 4
                      ? "text-[#2B388F]"
                      : "text-red-700"
                  }  font-bold`}>
                  Booking Date:
                  {moment(data?.[0]?.createTime).format("D MMM YYYY") ||
                    "02 October 2024"}
                </p>
              </div>

              <div className="mt-8 text-black">
                <p className="font-bold text-md">Bill To:</p>
                <p>Guest Name: {data?.[0]?.fullName || "Ahmed Niloy"}</p>
                <p>Phone: {data?.[0]?.phone || "01625441918"}</p>
                {data[0]?.email && (
                  <p>Email: {data?.[0]?.email || "01625441918"}</p>
                )}
                <p>NID/Passport: {data?.[0]?.nidPassport || "3762373821"}</p>
                <p>
                  Address: {data?.[0]?.address || "Jinjira, Keranigong, Dhaka"}
                </p>
              </div>

              {/* Table for Booking Details */}
              <div className="mt-8 text-black">
                <p className="font-bold text-md">Booking Details:</p>
                <table
                  className="table-auto w-full border-collapse border border-gray-400 mt-4 text-left text-xs" // Smaller text
                  style={{ fontSize: "10px" }} // Reduce text size within the table further
                >
                  <thead>
                    <tr
                      className={`${
                        data?.[0]?.hotelID === 1
                          ? "bg-blue-700"
                          : data?.[0]?.hotelID === 4
                          ? "bg-[#2B388F]"
                          : "bg-red-700"
                      } text-white`}>
                      <th className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                        Room
                      </th>
                      <th className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                        Check-in
                      </th>
                      <th className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                        Check-out
                      </th>
                      <th className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                        Nights
                      </th>
                      <th className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                        Adults
                      </th>
                      <th className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                        Children
                      </th>

                      <th className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                        Bill (Per Night)
                      </th>
                      <th className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                        Bill
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.map((booking, index) => (
                      <tr key={index}>
                        <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                          {` ${booking?.roomCategoryName || "N/A"}`}
                        </td>
                        <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                          {moment(booking?.checkInDate).format("D MMM YYYY") ||
                            "N/A"}
                        </td>
                        <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                          {moment(booking?.checkOutDate).format("D MMM YYYY") ||
                            "N/A"}
                        </td>
                        <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                          {booking?.nights || "N/A"}
                        </td>
                        <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                          {booking?.adults || "N/A"}
                        </td>
                        <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                          {booking?.children || "N/A"}
                        </td>
                        {/* <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                          {booking?.isKitchen ? "Yes" : "No"}
                        </td>
                        {data?.[0]?.hotelID === 4 && (
                          <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                            {booking?.extraBed ? "Yes" : "No"}
                          </td>
                        )} */}

                        <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                          {booking?.roomPrice || "N/A"}
                        </td>
                        <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                          {booking?.totalBill || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 text-black">
                <p className="font-bold text-md">Additional Details</p>
                <table
                  className="table-auto w-full border-collapse border border-gray-400 mt-4 text-left text-xs"
                  style={{ fontSize: "10px" }}>
                  <thead>
                    {data?.some((booking) => booking.isKitchen) && ( // Check if isKitchen is true for any row
                      <tr className="bg-blue-700 text-white">
                        <th className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                          Kitchen Facilities
                        </th>
                        <th className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                          Bill (Kitchen)
                        </th>
                      </tr>
                    )}
                    {data?.some((booking) => booking.extraBed) && ( // Check if extraBed is true for any row
                      <tr className="bg-green-700 text-white">
                        <th className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                          Extra Bed
                        </th>
                        <th className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                          Bill (Extra Bed)
                        </th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {data
                      ?.filter(
                        (booking) => booking.isKitchen || booking.extraBed
                      ) // Filter rows where either condition is true
                      .map((booking, index) => (
                        <>
                          {booking.isKitchen && ( // Render only if isKitchen is true
                            <tr key={`kitchen-${index}`}>
                              <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                                Yes
                              </td>
                              <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                                {booking.kitchenTotalBill || "N/A"}
                              </td>
                            </tr>
                          )}
                          {booking.extraBed && ( // Render only if extraBed is true
                            <tr key={`extrabed-${index}`}>
                              <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                                Yes
                              </td>
                              <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                                {booking.extraBedTotalBill || "N/A"}
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                  </tbody>
                </table>
              </div>

              <p className="font-bold text-md mt-2 text-black">
                Note: {data?.[0]?.note}
              </p>

              <div className="mt-8 text-black">
                <p className="font-bold text-md">Payment Information:</p>
                <p>Total Bill: {totals?.totalBill} taka</p>
                <p>Total Advance: {totals.totalAdvance} taka</p>
                <p>Total Due: {totals.totalDue} taka</p>
                <p>Payment Method: {data?.[0]?.paymentMethod} </p>
                <p>Transaction ID: {data?.[0]?.transactionId} </p>
              </div>

              <div className="mt-8 text-black">
                <p className="py-1">
                  Booked by: {data?.[0]?.bookedByID || "N/A"}
                </p>
                <p className="py-1">
                  {data?.[0]?.hotelID === 1
                    ? "Check in - 1.00 PM & Check out - 11:00 AM"
                    : data?.[0]?.hotelID === 2
                    ? "Check in - 1.00 PM & Check out - 11:00 AM"
                    : data?.[0]?.hotelID === 4
                    ? "11:30 AM & Check out - 11:00 AM "
                    : data?.[0]?.hotelID === 3
                    ? "Check-in 2 PM & Check out - 12 PM "
                    : "Check in - 12:30 PM & Check out - 11:00 AM"}
                </p>
              </div>
              <p className="text-black">
                Thank you so much for choosing {data?.[0]?.hotelName}. Hope you
                will enjoy your stay with us. Best of luck for your Cox’s Bazar
                trip.
              </p>
            </div>
          </div>
        </div>
      )}
    </Watermark>
  );
};

export default Invoice;
