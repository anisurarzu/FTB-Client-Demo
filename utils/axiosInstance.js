// /utils/axiosInstance.js
import axios from "axios";

const coreAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_MAIN_URL,
  headers: { "Access-Control-Allow-Origin": "*" },
});

coreAxios.interceptors.request.use((req) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    req.headers.authorization = "Bearer " + token;
  }
  return req;
});

coreAxios.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      // Redirecting on client-side
      if (typeof window !== "undefined") {
        window.location.href = "/login";
        localStorage.clear();
      }
      return Promise.reject(error);
    } else {
      return Promise.reject(error);
    }
  }
);

export default coreAxios;
