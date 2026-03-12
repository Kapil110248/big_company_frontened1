import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  message,
  Modal,
  Descriptions,
  Empty,
  Spin,
  Typography,
  Tabs,
  Statistic,
  Row,
  Col,
  Input,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  LinkOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import api from '../../services/apiService';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface LinkRequest {
  id: number;
  retailerId: number;
  retailerName: string;
  retailerPhone: string;
  retailerEmail: string;
  retailerAddress: string;
  isVerified: boolean;
  status: string;
  message: string | null;
  rejectionReason: string | null;
  createdAt: string;
  respondedAt: string | null;
}

interface LinkedRetailer {
  id: number;
  shopName: string;
  address: string;
  phone: string;
  email: string;
  isVerified: boolean;
  linkedAt: string;
  orderCount: number;
  totalPurchased: number;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const LinkRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [linkedRetailers, setLinkedRetailers] = useState<LinkedRetailer[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<LinkRequest | null>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchLinkedRetailers();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/wholesaler/link-requests');
      setRequests(response.data.requests || []);
      setStats(response.data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
    } catch (error: any) {
      message.error('Failed to fetch link requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedRetailers = async () => {
    try {
      const response = await api.get('/wholesaler/linked-retailers');
      setLinkedRetailers(response.data.retailers || []);
    } catch (error: any) {
      console.error('Failed to fetch linked retailers:', error);
    }
  };

  const handleApprove = async (requestId: number) => {
    setProcessing(true);
    try {
      await api.post(`/wholesaler/link-requests/${requestId}/approve`);
      message.success('Request approved successfully!');
      fetchRequests();
      fetchLinkedRetailers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to approve request');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      await api.post(`/wholesaler/link-requests/${selectedRequest.id}/reject`, {
        reason: rejectionReason
      });
      message.success('Request rejected');
      setRejectModalVisible(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      message.error('Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnlink = async (retailerId: number, shopName: string) => {
    try {
      await api.delete(`/wholesaler/linked-retailers/${retailerId}`);
      message.success(`${shopName} has been unlinked`);
      fetchLinkedRetailers();
    } catch (error: any) {
      message.error('Failed to unlink retailer');
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange" icon={<ClockCircleOutlined />}>Pending</Tag>;
      case 'approved':
        return <Tag color="green" icon={<CheckCircleOutlined />}>Approved</Tag>;
      case 'rejected':
        return <Tag color="red" icon={<CloseCircleOutlined />}>Rejected</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const requestColumns = [
    {
      title: 'Retailer',
      key: 'retailer',
      render: (_: any, record: LinkRequest) => (
        <Space direction="vertical" size={0}>
          <Space>
            <ShopOutlined />
            <Text strong>{record.retailerName}</Text>
            {record.isVerified && (
              <Tooltip title="Verified Retailer">
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              </Tooltip>
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <EnvironmentOutlined /> {record.retailerAddress || 'No address'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, record: LinkRequest) => (
        <Space direction="vertical" size={0}>
          <Text><PhoneOutlined /> {record.retailerPhone || 'N/A'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <MailOutlined /> {record.retailerEmail || 'N/A'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: 'Requested On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: LinkRequest) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedRequest(record);
              setViewModalVisible(true);
            }}
          >
            View
          </Button>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="Approve this request?"
                description="The retailer will be linked to your account"
                onConfirm={() => handleApprove(record.id)}
                okText="Approve"
              >
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  size="small"
                  loading={processing}
                >
                  Approve
                </Button>
              </Popconfirm>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                size="small"
                onClick={() => {
                  setSelectedRequest(record);
                  setRejectModalVisible(true);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const linkedColumns = [
    {
      title: 'Shop Name',
      key: 'shop',
      render: (_: any, record: LinkedRetailer) => (
        <Space>
          <ShopOutlined />
          <Text strong>{record.shopName}</Text>
          {record.isVerified && (
            <Tooltip title="Verified">
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, record: LinkedRetailer) => (
        <Space direction="vertical" size={0}>
          <Text><PhoneOutlined /> {record.phone || 'N/A'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.email || 'N/A'}</Text>
        </Space>
      ),
    },
    {
      title: 'Orders',
      dataIndex: 'orderCount',
      key: 'orderCount',
      align: 'center' as const,
    },
    {
      title: 'Total Purchased',
      dataIndex: 'totalPurchased',
      key: 'totalPurchased',
      render: (amount: number) => `${amount.toLocaleString()} RWF`,
    },
    {
      title: 'Linked Since',
      dataIndex: 'linkedAt',
      key: 'linkedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: LinkedRetailer) => (
        <Popconfirm
          title="Unlink this retailer?"
          description="They will no longer be able to order from you"
          onConfirm={() => handleUnlink(record.id, record.shopName)}
          okText="Unlink"
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<DisconnectOutlined />} size="small">
            Unlink
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <LinkOutlined /> Retailer Link Requests
      </Title>

      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Requests"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Approved"
              value={stats.approved}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={stats.rejected}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Linked Retailers"
              value={linkedRetailers.length}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'pending',
              label: (
                <span>
                  Pending
                  {stats.pending > 0 && (
                    <Tag color="orange" style={{ marginLeft: 8 }}>{stats.pending}</Tag>
                  )}
                </span>
              ),
            },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'linked', label: 'Linked Retailers' },
          ]}
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : activeTab === 'linked' ? (
          linkedRetailers.length === 0 ? (
            <Empty description="No linked retailers yet" />
          ) : (
            <Table
              columns={linkedColumns}
              dataSource={linkedRetailers}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )
        ) : filteredRequests.length === 0 ? (
          <Empty description={`No ${activeTab} requests`} />
        ) : (
          <Table
            columns={requestColumns}
            dataSource={filteredRequests}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* View Request Modal */}
      <Modal
        title="Request Details"
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedRequest(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          selectedRequest?.status === 'pending' && (
            <>
              <Button
                key="reject"
                danger
                onClick={() => {
                  setViewModalVisible(false);
                  setRejectModalVisible(true);
                }}
              >
                Reject
              </Button>
              <Button
                key="approve"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  handleApprove(selectedRequest.id);
                  setViewModalVisible(false);
                }}
                loading={processing}
              >
                Approve
              </Button>
            </>
          ),
        ]}
        width={600}
      >
        {selectedRequest && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Shop Name">
              {selectedRequest.retailerName}
              {selectedRequest.isVerified && (
                <Tag color="green" style={{ marginLeft: 8 }}>Verified</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {selectedRequest.retailerPhone || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedRequest.retailerEmail || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              {selectedRequest.retailerAddress || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Message from Retailer">
              {selectedRequest.message || 'No message'}
            </Descriptions.Item>
            <Descriptions.Item label="Requested On">
              {new Date(selectedRequest.createdAt).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {getStatusTag(selectedRequest.status)}
            </Descriptions.Item>
            {selectedRequest.rejectionReason && (
              <Descriptions.Item label="Rejection Reason">
                {selectedRequest.rejectionReason}
              </Descriptions.Item>
            )}
            {selectedRequest.respondedAt && (
              <Descriptions.Item label="Responded On">
                {new Date(selectedRequest.respondedAt).toLocaleString()}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Request"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectionReason('');
        }}
        onOk={handleReject}
        confirmLoading={processing}
        okText="Reject Request"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            Rejecting request from: <strong>{selectedRequest?.retailerName}</strong>
          </Text>
          <TextArea
            placeholder="Reason for rejection (optional)"
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            rows={3}
          />
        </Space>
      </Modal>
    </div>
  );
};

export default LinkRequestsPage;
