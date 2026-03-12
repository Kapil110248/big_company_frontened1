import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Modal,
  Descriptions,
  Empty,
  Spin,
  Typography,
  Tag,
  Tabs,
  Statistic,
  Row,
  Col,
  Input,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import { retailerApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface CustomerLinkRequest {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  isVerified: boolean;
  status: string;
  message: string | null;
  rejectionReason: string | null;
  createdAt: string;
  respondedAt: string | null;
}

interface LinkedCustomer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  isVerified: boolean;
  membershipType: string;
  orderCount: number;
  totalPurchased: number;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

const CustomerLinkRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<CustomerLinkRequest[]>([]);
  const [linkedCustomers, setLinkedCustomers] = useState<LinkedCustomer[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<CustomerLinkRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchLinkedCustomers();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await retailerApi.getCustomerLinkRequests();
      setRequests(response.data.requests || []);
      setStats(response.data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 });
    } catch (error: any) {
      message.error('Failed to fetch customer link requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedCustomers = async () => {
    try {
      const response = await retailerApi.getLinkedCustomers();
      setLinkedCustomers(response.data.customers || []);
    } catch (error: any) {
      console.error('Failed to fetch linked customers:', error);
    }
  };

  const handleApprove = async (requestId: number) => {
    setProcessing(true);
    try {
      await retailerApi.approveCustomerLinkRequest(requestId);
      message.success('Customer link request approved!');
      fetchRequests();
      fetchLinkedCustomers();
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
      await retailerApi.rejectCustomerLinkRequest(selectedRequest.id, rejectionReason);
      message.success('Customer link request rejected');
      setRejectModalVisible(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to reject request');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnlink = async (customerId: number) => {
    try {
      await retailerApi.unlinkCustomer(customerId);
      message.success('Customer unlinked successfully');
      fetchLinkedCustomers();
      fetchRequests();
    } catch (error: any) {
      message.error('Failed to unlink customer');
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
      title: 'Customer',
      key: 'customer',
      render: (_: any, record: CustomerLinkRequest) => (
        <Space direction="vertical" size={0}>
          <Space>
            <UserOutlined />
            <Text strong>{record.customerName}</Text>
            {record.isVerified && (
              <Tooltip title="Verified Customer">
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              </Tooltip>
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <PhoneOutlined /> {record.customerPhone || 'N/A'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, record: CustomerLinkRequest) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <MailOutlined /> {record.customerEmail || 'N/A'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <EnvironmentOutlined /> {record.customerAddress || 'No address'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      render: (msg: string) => msg || '-',
      ellipsis: true,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: CustomerLinkRequest) => getStatusTag(record.status),
    },
    {
      title: 'Date',
      key: 'date',
      render: (_: any, record: CustomerLinkRequest) => (
        <Text type="secondary">
          {new Date(record.createdAt).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CustomerLinkRequest) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record.id)}
                loading={processing}
              >
                Approve
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => {
                  setSelectedRequest(record);
                  setRejectModalVisible(true);
                }}
              >
                Reject
              </Button>
            </>
          )}
          {record.status === 'rejected' && record.rejectionReason && (
            <Tooltip title={`Reason: ${record.rejectionReason}`}>
              <Tag color="red">View Reason</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const customerColumns = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_: any, record: LinkedCustomer) => (
        <Space direction="vertical" size={0}>
          <Space>
            <UserOutlined />
            <Text strong>{record.name}</Text>
            {record.isVerified && (
              <Tooltip title="Verified">
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              </Tooltip>
            )}
          </Space>
          <Tag color="blue" style={{ marginTop: 4 }}>{record.membershipType}</Tag>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, record: LinkedCustomer) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <PhoneOutlined /> {record.phone || 'N/A'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <MailOutlined /> {record.email || 'N/A'}
          </Text>
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
      render: (val: number) => `${val.toLocaleString()} RWF`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: LinkedCustomer) => (
        <Popconfirm
          title="Unlink Customer"
          description="Are you sure you want to unlink this customer? They will no longer be able to view your products or place orders."
          onConfirm={() => handleUnlink(record.id)}
          okText="Yes, Unlink"
          cancelText="Cancel"
        >
          <Button
            danger
            size="small"
            icon={<DisconnectOutlined />}
          >
            Unlink
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const filteredRequests = requests.filter(r => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'approved') return r.status === 'approved';
    if (activeTab === 'rejected') return r.status === 'rejected';
    return true;
  });

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <TeamOutlined /> Customer Link Requests
      </Title>

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
              title="Linked Customers"
              value={linkedCustomers.length}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
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
              label: `Pending (${stats.pending})`,
              children: loading ? (
                <div style={{ textAlign: 'center', padding: 48 }}>
                  <Spin size="large" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <Empty description="No pending requests" />
              ) : (
                <Table
                  columns={requestColumns}
                  dataSource={filteredRequests}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'linked',
              label: `Linked Customers (${linkedCustomers.length})`,
              children: linkedCustomers.length === 0 ? (
                <Empty description="No linked customers yet" />
              ) : (
                <Table
                  columns={customerColumns}
                  dataSource={linkedCustomers}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'approved',
              label: `Approved (${stats.approved})`,
              children: (
                <Table
                  columns={requestColumns}
                  dataSource={filteredRequests}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'rejected',
              label: `Rejected (${stats.rejected})`,
              children: (
                <Table
                  columns={requestColumns}
                  dataSource={filteredRequests}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Reject Modal */}
      <Modal
        title="Reject Link Request"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectionReason('');
          setSelectedRequest(null);
        }}
        onOk={handleReject}
        confirmLoading={processing}
        okText="Reject Request"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            Are you sure you want to reject the link request from <Text strong>{selectedRequest?.customerName}</Text>?
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

export default CustomerLinkRequestsPage;
