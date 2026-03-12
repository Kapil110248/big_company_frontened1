import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Spin,
  Empty,
  Steps,
  Divider,
  Button,
  Modal,
  Form,
  Select,
  Input,
  message,
  Alert,
  Descriptions,
  Timeline,
  Tabs,
} from 'antd';
import {
  ShoppingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CarOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ReloadOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { consumerApi } from '../../services/apiService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  image?: string;
}

interface Packager {
  name: string;
  phone: string;
  packed_at?: string;
}

interface Shipper {
  name: string;
  phone: string;
  vehicle: string;
  shipped_at?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  retailer: {
    id: string;
    name: string;
    location?: string;
    phone?: string;
  };
  items: OrderItem[];
  subtotal: number;
  delivery_fee?: number;
  total: number;
  delivery_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  estimated_delivery?: string;
  packager?: Packager;
  shipper?: Shipper;
  cancellation_reason?: string;
  cancelled_by?: 'customer' | 'retailer';
  payment_method?: string;
  meter_id?: string;
}

const statusColors: Record<string, string> = {
  pending: 'gold',
  confirmed: 'blue',
  processing: 'cyan',
  shipped: 'purple',
  delivered: 'green',
  cancelled: 'red',
};

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const cancelReasons = [
  'Changed my mind',
  'Found a better price elsewhere',
  'Ordered by mistake',
  'Delivery taking too long',
  'Need to modify order',
  'Financial reasons',
  'Other',
];

