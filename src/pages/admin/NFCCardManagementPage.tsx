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
  Alert,
  InputNumber,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  StopOutlined,
  DollarCircleOutlined,
  UserOutlined,
  BlockOutlined,
  UnlockOutlined,
  HistoryOutlined,
  EnvironmentOutlined,
  IdcardOutlined,
  PhoneOutlined,
  MailOutlined,
  FileTextOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface NFCCard {
  id: string;
  uid: string;
  cardType?: string;
  cardholderName?: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  streetAddress?: string;
  landmark?: string;
  status: 'active' | 'inactive' | 'blocked' | 'available' | 'unassigned';
  balance: number;
  last_used?: string;
  created_at: string;
  user_name?: string;
  user_id?: string;
}

const NFCCardManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<NFCCard[]>([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<NFCCard | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customers, setCustomers] = useState<any[]>([]);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchCards();
    fetchCustomers();
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getNFCCards();
      if (response.data.success) {
        setCards(response.data.cards || []);
      }
    } catch (err: any) {
      console.error('Error fetching NFC cards:', err);
      message.error('Failed to load NFC cards');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await adminApi.getCustomers();
      if (response.data.success) {
        setCustomers(response.data.customers || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const handleRegisterCard = async (values: any) => {
    setLoading(true);
    try {
      const data = {
        ...values,
        pin: values.pin?.toString() || '1234',
        userId: values.userId // Pass the selected user ID if any
      };
      
      const response = await adminApi.registerNFCCard(data);
      if (response.data.success) {
        message.success('NFC card registered successfully');
        setCreateModalVisible(false);
        form.resetFields();
        fetchCards();
      }
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to register card');
    } finally {
      setLoading(false);
    }
  };

  const generateUid = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000); // 6 digit random
    const uid = `NFC-${year}-${random}`;
    form.setFieldsValue({ uid });
  };

  const handleCardAction = async (cardId: string, action: 'activate' | 'block' | 'unlink') => {
    try {
      if (action === 'block') {
        await adminApi.blockNFCCard(cardId);
      } else if (action === 'activate') {
        await adminApi.activateNFCCard(cardId);
      } else if (action === 'unlink') {
        await adminApi.unlinkNFCCard(cardId);
      }
      message.success(`Card ${action}ed successfully`);
      fetchCards();
    } catch (err: any) {
      message.error(`Failed to ${action} card`);
    }
  };

  const columns: ColumnsType<NFCCard> = [
    {
      title: 'Card Number',
      dataIndex: 'uid',
      key: 'uid',
      render: (text) => <span className="font-medium text-gray-700">{text}</span>,
    },
    {
      title: 'Assigned To',
      key: 'assigned_to',
      render: (_, record) => (
        <span className={record.cardholderName || record.user_name ? "text-gray-800" : "text-gray-400 italic"}>
          {record.cardholderName || record.user_name || 'Unassigned'}
        </span>
      ),
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (val) => <span className="text-gray-800">{val?.toLocaleString() || 0} RWF</span>,
    },
    {
      title: 'Transactions',
      key: 'transactions',
      render: () => <span className="text-gray-800">0</span>,
    },
    {
      title: 'Last Used',
      dataIndex: 'last_used',
      key: 'last_used',
      render: (val) => <span className="text-gray-600">{val ? new Date(val).toLocaleDateString() : '-'}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag className="rounded-full px-3" color={
          status === 'active' || status === 'available' ? 'green' :
            status === 'blocked' ? 'red' : 'orange'
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
          <Tooltip title="View Details">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => {
              setSelectedCard(record);
              setDetailsModalVisible(true);
            }} />
          </Tooltip>
          {record.status === 'blocked' ? (
            <Tooltip title="Activate">
              <Button type="text" size="small" className="text-green-500" icon={<UnlockOutlined />} onClick={() => handleCardAction(record.id, 'activate')} />
            </Tooltip>
          ) : (
            <Tooltip title="Block">
              <Button type="text" size="small" danger icon={<BlockOutlined />} onClick={() => handleCardAction(record.id, 'block')} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.uid.toLowerCase().includes(searchText.toLowerCase()) ||
      (card.cardholderName && card.cardholderName.toLowerCase().includes(searchText.toLowerCase())) ||
      (card.user_name && card.user_name.toLowerCase().includes(searchText.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || card.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = [
    { title: 'Total Cards', value: cards.length, icon: <CreditCardOutlined />, border: '#1890ff' },
    { title: 'Active', value: cards.filter(c => c.status === 'active' || c.status === 'available').length, icon: <CheckCircleOutlined className="text-green-500" />, border: '#52c41a' },
    { title: 'Unassigned', value: cards.filter(c => !c.user_id && !c.cardholderName).length, icon: <LinkOutlined className="text-orange-500" />, border: '#faad14' },
    { title: 'Blocked', value: cards.filter(c => c.status === 'blocked').length, icon: <StopOutlined className="text-red-500" />, border: '#ff4d4f' },
    { title: 'Total Balance (All Cards)', value: `${cards.reduce((acc, c) => acc + (c.balance || 0), 0).toLocaleString()} RWF`, icon: <DollarCircleOutlined className="text-purple-500" />, border: '#722ed1' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Teal Header Banner */}
        <div className="bg-[#00b5ad] p-6 rounded-xl shadow-sm mb-8 text-white flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg text-2xl">
                <CreditCardOutlined />
              </div>
              <div>
                <h1 className="text-2xl font-bold m-0 text-white">NFC Card Management</h1>
                <p className="text-white/80 m-0 text-sm">Manage NFC cards, assignments, and transactions</p>
              </div>
            </div>
            <Space size="middle">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchCards}
                className="bg-white border-none text-gray-700 hover:text-[#00b5ad] h-9 px-5 rounded-lg flex items-center font-medium"
              >
                Refresh
              </Button>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
                className="bg-[#1890ff] hover:bg-[#40a9ff] border-none h-9 px-5 rounded-lg flex items-center font-medium shadow-sm transition-all"
              >
                Register Card
              </Button>
            </Space>
        </div>

        {/* Stats Cards Row */}
        <Row gutter={[20, 20]} className="mb-8">
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} md={stat.title.includes('Balance') ? 8 : 4} key={index}>
              <Card bordered={false} className="shadow-sm rounded-xl h-[120px] border-t-4" style={{ borderTopColor: stat.border }}>
                <div className="flex flex-col h-full justify-between py-1">
                  <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">{stat.title}</span>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-gray-800">{stat.value}</span>
                    <span className="text-2xl opacity-80">{stat.icon}</span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Search and Filters Card Overlay */}
        <Card bordered={false} className="mb-8 shadow-sm rounded-xl p-1">
          <Row gutter={16}>
            <Col flex="auto">
              <Input
                placeholder="Search by card number or user..."
                prefix={<SearchOutlined className="text-gray-400 mr-2" />}
                size="large"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                className="border-none bg-gray-50/50 hover:bg-white focus:bg-white transition-all rounded-lg"
                allowClear
              />
            </Col>
            <Col>
              <Select 
                size="large" 
                defaultValue="all" 
                style={{ width: 180 }} 
                className="status-dropdown"
                onChange={setStatusFilter}
              >
                <Option value="all">All Status</Option>
                <Option value="available">Available</Option>
                <Option value="active">Active</Option>
                <Option value="blocked">Blocked</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Table Card */}
        <Card bordered={false} className="shadow-sm rounded-xl overflow-hidden p-0 mb-8 min-h-[500px]">
          <Table
            columns={columns}
            dataSource={filteredCards}
            rowKey="id"
            loading={loading}
            className="exact-ui-table"
            pagination={{
              showSizeChanger: true,
              pageSize: 10,
              showTotal: (total) => `Total ${total} cards`,
              className: "px-6 py-4 border-t",
            }}
            locale={{
              emptyText: (
                <div className="py-24 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                    <FileTextOutlined className="text-gray-300 text-3xl" />
                  </div>
                  <p className="text-gray-400 text-sm">No data</p>
                </div>
              )
            }}
          />
        </Card>
      </div>

      {/* Register Modal - Expanded Fields */}
      <Modal
        title={<span className="text-lg font-bold flex items-center gap-2"><CreditCardOutlined className="text-[#1890ff]" /> Register New NFC Card</span>}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={680}
        className="rounded-xl overflow-hidden"
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleRegisterCard}
          initialValues={{ cardType: 'Personal', province: 'Kigali', pin: '1234' }}
          className="mt-6 registration-form"
        >
          <Row gutter={20}>
            <Col span={12}>
              <Form.Item
                name="uid"
                label={<span className="text-xs font-semibold uppercase text-gray-500 flex gap-1">Card Number / UID <span className="text-red-500">*</span></span>}
                rules={[{ required: true, message: 'Card number is required' }]}
              >
                <Input 
                  size="large" 
                  prefix={<CreditCardOutlined className="text-gray-300" />} 
                  placeholder="e.g., NFC-007-2024-XXXX" 
                  className="rounded-lg"
                  addonAfter={
                    <Tooltip title="Auto Generate Card Number">
                      <ReloadOutlined onClick={generateUid} style={{ cursor: 'pointer', color: '#1890ff' }} />
                    </Tooltip>
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="cardType"
                label={<span className="text-xs font-semibold uppercase text-gray-500 flex gap-1">Card Type <span className="text-red-500">*</span></span>}
                rules={[{ required: true, message: 'Card type is required' }]}
              >
                <Select size="large" className="rounded-lg w-full" placeholder="Select card type">
                  <Option value="Standard NFC Card">Standard NFC Card</Option>
                  <Option value="Premium Card">Premium Card</Option>
                  <Option value="Business Card">Business Card</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col span={24}>
              <Form.Item
                name="userId"
                label={<span className="text-xs font-semibold uppercase text-gray-500">Link to Customer (Optional)</span>}
              >
                <Select
                  showSearch
                  placeholder="Select a customer to auto-fill details"
                  optionFilterProp="children"
                  filterOption={(input, option: any) =>
                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={(value) => {
                    const customer = customers.find((c) => c.user?.id === value || c.id === value);
                    if (customer) {
                      form.setFieldsValue({
                        cardholderName: customer.fullName || customer.user?.name,
                        phone: customer.user?.phone || customer.phone,
                        email: customer.user?.email || customer.email,
                        nationalId: customer.nationalId || '',
                        province: customer.province || 'Kigali',
                      });
                    }
                  }}
                  size="large"
                  className="rounded-lg w-full"
                >
                  <Option value="">None (Unassigned)</Option>
                  {customers.map((customer) => (
                    <Option key={customer.user?.id} value={customer.user?.id}>
                      {customer.fullName} ({customer.user?.phone})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col span={12}>
              <Form.Item
                name="cardholderName"
                label={<span className="text-xs font-semibold uppercase text-gray-500 flex gap-1">Cardholder Full Name <span className="text-red-500">*</span></span>}
                rules={[{ required: true, message: 'Name is required' }]}
              >
                <Input size="large" prefix={<UserOutlined className="text-gray-300" />} placeholder="Enter full name" className="rounded-lg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nationalId"
                label={<span className="text-xs font-semibold uppercase text-gray-500 flex gap-1">National ID Number <span className="text-red-500">*</span></span>}
                rules={[{ required: true, message: 'National ID is required' }]}
              >
                <Input size="large" placeholder="e.g., 1199880012345678" className="rounded-lg" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={<span className="text-xs font-semibold uppercase text-gray-500 flex gap-1">Phone Number <span className="text-red-500">*</span></span>}
                rules={[{ required: true, message: 'Phone is required' }]}
              >
                <Input size="large" placeholder="+250788123456" className="rounded-lg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label={<span className="text-xs font-semibold uppercase text-gray-500">Email Address</span>}
              >
                <Input size="large" placeholder="example@email.com" className="rounded-lg" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col span={12}>
              <Form.Item
                name="province"
                label={<span className="text-xs font-semibold uppercase text-gray-500 flex gap-1">Province <span className="text-red-500">*</span></span>}
                rules={[{ required: true, message: 'Province is required' }]}
              >
                <Select size="large" className="rounded-lg">
                  <Option value="Kigali">Kigali City</Option>
                  <Option value="Northern">Northern</Option>
                  <Option value="Southern">Southern</Option>
                  <Option value="Eastern">Eastern</Option>
                  <Option value="Western">Western</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="district"
                label={<span className="text-xs font-semibold uppercase text-gray-500 flex gap-1">District <span className="text-red-500">*</span></span>}
                rules={[{ required: true, message: 'District is required' }]}
              >
                <Input size="large" placeholder="Enter district" className="rounded-lg" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={20}>
            <Col span={12}>
              <Form.Item name="sector" label={<span className="text-xs font-semibold uppercase text-gray-500">Sector</span>}>
                <Input size="large" placeholder="Enter sector" className="rounded-lg" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cell" label={<span className="text-xs font-semibold uppercase text-gray-500">Cell</span>}>
                <Input size="large" placeholder="Enter cell" className="rounded-lg" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="streetAddress"
            label={<span className="text-xs font-semibold uppercase text-gray-500">Street Address / Landmark</span>}
          >
            <TextArea rows={2} placeholder="Additional address details or nearby landmark" className="rounded-lg" />
          </Form.Item>

          <Form.Item
              name="pin"
              label={<span className="text-xs font-semibold uppercase text-gray-500 flex gap-1">Initial 4-Digit PIN <span className="text-red-500">*</span></span>}
              rules={[
                { required: true, message: 'PIN is required' },
                { pattern: /^\d{4}$/, message: 'Must be 4 digits' }
              ]}
            >
              <Input.Password size="large" maxLength={4} prefix={<span className="text-gray-300 text-xs">***</span>} placeholder="Enter 4-digit PIN" className="rounded-lg" />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-8">
            <Button size="large" onClick={() => setCreateModalVisible(false)} className="rounded-lg h-10 px-6 font-medium">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} className="bg-[#1890ff] hover:bg-[#40a9ff] border-none h-10 px-8 rounded-lg font-medium shadow-sm">
              Register Card
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Card Details Modal */}
      <Modal
        title={<span className="text-lg font-bold">NFC Card Details</span>}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedCard(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailsModalVisible(false);
            setSelectedCard(null);
          }}>
            Close
          </Button>
        ]}
        width={700}
        centered
      >
        {selectedCard && (
          <div className="py-4">
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Card Number (UID)</Text><br/>
                <Text strong className="text-base">{selectedCard.uid}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Status</Text><br/>
                <Tag color={
                  selectedCard.status === 'active' || selectedCard.status === 'available' ? 'green' :
                    selectedCard.status === 'blocked' ? 'red' : 'orange'
                }>
                  {selectedCard.status?.toUpperCase()}
                </Tag>
              </Col>

              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Balance</Text><br/>
                <Text strong className="text-lg text-green-600">{selectedCard.balance?.toLocaleString() || 0} RWF</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Last Used</Text><br/>
                <Text>{selectedCard.last_used ? new Date(selectedCard.last_used).toLocaleString() : 'Never'}</Text>
              </Col>

              {selectedCard.cardholderName && (
                <>
                  <Col span={24}>
                    <div className="bg-gray-50 p-4 rounded-lg mt-2">
                      <Text strong className="text-sm">Cardholder Information</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" className="text-xs uppercase font-semibold">Full Name</Text><br/>
                    <Text>{selectedCard.cardholderName}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" className="text-xs uppercase font-semibold">National ID</Text><br/>
                    <Text>{selectedCard.nationalId || '-'}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" className="text-xs uppercase font-semibold">Phone</Text><br/>
                    <Text>{selectedCard.phone || '-'}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" className="text-xs uppercase font-semibold">Email</Text><br/>
                    <Text>{selectedCard.email || '-'}</Text>
                  </Col>

                  <Col span={24}>
                    <div className="bg-gray-50 p-4 rounded-lg mt-2">
                      <Text strong className="text-sm">Address Information</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" className="text-xs uppercase font-semibold">Province</Text><br/>
                    <Text>{selectedCard.province || '-'}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" className="text-xs uppercase font-semibold">District</Text><br/>
                    <Text>{selectedCard.district || '-'}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" className="text-xs uppercase font-semibold">Sector</Text><br/>
                    <Text>{selectedCard.sector || '-'}</Text>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" className="text-xs uppercase font-semibold">Cell</Text><br/>
                    <Text>{selectedCard.cell || '-'}</Text>
                  </Col>
                  <Col span={24}>
                    <Text type="secondary" className="text-xs uppercase font-semibold">Street Address / Landmark</Text><br/>
                    <Text>{selectedCard.streetAddress || selectedCard.landmark || '-'}</Text>
                  </Col>
                </>
              )}

              {!selectedCard.cardholderName && (
                <Col span={24}>
                  <Alert
                    message="Unassigned Card"
                    description="This card has not been assigned to any user yet."
                    type="info"
                    showIcon
                  />
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      <style>{`
        .status-dropdown .ant-select-selector {
          border-radius: 8px !important;
          background: #fff !important;
          border: 1px solid #d9d9d9 !important;
        }
        .exact-ui-table .ant-table-thead > tr > th {
          background: #fafafa !important;
          border-bottom: 1px solid #f0f0f0 !important;
          font-weight: 600 !important;
          color: #262626 !important;
          font-size: 13px !important;
        }
        .exact-ui-table .ant-table-tbody > tr > td {
          padding: 16px !important;
          border-bottom: 1px solid #f0f0f0 !important;
          color: #595959 !important;
          font-size: 14px !important;
        }
        .exact-ui-table .ant-table-row:hover > td {
          background: #fafafa !important;
        }
        .registration-form .ant-form-item {
          margin-bottom: 16px;
        }
        .registration-form .ant-form-item-label {
          padding-bottom: 4px;
        }
      `}</style>
    </div>
  );
};

export default NFCCardManagementPage;
