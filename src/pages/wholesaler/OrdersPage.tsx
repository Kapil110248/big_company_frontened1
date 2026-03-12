import { useEffect, useState } from 'react';
import {
  Table,
  Space,
  Card,
  Typography,
  Descriptions,
  Button,
  Tag,
  Steps,
  Spin,
  Alert,
  Modal,
  Form,
  Input,
  message,
  Row,
  Col,
  Statistic,
  Select,
} from 'antd';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CarOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { wholesalerApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface OrderItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  product?: {
    name: string;
    sku: string;
  }
}

interface RetailerInfo {
  shopName?: string;
  address?: string;
  location?: string;
  user?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

interface RetailerOrder {
  id: string;
  orderNumber: string;
  retailerId: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'rejected';
  paymentType: 'credit' | 'bank_transfer' | 'cash' | 'mobile_money';
  paymentStatus: 'pending' | 'partial' | 'paid';
  items?: OrderItem[];
  createdAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  tracking_number?: string;
  delivery_notes?: string;
  rejection_reason?: string;
  // Support both naming conventions from backend
  retailer?: RetailerInfo;
  retailerProfile?: RetailerInfo;
}

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  total_revenue: number;
  today_orders: number;
  today_revenue: number;
}

const statusColors: Record<string, string> = {
  pending: 'orange',
  confirmed: 'blue',
  processing: 'cyan',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'default',
  rejected: 'red',
};

const paymentTypeColors: Record<string, string> = {
  credit: 'orange',
  bank_transfer: 'blue',
  cash: 'green',
  mobile_money: 'purple',
};

// Helper function to get retailer info from order (handles both naming conventions)
const getRetailerInfo = (order: RetailerOrder | null): RetailerInfo => {
  if (!order) return {};
  // Backend may return 'retailerProfile' or 'retailer' depending on the endpoint
  return order.retailer || order.retailerProfile || {};
};

const OrdersPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<RetailerOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // Action modals
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RetailerOrder | null>(null);
  const [form] = Form.useForm();
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [ordersResponse, statsResponse] = await Promise.all([
        wholesalerApi.getOrders({
          status: statusFilter || undefined,
          payment_type: paymentFilter || undefined,
          limit: pagination.pageSize,
          offset: (pagination.current - 1) * pagination.pageSize,
        }),
        wholesalerApi.getOrderStats(),
      ]);

      const ordersData = ordersResponse.data;
      const statsData = statsResponse.data;

      setOrders(ordersData.orders || []);
      setPagination(prev => ({ ...prev, total: ordersData.count || 0 }));
      // Backend returns { stats: {...} }, extract the stats object
      setStats(statsData.stats || statsData);
    } catch (err: any) {
      console.error('Orders error:', err);
      setError(err.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, paymentFilter, pagination.current, pagination.pageSize]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(interval);
  }, [statusFilter, paymentFilter]);

  const handleConfirmOrder = async () => {
    if (!selectedOrder || !selectedOrder.id) {
      message.error('Invalid order selected');
      return;
    }
    setActionLoading(true);
    try {
      await wholesalerApi.confirmOrder(String(selectedOrder.id));
      message.success(`Order ${selectedOrder.orderNumber || selectedOrder.id} confirmed`);
      setConfirmModalOpen(false);
      setSelectedOrder(null);
      fetchOrders(true);
    } catch (err: any) {
      console.error('Confirm order error:', err);
      message.error(err.response?.data?.error || err.message || 'Failed to confirm order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder || !selectedOrder.id) {
      message.error('Invalid order selected');
      return;
    }
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      await wholesalerApi.rejectOrder(String(selectedOrder.id), values.reason);
      message.success(`Order ${selectedOrder.orderNumber || selectedOrder.id} rejected`);
      setRejectModalOpen(false);
      setSelectedOrder(null);
      form.resetFields();
      fetchOrders(true);
    } catch (err: any) {
      console.error('Reject order error:', err);
      if (err.errorFields) {
        // Form validation error - don't show additional message
        return;
      }
      message.error(err.response?.data?.error || err.message || 'Failed to reject order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShipOrder = async () => {
    if (!selectedOrder || !selectedOrder.id) {
      message.error('Invalid order selected');
      return;
    }
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      await wholesalerApi.shipOrder(String(selectedOrder.id), values.tracking_number, values.delivery_notes);
      message.success(`Order ${selectedOrder.orderNumber || selectedOrder.id} marked as shipped`);
      setShipModalOpen(false);
      setSelectedOrder(null);
      form.resetFields();
      fetchOrders(true);
    } catch (err: any) {
      console.error('Ship order error:', err);
      if (err.errorFields) {
        return;
      }
      message.error(err.response?.data?.error || err.message || 'Failed to ship order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliverOrder = async (order: RetailerOrder) => {
    if (!order || !order.id) {
      message.error('Invalid order');
      return;
    }
    try {
      await wholesalerApi.confirmDelivery(String(order.id));
      message.success(`Order ${order.orderNumber || order.id} delivered`);
      fetchOrders(true);
    } catch (err: any) {
      console.error('Deliver order error:', err);
      message.error(err.response?.data?.error || err.message || 'Failed to confirm delivery');
    }
  };

  const viewOrderDetails = async (order: RetailerOrder) => {
    if (!order || !order.id) {
      message.error('Invalid order');
      return;
    }
    setSelectedOrder(order);
    setDetailModalOpen(true);
    // Fetch full order details
    try {
      const response = await wholesalerApi.getOrder(String(order.id));
      if (response.data.order) {
        setSelectedOrder(response.data.order);
      } else if (response.data) {
        setSelectedOrder(response.data);
      }
    } catch (err: any) {
      console.error('Detail error:', err);
      message.error('Failed to load order details');
      // Keep the original order data in modal instead of closing
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'confirmed':
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      case 'rejected':
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (value: string) => <Text code strong>{value}</Text>,
    },
    {
      title: 'Retailer',
      key: 'retailer',
      render: (_: any, record: RetailerOrder) => {
        const retailer = getRetailerInfo(record);
        return (
          <div>
            <div><strong>{retailer.shopName || retailer.user?.name || 'N/A'}</strong></div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{retailer.location || retailer.address || 'General'}</Text>
          </div>
        );
      },
    },
    {
      title: 'Items',
      key: 'items_count',
      render: (_: any, record: RetailerOrder) => record.items?.length || 0,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (value: number) => (
        <Text strong style={{ color: '#7c3aed' }}>
          {value?.toLocaleString()} RWF
        </Text>
      ),
    },
    {
      title: 'Payment',
      dataIndex: 'paymentType',
      key: 'paymentType',
      render: (value: string) => (
        <Tag color={paymentTypeColors[value] || 'default'}>
          {value?.replace('_', ' ').toUpperCase()}
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
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => formatDate(value),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: RetailerOrder) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewOrderDetails(record)}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  setSelectedOrder(record);
                  setConfirmModalOpen(true);
                }}
              >
                Confirm
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setSelectedOrder(record);
                  setRejectModalOpen(true);
                }}
              >
                Reject
              </Button>
            </>
          )}
          {(record.status === 'confirmed' || record.status === 'processing') && (
            <Button
              type="primary"
              size="small"
              icon={<CarOutlined />}
              onClick={() => {
                setSelectedOrder(record);
                setShipModalOpen(true);
              }}
            >
              Ship
            </Button>
          )}
          {record.status === 'shipped' && (
            <Button
              type="primary"
              size="small"
              style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
              onClick={() => handleDeliverOrder(record)}
            >
              Delivered
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
        <Title level={3} style={{ margin: 0 }}>Retailer Orders</Title>
        <Button
          icon={<ReloadOutlined spin={refreshing} />}
          onClick={() => fetchOrders(true)}
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

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Today's Orders"
              value={stats?.today_orders || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Today's Revenue"
              value={stats?.today_revenue || 0}
              suffix="RWF"
              prefix={<DollarOutlined />}
              formatter={(value) => value?.toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Pending"
              value={stats?.pending_orders || 0}
              valueStyle={{ color: '#f97316' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="In Transit"
              value={stats?.shipped_orders || 0}
              valueStyle={{ color: '#7c3aed' }}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Select
            placeholder="Filter by Status"
            allowClear
            style={{ width: 150 }}
            value={statusFilter || undefined}
            onChange={(value) => {
              setStatusFilter(value || '');
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
          >
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="confirmed">Confirmed</Select.Option>
            <Select.Option value="processing">Processing</Select.Option>
            <Select.Option value="shipped">Shipped</Select.Option>
            <Select.Option value="delivered">Delivered</Select.Option>
            <Select.Option value="cancelled">Cancelled</Select.Option>
            <Select.Option value="rejected">Rejected</Select.Option>
          </Select>
          <Select
            placeholder="Filter by Payment"
            allowClear
            style={{ width: 150 }}
            value={paymentFilter || undefined}
            onChange={(value) => {
              setPaymentFilter(value || '');
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
          >
            <Select.Option value="credit">Credit</Select.Option>
            <Select.Option value="bank_transfer">Bank Transfer</Select.Option>
            <Select.Option value="cash">Cash</Select.Option>
            <Select.Option value="mobile_money">Mobile Money</Select.Option>
          </Select>
        </Space>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1000 }}
          size="small"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} orders`,
            size: 'small',
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            },
          }}
        />
      </Card>

      {/* Confirm Modal */}
      <Modal
        title={`Confirm Order ${selectedOrder?.orderNumber}`}
        open={confirmModalOpen}
        onCancel={() => {
          setConfirmModalOpen(false);
          setSelectedOrder(null);
        }}
        onOk={handleConfirmOrder}
        confirmLoading={actionLoading}
        okText="Confirm Order"
      >
        <p>Are you sure you want to confirm this order?</p>
        {selectedOrder && (() => {
          const retailer = getRetailerInfo(selectedOrder);
          return (
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Retailer">{retailer.shopName || retailer.user?.name || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Items">{selectedOrder.items?.length || 0}</Descriptions.Item>
              <Descriptions.Item label="Total">{selectedOrder.totalAmount?.toLocaleString()} RWF</Descriptions.Item>
              <Descriptions.Item label="Payment">
                <Tag color={paymentTypeColors[selectedOrder.paymentType] || 'default'}>
                  {selectedOrder.paymentType?.replace('_', ' ').toUpperCase() || 'N/A'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          );
        })()}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title={`Reject Order ${selectedOrder?.orderNumber}`}
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setSelectedOrder(null);
          form.resetFields();
        }}
        onOk={handleRejectOrder}
        confirmLoading={actionLoading}
        okText="Reject Order"
        okButtonProps={{ danger: true }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="reason"
            label="Rejection Reason"
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <TextArea rows={4} placeholder="Enter the reason for rejecting this order..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Ship Modal */}
      <Modal
        title={`Ship Order ${selectedOrder?.orderNumber}`}
        open={shipModalOpen}
        onCancel={() => {
          setShipModalOpen(false);
          setSelectedOrder(null);
          form.resetFields();
        }}
        onOk={handleShipOrder}
        confirmLoading={actionLoading}
        okText="Mark as Shipped"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="tracking_number"
            label="Tracking Number"
          >
            <Input placeholder="Optional tracking number..." />
          </Form.Item>
          <Form.Item
            name="delivery_notes"
            label="Delivery Notes"
          >
            <TextArea rows={3} placeholder="Any delivery instructions or notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        title={`Order #${selectedOrder?.orderNumber}`}
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false);
          setSelectedOrder(null);
        }}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            Close
          </Button>,
          selectedOrder?.status === 'pending' && (
            <Button
              key="confirm"
              type="primary"
              onClick={() => {
                setDetailModalOpen(false);
                setConfirmModalOpen(true);
              }}
            >
              Confirm Order
            </Button>
          ),
          (selectedOrder?.status === 'confirmed' || selectedOrder?.status === 'processing') && (
            <Button
              key="ship"
              type="primary"
              onClick={() => {
                setDetailModalOpen(false);
                setShipModalOpen(true);
              }}
            >
              Ship Order
            </Button>
          ),
          selectedOrder?.status === 'shipped' && (
            <Button
              key="deliver"
              type="primary"
              style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
              onClick={() => {
                if (selectedOrder) handleDeliverOrder(selectedOrder);
                setDetailModalOpen(false);
              }}
            >
              Confirm Delivery
            </Button>
          ),
        ].filter(Boolean)}
      >
        {selectedOrder && (() => {
          const retailer = getRetailerInfo(selectedOrder);
          return (
            <>
              {selectedOrder.status !== 'rejected' && selectedOrder.status !== 'cancelled' && (
                <Steps
                  current={getStatusStep(selectedOrder.status)}
                  style={{ marginBottom: '24px' }}
                  items={[
                    { title: 'Pending', icon: <ClockCircleOutlined /> },
                    { title: 'Processing', icon: <ShoppingCartOutlined /> },
                    { title: 'Shipped', icon: <CarOutlined /> },
                    { title: 'Delivered', icon: <CheckCircleOutlined /> },
                  ]}
                />
              )}

              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card size="small" title="Order Details">
                    <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                      <Descriptions.Item label="Order Number">
                        <Text code>{selectedOrder.orderNumber}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Status">
                        <Tag color={statusColors[selectedOrder.status]}>{selectedOrder.status?.toUpperCase()}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Retailer">{retailer.shopName || retailer.user?.name || 'N/A'}</Descriptions.Item>
                      <Descriptions.Item label="Phone">{retailer.user?.phone || 'N/A'}</Descriptions.Item>
                      <Descriptions.Item label="Location">{retailer.location || retailer.address || 'General'}</Descriptions.Item>
                      <Descriptions.Item label="Payment Type">
                        <Tag color={paymentTypeColors[selectedOrder.paymentType] || 'default'}>
                          {selectedOrder.paymentType?.replace('_', ' ').toUpperCase() || 'N/A'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Payment Status">
                        <Tag color={selectedOrder.paymentStatus === 'paid' ? 'green' : selectedOrder.paymentStatus === 'partial' ? 'orange' : 'default'}>
                          {selectedOrder.paymentStatus?.toUpperCase() || 'N/A'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Order Date">
                        {formatDate(selectedOrder.createdAt)}
                      </Descriptions.Item>
                      {selectedOrder.tracking_number && (
                        <Descriptions.Item label="Tracking #">{selectedOrder.tracking_number}</Descriptions.Item>
                      )}
                      {selectedOrder.delivery_notes && (
                        <Descriptions.Item label="Delivery Notes">{selectedOrder.delivery_notes}</Descriptions.Item>
                      )}
                      {selectedOrder.rejection_reason && (
                        <Descriptions.Item label="Rejection Reason">
                          <Text type="danger">{selectedOrder.rejection_reason}</Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                </Col>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <Col span={24}>
                  <Card size="small" title="Order Items">
                    <Table
                      dataSource={selectedOrder.items}
                      pagination={false}
                      rowKey="id"
                      size="small"
                      columns={[
                        {
                          title: 'SKU',
                          dataIndex: 'sku',
                          key: 'sku',
                          render: (v: string, item: OrderItem) => <code>{v || item.product?.sku}</code>
                        },
                        { title: 'Product', dataIndex: 'name', key: 'name', render: (v: string, item: OrderItem) => v || item.product?.name },
                        { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                        {
                          title: 'Unit Price',
                          dataIndex: 'price',
                          key: 'price',
                          render: (value: number) => `${value?.toLocaleString()} RWF`,
                        },
                        {
                          title: 'Total',
                          dataIndex: 'total',
                          key: 'total',
                          render: (value: number) => (
                            <Text strong>{value?.toLocaleString()} RWF</Text>
                          ),
                        },
                      ]}
                      summary={() => (
                        <>
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={4} align="right">
                              <strong>Order Total</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={1}>
                              <Text strong style={{ color: '#7c3aed', fontSize: '16px' }}>
                                {selectedOrder.totalAmount?.toLocaleString()} RWF
                              </Text>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                        </>
                      )}
                    />
                  </Card>
                </Col>
              )}

              <Col span={24}>
                <Card size="small" title="Timeline">
                  <Space direction="vertical">
                    <div>
                      <Text type="secondary">Created: </Text>
                      <Text>{formatDate(selectedOrder.createdAt)}</Text>
                    </div>
                    {selectedOrder.confirmedAt && (
                      <div>
                        <Text type="secondary">Confirmed: </Text>
                        <Text>{formatDate(selectedOrder.confirmedAt)}</Text>
                      </div>
                    )}
                    {selectedOrder.shippedAt && (
                      <div>
                        <Text type="secondary">Shipped: </Text>
                        <Text>{formatDate(selectedOrder.shippedAt)}</Text>
                      </div>
                    )}
                    {selectedOrder.deliveredAt && (
                      <div>
                        <Text type="secondary">Delivered: </Text>
                        <Text>{formatDate(selectedOrder.deliveredAt)}</Text>
                      </div>
                    )}
                  </Space>
                </Card>
              </Col>
            </Row>
          </>
          );
        })()}
      </Modal>
    </div>
  );
};

export default OrdersPage;
