import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Table,
  Space,
  Card,
  Typography,
  Descriptions,
  Button,
  Tag,
  Steps,
  Row,
  Col,
  Input,
  Select,
  Modal,
  message,
  Spin,
  Statistic,
  Timeline,
  Empty,
  Form,
  Badge,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  PrinterOutlined,
  TruckOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { retailerApi } from '../../services/apiService';

const { Title, Text } = Typography;

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total: number;
  image?: string;
}

interface Order {
  id: string;
  display_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled';
  payment_method: 'dashboard_wallet' | 'credit_wallet' | 'mobile_money' | 'cash' | 'wallet' | 'nfc' | 'credit';
  payment_status: 'pending' | 'paid' | 'refunded';
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  cancelled_at?: string;
  cancel_reason?: string;
}

interface OrderStats {
  // Status counts
  pending: number;
  processing: number;
  ready: number;
  completed_today: number;
  cancelled_today: number;
  // Revenue by payment method
  total_online_revenue: number;
  dashboard_wallet_revenue: number;
  credit_wallet_revenue: number;
  mobile_money_revenue: number;
  gas_rewards_m3: number;
  gas_rewards_rwf: number;
}

const statusColors: Record<string, string> = {
  pending: 'orange',
  processing: 'blue',
  ready: 'cyan',
  completed: 'green',
  cancelled: 'red',
};

const paymentColors: Record<string, string> = {
  dashboard_wallet: 'blue',
  credit_wallet: 'purple',
  mobile_money: 'gold',
  cash: 'green',
  wallet: 'blue',
  nfc: 'purple',
  credit: 'orange',
};

const paymentLabels: Record<string, string> = {
  dashboard_wallet: 'Dashboard Wallet',
  credit_wallet: 'Credit Wallet',
  mobile_money: 'Mobile Money',
  cash: 'Cash',
  wallet: 'Wallet',
  nfc: 'NFC Card',
  credit: 'Credit',
};

