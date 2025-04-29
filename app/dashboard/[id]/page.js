"use client";

import { PrinterOutlined, DownloadOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import { Button, Spin, Watermark, message } from "antd";
import html2pdf from "html2pdf.js";
import Image from "next/image";
import coreAxios from "@/utils/axiosInstance";
import moment from "moment";

const Invoice = ({ params }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({
    totalPaid: 0,
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
        const filteredData = response?.data.filter(
          (item) => item.statusID !== 255
        );
        calculateTotals(filteredData);
        setData(filteredData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceInfo();
  }, []);

  const generatePDF = () => {
    const element = document.getElementById("invoice-card");
    const options = {
      margin: 10,
      filename: `Invoice-${data?.[0]?.bookingNo}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    return html2pdf().set(options).from(element).toPdf().get("pdf");
  };

  const downloadPDF = async () => {
    try {
      const pdf = await generatePDF();
      pdf.save(`Invoice-${data?.[0]?.bookingNo}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to generate PDF");
    }
  };

  const print = async () => {
    try {
      const pdf = await generatePDF();
      pdf.autoPrint();
      window.open(pdf.output("bloburl"), "_blank");
    } catch (error) {
      console.error("Error printing:", error);
      message.error("Failed to print");
    }
  };

  const calculateTotals = (bookings) => {
    const totalPaid = bookings.reduce(
      (sum, booking) => sum + (booking?.totalPaid || 0),
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
      totalPaid,
      totalDue,
      totalBill,
      kitchenTotalBill,
      extraBedTotalBill,
      finalTotal,
    });
  };

  const getHotelTheme = () => {
    const hotelId = data?.[0]?.hotelID;
    switch (hotelId) {
      case 1:
        return { color: "text-blue-700", bg: "bg-blue-700" };
      case 4:
        return { color: "text-[#2B388F]", bg: "bg-[#2B388F]" };
      case 6:
        return { color: "text-[#6C9944]", bg: "bg-[#6C9944]" };
      default:
        return { color: "text-red-700", bg: "bg-red-700" };
    }
  };

  const theme = getHotelTheme();

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
        <div className="flex justify-center items-center h-screen">
          <Spin size="large" />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex justify-end gap-4 mb-4">
            <Button
              type="primary"
              onClick={downloadPDF}
              icon={<DownloadOutlined />}
              className="shadow-md">
              Download PDF
            </Button>
            <Button
              type="primary"
              onClick={print}
              icon={<PrinterOutlined />}
              className="shadow-md">
              Print
            </Button>
          </div>

          <div
            id="invoice-card"
            className="bg-white p-8 rounded-lg shadow-md border border-gray-300"
            style={{ fontSize: "12px" }}>
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
                  ) : data?.[0]?.hotelID === 6 ? (
                    <img
                      src="https://i.ibb.co.com/jZDnyS4V/beach-gardn.png"
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
                    className={`${theme.color} font-semibold text-xl uppercase`}>
                    {data?.[0]?.hotelName} INVOICE
                  </h4>
                </div>
                {data?.[0]?.hotelID === 1 ? (
                  <div className="text-center">
                    <div className="mt-8 text-black text-left">
                      <p>
                        Address: Block # A, Plot # 17, Kolatoli Main Road, Cox's
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
                        Address: Plot #65, Block# B, Sugandha Point, Kolatoli,
                        Cox's Bazar
                      </p>
                      <p>Front Desk no: 01313708031</p>
                      <p>Reservation no: 01898841013</p>
                    </div>
                  </div>
                ) : data?.[0]?.hotelID === 3 ? (
                  <div className="text-center">
                    <div className="mt-8 text-black text-left">
                      <p>
                        Address: Kolatoli Beach Road, Kolatoli Cox's Bazar-4700.
                      </p>
                      <p>Front Desk no: 01898841012</p>
                      <p>Reservation no: 01321143586</p>
                    </div>
                  </div>
                ) : data?.[0]?.hotelID === 4 ? (
                  <div className="mt-8 text-black text-left">
                    <p>
                      Address: Shopno Bilash Holiday Suites, Block # A, Plot #
                      28, kolatoli Residential Area, Cox's Bazar
                    </p>
                    <p>Front Desk no: 01711877621</p>
                    <p>Reservation no: 01898841013</p>
                  </div>
                ) : data?.[0]?.hotelID === 6 ? (
                  <div className="mt-8 text-black text-left">
                    <p>
                      Address: Plot No-199, Block # B, Saykat Bahumukhi Samabay
                      Samity Ltd. Lighthouse, Kolatoli, Cox's Bazar
                    </p>
                    <p>Front Desk no: 01898841016</p>
                    <p>Reservation no: 01898841015</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mt-8 text-black text-left">
                      <p>
                        Address: N.H.A building No-09, Samudra Bari, Kolatoli,
                        Cox's Bazar
                      </p>
                      <p>Front Desk no: 01886628295</p>
                      <p>Reservation no: 01886628296</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-4">
                <h3 className={`${theme.color} font-bold`}>
                  Invoice Number: {data?.[0]?.bookingNo || "N/A"}
                </h3>
                <p className={`${theme.color} font-bold`}>
                  Booking Date:{" "}
                  {moment(data?.[0]?.createTime).format("D MMM YYYY") || "N/A"}
                </p>
              </div>

              <div className="mt-8 text-black">
                <p className="font-bold text-md">Bill To:</p>
                <p>Guest Name: {data?.[0]?.fullName || "N/A"}</p>
                <p>Phone: {data?.[0]?.phone || "N/A"}</p>
                {data[0]?.email && <p>Email: {data?.[0]?.email}</p>}
                <p>NID/Passport: {data?.[0]?.nidPassport || "N/A"}</p>
                <p>Address: {data?.[0]?.address || "N/A"}</p>
              </div>

              <div className="mt-8 text-black">
                <p className="font-bold text-md">Booking Details:</p>
                <table className="w-full border-collapse border border-gray-400 mt-4 text-xs">
                  <thead>
                    <tr className={`${theme.bg} text-white`}>
                      <th className="p-2 border border-gray-400">Room</th>
                      <th className="p-2 border border-gray-400">Check-in</th>
                      <th className="p-2 border border-gray-400">Check-out</th>
                      <th className="p-2 border border-gray-400">Nights</th>
                      <th className="p-2 border border-gray-400">Adults</th>
                      <th className="p-2 border border-gray-400">Children</th>
                      <th className="p-2 border border-gray-400">
                        Bill (Per Night)
                      </th>
                      <th className="p-2 border border-gray-400">Bill</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.map((booking, index) => (
                      <tr key={index}>
                        <td className="p-2 border border-gray-400">
                          {booking?.roomCategoryName || "N/A"}
                        </td>
                        <td className="p-2 border border-gray-400">
                          {moment(booking?.checkInDate).format("D MMM YYYY") ||
                            "N/A"}
                        </td>
                        <td className="p-2 border border-gray-400">
                          {moment(booking?.checkOutDate).format("D MMM YYYY") ||
                            "N/A"}
                        </td>
                        <td className="p-2 border border-gray-400">
                          {booking?.nights || "N/A"}
                        </td>
                        <td className="p-2 border border-gray-400">
                          {booking?.adults || "N/A"}
                        </td>
                        <td className="p-2 border border-gray-400">
                          {booking?.children || "N/A"}
                        </td>
                        <td className="p-2 border border-gray-400">
                          {booking?.roomPrice || "N/A"}
                        </td>
                        <td className="p-2 border border-gray-400">
                          {booking?.totalBill || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-black">
                <p className="font-bold text-md">Additional Details</p>
                <table className="w-full border-collapse border border-gray-400 mt-2 text-xs">
                  <thead>
                    {data?.some((booking) => booking.isKitchen) && (
                      <tr className="bg-blue-700 text-white">
                        <th className="p-2 border border-gray-400">
                          Kitchen Facilities
                        </th>
                        <th className="p-2 border border-gray-400">
                          Bill (Kitchen)
                        </th>
                      </tr>
                    )}
                    {data?.some((booking) => booking.extraBed) && (
                      <tr className="bg-green-700 text-white">
                        <th className="p-2 border border-gray-400">
                          Extra Bed
                        </th>
                        <th className="p-2 border border-gray-400">
                          Bill (Extra Bed)
                        </th>
                      </tr>
                    )}
                  </thead>
                  <tbody>
                    {data
                      ?.filter(
                        (booking) => booking.isKitchen || booking.extraBed
                      )
                      .map((booking, index) => (
                        <React.Fragment key={index}>
                          {booking.isKitchen && (
                            <tr>
                              <td className="p-2 border border-gray-400">
                                Yes
                              </td>
                              <td className="p-2 border border-gray-400">
                                {booking.kitchenTotalBill || "N/A"}
                              </td>
                            </tr>
                          )}
                          {booking.extraBed && (
                            <tr>
                              <td className="p-2 border border-gray-400">
                                Yes
                              </td>
                              <td className="p-2 border border-gray-400">
                                {booking.extraBedTotalBill || "N/A"}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                  </tbody>
                </table>
              </div>

              {data?.[0]?.note && (
                <p className="font-bold text-md mt-4 text-black">
                  Note: {data?.[0]?.note}
                </p>
              )}

              <div className="mt-8 text-black">
                <p className="font-bold text-md">Payment Information:</p>
                <p>Total Bill: {totals?.totalBill} taka</p>
                <p>Total Paid: {totals.totalPaid} taka</p>
                <p>Total Due: {totals.totalDue} taka</p>
                <div className="mt-2">
                  <p className="font-semibold">Payment Methods:</p>
                  {data?.[0]?.payments?.map((payment, index) => (
                    <div key={index} className="ml-4">
                      <p>
                        {index + 1}. {payment.method}: {payment.amount} taka
                        {payment.transactionId &&
                          payment.transactionId !== "N/A" && (
                            <span>
                              {" "}
                              (Transaction ID: {payment.transactionId})
                            </span>
                          )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 text-black">
                <p>Booked by: {data?.[0]?.bookedByID || "N/A"}</p>
                <p className="mt-2">
                  {data?.[0]?.hotelID === 1
                    ? "Check in - 1.00 PM & Check out - 11:00 AM"
                    : data?.[0]?.hotelID === 2
                    ? "Check in - 1.00 PM & Check out - 11:00 AM"
                    : data?.[0]?.hotelID === 4
                    ? "Check in - 11:30 AM & Check out - 11:00 AM"
                    : data?.[0]?.hotelID === 3
                    ? "Check-in 2 PM & Check out - 12 PM"
                    : data?.[0]?.hotelID === 6
                    ? "Check in - 11:30 PM & Check out - 11:00 AM"
                    : "Check in - 12:30 PM & Check out - 11:00 AM"}
                </p>
              </div>

              <p className="mt-8 text-black">
                Thank you for choosing {data?.[0]?.hotelName}. We hope you enjoy
                your stay with us!
              </p>
            </div>
          </div>
        </div>
      )}
    </Watermark>
  );
};

export default Invoice;
