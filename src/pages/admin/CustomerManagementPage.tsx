import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Typography,
  Row,
  Col,
  Select,
  Statistic,
  Avatar,
  Tooltip,
  Alert,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShoppingOutlined,
  DollarOutlined,
  EyeOutlined,
  StopOutlined,
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  LockOutlined,
  FundViewOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;

interface Customer {
  id: number; // ConsumerProfile ID
  fullName: string | null;
  gasBalance?: string;
  totalSpent?: number;
  orderCount?: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
  };
}

const CustomerManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getCustomers();
      if (response.data?.customers) {
        setCustomers(response.data.customers);
      }
    } catch (error: any) {
      console.error('Failed to load customers:', error);
      message.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      if (editingId) {
        await adminApi.updateCustomer(editingId.toString(), values);
        message.success('Customer updated successfully');
      } else {
        await adminApi.createCustomer(values);
        message.success('Customer created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingId(null);
      loadCustomers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (record: Customer) => {
    const newStatus = !record.user?.isActive;
    try {
      // API expects string status in data object
      await adminApi.updateCustomerStatus(record.user.id.toString(), { 
        status: newStatus ? 'active' : 'inactive' 
      });
      message.success(`Customer ${newStatus ? 'activated' : 'deactivated'} successfully`);
      loadCustomers();
    } catch (error: any) {
      message.error('Failed to update status');
    }
  };

  const filteredCustomers = customers.filter(c => {
    const name = c.fullName || c.user?.name || '';
    const email = c.user?.email || '';
    const phone = c.user?.phone || '';
    const matchesSearch = name.toLowerCase().includes(searchText.toLowerCase()) ||
                         email.toLowerCase().includes(searchText.toLowerCase()) ||
                         phone.includes(searchText);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && c.user?.isActive) ||
                         (statusFilter === 'inactive' && !c.user?.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const handleView = async (record: Customer) => {
    try {
      const response = await adminApi.getCustomer(record.id.toString());
      if (response.data?.success) {
        setSelectedCustomer(response.data.customer);
        setViewModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to load customer details');
    }
  };

  const columns: ColumnsType<Customer> = [
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => (
        <Space>
          <Avatar 
            icon={<UserOutlined />} 
            style={{ backgroundColor: record.user?.isActive ? '#1890ff' : '#ccc' }}
          />
          <div>
            <Text strong style={{ display: 'block' }}>{record.fullName || record.user?.name || 'N/A'}</Text>
            <Tag color="processing" style={{ border: 'none', fontSize: '10px', borderRadius: '4px' }}>
              Registered
            </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div style={{ fontSize: '13px' }}>
          <div><PhoneOutlined style={{ fontSize: '12px', marginRight: '4px', color: '#888' }} />{record.user?.phone || 'N/A'}</div>
          <div style={{ color: '#888' }}><MailOutlined style={{ fontSize: '12px', marginRight: '4px', color: '#888' }} />{record.user?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Orders',
      key: 'orders',
      sorter: (a, b) => (a.orderCount || 0) - (b.orderCount || 0),
      render: (_, record) => (
        <Space>
          <div style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: '4px' }}>
            <ShoppingOutlined style={{ fontSize: '12px', color: '#888' }} />
            <Text style={{ marginLeft: '4px', fontSize: '12px' }}>{record.orderCount || 0} orders</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Total Spent',
      key: 'totalSpent',
      sorter: (a, b) => (a.totalSpent || 0) - (b.totalSpent || 0),
      render: (_, record) => (
        <Text style={{ color: '#52c41a', fontWeight: 500 }}>
          {record.totalSpent?.toLocaleString() || 0} RWF
        </Text>
      ),
    },
    {
      title: 'Gas Balance',
      key: 'gasBalance',
      render: (_, record) => (
        <Text style={{ color: '#722ed1' }}>{record.gasBalance || '0.00 M³'}</Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Text style={{ color: record.user?.isActive ? '#52c41a' : '#f5222d', fontSize: '12px', fontWeight: 600 }}>
          {record.user?.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Real-Time Account Details (READ-ONLY)">
            <Button
              type="primary"
              ghost
              icon={<FundViewOutlined />}
              onClick={() => navigate(`/admin/account-details/${record.id}?type=customer`)}
            >
              Account
            </Button>
          </Tooltip>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            Info
          </Button>
          <Button
            type="text"
            danger={record.user?.isActive}
            style={{ color: record.user?.isActive ? '#f5222d' : '#1890ff' }}
            icon={record.user?.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.user?.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </Space>
      ),
    },
  ];

  const totalOrders = customers.reduce((sum, c) => sum + (c.orderCount || 0), 0);
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  const stats = [
    { title: 'Total Customers', value: customers.length, icon: <TeamOutlined />, color: '#1890ff', border: '#1890ff' },
    { title: 'Active', value: customers.filter(c => c.user?.isActive).length, icon: <CheckCircleOutlined />, color: '#52c41a', border: '#52c41a' },
    { title: 'Registered', value: customers.length, icon: <ClockCircleOutlined />, color: '#595959', border: '#595959' },
    { title: 'Total Orders', value: totalOrders, icon: <ShoppingOutlined />, color: '#722ed1', border: '#722ed1' },
    { title: 'Total Revenue', value: `${totalRevenue.toLocaleString()} RWF`, icon: <DollarOutlined />, color: '#52c41a', border: '#52c41a' }
  ];

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '24px' }}>
      {/* Teal Header Banner */}
      <Card bordered={false} style={{ 
        background: 'linear-gradient(90deg, #26a69a 0%, #00897b 100%)', 
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(38, 166, 154, 0.2)'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="start">
              <TeamOutlined style={{ color: 'white', fontSize: 32, marginTop: 4 }} />
              <div>
                <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 600 }}>Customer Management</Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>View and manage customer accounts and activity</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary"
                icon={<PlusOutlined />} 
                onClick={() => {
                  setEditingId(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
                style={{ borderRadius: '8px', height: '40px', background: '#fff', color: '#26a69a', borderColor: '#26a69a' }}
              >
                Add Customer
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadCustomers}
                loading={loading}
                style={{ borderRadius: '8px', height: '40px' }}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        {stats.map((s, i) => (
          <Col key={i} flex={1}>
            <Card bordered={false} style={{ borderRadius: '12px', borderTop: `4px solid ${s.border}` }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text type="secondary" style={{ fontSize: '13px', marginBottom: '8px' }}>{s.title}</Text>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold' }}>{s.value}</Text>
                  <span style={{ fontSize: '24px', color: s.color, opacity: 0.8 }}>{s.icon}</span>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Toolbar Search Bar */}
      <Card bordered={false} style={{ borderRadius: '12px', marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col flex="auto">
            <Input
              placeholder="Search by name, email, or phon..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              style={{ borderRadius: '8px', height: '40px', background: '#f5f7fa', border: 'none' }}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </Col>
          <Col flex="200px">
            <Select 
              value={statusFilter} 
              style={{ width: '100%', height: '40px' }}
              onChange={setStatusFilter}
              className="custom-select"
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Main Table Card */}
      <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          className="customer-table"
        />
      </Card>

      {/* Professional Customer Creation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserOutlined /> {editingId ? 'Edit Customer Profile' : 'Create Customer Account'}
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingId(null);
        }}
        footer={null}
        width={650}
        style={{ top: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          requiredMark="optional"
          style={{ paddingTop: 10 }}
        >
          {!editingId && (
             <Alert
               message="Customer will receive login credentials via SMS/Email"
               type="info"
               showIcon
               style={{ marginBottom: 24, borderRadius: '8px' }}
             />
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="first_name"
                label={<Text strong>First Name <Text type="danger">*</Text></Text>}
                rules={[{ required: true, message: 'Please enter first name' }]}
              >
                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="John" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="last_name"
                label={<Text strong>Last Name</Text>}
              >
                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Doe" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={<Text strong>Phone Number <Text type="danger">*</Text></Text>}
                rules={[{ required: true, message: 'Phone number required' }]}
              >
                <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="+250788100001" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label={<Text strong>Email Address</Text>}
                rules={[{ type: 'email', message: 'Please enter valid email' }]}
              >
                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="customer@example.com" size="large" />
              </Form.Item>
            </Col>
          </Row>

          {!editingId && (
            <>
              <Divider style={{ margin: '16px 0' }}>Security Credentials</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="password"
                    label={<Text strong>Initial Password <Text type="danger">*</Text></Text>}
                    rules={[{ required: true, min: 6, message: 'Minimum 6 characters' }]}
                  >
                    <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Temporary password" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="pin"
                    label={<Text strong>PIN (Optional)</Text>}
                  >
                    <Input prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="4-digit PIN" maxLength={4} size="large" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Divider style={{ margin: '24px 0 16px' }} />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space size="middle">
              <Button onClick={() => setModalVisible(false)} size="large" style={{ borderRadius: '6px', minWidth: 100 }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading} size="large" style={{ borderRadius: '6px', background: '#26a69a', minWidth: 150 }}>
                {editingId ? 'Update Profile' : 'Create Account'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<span className="text-base font-bold">Customer Details</span>}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={650}
        centered
      >
        {selectedCustomer && (
          <div className="py-2">
            <Row gutter={[12, 12]}>
              {/* Basic Info */}
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Customer ID</Text><br/>
                <Text strong>{selectedCustomer.id}</Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Status</Text><br/>
                <Tag color={selectedCustomer.user?.isActive ? 'green' : 'red'}>
                  {selectedCustomer.user?.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </Col>

              <Col span={24}>
                <div className="bg-gray-50 p-3 rounded-lg mt-1">
                  <Text strong className="text-sm">Personal Information</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Full Name</Text><br/>
                <Text>{selectedCustomer.fullName || selectedCustomer.user?.name || 'N/A'}</Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Phone</Text><br/>
                <Text>{selectedCustomer.user?.phone}</Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Email</Text><br/>
                <Text>{selectedCustomer.user?.email || 'N/A'}</Text>
              </Col>

              {/* Wallet Info */}
              <Col span={24}>
                <div className="bg-blue-50 p-3 rounded-lg mt-2">
                  <Text strong className="text-sm">Wallet Information</Text>
                </div>
              </Col>
              {selectedCustomer.wallets && selectedCustomer.wallets.length > 0 ? (
                selectedCustomer.wallets.map((wallet: any, idx: number) => (
                  <Col xs={24} sm={12} key={idx}>
                    <Card size="small" className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                      <Text type="secondary" className="text-xs">{wallet.type === 'dashboard_wallet' ? 'Dashboard' : 'Credit'} Wallet</Text><br/>
                      <Text strong className="text-lg">{wallet.balance?.toLocaleString() || 0} RWF</Text>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col span={24}>
                  <Text type="secondary" className="text-xs">No wallets found</Text>
                </Col>
              )}

              {/* NFC Cards */}
              <Col span={24}>
                <div className="bg-purple-50 p-3 rounded-lg mt-2">
                  <Text strong className="text-sm">NFC Cards ({selectedCustomer.nfcCards?.length || 0})</Text>
                </div>
              </Col>
              {selectedCustomer.nfcCards && selectedCustomer.nfcCards.length > 0 ? (
                selectedCustomer.nfcCards.map((card: any, idx: number) => (
                  <Col xs={24} sm={12} key={idx}>
                    <Card size="small" className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Text type="secondary" className="text-xs">Card: {card.uid}</Text>
                        <Text strong className="text-base">{card.balance?.toLocaleString() || 0} RWF</Text>
                        <Tag color={card.status === 'active' ? 'green' : 'orange'} className="text-xs">
                          {card.status?.toUpperCase()}
                        </Tag>
                      </Space>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col span={24}>
                  <Text type="secondary" className="text-xs">No NFC cards assigned</Text>
                </Col>
              )}

              {/* Gas Meters */}
              <Col span={24}>
                <div className="bg-orange-50 p-3 rounded-lg mt-2">
                  <Text strong className="text-sm">Gas Meters ({selectedCustomer.gasMeters?.length || 0})</Text>
                </div>
              </Col>
              {selectedCustomer.gasMeters && selectedCustomer.gasMeters.length > 0 ? (
                selectedCustomer.gasMeters.map((meter: any, idx: number) => (
                  <Col xs={24} sm={12} key={idx}>
                    <Card size="small" className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text strong className="text-base">{meter.aliasName || 'No Nickname'}</Text>
                          <Tag color="orange" className="text-xs">
                            {meter.meterNumber}
                          </Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          <UserOutlined style={{ marginRight: 4 }} />
                          Owner: {meter.ownerName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          <PhoneOutlined style={{ marginRight: 4 }} />
                          Phone: {meter.ownerPhone}
                        </Text>
                      </Space>
                    </Card>
                  </Col>
                ))
              ) : (
                <Col span={24}>
                  <Text type="secondary" className="text-xs">No gas meters registered</Text>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      <style>{`
        .customer-table .ant-table-thead > tr > th {
          background: white;
          color: #8c8c8c;
          font-weight: 500;
          border-bottom: 1px solid #f0f0f0;
        }
        .custom-select .ant-select-selector {
          background: #f5f7fa !important;
          border: none !important;
          border-radius: 8px !important;
        }
      `}</style>
    </div>
  );
};

export default CustomerManagementPage;
