import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Select,
  message,
  Spin,
  Row,
  Col,
  Statistic,
  Alert,
  Popconfirm,
  Divider,
  Badge,
} from 'antd';
import {
  LinkOutlined,
  DisconnectOutlined,
  ShopOutlined,
  BankOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;

interface RetailerLinkage {
  id: number;
  shopName: string;
  phone: string;
  isActive: boolean;
  linkedWholesalerId: number | null;
  linkedWholesalerName: string | null;
}

interface WholesalerLinkage {
  id: number;
  companyName: string;
  phone: string;
  isActive: boolean;
  linkedRetailersCount: number;
  linkedRetailers: { id: number; shopName: string }[];
}

const LinkageManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [retailers, setRetailers] = useState<RetailerLinkage[]>([]);
  const [wholesalers, setWholesalers] = useState<WholesalerLinkage[]>([]);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<number | null>(null);
  const [selectedWholesaler, setSelectedWholesaler] = useState<number | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalRetailers: 0,
    linkedRetailers: 0,
    unlinkedRetailers: 0,
    totalWholesalers: 0,
  });

  useEffect(() => {
    fetchLinkage();
  }, []);

  const fetchLinkage = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getRetailerWholesalerLinkage();
      const data = response.data.linkage;
      setRetailers(data.retailers || []);
      setWholesalers(data.wholesalers || []);

      // Calculate stats
      const linked = (data.retailers || []).filter((r: RetailerLinkage) => r.linkedWholesalerId).length;
      setStats({
        totalRetailers: data.retailers?.length || 0,
        linkedRetailers: linked,
        unlinkedRetailers: (data.retailers?.length || 0) - linked,
        totalWholesalers: data.wholesalers?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching linkage:', error);
      message.error('Failed to fetch linkage data');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!selectedRetailer || !selectedWholesaler) {
      message.warning('Please select both retailer and wholesaler');
      return;
    }

    try {
      await adminApi.linkRetailerToWholesaler(selectedRetailer, selectedWholesaler);
      message.success('Retailer linked to wholesaler successfully');
      setLinkModalVisible(false);
      setSelectedRetailer(null);
      setSelectedWholesaler(null);
      fetchLinkage();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to link retailer');
    }
  };

  const handleUnlink = async (retailerId: number) => {
    try {
      await adminApi.unlinkRetailerFromWholesaler(retailerId);
      message.success('Retailer unlinked from wholesaler');
      fetchLinkage();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to unlink retailer');
    }
  };

  const retailerColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Shop Name',
      dataIndex: 'shopName',
      key: 'shopName',
      render: (text: string) => (
        <Space>
          <ShopOutlined style={{ color: '#1890ff' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Linked Wholesaler',
      key: 'linkedWholesaler',
      render: (_: any, record: RetailerLinkage) => (
        record.linkedWholesalerName ? (
          <Space>
            <Badge status="success" />
            <BankOutlined style={{ color: '#722ed1' }} />
            <Text>{record.linkedWholesalerName}</Text>
          </Space>
        ) : (
          <Tag color="orange" icon={<ExclamationCircleOutlined />}>Not Linked</Tag>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: RetailerLinkage) => (
        <Space>
          {record.linkedWholesalerId ? (
            <Popconfirm
              title="Unlink this retailer?"
              description="The retailer will be able to link to a different wholesaler."
              onConfirm={() => handleUnlink(record.id)}
              okText="Unlink"
              cancelText="Cancel"
            >
              <Button type="link" danger icon={<DisconnectOutlined />}>
                Unlink
              </Button>
            </Popconfirm>
          ) : (
            <Button
              type="link"
              icon={<LinkOutlined />}
              onClick={() => {
                setSelectedRetailer(record.id);
                setLinkModalVisible(true);
              }}
            >
              Link to Wholesaler
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const wholesalerColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (text: string) => (
        <Space>
          <BankOutlined style={{ color: '#722ed1' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Linked Retailers',
      dataIndex: 'linkedRetailersCount',
      key: 'linkedRetailersCount',
      render: (count: number, record: WholesalerLinkage) => (
        <Space>
          <Badge count={count} style={{ backgroundColor: count > 0 ? '#52c41a' : '#d9d9d9' }} />
          <Text type="secondary">
            {record.linkedRetailers?.map(r => r.shopName).join(', ') || 'None'}
          </Text>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading linkage data...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <LinkOutlined style={{ marginRight: 12 }} />
          Wholesaler-Retailer Linkage
        </Title>
        <Text type="secondary">
          Manage the one-to-one relationship between wholesalers and retailers
        </Text>
      </div>

      {/* Business Rule Alert */}
      <Alert
        message="Account Linking Rule"
        description={
          <div>
            <p><strong>One Wholesaler → Many Retailers</strong></p>
            <p><strong>One Retailer → ONE Wholesaler ONLY</strong></p>
            <p>Once a retailer is linked to a wholesaler, they can ONLY add stock from that wholesaler. To change the linked wholesaler, the retailer must be unlinked first.</p>
          </div>
        }
        type="info"
        showIcon
        icon={<ExclamationCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Retailers"
              value={stats.totalRetailers}
              prefix={<ShopOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Linked Retailers"
              value={stats.linkedRetailers}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Unlinked Retailers"
              value={stats.unlinkedRetailers}
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Wholesalers"
              value={stats.totalWholesalers}
              prefix={<BankOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Retailers Table */}
      <Card
        title={
          <Space>
            <ShopOutlined />
            <span>Retailers</span>
            <Badge count={retailers.length} style={{ backgroundColor: '#1890ff' }} />
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={retailerColumns}
          dataSource={retailers}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Wholesalers Table */}
      <Card
        title={
          <Space>
            <BankOutlined />
            <span>Wholesalers</span>
            <Badge count={wholesalers.length} style={{ backgroundColor: '#722ed1' }} />
          </Space>
        }
      >
        <Table
          columns={wholesalerColumns}
          dataSource={wholesalers}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Link Modal */}
      <Modal
        title={
          <Space>
            <LinkOutlined />
            <span>Link Retailer to Wholesaler</span>
          </Space>
        }
        open={linkModalVisible}
        onCancel={() => {
          setLinkModalVisible(false);
          setSelectedRetailer(null);
          setSelectedWholesaler(null);
        }}
        onOk={handleLink}
        okText="Link"
      >
        <Alert
          message="This will permanently link the retailer to the selected wholesaler."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 16 }}>
          <Text strong>Retailer:</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select retailer"
            value={selectedRetailer}
            onChange={setSelectedRetailer}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {retailers
              .filter(r => !r.linkedWholesalerId)
              .map(r => (
                <Option key={r.id} value={r.id}>
                  {r.shopName} ({r.phone})
                </Option>
              ))}
          </Select>
        </div>

        <div>
          <Text strong>Wholesaler:</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select wholesaler"
            value={selectedWholesaler}
            onChange={setSelectedWholesaler}
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {wholesalers.map(w => (
              <Option key={w.id} value={w.id}>
                {w.companyName} ({w.linkedRetailersCount} retailers)
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default LinkageManagementPage;
