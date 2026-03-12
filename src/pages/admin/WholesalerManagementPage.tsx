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
  Tooltip,
  Alert,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
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

interface Wholesaler {
  id: number;
  business_name: string;
  contact_person: string;
  phone: string;
  email: string;
  location: string;
  status: 'active' | 'suspended' | 'pending' | 'inactive';
  created_at: string;
}

const WholesalerManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedWholesaler, setSelectedWholesaler] = useState<any>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadWholesalers();
  }, [statusFilter]);

  const loadWholesalers = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getWholesalers();
      if (response.data?.success) {
        const mappedWholesalers = response.data.wholesalers.map((w: any) => ({
          id: w.id,
          business_name: w.companyName,
          contact_person: w.user?.name || 'N/A',
          email: w.user?.email,
          phone: w.user?.phone,
          location: w.address,
          status: w.user?.isActive ? 'active' : 'inactive',
          created_at: w.createdAt
        }));

        setWholesalers(mappedWholesalers);
      }
    } catch (error: any) {
      console.error('Failed to load wholesalers:', error);
      message.error('Failed to load wholesalers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      if (editingId) {
        await adminApi.updateWholesaler(editingId.toString(), {
          company_name: values.business_name,
          email: values.email,
          phone: values.phone,
          address: values.location,
        });
        message.success('Wholesaler profile updated successfully');
      } else {
        await adminApi.createWholesaler({
          company_name: values.business_name,
          email: values.email,
          phone: values.phone,
          password: values.password,
          address: values.location,
        });
        message.success('Wholesaler account created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingId(null);
      loadWholesalers();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save wholesaler');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Wholesaler) => {
    setEditingId(record.id);
    form.setFieldsValue({
      business_name: record.business_name,
      email: record.email,
      phone: record.phone,
      location: record.location,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: number, name: string) => {
    Modal.confirm({
      title: 'Delete Wholesaler Account',
      content: `Are you sure you want to delete the account for ${name}? This will remove their access to the system.`,
      okText: 'Delete Account',
      okType: 'danger',
      onOk: async () => {
        try {
          await adminApi.deleteWholesaler(id.toString());
          message.success('Wholesaler deleted successfully');
          loadWholesalers();
        } catch (error: any) {
          message.error('Failed to delete wholesaler');
        }
      },
    });
  };

  const handleStatusChange = async (record: Wholesaler) => {
    const newStatus = record.status === 'active' ? false : true;
    try {
      await adminApi.updateWholesalerStatus(record.id.toString(), newStatus);
      message.success(`Account ${newStatus ? 'activated' : 'deactivated'} successfully`);
      loadWholesalers();
    } catch (error: any) {
      message.error('Failed to update status');
    }
  };

  const handleView = async (record: Wholesaler) => {
    try {
      const response = await adminApi.getWholesaler(record.id.toString());
      if (response.data?.success) {
        setSelectedWholesaler(response.data.wholesaler);
        setViewModalVisible(true);
      }
    } catch (error) {
      // If detailed API fails, use table data
      setSelectedWholesaler(record);
      setViewModalVisible(true);
    }
  };

  const filteredWholesalers = wholesalers.filter(w => {
    const matchesSearch = !searchText || (
      w.business_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      w.contact_person?.toLowerCase().includes(searchText.toLowerCase()) ||
      w.phone?.includes(searchText) ||
      w.email?.toLowerCase().includes(searchText.toLowerCase())
    );
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<Wholesaler> = [
    {
      title: 'COMPANY NAME',
      key: 'business_name',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: '#1890ff' }}>{record.business_name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>ID: {record.id}</Text>
        </Space>
      ),
    },
    {
      title: 'CONTACT PERSON',
      dataIndex: 'contact_person',
      key: 'contact_person',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'CONTACT INFO',
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
              onClick={() => navigate(`/admin/account-details/${record.id}?type=wholesaler`)}
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
            onClick={() => handleDelete(record.id, record.business_name)}
          />
        </Space>
      ),
    },
  ];

  const stats = [
    { title: 'Total Wholesalers', value: wholesalers.length, color: '#1890ff' },
    { title: 'Active Accounts', value: wholesalers.filter(w => w.status === 'active').length, color: '#52c41a' },
    { title: 'Pending Approval', value: wholesalers.filter(w => w.status === 'pending').length, color: '#faad14' },
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
            <Title level={2} style={{ color: 'white', margin: 0 }}>Wholesaler Management</Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Manage and monitor all distribution partners and wholesalers</Text>
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
              CREATE NEW WHOLESALER
            </Button>
          </Col>
        </Row>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        {/* Stats Row */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {stats.map((stat, index) => (
            <Col span={8} key={index}>
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
              placeholder="Search by company name or email..."
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
              </Select>
              <Button icon={<ReloadOutlined />} onClick={loadWholesalers}>Refresh</Button>
            </Space>
          </div>
          <Table
            columns={columns}
            dataSource={filteredWholesalers}
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
            <BankOutlined /> {editingId ? 'Edit Wholesaler Profile' : 'Create Wholesaler Account'}
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
               message="An activation email will be sent to the wholesaler."
               type="info"
               showIcon
               style={{ marginBottom: 24, borderRadius: '8px' }}
             />
          )}

          <Form.Item
            name="business_name"
            label={<Text strong>Company Name <Text type="danger">*</Text></Text>}
            rules={[{ required: true, message: 'Please enter company name' }]}
          >
            <Input prefix={<BankOutlined style={{ color: '#bfbfbf' }} />} placeholder="e.g., BIG Company Rwanda Ltd" size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label={<Text strong>Email <Text type="danger">*</Text></Text>}
                rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
              >
                <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="wholesaler@example.com" size="large" />
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

      {/* Wholesaler Details Modal */}
      <Modal
        title={<span className="text-lg font-bold">Wholesaler Details</span>}
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedWholesaler(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewModalVisible(false);
            setSelectedWholesaler(null);
          }}>
            Close
          </Button>
        ]}
        width={800}
        centered
      >
        {selectedWholesaler && (
          <div className="py-4">
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Wholesaler ID</Text><br/>
                <Text strong className="text-base">{selectedWholesaler.id}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Status</Text><br/>
                <Tag color={selectedWholesaler.status === 'active' ? 'green' : 'red'}>
                  {selectedWholesaler.status?.toUpperCase()}
                </Tag>
              </Col>

              <Col span={24}>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Text strong className="text-sm">Company Information</Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Company Name</Text><br/>
                <Text strong>{selectedWholesaler.business_name || selectedWholesaler.companyName}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Contact Person</Text><br/>
                <Text>{selectedWholesaler.contact_person || selectedWholesaler.user?.name || 'N/A'}</Text>
              </Col>

              <Col span={24}>
                <div className="bg-gray-50 p-4 rounded-lg mt-2">
                  <Text strong className="text-sm">Contact Information</Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Phone</Text><br/>
                <Text>{selectedWholesaler.phone || selectedWholesaler.user?.phone}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Email</Text><br/>
                <Text>{selectedWholesaler.email || selectedWholesaler.user?.email}</Text>
              </Col>
              <Col span={24}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Business Address</Text><br/>
                <Text>{selectedWholesaler.location || selectedWholesaler.address || 'N/A'}</Text>
              </Col>

              <Col span={24}>
                <div className="bg-gray-50 p-4 rounded-lg mt-2">
                  <Text strong className="text-sm">Account Information</Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Created At</Text><br/>
                <Text>{selectedWholesaler.created_at ? new Date(selectedWholesaler.created_at).toLocaleString() : selectedWholesaler.createdAt ? new Date(selectedWholesaler.createdAt).toLocaleString() : 'N/A'}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Account Status</Text><br/>
                <Tag color={selectedWholesaler.user?.isActive ? 'green' : 'red'}>
                  {selectedWholesaler.user?.isActive ? 'Active' : 'Inactive'}
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

export default WholesalerManagementPage;
