import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Statistic,
  Modal,
  Form,
  InputNumber,
  Input,
  message,
  Avatar,
  Descriptions,
  Progress,
  List,
  Divider,
  Tabs,
  Timeline,
  Alert,
} from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
  BankOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { wholesalerApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface WalletStats {
  // Inventory Value Wallet - stock value at supplier cost (like capital wallet)
  inventoryValueWallet: number;
  // Profit Wallet - potential profit based on wholesaler price
  profitWallet: number;
  // Credit given to retailers
  totalCreditExtended: number;
  creditUsed: number;
  creditAvailable: number;
  // Supplier orders
  totalSupplierOrders: number;
  pendingSupplierPayments: number;
}

interface SupplierOrder {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  itemsCount: number;
  createdAt: string;
  paidAt?: string;
}

interface CreditRequest {
  id: string;
  retailerId: string;
  retailerName: string;
  retailerShop: string;
  retailerPhone: string;
  currentCredit: number;
  creditLimit: number;
  requestedAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  rejectionReason?: string;
}

export const WalletCreditPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [supplierOrders, setSupplierOrders] = useState<SupplierOrder[]>([]);
  const [creditRequests, setCreditRequests] = useState<CreditRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CreditRequest | null>(null);
  const [detailsModal, setDetailsModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [statsResponse, ordersResponse, creditResponse] = await Promise.all([
        wholesalerApi.getInventoryStats(),
        wholesalerApi.getSupplierOrders ? wholesalerApi.getSupplierOrders() : Promise.resolve({ data: { orders: [] } }),
        wholesalerApi.getCreditRequests(),
      ]);

      // Calculate wallet values from inventory stats
      const stockValueSupplier = statsResponse.data?.stockValueSupplier || 0;
      const stockValueWholesaler = statsResponse.data?.stockValueWholesaler || 0;

      setWalletStats({
        inventoryValueWallet: stockValueSupplier,
        profitWallet: stockValueWholesaler - stockValueSupplier,
        totalCreditExtended: creditResponse.data?.stats?.totalCreditExtended || 0,
        creditUsed: creditResponse.data?.stats?.totalCreditUsed || 0,
        creditAvailable: creditResponse.data?.stats?.creditAvailable || 0,
        totalSupplierOrders: ordersResponse.data?.count || 0,
        pendingSupplierPayments: ordersResponse.data?.pendingAmount || 0,
      });

      setSupplierOrders(ordersResponse.data?.orders || []);
      setCreditRequests(creditResponse.data?.requests || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      // Set empty states if error
      setWalletStats(null);
      setSupplierOrders([]);
      setCreditRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `${(amount ?? 0).toLocaleString()} RWF`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-RW', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const handleApprove = async (request: CreditRequest) => {
    setProcessing(true);
    try {
      await wholesalerApi.approveCreditRequest(request.id);
      message.success(`Credit request approved!`);
      fetchWalletData();
      setDetailsModal(false);
    } catch (error) {
      console.error('Approve error:', error);
      message.error(`Failed to approve credit request`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      message.error('Please provide a rejection reason');
      return;
    }
    setProcessing(true);
    try {
      if (wholesalerApi.rejectCreditRequest) {
        await wholesalerApi.rejectCreditRequest(selectedRequest.id, rejectReason);
      }
      message.success(`Credit request rejected`);
      fetchWalletData();
    } catch (error) {
      console.error('Reject error:', error);
      message.error(`Failed to reject credit request`);
    } finally {
      setRejectModal(false);
      setDetailsModal(false);
      setRejectReason('');
      setProcessing(false);
    }
  };

  const supplierOrderColumns = [
    {
      title: 'Supplier',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Invoice #',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Items',
      dataIndex: 'items_count',
      key: 'items_count',
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (v: number) => <Text strong>{formatCurrency(v)}</Text>,
    },
    {
      title: 'Supplier',
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Items',
      dataIndex: 'itemsCount',
      key: 'itemsCount',
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => <Text strong>{formatCurrency(v)}</Text>,
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => {
        const colors: Record<string, string> = { completed: 'green', paid: 'green', pending: 'orange', partial: 'blue' };
        return <Tag color={colors[status]}>{(status || 'pending').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Order Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Paid Date',
      dataIndex: 'paidAt',
      key: 'paidAt',
      render: (v: string) => v ? formatDate(v) : <Text type="secondary">-</Text>,
    },
  ];

  const creditRequestColumns = [
    {
      title: 'Retailer',
      key: 'retailer',
      render: (_: any, record: CreditRequest) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#722ed1' }} />
          <div>
            <Text strong>{record.retailerName}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>{record.retailerShop}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Current Credit',
      key: 'current',
      render: (_: any, record: CreditRequest) => (
        <div>
          <Text>{formatCurrency(record.currentCredit)}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>/ {formatCurrency(record.creditLimit)} limit</Text>
        </div>
      ),
    },
    {
      title: 'Requested',
      dataIndex: 'requestedAmount',
      key: 'requested',
      render: (amount: number) => <Text strong style={{ color: '#1890ff' }}>{formatCurrency(amount)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { color: string; icon: React.ReactNode }> = {
          pending: { color: 'orange', icon: <ClockCircleOutlined /> },
          approved: { color: 'green', icon: <CheckCircleOutlined /> },
          rejected: { color: 'red', icon: <CloseCircleOutlined /> },
        };
        return <Tag color={config[status]?.color} icon={config[status]?.icon}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CreditRequest) => (
        <Space>
          <Button size="small" onClick={() => { setSelectedRequest(record); setDetailsModal(true); }}>
            View
          </Button>
          {record.status === 'pending' && (
            <>
              <Button size="small" type="primary" onClick={() => handleApprove(record)}>Approve</Button>
              <Button size="small" danger onClick={() => { setSelectedRequest(record); setRejectModal(true); }}>Reject</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const pendingRequests = creditRequests.filter(r => r.status === 'pending');

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
          padding: '24px',
          marginBottom: 24,
          borderRadius: 12,
          color: 'white',
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              <WalletOutlined /> Wallet & Credit
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              Manage your inventory value, profit margins, supplier payments, and retailer credit
            </Text>
          </Col>
          <Col>
            {pendingRequests.length > 0 && (
              <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>
                {pendingRequests.length} Pending Credit Requests
              </Tag>
            )}
          </Col>
        </Row>
      </div>

      {/* Wallet Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderTop: '4px solid #fa8c16' }}>
            <Statistic
              title={<Space><InboxOutlined /> Inventory Value Wallet</Space>}
              value={walletStats?.inventoryValueWallet || 0}
              prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
              formatter={(v) => formatCurrency(Number(v))}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Stock value at supplier/manufacturer cost
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderTop: '4px solid #52c41a' }}>
            <Statistic
              title={<Space><RiseOutlined /> Profit Wallet</Space>}
              value={walletStats?.profitWallet || 0}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(v) => formatCurrency(Number(v))}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Based on wholesaler price margin
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderTop: '4px solid #1890ff' }}>
            <Statistic
              title={<Space><BankOutlined /> Credit Extended</Space>}
              value={walletStats?.totalCreditExtended || 0}
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
              formatter={(v) => formatCurrency(Number(v))}
            />
            <Progress
              percent={walletStats ? Math.round((walletStats.creditUsed / walletStats.totalCreditExtended) * 100) : 0}
              size="small"
              status="active"
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatCurrency(walletStats?.creditUsed || 0)} used
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={{ borderTop: '4px solid #ff4d4f' }}>
            <Statistic
              title={<Space><ExclamationCircleOutlined /> Pending Supplier Payments</Space>}
              value={walletStats?.pendingSupplierPayments || 0}
              prefix={<DollarOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
              formatter={(v) => formatCurrency(Number(v))}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Outstanding to suppliers
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Tabs for different sections */}
      <Card>
        <Tabs defaultActiveKey="supplier-orders">
          <TabPane
            tab={<span><ShoppingCartOutlined /> Supplier Order History</span>}
            key="supplier-orders"
          >
            <Alert
              message="Order History from Suppliers"
              description="Track all orders paid from your inventory value wallet to suppliers/manufacturers"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={supplierOrderColumns}
              dataSource={supplierOrders}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane
            tab={<span><DollarOutlined /> Credit Approvals ({pendingRequests.length} pending)</span>}
            key="credit-approvals"
          >
            <Alert
              message="Retailer Credit Requests"
              description="Approve or reject credit requests from your assigned retailers"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={creditRequestColumns}
              dataSource={creditRequests}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Credit Request Details Modal */}
      <Modal
        title="Credit Request Details"
        open={detailsModal}
        onCancel={() => setDetailsModal(false)}
        width={600}
        footer={selectedRequest?.status === 'pending' ? [
          <Button key="reject" danger onClick={() => setRejectModal(true)}>Reject</Button>,
          <Button key="approve" type="primary" loading={processing} onClick={() => selectedRequest && handleApprove(selectedRequest)}>
            Approve Request
          </Button>,
        ] : [<Button key="close" onClick={() => setDetailsModal(false)}>Close</Button>]}
      >
        {selectedRequest && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Retailer">
              <Space>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#722ed1' }} />
                <div>
                  <Text strong>{selectedRequest.retailerName}</Text>
                  <br />
                  <Text type="secondary">{selectedRequest.retailerShop}</Text>
                </div>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Phone">{selectedRequest.retailerPhone}</Descriptions.Item>
            <Descriptions.Item label="Current Credit Used">{formatCurrency(selectedRequest.currentCredit)}</Descriptions.Item>
            <Descriptions.Item label="Credit Limit">{formatCurrency(selectedRequest.creditLimit)}</Descriptions.Item>
            <Descriptions.Item label="Requested Amount">
              <Text strong style={{ color: '#1890ff', fontSize: 16 }}>{formatCurrency(selectedRequest.requestedAmount)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Reason">{selectedRequest.reason}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedRequest.status === 'approved' ? 'green' : selectedRequest.status === 'rejected' ? 'red' : 'orange'}>
                {selectedRequest.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            {selectedRequest.rejectionReason && (
              <Descriptions.Item label="Rejection Reason">{selectedRequest.rejectionReason}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Credit Request"
        open={rejectModal}
        onCancel={() => { setRejectModal(false); setRejectReason(''); }}
        onOk={handleReject}
        okText="Reject"
        okButtonProps={{ danger: true, loading: processing }}
      >
        <Text>Please provide a reason for rejecting this credit request:</Text>
        <TextArea
          rows={4}
          placeholder="Enter rejection reason..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          style={{ marginTop: 16 }}
        />
      </Modal>
    </div>
  );
};

export default WalletCreditPage;
