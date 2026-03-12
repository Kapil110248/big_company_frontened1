import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Button, Drawer, Badge } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  TeamOutlined,
  DollarOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  ShopOutlined,
  HomeOutlined,
  ScanOutlined,
  CreditCardOutlined,
  ApartmentOutlined,
  MenuOutlined,
  CloseOutlined,
  FireOutlined,
  GiftOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ProjectOutlined,
  BookOutlined,
  FileTextOutlined,
  TrophyOutlined,
  UserAddOutlined,
  RocketOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

// Menu items per role
const menuItems: Record<UserRole, { key: string; icon: React.ReactNode; label: string; path: string; mobileLabel?: string }[]> = {
  consumer: [
    { key: 'discover-retailers', icon: <ShopOutlined />, label: 'Find & Link Retailer', path: '/consumer/discover-retailers', mobileLabel: 'Link' },
    { key: 'shop', icon: <ShoppingCartOutlined />, label: 'Shop', path: '/consumer/shop', mobileLabel: 'Shop' },
    { key: 'orders', icon: <InboxOutlined />, label: 'My Orders', path: '/consumer/orders', mobileLabel: 'My Orders' },
    { key: 'wallet', icon: <CreditCardOutlined />, label: 'Wallet & Cards', path: '/consumer/wallet', mobileLabel: 'Wallet' },
    { key: 'gas', icon: <FireOutlined />, label: 'Gas Top-up', path: '/consumer/gas', mobileLabel: 'Gas' },
    { key: 'gas-meter-recharge', icon: <ThunderboltOutlined />, label: 'Gas Meter Recharge', path: '/consumer/gas-meter-recharge', mobileLabel: 'Recharge' },
    { key: 'rewards', icon: <GiftOutlined />, label: 'Rewards', path: '/consumer/rewards', mobileLabel: 'Rewards' },
    { key: 'profile', icon: <UserOutlined />, label: 'Profile', path: '/consumer/profile', mobileLabel: 'Profile' },
  ],
  employee: [],
  retailer: [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', path: '/retailer/dashboard', mobileLabel: 'Home' },
    { key: 'pos', icon: <ScanOutlined />, label: 'POS', path: '/retailer/pos', mobileLabel: 'POS' },
    { key: 'add-stock', icon: <ShoppingCartOutlined />, label: 'Add Stock', path: '/retailer/add-stock', mobileLabel: 'Add Stock' },
    { key: 'inventory', icon: <InboxOutlined />, label: 'Inventory', path: '/retailer/inventory', mobileLabel: 'Stock' },
    { key: 'orders', icon: <ShoppingCartOutlined />, label: 'Orders', path: '/retailer/orders', mobileLabel: 'Orders' },
    { key: 'purchase-orders', icon: <InboxOutlined />, label: 'Stock Orders', path: '/retailer/purchase-orders', mobileLabel: 'Wholesale' },
    { key: 'customer-requests', icon: <UserAddOutlined />, label: 'Customer Requests', path: '/retailer/customer-requests', mobileLabel: 'Customers' },
    { key: 'wholesalers', icon: <TeamOutlined />, label: 'Find Wholesaler', path: '/retailer/wholesalers', mobileLabel: 'Wholesalers' },
    { key: 'wallet', icon: <DollarOutlined />, label: 'Wallet & Credit', path: '/retailer/wallet', mobileLabel: 'Wallet' },
    { key: 'management', icon: <CreditCardOutlined />, label: 'My Management', path: '/retailer/management', mobileLabel: 'Manage' },
    { key: 'analytics', icon: <BarChartOutlined />, label: 'Analytics', path: '/retailer/analytics', mobileLabel: 'Stats' },
    { key: 'profile', icon: <UserOutlined />, label: 'Profile', path: '/retailer/profile', mobileLabel: 'Profile' },
  ],
  wholesaler: [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', path: '/wholesaler/dashboard', mobileLabel: 'Home' },
    { key: 'inventory', icon: <InboxOutlined />, label: 'Inventory', path: '/wholesaler/inventory', mobileLabel: 'Stock' },
    { key: 'orders', icon: <ShoppingCartOutlined />, label: 'Retailer Orders', path: '/wholesaler/orders', mobileLabel: 'Orders' },
    { key: 'retailers', icon: <TeamOutlined />, label: 'My Retailers', path: '/wholesaler/retailers', mobileLabel: 'Retailers' },
    { key: 'link-requests', icon: <UserAddOutlined />, label: 'Link Requests', path: '/wholesaler/link-requests', mobileLabel: 'Requests' },
    { key: 'wallet', icon: <CreditCardOutlined />, label: 'Wallet & Credit', path: '/wholesaler/wallet', mobileLabel: 'Wallet' },
    { key: 'management', icon: <ShopOutlined />, label: 'My Management', path: '/wholesaler/management', mobileLabel: 'Manage' },
    { key: 'analytics', icon: <BarChartOutlined />, label: 'Analytics', path: '/wholesaler/analytics', mobileLabel: 'Stats' },
    { key: 'profile', icon: <UserOutlined />, label: 'Profile', path: '/wholesaler/profile', mobileLabel: 'Profile' },
  ],
  admin: [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard', path: '/admin/dashboard', mobileLabel: 'Home' },
    { key: 'accounts', icon: <TeamOutlined />, label: 'Account Management', path: '/admin/accounts', mobileLabel: 'Accounts' },
    { key: 'products', icon: <InboxOutlined />, label: 'Product Listing', path: '/admin/products', mobileLabel: 'Products' },
    { key: 'categories', icon: <ApartmentOutlined />, label: 'Categories', path: '/admin/categories', mobileLabel: 'Categories' },
    { key: 'customers', icon: <UserOutlined />, label: 'Customers', path: '/admin/customers', mobileLabel: 'Users' },
    { key: 'retailers', icon: <ShopOutlined />, label: 'Retailers', path: '/admin/retailers', mobileLabel: 'Retailers' },
    { key: 'wholesalers', icon: <TeamOutlined />, label: 'Wholesalers', path: '/admin/wholesalers', mobileLabel: 'Wholesalers' },
    { key: 'loans', icon: <DollarOutlined />, label: 'Loans', path: '/admin/loans', mobileLabel: 'Loans' },
    { key: 'nfc-cards', icon: <CreditCardOutlined />, label: 'NFC Cards', path: '/admin/nfc-cards', mobileLabel: 'Cards' },
    { key: 'pricing-config', icon: <SettingOutlined />, label: 'Pricing Config', path: '/admin/pricing-config', mobileLabel: 'Pricing' },
    { key: 'reports', icon: <BarChartOutlined />, label: 'Reports', path: '/admin/reports', mobileLabel: 'Reports' },
    { key: 'profile', icon: <UserOutlined />, label: 'Profile', path: '/admin/profile', mobileLabel: 'Profile' },
  ],
};

