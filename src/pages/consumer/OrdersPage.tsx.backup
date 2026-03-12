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
  Timeline,
  Steps,
  Divider,
  Button,
  Modal,
  Badge,
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
} from '@ant-design/icons';
import { consumerApi } from '../../services/apiService';

const { Title, Text, Paragraph } = Typography;

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
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

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await consumerApi.getOrders();
      setOrders(response.data.orders || getMockOrders());
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders(getMockOrders());
    } finally {
      setLoading(false);
    }
  };

  const getMockOrders = (): Order[] => [
    {
      id: '1',
      order_number: 'ORD-2024-001',
      status: 'delivered',
      retailer: {
        id: 'ret_001',
        name: 'Kigali Shop',
        location: 'Kigali City Center, KN 78 St',
        phone: '+250 788 123 456',
      },
      items: [
        { id: 'i1', product_id: '1', product_name: 'Fanta Orange 500ml', quantity: 3, unit_price: 500, total: 1500 },
        { id: 'i2', product_id: '3', product_name: 'Inyange Milk 1L', quantity: 2, unit_price: 1200, total: 2400 },
      ],
      subtotal: 3900,
      delivery_fee: 500,
      total: 4400,
      delivery_address: 'Kigali, Remera, KG 11 Ave',
      created_at: '2024-11-28T10:30:00Z',
      updated_at: '2024-11-28T15:00:00Z',
    },
    {
      id: '2',
      order_number: 'ORD-2024-002',
      status: 'shipped',
      retailer: {
        id: 'ret_002',
        name: 'Nyamirambo Market',
        location: 'Nyamirambo, Kigali',
        phone: '+250 788 234 567',
      },
      items: [
        { id: 'i3', product_id: '5', product_name: 'Mukamira Rice 5kg', quantity: 1, unit_price: 8000, total: 8000 },
        { id: 'i4', product_id: '6', product_name: 'Sunflower Oil 1L', quantity: 2, unit_price: 3500, total: 7000 },
        { id: 'i5', product_id: '4', product_name: 'Blue Band 500g', quantity: 1, unit_price: 2500, total: 2500 },
      ],
      subtotal: 17500,
      delivery_fee: 800,
      total: 18300,
      delivery_address: 'Kigali, Kimironko, KG 5 Ave',
      estimated_delivery: '2024-11-30T14:00:00Z',
      created_at: '2024-11-29T09:00:00Z',
      updated_at: '2024-11-29T16:00:00Z',
    },
    {
      id: '3',
      order_number: 'ORD-2024-003',
      status: 'pending',
      retailer: {
        id: 'ret_003',
        name: 'Kimironko Fresh',
        location: 'Kimironko, KG 11 Ave',
        phone: '+250 788 345 678',
      },
      items: [
        { id: 'i6', product_id: '2', product_name: 'Coca-Cola 500ml', quantity: 6, unit_price: 500, total: 3000 },
      ],
      subtotal: 3000,
      delivery_fee: 500,
      total: 3500,
      delivery_address: 'Kigali, Gisozi, KG 201 St',
      created_at: '2024-11-30T08:00:00Z',
      updated_at: '2024-11-30T08:00:00Z',
    },
  ];

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

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

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

      {/* Orders List */}
      {orders.length === 0 ? (
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
          {orders.map((order) => (
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
                      <Text strong>{order.retailer.name}</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {order.items.length} item(s)
                    </Text>
                  </Space>
                </Col>

                <Col xs={24} md={6}>
                  <Space direction="vertical" size={4}>
                    <Tag color={statusColors[order.status]} style={{ marginRight: 0 }}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Tag>
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
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(order);
                      }}
                    >
                      View Details
                    </Button>
                  </Space>
                </Col>
              </Row>

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
            <span>Order Details</span>
          </Space>
        }
        open={showDetailsModal}
        onCancel={() => setShowDetailsModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedOrder && (
          <div>
            {/* Order Info */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text type="secondary">Order Number</Text>
                <br />
                <Text strong>{selectedOrder.order_number}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Status</Text>
                <br />
                <Tag color={statusColors[selectedOrder.status]}>
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </Tag>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text type="secondary">Order Date</Text>
                <br />
                <Text>{formatDate(selectedOrder.created_at)}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary">Last Updated</Text>
                <br />
                <Text>{formatDate(selectedOrder.updated_at)}</Text>
              </Col>
            </Row>

            <Divider />

            {/* Retailer Info */}
            <Title level={5}>
              <ShopOutlined style={{ marginRight: 8 }} />
              Store Information
            </Title>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Text strong>{selectedOrder.retailer.name}</Text>
              <br />
              {selectedOrder.retailer.location && (
                <Space size={4}>
                  <EnvironmentOutlined style={{ color: '#999' }} />
                  <Text type="secondary">{selectedOrder.retailer.location}</Text>
                </Space>
              )}
              <br />
              {selectedOrder.retailer.phone && (
                <Space size={4}>
                  <PhoneOutlined style={{ color: '#999' }} />
                  <Text type="secondary">{selectedOrder.retailer.phone}</Text>
                </Space>
              )}
            </Card>

            {/* Delivery Address */}
            {selectedOrder.delivery_address && (
              <>
                <Title level={5}>
                  <EnvironmentOutlined style={{ marginRight: 8 }} />
                  Delivery Address
                </Title>
                <Paragraph style={{ marginBottom: 16 }}>
                  {selectedOrder.delivery_address}
                </Paragraph>
              </>
            )}

            <Divider />

            {/* Order Items */}
            <Title level={5}>
              <ShoppingOutlined style={{ marginRight: 8 }} />
              Items ({selectedOrder.items.length})
            </Title>
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {selectedOrder.items.map((item) => (
                <Row key={item.id} justify="space-between" align="middle">
                  <Col>
                    <Text>{item.product_name}</Text>
                    <br />
                    <Text type="secondary">
                      {formatPrice(item.unit_price)} x {item.quantity}
                    </Text>
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
    </div>
  );
};
