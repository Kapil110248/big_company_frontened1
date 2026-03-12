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
  InputNumber,
  Tooltip,
  Alert,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShopOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  EyeOutlined,
  FundViewOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Retailer {
  id: number;
  store_name: string;
  owner_name: string;
  phone: string;
  email: string;
  location: string;
  status: 'active' | 'suspended' | 'pending' | 'inactive';
  credit_limit: number;
  current_balance: number;
  created_at: string;
}

const RetailerManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedRetailer, setSelectedRetailer] = useState<any>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadRetailers();
  }, [statusFilter]);

  const loadRetailers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getRetailers();
      if (response.data?.success) {
        const mappedRetailers = response.data.retailers.map((r: any) => ({
          id: r.id,
          store_name: r.shopName,
          owner_name: r.user?.name || 'N/A',
          email: r.user?.email,
          phone: r.user?.phone,
          location: r.address,
          credit_limit: r.creditLimit,
          current_balance: 0,
          status: r.user?.isActive ? 'active' : 'inactive',
          created_at: r.createdAt
        }));

        setRetailers(mappedRetailers);
      }
    } catch (error: any) {
      console.error('Failed to load retailers:', error);
      message.error('Failed to load retailers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      if (editingId) {
        await adminApi.updateRetailer(editingId.toString(), {
          business_name: values.store_name,
          email: values.email,
          phone: values.phone,
          address: values.location,
          credit_limit: values.credit_limit,
          status: values.status || 'active'
        });
        message.success('Retailer updated successfully');
      } else {
        await adminApi.createRetailer({
          business_name: values.store_name,
          email: values.email,
          phone: values.phone,
          password: values.password,
          address: values.location,
          credit_limit: values.credit_limit,
        });
        message.success('Retailer account created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingId(null);
      loadRetailers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save retailer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Retailer) => {
    setEditingId(record.id);
    form.setFieldsValue({
      store_name: record.store_name,
      email: record.email,
      phone: record.phone,
      location: record.location,
      credit_limit: record.credit_limit,
      status: record.status
    });
    setModalVisible(true);
  };

  const handleDelete = (id: number, name: string) => {
    Modal.confirm({
      title: 'Delete Retailer Account',
      content: `Are you sure you want to permanently delete the account for ${name}? This action cannot be undone.`,
      okText: 'Delete Account',
      okType: 'danger',
      onOk: async () => {
        try {
          await adminApi.deleteRetailer(id.toString());
          message.success('Retailer deleted successfully');
          loadRetailers();
        } catch (error: any) {
          message.error('Failed to delete retailer');
        }
      },
    });
  };

  const handleStatusChange = async (record: Retailer) => {
    const newStatus = record.status === 'active' ? false : true;
    try {
      await adminApi.updateRetailerStatus(record.id.toString(), newStatus);
      message.success(`Account ${newStatus ? 'activated' : 'deactivated'} successfully`);
      loadRetailers();
    } catch (error: any) {
      message.error('Failed to update status');
    }
  };

  const handleView = async (record: Retailer) => {
    try {
      const response = await adminApi.getRetailer(record.id.toString());
      if (response.data?.success) {
        setSelectedRetailer(response.data.retailer);
        setViewModalVisible(true);
      }
    } catch (error) {
      // If detailed API fails, use table data
      setSelectedRetailer(record);
      setViewModalVisible(true);
    }
  };

  const filteredRetailers = retailers.filter(r => {
    const matchesSearch = !searchText || (
      r.store_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      r.owner_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      r.phone?.includes(searchText) ||
      r.email?.toLowerCase().includes(searchText.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<Retailer> = [
    {
      title: 'BUSINESS NAME',
      key: 'store_name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#1890ff' }}>{record.store_name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>ID: {record.id}</Text>
        </Space>
      ),
    },
    {
      title: 'CONTACT DETAILS',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space><PhoneOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} /> <Text style={{ fontSize: '13px' }}>{record.phone}</Text></Space>
          <Space><MailOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} /> <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text></Space>
        </Space>
      ),
    },
    {
      title: 'LOCATION',
      dataIndex: 'location',
      key: 'location',
      render: (text) => text || 'N/A'
    },
    {
      title: 'CREDIT LIMIT',
      dataIndex: 'credit_limit',
      key: 'credit_limit',
      render: (val) => <Text strong>{(val || 0).toLocaleString()} RWF</Text>,
    },
    {
      title: 'STATUS',
      key: 'status',
      render: (_, record) => {
        const isActive = record.status === 'active';
        return (
          <Tag color={isActive ? 'success' : 'error'} style={{ borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
            {isActive ? 'Active' : 'Deactivated'}
          </Tag>
        );
      },
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Real-Time Account (READ-ONLY)">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<FundViewOutlined />}
              onClick={() => navigate(`/admin/account-details/${record.id}?type=retailer`)}
            >
              Account
            </Button>
          </Tooltip>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Edit Profile">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: '#1890ff' }} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.status === 'active' ? "Deactivate" : "Activate"}>
            <Button
              type="text"
              icon={record.status === 'active' ? <StopOutlined style={{ color: '#ff4d4f' }} /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
              onClick={() => handleStatusChange(record)}
            />
          </Tooltip>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, record.store_name)}
          />
        </Space>
      ),
    },
  ];

  const stats = [
    { title: 'Total Retailers', value: retailers.length, color: '#1890ff' },
    { title: 'Active Accounts', value: retailers.filter(r => r.status === 'active').length, color: '#52c41a' },
    { title: 'Pending Verification', value: retailers.filter(r => r.status === 'pending').length, color: '#faad14' },
    { title: 'Total Credit Limit', value: `${retailers.reduce((acc, curr) => acc + (curr.credit_limit || 0), 0).toLocaleString()} RWF`, color: '#722ed1' },
  ];

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      {/* Blue Header Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', 
        padding: '32px 24px', 
        color: 'white',
        marginBottom: '24px'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: 'white', margin: 0 }}>Retailer Management</Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Manage and monitor all registered retailer accounts in the system</Text>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              size="large"
              style={{ background: 'white', color: '#1890ff', border: 'none', fontWeight: 600 }}
              onClick={() => {
                setEditingId(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              CREATE NEW RETAILER
            </Button>
          </Col>
        </Row>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        {/* Stats Row */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {stats.map((stat, index) => (
            <Col span={6} key={index}>
              <Card bordered={false} bodyStyle={{ padding: '20px' }} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Text type="secondary" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.title}</Text>
                <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color, marginTop: '8px' }}>{stat.value}</div>
              </Card>
            </Col>
          ))}
        </Row>

        <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Search by store name, owner, or contact..."
              style={{ width: 400, borderRadius: '6px' }}
              size="large"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            <Space>
              <Text strong>Filter by:</Text>
              <Select defaultValue="all" style={{ width: 140 }} onChange={setStatusFilter}>
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="pending">Pending</Option>
              </Select>
              <Button icon={<ReloadOutlined />} onClick={loadRetailers}>Refresh</Button>
            </Space>
          </div>
          <Table
            columns={columns}
            dataSource={filteredRetailers}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            style={{ borderRadius: '8px' }}
          />
        </Card>
      </div>

      {/* Modern Creation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShopOutlined /> {editingId ? 'Edit Retailer Profile' : 'Create Retailer Account'}
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
               message="An activation email will be sent to the retailer."
               type="info"
               showIcon
               style={{ marginBottom: 24, borderRadius: '8px' }}
             />
          )}

          <Form.Item
            name="store_name"
            label={<Text strong>Business Name <Text type="danger">*</Text></Text>}
            rules={[{ required: true, message: 'Please enter business name' }]}
          >
            <Input prefix={<ShopOutlined style={{ color: '#bfbfbf' }} />} placeholder="e.g., Kigali Shop Ltd" size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label={<Text strong>Email <Text type="danger">*</Text></Text>}
                rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
              >
                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="retailer@example.com" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={<Text strong>Phone <Text type="danger">*</Text></Text>}
                rules={[{ required: true, message: 'Phone number required' }]}
              >
                <Input prefix={<PhoneOutlined style={{ color: '#bfbfbf' }} />} placeholder="+250788123456" size="large" />
              </Form.Item>
            </Col>
          </Row>

          {!editingId && (
            <Form.Item
              name="password"
              label={<Text strong>Initial Password <Text type="danger">*</Text></Text>}
              rules={[{ required: true, min: 8, message: 'Minimum 8 characters' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Temporary password" size="large" />
            </Form.Item>
          )}

          <Form.Item
            name="location"
            label={<Text strong>Business Address</Text>}
          >
            <TextArea rows={3} placeholder="Street, District, City" style={{ borderRadius: '8px' }} />
          </Form.Item>

          <Form.Item
            name="credit_limit"
            label={<Text strong>Initial Credit Limit (RWF)</Text>}
            initialValue={0}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              size="large"
              placeholder="0"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
              parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as unknown as number} 
            />
          </Form.Item>

          <Divider style={{ margin: '24px 0 16px' }} />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space size="middle">
              <Button onClick={() => setModalVisible(false)} size="large" style={{ borderRadius: '6px', minWidth: 100 }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading} size="large" style={{ borderRadius: '6px', background: '#1890ff', minWidth: 150 }}>
                {editingId ? 'Update Profile' : 'Create Account'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Retailer Details Modal */}
      <Modal
        title={<span className="text-lg font-bold">Retailer Details</span>}
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedRetailer(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewModalVisible(false);
            setSelectedRetailer(null);
          }}>
            Close
          </Button>
        ]}
        width={800}
        centered
      >
        {selectedRetailer && (
          <div className="py-4">
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Retailer ID</Text><br/>
                <Text strong className="text-base">{selectedRetailer.id}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Status</Text><br/>
                <Tag color={selectedRetailer.status === 'active' ? 'green' : 'red'}>
                  {selectedRetailer.status?.toUpperCase()}
                </Tag>
              </Col>

              <Col span={24}>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Text strong className="text-sm">Business Information</Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Business Name</Text><br/>
                <Text strong>{selectedRetailer.store_name || selectedRetailer.shopName}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Owner Name</Text><br/>
                <Text>{selectedRetailer.owner_name || selectedRetailer.user?.name || 'N/A'}</Text>
              </Col>

              <Col span={24}>
                <div className="bg-gray-50 p-4 rounded-lg mt-2">
                  <Text strong className="text-sm">Contact Information</Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Phone</Text><br/>
                <Text>{selectedRetailer.phone || selectedRetailer.user?.phone}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Email</Text><br/>
                <Text>{selectedRetailer.email || selectedRetailer.user?.email}</Text>
              </Col>
              <Col span={24}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Business Address</Text><br/>
                <Text>{selectedRetailer.location || selectedRetailer.address || 'N/A'}</Text>
              </Col>

              <Col span={24}>
                <div className="bg-gray-50 p-4 rounded-lg mt-2">
                  <Text strong className="text-sm">Financial Information</Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Credit Limit</Text><br/>
                <Text strong className="text-lg text-blue-600">{(selectedRetailer.credit_limit || selectedRetailer.creditLimit || 0).toLocaleString()} RWF</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Current Balance</Text><br/>
                <Text strong className="text-lg">{(selectedRetailer.current_balance || 0).toLocaleString()} RWF</Text>
              </Col>

              <Col span={24}>
                <div className="bg-gray-50 p-4 rounded-lg mt-2">
                  <Text strong className="text-sm">Account Information</Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Created At</Text><br/>
                <Text>{selectedRetailer.created_at ? new Date(selectedRetailer.created_at).toLocaleString() : selectedRetailer.createdAt ? new Date(selectedRetailer.createdAt).toLocaleString() : 'N/A'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Account Status</Text><br/>
                <Tag color={selectedRetailer.user?.isActive ? 'green' : 'red'}>
                  {selectedRetailer.user?.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      <style>{`
        .ant-table-thead > tr > th {
          background: #fafafa;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.5px;
          color: #8c8c8c;
        }
        .ant-card {
          border-radius: 8px;
        }
        .ant-btn-primary {
          box-shadow: 0 2px 0 rgba(24, 144, 255, 0.1);
        }
      `}</style>
    </div>
  );
};

export default RetailerManagementPage;