export const OrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<OrderStats | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  // Action modal
  const [actionModal, setActionModal] = useState<{
    visible: boolean;
    order: Order | null;
    action: 'accept' | 'reject' | 'ready' | 'complete' | 'cancel' | null;
  }>({ visible: false, order: null, action: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  // View modal
  const [viewModal, setViewModal] = useState<{ visible: boolean; order: Order | null }>({
    visible: false,
    order: null,
  });
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => loadOrders(true), 30000);
    return () => clearInterval(interval);
  }, [statusFilter, paymentFilter, pagination.current]);

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await retailerApi.getOrders({
        status: statusFilter || undefined,
        payment_status: paymentFilter || undefined,
        search: searchTerm || undefined,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
      });

      const data = response.data;
      setOrders(data.orders || []);
      setPagination((prev) => ({ ...prev, total: data.total || 0 }));

      const allOrders = data.orders || [];
      const completedOrders = allOrders.filter((o: Order) => o.status === 'completed');

      // Calculate revenue by payment method
      const dashboardWalletRevenue = completedOrders
        .filter((o: Order) => o.payment_method === 'dashboard_wallet' || o.payment_method === 'wallet')
        .reduce((sum: number, o: Order) => sum + o.total, 0);
      const creditWalletRevenue = completedOrders
        .filter((o: Order) => o.payment_method === 'credit_wallet' || o.payment_method === 'credit')
        .reduce((sum: number, o: Order) => sum + o.total, 0);
      const mobileMoneyRevenue = completedOrders
        .filter((o: Order) => o.payment_method === 'mobile_money')
        .reduce((sum: number, o: Order) => sum + o.total, 0);
      const totalOnlineRevenue = dashboardWalletRevenue + creditWalletRevenue + mobileMoneyRevenue;

      // Mock gas rewards calculation (12% of profit when profit >= 1000 RWF)
      const gasRewardsRwf = Math.round(totalOnlineRevenue * 0.03); // ~3% as gas rewards
      const gasRewardsM3 = gasRewardsRwf / 300; // Assuming 300 RWF per M³

      setStats({
        pending: allOrders.filter((o: Order) => o.status === 'pending').length,
        processing: allOrders.filter((o: Order) => o.status === 'processing').length,
        ready: allOrders.filter((o: Order) => o.status === 'ready').length,
        completed_today: completedOrders.length,
        cancelled_today: allOrders.filter((o: Order) => o.status === 'cancelled').length,
        total_online_revenue: totalOnlineRevenue,
        dashboard_wallet_revenue: dashboardWalletRevenue,
        credit_wallet_revenue: creditWalletRevenue,
        mobile_money_revenue: mobileMoneyRevenue,
        gas_rewards_m3: gasRewardsM3,
        gas_rewards_rwf: gasRewardsRwf,
      });
    } catch (error) {
      console.error('Failed to load orders:', error);
      message.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadOrderDetail = async (orderId: string) => {
    setViewLoading(true);
    try {
      const response = await retailerApi.getOrder(orderId);
      const order = response.data.order || response.data;
      setViewModal({ visible: true, order });
    } catch (error) {
      console.error('Failed to load order:', error);
      message.error('Failed to load order details');
    } finally {
      setViewLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionModal.order || !actionModal.action) return;

    setActionLoading(true);
    try {
      const { order, action } = actionModal;

      switch (action) {
        case 'accept':
          await retailerApi.updateOrderStatus(order.id, 'processing', actionNotes);
          message.success('Order accepted');
          break;
        case 'reject':
        case 'cancel':
          if (!actionNotes.trim()) {
            message.error('Please provide a reason');
            setActionLoading(false);
            return;
          }
          await retailerApi.cancelOrder(order.id, actionNotes);
          message.success('Order cancelled');
          break;
        case 'ready':
          await retailerApi.updateOrderStatus(order.id, 'ready', actionNotes);
          message.success('Order marked as ready');
          break;
        case 'complete':
          await retailerApi.fulfillOrder(order.id);
          message.success('Order completed');
          break;
      }

      setActionModal({ visible: false, order: null, action: null });
      setActionNotes('');
      loadOrders();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getActionTitle = () => {
    switch (actionModal.action) {
      case 'accept': return 'Accept Order';
      case 'reject': return 'Reject Order';
      case 'ready': return 'Mark as Ready';
      case 'complete': return 'Complete Order';
      case 'cancel': return 'Cancel Order';
      default: return 'Order Action';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-RW', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return formatDate(dateString);
  };

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'display_id',
      key: 'display_id',
      render: (value: string, record: Order) => (
        <Button type="link" onClick={() => loadOrderDetail(record.id)}>
          <Text strong>#{value || record.id.slice(0, 8)}</Text>
        </Button>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (name: string, record: Order) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.customer_phone}</Text>
        </div>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      render: (_: any, record: Order) => (
        <Badge count={record.items?.length || 0} showZero>
          <ShoppingCartOutlined style={{ fontSize: 18 }} />
        </Badge>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (value: number) => (
        <Text strong style={{ color: '#0ea5e9' }}>{value?.toLocaleString()} RWF</Text>
      ),
      sorter: (a: Order, b: Order) => a.total - b.total,
    },
    {
      title: 'Payment',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (value: string) => (
        <Tag color={paymentColors[value] || 'default'}>
          {paymentLabels[value] || value?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => (
        <Tag color={statusColors[value] || 'default'}>
          {value?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string) => <Text>{getRelativeTime(value)}</Text>,
      sorter: (a: Order, b: Order) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => loadOrderDetail(record.id)}
          />
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => setActionModal({ visible: true, order: record, action: 'accept' })}
              >
                Accept
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setActionModal({ visible: true, order: record, action: 'reject' })}
              >
                Reject
              </Button>
            </>
          )}
          {record.status === 'processing' && (
            <Button
              type="primary"
              size="small"
              onClick={() => setActionModal({ visible: true, order: record, action: 'ready' })}
            >
              Ready
            </Button>
          )}
          {record.status === 'ready' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => setActionModal({ visible: true, order: record, action: 'complete' })}
            >
              Complete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Orders</Title>
        <Button
          icon={<ReloadOutlined spin={refreshing} />}
          onClick={() => loadOrders(true)}
          loading={refreshing}
        >
          Refresh
        </Button>
      </Row>

      {/* Revenue Stats Cards */}
      {stats && (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={5}>
              <Card size="small" style={{ background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)', border: 'none' }}>
                <Statistic
                  title={<span style={{ color: 'rgba(255,255,255,0.9)' }}>Total Online Revenue</span>}
                  value={stats.total_online_revenue}
                  suffix="RWF"
                  valueStyle={{ color: 'white', fontSize: '18px' }}
                  formatter={(value) => value?.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={5}>
              <Card size="small">
                <Statistic
                  title="Dashboard Wallet Revenue"
                  value={stats.dashboard_wallet_revenue}
                  suffix="RWF"
                  valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                  formatter={(value) => value?.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={5}>
              <Card size="small">
                <Statistic
                  title="Credit Wallet Revenue"
                  value={stats.credit_wallet_revenue}
                  suffix="RWF"
                  valueStyle={{ color: '#722ed1', fontSize: '16px' }}
                  formatter={(value) => value?.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={5}>
              <Card size="small">
                <Statistic
                  title="Mobile Money Revenue"
                  value={stats.mobile_money_revenue}
                  suffix="RWF"
                  valueStyle={{ color: '#faad14', fontSize: '16px' }}
                  formatter={(value) => value?.toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={4}>
              <Card size="small" style={{ background: '#fff7e6', borderColor: '#ffc069' }}>
                <Statistic
                  title="Gas Rewards Given"
                  value={stats.gas_rewards_m3.toFixed(2)}
                  suffix={<span>M³ <Text type="secondary" style={{ fontSize: 11 }}>({stats.gas_rewards_rwf.toLocaleString()} RWF)</Text></span>}
                  valueStyle={{ color: '#fa541c', fontSize: '16px' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Order Status Counts */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col>
                <Text strong style={{ marginRight: 16 }}>Order Status:</Text>
              </Col>
              <Col>
                <Space size="large">
                  <Badge count={stats.pending} showZero overflowCount={999}>
                    <Tag color="orange" style={{ marginRight: 0 }}>Pending</Tag>
                  </Badge>
                  <Badge count={stats.processing} showZero overflowCount={999}>
                    <Tag color="blue" style={{ marginRight: 0 }}>Processing</Tag>
                  </Badge>
                  <Badge count={stats.ready} showZero overflowCount={999}>
                    <Tag color="cyan" style={{ marginRight: 0 }}>Ready</Tag>
                  </Badge>
                  <Badge count={stats.completed_today} showZero overflowCount={999}>
                    <Tag color="green" style={{ marginRight: 0 }}>Completed</Tag>
                  </Badge>
                  <Badge count={stats.cancelled_today} showZero overflowCount={999}>
                    <Tag color="red" style={{ marginRight: 0 }}>Cancelled</Tag>
                  </Badge>
                </Space>
              </Col>
            </Row>
          </Card>
        </>
      )}

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Input.Search
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={() => loadOrders()}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="">All Status</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="processing">Processing</Select.Option>
              <Select.Option value="ready">Ready</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Payment Method"
              value={paymentFilter}
              onChange={setPaymentFilter}
              style={{ width: '100%' }}
              allowClear
            >
              <Select.Option value="">All Payments</Select.Option>
              <Select.Option value="dashboard_wallet">Dashboard Wallet</Select.Option>
              <Select.Option value="credit_wallet">Credit Wallet</Select.Option>
              <Select.Option value="mobile_money">Mobile Money</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 900 }}
          size="small"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} orders`,
            size: 'small',
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
          }}
          rowClassName={(record) =>
            record.status === 'pending' ? 'ant-table-row-pending' : ''
          }
        />
      </Card>

      {/* Action Modal */}
      <Modal
        title={getActionTitle()}
        open={actionModal.visible}
        onCancel={() => {
          setActionModal({ visible: false, order: null, action: null });
          setActionNotes('');
        }}
        onOk={handleAction}
        confirmLoading={actionLoading}
        okText={actionModal.action === 'reject' || actionModal.action === 'cancel' ? 'Confirm Cancel' : 'Confirm'}
        okButtonProps={{
          danger: actionModal.action === 'reject' || actionModal.action === 'cancel',
        }}
      >
        {actionModal.order && (
          <div>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Order">
                #{actionModal.order.display_id || actionModal.order.id.slice(0, 8)}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {actionModal.order.customer_name}
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <Text strong>{actionModal.order.total?.toLocaleString()} RWF</Text>
              </Descriptions.Item>
            </Descriptions>

            {(actionModal.action === 'reject' || actionModal.action === 'cancel') && (
              <Form.Item label="Reason" required style={{ marginBottom: 0 }}>
                <Input.TextArea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Enter reason for cancellation..."
                  rows={3}
                />
              </Form.Item>
            )}

            {(actionModal.action === 'accept' || actionModal.action === 'ready') && (
              <Form.Item label="Notes (optional)" style={{ marginBottom: 0 }}>
                <Input.TextArea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Add notes..."
                  rows={2}
                />
              </Form.Item>
            )}
          </div>
        )}
      </Modal>

      {/* View Order Modal */}
      <Modal
        title={`Order #${viewModal.order?.display_id || viewModal.order?.id?.slice(0, 8) || ''}`}
        open={viewModal.visible}
        onCancel={() => setViewModal({ visible: false, order: null })}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => {
            if (!viewModal.order) return;

            const printWindow = window.open('', '_blank');
            if (!printWindow) {
              message.error('Please allow popups to print');
              return;
            }

            const order = viewModal.order;

            const htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                <title>Order Receipt #${order.display_id || order.id.substring(0, 8)}</title>
                <style>
                  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
                  .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                  .company-name { font-size: 24px; font-weight: bold; margin: 0; }
                  .receipt-title { font-size: 16px; color: #666; margin: 5px 0 0 0; }
                  .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
                  .info-group { flex: 1; }
                  .label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
                  .value { font-size: 14px; font-weight: 500; margin-top: 4px; }
                  .right-align { text-align: right; }
                  
                  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                  th { text-align: left; border-bottom: 1px solid #ddd; padding: 10px 0; font-size: 12px; text-transform: uppercase; color: #666; }
                  td { border-bottom: 1px solid #f5f5f5; padding: 12px 0; font-size: 14px; }
                  .total-row td { border-bottom: none; border-top: 2px solid #333; font-weight: bold; font-size: 16px; padding-top: 15px; }
                  .subtotal-row td { border-bottom: none; color: #666; padding-top: 5px; padding-bottom: 5px; }
                  
                  .footer { text-align: center; margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #999; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1 class="company-name">BIG Company Rwanda</h1>
                  <p class="receipt-title">Order Receipt</p>
                </div>

                <div class="info-grid">
                  <div class="info-group">
                    <div class="label">Customer</div>
                    <div class="value">${order.customer_name}</div>
                    <div class="value">${order.customer_phone}</div>
                  </div>
                  <div class="info-group right-align">
                    <div class="label">Order Details</div>
                    <div class="value">#${order.display_id || order.id.substring(0, 8)}</div>
                    <div class="value">${new Date(order.created_at).toLocaleDateString()} ${new Date(order.created_at).toLocaleTimeString()}</div>
                    <div class="value" style="margin-top: 5px;">
                      <span style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${order.payment_method.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th style="width: 50%">Item</th>
                      <th style="width: 15%; text-align: center;">Qty</th>
                      <th style="width: 15%; text-align: right;">Price</th>
                      <th style="width: 20%; text-align: right;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${order.items.map(item => `
                      <tr>
                        <td>
                          <div style="font-weight: 500;">${item.product_name}</div>
                          <div style="font-size: 11px; color: #888;">SKU: ${item.sku || 'N/A'}</div>
                        </td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">${item.unit_price.toLocaleString()}</td>
                        <td style="text-align: right;">${item.total.toLocaleString()} RWF</td>
                      </tr>
                    `).join('')}
                    
                    <tr class="subtotal-row">
                      <td colspan="3" style="text-align: right;">Subtotal</td>
                      <td style="text-align: right;">${order.subtotal?.toLocaleString()} RWF</td>
                    </tr>
                    ${order.discount ? `
                    <tr class="subtotal-row">
                      <td colspan="3" style="text-align: right; color: #52c41a;">Discount</td>
                      <td style="text-align: right; color: #52c41a;">-${order.discount.toLocaleString()} RWF</td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                      <td colspan="3" style="text-align: right;">Total</td>
                      <td style="text-align: right;">${order.total.toLocaleString()} RWF</td>
                    </tr>
                  </tbody>
                </table>

                <div class="footer">
                  <p>Thank you for your business!</p>
                  <p>BIG Company Rwanda Distribution Platform</p>
                </div>
                
                <script>
                  window.onload = function() { window.print(); window.close(); }
                </script>
              </body>
              </html>
            `;

            printWindow.document.write(htmlContent);
            printWindow.document.close();
          }}>
            Print
          </Button>,
          <Button key="close" onClick={() => setViewModal({ visible: false, order: null })}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {viewLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : viewModal.order ? (
          <div>
            {/* Status Steps */}
            {viewModal.order.status !== 'cancelled' && (
              <Steps
                current={['pending', 'processing', 'ready', 'completed'].indexOf(viewModal.order.status)}
                size="small"
                style={{ marginBottom: 24 }}
                items={[
                  { title: 'Pending' },
                  { title: 'Processing' },
                  { title: 'Ready' },
                  { title: 'Completed' },
                ]}
                className="no-print"
              />
            )}

            {viewModal.order.status === 'cancelled' && (
              <div style={{ background: '#fff1f0', padding: 16, borderRadius: 8, marginBottom: 24 }}>
                <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                <Text strong style={{ color: '#ff4d4f' }}>Order Cancelled</Text>
                {viewModal.order.cancel_reason && (
                  <div><Text type="secondary">Reason: {viewModal.order.cancel_reason}</Text></div>
                )}
              </div>
            )}

            <Descriptions column={2} size="small" style={{ marginBottom: 24 }} className="no-print">
              <Descriptions.Item label="Customer">{viewModal.order.customer_name}</Descriptions.Item>
              <Descriptions.Item label="Phone">{viewModal.order.customer_phone}</Descriptions.Item>
              <Descriptions.Item label="Payment">
                <Tag color={paymentColors[viewModal.order.payment_method]}>
                  {paymentLabels[viewModal.order.payment_method]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[viewModal.order.status]}>
                  {viewModal.order.status?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created">{formatDate(viewModal.order.created_at)}</Descriptions.Item>
              {viewModal.order.completed_at && (
                <Descriptions.Item label="Completed">{formatDate(viewModal.order.completed_at)}</Descriptions.Item>
              )}
            </Descriptions>

            <Table
              dataSource={viewModal.order.items}
              pagination={false}
              rowKey="id"
              size="small"
              columns={[
                {
                  title: 'Product',
                  key: 'product_name',
                  render: (_, record) => (
                    <Space>
                      {record.image ? (
                        <img 
                          src={record.image} 
                          alt={record.product_name} 
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} 
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingCartOutlined style={{ fontSize: 20, color: '#ccc' }} />
                        </div>
                      )}
                      <div>
                        <Text strong>{record.product_name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>SKU: {record.sku || 'N/A'}</Text>
                      </div>
                    </Space>
                  ),
                },
                {
                  title: 'Qty',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  align: 'center',
                },
                {
                  title: 'Price',
                  dataIndex: 'unit_price',
                  key: 'unit_price',
                  render: (value: number) => `${value?.toLocaleString()} RWF`,
                  align: 'right',
                },
                {
                  title: 'Total',
                  dataIndex: 'total',
                  key: 'total',
                  render: (value: number) => <Text strong>{value?.toLocaleString()} RWF</Text>,
                  align: 'right',
                },
              ]}
              summary={() => (
                <>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}><Text>Subtotal</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Text>{viewModal.order?.subtotal?.toLocaleString()} RWF</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  {(viewModal.order?.discount || 0) > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}><Text type="success">Discount</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <Text type="success">-{viewModal.order?.discount?.toLocaleString()} RWF</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}><Title level={5} style={{ margin: 0 }}>Total</Title></Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <Title level={5} style={{ margin: 0, color: '#0ea5e9' }}>
                        {viewModal.order?.total?.toLocaleString()} RWF
                      </Title>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </>
              )}
            />
          </div>
        ) : (
          <Empty description="Order not found" />
        )}
      </Modal>

      <style>{`
        .ant-table-row-pending {
          background-color: #fff7e6;
        }
        .ant-table-row-pending:hover > td {
          background-color: #fff1b8 !important;
        }
      `}</style>
    </div>
  );
};

export default OrdersPage;
