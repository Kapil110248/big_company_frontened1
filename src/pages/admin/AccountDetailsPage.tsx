import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Tabs,
  Table,
  Statistic,
  Spin,
  message,
  Button,
  Space,
  Descriptions,
  Timeline,
  Badge,
  Alert,
  Divider,
  List,
  Avatar,
  Progress,
} from 'antd';
import {
  UserOutlined,
  WalletOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  FireOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  BankOutlined,
  ShopOutlined,
  TeamOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  DollarOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { adminApi } from '../../services/apiService';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { TabPane } = Tabs;

type AccountType = 'customer' | 'retailer' | 'worker' | 'wholesaler';

const AccountDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const accountType = searchParams.get('type') as AccountType || 'customer';

  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAccountDetails();
    }
  }, [id, accountType]);

  const fetchAccountDetails = async () => {
    setLoading(true);
    try {
      let response;
      switch (accountType) {
        case 'customer':
          response = await adminApi.getCustomerAccountDetails(id!);
          break;
        case 'retailer':
          response = await adminApi.getRetailerAccountDetails(id!);
          break;
        case 'worker':
          response = await adminApi.getWorkerAccountDetails(id!);
          break;
        case 'wholesaler':
          response = await adminApi.getWholesalerAccountDetails(id!);
          break;
        default:
          throw new Error('Invalid account type');
      }
      setAccountData(response.data.accountDetails);
    } catch (error: any) {
      console.error('Error fetching account details:', error);
      message.error('Failed to fetch account details');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAccountDetails();
    setRefreshing(false);
    message.success('Data refreshed');
  };

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'orange', icon: <ClockCircleOutlined /> },
      active: { color: 'blue', icon: <CheckCircleOutlined /> },
      completed: { color: 'green', icon: <CheckCircleOutlined /> },
      delivered: { color: 'green', icon: <CheckCircleOutlined /> },
      cancelled: { color: 'red', icon: <CloseCircleOutlined /> },
      processing: { color: 'blue', icon: <ClockCircleOutlined /> },
    };
    const config = statusConfig[status?.toLowerCase()] || { color: 'default', icon: null };
    return <Tag color={config.color} icon={config.icon}>{status?.toUpperCase()}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading account details...</div>
      </div>
    );
  }

  if (!accountData) {
    return (
      <Alert
        message="Account Not Found"
        description="The requested account could not be found."
        type="error"
        showIcon
        action={
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        }
      />
    );
  }

  const renderCustomerAccount = () => (
    <>
      {/* Wallet Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Dashboard Wallet"
              value={accountData.walletSummary?.dashboardWallet || 0}
              prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
              suffix="RWF"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Rewards Wallet (READ-ONLY)"
              value={accountData.walletSummary?.rewardsWallet || 0}
              prefix={<SafetyCertificateOutlined style={{ color: '#52c41a' }} />}
              suffix="RWF"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Gas Rewards (READ-ONLY)"
              value={accountData.walletSummary?.gasRewardsWallet || 0}
              prefix={<FireOutlined style={{ color: '#fa8c16' }} />}
              suffix="M3"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Credit Wallet"
              value={accountData.walletSummary?.creditWallet || 0}
              prefix={<CreditCardOutlined style={{ color: '#722ed1' }} />}
              suffix="RWF"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Order Statistics */}
      <Card title="Order Statistics" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={8} sm={4}>
            <Statistic title="Pending" value={accountData.orderStats?.pending || 0} valueStyle={{ color: '#faad14' }} />
          </Col>
          <Col xs={8} sm={4}>
            <Statistic title="Active" value={accountData.orderStats?.active || 0} valueStyle={{ color: '#1890ff' }} />
          </Col>
          <Col xs={8} sm={4}>
            <Statistic title="Completed" value={accountData.orderStats?.completed || 0} valueStyle={{ color: '#52c41a' }} />
          </Col>
          <Col xs={8} sm={4}>
            <Statistic title="Cancelled" value={accountData.orderStats?.cancelled || 0} valueStyle={{ color: '#f5222d' }} />
          </Col>
          <Col xs={8} sm={4}>
            <Statistic title="Total" value={accountData.orderStats?.total || 0} />
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="orders">
        <TabPane tab={<span><ShoppingCartOutlined /> Orders</span>} key="orders">
          <Table
            dataSource={accountData.orders || []}
            rowKey="id"
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id' },
              { title: 'Retailer', dataIndex: ['retailerProfile', 'shopName'], key: 'retailer' },
              { title: 'Amount', dataIndex: 'totalAmount', key: 'amount', render: (v: number) => `${v?.toLocaleString()} RWF` },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (d: string) => dayjs(d).format('MMM DD, YYYY HH:mm') },
            ]}
            pagination={{ pageSize: 5 }}
          />
        </TabPane>
        <TabPane tab={<span><HistoryOutlined /> Transactions</span>} key="transactions">
          <Table
            dataSource={accountData.transactionHistory || []}
            rowKey="id"
            columns={[
              { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
              { title: 'Wallet', dataIndex: 'walletType', key: 'wallet' },
              { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => <Text type={v >= 0 ? 'success' : 'danger'}>{v >= 0 ? '+' : ''}{v?.toLocaleString()} RWF</Text> },
              { title: 'Description', dataIndex: 'description', key: 'desc' },
              { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (d: string) => dayjs(d).format('MMM DD, YYYY HH:mm') },
            ]}
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
        <TabPane tab={<span><CreditCardOutlined /> NFC Cards</span>} key="nfc">
          <Table
            dataSource={accountData.nfcCards || []}
            rowKey="id"
            columns={[
              { title: 'UID', dataIndex: 'uid', key: 'uid' },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Balance', dataIndex: 'balance', key: 'balance', render: (v: number) => `${v?.toLocaleString()} RWF` },
              { title: 'Type', dataIndex: 'cardType', key: 'type' },
              { title: 'Linked', dataIndex: 'createdAt', key: 'linked', render: (d: string) => dayjs(d).fromNow() },
            ]}
            pagination={false}
          />
        </TabPane>
        <TabPane tab={<span><FireOutlined /> Gas</span>} key="gas">
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={6}><Statistic title="Total Top-ups" value={accountData.gasUsage?.totalTopups || 0} /></Col>
            <Col span={6}><Statistic title="Total Amount" value={accountData.gasUsage?.totalAmount || 0} suffix="RWF" /></Col>
            <Col span={6}><Statistic title="Total Units" value={accountData.gasUsage?.totalUnits || 0} suffix="M3" /></Col>
            <Col span={6}><Statistic title="Total Rewards" value={accountData.gasUsage?.totalRewards || 0} suffix="M3" /></Col>
          </Row>
          <Divider>Gas Meters</Divider>
          <Table
            dataSource={accountData.gasMeters || []}
            rowKey="id"
            columns={[
              { title: 'Meter #', dataIndex: 'meterNumber', key: 'meter' },
              { title: 'Alias', dataIndex: 'aliasName', key: 'alias' },
              { title: 'Owner', dataIndex: 'ownerName', key: 'owner' },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
            ]}
            pagination={false}
          />
        </TabPane>
        <TabPane tab={<span><BankOutlined /> Loans</span>} key="loans">
          <Table
            dataSource={accountData.loans || []}
            rowKey="id"
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id' },
              { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => `${v?.toLocaleString()} RWF` },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Due Date', dataIndex: 'dueDate', key: 'due', render: (d: string) => dayjs(d).format('MMM DD, YYYY') },
              { title: 'Created', dataIndex: 'createdAt', key: 'created', render: (d: string) => dayjs(d).fromNow() },
            ]}
            pagination={false}
          />
        </TabPane>
        <TabPane tab={<span><LinkOutlined /> Supply Chain</span>} key="chain">
          <List
            dataSource={accountData.supplierChain || []}
            renderItem={(item: any) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<ShopOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                  title={`Retailer: ${item.retailerName}`}
                  description={item.wholesalerName ? `Wholesaler: ${item.wholesalerName}` : 'No wholesaler linked'}
                />
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </>
  );

  const renderRetailerAccount = () => (
    <>
      {/* Financial Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Wallet Balance"
              value={accountData.walletBalance || 0}
              prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
              suffix="RWF"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Credit Limit"
              value={accountData.creditSummary?.creditLimit || 0}
              prefix={<CreditCardOutlined style={{ color: '#722ed1' }} />}
              suffix="RWF"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Used Credit"
              value={accountData.creditSummary?.usedCredit || 0}
              prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
              suffix="RWF"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Available Credit"
              value={accountData.creditSummary?.availableCredit || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              suffix="RWF"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Linked Wholesaler */}
      {accountData.linkedWholesaler && (
        <Alert
          message="Linked Wholesaler"
          description={
            <Space>
              <BankOutlined />
              <Text strong>{accountData.linkedWholesaler.companyName}</Text>
              <Text type="secondary">Phone: {accountData.linkedWholesaler.phone}</Text>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Order & Sales Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Orders to Wholesaler">
            <Row gutter={[8, 8]}>
              <Col span={6}><Statistic title="Pending" value={accountData.orderStats?.pending || 0} /></Col>
              <Col span={6}><Statistic title="Active" value={accountData.orderStats?.active || 0} /></Col>
              <Col span={6}><Statistic title="Completed" value={accountData.orderStats?.completed || 0} /></Col>
              <Col span={6}><Statistic title="Total" value={accountData.orderStats?.total || 0} /></Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Sales to Customers">
            <Row gutter={[8, 8]}>
              <Col span={6}><Statistic title="Pending" value={accountData.salesStats?.pending || 0} /></Col>
              <Col span={6}><Statistic title="Completed" value={accountData.salesStats?.completed || 0} /></Col>
              <Col span={6}><Statistic title="Revenue" value={accountData.salesStats?.totalRevenue || 0} suffix="RWF" /></Col>
              <Col span={6}><Statistic title="Total" value={accountData.salesStats?.total || 0} /></Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="orders">
        <TabPane tab={<span><ShoppingCartOutlined /> Orders</span>} key="orders">
          <Table
            dataSource={accountData.orders || []}
            rowKey="id"
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id' },
              { title: 'Wholesaler', dataIndex: ['wholesalerProfile', 'companyName'], key: 'wholesaler' },
              { title: 'Amount', dataIndex: 'totalAmount', key: 'amount', render: (v: number) => `${v?.toLocaleString()} RWF` },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (d: string) => dayjs(d).format('MMM DD, YYYY') },
            ]}
            pagination={{ pageSize: 5 }}
          />
        </TabPane>
        <TabPane tab={<span><DollarOutlined /> Sales</span>} key="sales">
          <Table
            dataSource={accountData.sales || []}
            rowKey="id"
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id' },
              { title: 'Customer', dataIndex: ['consumerProfile', 'fullName'], key: 'customer' },
              { title: 'Amount', dataIndex: 'totalAmount', key: 'amount', render: (v: number) => `${v?.toLocaleString()} RWF` },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (d: string) => dayjs(d).format('MMM DD, YYYY') },
            ]}
            pagination={{ pageSize: 5 }}
          />
        </TabPane>
        <TabPane tab={<span><CreditCardOutlined /> NFC Cards</span>} key="nfc">
          <Table
            dataSource={accountData.nfcCards || []}
            rowKey="id"
            columns={[
              { title: 'UID', dataIndex: 'uid', key: 'uid' },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Balance', dataIndex: 'balance', key: 'balance', render: (v: number) => `${v?.toLocaleString()} RWF` },
            ]}
            pagination={false}
          />
        </TabPane>
        <TabPane tab={<span><BankOutlined /> Credit Requests</span>} key="credit">
          <Table
            dataSource={accountData.creditRequests || []}
            rowKey="id"
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id' },
              { title: 'Amount', dataIndex: 'requestedAmount', key: 'amount', render: (v: number) => `${v?.toLocaleString()} RWF` },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (d: string) => dayjs(d).fromNow() },
            ]}
            pagination={false}
          />
        </TabPane>
      </Tabs>
    </>
  );

  const renderWorkerAccount = () => (
    <>
      {/* Worker Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Salary"
              value={accountData.salary || 0}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="RWF"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Present Days (Month)"
              value={accountData.attendanceSummary?.presentDays || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tasks Completed"
              value={accountData.taskStats?.completed || 0}
              prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Work Hours"
              value={accountData.attendanceSummary?.totalWorkHours || 0}
              suffix="hrs"
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="attendance">
        <TabPane tab="Attendance" key="attendance">
          <Table
            dataSource={accountData.recentAttendance || []}
            rowKey="id"
            columns={[
              { title: 'Date', dataIndex: 'date', key: 'date', render: (d: string) => dayjs(d).format('MMM DD, YYYY') },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Check In', dataIndex: 'checkIn', key: 'in', render: (t: string) => t || '-' },
              { title: 'Check Out', dataIndex: 'checkOut', key: 'out', render: (t: string) => t || '-' },
              { title: 'Hours', dataIndex: 'workHours', key: 'hours' },
            ]}
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
        <TabPane tab="Tasks" key="tasks">
          <Table
            dataSource={accountData.tasks || []}
            rowKey="id"
            columns={[
              { title: 'Title', dataIndex: 'title', key: 'title' },
              { title: 'Project', dataIndex: ['project', 'name'], key: 'project' },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Priority', dataIndex: 'priority', key: 'priority' },
            ]}
            pagination={{ pageSize: 5 }}
          />
        </TabPane>
        <TabPane tab="Training" key="training">
          <List
            dataSource={accountData.trainingProgress || []}
            renderItem={(item: any) => (
              <List.Item>
                <List.Item.Meta
                  title={item.courseTitle}
                  description={<Progress percent={item.progress} size="small" />}
                />
                <Tag color={item.status === 'completed' ? 'green' : 'blue'}>{item.status}</Tag>
              </List.Item>
            )}
          />
        </TabPane>
      </Tabs>
    </>
  );

  const renderWholesalerAccount = () => (
    <>
      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Linked Retailers"
              value={accountData.linkedRetailers?.length || 0}
              prefix={<ShopOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={accountData.orderStats?.totalRevenue || 0}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="RWF"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Orders"
              value={accountData.orderStats?.pending || 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={accountData.inventory?.totalProducts || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="retailers">
        <TabPane tab={<span><ShopOutlined /> Linked Retailers</span>} key="retailers">
          <Table
            dataSource={accountData.linkedRetailers || []}
            rowKey="id"
            columns={[
              { title: 'Shop Name', dataIndex: 'shopName', key: 'name' },
              { title: 'Phone', dataIndex: 'phone', key: 'phone' },
              { title: 'Credit Limit', dataIndex: 'creditLimit', key: 'credit', render: (v: number) => `${v?.toLocaleString()} RWF` },
              { title: 'Used Credit', dataIndex: 'usedCredit', key: 'used', render: (v: number) => `${v?.toLocaleString()} RWF` },
              { title: 'Status', dataIndex: 'isActive', key: 'status', render: (v: boolean) => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag> },
            ]}
            pagination={false}
          />
        </TabPane>
        <TabPane tab={<span><ShoppingCartOutlined /> Orders</span>} key="orders">
          <Table
            dataSource={accountData.orders || []}
            rowKey="id"
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id' },
              { title: 'Retailer', dataIndex: ['retailerProfile', 'shopName'], key: 'retailer' },
              { title: 'Amount', dataIndex: 'totalAmount', key: 'amount', render: (v: number) => `${v?.toLocaleString()} RWF` },
              { title: 'Status', dataIndex: 'status', key: 'status', render: getStatusTag },
              { title: 'Date', dataIndex: 'createdAt', key: 'date', render: (d: string) => dayjs(d).format('MMM DD, YYYY') },
            ]}
            pagination={{ pageSize: 5 }}
          />
        </TabPane>
        <TabPane tab={<span><TeamOutlined /> Suppliers</span>} key="suppliers">
          <Table
            dataSource={accountData.suppliers || []}
            rowKey="id"
            columns={[
              { title: 'Name', dataIndex: 'name', key: 'name' },
              { title: 'Contact', dataIndex: 'contact', key: 'contact' },
              { title: 'Phone', dataIndex: 'phone', key: 'phone' },
            ]}
            pagination={false}
          />
        </TabPane>
      </Tabs>
    </>
  );

  const getAccountIcon = () => {
    switch (accountType) {
      case 'customer': return <UserOutlined />;
      case 'retailer': return <ShopOutlined />;
      case 'worker': return <IdcardOutlined />;
      case 'wholesaler': return <BankOutlined />;
      default: return <UserOutlined />;
    }
  };

  const getAccountTitle = () => {
    switch (accountType) {
      case 'customer': return accountData.profile?.fullName || 'Customer';
      case 'retailer': return accountData.profile?.shopName || 'Retailer';
      case 'worker': return accountData.profile?.name || 'Employee';
      case 'wholesaler': return accountData.profile?.companyName || 'Wholesaler';
      default: return 'Account';
    }
  };

  return (
    <div>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              Back
            </Button>
            <Avatar size={48} icon={getAccountIcon()} style={{ backgroundColor: '#1890ff' }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>{getAccountTitle()}</Title>
              <Space>
                <Tag color="blue">{accountType.toUpperCase()}</Tag>
                <Tag color={accountData.profile?.isActive ? 'green' : 'red'}>
                  {accountData.profile?.isActive ? 'Active' : 'Inactive'}
                </Tag>
                {accountData.profile?.isVerified && <Tag color="cyan">Verified</Tag>}
              </Space>
            </div>
          </Space>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined spin={refreshing} />} onClick={handleRefresh}>
            Refresh Data
          </Button>
        </Col>
      </Row>

      {/* READ-ONLY Alert */}
      <Alert
        message="Read-Only View"
        description="This is a real-time read-only view of the account. Admin CANNOT edit, recharge, place orders, request loans, or change balances."
        type="warning"
        showIcon
        icon={<SafetyCertificateOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* Profile Info */}
      <Card title="Profile Information" style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="ID">{accountData.profile?.id}</Descriptions.Item>
          <Descriptions.Item label="Phone">{accountData.profile?.phone}</Descriptions.Item>
          <Descriptions.Item label="Email">{accountData.profile?.email || 'N/A'}</Descriptions.Item>
          {accountData.profile?.address && (
            <Descriptions.Item label="Address">{accountData.profile.address}</Descriptions.Item>
          )}
          <Descriptions.Item label="Created">
            {dayjs(accountData.profile?.createdAt).format('MMM DD, YYYY')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Type-specific content */}
      {accountType === 'customer' && renderCustomerAccount()}
      {accountType === 'retailer' && renderRetailerAccount()}
      {accountType === 'worker' && renderWorkerAccount()}
      {accountType === 'wholesaler' && renderWholesalerAccount()}

      {/* Last Order */}
      {accountData.lastOrder && (
        <Card title="Last Order Details" style={{ marginTop: 24 }}>
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
            <Descriptions.Item label="Order ID">{accountData.lastOrder.id}</Descriptions.Item>
            <Descriptions.Item label="Amount">{accountData.lastOrder.totalAmount?.toLocaleString()} RWF</Descriptions.Item>
            <Descriptions.Item label="Status">{getStatusTag(accountData.lastOrder.status)}</Descriptions.Item>
            <Descriptions.Item label="Date">{dayjs(accountData.lastOrder.createdAt).format('MMM DD, YYYY HH:mm')}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default AccountDetailsPage;