// Mobile bottom nav items (limited to 5 most important items per role)
// NOTE: Consumer has 'orders' instead of 'rewards' as per requirement
const mobileBottomNavItems: Record<UserRole, string[]> = {
  consumer: ['discover-retailers', 'shop', 'orders', 'wallet', 'profile'],
  employee: ['attendance', 'projects', 'payslips', 'profile'],
  retailer: ['dashboard', 'pos', 'customer-requests', 'orders', 'wallet'],
  wholesaler: ['dashboard', 'orders', 'retailers', 'wallet', 'management'],
  admin: ['dashboard', 'employees', 'payroll', 'accounts', 'customers'],
};

// Theme colors per role
const themeColors: Record<UserRole, { primary: string; gradient: string; light: string }> = {
  consumer: { primary: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', light: 'rgba(16, 185, 129, 0.1)' },
  employee: { primary: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', light: 'rgba(245, 158, 11, 0.1)' },
  retailer: { primary: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', light: 'rgba(59, 130, 246, 0.1)' },
  wholesaler: { primary: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', light: 'rgba(139, 92, 246, 0.1)' },
  admin: { primary: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', light: 'rgba(239, 68, 68, 0.1)' },
};

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setDrawerVisible(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) return null;

  const currentMenuItems = menuItems[user.role];
  const themeColor = themeColors[user.role];
  const bottomNavKeys = mobileBottomNavItems[user.role];
  const bottomNavItems = currentMenuItems?.filter(item => bottomNavKeys.includes(item.key)) || [];

  const handleMenuClick = (path: string) => {
    navigate(path);
    setDrawerVisible(false);
  };

  const handleLogout = () => {
    logout();
    // Redirect to home page after logout
    window.location.href = '/';
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate(`/${user.role}/profile`),
    },
    {
      key: 'divider',
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Find active menu key based on current path
  const activeKey = currentMenuItems?.find((item) =>
    location.pathname.startsWith(item.path)
  )?.key || currentMenuItems?.[0]?.key || 'dashboard';

  // Ensure menu items exist
  if (!currentMenuItems || currentMenuItems.length === 0) {
    console.error('No menu items found for role:', user.role);
    return null;
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Mobile Header */}
        <header
          className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 shadow-sm"
          style={{ background: themeColor.gradient }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerVisible(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/20 text-white"
            >
              <MenuOutlined style={{ fontSize: 18 }} />
            </button>
            <div className="flex items-center gap-2">
              <ShopOutlined className="text-white text-xl" />
              <span className="text-white font-semibold text-base">BIG Company</span>
            </div>
          </div>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <button className="flex items-center gap-2 bg-white/20 rounded-full px-2 py-1.5 pr-3">
              <Avatar
                style={{ backgroundColor: 'white', color: themeColor.primary }}
                icon={<UserOutlined />}
                size={28}
              />
              <span className="text-white text-sm font-medium max-w-[80px] truncate">
                {user.name || user.email?.split('@')[0]}
              </span>
            </button>
          </Dropdown>
        </header>

        {/* Mobile Drawer Menu */}
        <Drawer
          title={
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ background: themeColor.gradient }}
              >
                B
              </div>
              <div>
                <div className="font-semibold text-gray-900">BIG Company</div>
                <div className="text-xs text-gray-500 capitalize">{user.role} Portal</div>
              </div>
            </div>
          }
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={280}
          closeIcon={<CloseOutlined />}
          styles={{
            body: { padding: 0 },
            header: { borderBottom: '1px solid #f0f0f0' }
          }}
        >
          <div className="py-2">
            {/* Home Button */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => { navigate('/'); setDrawerVisible(false); }}
            >
              <HomeOutlined style={{ fontSize: 20, color: '#6b7280' }} />
              <span className="text-gray-700">Back to Home</span>
            </div>

            <div className="h-px bg-gray-100 my-2" />

            {/* Menu Items */}
            {currentMenuItems.map((item) => {
              const isActive = activeKey === item.key;
              return (
                <div
                  key={item.key}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${isActive
                    ? 'border-r-4'
                    : 'hover:bg-gray-50'
                    }`}
                  style={{
                    backgroundColor: isActive ? themeColor.light : undefined,
                    borderColor: isActive ? themeColor.primary : undefined,
                  }}
                  onClick={() => handleMenuClick(item.path)}
                >
                  <span style={{ fontSize: 20, color: isActive ? themeColor.primary : '#6b7280' }}>
                    {item.icon}
                  </span>
                  <span
                    className="font-medium"
                    style={{ color: isActive ? themeColor.primary : '#374151' }}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}

            <div className="h-px bg-gray-100 my-2" />

            {/* Logout */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-red-50 transition-colors"
              onClick={handleLogout}
            >
              <LogoutOutlined style={{ fontSize: 20, color: '#ef4444' }} />
              <span className="text-red-500 font-medium">Logout</span>
            </div>
          </div>
        </Drawer>

        {/* Main Content */}
        <main className="flex-1 mt-14 mb-16 overflow-auto">
          <div className="p-4">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center justify-around h-16">
            {bottomNavItems.map((item) => {
              const isActive = activeKey === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleMenuClick(item.path)}
                  className={`flex flex-col items-center justify-center flex-1 h-full py-1 px-1 transition-all ${isActive ? 'scale-105' : 'opacity-60 hover:opacity-100'
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-0.5 transition-all ${isActive ? 'shadow-lg' : ''
                      }`}
                    style={{
                      background: isActive ? themeColor.gradient : 'transparent',
                      color: isActive ? 'white' : '#6b7280',
                      fontSize: 20,
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors ${isActive ? '' : 'text-gray-500'
                      }`}
                    style={{ color: isActive ? themeColor.primary : undefined }}
                  >
                    {item.mobileLabel || item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  // Desktop Layout
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar - Fixed */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          height: '100vh',
          overflow: 'auto',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          {collapsed ? (
            <ShopOutlined style={{ fontSize: 24, color: themeColor.primary }} />
          ) : (
            <Space>
              <ShopOutlined style={{ fontSize: 24, color: themeColor.primary }} />
              <Text strong style={{ color: themeColor.primary }}>
                BIG Company
              </Text>
            </Space>
          )}
        </div>

        {/* Menu */}
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          style={{ borderRight: 0, marginTop: 8 }}
          items={currentMenuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: () => handleMenuClick(item.path),
          }))}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        {/* Header - Fixed */}
        <Header
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            left: collapsed ? 80 : 200,
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            zIndex: 99,
            transition: 'left 0.2s',
          }}
        >
          <Space>
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
            >
              Home
            </Button>
          </Space>

          {/* User dropdown */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer', padding: '8px 0' }}>
              <Avatar
                style={{ backgroundColor: themeColor.primary }}
                icon={<UserOutlined />}
                size="default"
              />
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                minWidth: 80,
                maxWidth: 180,
              }}>
                <Text
                  strong
                  style={{
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    lineHeight: 1.3,
                  }}
                >
                  {user.name || user.email}
                </Text>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                    lineHeight: 1.2,
                    textTransform: 'capitalize',
                  }}
                >
                  {user.role}
                </Text>
              </div>
            </Space>
          </Dropdown>
        </Header>

        {/* Content - Scrollable */}
        <Content
          style={{
            marginTop: 64,
            padding: 24,
            background: '#fff',
            borderRadius: 8,
            minHeight: 'calc(100vh - 64px - 48px)',
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};