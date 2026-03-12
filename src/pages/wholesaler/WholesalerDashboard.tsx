import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  List,
  Avatar,
  Badge,
  Progress,
  Timeline,
  Tooltip,
  Divider,
  Skeleton,
  Alert,
} from 'antd';
import {
  TeamOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  RiseOutlined,
  TruckOutlined,
  BellOutlined,
  StarOutlined,
  ThunderboltOutlined,
  FireOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { wholesalerApi } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { AddInventoryModal } from '../../components/wholesaler/AddInventoryModal';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

interface DashboardStats {
  todaysOrders: number;
  todaysRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  // Inventory Value Wallet - based on supplier/manufacturer cost
  inventoryValueSupplierCost: number;
  // Profit Wallet - difference between wholesaler price and supplier cost
  profitWallet: number;
  pendingCreditRequests: number;
  growth?: {
    orders: number;
    revenue: number;
    profit: number;
  };
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 100 },
  },
};

const cardHoverVariants = {
  hover: {
    y: -5,
    boxShadow: '0 10px 30px rgba(114, 46, 209, 0.15)',
    transition: { duration: 0.3 },
  },
};

// Chart data
const revenueData = [
  { name: 'Mon', revenue: 4200000, orders: 45 },
  { name: 'Tue', revenue: 3800000, orders: 38 },
  { name: 'Wed', revenue: 5100000, orders: 52 },
  { name: 'Thu', revenue: 4600000, orders: 48 },
  { name: 'Fri', revenue: 6200000, orders: 65 },
  { name: 'Sat', revenue: 7500000, orders: 78 },
  { name: 'Sun', revenue: 5800000, orders: 58 },
];

const categoryData = [
  { name: 'Beverages', value: 35, color: '#722ed1' },
  { name: 'Food & Snacks', value: 28, color: '#1890ff' },
  { name: 'Household', value: 18, color: '#52c41a' },
  { name: 'Personal Care', value: 12, color: '#fa8c16' },
  { name: 'Others', value: 7, color: '#eb2f96' },
];

const monthlyTrend = [
  { month: 'Jul', revenue: 32000000, target: 30000000 },
  { month: 'Aug', revenue: 35000000, target: 33000000 },
  { month: 'Sep', revenue: 38000000, target: 36000000 },
  { month: 'Oct', revenue: 42000000, target: 40000000 },
  { month: 'Nov', revenue: 45000000, target: 43000000 },
];

const topRetailers = [
  { id: 1, name: 'Kigali Central Shop', orders: 156, revenue: 8500000, growth: 12.5 },
  { id: 2, name: 'Nyarugenge Mini-mart', orders: 142, revenue: 7200000, growth: 8.3 },
  { id: 3, name: 'Gasabo Store', orders: 128, revenue: 6800000, growth: 15.2 },
  { id: 4, name: 'Kimironko Market', orders: 115, revenue: 5900000, growth: -2.1 },
  { id: 5, name: 'Remera Corner', orders: 98, revenue: 5200000, growth: 6.7 },
];

const recentActivity = [
  { time: '2 minutes ago', action: 'New order received', details: 'Order #WHL-2024-892 from Kigali Shop', type: 'order' },
  { time: '15 minutes ago', action: 'Payment received', details: '2,500,000 RWF from Gasabo Store', type: 'payment' },
  { time: '1 hour ago', action: 'Inventory alert', details: 'Inyange Milk stock below threshold', type: 'alert' },
  { time: '2 hours ago', action: 'Credit approved', details: 'New Shop approved for 100,000 RWF', type: 'credit' },
  { time: '3 hours ago', action: 'Order delivered', details: 'Order #WHL-2024-888 confirmed', type: 'delivery' },
];

