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
  Tabs,
  Select,
  Divider,
  Alert,
  InputNumber,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  ShopOutlined,
  BankOutlined,
  MailOutlined,
  PhoneOutlined,
  LockOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  ClockCircleTwoTone,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Types
interface RetailerAccount {
  id: string;
  email: string;
  business_name: string;
  phone: string;
  address?: string;
  credit_limit: number;
  orders: number;
  revenue: number;
  status: 'pending' | 'active' | 'inactive' | 'blocked';
  verified: boolean;
  created_at: string;
}

interface WholesalerAccount {
  id: string;
  email: string;
  company_name: string;
  phone: string;
  address?: string;
  orders: number;
  revenue: number;
  status: 'pending' | 'active' | 'inactive' | 'blocked';
  verified: boolean;
  created_at: string;
}

interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  walletBalance: number;
  rewardsPoints: number;
  status: 'active' | 'inactive';
  isVerified: boolean;
  created_at: string;
}

const AccountManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [retailers, setRetailers] = useState<RetailerAccount[]>([]);
  const [wholesalers, setWholesalers] = useState<WholesalerAccount[]>([]);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [createRetailerModalVisible, setCreateRetailerModalVisible] = useState(false);
  const [createWholesalerModalVisible, setCreateWholesalerModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('customers');
  const [searchText, setSearchText] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);

  const [retailerForm] = Form.useForm();
  const [wholesalerForm] = Form.useForm();

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const [retailersRes, wholesalersRes, customersRes] = await Promise.all([
        adminApi.getRetailers(),
        adminApi.getWholesalers(),
        adminApi.getCustomers(),
      ]);

      if (retailersRes.data?.retailers) {
        const mappedRetailers = retailersRes.data.retailers.map((r: any) => ({
          id: r.id,
          business_name: r.shopName,
          email: r.user?.email,
          phone: r.user?.phone,
          address: r.address,
          credit_limit: r.creditLimit,
          orders: 0,
          revenue: 0,
          status: r.user?.isActive ? 'active' : 'inactive',
          verified: r.isVerified,
          created_at: r.user?.createdAt || r.createdAt
        }));
        setRetailers(mappedRetailers);
      }
      if (wholesalersRes.data?.wholesalers) {
        const mappedWholesalers = wholesalersRes.data.wholesalers.map((w: any) => ({
          id: w.id,
          company_name: w.companyName,
          email: w.user?.email,
          phone: w.user?.phone,
          address: w.address,
          orders: 0,
          revenue: 0,
          status: w.user?.isActive ? 'active' : 'inactive',
          verified: w.isVerified,
          created_at: w.user?.createdAt || w.createdAt
        }));
        setWholesalers(mappedWholesalers);
      }
      if (customersRes.data?.customers) {
        const mappedCustomers = customersRes.data.customers.map((c: any) => ({
          id: c.id,
          name: c.user?.name || c.fullName || 'N/A',
          email: c.user?.email,
          phone: c.user?.phone,
          address: c.address,
          walletBalance: c.walletBalance || 0,
          rewardsPoints: c.rewardsPoints || 0,
          status: c.user?.isActive ? 'active' : 'inactive',
          isVerified: c.isVerified,
          created_at: c.user?.createdAt || c.createdAt
        }));
        setCustomers(mappedCustomers);
      }
    } catch (error: any) {
      console.error('Failed to load accounts:', error);
      message.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRetailer = async (values: any) => {
    try {
      setLoading(true);
      if (editingId) {
        await adminApi.updateRetailer(editingId, {
          ...values,
          credit_limit: values.credit_limit || 0,
        });
        message.success('Retailer account updated successfully');
      } else {
        await adminApi.createRetailer({
          ...values,
          credit_limit: values.credit_limit || 0,
        });
        message.success('Retailer account created successfully!');
      }

      setCreateRetailerModalVisible(false);
      setEditingId(null);
      retailerForm.resetFields();
      loadAccounts();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save retailer account');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWholesaler = async (values: any) => {
    try {
      setLoading(true);
      if (editingId) {
        await adminApi.updateWholesaler(editingId, values);
        message.success('Wholesaler account updated successfully');
      } else {
        await adminApi.createWholesaler(values);
        message.success('Wholesaler account created successfully!');
      }

      setCreateWholesalerModalVisible(false);
      setEditingId(null);
      wholesalerForm.resetFields();
      loadAccounts();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save wholesaler account');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRetailer = (record: RetailerAccount) => {
    setEditingId(record.id);
    retailerForm.setFieldsValue(record);
    setCreateRetailerModalVisible(true);
  };

  const handleDeleteRetailer = (id: string) => {
    Modal.confirm({
      title: 'Delete Retailer',
      content: 'Are you sure you want to delete this retailer? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await adminApi.deleteRetailer(id);
          message.success('Retailer deleted successfully');
          loadAccounts();
        } catch (error: any) {
          message.error('Failed to delete retailer');
        }
      }
    });
  };

  const handleEditWholesaler = (record: WholesalerAccount) => {
    setEditingId(record.id);
    wholesalerForm.setFieldsValue(record);
    setCreateWholesalerModalVisible(true);
  };

  const handleDeleteWholesaler = (id: string) => {
    Modal.confirm({
      title: 'Delete Wholesaler',
      content: 'Are you sure you want to delete this wholesaler?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await adminApi.deleteWholesaler(id);
          message.success('Wholesaler deleted successfully');
          loadAccounts();
        } catch (error: any) {
          message.error('Failed to delete wholesaler');
        }
      }
    });
  };

  const handleToggleStatus = async (id: string, type: 'retailer' | 'wholesaler', currentStatus: string) => {
    const isActive = currentStatus !== 'active';
    Modal.confirm({
      title: `${isActive ? 'Activate' : 'Deactivate'} Account`,
      content: `Are you sure you want to ${isActive ? 'activate' : 'deactivate'} this ${type} account?`,
      okText: 'Confirm',
      onOk: async () => {
        try {
          if (type === 'retailer') {
            await adminApi.updateRetailerStatus(id, isActive);
          } else {
            await adminApi.updateWholesalerStatus(id, isActive);
          }
          message.success(`Account ${isActive ? 'activated' : 'deactivated'} successfully`);
          loadAccounts();
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Failed to update account status');
        }
      },
    });
  };

  const handleVerifyAccount = async (id: string, type: 'retailer' | 'wholesaler') => {
    Modal.confirm({
      title: 'Verify Account',
      content: `Are you sure you want to verify this ${type} account?`,
      okText: 'Verify',
      onOk: async () => {
        try {
          if (type === 'retailer') {
            await adminApi.verifyRetailer(id);
          } else {
            await adminApi.verifyWholesaler(id);
          }
          message.success('Account verified successfully');
          loadAccounts();
        } catch (error: any) {
          message.error(error.response?.data?.message || 'Failed to verify account');
        }
      },
    });
  };

  const retailerColumns: ColumnsType<RetailerAccount> = [
    {
      title: 'Business',
      dataIndex: 'business_name',
      key: 'business_name',
      render: (text) => (
        <span className="font-semibold text-gray-800">{text}</span>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="text-gray-600 text-sm">{record.email}</span>
          <span className="text-gray-400 text-xs">{record.phone}</span>
        </div>
      ),
    },
    {
      title: 'Credit',
      dataIndex: 'credit_limit',
      key: 'credit_limit',
      render: (value) => <span className="font-medium text-gray-700">{value?.toLocaleString() || 0} RWF</span>,
    },
    {
      title: 'Orders',
      dataIndex: 'orders',
      key: 'orders',
      render: (val) => <span className="text-gray-600">{val || 0}</span>
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val) => <span className="text-gray-600">{val || 0} RWF</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag className="rounded-full px-3" color={
          status === 'active' ? 'green' :
            status === 'pending' ? 'orange' :
              status === 'blocked' ? 'red' : 'default'
        }>
          {status?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            className="text-purple-600"
            onClick={() => navigate(`/admin/account-details/${record.id}?type=retailer`)}
          >
            View
          </Button>
          <Button type="link" size="small" className="text-blue-600" onClick={() => handleEditRetailer(record)}>Edit</Button>
          <Button type="link" danger size="small" onClick={() => handleDeleteRetailer(record.id)}>Delete</Button>
          {!record.verified && (
            <Button
              type="link"
              size="small"
              className="text-orange-500"
              onClick={() => handleVerifyAccount(record.id, 'retailer')}
            >
              Verify
            </Button>
          )}
          <Button
            type="link"
            size="small"
            className={record.status === 'active' ? 'text-red-500' : 'text-green-500'}
            onClick={() => handleToggleStatus(record.id, 'retailer', record.status)}
          >
            {record.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </Space>
      ),
    },
  ];

  const wholesalerColumns: ColumnsType<WholesalerAccount> = [
    {
      title: 'Business',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text) => (
        <span className="font-semibold text-gray-800">{text}</span>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="text-gray-600 text-sm">{record.email}</span>
          <span className="text-gray-400 text-xs">{record.phone}</span>
        </div>
      ),
    },
    {
      title: 'Orders',
      dataIndex: 'orders',
      key: 'orders',
      render: (val) => <span className="text-gray-600">{val || 0}</span>
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (val) => <span className="text-gray-600">{val || 0} RWF</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag className="rounded-full px-3" color={
          status === 'active' ? 'green' :
            status === 'pending' ? 'orange' :
              status === 'blocked' ? 'red' : 'default'
        }>
          {status?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            className="text-purple-600"
            onClick={() => navigate(`/admin/account-details/${record.id}?type=wholesaler`)}
          >
            View
          </Button>
          <Button type="link" size="small" className="text-blue-600" onClick={() => handleEditWholesaler(record)}>Edit</Button>
          <Button type="link" danger size="small" onClick={() => handleDeleteWholesaler(record.id)}>Delete</Button>
          {!record.verified && (
            <Button
              type="link"
              size="small"
              className="text-orange-500"
              onClick={() => handleVerifyAccount(record.id, 'wholesaler')}
            >
              Verify
            </Button>
          )}
          <Button
            type="link"
            size="small"
            className={record.status === 'active' ? 'text-red-500' : 'text-green-500'}
            onClick={() => handleToggleStatus(record.id, 'wholesaler', record.status)}
          >
            {record.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </Space>
      ),
    },
  ];

  // Customer columns
  const customerColumns: ColumnsType<CustomerAccount> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <span className="font-semibold text-gray-800">{text || 'N/A'}</span>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="text-gray-600 text-sm">{record.email || 'N/A'}</span>
          <span className="text-gray-400 text-xs">{record.phone || 'N/A'}</span>
        </div>
      ),
    },
    {
      title: 'Wallet Balance',
      dataIndex: 'walletBalance',
      key: 'walletBalance',
      render: (value) => <span className="font-medium text-green-600">{(value || 0).toLocaleString()} RWF</span>,
    },
    {
      title: 'Rewards',
      dataIndex: 'rewardsPoints',
      key: 'rewardsPoints',
      render: (value) => <span className="text-orange-500">{(value || 0).toLocaleString()} pts</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag className="rounded-full px-3" color={status === 'active' ? 'green' : 'default'}>
          {status?.toUpperCase() || 'UNKNOWN'}
        </Tag>
      ),
    },
    {
      title: 'Verified',
      dataIndex: 'isVerified',
      key: 'isVerified',
      render: (verified) => (
        verified ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <CloseCircleTwoTone twoToneColor="#f5222d" />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            className="text-purple-600"
            onClick={() => navigate(`/admin/account-details/${record.id}?type=customer`)}
          >
            View Account
          </Button>
        </Space>
      ),
    },
  ];

  const filteredRetailers = retailers.filter(r =>
    r.business_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    r.phone?.includes(searchText)
  );

  const filteredWholesalers = wholesalers.filter(w =>
    w.company_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    w.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    w.phone?.includes(searchText)
  );

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    c.phone?.includes(searchText)
  );

  const stats = [
    { title: 'Total Customers', value: customers.length, icon: <UserOutlined />, color: 'cyan' },
    { title: 'Active Customers', value: customers.filter(c => c.status === 'active').length, icon: <CheckCircleTwoTone twoToneColor="#52c41a" />, color: 'green' },
    { title: 'Total Retailers', value: retailers.length, icon: <ShopOutlined />, color: 'blue' },
    { title: 'Active Retailers', value: retailers.filter(r => r.status === 'active').length, icon: <CheckCircleTwoTone twoToneColor="#52c41a" />, color: 'green' },
    { title: 'Total Wholesalers', value: wholesalers.length, icon: <BankOutlined />, color: 'purple' },
    { title: 'Active Wholesalers', value: wholesalers.filter(w => w.status === 'active').length, icon: <CheckCircleTwoTone twoToneColor="#52c41a" />, color: 'green' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Blue Header Banner */}
      <div className="bg-blue-600 p-8 rounded-xl shadow-lg mb-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2 bg-blue-500/30 rounded-lg text-2xl"><UserOutlined /></span>
              <h1 className="text-3xl font-bold m-0 text-white">Account Management</h1>
            </div>
            <p className="text-blue-100 text-lg opacity-90">View and manage customer, retailer & wholesaler accounts</p>
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadAccounts}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all rounded-lg h-10 px-6"
          >
            Refresh
          </Button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
      </div>

      {/* Stats Cards Grid */}
      <Row gutter={[24, 24]} className="mb-8">
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} md={8} lg={4} key={index}>
            <Card bordered={false} className="shadow-sm hover:shadow-md transition-shadow rounded-xl h-full flex flex-col justify-center">
              <div className="flex flex-col">
                <span className="text-gray-400 text-sm font-medium mb-2">{stat.title}</span>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-gray-800">{stat.value}</span>
                  <span className="text-2xl opacity-80">{stat.icon}</span>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Big Search Bar Card */}
      <Card bordered={false} className="mb-8 shadow-sm rounded-xl">
        <Input
          placeholder="Search by business name or email..."
          prefix={<SearchOutlined className="text-gray-400 text-lg mr-2" />}
          size="large"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="border-none bg-gray-50 hover:bg-white focus:bg-white transition-all rounded-lg py-3 text-lg"
          allowClear
        />
      </Card>

      {/* Tabs and Tables Card */}
      <Card bordered={false} className="shadow-sm rounded-xl overflow-hidden">
        <div className="flex justify-between items-center px-4 pt-4 border-b">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="account-tabs border-none"
            items={[
              {
                key: 'customers',
                label: (
                  <span className="flex items-center gap-2 px-4 py-2 text-lg">
                    <UserOutlined /> Customers ({customers.length})
                  </span>
                ),
              },
              {
                key: 'retailers',
                label: (
                   <span className="flex items-center gap-2 px-4 py-2 text-lg">
                    <ShopOutlined /> Retailers ({retailers.length})
                  </span>
                ),
              },
              {
                key: 'wholesalers',
                label: (
                  <span className="flex items-center gap-2 px-4 py-2 text-lg">
                    <BankOutlined /> Wholesalers ({wholesalers.length})
                  </span>
                ),
              },
            ]}
          />
          {activeTab !== 'customers' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              className="bg-blue-600 hover:bg-blue-700 h-10 px-8 rounded-lg mb-4"
              onClick={() => {
                if (activeTab === 'retailers') {
                  retailerForm.resetFields();
                  setEditingId(null);
                  setCreateRetailerModalVisible(true);
                } else {
                  wholesalerForm.resetFields();
                  setEditingId(null);
                  setCreateWholesalerModalVisible(true);
                }
              }}
            >
              {activeTab === 'retailers' ? 'Create Retailer' : 'Create Wholesaler'}
            </Button>
          )}
        </div>

        <div className="p-0">
          <Table
            columns={
              activeTab === 'customers' ? customerColumns :
              activeTab === 'retailers' ? retailerColumns : wholesalerColumns
            }
            dataSource={
              activeTab === 'customers' ? filteredCustomers :
              activeTab === 'retailers' ? filteredRetailers : filteredWholesalers
            }
            rowKey="id"
            loading={loading}
            className="custom-account-table"
            pagination={{
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} entries`,
              className: "px-6",
            }}
            locale={{
              emptyText: (
                <div className="py-20 flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                    {activeTab === 'customers' ? <UserOutlined className="text-gray-300 text-4xl" /> :
                     activeTab === 'retailers' ? <ShopOutlined className="text-gray-300 text-4xl" /> :
                     <BankOutlined className="text-gray-300 text-4xl" />}
                  </div>
                  <p className="text-gray-400 text-lg">No data</p>
                </div>
              )
            }}
          />
        </div>
      </Card>

      {/* Modals */}
      <Modal
        title={<span className="text-xl font-bold">{editingId ? 'Edit' : 'Create'} Retailer Account</span>}
        open={createRetailerModalVisible}
        onCancel={() => {
          setCreateRetailerModalVisible(false);
          retailerForm.resetFields();
          setEditingId(null);
        }}
        footer={null}
        width={650}
        className="rounded-2xl overflow-hidden"
      >
        <Alert
          message={editingId ? "Update Account" : "Account Activation"}
          description={editingId ? "Modify retailer details." : "An activation email will be sent to the retailer. They must activate their account and set a new password before logging in."}
          type="info"
          showIcon
          className="mb-8 rounded-xl"
        />
        <Form
          form={retailerForm}
          layout="vertical"
          onFinish={handleSaveRetailer}
          className="mt-4"
        >
          <Form.Item
            name="business_name"
            label={<span className="font-semibold">Business Name</span>}
            rules={[{ required: true, message: 'Please enter business name' }]}
          >
            <Input prefix={<ShopOutlined className="text-gray-400" />} placeholder="e.g., Kigali Shop Ltd" className="py-2.5 rounded-lg" />
          </Form.Item>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="email"
                label={<span className="font-semibold">Email</span>}
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' },
                ]}
              >
                <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="retailer@example.com" className="py-2.5 rounded-lg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={<span className="font-semibold">Phone</span>}
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="+250788123456" className="py-2.5 rounded-lg" />
              </Form.Item>
            </Col>
          </Row>

          {!editingId && (
            <Form.Item
              name="password"
              label={<span className="font-semibold">Initial Password</span>}
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
              extra="User will be required to change this password on first login"
            >
              <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Temporary password"  className="py-2.5 rounded-lg"/>
            </Form.Item>
          )}

          <Form.Item
            name="address"
            label={<span className="font-semibold">Business Address</span>}
          >
            <TextArea rows={3} placeholder="Street, District, City" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            name="credit_limit"
            label={<span className="font-semibold">Initial Credit Limit (RWF)</span>}
            initialValue={0}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={10000}
              className="py-1 rounded-lg"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, '')) as any}
            />
          </Form.Item>

          <Divider className="my-8" />

          <div className="flex justify-end gap-4">
            <Button onClick={() => {
              setCreateRetailerModalVisible(false);
              retailerForm.resetFields();
              setEditingId(null);
            }} className="h-11 px-8 rounded-lg">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} className="h-11 px-8 rounded-lg bg-blue-600 hover:bg-blue-700">
              {editingId ? 'Update' : 'Create'} Retailer Account
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={<span className="text-xl font-bold">{editingId ? 'Edit' : 'Create'} Wholesaler Account</span>}
        open={createWholesalerModalVisible}
        onCancel={() => {
          setCreateWholesalerModalVisible(false);
          wholesalerForm.resetFields();
          setEditingId(null);
        }}
        footer={null}
        width={650}
        className="rounded-2xl overflow-hidden"
      >
        <Alert
          message={editingId ? "Update Account" : "Account Activation"}
          description={editingId ? "Modify wholesaler details." : "An activation email will be sent to the wholesaler. They must activate their account and set a new password before logging in."}
          type="info"
          showIcon
          className="mb-8 rounded-xl"
        />
        <Form
          form={wholesalerForm}
          layout="vertical"
          onFinish={handleSaveWholesaler}
          className="mt-4"
        >
          <Form.Item
            name="company_name"
            label={<span className="font-semibold">Company Name</span>}
            rules={[{ required: true, message: 'Please enter company name' }]}
          >
            <Input prefix={<BankOutlined className="text-gray-400" />} placeholder="e.g., BIG Company Rwanda Ltd" className="py-2.5 rounded-lg" />
          </Form.Item>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="email"
                label={<span className="font-semibold">Email</span>}
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter valid email' },
                ]}
              >
                <Input prefix={<MailOutlined className="text-gray-400" />} placeholder="wholesaler@example.com" className="py-2.5 rounded-lg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={<span className="font-semibold">Phone</span>}
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input prefix={<PhoneOutlined className="text-gray-400" />} placeholder="+250788123456" className="py-2.5 rounded-lg" />
              </Form.Item>
            </Col>
          </Row>

          {!editingId && (
            <Form.Item
              name="password"
              label={<span className="font-semibold">Initial Password</span>}
              rules={[
                { required: true, message: 'Please enter password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
              extra="User will be required to change this password on first login"
            >
              <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="Temporary password"  className="py-2.5 rounded-lg"/>
            </Form.Item>
          )}

          <Form.Item
            name="address"
            label={<span className="font-semibold">Business Address</span>}
          >
            <TextArea rows={3} placeholder="Street, District, City" className="rounded-lg" />
          </Form.Item>

          <Divider className="my-8" />

          <div className="flex justify-end gap-4">
            <Button onClick={() => {
              setCreateWholesalerModalVisible(false);
              wholesalerForm.resetFields();
              setEditingId(null);
            }} className="h-11 px-8 rounded-lg">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} className="h-11 px-8 rounded-lg bg-blue-600 hover:bg-blue-700">
              {editingId ? 'Update' : 'Create'} Wholesaler Account
            </Button>
          </div>
        </Form>
      </Modal>

      <style>{`
        .account-tabs .ant-tabs-nav::before {
          display: none;
        }
        .account-tabs .ant-tabs-tab {
          margin: 0 !important;
          padding: 12px 0 !important;
          transition: all 0.3s;
        }
        .account-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #2563eb !important;
          font-weight: 600 !important;
        }
        .account-tabs .ant-tabs-ink-bar {
          background: #2563eb !important;
          height: 3px !important;
        }
        .custom-account-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 600 !important;
          font-size: 0.85rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.025em !important;
          border-bottom: 2px solid #f1f5f9 !important;
        }
        .custom-account-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 20px 16px !important;
        }
        .custom-account-table .ant-table-row:hover > td {
          background: #fdfdfd !important;
        }
      `}</style>
    </div>
  );
};

export default AccountManagementPage;
