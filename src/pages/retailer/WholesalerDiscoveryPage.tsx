import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Tag,
  Space,
  message,
  Modal,
  Descriptions,
  Empty,
  Spin,
  Typography,
  Alert,
  Badge,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  ShopOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/apiService';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Wholesaler {
  id: number;
  companyName: string;
  contactPerson: string;
  address: string;
  phone: string;
  email: string;
  isVerified: boolean;
  retailerCount: number;
  productCount: number;
  isLinked: boolean;
  requestStatus: string | null; // pending, approved, rejected, or null
}

interface LinkRequest {
  id: number;
  wholesalerId: number;
  wholesalerName: string;
  wholesalerPhone: string;
  wholesalerAddress: string;
  status: string;
  message: string;
  rejectionReason: string | null;
  createdAt: string;
  respondedAt: string | null;
}

const WholesalerDiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [myRequests, setMyRequests] = useState<LinkRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentLinkedId, setCurrentLinkedId] = useState<number | null>(null);
  const [selectedWholesaler, setSelectedWholesaler] = useState<Wholesaler | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  // Check if retailer already has a pending request
  const hasPendingRequest = myRequests.some(r => r.status === 'pending');

  useEffect(() => {
    fetchWholesalers();
    fetchMyRequests();
  }, [search]);

  const fetchWholesalers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/retailer/wholesalers/available', {
        params: { search }
      });
      setWholesalers(response.data.wholesalers || []);
      setCurrentLinkedId(response.data.currentLinkedWholesalerId || null);
    } catch (error: any) {
      message.error('Failed to fetch wholesalers');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await api.get('/retailer/wholesalers/link-requests');
      setMyRequests(response.data.requests || []);
    } catch (error: any) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedWholesaler) return;

    setSendingRequest(true);
    try {
      await api.post('/retailer/wholesalers/link-request', {
        wholesalerId: selectedWholesaler.id,
        message: requestMessage
      });
      message.success('Link request sent successfully!');
      setRequestModalVisible(false);
      setRequestMessage('');
      setSelectedWholesaler(null);
      fetchWholesalers();
      fetchMyRequests();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      await api.delete(`/retailer/wholesalers/link-request/${requestId}`);
      message.success('Request cancelled');
      fetchWholesalers();
      fetchMyRequests();
    } catch (error: any) {
      message.error('Failed to cancel request');
    }
  };

  const getStatusTag = (wholesaler: Wholesaler) => {
    if (wholesaler.isLinked) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>Linked</Tag>;
    }
    if (wholesaler.requestStatus === 'pending') {
      return <Tag color="orange" icon={<ClockCircleOutlined />}>Request Pending</Tag>;
    }
    if (wholesaler.requestStatus === 'approved') {
      return <Tag color="green" icon={<CheckCircleOutlined />}>Approved</Tag>;
    }
    if (wholesaler.requestStatus === 'rejected') {
      return <Tag color="red" icon={<CloseCircleOutlined />}>Rejected</Tag>;
    }
    return <Tag color="default">Not Linked</Tag>;
  };

  const columns = [
    {
      title: 'Wholesaler',
      key: 'wholesaler',
      render: (_: any, record: Wholesaler) => (
        <Space direction="vertical" size={0}>
          <Space>
            <ShopOutlined />
            <Text strong>{record.companyName}</Text>
            {record.isVerified && (
              <Tooltip title="Verified Wholesaler">
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              </Tooltip>
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <EnvironmentOutlined /> {record.address || 'No address'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, record: Wholesaler) => (
        <Space direction="vertical" size={0}>
          <Text>{record.contactPerson || '-'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <PhoneOutlined /> {record.phone || 'N/A'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Products',
      dataIndex: 'productCount',
      key: 'productCount',
      align: 'center' as const,
      render: (count: number) => (
        <Badge count={count} showZero style={{ backgroundColor: count > 0 ? '#52c41a' : '#d9d9d9' }} />
      ),
    },
    {
      title: 'Retailers',
      dataIndex: 'retailerCount',
      key: 'retailerCount',
      align: 'center' as const,
      render: (count: number) => count,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Wholesaler) => getStatusTag(record),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Wholesaler) => (
        <Space>
          {/* View Products Button - Always visible for discovery */}
          <Tooltip title={record.isLinked ? "View & Order" : "View Products (Read-Only)"}>
            <Button
              icon={<ShoppingCartOutlined />}
              size="small"
              type={record.isLinked ? "primary" : "default"}
              onClick={() => navigate(`/retailer/add-stock?wholesalerId=${record.id}`)}
            >
              {record.isLinked ? 'Order' : 'View Products'}
            </Button>
          </Tooltip>

          {/* View Details Button */}
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedWholesaler(record);
              setViewModalVisible(true);
            }}
          >
            Details
          </Button>

          {/* Send Request Button - Only if not linked and no pending request */}
          {!record.isLinked && !currentLinkedId && !hasPendingRequest && record.requestStatus !== 'pending' && (
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="small"
              onClick={() => {
                setSelectedWholesaler(record);
                setRequestModalVisible(true);
              }}
            >
              {record.requestStatus === 'rejected' ? 'Resend' : 'Link'}
            </Button>
          )}

          {/* Cancel Request Button */}
          {record.requestStatus === 'pending' && (
            <Button
              danger
              size="small"
              onClick={() => {
                const req = myRequests.find(r => r.wholesalerId === record.id && r.status === 'pending');
                if (req) handleCancelRequest(req.id);
              }}
            >
              Cancel
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <LinkOutlined /> Discover Wholesalers
      </Title>

      {currentLinkedId && (
        <Alert
          message="You are already linked to a wholesaler"
          description="You can only be linked to one wholesaler at a time. To change your wholesaler, please contact admin."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* My Pending Requests */}
      {myRequests.filter(r => r.status === 'pending').length > 0 && (
        <Card title="Pending Requests" size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {myRequests.filter(r => r.status === 'pending').map(req => (
              <Alert
                key={req.id}
                message={`Request to ${req.wholesalerName}`}
                description={`Sent on ${new Date(req.createdAt).toLocaleDateString()}`}
                type="warning"
                showIcon
                action={
                  <Button size="small" danger onClick={() => handleCancelRequest(req.id)}>
                    Cancel
                  </Button>
                }
              />
            ))}
          </Space>
        </Card>
      )}

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search wholesalers..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: 300 }}
          />
        </Space>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : wholesalers.length === 0 ? (
          <Empty description="No wholesalers found" />
        ) : (
          <Table
            columns={columns}
            dataSource={wholesalers}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* View Wholesaler Modal */}
      <Modal
        title={
          <Space>
            <ShopOutlined />
            {selectedWholesaler?.companyName}
          </Space>
        }
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedWholesaler(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          !selectedWholesaler?.isLinked && !currentLinkedId && selectedWholesaler?.requestStatus !== 'pending' && (
            <Button
              key="request"
              type="primary"
              icon={<SendOutlined />}
              onClick={() => {
                setViewModalVisible(false);
                setRequestModalVisible(true);
              }}
            >
              Send Link Request
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedWholesaler && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Company Name">
              {selectedWholesaler.companyName}
              {selectedWholesaler.isVerified && (
                <Tag color="green" style={{ marginLeft: 8 }}>Verified</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Contact Person">
              {selectedWholesaler.contactPerson || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {selectedWholesaler.phone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedWholesaler.email || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              {selectedWholesaler.address || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Products Available">
              {selectedWholesaler.productCount}
            </Descriptions.Item>
            <Descriptions.Item label="Connected Retailers">
              {selectedWholesaler.retailerCount}
            </Descriptions.Item>
            <Descriptions.Item label="Link Status">
              {getStatusTag(selectedWholesaler)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Send Request Modal */}
      <Modal
        title="Send Link Request"
        open={requestModalVisible}
        onCancel={() => {
          setRequestModalVisible(false);
          setRequestMessage('');
        }}
        onOk={handleSendRequest}
        confirmLoading={sendingRequest}
        okText="Send Request"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Request to link with"
            description={selectedWholesaler?.companyName}
            type="info"
          />
          <TextArea
            placeholder="Add a message for the wholesaler (optional)"
            value={requestMessage}
            onChange={e => setRequestMessage(e.target.value)}
            rows={4}
          />
          <Text type="secondary">
            Once your request is approved, you will be able to order products from this wholesaler.
          </Text>
        </Space>
      </Modal>
    </div>
  );
};

export default WholesalerDiscoveryPage;
