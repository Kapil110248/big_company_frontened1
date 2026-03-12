import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Table,
  Tag,
  Select,
  DatePicker,
  Space,
  Progress,
  List,
  Avatar,
} from 'antd';
import {
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  FallOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { wholesalerApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface AnalyticsData {
  revenue: {
    total: number;
    change: number;
    daily: { date: string; amount: number }[];
  };
  orders: {
    total: number;
    change: number;
    byStatus: { status: string; count: number }[];
  };
  products: {
    total: number;
    lowStock: number;
    topSelling: { name: string; quantity: number; revenue: number }[];
  };
  retailers: {
    total: number;
    active: number;
    topBuyers: { name: string; orders: number; revenue: number }[];
  };
}

export const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<AnalyticsData | null>(null);

  const maxRevenue = Math.max(...(data?.revenue.daily.map(d => d.amount) || [1000000]));
  const chartHeight = 150;

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Try to fetch real analytics
      const response = await wholesalerApi.getDashboardStats();
      const stats = response.data;

      // Transform API response to analytics format
      setData({
        revenue: {
          total: stats.totalRevenue || 0,
          change: 0,
          daily: stats.revenueTrend || [],
        },
        orders: {
          total: stats.totalOrders || 0,
          change: 0,
          byStatus: [
            { status: 'Completed', count: stats.totalOrders || 0 },
            { status: 'Pending', count: stats.pendingOrdersCount || 0 },
          ],
        },
        products: {
          total: stats.totalProducts || 0,
          lowStock: stats.lowStockItems || 0,
          topSelling: stats.topSellingProducts || [],
        },
        retailers: {
          total: stats.activeRetailers || 0,
          active: stats.activeRetailers || 0,
          topBuyers: stats.topBuyers || [],
        },
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Use demo data
      setData({
        revenue: {
          total: 156000000,
          change: 12.5,
          daily: [
            { date: '2024-11-24', amount: 5200000 },
            { date: '2024-11-25', amount: 6800000 },
            { date: '2024-11-26', amount: 7100000 },
            { date: '2024-11-27', amount: 5900000 },
            { date: '2024-11-28', amount: 8200000 },
            { date: '2024-11-29', amount: 9100000 },
            { date: '2024-11-30', amount: 8500000 },
          ],
        },
        orders: {
          total: 892,
          change: 8.3,
          byStatus: [
            { status: 'Completed', count: 720 },
            { status: 'Pending', count: 45 },
            { status: 'Processing', count: 89 },
            { status: 'Shipped', count: 38 },
          ],
        },
        products: {
          total: 248,
          lowStock: 12,
          topSelling: [
            { name: 'Inyange Milk 1L', quantity: 2450, revenue: 2205000 },
            { name: 'Bralirwa Beer 500ml', quantity: 1890, revenue: 1701000 },
            { name: 'Prima Rice 5kg', quantity: 1245, revenue: 3735000 },
            { name: 'Cooking Oil 5L', quantity: 980, revenue: 4900000 },
            { name: 'Sugar 1kg', quantity: 1560, revenue: 1560000 },
          ],
        },
        retailers: {
          total: 156,
          active: 132,
          topBuyers: [
            { name: 'Kigali Mega Store', orders: 89, revenue: 12500000 },
            { name: 'Nyarugenge Mart', orders: 67, revenue: 8900000 },
            { name: 'Gasabo Trading', orders: 54, revenue: 7200000 },
            { name: 'Kimihurura Shop', orders: 45, revenue: 5800000 },
            { name: 'Remera Market', orders: 42, revenue: 5100000 },
          ],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} RWF`;

  const topProductColumns = [
    { title: 'Product', dataIndex: 'name', key: 'name' },
    { title: 'Qty Sold', dataIndex: 'quantity', key: 'quantity', render: (q: number) => q.toLocaleString() },
    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (r: number) => formatCurrency(r) },
  ];

  const topRetailerColumns = [
    { title: 'Retailer', dataIndex: 'name', key: 'name' },
    { title: 'Orders', dataIndex: 'orders', key: 'orders' },
    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (r: number) => formatCurrency(r) },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
          padding: '24px',
          marginBottom: 24,
          borderRadius: 8,
          color: 'white',
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              <LineChartOutlined /> Analytics Dashboard
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              Track your business performance and insights
            </Text>
          </Col>
          <Col>
            <Space>
              <Select
                value={period}
                onChange={setPeriod}
                style={{ width: 120 }}
                options={[
                  { value: 'week', label: 'This Week' },
                  { value: 'month', label: 'This Month' },
                  { value: 'quarter', label: 'This Quarter' },
                  { value: 'year', label: 'This Year' },
                ]}
              />
              <RangePicker style={{ background: 'white' }} />
            </Space>
          </Col>
        </Row>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Total Revenue"
              value={data?.revenue.total || 0}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <div style={{ marginTop: 8 }}>
              {(data?.revenue.change || 0) > 0 ? (
                <Text type="success">
                  <RiseOutlined /> +{data?.revenue.change}% from last period
                </Text>
              ) : (
                <Text type="danger">
                  <FallOutlined /> {data?.revenue.change}% from last period
                </Text>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Total Orders"
              value={data?.orders.total || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="success">
                <RiseOutlined /> +{data?.orders.change}% from last period
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Active Retailers"
              value={data?.retailers.active || 0}
              suffix={`/ ${data?.retailers.total || 0}`}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Progress
              percent={Math.round(((data?.retailers.active || 0) / (data?.retailers.total || 1)) * 100)}
              showInfo={false}
              strokeColor="#722ed1"
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Products"
              value={data?.products.total || 0}
              prefix={<BarChartOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="warning">{data?.products.lowStock || 0} low stock items</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Revenue Chart Placeholder */}
      {/* Revenue Chart Placeholder */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title={<><LineChartOutlined /> Revenue Trend (Last 7 Days)</>}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 16, padding: '0 16px' }}>
              {data?.revenue.daily.map((day, idx) => (
                <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      height: `${(day.amount / (maxRevenue || 1)) * chartHeight}px`,
                      background: 'linear-gradient(180deg, #722ed1 0%, #531dab 100%)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 2,
                      transition: 'height 0.3s',
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                    {day.date.split('-')[2]}
                  </Text>
                  <Text style={{ fontSize: 10, display: 'block' }}>
                    {day.amount > 1000000 ? `${(day.amount / 1000000).toFixed(1)}M` : `${(day.amount / 1000).toFixed(0)}K`}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Order Status & Top Products */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card title={<><PieChartOutlined /> Order Status Distribution</>}>
            <List
              dataSource={data?.orders.byStatus || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Tag
                        color={
                          item.status === 'Completed'
                            ? 'green'
                            : item.status === 'Pending'
                              ? 'orange'
                              : item.status === 'Processing'
                                ? 'blue'
                                : 'cyan'
                        }
                      >
                        {item.status}
                      </Tag>
                    }
                    title={`${item.count} orders`}
                  />
                  <Progress
                    percent={Math.round((item.count / (data?.orders.total || 1)) * 100)}
                    size="small"
                    style={{ width: 100 }}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title={<><TrophyOutlined /> Top Selling Products</>}>
            <Table
              columns={topProductColumns}
              dataSource={data?.products.topSelling || []}
              rowKey="name"
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Top Retailers */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title={<><TeamOutlined /> Top Retailers by Revenue</>}>
            <Table
              columns={topRetailerColumns}
              dataSource={data?.retailers.topBuyers || []}
              rowKey="name"
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsPage;
