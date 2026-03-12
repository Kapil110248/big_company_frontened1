import { useEffect, useState } from 'react';
import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
  Spin,
  Alert,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Descriptions,
  Timeline,
  Divider,
  Progress,
  Tabs,
  message,
  Tooltip,
  Empty,
} from 'antd';
import {
  WalletOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  UserOutlined,
  PhoneOutlined,
  BankOutlined,
  WarningOutlined,
  HistoryOutlined,
  CreditCardOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SendOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { retailerApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface WalletInfo {
  balance: number;
  currency: string;
  wallet_id: string;
  status: 'active' | 'suspended' | 'closed';
  created_at: string;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  description: string;
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
}

interface CreditInfo {
  credit_limit: number;
  credit_used: number;
  credit_available: number;
  credit_score: number;
  next_payment_date?: string;
  next_payment_amount?: number;
}

interface CreditOrder {
  id: string;
  display_id: string;
  wholesaler_name: string;
  total_amount: number;
  amount_paid: number;
  amount_pending: number;
  status: 'pending' | 'approved' | 'rejected' | 'repaid' | 'overdue';
  due_date: string;
  created_at: string;
  items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  repayments?: Array<{
    id: string;
    amount: number;
    payment_method: string;
    date: string;
  }>;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: 'orange', icon: <ClockCircleOutlined />, label: 'Pending' },
  approved: { color: 'blue', icon: <CheckCircleOutlined />, label: 'Active' },
  rejected: { color: 'red', icon: <CloseCircleOutlined />, label: 'Rejected' },
  repaid: { color: 'green', icon: <CheckCircleOutlined />, label: 'Repaid' },
  overdue: { color: 'volcano', icon: <WarningOutlined />, label: 'Overdue' },
};

const getCreditScoreColor = (score: number) => {
  if (score >= 80) return '#52c41a';
  if (score >= 60) return '#1890ff';
  if (score >= 40) return '#faad14';
  return '#ff4d4f';
};

const getCreditScoreLabel = (score: number) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
};

