"use client";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Input, Button, Radio, Upload, message, Spin } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { useState } from "react";


const { Dragger } = Upload;

const Register = () => {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  const validationSchema = Yup.object({
    username: Yup.string().required("Username is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm Password is required"),
    gender: Yup.string().required("Gender is required"),
    image: Yup.mixed().required("Image is required"),
  });

  const handleImageUpload = async (imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=0d928e97225b72fcd198fa40d99a15d5`,
        formData
      );
      return response.data.data.url;
    } catch (error) {
      console.error("Image upload failed:", error);
      message.error("Image upload failed. Please try again.");
      return null;
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true);
    setUploading(true);

    // Upload the image to imgbb first
    const imageUrl = await handleImageUpload(values.image);

    if (!imageUrl) {
      setUploading(false);
      setSubmitting(false);
      return;
    }

    try {
      // Proceed with the registration after successful image upload
      const response = await axios.post(
        "https://archilawn-server.onrender.com/api/auth/register",
        {
          username: values.username,
          email: values.email,
          password: values.password,
          gender: values.gender,
          image: imageUrl, // Use the imgbb image URL
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      localStorage.setItem("token", data.token);
      localStorage.setItem("userInfo", JSON.stringify(data.user));
      message.success("Registration successful!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
      message.error("Registration failed. Please try again.");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <div>
     
      <div className="flex justify-center items-center min-h-screen bg-gray-100 relative pt-20">
        <div className="absolute inset-0 z-0 ">
          <Image
            src="/images/bg-01.jpg"
            alt="Architecture Background"
            layout="fill"
            objectFit="cover"
            quality={100}
          />
        </div>
        <div className="bg-white bg-opacity-90 p-8 rounded-lg shadow-lg max-w-lg w-full z-10">
          <h2 className="text-3xl font-semibold text-center text-gray-800 mb-8">
            Register
          </h2>
          <Formik
            initialValues={{
              username: "",
              email: "",
              password: "",
              confirmPassword: "",
              gender: "",
              image: null,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}>
            {({ isSubmitting, setFieldValue }) => (
              <Form className="space-y-8">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-gray-700 font-medium mb-2">
                    Username
                  </label>
                  <Field
                    name="username"
                    type="text"
                    as={Input}
                    placeholder="Enter your username"
                    className="p-4 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#8ABF55] focus:border-transparent w-full"
                    size="large"
                  />
                  <ErrorMessage
                    name="username"
                    component="div"
                    className="text-red-500 text-sm mt-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-gray-700 font-medium mb-2">
                    Email
                  </label>
                  <Field
                    name="email"
                    type="email"
                    as={Input}
                    placeholder="Enter your email"
                    className="p-4 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#8ABF55] focus:border-transparent w-full"
                    size="large"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-sm mt-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-gray-700 font-medium mb-2">
                    Password
                  </label>
                  <Field
                    name="password"
                    type="password"
                    as={Input.Password}
                    placeholder="Enter your password"
                    className="p-4 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#8ABF55] focus:border-transparent w-full"
                    size="large"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-sm mt-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-gray-700 font-medium mb-2">
                    Confirm Password
                  </label>
                  <Field
                    name="confirmPassword"
                    type="password"
                    as={Input.Password}
                    placeholder="Confirm your password"
                    className="p-4 rounded-lg border-gray-300 focus:ring-2 focus:ring-[#8ABF55] focus:border-transparent w-full"
                    size="large"
                  />
                  <ErrorMessage
                    name="confirmPassword"
                    component="div"
                    className="text-red-500 text-sm mt-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="gender"
                    className="block text-gray-700 font-medium mb-2">
                    Gender
                  </label>
                  <Field name="gender">
                    {({ field }) => (
                      <Radio.Group
                        {...field}
                        onChange={(e) =>
                          setFieldValue("gender", e.target.value)
                        }
                        className="w-full">
                        <Radio value="male">Male</Radio>
                        <Radio value="female">Female</Radio>
                      </Radio.Group>
                    )}
                  </Field>
                  <ErrorMessage
                    name="gender"
                    component="div"
                    className="text-red-500 text-sm mt-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="image"
                    className="block text-gray-700 font-medium mb-2">
                    Upload Image
                  </label>
                  <Dragger
                    name="image"
                    beforeUpload={(file) => {
                      setFieldValue("image", file);
                      return false; // Prevent auto-upload
                    }}
                    maxCount={1}
                    accept="image/*">
                    {uploading ? (
                      <Spin tip="Uploading..." />
                    ) : (
                      <>
                        <p className="ant-upload-drag-icon">
                          <i className="fas fa-cloud-upload-alt"></i>
                        </p>
                        <p className="ant-upload-text">
                          Click or drag file to this area to upload
                        </p>
                      </>
                    )}
                  </Dragger>
                  <ErrorMessage
                    name="image"
                    component="div"
                    className="text-red-500 text-sm mt-2"
                  />
                </div>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting || uploading}
                  className="w-full py-4 bg-[#8ABF55] hover:bg-[#7DA54E] border-none text-white text-lg rounded-lg">
                  Register
                </Button>
                <div className="text-center text-gray-600 mt-4">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-[#8ABF55] font-medium hover:underline">
                    Login
                  </Link>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
     
    </div>
  );
};

export default Register;
