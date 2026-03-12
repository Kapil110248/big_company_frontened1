import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Modal,
  Form,
  message,
  Tabs,
  Statistic,
  Divider,
  Alert,
  List,
  Avatar,
  Badge,
  Empty,
} from 'antd';
import {
  CreditCardOutlined,
  SearchOutlined,
  UserOutlined,
  WalletOutlined,
  FireOutlined,
  FileTextOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  LockOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface CardTransaction {
  id: string;
  card_id: string;
  card_last4: string;
  order_id: string;
  customer_name: string;
  amount: number;
  payment_type: 'dashboard' | 'credit';
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

interface GasReward {
  id: string;
  meter_id: string;
  customer_name: string;
  order_id: string;
  gas_amount_m3: number;
  order_amount: number;
  date: string;
}

interface ProfitInvoice {
  id: string;
  invoice_number: string;
  period: string;
  gross_profit: number;
  monthly_expenses: number;
  net_profit: number;
  status: 'paid' | 'pending';
  date: string;
}

const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('balance-check');
  const [balanceCheckModalVisible, setBalanceCheckModalVisible] = useState(false);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ProfitInvoice | null>(null);
  const [customerBalance, setCustomerBalance] = useState<any>(null);
  const [form] = Form.useForm();

  // Mock data
  const cardTransactions: CardTransaction[] = [
    { id: '1', card_id: 'NFC-001', card_last4: '4532', order_id: 'ORD-001', customer_name: 'John Doe', amount: 15000, payment_type: 'dashboard', date: '2024-12-08T14:30:00', status: 'completed' },
    { id: '2', card_id: 'NFC-002', card_last4: '8912', order_id: 'ORD-002', customer_name: 'Jane Smith', amount: 8500, payment_type: 'credit', date: '2024-12-08T13:15:00', status: 'completed' },
    { id: '3', card_id: 'NFC-003', card_last4: '2345', order_id: 'ORD-003', customer_name: 'Bob Wilson', amount: 22000, payment_type: 'dashboard', date: '2024-12-08T12:45:00', status: 'completed' },
    { id: '4', card_id: 'NFC-001', card_last4: '4532', order_id: 'ORD-004', customer_name: 'John Doe', amount: 5500, payment_type: 'credit', date: '2024-12-08T11:20:00', status: 'completed' },
    { id: '5', card_id: 'NFC-004', card_last4: '6789', order_id: 'ORD-005', customer_name: 'Alice Brown', amount: 12000, payment_type: 'dashboard', date: '2024-12-08T10:00:00', status: 'completed' },
  ];

  const gasRewards: GasReward[] = [
    { id: '1', meter_id: 'MTR-00123', customer_name: 'John Doe', order_id: 'ORD-001', gas_amount_m3: 0.15, order_amount: 15000, date: '2024-12-08T14:30:00' },
    { id: '2', meter_id: 'MTR-00456', customer_name: 'Bob Wilson', order_id: 'ORD-003', gas_amount_m3: 0.22, order_amount: 22000, date: '2024-12-08T12:45:00' },
    { id: '3', meter_id: 'MTR-00789', customer_name: 'Alice Brown', order_id: 'ORD-005', gas_amount_m3: 0.12, order_amount: 12000, date: '2024-12-08T10:00:00' },
    { id: '4', meter_id: 'MTR-00123', customer_name: 'John Doe', order_id: 'ORD-010', gas_amount_m3: 0.08, order_amount: 8000, date: '2024-12-07T16:20:00' },
    { id: '5', meter_id: 'MTR-00456', customer_name: 'Bob Wilson', order_id: 'ORD-012', gas_amount_m3: 0.18, order_amount: 18000, date: '2024-12-07T14:10:00' },
  ];

  const profitInvoices: ProfitInvoice[] = [
    { id: '1', invoice_number: 'INV-2024-11', period: 'November 2024', gross_profit: 850000, monthly_expenses: 250000, net_profit: 600000, status: 'paid', date: '2024-12-01' },
    { id: '2', invoice_number: 'INV-2024-10', period: 'October 2024', gross_profit: 780000, monthly_expenses: 230000, net_profit: 550000, status: 'paid', date: '2024-11-01' },
    { id: '3', invoice_number: 'INV-2024-09', period: 'September 2024', gross_profit: 920000, monthly_expenses: 280000, net_profit: 640000, status: 'paid', date: '2024-10-01' },
  ];

  const totalGasRewards = gasRewards.reduce((sum, r) => sum + r.gas_amount_m3, 0);
  const totalGasValue = gasRewards.reduce((sum, r) => sum + (r.gas_amount_m3 * 50000), 0); // Assume 50000 RWF per M³

  const handleBalanceCheck = async (values: any) => {
    // Simulate balance check
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCustomerBalance({
      card_number: values.card_pin.slice(-4),
      dashboard_balance: 25000,
      credit_balance: 15000,
      available_balance: 40000,
    });
    message.success('Balance retrieved successfully');
  };

  const cardTransactionColumns: ColumnsType<CardTransaction> = [
    {
      title: 'Card ID',
      key: 'card',
      render: (_, record) => (
        <Space>
          <CreditCardOutlined style={{ color: '#1890ff' }} />
          <Text>****{record.card_last4}</Text>
        </Space>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (name) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (id) => <Text code>{id}</Text>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => <Text strong>{amount.toLocaleString()} RWF</Text>,
    },
    {
      title: 'Payment Type',
      dataIndex: 'payment_type',
      key: 'payment_type',
      render: (type) => (
        <Tag color={type === 'dashboard' ? 'blue' : 'purple'}>
          {type === 'dashboard' ? 'Dashboard Wallet' : 'Credit Wallet'}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, HH:mm'),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />}>View Invoice</Button>
      ),
    },
  ];

  const gasRewardColumns: ColumnsType<GasReward> = [
    {
      title: 'Meter ID',
      dataIndex: 'meter_id',
      key: 'meter_id',
      render: (id) => (
        <Space>
          <FireOutlined style={{ color: '#fa541c' }} />
          <Text code>{id}</Text>
        </Space>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (id) => <Text code>{id}</Text>,
    },
    {
      title: 'Order Amount',
      dataIndex: 'order_amount',
      key: 'order_amount',
      render: (amount) => `${amount.toLocaleString()} RWF`,
    },
    {
      title: 'Gas Reward',
      dataIndex: 'gas_amount_m3',
      key: 'gas_amount_m3',
      render: (amount) => (
        <Tag color="orange">{amount.toFixed(2)} M³</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, HH:mm'),
    },
  ];

  const profitInvoiceColumns: ColumnsType<ProfitInvoice> = [
    {
      title: 'Invoice #',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (num) => <Text strong>{num}</Text>,
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: 'Gross Profit',
      dataIndex: 'gross_profit',
      key: 'gross_profit',
      render: (amount) => <Text>{amount.toLocaleString()} RWF</Text>,
    },
    {
      title: 'Expenses',
      dataIndex: 'monthly_expenses',
      key: 'monthly_expenses',
      render: (amount) => <Text type="danger">-{amount.toLocaleString()} RWF</Text>,
    },
    {
      title: 'Net Profit',
      dataIndex: 'net_profit',
      key: 'net_profit',
      render: (amount) => <Text strong style={{ color: '#52c41a' }}>{amount.toLocaleString()} RWF</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'paid' ? 'success' : 'warning'} icon={status === 'paid' ? <CheckCircleOutlined /> : null}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => {
          setSelectedInvoice(record);
          setInvoiceModalVisible(true);
        }}>
          View Details
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'balance-check',
      label: (
        <span>
          <WalletOutlined /> Customer Balance Check
        </span>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Check Customer Wallet Balance">
              <Alert
                message="Customer Balance Verification"
                description="Help customers check their wallet balance by entering their card PIN and wallet PIN."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />
              <Form form={form} layout="vertical" onFinish={handleBalanceCheck}>
                <Form.Item
                  name="card_pin"
                  label="Customer Card PIN"
                  rules={[{ required: true, message: 'Enter customer card PIN' }]}
                >
                  <Input.Password
                    prefix={<CreditCardOutlined />}
                    placeholder="Enter card PIN"
                    maxLength={4}
                  />
                </Form.Item>
                <Form.Item
                  name="wallet_pin"
                  label="Customer Wallet PIN"
                  rules={[{ required: true, message: 'Enter customer wallet PIN' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Enter wallet PIN"
                    maxLength={4}
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block icon={<SearchOutlined />}>
                    Check Balance
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Balance Result">
              {customerBalance ? (
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <Alert message={`Card ending in ****${customerBalance.card_number}`} type="success" showIcon />
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Dashboard Balance"
                        value={customerBalance.dashboard_balance}
                        suffix="RWF"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Credit Balance"
                        value={customerBalance.credit_balance}
                        suffix="RWF"
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Col>
                  </Row>
                  <Divider />
                  <Statistic
                    title="Available Balance"
                    value={customerBalance.available_balance}
                    suffix="RWF"
                    valueStyle={{ color: '#52c41a', fontSize: 28 }}
                  />
                </Space>
              ) : (
                <Empty description="Enter customer credentials to check balance" />
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'card-transactions',
      label: (
        <span>
          <CreditCardOutlined /> Card Transactions
        </span>
      ),
      children: (
        <Card
          title="Store Card Transactions"
          extra={
            <Space>
              <Tag color="blue">Dashboard: {cardTransactions.filter(t => t.payment_type === 'dashboard').length}</Tag>
              <Tag color="purple">Credit: {cardTransactions.filter(t => t.payment_type === 'credit').length}</Tag>
            </Space>
          }
        >
          <Table
            columns={cardTransactionColumns}
            dataSource={cardTransactions}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
    {
      key: 'gas-rewards',
      label: (
        <span>
          <FireOutlined /> Gas Rewards Given
        </span>
      ),
      children: (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="Total Gas Rewards Given"
                  value={totalGasRewards.toFixed(2)}
                  suffix="M³"
                  prefix={<FireOutlined style={{ color: '#fa541c' }} />}
                  valueStyle={{ color: '#fa541c' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="Estimated Value"
                  value={totalGasValue}
                  suffix="RWF"
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>
          <Card title="Gas Rewards History">
            <Table
              columns={gasRewardColumns}
              dataSource={gasRewards}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </>
      ),
    },
    {
      key: 'profit-invoices',
      label: (
        <span>
          <FileTextOutlined /> Profit Invoices
        </span>
      ),
      children: (
        <Card
          title="Monthly Profit Invoices from Admin"
          extra={<Text type="secondary">Net profit transferred to your bank account after expenses</Text>}
        >
          <Alert
            message="Profit Distribution"
            description="Each month, admin calculates your net profit after deducting monthly expenses and transfers it to your registered bank account."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <Table
            columns={profitInvoiceColumns}
            dataSource={profitInvoices}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        <CreditCardOutlined style={{ marginRight: 12 }} />
        My Management
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />

      {/* Invoice Detail Modal */}
      <Modal
        title={`Invoice Details - ${selectedInvoice?.invoice_number}`}
        open={invoiceModalVisible}
        onCancel={() => setInvoiceModalVisible(false)}
        footer={<Button onClick={() => setInvoiceModalVisible(false)}>Close</Button>}
        width={500}
      >
        {selectedInvoice && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Row justify="space-between">
              <Text type="secondary">Period:</Text>
              <Text strong>{selectedInvoice.period}</Text>
            </Row>
            <Row justify="space-between">
              <Text type="secondary">Gross Profit:</Text>
              <Text strong>{selectedInvoice.gross_profit.toLocaleString()} RWF</Text>
            </Row>
            <Divider style={{ margin: '8px 0' }} />
            <Title level={5}>Monthly Expenses Breakdown</Title>
            <Row justify="space-between">
              <Text>Rent & Utilities:</Text>
              <Text>100,000 RWF</Text>
            </Row>
            <Row justify="space-between">
              <Text>Staff Salaries:</Text>
              <Text>80,000 RWF</Text>
            </Row>
            <Row justify="space-between">
              <Text>System Fee:</Text>
              <Text>50,000 RWF</Text>
            </Row>
            <Row justify="space-between">
              <Text type="secondary">Total Expenses:</Text>
              <Text type="danger">-{selectedInvoice.monthly_expenses.toLocaleString()} RWF</Text>
            </Row>
            <Divider style={{ margin: '8px 0' }} />
            <Row justify="space-between">
              <Text strong>Net Profit Transferred:</Text>
              <Text strong style={{ color: '#52c41a', fontSize: 18 }}>
                {selectedInvoice.net_profit.toLocaleString()} RWF
              </Text>
            </Row>
            <Alert
              message={selectedInvoice.status === 'paid' ? 'Transferred to Bank' : 'Pending Transfer'}
              type={selectedInvoice.status === 'paid' ? 'success' : 'warning'}
              showIcon
            />
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default ManagementPage;
