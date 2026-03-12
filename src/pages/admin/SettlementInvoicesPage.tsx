import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Spin,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Upload,
  Divider,
} from 'antd';
import {
  FileTextOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  PlusOutlined,
  FilterOutlined,
  SearchOutlined,
  ShopOutlined,
  BankOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;
const { Option } = Select;

interface Invoice {
  id: number;
  invoiceNumber: string;
  partyType: 'retailer' | 'wholesaler';
  partyId: number;
  partyName: string;
  settlementMonth: string;
  totalAmount: number;
  invoiceFileUrl?: string;
  notes?: string;
  uploadedBy: number;
  uploadedAt: string;
}

interface Party {
  id: number;
  name: string;
}

const SettlementInvoicesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [retailers, setRetailers] = useState<Party[]>([]);
  const [wholesalers, setWholesalers] = useState<Party[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Filters
  const [filterMonth, setFilterMonth] = useState<string | undefined>();
  const [filterPartyType, setFilterPartyType] = useState<string | undefined>();
  const [filterPartyId, setFilterPartyId] = useState<number | undefined>();

  // Stats
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    retailerInvoices: 0,
    wholesalerInvoices: 0,
  });

  useEffect(() => {
    fetchInvoices();
    fetchParties();
  }, [filterMonth, filterPartyType, filterPartyId]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getSettlementInvoices({
        month: filterMonth,
        partyType: filterPartyType,
        partyId: filterPartyId,
      });
      const data = response.data.invoices || [];
      setInvoices(data);

      // Calculate stats
      setStats({
        totalInvoices: data.length,
        totalAmount: data.reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0),
        retailerInvoices: data.filter((inv: Invoice) => inv.partyType === 'retailer').length,
        wholesalerInvoices: data.filter((inv: Invoice) => inv.partyType === 'wholesaler').length,
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      message.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const [retailersRes, wholesalersRes] = await Promise.all([
        adminApi.getRetailers(),
        adminApi.getWholesalers(),
      ]);
      setRetailers(
        (retailersRes.data.retailers || []).map((r: any) => ({
          id: r.id,
          name: r.shopName || r.shop_name,
        }))
      );
      setWholesalers(
        (wholesalersRes.data.wholesalers || []).map((w: any) => ({
          id: w.id,
          name: w.companyName || w.company_name,
        }))
      );
    } catch (error) {
      console.error('Error fetching parties:', error);
    }
  };

  const handleCreateInvoice = async (values: any) => {
    try {
      await adminApi.createSettlementInvoice({
        partyType: values.partyType,
        partyId: values.partyId,
        settlementMonth: values.settlementMonth.format('YYYY-MM'),
        totalAmount: values.totalAmount,
        invoiceFileUrl: values.invoiceFileUrl,
        notes: values.notes,
      });
      message.success('Invoice created successfully');
      setModalVisible(false);
      form.resetFields();
      fetchInvoices();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to create invoice');
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    try {
      await adminApi.deleteSettlementInvoice(id.toString());
      message.success('Invoice deleted successfully');
      fetchInvoices();
    } catch (error) {
      message.error('Failed to delete invoice');
    }
  };

  const columns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text: string) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>,
    },
    {
      title: 'Party Type',
      dataIndex: 'partyType',
      key: 'partyType',
      render: (type: string) => (
        <Tag
          icon={type === 'retailer' ? <ShopOutlined /> : <BankOutlined />}
          color={type === 'retailer' ? 'blue' : 'purple'}
        >
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Party Name',
      dataIndex: 'partyName',
      key: 'partyName',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Settlement Month',
      dataIndex: 'settlementMonth',
      key: 'settlementMonth',
      render: (month: string) => (
        <Tag icon={<CalendarOutlined />} color="cyan">
          {dayjs(month + '-01').format('MMMM YYYY')}
        </Tag>
      ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {amount.toLocaleString()} RWF
        </Text>
      ),
      sorter: (a: Invoice, b: Invoice) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Invoice File',
      dataIndex: 'invoiceFileUrl',
      key: 'invoiceFileUrl',
      render: (url: string) =>
        url ? (
          <Button
            type="link"
            icon={<DownloadOutlined />}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Download
          </Button>
        ) : (
          <Text type="secondary">No file</Text>
        ),
    },
    {
      title: 'Uploaded',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Invoice) => (
        <Space>
          <Popconfirm
            title="Delete this invoice?"
            onConfirm={() => handleDeleteInvoice(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 12 }} />
          Settlement Invoices
        </Title>
        <Text type="secondary">
          Manage monthly settlement invoices for retailers and wholesalers
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Invoices"
              value={stats.totalInvoices}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={stats.totalAmount}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="RWF"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Retailer Invoices"
              value={stats.retailerInvoices}
              prefix={<ShopOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Wholesaler Invoices"
              value={stats.wholesalerInvoices}
              prefix={<BankOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <DatePicker
              picker="month"
              placeholder="Filter by Month"
              style={{ width: '100%' }}
              onChange={(date) => setFilterMonth(date?.format('YYYY-MM'))}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Party Type"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => setFilterPartyType(value)}
            >
              <Option value="retailer">Retailer</Option>
              <Option value="wholesaler">Wholesaler</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Select Party"
              style={{ width: '100%' }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
              onChange={(value) => setFilterPartyId(value)}
            >
              {filterPartyType === 'wholesaler'
                ? wholesalers.map((w) => (
                    <Option key={w.id} value={w.id}>
                      {w.name}
                    </Option>
                  ))
                : retailers.map((r) => (
                    <Option key={r.id} value={r.id}>
                      {r.name}
                    </Option>
                  ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={6}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
              style={{ width: '100%' }}
            >
              Upload Invoice
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Invoices Table */}
      <Card>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={invoices}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        )}
      </Card>

      {/* Create Invoice Modal */}
      <Modal
        title={
          <Space>
            <UploadOutlined />
            <span>Upload Settlement Invoice</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateInvoice}>
          <Form.Item
            name="partyType"
            label="Party Type"
            rules={[{ required: true, message: 'Please select party type' }]}
          >
            <Select placeholder="Select party type">
              <Option value="retailer">Retailer</Option>
              <Option value="wholesaler">Wholesaler</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.partyType !== curr.partyType}
          >
            {({ getFieldValue }) => (
              <Form.Item
                name="partyId"
                label={getFieldValue('partyType') === 'wholesaler' ? 'Wholesaler' : 'Retailer'}
                rules={[{ required: true, message: 'Please select a party' }]}
              >
                <Select
                  placeholder={`Select ${getFieldValue('partyType') || 'party'}`}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {getFieldValue('partyType') === 'wholesaler'
                    ? wholesalers.map((w) => (
                        <Option key={w.id} value={w.id}>
                          {w.name}
                        </Option>
                      ))
                    : retailers.map((r) => (
                        <Option key={r.id} value={r.id}>
                          {r.name}
                        </Option>
                      ))}
                </Select>
              </Form.Item>
            )}
          </Form.Item>

          <Form.Item
            name="settlementMonth"
            label="Settlement Month"
            rules={[{ required: true, message: 'Please select settlement month' }]}
          >
            <DatePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="totalAmount"
            label="Total Amount (RWF)"
            rules={[{ required: true, message: 'Please enter total amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item name="invoiceFileUrl" label="Invoice File URL (PDF Link)">
            <Input placeholder="https://example.com/invoice.pdf" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes about this settlement..." />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Create Invoice
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SettlementInvoicesPage;
