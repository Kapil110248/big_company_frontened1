import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Progress,
  Timeline,
  Avatar,
  Badge,
  Divider,
  Skeleton,
  Alert,
  List,
  Tooltip,
} from 'antd';
import {
  ShoppingOutlined,
  DollarOutlined,
  InboxOutlined,
  RiseOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CreditCardOutlined,
  ShoppingCartOutlined,
  ScanOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  BellOutlined,
  TruckOutlined,
  GiftOutlined,
  FireOutlined,
  ThunderboltOutlined,
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
import { retailerApi } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';

dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number; // Capital + Profit wallet combined
  inventoryItems: number;
  lowStockItems: any[]; // Changed to array
  lowStockCount: number; // New field
  capitalWallet: number; // Inventory value at wholesaler price
  profitWallet: number; // Profit margin from sales
  totalProfit: number; // NEW
  profitMargin: string; // NEW
  creditLimit: number;
  todaySales?: number;
  customersToday?: number;
  growth?: {
    orders: number;
    revenue: number;
  };
  // Payment method breakdown
  dashboardWalletRevenue?: number;
  creditWalletRevenue?: number;
  mobileMoneyRevenue?: number;
  gasRewardsGiven?: number; // in M³
  gasRewardsValue?: number; // in RWF
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
    boxShadow: '0 10px 30px rgba(24, 144, 255, 0.15)',
    transition: { duration: 0.3 },
  },
};

// Chart data interface
interface ChartData {
  name: string;
  sales: number;
  customers: number;
}