type OrderFilter = 'all' | 'active' | 'completed' | 'credit';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [cancelForm] = Form.useForm();
  const [cancelling, setCancelling] = useState(false);
  const [filter, setFilter] = useState<OrderFilter>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await consumerApi.getOrders();
      // Filter out null/invalid orders and ensure all required fields exist
      const validOrders = (response.data.orders || []).filter((order: Order | null) =>
        order &&
        order.id &&
        order.order_number &&
        order.status &&
        order.retailer &&
        order.items &&
        Array.isArray(order.items)
      );
      setOrders(validOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      message.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };



  const formatPrice = (amount: number) => `${amount.toLocaleString()} RWF`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusStep = (status: string) => {
    if (status === 'cancelled') return -1;
    return statusSteps.indexOf(status);
  };

  const canCancelOrder = (order: Order | null) => {
    if (!order || !order.status) return false;
    return order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing';
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleCancelOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
    cancelForm.resetFields();
  };

  const handleConfirmCancel = async (values: any) => {
    setCancelling(true);
    try {
      if (!selectedOrder) return;

      const response = await consumerApi.cancelOrder(selectedOrder.id, values.reason);

      if (response.data.success) {
        message.success('Order cancelled successfully');
        setShowCancelModal(false);
        fetchOrders();
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmDelivery = async (order: Order) => {
    Modal.confirm({
      title: 'Confirm Delivery',
      content: `Have you received your order ${order.order_number}?`,
      okText: 'Yes, Received',
      cancelText: 'Not Yet',
      onOk: async () => {
        try {
          const response = await consumerApi.confirmDelivery(order.id);
          if (response.data.success) {
            message.success('Delivery confirmed successfully!');
            fetchOrders();
          }
        } catch (error: any) {
          message.error(error.response?.data?.error || 'Failed to confirm delivery');
        }
      },
    });
  };

  const handleViewReceipt = (order: Order) => {
    setSelectedOrder(order);
    setShowReceiptModal(true);
  };

  const handleDownloadReceipt = () => {
    if (!selectedOrder) return;
    message.success(`Receipt for ${selectedOrder.order_number} downloaded`);
    // TODO: Implement actual PDF download
  };

  const getPaymentMethodBadge = (paymentMethod: string | undefined) => {
    if (!paymentMethod) return null;

    if (paymentMethod === 'card_credit') {
      return <Tag color="purple">Paid on Credit (Card)</Tag>;
    } else if (paymentMethod === 'food_loan') {
      return <Tag color="purple">Paid on Credit (Loan)</Tag>;
    }
    return <Tag color="blue">{paymentMethod}</Tag>;
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    switch (filter) {
      case 'active':
        filtered = orders.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status));
        break;
      case 'completed':
        filtered = orders.filter(o => o.status === 'delivered');
        break;
      case 'credit':
        filtered = orders.filter(o => o.payment_method === 'card_credit' || o.payment_method === 'food_loan');
        break;
      default:
        filtered = orders;
    }

    return filtered;
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
          padding: '20px 24px',
          marginBottom: 24,
          borderRadius: 8,
          color: 'white',
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              My Orders
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
              Track and manage your orders
            </Text>
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchOrders}
              style={{ borderRadius: 8 }}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </div>

      {/* Filter Tabs */}
      <Tabs
        activeKey={filter}
        onChange={(key) => setFilter(key as OrderFilter)}
        style={{ marginBottom: 16 }}
        items={[
          {
            key: 'all',
            label: `All Orders (${orders.length})`,
          },
          {
            key: 'active',
            label: `Active (${orders.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length})`,
          },
          {
            key: 'completed',
            label: `Completed (${orders.filter(o => o.status === 'delivered').length})`,
          },
          {
            key: 'credit',
            label: `Credit Orders (${orders.filter(o => o.payment_method === 'card_credit' || o.payment_method === 'food_loan').length})`,
          },
        ]}
      />

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No orders yet"
          style={{ marginTop: 60 }}
        >
          <Button type="primary" href="/consumer/shop">
            Start Shopping
          </Button>
        </Empty>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {filteredOrders.filter(order => order && order.status).map((order) => (
            <Card
              key={order.id}
              hoverable
              onClick={() => handleViewDetails(order)}
            >
              <Row gutter={16} align="middle">
                <Col xs={24} md={6}>
                  <Space direction="vertical" size={4}>
                    <Text type="secondary">Order</Text>
                    <Text strong style={{ fontSize: 16 }}>{order.order_number}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatDate(order.created_at)}
                    </Text>
                  </Space>
                </Col>

                <Col xs={24} md={6}>
                  <Space direction="vertical" size={4}>
                    <Space>
                      <ShopOutlined style={{ color: '#722ed1' }} />
                      <Text strong>{order.retailer?.name || 'Unknown Retailer'}</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {order.items?.length || 0} item(s)
                    </Text>
                  </Space>
                </Col>

                <Col xs={24} md={6}>
                  <Space direction="vertical" size={4}>
                    <Space>
                      <Tag color={statusColors[order.status] || 'default'} style={{ marginRight: 0 }}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                      </Tag>
                      {getPaymentMethodBadge(order.payment_method)}
                    </Space>
                    {order.status === 'shipped' && order.estimated_delivery && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Est. delivery: {formatDate(order.estimated_delivery)}
                      </Text>
                    )}
                  </Space>
                </Col>

                <Col xs={24} md={6} style={{ textAlign: 'right' }}>
                  <Space direction="vertical" size={4} style={{ alignItems: 'flex-end' }}>
                    <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                      {formatPrice(order.total)}
                    </Text>
                    <Space>
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(order);
                        }}
                      >
                        View
                      </Button>
                      {canCancelOrder(order) && (
                        <Button
                          type="link"
                          danger
                          icon={<CloseCircleOutlined />}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOrder(order);
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </Space>
                  </Space>
                </Col>
              </Row>

              {/* Cancellation reason */}
              {order.status === 'cancelled' && order.cancellation_reason && (
                <>
                  <Divider style={{ margin: '16px 0' }} />
                  <Alert
                    type="error"
                    message={`Cancelled by ${order.cancelled_by === 'retailer' ? 'Retailer' : 'You'}`}
                    description={order.cancellation_reason}
                    showIcon
                  />
                </>
              )}

              {/* Progress for active orders */}
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <>
                  <Divider style={{ margin: '16px 0' }} />
                  <Steps
                    current={getStatusStep(order.status)}
                    size="small"
                    items={[
                      { title: 'Pending', icon: <ClockCircleOutlined /> },
                      { title: 'Confirmed', icon: <CheckCircleOutlined /> },
                      { title: 'Processing', icon: <ShoppingOutlined /> },
                      { title: 'Shipped', icon: <CarOutlined /> },
                      { title: 'Delivered', icon: <CheckCircleOutlined /> },
                    ]}
                  />
                </>
              )}
            </Card>
          ))}
        </Space>
      )}

      {/* Order Details Modal */}
      <Modal
        title={
          <Space>
            <ShoppingOutlined />
            <span>Order Details - {selectedOrder?.order_number}</span>
          </Space>
        }
        open={showDetailsModal}
        onCancel={() => setShowDetailsModal(false)}
        footer={[
          <Button
            key="receipt"
            icon={<FileTextOutlined />}
            onClick={() => handleViewReceipt(selectedOrder!)}
          >
            View Receipt
          </Button>,
          selectedOrder?.status === 'shipped' && (
            <Button
              key="confirm"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleConfirmDelivery(selectedOrder!)}
            >
              Confirm Delivery
            </Button>
          ),
          canCancelOrder(selectedOrder!) && (
            <Button
              key="cancel"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancelOrder(selectedOrder!)}
            >
              Cancel Order
            </Button>
          ),
          <Button key="close" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedOrder && (
          <div>
            {/* Order Status */}
            <Card size="small" style={{ marginBottom: 16, background: '#f0f2f5' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Order Status</Text>
                  <br />
                  <Tag color={statusColors[selectedOrder.status]} style={{ marginTop: 4 }}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </Tag>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Payment Method</Text>
                  <br />
                  <Text strong>{selectedOrder.payment_method || 'N/A'}</Text>
                  {selectedOrder.meter_id && selectedOrder.meter_id !== 'N/A' && (
                    <>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Meter: {selectedOrder.meter_id}
                      </Text>
                    </>
                  )}
                </Col>
              </Row>
            </Card>

            {/* Cancellation Alert */}
            {selectedOrder.status === 'cancelled' && selectedOrder.cancellation_reason && (
              <Alert
                type="error"
                message={`Cancelled by ${selectedOrder.cancelled_by === 'retailer' ? 'Retailer' : 'You'}`}
                description={selectedOrder.cancellation_reason}
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Timeline */}
            <Card title="Order Timeline" size="small" style={{ marginBottom: 16 }}>
              <Timeline>
                <Timeline.Item color="green">
                  <Text strong>Order Placed</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDate(selectedOrder.created_at)}
                  </Text>
                </Timeline.Item>
                {selectedOrder.packager && (
                  <Timeline.Item color="blue">
                    <Text strong>Order Packed</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {selectedOrder.packager.packed_at
                        ? formatDate(selectedOrder.packager.packed_at)
                        : 'Processing'}
                    </Text>
                  </Timeline.Item>
                )}
                {selectedOrder.shipper && (
                  <Timeline.Item color="purple">
                    <Text strong>Order Shipped</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {selectedOrder.shipper.shipped_at
                        ? formatDate(selectedOrder.shipper.shipped_at)
                        : 'In transit'}
                    </Text>
                  </Timeline.Item>
                )}
                {selectedOrder.status === 'delivered' && (
                  <Timeline.Item color="green">
                    <Text strong>Delivered</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatDate(selectedOrder.updated_at)}
                    </Text>
                  </Timeline.Item>
                )}
              </Timeline>
            </Card>

            {/* Retailer Info */}
            <Card
              title={
                <>
                  <ShopOutlined style={{ marginRight: 8 }} />
                  Store Information
                </>
              }
              size="small"
              style={{ marginBottom: 16 }}
            >
              <Descriptions size="small" column={1}>
                <Descriptions.Item label="Store Name">
                  <Text strong>{selectedOrder.retailer.name}</Text>
                </Descriptions.Item>
                {selectedOrder.retailer.location && (
                  <Descriptions.Item label="Location">
                    <Space size={4}>
                      <EnvironmentOutlined style={{ color: '#999' }} />
                      <Text>{selectedOrder.retailer.location}</Text>
                    </Space>
                  </Descriptions.Item>
                )}
                {selectedOrder.retailer.phone && (
                  <Descriptions.Item label="Phone">
                    <Space size={4}>
                      <PhoneOutlined style={{ color: '#999' }} />
                      <Text>{selectedOrder.retailer.phone}</Text>
                    </Space>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Packager Info */}
            {selectedOrder.packager && (
              <Card
                title={
                  <>
                    <TeamOutlined style={{ marginRight: 8 }} />
                    Packager Information
                  </>
                }
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Name">
                    <Text strong>{selectedOrder.packager.name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    <Space size={4}>
                      <PhoneOutlined style={{ color: '#999' }} />
                      <Text>{selectedOrder.packager.phone}</Text>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Shipper Info */}
            {selectedOrder.shipper && (
              <Card
                title={
                  <>
                    <TruckOutlined style={{ marginRight: 8 }} />
                    Shipper Information
                  </>
                }
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Name">
                    <Text strong>{selectedOrder.shipper.name}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    <Space size={4}>
                      <PhoneOutlined style={{ color: '#999' }} />
                      <Text>{selectedOrder.shipper.phone}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Vehicle">
                    <Space size={4}>
                      <CarOutlined style={{ color: '#999' }} />
                      <Text>{selectedOrder.shipper.vehicle}</Text>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Delivery Address */}
            {selectedOrder.delivery_address && (
              <Card
                title={
                  <>
                    <EnvironmentOutlined style={{ marginRight: 8 }} />
                    Delivery Address
                  </>
                }
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Text>{selectedOrder.delivery_address}</Text>
              </Card>
            )}

            <Divider />

            {/* Order Items */}
            <Title level={5}>
              <ShoppingOutlined style={{ marginRight: 8 }} />
              Items ({selectedOrder.items.length})
            </Title>
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {selectedOrder.items.map((item) => (
                <Row key={item.id} justify="space-between" align="middle" style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Col>
                    <Space align="start">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.product_name} 
                          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4, marginRight: 8 }} 
                        />
                      ) : (
                        <div style={{ width: 48, height: 48, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                          <ShoppingOutlined style={{ fontSize: 24, color: '#ccc' }} />
                        </div>
                      )}
                      <div>
                        <Text strong>{item.product_name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatPrice(item.unit_price)} x {item.quantity}
                        </Text>
                      </div>
                    </Space>
                  </Col>
                  <Col>
                    <Text strong>{formatPrice(item.total)}</Text>
                  </Col>
                </Row>
              ))}
            </Space>

            <Divider />

            {/* Order Summary */}
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Col>
                <Text>Subtotal</Text>
              </Col>
              <Col>
                <Text>{formatPrice(selectedOrder.subtotal)}</Text>
              </Col>
            </Row>
            {selectedOrder.delivery_fee && selectedOrder.delivery_fee > 0 && (
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <Col>
                  <Text>Delivery Fee</Text>
                </Col>
                <Col>
                  <Text>{formatPrice(selectedOrder.delivery_fee)}</Text>
                </Col>
              </Row>
            )}
            <Row justify="space-between">
              <Col>
                <Text strong style={{ fontSize: 16 }}>Total</Text>
              </Col>
              <Col>
                <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                  {formatPrice(selectedOrder.total)}
                </Text>
              </Col>
            </Row>

            {/* Notes */}
            {selectedOrder.notes && (
              <>
                <Divider />
                <Title level={5}>Notes</Title>
                <Paragraph type="secondary">{selectedOrder.notes}</Paragraph>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            <span>Cancel Order</span>
          </Space>
        }
        open={showCancelModal}
        onCancel={() => setShowCancelModal(false)}
        footer={null}
        width={500}
      >
        <Alert
          type="warning"
          message="Are you sure you want to cancel this order?"
          description={`Order: ${selectedOrder?.order_number} - Total: ${formatPrice(selectedOrder?.total || 0)}`}
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          form={cancelForm}
          layout="vertical"
          onFinish={handleConfirmCancel}
        >
          <Form.Item
            name="reason"
            label="Reason for Cancellation"
            rules={[{ required: true, message: 'Please select a reason' }]}
          >
            <Select placeholder="Select a reason" size="large">
              {cancelReasons.map((reason) => (
                <Select.Option key={reason} value={reason}>
                  {reason}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="additional_notes"
            label="Additional Notes (Optional)"
          >
            <TextArea
              rows={3}
              placeholder="Any additional information..."
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowCancelModal(false)}>
                Keep Order
              </Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={cancelling}
              >
                Confirm Cancellation
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>Order Receipt</span>
          </Space>
        }
        open={showReceiptModal}
        onCancel={() => setShowReceiptModal(false)}
        footer={[
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadReceipt}
          >
            Download PDF
          </Button>,
          <Button key="close" onClick={() => setShowReceiptModal(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedOrder && (
          <div style={{ padding: '20px', background: 'white' }}>
            {/* Receipt Header */}
            <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #000', paddingBottom: 16 }}>
              <Title level={3} style={{ margin: 0 }}>BIG COMPANY RWANDA</Title>
              <Text>Kigali, Rwanda</Text>
              <br />
              <Text>Tax ID: 123456789</Text>
            </div>

            {/* Receipt Info */}
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Receipt #" span={2}>
                <Text strong>{selectedOrder.order_number}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Date">
                {formatDate(selectedOrder.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[selectedOrder.status]}>
                  {selectedOrder.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method" span={2}>
                {selectedOrder.payment_method}
                {selectedOrder.meter_id && selectedOrder.meter_id !== 'N/A' && (
                  <> (Meter: {selectedOrder.meter_id})</>
                )}
              </Descriptions.Item>
            </Descriptions>

            {/* Store Info */}
            <div style={{ marginBottom: 16 }}>
              <Text strong>Store: </Text>
              <Text>{selectedOrder.retailer.name}</Text>
              <br />
              <Text strong>Location: </Text>
              <Text>{selectedOrder.retailer.location}</Text>
            </div>

            {/* Items */}
            <table style={{ width: '100%', marginBottom: 16, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #000' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Item</th>
                  <th style={{ textAlign: 'center', padding: '8px' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '8px' }}>{item.product_name}</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>{formatPrice(item.unit_price)}</td>
                    <td style={{ textAlign: 'right', padding: '8px' }}>{formatPrice(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ borderTop: '2px solid #000', paddingTop: 8 }}>
              <Row justify="space-between" style={{ marginBottom: 4 }}>
                <Col><Text>Subtotal:</Text></Col>
                <Col><Text>{formatPrice(selectedOrder.subtotal)}</Text></Col>
              </Row>
              {selectedOrder.delivery_fee && selectedOrder.delivery_fee > 0 && (
                <Row justify="space-between" style={{ marginBottom: 4 }}>
                  <Col><Text>Delivery Fee:</Text></Col>
                  <Col><Text>{formatPrice(selectedOrder.delivery_fee)}</Text></Col>
                </Row>
              )}
              <Row justify="space-between" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #000' }}>
                <Col><Text strong style={{ fontSize: 16 }}>TOTAL:</Text></Col>
                <Col><Text strong style={{ fontSize: 16 }}>{formatPrice(selectedOrder.total)}</Text></Col>
              </Row>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#999' }}>
              <Text type="secondary">Thank you for shopping with BIG Company Rwanda!</Text>
              <br />
              <Text type="secondary">For support: +250 788 000 000 | support@bigcompany.rw</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
