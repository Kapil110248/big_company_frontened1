import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Input,
  Progress,
  Modal,
  Form,
  Select,
  InputNumber,
  DatePicker,
  message,
  Statistic,
  Popconfirm
} from 'antd';
import {
  DollarOutlined,
  PlusOutlined,
  SearchOutlined,
  FunnelPlotOutlined,
  EditOutlined,
  DeleteOutlined,
  RiseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { dealsService, Deal } from '../../services/dealsService';

const { Title, Text } = Typography;
const { Option } = Select;

export const DealsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const data = await dealsService.getDeals();
      setDeals(data.deals);
    } catch (error) {
      message.error('Failed to load deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleCreateDeal = async (values: any) => {
    try {
      if (editingId) {
        await dealsService.updateDeal(editingId, values);
        message.success('Deal updated');
      } else {
        await dealsService.createDeal(values);
        message.success('Deal created');
      }
      setShowModal(false);
      setEditingId(null);
      form.resetFields();
      fetchDeals();
    } catch (error) {
      message.error('Failed to save deal');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dealsService.deleteDeal(id);
      message.success('Deal deleted');
      fetchDeals();
    } catch (error) {
      message.error('Failed to delete deal');
    }
  };

  const handleEdit = (record: Deal) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      expectedCloseDate: record.expectedCloseDate ? dayjs(record.expectedCloseDate) : null
    });
    setShowModal(true);
  };

  const totalValue = deals.reduce((acc, curr) => acc + curr.value, 0);
  const activeDeals = deals.length;
  const closedWon = deals.filter(d => d.stage === 'closed_won').reduce((acc, curr) => acc + curr.value, 0);

  const columns = [
    {
      title: 'Deal Name',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Deal) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.clientName}
          </Text>
        </div>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {value.toLocaleString()} RWF
        </Text>
      ),
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => {
        let color = 'default';
        if (stage === 'closed_won') color = 'success';
        if (stage === 'closed_lost') color = 'error';
        if (stage === 'negotiation') color = 'warning';
        if (stage === 'proposal') color = 'processing';
        return <Tag color={color}>{stage.replace('_', ' ').toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Probability',
      dataIndex: 'probability',
      key: 'probability',
      render: (prob: number) => (
        <Progress percent={prob} size="small" status={prob >= 80 ? 'success' : 'active'} />
      ),
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
    },
    {
      title: 'Expected Close',
      dataIndex: 'expectedCloseDate',
      key: 'closeDate',
      render: (date: string) => date ? dayjs(date).format('MMM DD, YYYY') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Deal) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete deal?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    }
  ];

  return (
    <div>
      <Title level={2}>
        <RiseOutlined /> Deals & Pipeline
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Pipeline Value"
              value={totalValue}
              precision={0}
              suffix="RWF"
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Deals"
              value={activeDeals}
              prefix={<FunnelPlotOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Closed Won (Total)"
              value={closedWon}
              precision={0}
              suffix="RWF"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'flex-end' }}>
          <Input
            placeholder="Search deals..."
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingId(null);
              form.resetFields();
              setShowModal(true);
            }}
          >
            Add Deal
          </Button>
        </Space>

        <Table
          dataSource={deals}
          columns={columns}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title={editingId ? "Edit Deal" : "Create New Deal"}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingId(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateDeal}>
          <Form.Item name="title" label="Deal Title" rules={[{ required: true }]}>
            <Input placeholder="e.g., Enterprise License - Client X" />
          </Form.Item>

          <Form.Item name="clientName" label="Client Name" rules={[{ required: true }]}>
            <Input placeholder="Client Company Name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="value" label="Deal Value (RWF)" rules={[{ required: true }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="owner" label="Deal Owner" rules={[{ required: true }]}>
                <Input placeholder="Sales Rep Name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="stage" label="Stage" rules={[{ required: true }]}>
                <Select>
                  <Option value="lead">Lead</Option>
                  <Option value="qualified">Qualified</Option>
                  <Option value="proposal">Proposal</Option>
                  <Option value="negotiation">Negotiation</Option>
                  <Option value="closed_won">Closed Won</Option>
                  <Option value="closed_lost">Closed Lost</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="probability" label="Probability (%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="expectedCloseDate" label="Expected Close Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">{editingId ? 'Update Deal' : 'Create Deal'}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
export default DealsPage;
