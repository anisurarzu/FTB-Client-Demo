import React from "react";
import Image from "next/image";
import moment from "moment";

export default function InvoiceSamudraBari({ data, totals }) {
  const hotel = data?.[0] || {};
  const isMermaid = hotel.hotelID === 1;

  return (
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
            ) : (
              <Image
                src="/images/Shamudro-Bari.png"
                alt="Logo"
                width={150}
                height={60}
              />
            )}
          </div>
          <div className="mt-8 text-center">
            <h4
              className={`uppercase ${
                data?.[0]?.hotelID === 1 ? "text-blue-700" : "text-red-700"
              } font-semibold text-xl`}>
              {data?.[0]?.hotelName} INVOICE
            </h4>
          </div>
          {data?.[0]?.hotelID === 1 ? (
            <div className="text-center">
              <div className="mt-8 text-black text-left">
                <p>
                  Address: Block # A, Plot # 17, Kolatoli Main Road, Cox’s Bazar
                  4700
                </p>
                <p>Front Desk no: 01818083949</p>
                <p>Reservation no: 01898841012</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="mt-8 text-black text-left">
                <p>
                  Address: N.H.A building No- 09, Samudra Bari, Kolatoli, Cox’s
                  Bazar
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
              data?.[0]?.hotelID === 1 ? "text-blue-700" : "text-red-700"
            } `}>
            Invoice Number: {data?.[0]?.bookingNo || "N/A"}
          </h3>
          <p
            className={`${
              data?.[0]?.hotelID === 1 ? "text-blue-700" : "text-red-700"
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
          <p>NID/Passport: {data?.[0]?.nidPassport || "3762373821"}</p>
          <p>Address: {data?.[0]?.address || "Jinjira, Keranigong, Dhaka"}</p>
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
                  data?.[0]?.hotelID === 1 ? "bg-blue-700" : "bg-red-700"
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
                  {data?.[0]?.hotelID === 1
                    ? "BreakFast Included"
                    : " Kitchen Facilities"}
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
                    {moment(booking?.checkInDate).format("D MMM YYYY") || "N/A"}
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
                  <td className="border border-gray-400 px-2 pb-2 print:pb-0 print:py-1">
                    {booking?.isKitchen ? "Yes" : "No"}
                  </td>

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
        <p className="font-bold text-md mt-2 text-black">
          Note: {data?.[0]?.note}
        </p>

        <div className="mt-8 text-black">
          <p className="font-bold text-md">Payment Information:</p>
          <p>Total Bill: {totals.totalBill} taka</p>
          <p>Total Advance: {totals.totalAdvance} taka</p>
          <p>Total Due: {totals.totalDue} taka</p>
          <p>Payment Method: {data?.[0]?.paymentMethod} </p>
          <p>Transaction ID: {data?.[0]?.transactionId} </p>
        </div>

        <div className="mt-8 text-black">
          <p className="py-1">Booked by: {data?.[0]?.bookedByID || "N/A"}</p>
          <p className="py-1">
            {data?.[0]?.hotelID === 1
              ? "Check in - 1.00 PM & Check out - 11:00 AM"
              : "Check in - 12:30 PM & Check out - 11:00 AM"}
          </p>
        </div>
        <p className="text-black">
          Thank you so much for choosing {data?.[0]?.hotelName}. Hope you will
          enjoy your stay with us. Best of luck for your Cox’s Bazar trip.
        </p>
      </div>
    </div>
  );
}
