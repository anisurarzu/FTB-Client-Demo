"use client";

import React, { useState, useEffect } from "react";
import { Image } from "antd";
import Login from "./login/page";

const Page = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // Adjust the delay as needed

    return () => clearTimeout(timer); // Clean up the timer on unmount
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 space-y-4">
        {/* Loading Image using Ant Design */}
        <Image
          src="/images/Animation.gif" // Adjust to the path of your loading image
          alt="Loading..."
          preview={false}
          style={{ width: "130%", height: "auto" }} // Increase maxHeight for larger image
        />

        {/* Animated Loading Text */}
        <p className="text-lg font-semibold text-gray-700 animate-bounce">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="">
      <Login />
    </div>
  );
};

export default Page;
