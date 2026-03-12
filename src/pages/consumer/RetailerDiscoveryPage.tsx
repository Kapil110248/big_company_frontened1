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
  Tooltip,
  Select // Added Select
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
import api, { consumerApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Retailer {
  id: number;
  shopName: string;
  address: string;
  phone: string;
  email: string;
  isVerified: boolean;
  productCount: number;
  customerCount: number;
  isLinked: boolean;
  requestStatus: string | null;
}

interface LinkRequest {
  id: number;
  retailerId: number;
  retailerName: string;
  retailerPhone: string;
  retailerAddress: string;
  status: string;
  message: string;
  rejectionReason: string | null;
  createdAt: string;
  respondedAt: string | null;
}

const RetailerDiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [myRequests, setMyRequests] = useState<LinkRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  // Location States
  const [province, setProvince] = useState<string | undefined>(undefined);
  const [district, setDistrict] = useState<string | undefined>(undefined);
  const [sector, setSector] = useState<string | undefined>(undefined);

  const [currentLinkedId, setCurrentLinkedId] = useState<number | null>(null);
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  // NEW: Customer can link to MULTIPLE retailers
  // Get count of approved retailers
  const approvedRetailersCount = myRequests.filter(r => r.status === 'approved').length;

  useEffect(() => {
    fetchRetailers();
    fetchMyRequests();
  }, [search, province, district, sector]);

  const fetchRetailers = async () => {
    // Only search if all location fields are present, OR if it's the initial load (optional)
    // But requirement says "Strict address based".

    // Allow fetching all retailers by default (User request: "page per all retailers bhi dikhne chiye")
    /*
    if (!province || !district || !sector) {
         return; 
    }
    */

    try {
      setLoading(true);
      const response = await consumerApi.getRetailers({
        province,
        district,
        sector
      });
      setRetailers(response.data.retailers || []);
      console.log("Reatailers", response.data.retailers);
      setCurrentLinkedId(response.data.currentLinkedRetailerId || null);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setRetailers([]); // No stores found
      } else {
        message.error('Failed to fetch retailers');
      }
    } finally {
      setLoading(false);
    }
  };

  const [linkedRetailers, setLinkedRetailers] = useState<any[]>([]);
  useEffect(() => {
    fetchLinkedRetailers();
  }, []);

  const fetchLinkedRetailers = async () => {
    try {
      const response = await consumerApi.getProfile();
      if (response.data.success && response.data.data.linkedRetailers) {
        setLinkedRetailers(response.data.data.linkedRetailers);
      }
    } catch (error) {
      console.error('Error fetching linked retailers:', error);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const response = await api.get('/store/retailers/link-requests');
      setMyRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedRetailer) return;
    setSendingRequest(true);
    try {
      await api.post('/store/retailers/link-request', {
        retailerId: selectedRetailer.id,
        message: requestMessage
      });
      message.success('Link request sent successfully!');
      setRequestModalVisible(false);
      setRequestMessage('');
      setSelectedRetailer(null);
      fetchRetailers();
      fetchMyRequests();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      await api.delete(`/store/retailers/link-request/${requestId}`);
      message.success('Request cancelled');
      fetchRetailers();
      fetchMyRequests();
    } catch (error: any) {
      message.error('Failed to cancel request');
    }
  };

  const getStatusTag = (retailer: Retailer) => {
    if (retailer.isLinked) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>Linked</Tag>;
    }
    if (retailer.requestStatus === 'pending') {
      return <Tag color="orange" icon={<ClockCircleOutlined />}>Request Pending</Tag>;
    }
    if (retailer.requestStatus === 'approved') {
      return <Tag color="green" icon={<CheckCircleOutlined />}>Approved</Tag>;
    }
    if (retailer.requestStatus === 'rejected') {
      return <Tag color="red" icon={<CloseCircleOutlined />}>Rejected</Tag>;
    }
    return <Tag color="default">Not Linked</Tag>;
  };

  const columns = [
    {
      title: 'Retailer',
      key: 'retailer',
      render: (_: any, record: Retailer) => (
        <Space direction="vertical" size={0}>
          <Space>
            <ShopOutlined />
            <Text strong>{record.shopName}</Text>
            {record.isVerified && (
              <Tooltip title="Verified Retailer">
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
      render: (_: any, record: Retailer) => (
        <Space direction="vertical" size={0}>
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
      title: 'Status',
      key: 'status',
      render: (_: any, record: Retailer) => getStatusTag(record),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 320,
      render: (_: any, record: Retailer) => {
        // NEW: Customer can link to MULTIPLE retailers
        // Determine status for THIS retailer only
        const isApprovedByThisRetailer = record.requestStatus === 'approved' || record.isLinked;
        const hasPendingToThisRetailer = record.requestStatus === 'pending';
        const wasRejectedByThisRetailer = record.requestStatus === 'rejected';
        const hasNoRequestToThisRetailer = !record.requestStatus;

        return (
          <Space wrap>
            {/* View Products Button - Always show, highlight if approved */}
            <Button
              icon={<ShoppingCartOutlined />}
              size="small"
              type={isApprovedByThisRetailer ? "primary" : "default"}
              onClick={() => navigate(`/consumer/shop?retailerId=${record.id}`)}
            >
              {isApprovedByThisRetailer ? 'Shop Now' : 'View Products'}
            </Button>

            {/* CASE 1: Customer is APPROVED by this retailer - can buy */}
            {isApprovedByThisRetailer && (
              <Tag color="green" icon={<CheckCircleOutlined />} style={{ margin: 0 }}>
                Approved - Can Buy
              </Tag>
            )}

            {/* CASE 2: Customer has PENDING request to this retailer */}
            {hasPendingToThisRetailer && (
              <>
                <Tag color="orange" icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
                  Waiting for Approval
                </Tag>
                <Button
                  danger
                  size="small"
                  onClick={() => {
                    const req = myRequests.find(r => r.retailerId === record.id && r.status === 'pending');
                    if (req) handleCancelRequest(req.id);
                  }}
                >
                  Cancel
                </Button>
              </>
            )}

            {/* CASE 3: Request was REJECTED - can resend */}
            {wasRejectedByThisRetailer && (
              <>
                <Tag color="red" icon={<CloseCircleOutlined />} style={{ margin: 0 }}>
                  Rejected
                </Tag>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  size="small"
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  onClick={() => {
                    setSelectedRetailer(record);
                    setRequestModalVisible(true);
                  }}
                >
                  Resend Request
                </Button>
              </>
            )}

            {/* CASE 4: No request yet - can send link request */}
            {hasNoRequestToThisRetailer && !record.isLinked && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                size="small"
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                onClick={() => {
                  setSelectedRetailer(record);
                  setRequestModalVisible(true);
                }}
              >
                Send Link Request
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <LinkOutlined /> Discover Retailers
      </Title>

      {/* Show info about approved retailers */}
      {approvedRetailersCount > 0 && (
        <Alert
          message={`You are approved by ${approvedRetailersCount} retailer${approvedRetailersCount > 1 ? 's' : ''}`}
          description="You can place orders from any retailer that has approved your link request. You can also send requests to other retailers."
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Show guidance if no approvals yet */}
      {approvedRetailersCount === 0 && myRequests.filter(r => r.status === 'pending').length === 0 && (
        <Alert
          message="Link to Retailers"
          description="Send link requests to retailers you want to buy from. Once approved, you can place orders. You can link to multiple retailers!"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* NEW: My Linked Retailers Section */}
      {linkedRetailers.length > 0 && (
        <Card
          title={<><LinkOutlined /> My Linked Retailers</>}
          style={{ marginBottom: 24, border: '1px solid #52c41a' }}
        >
          <Table
            size="small"
            dataSource={linkedRetailers}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: 'Retailer',
                key: 'retailer',
                render: (_, record) => (
                  <Space>
                    <ShopOutlined />
                    <Text strong>{record.shopName}</Text>
                  </Space>
                )
              },
              {
                title: 'Location',
                dataIndex: 'address',
                key: 'address',
              },
              {
                title: 'Action',
                key: 'action',
                align: 'right',
                render: (_, record) => (
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => navigate(`/consumer/shop?retailerId=${record.id}`)}
                  >
                    Shop Now
                  </Button>
                )
              }
            ]}
          />
        </Card>
      )}

      {myRequests.filter(r => r.status === 'pending').length > 0 && (
        <Card title="Pending Requests" size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {myRequests.filter(r => r.status === 'pending').map(req => (
              <Alert
                key={req.id}
                message={`Request to ${req.retailerName}`}
                description={`Sent on ${new Date(req.createdAt).toLocaleDateString()}. Waiting for retailer approval.`}
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
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={5}>Find Store by Location</Title>
            <Space>
              <Button
                type="link"
                icon={<SearchOutlined />}
                onClick={() => {
                  fetchRetailers();
                  fetchLinkedRetailers();
                  fetchMyRequests();
                  message.success('Refreshed retailer list');
                }}
              >
                Refresh
              </Button>
              <Button
                type="link"
                onClick={() => {
                  setProvince(undefined);
                  setDistrict(undefined);
                  setSector(undefined);
                  fetchRetailers();
                }}
              >
                Show All Retailers
              </Button>
            </Space>
          </div>
          <Space wrap>
            <Select
              placeholder="Select Province"
              style={{ width: 200 }}
              onChange={(value) => {
                setProvince(value);
                setDistrict(undefined); // Reset dependent fields
                setSector(undefined);
              }}
              value={province}
              allowClear
            >
              <Select.Option value="Kigali">Kigali City</Select.Option>
              <Select.Option value="North">Northern Province</Select.Option>
              <Select.Option value="South">Southern Province</Select.Option>
              <Select.Option value="East">Eastern Province</Select.Option>
              <Select.Option value="West">Western Province</Select.Option>
            </Select>

            <Select
              placeholder="Select District"
              style={{ width: 200 }}
              disabled={!province}
              onChange={(value) => {
                setDistrict(value);
                setSector(undefined);
              }}
              value={district}
              allowClear
            >
              {province === 'Kigali' && (
                <>
                  <Select.Option value="Gasabo">Gasabo</Select.Option>
                  <Select.Option value="Kicukiro">Kicukiro</Select.Option>
                  <Select.Option value="Nyarugenge">Nyarugenge</Select.Option>
                </>
              )}
              {province && province !== 'Kigali' && (
                <Select.Option value="Demo District">Demo District</Select.Option>
              )}
            </Select>

            <Input
              placeholder="Enter Sector"
              style={{ width: 200 }}
              disabled={!district}
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            />

            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={fetchRetailers}
            >
              Find Stores
            </Button>

            <Button onClick={() => {
              setProvince(undefined);
              setDistrict(undefined);
              setSector(undefined);
              setRetailers([]);
              fetchRetailers();
            }}>
              Clear
            </Button>
          </Space>
        </Space>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : retailers.length === 0 ? (
          <Empty description="No retailers found" />
        ) : (
          retailers.length > 0 && (
            <Table
              columns={columns}
              dataSource={retailers}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )
        )}
      </Card>

      {/* View Retailer Modal */}
      <Modal
        title={
          <Space>
            <ShopOutlined />
            {selectedRetailer?.shopName}
          </Space>
        }
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedRetailer(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="products"
            icon={<ShoppingCartOutlined />}
            type={selectedRetailer?.requestStatus === 'approved' || selectedRetailer?.isLinked ? "primary" : "default"}
            onClick={() => {
              setViewModalVisible(false);
              navigate(`/consumer/shop?retailerId=${selectedRetailer?.id}`);
            }}
          >
            {selectedRetailer?.requestStatus === 'approved' || selectedRetailer?.isLinked ? 'Shop Now' : 'View Products'}
          </Button>,
          // Show Send Link Request button if no pending/approved request to this retailer
          !selectedRetailer?.isLinked && selectedRetailer?.requestStatus !== 'pending' && selectedRetailer?.requestStatus !== 'approved' && (
            <Button
              key="request"
              type="primary"
              icon={<SendOutlined />}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => {
                setViewModalVisible(false);
                setRequestModalVisible(true);
              }}
            >
              {selectedRetailer?.requestStatus === 'rejected' ? 'Resend Link Request' : 'Send Link Request'}
            </Button>
          ),
        ]}
        width={600}
      >
        {selectedRetailer && (
          <>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Shop Name">
                {selectedRetailer.shopName}
                {selectedRetailer.isVerified && (
                  <Tag color="green" style={{ marginLeft: 8 }}>Verified</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {selectedRetailer.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedRetailer.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Address">
                {selectedRetailer.address || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Products Available">
                {selectedRetailer.productCount}
              </Descriptions.Item>
              <Descriptions.Item label="Link Status">
                {getStatusTag(selectedRetailer)}
              </Descriptions.Item>
            </Descriptions>

            {/* Show appropriate message based on status */}
            {(selectedRetailer.isLinked || selectedRetailer.requestStatus === 'approved') && (
              <Alert
                message="You are approved by this retailer"
                description="You can browse products and place orders from this retailer."
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            {selectedRetailer.requestStatus === 'pending' && (
              <Alert
                message="Link Request Pending"
                description="Your link request is waiting for this retailer's approval. You will be notified once approved."
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            {selectedRetailer.requestStatus === 'rejected' && (
              <Alert
                message="Request Previously Rejected"
                description="Your previous request was rejected. You can resend a link request if you want."
                type="error"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}

            {!selectedRetailer.isLinked && !selectedRetailer.requestStatus && (
              <Alert
                message="Send a Link Request"
                description="Click 'Send Link Request' button below to request linking with this retailer. Once approved, you can place orders."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </>
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
            description={selectedRetailer?.shopName}
            type="info"
          />
          <TextArea
            placeholder="Add a message for the retailer (optional)"
            value={requestMessage}
            onChange={e => setRequestMessage(e.target.value)}
            rows={4}
          />
          <Text type="secondary">
            Once your request is approved, you will be able to view products and place orders from this retailer.
          </Text>
        </Space>
      </Modal>
    </div>
  );
};

export default RetailerDiscoveryPage;