export const WholesalerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [creditRequests, setCreditRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => setCurrentTime(dayjs()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await wholesalerApi.getDashboardStats();
      setStats({
        ...response.data,
        growth: { orders: 12.3, revenue: 15.7, profit: 18.2 },
      });
      const ordersData = response.data.pendingOrdersList || response.data.pendingOrders;
      setPendingOrders(Array.isArray(ordersData) ? ordersData : []);
      const creditData = response.data.creditRequestsList || response.data.creditRequests;
      setCreditRequests(Array.isArray(creditData) ? creditData : []);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setStats({
        todaysOrders: 34,
        todaysRevenue: 8500000,
        totalOrders: 1256,
        pendingOrders: 23,
        totalRevenue: 45000000,
        // Inventory Value Wallet - total goods value at supplier/manufacturer cost
        inventoryValueSupplierCost: 12500000,
        // Profit Wallet - potential profit (wholesaler price - supplier cost)
        profitWallet: 3750000,
        pendingCreditRequests: 5,
        growth: { orders: 12.3, revenue: 15.7, profit: 18.2 },
      });
      setPendingOrders([
        { id: 'WHL-001', retailer: 'Kigali Shop', items: 12, total: 1500000, status: 'pending', date: '2024-11-30T10:30:00' },
        { id: 'WHL-002', retailer: 'Nyarugenge Store', items: 8, total: 850000, status: 'pending', date: '2024-11-30T09:15:00' },
        { id: 'WHL-003', retailer: 'Gasabo Mini-mart', items: 15, total: 2200000, status: 'processing', date: '2024-11-29T16:45:00' },
        { id: 'WHL-004', retailer: 'Remera Corner', items: 6, total: 450000, status: 'pending', date: '2024-11-29T14:20:00' },
      ]);
      setCreditRequests([
        { id: '1', retailer: 'New Shop', amount: 100000, status: 'pending', days: 2 },
        { id: '2', retailer: 'Corner Store', amount: 50000, status: 'pending', days: 1 },
        { id: '3', retailer: 'Kimironko Market', amount: 200000, status: 'pending', days: 3 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const safeAmount = amount ?? 0;
    if (safeAmount >= 1000000) {
      return `${(safeAmount / 1000000).toFixed(1)}M RWF`;
    }
    return `${safeAmount.toLocaleString()} RWF`;
  };

  const formatFullCurrency = (amount: number) => {
    return `${(amount ?? 0).toLocaleString()} RWF`;
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      order: <ShoppingCartOutlined style={{ color: '#1890ff' }} />,
      payment: <DollarOutlined style={{ color: '#52c41a' }} />,
      alert: <BellOutlined style={{ color: '#fa8c16' }} />,
      credit: <SafetyCertificateOutlined style={{ color: '#722ed1' }} />,
      delivery: <TruckOutlined style={{ color: '#13c2c2' }} />,
    };
    return icons[type] || <ClockCircleOutlined />;
  };

  const orderColumns = [
    {
      title: 'Order',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text strong style={{ color: '#722ed1' }}>#{id}</Text>
      ),
    },
    {
      title: 'Retailer',
      dataIndex: 'retailer',
      key: 'retailer',
      render: (retailer: string) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#722ed1' }}>
            {retailer.charAt(0)}
          </Avatar>
          <Text>{retailer}</Text>
        </Space>
      ),
    },
    { title: 'Items', dataIndex: 'items', key: 'items', render: (items: number) => <Badge count={items} style={{ backgroundColor: '#722ed1' }} /> },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => <Text strong>{formatFullCurrency(total)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { color: string; icon: React.ReactNode }> = {
          pending: { color: 'orange', icon: <ClockCircleOutlined /> },
          processing: { color: 'blue', icon: <ThunderboltOutlined /> },
          shipped: { color: 'cyan', icon: <TruckOutlined /> },
          delivered: { color: 'green', icon: <CheckCircleOutlined /> },
        };
        const { color, icon } = config[status] || { color: 'default', icon: null };
        return <Tag color={color} icon={icon}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Time',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('MMM DD, YYYY HH:mm')}>
          <Text type="secondary">{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" type="primary" icon={<CheckCircleOutlined />}>
            Process
          </Button>
          <Button size="small">View</Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 2 }} />
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card><Skeleton active /></Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Header with gradient */}
      <motion.div variants={itemVariants}>
        <div
          style={{
            background: 'linear-gradient(135deg, #722ed1 0%, #531dab 50%, #391085 100%)',
            padding: '32px',
            marginBottom: 24,
            borderRadius: 16,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative elements */}
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: -30, right: 100, width: 100, height: 100, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

          <Row justify="space-between" align="middle">
            <Col>
              <Space direction="vertical" size={4}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                  {currentTime.format('dddd, MMMM D, YYYY')}
                </Text>
                <Title level={2} style={{ color: 'white', margin: 0 }}>
                  Welcome back, {user?.company_name || 'Wholesaler'}! 👋
                </Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.8)', margin: 0, maxWidth: 500 }}>
                  Your retailer network is growing. You have <Text strong style={{ color: '#ffd666' }}>{stats?.pendingOrders || 0} pending orders</Text> and <Text strong style={{ color: '#ffd666' }}>{stats?.pendingCreditRequests || 0} credit requests</Text> awaiting approval.
                </Paragraph>
              </Space>
            </Col>
            <Col>
              <Space size="middle">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="large"
                    icon={<ReloadOutlined />}
                    onClick={fetchDashboardData}
                    style={{ borderColor: 'white', color: 'white', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
                  >
                    Refresh
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddModalOpen(true)}
                    style={{ background: '#1890ff', color: 'white', border: 'none', fontWeight: 600 }}
                  >
                    Add Inventory
                  </Button>
                </motion.div>
              </Space>
            </Col>
          </Row>
        </div>
      </motion.div>

      {/* Quick Stats Alert */}
      <motion.div variants={itemVariants}>
        <Alert
          message={
            <Space split={<Divider type="vertical" />}>
              <span><FireOutlined style={{ color: '#fa541c' }} /> Today's Sales: <Text strong>{formatCurrency(stats?.todaysRevenue || 0)}</Text></span>
              <span><TruckOutlined style={{ color: '#1890ff' }} /> Today's Orders: <Text strong>{stats?.todaysOrders || 0}</Text></span>
              <span><InboxOutlined style={{ color: '#722ed1' }} /> Profit Margin: <Text strong>{formatCurrency(stats?.profitWallet || 0)}</Text></span>
            </Space>
          }
          type="info"
          showIcon={false}
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      </motion.div>

      {/* Stats Cards with animations - Updated per client requirements */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          {
            title: "Today's Orders",
            value: stats?.todaysOrders || 0,
            icon: <ShoppingCartOutlined />,
            color: '#1890ff',
            suffix: <Badge status="processing" text={<Text type="secondary">{stats?.pendingOrders || 0} pending</Text>} />,
            growth: stats?.growth?.orders,
          },
          {
            title: 'Total Revenue',
            value: stats?.totalRevenue || 0,
            icon: <DollarOutlined />,
            color: '#52c41a',
            formatter: formatCurrency,
            growth: stats?.growth?.revenue,
          },
          {
            title: 'Inventory Value Wallet',
            value: stats?.inventoryValueSupplierCost || 0,
            icon: <InboxOutlined />,
            color: '#fa8c16',
            formatter: formatCurrency,
            suffix: <Text type="secondary" style={{ fontSize: 12 }}>Based on supplier cost</Text>,
          },
          {
            title: 'Profit Wallet',
            value: stats?.profitWallet || 0,
            icon: <DollarOutlined />,
            color: '#722ed1',
            formatter: formatCurrency,
            suffix: <Text type="secondary" style={{ fontSize: 12 }}>Wholesaler - Supplier margin</Text>,
            growth: stats?.growth?.profit,
          },
        ].map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <motion.div variants={itemVariants} whileHover="hover">
              <motion.div variants={cardHoverVariants}>
                <Card
                  hoverable
                  style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  bodyStyle={{ padding: 20 }}
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Row justify="space-between" align="middle">
                      <Text type="secondary">{stat.title}</Text>
                      <Avatar
                        size={40}
                        style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                        icon={stat.icon}
                      />
                    </Row>
                    <Statistic
                      value={stat.value}
                      valueStyle={{ color: stat.color, fontSize: 28, fontWeight: 700 }}
                      formatter={stat.formatter ? (value) => stat.formatter!(Number(value)) : undefined}
                    />
                    <Row justify="space-between" align="middle">
                      {stat.suffix}
                      {stat.growth !== undefined && (
                        <Tag
                          color={stat.growth >= 0 ? 'success' : 'error'}
                          icon={stat.growth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        >
                          {Math.abs(stat.growth)}%
                        </Tag>
                      )}
                    </Row>
                  </Space>
                </Card>
              </motion.div>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Revenue Chart */}
        <Col xs={24} lg={16}>
          <motion.div variants={itemVariants}>
            <Card
              title={
                <Space>
                  <RiseOutlined style={{ color: '#722ed1' }} />
                  <Text strong>Weekly Revenue & Orders</Text>
                </Space>
              }
              extra={<Button type="link">View Details</Button>}
              style={{ borderRadius: 12 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#722ed1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#722ed1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#8c8c8c" />
                  <YAxis yAxisId="left" stroke="#722ed1" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#1890ff" />
                  <RechartsTooltip
                    formatter={(value: number, name: string) =>
                      name === 'revenue' ? formatFullCurrency(value) : value
                    }
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#722ed1"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                    name="Revenue"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#1890ff"
                    strokeWidth={2}
                    dot={{ fill: '#1890ff', r: 4 }}
                    name="Orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </Col>

        {/* Category Breakdown */}
        <Col xs={24} lg={8}>
          <motion.div variants={itemVariants}>
            <Card
              title={
                <Space>
                  <InboxOutlined style={{ color: '#722ed1' }} />
                  <Text strong>Sales by Category</Text>
                </Space>
              }
              style={{ borderRadius: 12 }}
            >
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              <Divider style={{ margin: '12px 0' }} />
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {categoryData.map((cat, i) => (
                  <Row key={i} justify="space-between" align="middle">
                    <Space>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: cat.color }} />
                      <Text>{cat.name}</Text>
                    </Space>
                    <Text strong>{cat.value}%</Text>
                  </Row>
                ))}
              </Space>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Orders and Activity Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Pending Orders Table */}
        <Col xs={24} xl={16}>
          <motion.div variants={itemVariants}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                  <Text strong>Pending Retailer Orders</Text>
                  <Badge count={pendingOrders.length} style={{ backgroundColor: '#fa8c16' }} />
                </Space>
              }
              extra={<Button type="primary" ghost>View All Orders</Button>}
              style={{ borderRadius: 12 }}
            >
              <Table
                columns={orderColumns}
                dataSource={pendingOrders}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            </Card>
          </motion.div>
        </Col>

        {/* Recent Activity */}
        <Col xs={24} xl={8}>
          <motion.div variants={itemVariants}>
            <Card
              title={
                <Space>
                  <BellOutlined style={{ color: '#722ed1' }} />
                  <Text strong>Recent Activity</Text>
                </Space>
              }
              style={{ borderRadius: 12 }}
              bodyStyle={{ maxHeight: 380, overflow: 'auto' }}
            >
              <Timeline
                items={recentActivity.map((activity, index) => ({
                  dot: getActivityIcon(activity.type),
                  children: (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Text strong style={{ display: 'block' }}>{activity.action}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{activity.details}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>{activity.time}</Text>
                    </motion.div>
                  ),
                }))}
              />
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Bottom Row - Top Retailers & Credit Requests */}
      <Row gutter={[16, 16]}>
        {/* Top Retailers */}
        <Col xs={24} lg={14}>
          <motion.div variants={itemVariants}>
            <Card
              title={
                <Space>
                  <StarOutlined style={{ color: '#ffc53d' }} />
                  <Text strong>Top Performing Retailers</Text>
                </Space>
              }
              extra={<Button type="link">View All</Button>}
              style={{ borderRadius: 12 }}
            >
              <List
                dataSource={topRetailers}
                renderItem={(retailer, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Badge count={index + 1} style={{ backgroundColor: index < 3 ? '#ffc53d' : '#d9d9d9' }}>
                          <Avatar size={48} style={{ backgroundColor: '#722ed1' }}>
                            {retailer.name.charAt(0)}
                          </Avatar>
                        </Badge>
                      }
                      title={
                        <Space>
                          <Text strong>{retailer.name}</Text>
                          <Tag color={retailer.growth >= 0 ? 'success' : 'error'} style={{ marginLeft: 8 }}>
                            {retailer.growth >= 0 ? '+' : ''}{retailer.growth}%
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space split={<Divider type="vertical" />}>
                          <Text type="secondary">{retailer.orders} orders</Text>
                          <Text type="secondary">{formatCurrency(retailer.revenue)}</Text>
                        </Space>
                      }
                    />
                    <Progress
                      type="circle"
                      percent={Math.round((retailer.revenue / topRetailers[0].revenue) * 100)}
                      width={50}
                      strokeColor="#722ed1"
                      format={(percent) => `${percent}%`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </motion.div>
        </Col>

        {/* Credit Requests */}
        <Col xs={24} lg={10}>
          <motion.div variants={itemVariants}>
            <Card
              title={
                <Space>
                  <DollarOutlined style={{ color: '#52c41a' }} />
                  <Text strong>Pending Credit Requests</Text>
                  <Badge count={creditRequests.length} style={{ backgroundColor: '#52c41a' }} />
                </Space>
              }
              extra={<Button type="link">View All</Button>}
              style={{ borderRadius: 12 }}
            >
              <AnimatePresence>
                <List
                  dataSource={creditRequests}
                  renderItem={(item: any, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <List.Item
                        actions={[
                          <Button
                            key="approve"
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            style={{ background: '#52c41a', borderColor: '#52c41a' }}
                          >
                            Approve
                          </Button>,
                          <Button key="reject" size="small" danger>
                            Reject
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Avatar size={44} style={{ backgroundColor: '#722ed1' }} icon={<TeamOutlined />} />
                          }
                          title={<Text strong>{item.retailer}</Text>}
                          description={
                            <Space direction="vertical" size={2}>
                              <Text style={{ color: '#52c41a', fontWeight: 600 }}>
                                {formatFullCurrency(item.amount)}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                Requested {item.days} day{item.days > 1 ? 's' : ''} ago
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    </motion.div>
                  )}
                />
              </AnimatePresence>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Monthly Performance Chart */}
      <motion.div variants={itemVariants} style={{ marginTop: 24 }}>
        <Card
          title={
            <Space>
              <BarChartOutlined style={{ color: '#722ed1' }} />
              <Text strong>Monthly Performance vs Target</Text>
            </Space>
          }
          style={{ borderRadius: 12 }}
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyTrend} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#8c8c8c" />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} stroke="#8c8c8c" />
              <RechartsTooltip formatter={(value: number) => formatFullCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#722ed1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Target" fill="#d9d9d9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>

      <AddInventoryModal
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchDashboardData();
        }}
      />
    </motion.div>
  );
};
