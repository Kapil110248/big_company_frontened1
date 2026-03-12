import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Statistic,
  Tabs,
  Select,
  Progress,
  Divider,
  List,
  Tag,
  message,
  Alert
} from 'antd';
import {
  BarChartOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
  DashboardOutlined,
  ShoppingOutlined,
  TeamOutlined,
  InboxOutlined,
  FireOutlined,
  RiseOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [dateRange, setDateRange] = useState('7days');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getReports({ dateRange });
      if (response.data.success) {
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      message.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, prefix, suffix, icon, color, growth }: any) => (
    <Card 
      bordered={false} 
      className="stat-card" 
      loading={loading}
      style={{ 
        height: '100%', 
        borderRadius: '8px', 
        overflow: 'hidden', 
        borderLeft: `3px solid ${color}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: '12px'
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <Text type="secondary" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
           {icon && React.cloneElement(icon as React.ReactElement, { style: { color, fontSize: '14px' } })}
           {title}
        </Text>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
          <Text strong style={{ fontSize: '18px', color: '#262626' }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Text>
          {suffix && <Text style={{ fontSize: '12px', color: color }}>{suffix}</Text>}
        </div>
        {growth && (
          <div style={{ marginTop: '2px' }}>
            <Tag color="#f6ffed" style={{ color: '#52c41a', border: 'none', margin: 0, fontSize: '10px', padding: '0 4px' }}>
              <ArrowUpOutlined /> {growth}%
            </Tag>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '24px' }}>
      {/* Purple Header Banner */}
      <Card bordered={false} style={{ 
        background: 'linear-gradient(90deg, #722ed1 0%, #531dab 100%)', 
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(114, 46, 209, 0.2)'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="start">
              <BarChartOutlined style={{ color: 'white', fontSize: 32, marginTop: 4 }} />
              <div>
                <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 600 }}>Reports & Analytics</Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Comprehensive business insights and performance metrics</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: '8px' }}>Refresh</Button>
              <Button ghost icon={<DownloadOutlined />} style={{ borderRadius: '8px' }}>Export CSV</Button>
              <Button type="primary" icon={<DownloadOutlined />} style={{ borderRadius: '8px', background: '#1890ff', border: 'none' }}>Export PDF</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filters Row */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col>
          <div style={{ background: 'white', padding: '4px 12px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarOutlined style={{ color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>Date Range:</Text>
            <Select 
              defaultValue="7days" 
              style={{ width: 140 }} 
              bordered={false}
              onChange={setDateRange}
              size="small"
            >
              <Option value="today">Today</Option>
              <Option value="7days">Last 7 Days</Option>
              <Option value="30days">Last 30 Days</Option>
              <Option value="year">This Year</Option>
            </Select>
          </div>
        </Col>
      </Row>

      {/* Main Stats Row - 6 Cards in 1 Row, more compact */}
      <Row gutter={[12, 12]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={4}>
          <StatCard title="Total Revenue" value={summary?.totalRevenue || 0} suffix="RWF" icon={<DollarOutlined />} color="#1890ff" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatCard title="Total Orders" value={summary?.orderTotal || 0} icon={<ShoppingOutlined />} color="#722ed1" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatCard title="Retailers" value={summary?.retailerTotal || 0} icon={<TeamOutlined />} color="#faad14" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatCard title="Wholesalers" value={summary?.wholesalerTotal || 0} icon={<TeamOutlined />} color="#13c2c2" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatCard title="Gas Distributed" value={summary?.gasDistributed || 0} suffix="M³" icon={<FireOutlined />} color="#eb2f96" />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <StatCard title="Growth Rate" value={summary?.growthRate || 0} suffix="%" icon={<RiseOutlined />} color="#52c41a" growth="8.2" />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Tabs defaultActiveKey="overview" items={[
              {
                key: 'overview',
                label: 'Overview',
                children: (
                  <Row gutter={48}>
                    <Col span={12}>
                      <Title level={5} style={{ fontSize: '14px', marginBottom: '16px' }}><DashboardOutlined style={{ marginRight: 8 }} /> Business Overview</Title>
                      <List split={false} size="small">
                        <List.Item style={{ padding: '8px 0' }}>
                          <Text type="secondary">Total Products</Text>
                          <Text strong>{summary?.businessOverview?.totalProducts || 0}</Text>
                        </List.Item>
                        <List.Item style={{ padding: '8px 0' }}>
                          <Text type="secondary">Total Customers</Text>
                          <Text strong>{summary?.businessOverview?.totalCustomers || 0}</Text>
                        </List.Item>
                        <List.Item style={{ padding: '8px 0' }}>
                          <Text type="secondary">Total Sales Volume</Text>
                          <Text strong>{summary?.businessOverview?.totalSalesVolume || 0}</Text>
                        </List.Item>
                        <Divider dashed style={{ margin: '8px 0' }} />
                        <List.Item style={{ padding: '8px 0' }}>
                          <Text type="secondary">Average Order Value</Text>
                          <Text strong style={{ color: '#52c41a' }}>{(summary?.businessOverview?.avgOrderValue || 0).toLocaleString()} RWF</Text>
                        </List.Item>
                      </List>
                    </Col>
                    <Col span={12} style={{ borderLeft: '1px solid #f0f0f0' }}>
                      <Title level={5} style={{ fontSize: '14px', marginBottom: '16px' }}><DollarOutlined style={{ marginRight: 8 }} /> Loan Overview</Title>
                      <List split={false} size="small">
                        <List.Item style={{ padding: '8px 0' }}>
                          <Text type="secondary">Active Loans</Text>
                          <Tag color="green" style={{ border: 'none' }}>{summary?.loanOverview?.activeLoans || 0}</Tag>
                        </List.Item>
                        <List.Item style={{ padding: '8px 0' }}>
                          <Text type="secondary">Total Loan Amount</Text>
                          <Text strong style={{ color: '#1890ff' }}>{(summary?.loanOverview?.totalLoanAmount || 0).toLocaleString()} RWF</Text>
                        </List.Item>
                        <List.Item style={{ padding: '8px 0' }}>
                          <Text type="secondary">Pending Approvals</Text>
                          <Tag color="orange" style={{ border: 'none' }}>{summary?.loanOverview?.pendingApprovals || 0}</Tag>
                        </List.Item>
                      </List>
                      <Alert 
                        message={`${summary?.loanOverview?.pendingApprovals || 0} loan applications awaiting review`} 
                        type="warning" 
                        showIcon 
                        icon={<ExclamationCircleOutlined />} 
                        style={{ marginTop: 12, borderRadius: '6px', fontSize: '12px' }}
                      />
                    </Col>
                    
                    <Col span={24} style={{ marginTop: 32 }}>
                       <Title level={5} style={{ fontSize: '14px', marginBottom: '24px' }}>Performance Metrics</Title>
                       <Row justify="space-around" align="middle">
                          <Col style={{ textAlign: 'center' }}>
                            <Progress 
                              type="dashboard" 
                              percent={( (summary?.orderTotal || 0) / (summary?.targets?.orders || 5000) ) * 100} 
                              format={() => `${summary?.orderTotal || 0}`}
                              strokeColor="#1890ff"
                              width={100}
                              strokeWidth={8}
                            />
                            <div style={{ marginTop: 8 }}>
                              <Text strong style={{ fontSize: '13px' }}>Orders</Text><br/>
                              <Text type="secondary" style={{ fontSize: '11px' }}>(Target: {summary?.targets?.orders?.toLocaleString() || '5,000'})</Text>
                            </div>
                          </Col>
                          <Col style={{ textAlign: 'center' }}>
                            <Progress 
                              type="dashboard" 
                              percent={( (summary?.retailerTotal || 0) / (summary?.targets?.retailers || 200) ) * 100} 
                              format={() => `${summary?.retailerTotal || 0}`}
                              strokeColor="#52c41a"
                              width={100}
                              strokeWidth={8}
                            />
                            <div style={{ marginTop: 8 }}>
                              <Text strong style={{ fontSize: '13px' }}>Retailers</Text><br/>
                              <Text type="secondary" style={{ fontSize: '11px' }}>(Target: {summary?.targets?.retailers || '200'})</Text>
                            </div>
                          </Col>
                          <Col style={{ textAlign: 'center' }}>
                            <Progress 
                              type="dashboard" 
                              percent={( (summary?.gasDistributed || 0) / (summary?.targets?.gas || 2000) ) * 100} 
                              format={() => `${Math.round(summary?.gasDistributed || 0)} M³`}
                              strokeColor="#722ed1"
                              width={100}
                              strokeWidth={8}
                            />
                            <div style={{ marginTop: 8 }}>
                              <Text strong style={{ fontSize: '13px' }}>Gas Distributed</Text><br/>
                              <Text type="secondary" style={{ fontSize: '11px' }}>(Target: {summary?.targets?.gas?.toLocaleString() || '2,000'} M³)</Text>
                            </div>
                          </Col>
                       </Row>
                    </Col>
                  </Row>
                )
              },
              { key: 'daily', label: 'Daily Sales', children: <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text type="secondary">Sales charts will be available once more data is collected</Text></div> },
              { key: 'products', label: 'Top Products', children: <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text type="secondary">Product performance tracking...</Text></div> },
              { key: 'retailers', label: 'Top Retailers', children: <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Text type="secondary">Retailer ranking system...</Text></div> },
            ]} />
          </Card>
        </Col>
      </Row>

      <style>{`
        .stat-card {
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .ant-tabs-nav::before {
          border-bottom: 1px solid #f0f0f0 !important;
        }
        .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #722ed1 !important;
          font-weight: 600;
        }
        .ant-tabs-ink-bar {
          background: #722ed1 !important;
        }
        .ant-progress-text {
          font-size: 14px !important;
          font-weight: 600 !important;
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
