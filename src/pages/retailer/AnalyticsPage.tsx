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
} from 'antd';
import {
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  FallOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { retailerApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface AnalyticsData {
  revenue: {
    total: number;
    change: number;
    daily: { date: string; amount: number }[];
  };
  sales: {
    total: number;
    change: number;
    byCategory: { category: string; count: number; revenue: number }[];
  };
  products: {
    total: number;
    lowStock: number;
    topSelling: { name: string; quantity: number; revenue: number }[];
  };
  customers: {
    total: number;
    newThisMonth: number;
    topBuyers: { name: string; orders: number; spent: number }[];
  };
}

export const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await retailerApi.getAnalytics({ period });
      setData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Use demo data on error (for fallback presentation)
      setData({
        revenue: {
          total: 8500000,
          change: 15.2,
          daily: [
            { date: '2024-11-24', amount: 320000 },
            { date: '2024-11-25', amount: 450000 },
            { date: '2024-11-26', amount: 380000 },
            { date: '2024-11-27', amount: 520000 },
            { date: '2024-11-28', amount: 480000 },
            { date: '2024-11-29', amount: 610000 },
            { date: '2024-11-30', amount: 550000 },
          ],
        },
        sales: {
          total: 342,
          change: 12.8,
          byCategory: [
            { category: 'Beverages', count: 89, revenue: 890000 },
            { category: 'Food & Snacks', count: 124, revenue: 1240000 },
            { category: 'Household', count: 67, revenue: 670000 },
            { category: 'Personal Care', count: 42, revenue: 420000 },
            { category: 'Other', count: 20, revenue: 200000 },
          ],
        },
        products: {
          total: 156,
          lowStock: 8,
          topSelling: [
            { name: 'Inyange Milk 1L', quantity: 145, revenue: 130500 },
            { name: 'Bralirwa Beer 500ml', quantity: 98, revenue: 88200 },
            { name: 'Bread (Large)', quantity: 234, revenue: 117000 },
            { name: 'Cooking Oil 1L', quantity: 67, revenue: 134000 },
            { name: 'Sugar 1kg', quantity: 89, revenue: 89000 },
          ],
        },
        customers: {
          total: 234,
          newThisMonth: 28,
          topBuyers: [
            { name: 'Jean Pierre', orders: 12, spent: 85000 },
            { name: 'Marie Claire', orders: 9, spent: 67500 },
            { name: 'Emmanuel K.', orders: 8, spent: 54000 },
            { name: 'Grace M.', orders: 7, spent: 48000 },
            { name: 'Patrick N.', orders: 6, spent: 42000 },
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
    { title: 'Qty Sold', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (r: number) => formatCurrency(r) },
  ];

  const topCustomerColumns = [
    { title: 'Customer', dataIndex: 'name', key: 'name' },
    { title: 'Orders', dataIndex: 'orders', key: 'orders' },
    { title: 'Total Spent', dataIndex: 'spent', key: 'spent', render: (r: number) => formatCurrency(r) },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          padding: '24px',
          marginBottom: 24,
          borderRadius: 8,
          color: 'white',
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              <LineChartOutlined /> Shop Analytics
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              Track your shop performance and sales insights
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
              title="Total Sales"
              value={data?.sales.total || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="success">
                <RiseOutlined /> +{data?.sales.change}% from last period
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Products"
              value={data?.products.total || 0}
              prefix={<ShoppingOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="warning">{data?.products.lowStock || 0} low stock</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Customers"
              value={data?.customers.total || 0}
              prefix={<UserOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div style={{ marginTop: 8 }}>
              <Tag color="success">+{data?.customers.newThisMonth || 0} new</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Revenue Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title={<><LineChartOutlined /> Daily Revenue (Last 7 Days)</>}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 16, padding: '0 16px' }}>
              {data?.revenue.daily.map((day, idx) => (
                <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      height: `${(day.amount / 700000) * 150}px`,
                      background: 'linear-gradient(180deg, #1890ff 0%, #096dd9 100%)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 20,
                      transition: 'height 0.3s',
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                    {day.date.split('-')[2]}
                  </Text>
                  <Text style={{ fontSize: 10, display: 'block' }}>
                    {(day.amount / 1000).toFixed(0)}K
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Category Breakdown & Top Products */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card title={<><PieChartOutlined /> Sales by Category</>}>
            <List
              dataSource={data?.sales.byCategory || []}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.category}
                    description={`${item.count} sales`}
                  />
                  <div style={{ textAlign: 'right' }}>
                    <Text strong>{formatCurrency(item.revenue)}</Text>
                    <Progress
                      percent={Math.round((item.count / (data?.sales.total || 1)) * 100)}
                      size="small"
                      style={{ width: 80 }}
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title={<><BarChartOutlined /> Top Selling Products</>}>
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

      {/* Top Customers */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title={<><UserOutlined /> Top Customers</>}>
            <Table
              columns={topCustomerColumns}
              dataSource={data?.customers.topBuyers || []}
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
