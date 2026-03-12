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
  Progress,
  Tooltip,
  Tabs,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  BankOutlined,
  CheckCircleTwoTone,
  ClockCircleTwoTone,
  CloseCircleTwoTone,
  ExclamationCircleTwoTone,
  DollarCircleTwoTone,
  UserOutlined,
  ShopOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleFilled,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '../../services/apiService';

const { Text } = Typography;
const { Option } = Select;

interface Loan {
  id: number;
  user_id: string;
  user_name: string;
  user_type: 'retailer' | 'wholesaler' | 'consumer';
  amount: number;
  interest_rate: number;
  duration_months: number;
  monthly_payment: number;
  total_repayable: number;
  amount_paid: number;
  amount_remaining: number;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'defaulted' | 'rejected';
  created_at: string;
  approved_at?: string;
  due_date?: string;
}

const LoanManagementPage: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('customer');
  const [detailsModal, setDetailsModal] = useState<Loan | null>(null);

  useEffect(() => {
    fetchLoans();
  }, [statusFilter]);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getLoans({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      if (response.data.success) {
        setLoans(response.data.loans || []);
      }
    } catch (err: any) {
      console.error('Error fetching loans:', err);
      message.error('Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const handleLoanAction = async (loanId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await adminApi.approveLoan(loanId);
      } else {
        await adminApi.rejectLoan(loanId, 'Rejected by admin');
      }

      message.success(`Loan ${action}d successfully`);
      fetchLoans();
    } catch (err: any) {
      console.error(`Error ${action}ing loan:`, err);
      message.error(`Failed to ${action} loan`);
    }
  };

  const calculateProgress = (loan: Loan) => {
    if (!loan.total_repayable) return 0;
    return Math.round((loan.amount_paid / loan.total_repayable) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'blue';
      case 'pending':
        return 'orange';
      case 'completed':
        return 'green';
      case 'defaulted':
        return 'red';
      case 'rejected':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<Loan> = [
    {
      title: 'Borrower',
      key: 'borrower',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.user_name}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>ID: {record.id}</Text>
        </Space>
      ),
    },
    {
      title: 'Loan Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => <Text strong>{val?.toLocaleString() || 0} RWF</Text>,
    },
    {
      title: 'Repayment Progress',
      key: 'progress',
      render: (_, record) => (
        <div style={{ width: '150px' }}>
          <Progress 
            percent={calculateProgress(record)} 
            size="small" 
            strokeColor={calculateProgress(record) === 100 ? '#52c41a' : '#1890ff'}
          />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.amount_paid?.toLocaleString()} / {record.total_repayable?.toLocaleString()} RWF
          </Text>
        </div>
      ),
    },
    {
      title: 'Monthly Payment',
      dataIndex: 'monthly_payment',
      key: 'monthly_payment',
      render: (val) => <Text>{val?.toLocaleString() || 0} RWF</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} className="rounded-full px-3">
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} onClick={() => setDetailsModal(record)} />
          </Tooltip>
          {record.status === 'pending' && (
            <>
              <Tooltip title="Approve">
                <Button 
                  type="text" 
                  className="text-green-500" 
                  icon={<CheckOutlined />} 
                  onClick={() => handleLoanAction(record.id, 'approve')} 
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button 
                  type="text" 
                  danger 
                  icon={<CloseOutlined />} 
                  onClick={() => handleLoanAction(record.id, 'reject')} 
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const filteredLoans = loans.filter(
    (loan) =>
      loan.user_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      loan.id?.toString().includes(searchText)
  );

  const stats = [
    { title: 'Total Loans', value: loans.length, icon: <BankOutlined className="text-blue-500" />, border: '#1890ff' },
    { title: 'Pending', value: loans.filter(l => l.status === 'pending').length, icon: <ClockCircleTwoTone twoToneColor="#faad14" />, border: '#faad14' },
    { title: 'Active', value: loans.filter(l => l.status === 'active' || l.status === 'approved').length, icon: <CheckCircleTwoTone twoToneColor="#1890ff" />, border: '#1890ff' },
    { title: 'Completed', value: loans.filter(l => l.status === 'completed').length, icon: <CheckCircleTwoTone twoToneColor="#52c41a" />, border: '#52c41a' },
    { title: 'Defaulted', value: loans.filter(l => l.status === 'defaulted').length, icon: <ExclamationCircleTwoTone twoToneColor="#ff4d4f" />, border: '#ff4d4f' },
    { title: 'Outstanding', value: `${loans.reduce((acc, l) => acc + (l.amount_remaining || 0), 0).toLocaleString()} RWF`, icon: <DollarCircleTwoTone twoToneColor="#722ed1" />, border: '#722ed1' },
  ];

  const getTabInfo = () => {
    switch (activeTab) {
      case 'customer':
        return {
          title: 'Customer Credit Loans',
          desc: 'Loans requested by customers from Admin for personal purchases and credit.'
        };
      case 'retailer':
        return {
          title: 'Retailer Stock Loans',
          desc: 'Stock financing loans requested by retailers to purchase products from wholesalers.'
        };
      case 'wholesaler':
        return {
          title: 'Wholesaler Loans',
          desc: 'Large scale capital or operation loans requested by wholesalers.'
        };
      default:
        return { title: '', desc: '' };
    }
  };

  const tabInfo = getTabInfo();

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Purple Header Banner */}
        <div className="bg-[#6b21a8] p-8 rounded-xl shadow-lg mb-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-xl text-3xl">
                <BankOutlined />
              </div>
              <div>
                <h1 className="text-3xl font-bold m-0 text-white leading-tight">Loan Management</h1>
                <p className="text-purple-100 m-0 text-base opacity-90">Manage loan applications, approvals, and repayments</p>
              </div>
            </div>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchLoans}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all rounded-lg h-10 px-6 font-medium border-solid"
            >
              Refresh
            </Button>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
        </div>

        {/* Stats Section */}
        <Row gutter={[20, 20]} className="mb-8">
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} md={stat.title === 'Outstanding' ? 4 : 4} key={index}>
              <Card bordered={false} className="shadow-sm rounded-xl h-[120px] border-t-4" style={{ borderTopColor: stat.border }}>
                <div className="flex flex-col h-full justify-between py-1">
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{stat.title}</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-800">{stat.value}</span>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Search & Filter Bar */}
        <Card bordered={false} className="mb-8 shadow-sm rounded-xl p-1">
          <Row gutter={16}>
            <Col flex="auto">
              <Input
                placeholder="Search by borrower name or loan ID..."
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
                <Option value="pending">Pending</Option>
                <Option value="active">Active</Option>
                <Option value="completed">Completed</Option>
                <Option value="defaulted">Defaulted</Option>
                <Option value="rejected">Rejected</Option>
              </Select>
            </Col>
          </Row>
        </Card>

        {/* Tabs & Content Section */}
        <Card bordered={false} className="shadow-sm rounded-xl min-h-[600px]">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            className="loan-tabs mb-6"
            items={[
              { key: 'customer', label: <span><UserOutlined /> Customer Loans</span> },
              { key: 'retailer', label: <span><ShopOutlined /> Retailer Stock Loans</span> },
              { key: 'wholesaler', label: <span><BankOutlined /> Wholesaler Loans</span> },
            ]}
          />

          {/* Tab Information Box */}
          <Alert
            message={<span className="font-bold text-blue-800">{tabInfo.title}</span>}
            description={<span className="text-blue-700">{tabInfo.desc}</span>}
            type="info"
            showIcon
            icon={<InfoCircleFilled className="text-blue-500" />}
            className="mb-8 border-l-4 border-blue-400 bg-blue-50/50 rounded-lg"
          />

          <Table
            columns={columns}
            dataSource={filteredLoans}
            rowKey="id"
            loading={loading}
            className="loan-table"
            pagination={{
              showSizeChanger: true,
              pageSize: 10,
              showTotal: (total) => `Total ${total} loan requests`,
              className: "px-6 py-4 border-t",
            }}
            locale={{
              emptyText: (
                <div className="py-24 flex flex-col items-center">
                  <p className="text-gray-400 text-sm italic">No {activeTab} loan requests</p>
                </div>
              )
            }}
          />
        </Card>
      </div>

      {/* Details Modal */}
      <Modal
        title={<span className="text-lg font-bold">Loan Details</span>}
        open={!!detailsModal}
        onCancel={() => setDetailsModal(null)}
        footer={[
          <Button key="close" onClick={() => setDetailsModal(null)}>Close</Button>
        ]}
        width={600}
        centered
      >
        {detailsModal && (
          <div className="py-4">
            <Row gutter={[24, 24]}>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Loan ID</Text><br/>
                <Text strong>{detailsModal.id}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Status</Text><br/>
                <Tag color={getStatusColor(detailsModal.status)}>{detailsModal.status.toUpperCase()}</Tag>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Borrower</Text><br/>
                <Text strong>{detailsModal.user_name}</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Amount</Text><br/>
                <Text strong className="text-lg">{detailsModal.amount.toLocaleString()} RWF</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Interest Rate</Text><br/>
                <Text strong>{detailsModal.interest_rate}%</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Duration</Text><br/>
                <Text strong>{detailsModal.duration_months} Months</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Monthly Payment</Text><br/>
                <Text strong>{detailsModal.monthly_payment.toLocaleString()} RWF</Text>
              </Col>
              <Col span={12}>
                <Text type="secondary" className="text-xs uppercase font-semibold">Total Repayable</Text><br/>
                <Text strong>{detailsModal.total_repayable.toLocaleString()} RWF</Text>
              </Col>
              <Col span={24}>
                <Card size="small" className="bg-gray-50 border-none rounded-lg">
                  <div className="flex justify-between mb-2">
                    <Text type="secondary">Payment Progress</Text>
                    <Text strong>{calculateProgress(detailsModal)}%</Text>
                  </div>
                  <Progress percent={calculateProgress(detailsModal)} />
                  <div className="flex justify-between mt-2 text-xs">
                    <Text>Paid: {detailsModal.amount_paid.toLocaleString()} RWF</Text>
                    <Text>Remaining: {detailsModal.amount_remaining.toLocaleString()} RWF</Text>
                  </div>
                </Card>
              </Col>
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
        .loan-tabs .ant-tabs-nav::before {
          border-bottom: 2px solid #f0f0f0 !important;
        }
        .loan-tabs .ant-tabs-tab {
          font-weight: 500 !important;
          padding: 12px 16px !important;
        }
        .loan-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #6b21a8 !important;
        }
        .loan-tabs .ant-tabs-ink-bar {
          background: #6b21a8 !important;
        }
        .loan-table .ant-table-thead > tr > th {
          background: #fafafa !important;
          border-bottom: 1px solid #f0f0f0 !important;
          font-weight: 600 !important;
          color: #262626 !important;
          font-size: 13px !important;
        }
        .loan-table .ant-table-tbody > tr > td {
          padding: 16px !important;
          border-bottom: 1px solid #f0f0f0 !important;
        }
      `}</style>
    </div>
  );
};

export default LoanManagementPage;
