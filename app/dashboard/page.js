"use client";

import { Layout, Menu, Button, Spin, Drawer, Avatar } from "antd";
import {
  DashboardOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  LogoutOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  UnorderedListOutlined,
  MenuOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import DashboardHome from "@/component/DashboardHome";
import AgentInformation from "@/component/AgentInformation";
import HotelCategory from "@/component/HotelCategory";
import HotelInformation from "@/component/HotelInformation";
import HotelRoom from "@/component/HotelRoom";
import BookingInfo from "@/component/BookingInfo";
import Calender from "@/component/Calender";
import RoomAvailabilityPage from "@/component/RoomSearchPage";
import AllBookingInfo from "@/component/AllBookingInfo";

const { Header, Sider, Content } = Layout;

const rolePermissions = {
  superadmin: [
    {
      key: "1",
      label: "Dashboard",
      icon: <DashboardOutlined />,
      component: <DashboardHome />,
    },

    {
      key: "7",
      label: "Calendar",
      icon: <CalendarOutlined />,
      component: <Calender />,
    },
    {
      key: "9",
      label: "Room Availability",
      icon: <DashboardOutlined />,
      component: <RoomAvailabilityPage />,
    },
    {
      key: "6",
      label: "Booking Info",
      icon: <InfoCircleOutlined />,
      component: <BookingInfo />,
    },
    {
      key: "10",
      label: "Report Dashboard",
      icon: <InfoCircleOutlined />,
      component: <AllBookingInfo />,
    },
    // {
    //   key: "3",
    //   label: "Flat/Room Type",
    //   icon: <ApartmentOutlined />,
    //   component: <HotelCategory />,
    // },
    // {
    //   key: "4",
    //   label: "Flat/Room No",
    //   icon: <UnorderedListOutlined />,
    //   component: <HotelRoom />,
    // },
    {
      key: "5",
      label: "Hotel Info",
      icon: <FileTextOutlined />,
      component: <HotelInformation />,
    },
    {
      key: "2",
      label: "Users",
      icon: <UsergroupAddOutlined />,
      component: <AgentInformation />,
    },

    { key: "8", label: "Settings", icon: <SettingOutlined />, component: null },
  ],
  agentadmin: [
    {
      key: "1",
      label: "Dashboard",
      icon: <DashboardOutlined />,
      component: <DashboardHome />,
    },
    {
      key: "7",
      label: "Calendar",
      icon: <CalendarOutlined />,
      component: <Calender />,
    },
    {
      key: "9",
      label: "Room Availability",
      icon: <DashboardOutlined />,
      component: <RoomAvailabilityPage />,
    },
    {
      key: "6",
      label: "Booking Info",
      icon: <InfoCircleOutlined />,
      component: <BookingInfo />,
    },
    // {
    //   key: "10",
    //   label: "All Booking Info",
    //   icon: <InfoCircleOutlined />,
    //   component: <AllBookingInfo />,
    // },
  ],
  hoteladmin: [
    {
      key: "1",
      label: "Dashboard",
      icon: <DashboardOutlined />,
      component: <DashboardHome />,
    },
    {
      key: "7",
      label: "Calendar",
      icon: <CalendarOutlined />,
      component: <Calender />,
    },
    {
      key: "9",
      label: "Room Availability",
      icon: <DashboardOutlined />,
      component: <RoomAvailabilityPage />,
    },
    {
      key: "6",
      label: "Booking Info",
      icon: <InfoCircleOutlined />,
      component: <BookingInfo />,
    },
    // {
    //   key: "10",
    //   label: "All Booking Info",
    //   icon: <InfoCircleOutlined />,
    //   component: <AllBookingInfo />,
    // },
  ],
  admin: [
    {
      key: "1",
      label: "Dashboard",
      icon: <DashboardOutlined />,
      component: <DashboardHome />,
    },
    {
      key: "9",
      label: "Room Availability",
      icon: <DashboardOutlined />,
      component: <RoomAvailabilityPage />,
    },
    {
      key: "7",
      label: "Calendar",
      icon: <CalendarOutlined />,
      component: <Calender />,
    },
    {
      key: "6",
      label: "Booking Info",
      icon: <SettingOutlined />,
      component: <BookingInfo />,
    },
    {
      key: "10",
      label: "Report Dashboard",
      icon: <InfoCircleOutlined />,
      component: <AllBookingInfo />,
    },
    {
      key: "5",
      label: "Hotel Info",
      icon: <FileTextOutlined />,
      component: <HotelInformation />,
    },
    {
      key: "2",
      label: "Users",
      icon: <UsergroupAddOutlined />,
      component: <AgentInformation />,
    },
  ],
  // Other roles omitted for brevity...
};

const Dashboard = ({ sliders }) => {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("1");
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }

    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [router, selectedMenu]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    router.push("/login");
  };

  const showDrawer = () => setVisible(true);
  const onClose = () => setVisible(false);

  const renderContent = () => {
    const userRole = userInfo?.role?.value;
    const allowedPages = rolePermissions[userRole] || [];
    const selectedPage = allowedPages.find((page) => page.key === selectedMenu);
    return selectedPage ? selectedPage.component : <div>Access Denied</div>;
  };

  const renderMenuItems = () => {
    if (!userInfo) return null;

    const userRole = userInfo?.role?.value;
    const allowedPages = rolePermissions[userRole] || [];

    return (
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedMenu]}
        onClick={(e) => setSelectedMenu(e.key)}
        className="bg-white">
        {allowedPages.map((page) => (
          <Menu.Item key={page.key} icon={page.icon} className="bg-white">
            <span className="text-black font-medium">{page.label}</span>
          </Menu.Item>
        ))}
      </Menu>
    );
  };

  return (
    <Layout className="min-h-screen">
      {/* Sidebar for Desktop */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="site-layout-background hidden lg:block">
        <div className="logo-container py-2 flex items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="Logo"
            width={collapsed ? 50 : 120}
            height={collapsed ? 25 : 40}
          />
        </div>

        {/* Render the menu items based on user role */}
        {renderMenuItems()}
      </Sider>

      {/* Drawer for Mobile */}
      <Drawer
        title="Menu"
        placement="left"
        onClose={onClose}
        open={visible}
        width="50vw" // Covers 3/4 of the viewport width
        bodyStyle={{ padding: 0 }}>
        {renderMenuItems()}
      </Drawer>

      <Layout className="site-layout">
        <Header
          style={{
            background: "linear-gradient(45deg, #8A99EB, #9DE1FB, #AFC7F3)",
          }}
          className="flex justify-between items-center pr-8 py-4 shadow-md">
          <Button
            icon={<MenuOutlined />}
            className="lg:hidden"
            onClick={showDrawer}
          />
          <h1 className="text-xl lg:text-2xl font-bold text-white px-2">
            Fast Track Booking
          </h1>
          <div className="flex items-center space-x-4">
            {userInfo && (
              <div className="relative flex items-center space-x-2">
                <Avatar
                  src={userInfo.image}
                  alt={userInfo.username}
                  size={40}
                  className="hidden lg:block"
                />
                <span className="text-white">{userInfo.username}</span>
              </div>
            )}
            <Button
              icon={<LogoutOutlined />}
              type="primary"
              className="bg-[#8EABEF] text-white border-none hover:bg-[#7DA54E]"
              onClick={handleLogout}
            />
          </div>
        </Header>

        <Content className="m-4 lg:m-6 p-4 lg:p-6 bg-white rounded-lg shadow-lg">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Spin size="large" />
            </div>
          ) : (
            renderContent()
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
