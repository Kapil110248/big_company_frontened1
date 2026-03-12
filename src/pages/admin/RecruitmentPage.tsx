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
  Select,
  Modal,
  Form,
  InputNumber,
  message,
  Statistic,
  Tabs,
  List,
  Avatar,
  Popconfirm
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { recruitmentService, JobPosting, Applicant } from '../../services/recruitmentService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

export const RecruitmentPage: React.FC = () => {
  const [showJobModal, setShowJobModal] = useState(false);
  const [form] = Form.useForm();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const jobsData = await recruitmentService.getJobs();
      setJobs(jobsData.jobs);

      const appsData = await recruitmentService.getApplications();
      setApplicants(appsData.applications);
    } catch (error) {
      message.error('Failed to load recruitment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openPositions = jobs.filter((j) => j.status === 'open').length;
  const totalApplicants = applicants.length;
  const inInterview = applicants.filter((a) => a.status === 'interview').length;
  const pendingReview = applicants.filter((a) => a.status === 'screening' || a.status === 'applied').length;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'success',
      closed: 'default',
      applied: 'processing',
      screening: 'purple',
      interview: 'warning',
      offer: 'cyan',
      hired: 'success',
      rejected: 'error',
    };
    return colors[status] || 'default';
  };

  const handleCreateJob = async (values: any) => {
    try {
      if (editingJobId) {
        await recruitmentService.updateJob(editingJobId, values);
        message.success('Job updated successfully');
      } else {
        await recruitmentService.createJob(values);
        message.success('Job posting created successfully!');
      }
      setShowJobModal(false);
      setEditingJobId(null);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error('Failed to save job posting');
    }
  };

  const handleDeleteJob = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent viewing details if row click
    try {
      await recruitmentService.deleteJob(id);
      message.success('Job deleted');
      fetchData();
    } catch (error) {
      message.error('Failed to delete job');
    }
  };

  const handleEditJob = (record: JobPosting) => {
    setEditingJobId(record.id);
    form.setFieldsValue(record);
    setShowJobModal(true);
  };

  const jobColumns = [
    {
      title: 'Job Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: JobPosting) => (
        <div>
          <Text strong>{title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.department} • {record.location}
          </Text>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">{type.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Salary Range',
      key: 'salary',
      render: (_: any, record: JobPosting) =>
        `${record.salaryMin.toLocaleString()} - ${record.salaryMax.toLocaleString()} RWF`,
    },
    {
      title: 'Applicants',
      dataIndex: ['_count', 'applications'],
      key: 'applicants',
      render: (count: number) => <Text strong>{count || 0}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Posted',
      dataIndex: 'postedDate',
      key: 'postedDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: JobPosting) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditJob(record)} />
          <Popconfirm title="Delete job?" onConfirm={(e) => handleDeleteJob(record.id, e!)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>
        <UserAddOutlined /> Recruitment & Jobs
      </Title>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Open Positions"
              value={openPositions}
              prefix={<UserAddOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Applicants"
              value={totalApplicants}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="In Interview"
              value={inInterview}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Pending Review"
              value={pendingReview}
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Job Postings" key="1">
            <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingJobId(null);
                  form.resetFields();
                  setShowJobModal(true);
                }}
              >
                Create Job Posting
              </Button>
            </Space>
            <Table
              dataSource={jobs}
              columns={jobColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              loading={loading}
            />
          </TabPane>

          <TabPane tab="Applicants" key="2">
            <List
              dataSource={applicants}
              loading={loading}
              renderItem={(applicant) => (
                <List.Item
                  actions={[
                    <Button type="link" icon={<EyeOutlined />}>
                      View
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserAddOutlined />} style={{ background: '#1890ff' }} />}
                    title={<Text strong>{applicant.name}</Text>}
                    description={
                      <Space direction="vertical">
                        <Text type="secondary">Applied for: {applicant.job?.title || 'Unknown Job'}</Text>
                        <Space>
                          <Text type="secondary">{applicant.email}</Text>
                          <Text type="secondary">•</Text>
                          <Text type="secondary">{applicant.phone}</Text>
                        </Space>
                        <Space>
                          <Tag color={getStatusColor(applicant.status)}>
                            {applicant.status.toUpperCase()}
                          </Tag>
                          <Text type="secondary">
                            Applied: {dayjs(applicant.appliedDate).format('MMM DD, YYYY')}
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Create/Edit Job Modal */}
      <Modal
        title={editingJobId ? "Edit Job Posting" : "Create Job Posting"}
        open={showJobModal}
        onCancel={() => {
          setShowJobModal(false);
          setEditingJobId(null);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateJob}>
          <Form.Item name="title" label="Job Title" rules={[{ required: true }]}>
            <Input size="large" placeholder="e.g., Senior Software Engineer" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                <Select size="large">
                  <Option value="IT">IT</Option>
                  <Option value="Sales">Sales</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="HR">HR</Option>
                  <Option value="Finance">Finance</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Employment Type" rules={[{ required: true }]}>
                <Select size="large">
                  <Option value="full_time">Full Time</Option>
                  <Option value="part_time">Part Time</Option>
                  <Option value="contract">Contract</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salaryMin" label="Minimum Salary (RWF)" rules={[{ required: true }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salaryMax" label="Maximum Salary (RWF)" rules={[{ required: true }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="location" label="Location" rules={[{ required: true }]}>
            <Input size="large" placeholder="e.g., Kigali, Rwanda" />
          </Form.Item>

          {/* Status (only for edit) */}
          {editingJobId && (
            <Form.Item name="status" label="Status">
              <Select>
                <Option value="open">Open</Option>
                <Option value="closed">Closed</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item name="description" label="Job Description" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="Describe the role and responsibilities" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setShowJobModal(false);
                  setEditingJobId(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingJobId ? "Update Job" : "Create Job Posting"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RecruitmentPage;
