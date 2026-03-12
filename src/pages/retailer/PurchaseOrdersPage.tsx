import { useState, useEffect } from 'react';
import {
  Table,
  Space,
  Card,
  Typography,
  Descriptions,
  Button,
  Tag,
  Row,
  Col,
  Input,
  Select,
  Modal,
  message,
  Spin,
  Badge,
  Empty,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MobileOutlined,
} from '@ant-design/icons';
import { retailerApi } from '../../services/apiService';

const { Title, Text } = Typography;

interface PurchaseOrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

interface PurchaseOrder {
  id: number;
  wholesaler_name: string;
  total_amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  items_count: number;
  items?: PurchaseOrderItem[];
}

const statusColors: Record<string, string> = {
  pending: 'orange',
  pending_payment: 'gold',
  processing: 'blue',
  shipped: 'cyan',
  delivered: 'green',
  completed: 'green',
  cancelled: 'red',
};

const paymentIcons: Record<string, React.ReactNode> = {
  wallet: <DollarOutlined />,
  credit: <BankOutlined />,
  momo: <MobileOutlined />,
};

const paymentLabels: Record<string, string> = {
  wallet: 'Capital Wallet',
  credit: 'Wholesaler Credit',
  momo: 'Mobile Money',
};

export const PurchaseOrdersPage = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  // View Modal
  const [viewModal, setViewModal] = useState<{ visible: boolean; order: PurchaseOrder | null }>({
    visible: false,
    order: null,
  });
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, pagination.current]);

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await retailerApi.getPurchaseOrders({
        status: statusFilter || undefined,
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
      });

      setOrders(response.data.orders || []);
      setPagination((prev) => ({ ...prev, total: response.data.total || 0 }));
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
      message.error('Failed to load purchase history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadOrderDetail = async (orderId: number) => {
    setViewLoading(true);
    setViewModal({ visible: true, order: null });
    try {
      const response = await retailerApi.getPurchaseOrder(orderId.toString());
      setViewModal({ visible: true, order: response.data.order });
    } catch (error) {
      console.error('Failed to load order details:', error);
      message.error('Failed to load order details');
      setViewModal({ visible: false, order: null });
    } finally {
      setViewLoading(false);
    }
  };

  const columns = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString(),
    },
    {
      title: 'Wholesaler',
      dataIndex: 'wholesaler_name',
      key: 'wholesaler_name',
      render: (name: string) => (
        <Space>
          <BankOutlined />
          <Text>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#1890ff' }}>{amount.toLocaleString()} RWF</Text>
      ),
    },
    {
      title: 'Payment Method',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method: string) => (
        <Tag icon={paymentIcons[method]} color="blue">
          {paymentLabels[method] || method.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {status.toUpperCase().replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: PurchaseOrder) => (
        <Button 
          icon={<EyeOutlined />} 
          onClick={() => loadOrderDetail(record.id)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Stock Purchase History</Title>
          <Text type="secondary">View and track your wholesale orders</Text>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={() => loadOrders(true)}
            loading={refreshing}
          >
            Refresh
          </Button>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <Select
              placeholder="Filter by Status"
              style={{ width: '100%' }}
              allowClear
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="pending_payment">Pending Payment</Select.Option>
              <Select.Option value="processing">Processing</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} orders`,
          }}
        />
      </Card>

      <Modal
        title={`Purchase Order #${viewModal.order?.id}`}
        open={viewModal.visible}
        onCancel={() => setViewModal({ visible: false, order: null })}
        footer={[
          <Button key="close" onClick={() => setViewModal({ visible: false, order: null })}>
            Close
          </Button>
        ]}
        width={800}
      >
        {viewLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : viewModal.order ? (
          <div>
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Descriptions title="Order Info" column={1} bordered size="small">
                  <Descriptions.Item label="Wholesaler">{viewModal.order.wholesaler_name}</Descriptions.Item>
                  <Descriptions.Item label="Date">{new Date(viewModal.order.created_at).toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="Payment">{paymentLabels[viewModal.order.payment_method] || viewModal.order.payment_method}</Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={statusColors[viewModal.order.status] || 'default'}>
                      {viewModal.order.status.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ textAlign: 'right', background: '#f0f5ff' }}>
                  <Text type="secondary">Total Amount</Text>
                  <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                    {viewModal.order.total_amount.toLocaleString()} RWF
                  </Title>
                </Card>
              </Col>
            </Row>

            <Divider>Order Items</Divider>
            
            <Table
              dataSource={viewModal.order.items}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { 
                  title: 'Product', 
                  key: 'product',
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
                      <Text strong>{record.product_name}</Text>
                    </Space>
                  )
                },
                { title: 'Price', dataIndex: 'price', key: 'price', render: (val) => `${val.toLocaleString()} RWF` },
                { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
                { title: 'Total', dataIndex: 'total', key: 'total', render: (val) => <Text strong>{val.toLocaleString()} RWF</Text> },
              ]}
            />
          </div>
        ) : (
          <Empty />
        )}
      </Modal>
    </div>
  );
};

export default PurchaseOrdersPage;