export const RetailerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(dayjs());

  // Dynamic Chart Data
  const [salesData, setSalesData] = useState<ChartData[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);


  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => setCurrentTime(dayjs()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await retailerApi.getDashboardStats();
      setStats(response.data);
      setRecentOrders(response.data.recentOrders || []);
      setSalesData(response.data.salesData || []);
      setPaymentMethods(response.data.paymentMethods || []);
      setTopProducts(response.data.topProducts || []);
      setLowStockItems(response.data.lowStockList || []);
      setRecentActivity([]); // Placeholder as backend implementation for activity is pending

    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        inventoryItems: 0,
        lowStockItems: [],
        lowStockCount: 0,
        capitalWallet: 0,
        profitWallet: 0,
        totalProfit: 0,
        profitMargin: '0',
        creditLimit: 0,
        todaySales: 0,
        customersToday: 0,
        growth: { orders: 0, revenue: 0 }
      });
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    const safeAmount = amount ?? 0;
    if (safeAmount >= 1000000) {
      return `${(safeAmount / 1000000).toFixed(1)}M RWF`;
    }
    return `${safeAmount.toLocaleString()} RWF`;
  };

  const formatFullCurrency = (amount: number | undefined | null) => {
    return `${(amount ?? 0).toLocaleString()} RWF`;
  };

  const getPaymentIcon = (payment: string) => {
    const icons: Record<string, React.ReactNode> = {
      momo: <span style={{ color: '#ffc53d' }}>📱</span>,
      nfc: <CreditCardOutlined style={{ color: '#1890ff' }} />,
      cash: <DollarOutlined style={{ color: '#52c41a' }} />,
      credit: <CreditCardOutlined style={{ color: '#722ed1' }} />,
    };
    return icons[payment] || <DollarOutlined />;
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      sale: '#52c41a',
      payment: '#1890ff',
      alert: '#fa8c16',
      order: '#722ed1',
      reward: '#eb2f96',
    };
    return colors[type] || '#8c8c8c';
  };

  const orderColumns = [
    {
      title: 'Order',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text strong style={{ color: '#1890ff' }}>#{id}</Text>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      render: (customer: string) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }} icon={<UserOutlined />} />
          <Text>{customer}</Text>
        </Space>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: number) => <Badge count={items} style={{ backgroundColor: '#1890ff' }} />,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => <Text strong>{formatFullCurrency(total)}</Text>,
    },
    {
      title: 'Payment',
      dataIndex: 'payment',
      key: 'payment',
      render: (payment: string) => (
        <Space>
          {getPaymentIcon(payment)}
          <Text style={{ textTransform: 'capitalize' }}>{payment === 'momo' ? 'Mobile Money' : payment}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { color: string; icon: React.ReactNode }> = {
          completed: { color: 'green', icon: <CheckCircleOutlined /> },
          pending: { color: 'orange', icon: <ClockCircleOutlined /> },
          processing: { color: 'blue', icon: <ThunderboltOutlined /> },
          cancelled: { color: 'red', icon: <WarningOutlined /> },
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
      {/* Welcome Header */}
      <motion.div variants={itemVariants}>
        <div
          style={{
            background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 50%, #0050b3 100%)',
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
                  {currentTime.format('dddd, MMMM D, YYYY')} • {currentTime.format('h:mm A')}
                </Text>
                <Title level={2} style={{ color: 'white', margin: 0 }}>
                  Welcome back, {user?.shop_name || 'Retailer'}! 👋
                </Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.8)', margin: 0, maxWidth: 500 }}>
                  You've served <Text strong style={{ color: '#ffd666' }}>{stats?.customersToday || 0} customers</Text> today and made <Text strong style={{ color: '#ffd666' }}>{formatCurrency(stats?.todaySales || 0)}</Text> in sales. Keep it up!
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
                    style={{ borderColor: 'white', color: 'white', background: 'rgba(255,255,255,0.15)' }}
                  >
                    Refresh
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ScanOutlined />}
                    onClick={() => navigate('/retailer/pos')}
                    style={{ background: 'white', color: '#1890ff', border: 'none', fontWeight: 600 }}
                  >
                    Open POS
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
              <span><FireOutlined style={{ color: '#fa541c' }} /> Today's Sales: <Text strong>{formatCurrency(stats?.todaySales || 0)}</Text></span>
              <span><UserOutlined style={{ color: '#1890ff' }} /> Customers: <Text strong>{stats?.customersToday || 0}</Text></span>
              <span><WarningOutlined style={{ color: '#fa8c16' }} /> Low Stock: <Text strong>{stats?.lowStockCount || 0} items</Text></span>
            </Space>
          }
          type="info"
          showIcon={false}
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      </motion.div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          {
            title: 'Today\'s Orders',
            value: stats?.totalOrders || 0,
            icon: <ShoppingOutlined />,
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
            title: 'Capital Wallet',
            value: stats?.capitalWallet || 0,
            icon: <InboxOutlined />,
            color: '#722ed1',
            formatter: formatCurrency,
            suffix: <Text type="secondary" style={{ fontSize: 11 }}>Inventory value at wholesaler price</Text>,
            extra: (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>{stats?.inventoryItems || 0} products • <Text type="danger">{stats?.lowStockCount || 0} low stock</Text></Text>
              </div>
            ),
          },
          {
            title: 'Profit Wallet',
            value: stats?.profitWallet || 0,
            icon: <CreditCardOutlined />,
            color: '#fa8c16',
            formatter: formatCurrency,
            suffix: <Text type="secondary" style={{ fontSize: 11 }}>Profit margin from sales</Text>,
            extra: (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <FireOutlined style={{ color: '#fa541c' }} /> Gas rewards: {stats?.gasRewardsGiven?.toFixed(2) || 0} M³
                </Text>
              </div>
            ),
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
                    {stat.extra}
                  </Space>
                </Card>
              </motion.div>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Today's Sales Chart */}
        <Col xs={24} lg={16}>
          <motion.div variants={itemVariants}>
            <Card
              title={
                <Space>
                  <RiseOutlined style={{ color: '#1890ff' }} />
                  <Text strong>Today's Sales by Hour</Text>
                </Space>
              }
              extra={<Button type="link" onClick={() => navigate('/retailer/analytics')}>View Analytics</Button>}
              style={{ borderRadius: 12 }}
            >
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#8c8c8c" />
                  <YAxis yAxisId="left" stroke="#1890ff" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#52c41a" />
                  <RechartsTooltip
                    formatter={(value: number, name: string) =>
                      name === 'sales' ? formatFullCurrency(value) : value
                    }
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="sales"
                    stroke="#1890ff"
                    strokeWidth={2}
                    fill="url(#colorSales)"
                    name="Sales"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="customers"
                    stroke="#52c41a"
                    strokeWidth={2}
                    dot={{ fill: '#52c41a', r: 4 }}
                    name="Customers"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </Col>

        {/* Payment Methods */}
        <Col xs={24} lg={8}>
          <motion.div variants={itemVariants}>
            <Card
              title={
                <Space>
                  <CreditCardOutlined style={{ color: '#1890ff' }} />
                  <Text strong>Payment Methods</Text>
                </Space>
              }
              style={{ borderRadius: 12 }}
            >
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              <Divider style={{ margin: '12px 0' }} />
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {paymentMethods.map((method, i) => (
                  <Row key={i} justify="space-between" align="middle">
                    <Space>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: method.color }} />
                      <Text>{method.name}</Text>
                    </Space>
                    <Text strong>{method.value}%</Text>
                  </Row>
                ))}
              </Space>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Orders and Activity Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Recent Orders */}
        <Col xs={24} xl={16}>
          <motion.div variants={itemVariants}>
            <Card
              title={
                <Space>
                  <ShoppingCartOutlined style={{ color: '#1890ff' }} />
                  <Text strong>Recent Transactions</Text>
                  <Badge count={recentOrders.length} style={{ backgroundColor: '#1890ff' }} />
                </Space>
              }
              extra={<Button type="primary" ghost onClick={() => navigate('/retailer/orders')}>View All</Button>}
              style={{ borderRadius: 12 }}
            >
              <Table
                columns={orderColumns}
                dataSource={recentOrders}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            </Card>
          </motion.div>
        </Col>

        {/* Activity & Alerts */}
        <Col xs={24} xl={8}>
          <motion.div variants={itemVariants}>
            <Card
              title={
                <Space>
                  <BellOutlined style={{ color: '#1890ff' }} />
                  <Text strong>Activity Feed</Text>
                </Space>
              }
              style={{ borderRadius: 12 }}
              bodyStyle={{ maxHeight: 380, overflow: 'auto' }}
            >
              <Timeline
                items={recentActivity.map((activity, index) => ({
                  dot: (
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: `${getActivityColor(activity.type)}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getActivityColor(activity.type),
                    }}>
                      {activity.icon}
                    </div>
                  ),
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

      {/* Bottom Row */}
      <Row gutter={[16, 16]}>
        {/* Top Products */}
        <Col xs={24} lg={14}>
          <motion.div variants={itemVariants}>
            <Card
              title={
                <Space>
                  <FireOutlined style={{ color: '#fa541c' }} />
                  <Text strong>Top Selling Products</Text>
                </Space>
              }
              extra={<Button type="link" onClick={() => navigate('/retailer/inventory')}>View Inventory</Button>}
              style={{ borderRadius: 12 }}
            >
              <List
                dataSource={topProducts}
                renderItem={(product, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Badge count={index + 1} style={{ backgroundColor: index < 3 ? '#fa541c' : '#d9d9d9' }}>
                            {product.image ? (
                              <Avatar size={44} src={product.image} />
                            ) : (
                              <Avatar size={44} style={{ backgroundColor: '#1890ff' }}>
                                {product.name.charAt(0)}
                              </Avatar>
                            )}
                        </Badge>
                      }
                      title={
                        <Space>
                          <Text strong>{product.name}</Text>
                          <Tag color={product.trend >= 0 ? 'success' : 'error'}>
                            {product.trend >= 0 ? '+' : ''}{product.trend}%
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space split={<Divider type="vertical" />}>
                          <Text type="secondary">{product.sold} sold</Text>
                          <Text type="secondary">{formatCurrency(product.revenue)}</Text>
                          <Text type={product.stock < 20 ? 'danger' : 'secondary'}>
                            {product.stock} in stock
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </motion.div>
        </Col>

        {/* Low Stock Alert */}
        <Col xs={24} lg={10}>
          <motion.div variants={itemVariants}>
            <Card
              title={
                <Space>
                  <WarningOutlined style={{ color: '#fa8c16' }} />
                  <Text strong>Low Stock Alert</Text>
                  <Badge count={stats?.lowStockCount || 0} style={{ backgroundColor: '#fa8c16' }} />
                </Space>
              }
              extra={<Button type="primary" ghost icon={<PlusOutlined />} onClick={() => navigate('/retailer/add-stock')}>Order Stock</Button>}
              style={{ borderRadius: 12 }}
            >
              <AnimatePresence>
                <List
                  dataSource={lowStockItems}
                  renderItem={(item, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <List.Item
                        actions={[
                          <Button key="reorder" type="primary" size="small" style={{ background: '#fa8c16', borderColor: '#fa8c16' }} onClick={() => navigate('/retailer/add-stock')}>
                            Reorder
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            item.image ? (
                              <Avatar size={40} src={item.image} shape="square" />
                            ) : (
                              <Avatar size={40} style={{ backgroundColor: '#fa8c1615', color: '#fa8c16' }} icon={<InboxOutlined />} />
                            )
                          }
                          title={<Text strong>{item.name}</Text>}
                          description={
                            <Space direction="vertical" size={2}>
                              <Text type="danger" strong>{item.stock} units left</Text>
                              <Progress
                                percent={Math.round((item.stock / item.threshold) * 100)}
                                size="small"
                                strokeColor="#fa8c16"
                                trailColor="#fff1e6"
                                showInfo={false}
                              />
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


    </motion.div>
  );
};
