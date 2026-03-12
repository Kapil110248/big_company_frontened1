import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  DatePicker,
  Select,
  Space,
  Typography,
  Tag,
  Spin,
  message,
  Tabs,
  Divider,
  Progress,
  List,
  Avatar,
} from 'antd';
import {
  DownloadOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  CreditCardOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  TeamOutlined,
  ShopOutlined,
  BankOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined,
  FireOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Types
interface DashboardStats {
  customers: {
    total: number;
    last24h: number;
    last7d: number;
    last30d: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    todayOrders: number;
  };
  transactions: {
    total: number;
    walletTopups: number;
    gasPurchases: number;
    nfcPayments: number;
    loanDisbursements: number;
    totalVolume: number;
  };
  loans: {
    total: number;
    pending: number;
    active: number;
    paid: number;
    defaulted: number;
    outstandingAmount: number;
  };
  gas: {
    totalPurchases: number;
    totalAmount: number;
    totalUnits: number;
  };
  nfcCards: {
    total: number;
    active: number;
    linked: number;
  };
  retailers: {
    total: number;
    active: number;
    verified: number;
  };
  wholesalers: {
    total: number;
    active: number;
  };
  recentActivity: any[];
}

interface ReportData {
  period: string;
  type?: string;
  count: number;
  total_amount: number;
}

// Mock data for demo
const mockDashboardStats: DashboardStats = {
  customers: { total: 15420, last24h: 45, last7d: 312, last30d: 1250 },
  orders: { total: 8920, pending: 124, processing: 89, delivered: 8450, cancelled: 257, totalRevenue: 45680000, todayOrders: 67 },
  transactions: { total: 52340, walletTopups: 18500, gasPurchases: 12400, nfcPayments: 15800, loanDisbursements: 5640, totalVolume: 128500000 },
  loans: { total: 3240, pending: 87, active: 1250, paid: 1850, defaulted: 53, outstandingAmount: 25600000 },
  gas: { totalPurchases: 12400, totalAmount: 8750000, totalUnits: 437500 },
  nfcCards: { total: 8500, active: 7800, linked: 6200 },
  retailers: { total: 342, active: 315, verified: 298 },
  wholesalers: { total: 28, active: 25 },
  recentActivity: [
    { id: 1, action: 'new_customer', entity_type: 'customer', created_at: new Date().toISOString() },
    { id: 2, action: 'order_placed', entity_type: 'order', created_at: new Date().toISOString() },
    { id: 3, action: 'loan_approved', entity_type: 'loan', created_at: new Date().toISOString() },
  ],
};

const mockTransactionReport: ReportData[] = [
  { period: '2024-11-25', type: 'wallet_topup', count: 120, total_amount: 2500000 },
  { period: '2024-11-26', type: 'wallet_topup', count: 145, total_amount: 2850000 },
  { period: '2024-11-27', type: 'wallet_topup', count: 132, total_amount: 2640000 },
  { period: '2024-11-28', type: 'wallet_topup', count: 158, total_amount: 3200000 },
  { period: '2024-11-29', type: 'wallet_topup', count: 167, total_amount: 3450000 },
  { period: '2024-11-30', type: 'wallet_topup', count: 142, total_amount: 2900000 },
  { period: '2024-11-25', type: 'nfc_payment', count: 85, total_amount: 1750000 },
  { period: '2024-11-26', type: 'nfc_payment', count: 92, total_amount: 1920000 },
  { period: '2024-11-27', type: 'nfc_payment', count: 78, total_amount: 1580000 },
  { period: '2024-11-28', type: 'nfc_payment', count: 105, total_amount: 2150000 },
  { period: '2024-11-29', type: 'nfc_payment', count: 118, total_amount: 2450000 },
  { period: '2024-11-30', type: 'nfc_payment', count: 98, total_amount: 2020000 },
];

const mockRevenueReport = [
  { period: '2024-11-25', order_count: 45, order_revenue: 1250000, gas_count: 120, gas_revenue: 850000 },
  { period: '2024-11-26', order_count: 52, order_revenue: 1480000, gas_count: 135, gas_revenue: 920000 },
  { period: '2024-11-27', order_count: 48, order_revenue: 1350000, gas_count: 128, gas_revenue: 880000 },
  { period: '2024-11-28', order_count: 61, order_revenue: 1720000, gas_count: 142, gas_revenue: 980000 },
  { period: '2024-11-29', order_count: 58, order_revenue: 1620000, gas_count: 155, gas_revenue: 1050000 },
  { period: '2024-11-30', order_count: 54, order_revenue: 1520000, gas_count: 138, gas_revenue: 940000 },
];

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(mockDashboardStats);
  const [transactionReport, setTransactionReport] = useState<ReportData[]>(mockTransactionReport);
  const [revenueReport, setRevenueReport] = useState(mockRevenueReport);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [dateRange, reportPeriod]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getDashboard();
      if (response.data?.dashboard) {
        setStats(response.data.dashboard);
      }
    } catch (error) {
      console.log('Using mock dashboard data');
      // Use mock data on error
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const groupBy = reportPeriod === 'monthly' ? 'month' : 'day';
      const [txResponse, revResponse] = await Promise.all([
        adminApi.getTransactionReport({
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
          groupBy,
        }),
        adminApi.getRevenueReport({
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
          groupBy,
        }),
      ]); 

      if (txResponse.data?.report) {
        setTransactionReport(txResponse.data.report);
      }
      if (revResponse.data?.orders) {
        setRevenueReport(revResponse.data.orders);
      }
    } catch (error) {
      console.log('Using mock report data');
    }
  };

  // Process transaction data for charts
  const processedTxData = React.useMemo(() => {
    const grouped: Record<string, any> = {};
    transactionReport.forEach((item) => {
      const date = item.period.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { date, wallet_topup: 0, nfc_payment: 0, gas_purchase: 0, loan: 0 };
      }
      if (item.type === 'wallet_topup') grouped[date].wallet_topup = item.total_amount;
      if (item.type === 'nfc_payment') grouped[date].nfc_payment = item.total_amount;
      if (item.type === 'gas_purchase') grouped[date].gas_purchase = item.total_amount;
      if (item.type === 'loan_disbursement') grouped[date].loan = item.total_amount;
    });
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [transactionReport]);

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      message.warning('No data to export');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => (typeof val === 'string' && val.includes(',') ? `"${val}"` : val))
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${dayjs().format('YYYY-MM-DD')}.csv`;
    link.click();
    message.success(`${filename} exported successfully`);
  };

  const exportDailyReport = () => {
    setExportLoading(true);
    const reportData = processedTxData.map((item) => ({
      Date: item.date,
      'Wallet Top-ups (RWF)': item.wallet_topup,
      'NFC Payments (RWF)': item.nfc_payment,
      'Gas Purchases (RWF)': item.gas_purchase,
      'Loan Disbursements (RWF)': item.loan,
      'Total (RWF)': item.wallet_topup + item.nfc_payment + item.gas_purchase + item.loan,
    }));
    exportToCSV(reportData, 'daily_transaction_report');
    setExportLoading(false);
  };

  const exportWeeklyReport = () => {
    setExportLoading(true);
    // Group by week
    const weeklyData: Record<string, any> = {};
    processedTxData.forEach((item) => {
      const weekStart = dayjs(item.date).startOf('week').format('YYYY-MM-DD');
      if (!weeklyData[weekStart]) {
        weeklyData[weekStart] = {
          week_start: weekStart,
          week_end: dayjs(weekStart).endOf('week').format('YYYY-MM-DD'),
          wallet_topup: 0,
          nfc_payment: 0,
          gas_purchase: 0,
          loan: 0,
        };
      }
      weeklyData[weekStart].wallet_topup += item.wallet_topup;
      weeklyData[weekStart].nfc_payment += item.nfc_payment;
      weeklyData[weekStart].gas_purchase += item.gas_purchase;
      weeklyData[weekStart].loan += item.loan;
    });

    const reportData = Object.values(weeklyData).map((item: any) => ({
      'Week Start': item.week_start,
      'Week End': item.week_end,
      'Wallet Top-ups (RWF)': item.wallet_topup,
      'NFC Payments (RWF)': item.nfc_payment,
      'Gas Purchases (RWF)': item.gas_purchase,
      'Loan Disbursements (RWF)': item.loan,
      'Total (RWF)': item.wallet_topup + item.nfc_payment + item.gas_purchase + item.loan,
    }));
    exportToCSV(reportData, 'weekly_transaction_report');
    setExportLoading(false);
  };

  const exportMonthlyReport = () => {
    setExportLoading(true);
    // Group by month
    const monthlyData: Record<string, any> = {};
    processedTxData.forEach((item) => {
      const month = dayjs(item.date).format('YYYY-MM');
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          wallet_topup: 0,
          nfc_payment: 0,
          gas_purchase: 0,
          loan: 0,
        };
      }
      monthlyData[month].wallet_topup += item.wallet_topup;
      monthlyData[month].nfc_payment += item.nfc_payment;
      monthlyData[month].gas_purchase += item.gas_purchase;
      monthlyData[month].loan += item.loan;
    });

    const reportData = Object.values(monthlyData).map((item: any) => ({
      Month: item.month,
      'Wallet Top-ups (RWF)': item.wallet_topup,
      'NFC Payments (RWF)': item.nfc_payment,
      'Gas Purchases (RWF)': item.gas_purchase,
      'Loan Disbursements (RWF)': item.loan,
      'Total (RWF)': item.wallet_topup + item.nfc_payment + item.gas_purchase + item.loan,
    }));
    exportToCSV(reportData, 'monthly_transaction_report');
    setExportLoading(false);
  };

  const exportSummaryReport = () => {
    setExportLoading(true);
    const summaryData = [
      {
        Category: 'Customers',
        'Total': stats.customers.total,
        'New (24h)': stats.customers.last24h,
        'New (7d)': stats.customers.last7d,
        'New (30d)': stats.customers.last30d,
      },
      {
        Category: 'Orders',
        'Total': stats.orders.total,
        'Pending': stats.orders.pending,
        'Processing': stats.orders.processing,
        'Delivered': stats.orders.delivered,
        'Revenue (RWF)': stats.orders.totalRevenue,
      },
      {
        Category: 'Transactions',
        'Total': stats.transactions.total,
        'Wallet Top-ups': stats.transactions.walletTopups,
        'NFC Payments': stats.transactions.nfcPayments,
        'Gas Purchases': stats.transactions.gasPurchases,
        'Volume (RWF)': stats.transactions.totalVolume,
      },
      {
        Category: 'Loans',
        'Total': stats.loans.total,
        'Active': stats.loans.active,
        'Pending': stats.loans.pending,
        'Defaulted': stats.loans.defaulted,
        'Outstanding (RWF)': stats.loans.outstandingAmount,
      },
      {
        Category: 'NFC Cards',
        'Total': stats.nfcCards.total,
        'Active': stats.nfcCards.active,
        'Linked': stats.nfcCards.linked,
      },
      {
        Category: 'Retailers',
        'Total': stats.retailers.total,
        'Active': stats.retailers.active,
        'Verified': stats.retailers.verified,
      },
      {
        Category: 'Wholesalers',
        'Total': stats.wholesalers.total,
        'Active': stats.wholesalers.active,
      },
    ];
    exportToCSV(summaryData, 'platform_summary_report');
    setExportLoading(false);
  };

  // Pie chart data for transaction types
  const transactionTypeData = [
    { name: 'Wallet Top-ups', value: stats.transactions.walletTopups },
    { name: 'NFC Payments', value: stats.transactions.nfcPayments },
    { name: 'Gas Purchases', value: stats.transactions.gasPurchases },
    { name: 'Loan Disbursements', value: stats.transactions.loanDisbursements },
  ];

  // Order status pie data
  const orderStatusData = [
    { name: 'Pending', value: stats.orders.pending },
    { name: 'Processing', value: stats.orders.processing },
    { name: 'Delivered', value: stats.orders.delivered },
    { name: 'Cancelled', value: stats.orders.cancelled },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Admin Dashboard</Title>
          <Text type="secondary">BIG Company Rwanda - Platform Overview</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchDashboard}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Customers"
              value={stats.customers.total}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              suffix={
                <Tag color="green" style={{ marginLeft: 8 }}>
                  +{stats.customers.last24h} today
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats.orders.totalRevenue}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="RWF"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active NFC Cards"
              value={stats.nfcCards.active}
              prefix={<CreditCardOutlined style={{ color: '#722ed1' }} />}
              suffix={`/ ${stats.nfcCards.total}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Transaction Volume (30d)"
              value={stats.transactions.totalVolume}
              prefix={<BankOutlined style={{ color: '#faad14' }} />}
              suffix="RWF"
            />
          </Card>
        </Col>
      </Row>

      {/* Secondary Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="Retailers"
              value={stats.retailers.active}
              suffix={`/ ${stats.retailers.total}`}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="Wholesalers"
              value={stats.wholesalers.active}
              suffix={`/ ${stats.wholesalers.total}`}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="Orders Today"
              value={stats.orders.todayOrders}
              valueStyle={{ fontSize: 20, color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="Pending Orders"
              value={stats.orders.pending}
              valueStyle={{ fontSize: 20, color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="Active Loans"
              value={stats.loans.active}
              valueStyle={{ fontSize: 20, color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="Pending Loans"
              value={stats.loans.pending}
              valueStyle={{ fontSize: 20, color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="Defaulted"
              value={stats.loans.defaulted}
              valueStyle={{ fontSize: 20, color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <Card size="small">
            <Statistic
              title="Outstanding"
              value={stats.loans.outstandingAmount}
              valueStyle={{ fontSize: 14 }}
              suffix="RWF"
            />
          </Card>
        </Col>
      </Row>

      {/* Gas Section */}
      <Title level={4} style={{ marginBottom: 16 }}>Gas Service Overview</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Gas Purchases"
              value={stats.gas.totalPurchases}
              prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Gas Revenue"
              value={stats.gas.totalAmount}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="RWF"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Units Distributed"
              value={stats.gas.totalUnits}
              prefix={<RiseOutlined style={{ color: '#faad14' }} />}
              suffix="M³"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Section */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Transaction Trend */}
        <Col xs={24} lg={16}>
          <Card
            title="Transaction Volume Trend"
            extra={
              <Space>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                  allowClear={false}
                />
              </Space>
            }
          >
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={processedTxData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: number) => `${(value ?? 0).toLocaleString()} RWF`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="wallet_topup"
                  name="Wallet Top-ups"
                  stackId="1"
                  stroke="#1890ff"
                  fill="#1890ff"
                />
                <Area
                  type="monotone"
                  dataKey="nfc_payment"
                  name="NFC Payments"
                  stackId="1"
                  stroke="#52c41a"
                  fill="#52c41a"
                />
                <Area
                  type="monotone"
                  dataKey="gas_purchase"
                  name="Gas Purchases"
                  stackId="1"
                  stroke="#faad14"
                  fill="#faad14"
                />
                <Area
                  type="monotone"
                  dataKey="loan"
                  name="Loans"
                  stackId="1"
                  stroke="#722ed1"
                  fill="#722ed1"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Transaction Distribution */}
        <Col xs={24} lg={8}>
          <Card title="Transaction Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={transactionTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {transactionTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => (value ?? 0).toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Revenue Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Daily Revenue">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueReport}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tickFormatter={(v) => dayjs(v).format('MMM D')} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: number) => `${(value ?? 0).toLocaleString()} RWF`}
                  labelFormatter={(label) => dayjs(label).format('MMMM D, YYYY')}
                />
                <Legend />
                <Bar dataKey="order_revenue" name="Orders" fill="#1890ff" />
                <Bar dataKey="gas_revenue" name="Gas" fill="#52c41a" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Order Status Distribution">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#faad14" />
                  <Cell fill="#1890ff" />
                  <Cell fill="#52c41a" />
                  <Cell fill="#f5222d" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Downloadable Reports Section */}
      <Card
        title={
          <Space>
            <DownloadOutlined />
            <span>Downloadable Reports</span>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              size="small"
              onClick={exportDailyReport}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <FileExcelOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
              <div><strong>Daily Report</strong></div>
              <Text type="secondary">Transaction breakdown by day</Text>
              <div style={{ marginTop: 8 }}>
                <Button type="primary" icon={<DownloadOutlined />} loading={exportLoading}>
                  CSV
                </Button>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              size="small"
              onClick={exportWeeklyReport}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <FileExcelOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
              <div><strong>Weekly Report</strong></div>
              <Text type="secondary">Aggregated by week</Text>
              <div style={{ marginTop: 8 }}>
                <Button type="primary" icon={<DownloadOutlined />} loading={exportLoading}>
                  CSV
                </Button>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              size="small"
              onClick={exportMonthlyReport}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <FileExcelOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
              <div><strong>Monthly Report</strong></div>
              <Text type="secondary">Monthly summary</Text>
              <div style={{ marginTop: 8 }}>
                <Button type="primary" icon={<DownloadOutlined />} loading={exportLoading}>
                  CSV
                </Button>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              hoverable
              size="small"
              onClick={exportSummaryReport}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <FilePdfOutlined style={{ fontSize: 32, color: '#f5222d', marginBottom: 8 }} />
              <div><strong>Platform Summary</strong></div>
              <Text type="secondary">Full platform overview</Text>
              <div style={{ marginTop: 8 }}>
                <Button type="primary" icon={<DownloadOutlined />} loading={exportLoading}>
                  CSV
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16} align="middle">
          <Col>
            <Text strong>Custom Date Range:</Text>
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
          </Col>
          <Col>
            <Select value={reportPeriod} onChange={setReportPeriod} style={{ width: 120 }}>
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
              <Option value="monthly">Monthly</Option>
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => {
                if (reportPeriod === 'daily') exportDailyReport();
                else if (reportPeriod === 'weekly') exportWeeklyReport();
                else exportMonthlyReport();
              }}
              loading={exportLoading}
            >
              Export Selected Period
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Recent Activity */}
      <Card title="Recent Activity" style={{ marginBottom: 24 }}>
        <List
          dataSource={stats.recentActivity.slice(0, 10)}
          renderItem={(item: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={
                      item.entity_type === 'customer' ? <UserOutlined /> :
                        item.entity_type === 'order' ? <ShoppingCartOutlined /> :
                          item.entity_type === 'loan' ? <BankOutlined /> :
                            item.entity_type === 'gas' ? <FireOutlined /> :
                              <CreditCardOutlined />
                    }
                    style={{
                      backgroundColor:
                        item.entity_type === 'customer' ? '#1890ff' :
                          item.entity_type === 'order' ? '#52c41a' :
                            item.entity_type === 'loan' ? '#722ed1' :
                              item.entity_type === 'gas' ? '#fa8c16' :
                                '#faad14'
                    }}
                  />
                }
                title={item.action.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                description={`${item.description} - ${dayjs(item.created_at).fromNow()}`}
              />
            </List.Item>
          )}
          locale={{ emptyText: 'No recent activity' }}
        />
      </Card>
    </div>
  );
};

export default AdminDashboard;