export const WalletPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('wallet');

  // Wallet states
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionPagination, setTransactionPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Credit states
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [creditOrders, setCreditOrders] = useState<CreditOrder[]>([]);
  const [creditPagination, setCreditPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [orderDetailsModal, setOrderDetailsModal] = useState<{ visible: boolean; order: CreditOrder | null }>({
    visible: false,
    order: null,
  });
  const [repaymentModal, setRepaymentModal] = useState<{ visible: boolean; order: CreditOrder | null }>({
    visible: false,
    order: null,
  });
  const [requestCreditModal, setRequestCreditModal] = useState(false);

  // Form states
  const [repaymentAmount, setRepaymentAmount] = useState<number>(0);
  const [repaymentMethod, setRepaymentMethod] = useState<string>('wallet');
  const [requestAmount, setRequestAmount] = useState<number>(0);
  const [requestReason, setRequestReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchWalletData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [walletRes, transactionsRes] = await Promise.all([
        retailerApi.getWallet(),
        retailerApi.getWalletTransactions({
          limit: transactionPagination.pageSize,
          offset: (transactionPagination.current - 1) * transactionPagination.pageSize,
        }),
      ]);

      setWallet(walletRes.data?.wallet || walletRes.data);
      setTransactions(transactionsRes.data?.transactions || []);
      setTransactionPagination(prev => ({ ...prev, total: transactionsRes.data?.total || 0 }));
    } catch (err: any) {
      console.error('Wallet data error:', err);
      // Create mock data if API fails
      setWallet({
        balance: 0,
        currency: 'RWF',
        wallet_id: 'N/A',
        status: 'active',
        created_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCreditData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [creditRes, ordersRes] = await Promise.all([
        retailerApi.getCreditInfo(),
        retailerApi.getCreditOrders({
          status: statusFilter || undefined,
          limit: creditPagination.pageSize,
          offset: (creditPagination.current - 1) * creditPagination.pageSize,
        }),
      ]);

      setCreditInfo(creditRes.data?.credit || creditRes.data);
      setCreditOrders(ordersRes.data?.orders || []);
      setCreditPagination(prev => ({ ...prev, total: ordersRes.data?.total || 0 }));
    } catch (err: any) {
      console.error('Credit data error:', err);
      // Create mock data if API fails
      setCreditInfo({
        credit_limit: 500000,
        credit_used: 0,
        credit_available: 500000,
        credit_score: 75,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'wallet') {
      fetchWalletData();
    } else {
      fetchCreditData();
    }
  }, [activeTab, transactionPagination.current, creditPagination.current, statusFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTab === 'wallet') {
        fetchWalletData(true);
      } else {
        fetchCreditData(true);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const [invoiceModal, setInvoiceModal] = useState<{ visible: boolean; transaction: Transaction | null }>({
    visible: false,
    transaction: null
  });

  const handleViewInvoice = (transaction: Transaction) => {
    setInvoiceModal({ visible: true, transaction });
  };

  const [isAddCapitalModalVisible, setIsAddCapitalModalVisible] = useState(false);

  const handleAddCapital = async (values: any) => {
    setProcessing(true);
    try {
      await retailerApi.topUpWallet(values.amount, values.source);
      message.success('Capital added successfully');
      setIsAddCapitalModalVisible(false);
      fetchWalletData(true);
    } catch (error: any) {
      console.error(error);
      message.error(error.response?.data?.error || 'Failed to add capital');
    } finally {
      setProcessing(false);
    }
  };

  const handleMakeRepayment = async () => {
    if (!repaymentModal.order || repaymentAmount <= 0) {
      message.warning('Please enter a valid repayment amount');
      return;
    }
    setProcessing(true);

    try {
      await retailerApi.makeRepayment(repaymentModal.order.id, repaymentAmount);
      message.success(`Payment of ${(repaymentAmount ?? 0).toLocaleString()} RWF recorded successfully`);
      setRepaymentModal({ visible: false, order: null });
      setRepaymentAmount(0);
      setRepaymentMethod('wallet');
      fetchCreditData(true);
      fetchWalletData(true);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestCredit = async () => {
    if (requestAmount <= 0) {
      message.warning('Please enter a valid credit amount');
      return;
    }
    setProcessing(true);

    try {
      await retailerApi.requestCredit({
        amount: requestAmount,
        reason: requestReason,
      });
      message.success('Credit request submitted successfully');
      setRequestCreditModal(false);
      setRequestAmount(0);
      setRequestReason('');
      fetchCreditData(true);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to submit credit request');
    } finally {
      setProcessing(false);
    }
  };

  const filteredOrders = creditOrders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.display_id?.toLowerCase().includes(query) ||
      order.wholesaler_name?.toLowerCase().includes(query)
    );
  });

  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'credit' ? 'green' : 'red'} icon={type === 'credit' ? <ArrowDownOutlined /> : <ArrowUpOutlined />}>
          {type === 'credit' ? 'Credit' : 'Debit'}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: Transaction) => (
        <Text strong style={{ color: record.type === 'credit' ? '#52c41a' : '#ff4d4f' }}>
          {record.type === 'credit' ? '+' : '-'}{amount?.toLocaleString()} RWF
        </Text>
      ),
    },
    {
      title: 'Balance After',
      dataIndex: 'balance_after',
      key: 'balance_after',
      render: (balance: number) => <Text>{balance?.toLocaleString()} RWF</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
  ];

  const creditOrderColumns = [
    {
      title: 'Order ID',
      dataIndex: 'display_id',
      key: 'display_id',
      render: (id: string) => <Text code>#{id}</Text>,
    },
    {
      title: 'Wholesaler',
      dataIndex: 'wholesaler_name',
      key: 'wholesaler_name',
      render: (name: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BankOutlined />
          <Text strong>{name}</Text>
        </div>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: any, record: CreditOrder) => (
        <div>
          <div><Text strong>{record.total_amount?.toLocaleString()} RWF</Text></div>
          {record.status === 'approved' && (
            <div>
              <Text type="success" style={{ fontSize: '12px' }}>
                {record.amount_paid?.toLocaleString()} paid
              </Text>
              {record.amount_pending > 0 && (
                <Text type="warning" style={{ marginLeft: '8px', fontSize: '12px' }}>
                  {record.amount_pending?.toLocaleString()} due
                </Text>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date: string, record: CreditOrder) => {
        if (!date) return '-';
        const dueDate = new Date(date);
        const now = new Date();
        const isOverdue = record.status === 'approved' && dueDate < now && record.amount_pending > 0;
        const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return (
          <div>
            <div style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
              {dueDate.toLocaleDateString()}
            </div>
            {record.status === 'approved' && record.amount_pending > 0 && (
              <Text type={isOverdue ? 'danger' : daysLeft <= 3 ? 'warning' : 'secondary'} style={{ fontSize: '12px' }}>
                {isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status] || { color: 'default', icon: null, label: status };
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CreditOrder) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => setOrderDetailsModal({ visible: true, order: record })}
          >
            View
          </Button>
          {record.status === 'approved' && record.amount_pending > 0 && (
            <Button
              type="primary"
              ghost
              size="small"
              icon={<DollarOutlined />}
              onClick={() => {
                setRepaymentAmount(record.amount_pending);
                setRepaymentModal({ visible: true, order: record });
              }}
            >
              Pay
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          <WalletOutlined style={{ marginRight: '8px' }} />
          Wallet & Credit
        </Title>
        <Button
          icon={<ReloadOutlined spin={refreshing} />}
          onClick={() => activeTab === 'wallet' ? fetchWalletData(true) : fetchCreditData(true)}
          loading={refreshing}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Capital Wallet Tab */}
        <TabPane
          tab={
            <span>
              <DollarOutlined />
              Capital Wallet
            </span>
          }
          key="wallet"
        >
          {/* Capital Wallet Balance Card */}
          <Card
            style={{
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
              color: 'white',
            }}
          >
            <Row gutter={24} align="middle">
              <Col xs={24} md={12}>
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>CAPITAL WALLET</Text>
                  <Title level={2} style={{ color: 'white', margin: '8px 0' }}>
                    {wallet?.balance?.toLocaleString() || 0} {wallet?.currency || 'RWF'}
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                    Inventory value at wholesaler prices
                  </Text>
                </div>
              </Col>
              <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                  <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  size="large"
                  style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'white' }}
                  onClick={() => setIsAddCapitalModalVisible(true)}
                >
                  Add Capital
                </Button>
              </Col>
            </Row>
          </Card>

          <Modal
            title="Add Capital to Wallet"
            open={isAddCapitalModalVisible}
            onCancel={() => setIsAddCapitalModalVisible(false)}
            footer={null}
          >
            <Form layout="vertical" onFinish={handleAddCapital}>
              <Form.Item
                name="amount"
                label="Amount (RWF)"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber<number>
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, '') || 0)}
                  min={100}
                />
              </Form.Item>
              <Form.Item
                name="source"
                label="Source"
                initialValue="mobile_money"
              >
                <Select>
                  <Option value="mobile_money">Mobile Money</Option>
                  <Option value="bank_transfer">Bank Transfer</Option>
                  <Option value="cash">Cash Agent</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={processing} block>
                  Add Capital
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          <Alert
            message="Capital Wallet Usage"
            description="Capital Wallet is used exclusively for purchasing inventory from your assigned wholesaler. Add capital to increase your purchasing power."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          {/* Transaction History */}
          <Card
            title={<><HistoryOutlined /> Wholesaler Orders History</>}
            extra={
              <Button 
                size="small" 
                icon={<EyeOutlined />}
                disabled={transactions.length === 0}
                onClick={() => handleViewInvoice(transactions[0])}
              >
                View Latest Invoice
              </Button>
            }
          >
            {transactions.length > 0 ? (
              <Table
                dataSource={transactions}
                columns={[
                  ...transactionColumns,
                  {
                    title: 'Invoice',
                    key: 'invoice',
                    render: (_: any, record: Transaction) => (
                      <Button 
                        type="link" 
                        size="small" 
                        icon={<EyeOutlined />}
                        onClick={() => handleViewInvoice(record)}
                      >
                        View
                      </Button>
                    ),
                  },
                ]}
                rowKey="id"
                scroll={{ x: 800 }}
                size="small"
                pagination={{
                  current: transactionPagination.current,
                  pageSize: transactionPagination.pageSize,
                  total: transactionPagination.total,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} transactions`,
                  size: 'small',
                  onChange: (page, pageSize) => setTransactionPagination({ ...transactionPagination, current: page, pageSize }),
                }}
              />
            ) : (
              <Empty description="No transactions yet" />
            )}
          </Card>

          <Modal
            title="Invoice Details"
            open={invoiceModal.visible}
            onCancel={() => setInvoiceModal({ visible: false, transaction: null })}
            footer={[
              <Button key="close" onClick={() => setInvoiceModal({ visible: false, transaction: null })}>
                Close
              </Button>,
              <Button key="print" type="primary" icon={<SendOutlined />} onClick={() => window.print()}>
                Print
              </Button>
            ]}
            width={700}
          >
            {invoiceModal.transaction && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div>
                    <Title level={4}>INVOICE</Title>
                    <Text type="secondary">#{invoiceModal.transaction.reference?.toUpperCase() || invoiceModal.transaction.id.substring(0,8).toUpperCase()}</Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Title level={5}>BIG Company</Title>
                    <Text>Kigali, Rwanda</Text>
                  </div>
                </div>

                <Descriptions bordered column={1} size="small">
                  <Descriptions.Item label="Date">{new Date(invoiceModal.transaction.created_at).toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="Transaction Type">{invoiceModal.transaction.type.toUpperCase()}</Descriptions.Item>
                  <Descriptions.Item label="Description">{invoiceModal.transaction.description}</Descriptions.Item>
                  <Descriptions.Item label="Amount">
                    <Text strong>{invoiceModal.transaction.amount?.toLocaleString()} RWF</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color="green">{invoiceModal.transaction.status.toUpperCase()}</Tag>
                  </Descriptions.Item>
                </Descriptions>

                <Divider />
                
                <div style={{ textAlign: 'center', color: '#999', marginTop: 24 }}>
                  <Text type="secondary">Thank you for your business!</Text>
                </div>
              </div>
            )}
          </Modal>
        </TabPane>

        {/* Profit Wallet Tab */}
        <TabPane
          tab={
            <span>
              <WalletOutlined />
              Profit Wallet
            </span>
          }
          key="profit"
        >
          {/* Profit Wallet Balance Card - Read Only */}
          <Card
            style={{
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              color: 'white',
            }}
          >
            <Row gutter={24} align="middle">
              <Col xs={24} md={12}>
                <div>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>PROFIT WALLET</Text>
                  <Title level={2} style={{ color: 'white', margin: '8px 0' }}>
                    {(wallet?.balance ? Math.round(wallet.balance * 0.15) : 0).toLocaleString()} RWF
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                    Profit margin from sales
                  </Text>
                </div>
              </Col>
              <Col xs={24} md={12} style={{ textAlign: 'right' }}>
                <Tag color="blue" style={{ padding: '8px 16px', fontSize: '14px' }}>
                  <ClockCircleOutlined /> Admin Managed
                </Tag>
              </Col>
            </Row>
          </Card>

          <Alert
            message="Net Profit Transferred Monthly by Admin"
            description={
              <div>
                <p style={{ marginBottom: 8 }}>Your profit wallet is managed by the admin. At the end of each month:</p>
                <ul style={{ marginBottom: 0 }}>
                  <li>Admin calculates net profit after deducting monthly expenses</li>
                  <li>Net profit is transferred to your bank account</li>
                  <li>Profit wallet balance resets to 0 RWF</li>
                </ul>
              </div>
            }
            type="warning"
            showIcon
            icon={<BankOutlined />}
            style={{ marginBottom: 24 }}
          />

          {/* Last Transfer Info */}
          <Card title="Profit Transfer History" style={{ marginBottom: 24 }}>
            <Empty description="No profit transfers yet" />
          </Card>

          {/* Monthly Summary */}
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Card size="small">
                <Statistic
                  title="Total Sales This Month"
                  value={Math.round((wallet?.balance || 0) * 1.25)}
                  suffix="RWF"
                  valueStyle={{ color: '#1890ff' }}
                  formatter={(value) => value?.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card size="small">
                <Statistic
                  title="Estimated Profit"
                  value={Math.round((wallet?.balance || 0) * 0.15)}
                  suffix="RWF"
                  valueStyle={{ color: '#52c41a' }}
                  formatter={(value) => value?.toLocaleString()}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Credit Tab */}
        <TabPane
          tab={
            <span>
              <CreditCardOutlined />
              Credit
            </span>
          }
          key="credit"
        >
          {/* Credit Overview Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Credit Limit"
                  value={creditInfo?.credit_limit || 0}
                  suffix="RWF"
                  prefix={<BankOutlined />}
                  formatter={(value) => value?.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Available Credit"
                  value={creditInfo?.credit_available || 0}
                  suffix="RWF"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  formatter={(value) => value?.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Credit Used"
                  value={creditInfo?.credit_used || 0}
                  suffix="RWF"
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#faad14' }}
                  formatter={(value) => value?.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary">Credit Score</Text>
                </div>
                <Tooltip title={getCreditScoreLabel(creditInfo?.credit_score || 0)}>
                  <Progress
                    type="circle"
                    percent={creditInfo?.credit_score || 0}
                    width={80}
                    strokeColor={getCreditScoreColor(creditInfo?.credit_score || 0)}
                    format={(p) => (
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{p}</div>
                        <div style={{ fontSize: '10px' }}>{getCreditScoreLabel(p || 0)}</div>
                      </div>
                    )}
                  />
                </Tooltip>
              </Card>
            </Col>
          </Row>

          {/* Credit Utilization */}
          <Card title="Credit Utilization" style={{ marginBottom: '24px' }}>
            <Progress
              percent={Math.round(((creditInfo?.credit_used || 0) / (creditInfo?.credit_limit || 1)) * 100)}
              strokeColor={{
                '0%': '#52c41a',
                '50%': '#faad14',
                '100%': '#ff4d4f',
              }}
              format={(percent) => (
                <span>
                  {percent}% used
                </span>
              )}
            />
            <Row justify="space-between" style={{ marginTop: '16px' }}>
              <Col>
                <Text type="secondary">Used: </Text>
                <Text strong>{creditInfo?.credit_used?.toLocaleString() || 0} RWF</Text>
              </Col>
              <Col>
                <Text type="secondary">Available: </Text>
                <Text strong type="success">{creditInfo?.credit_available?.toLocaleString() || 0} RWF</Text>
              </Col>
            </Row>
            {creditInfo?.next_payment_date && (
              <Alert
                message="Upcoming Payment"
                description={
                  <span>
                    Next payment of <strong>{creditInfo.next_payment_amount?.toLocaleString()} RWF</strong> is due on{' '}
                    <strong>{new Date(creditInfo.next_payment_date).toLocaleDateString()}</strong>
                  </span>
                }
                type="info"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
          </Card>

          {/* Credit Orders Filters */}
          <Card style={{ marginBottom: '16px' }}>
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Input
                  placeholder="Search by order ID or wholesaler"
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Filter by status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="">All Statuses</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="approved">Active</Option>
                  <Option value="repaid">Repaid</Option>
                  <Option value="overdue">Overdue</Option>
                </Select>
              </Col>
              <Col xs={24} sm={24} md={10} style={{ textAlign: 'right' }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setRequestCreditModal(true)}
                  disabled={(creditInfo?.credit_available || 0) <= 0}
                >
                  Request Credit
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Credit Orders Table */}
          <Card title={<><CreditCardOutlined /> Credit Orders</>}>
            {filteredOrders.length > 0 ? (
              <Table
                dataSource={filteredOrders}
                columns={creditOrderColumns}
                rowKey="id"
                scroll={{ x: 900 }}
                size="small"
                pagination={{
                  current: creditPagination.current,
                  pageSize: creditPagination.pageSize,
                  total: creditPagination.total,
                  showSizeChanger: true,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} orders`,
                  size: 'small',
                  onChange: (page, pageSize) => setCreditPagination({ ...creditPagination, current: page, pageSize }),
                }}
                rowClassName={(record) => {
                  if (record.status === 'overdue') return 'row-overdue';
                  if (record.status === 'pending') return 'row-pending';
                  return '';
                }}
              />
            ) : (
              <Empty description="No credit orders yet" />
            )}
          </Card>
        </TabPane>
      </Tabs>

      {/* Order Details Modal */}
      <Modal
        title={
          <span>
            <CreditCardOutlined style={{ marginRight: '8px' }} />
            Credit Order #{orderDetailsModal.order?.display_id}
          </span>
        }
        open={orderDetailsModal.visible}
        onCancel={() => setOrderDetailsModal({ visible: false, order: null })}
        footer={
          orderDetailsModal.order?.status === 'approved' && (orderDetailsModal.order?.amount_pending || 0) > 0 ? (
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => {
                setRepaymentAmount(orderDetailsModal.order!.amount_pending);
                setOrderDetailsModal({ visible: false, order: null });
                setRepaymentModal({ visible: true, order: orderDetailsModal.order });
              }}
            >
              Make Payment
            </Button>
          ) : null
        }
        width={700}
      >
        {orderDetailsModal.order && (
          <div>
            <Row gutter={24}>
              <Col span={12}>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Wholesaler">
                    <BankOutlined /> {orderDetailsModal.order.wholesaler_name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={statusConfig[orderDetailsModal.order.status]?.color}>
                      {statusConfig[orderDetailsModal.order.status]?.label}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Order Date">
                    {new Date(orderDetailsModal.order.created_at).toLocaleDateString()}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Total Amount">
                    <Text strong>{orderDetailsModal.order.total_amount?.toLocaleString()} RWF</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Amount Paid">
                    <Text type="success">{orderDetailsModal.order.amount_paid?.toLocaleString()} RWF</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Amount Due">
                    <Text type="warning">{orderDetailsModal.order.amount_pending?.toLocaleString()} RWF</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            {(orderDetailsModal.order.status === 'approved' || orderDetailsModal.order.status === 'repaid') && (
              <>
                <Divider>Payment Progress</Divider>
                <Progress
                  percent={Math.round((orderDetailsModal.order.amount_paid / orderDetailsModal.order.total_amount) * 100)}
                  strokeColor={orderDetailsModal.order.amount_pending === 0 ? '#52c41a' : '#1890ff'}
                  status={orderDetailsModal.order.amount_pending === 0 ? 'success' : 'active'}
                />
              </>
            )}

            {orderDetailsModal.order.items && orderDetailsModal.order.items.length > 0 && (
              <>
                <Divider>Order Items</Divider>
                <Table
                  dataSource={orderDetailsModal.order.items}
                  columns={[
                    { title: 'Product', dataIndex: 'product_name', key: 'product_name' },
                    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                    {
                      title: 'Price',
                      dataIndex: 'price',
                      key: 'price',
                      render: (v: number) => `${v?.toLocaleString()} RWF`,
                    },
                  ]}
                  pagination={false}
                  size="small"
                  rowKey="id"
                />
              </>
            )}

            {orderDetailsModal.order.repayments && orderDetailsModal.order.repayments.length > 0 && (
              <>
                <Divider><HistoryOutlined /> Payment History</Divider>
                <Timeline>
                  {orderDetailsModal.order.repayments.map((repayment) => (
                    <Timeline.Item key={repayment.id} color="green">
                      <div>
                        <Text strong>{repayment.amount?.toLocaleString()} RWF</Text>
                        <Tag style={{ marginLeft: '8px' }}>{repayment.payment_method?.toUpperCase()}</Tag>
                      </div>
                      <Text type="secondary">{new Date(repayment.date).toLocaleString()}</Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Repayment Modal */}
      <Modal
        title="Make Payment"
        open={repaymentModal.visible}
        onCancel={() => {
          setRepaymentModal({ visible: false, order: null });
          setRepaymentAmount(0);
          setRepaymentMethod('wallet');
        }}
        onOk={handleMakeRepayment}
        confirmLoading={processing}
        okText="Pay Now"
      >
        {repaymentModal.order && (
          <div>
            <Descriptions column={1} size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="Order">
                #{repaymentModal.order.display_id}
              </Descriptions.Item>
              <Descriptions.Item label="Wholesaler">
                {repaymentModal.order.wholesaler_name}
              </Descriptions.Item>
              <Descriptions.Item label="Outstanding Amount">
                <Text type="warning" strong>
                  {repaymentModal.order.amount_pending?.toLocaleString()} RWF
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Wallet Balance">
                <Text type="success" strong>
                  {wallet?.balance?.toLocaleString() || 0} RWF
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Form layout="vertical">
              <Form.Item label="Payment Amount (RWF)" required>
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={Math.min(repaymentModal.order.amount_pending, wallet?.balance || 0)}
                  value={repaymentAmount}
                  onChange={(v) => setRepaymentAmount(v || 0)}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/,/g, '') || 0)}
                />
              </Form.Item>
              <Form.Item label="Payment Method" required>
                <Select
                  value={repaymentMethod}
                  onChange={setRepaymentMethod}
                  style={{ width: '100%' }}
                >
                  <Option value="wallet">Wallet Balance</Option>
                  <Option value="momo">MTN Mobile Money</Option>
                  <Option value="airtel">Airtel Money</Option>
                </Select>
              </Form.Item>
            </Form>

            {repaymentMethod === 'wallet' && repaymentAmount > (wallet?.balance || 0) && (
              <Alert
                message="Insufficient Balance"
                description="You don't have enough wallet balance for this payment."
                type="error"
                style={{ marginTop: '16px' }}
              />
            )}

            {repaymentAmount >= repaymentModal.order.amount_pending && (
              <Alert
                message="Full Payment"
                description="This payment will fully settle the credit order."
                type="success"
                style={{ marginTop: '16px' }}
              />
            )}
          </div>
        )}
      </Modal>

      {/* Request Credit Modal */}
      <Modal
        title="Request Credit"
        open={requestCreditModal}
        onCancel={() => {
          setRequestCreditModal(false);
          setRequestAmount(0);
          setRequestReason('');
        }}
        onOk={handleRequestCredit}
        confirmLoading={processing}
        okText="Submit Request"
      >
        <Alert
          message={`You have ${creditInfo?.credit_available?.toLocaleString()} RWF available credit`}
          type="info"
          style={{ marginBottom: '16px' }}
        />
        <Form layout="vertical">
          <Form.Item label="Credit Amount (RWF)" required>
            <InputNumber
              style={{ width: '100%' }}
              min={1000}
              max={creditInfo?.credit_available || 0}
              value={requestAmount}
              onChange={(v) => setRequestAmount(v || 0)}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/,/g, '') || 0)}
            />
          </Form.Item>
          <Form.Item label="Reason / Purpose">
            <TextArea
              rows={3}
              placeholder="Enter the purpose of this credit request..."
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .row-overdue {
          background-color: #fff2f0;
        }
        .row-pending {
          background-color: #fffbe6;
        }
      `}</style>
    </div>
  );
};

export default WalletPage;
