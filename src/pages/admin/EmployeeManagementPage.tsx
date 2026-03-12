import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  DatePicker,
  InputNumber,
  message,
  Statistic,
  Avatar,
  Dropdown,
  Spin
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

import { employeeService, Employee } from '../../services/employeeService';

export const EmployeeManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form] = Form.useForm();

  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getEmployees();
      setEmployees(data.employees);
    } catch (error) {
      message.error('Failed to fetch employees');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'success',
      inactive: 'error',
      on_leave: 'warning',
    };
    return colors[status] || 'default';
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.firstName.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.lastName.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchText.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(searchText.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const onLeave = employees.filter((e) => e.status === 'on_leave').length;
  const totalPayroll = employees.reduce((sum, e) => sum + e.salary, 0);

  const handleAddEmployee = async (values: any) => {
    try {
      console.log('Submitting employee:', values);
      // Format date
      const data = {
        ...values,
        dateOfJoining: values.dateOfJoining.format('YYYY-MM-DD'),
      };

      if (editingId) {
        // Update existing
        await employeeService.updateEmployee(editingId, data);
        message.success('Employee updated successfully!');
      } else {
        // Create new
        await employeeService.createEmployee(data);
        message.success('Employee added successfully!');
      }

      setShowAddModal(false);
      setEditingId(null);
      form.resetFields();
      fetchEmployees(); // Refresh list
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save employee');
    }
  };

  const handleEdit = (record: Employee) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      dateOfJoining: dayjs(record.dateOfJoining),
      password: '', // Don't pre-fill password
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete Employee',
      content: 'Are you sure you want to delete this employee? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await employeeService.deleteEmployee(id);
          message.success('Employee deleted successfully');
          fetchEmployees();
        } catch (error) {
          message.error('Failed to delete employee');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, record: Employee) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ background: '#1890ff' }} />
          <div>
            <Text strong>
              {record.firstName} {record.lastName}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.employeeNumber}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, record: Employee) => (
        <div>
          <Text>{record.email}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.phone}
          </Text>
        </div>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => <Tag color="blue">{dept}</Tag>,
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Salary',
      dataIndex: 'salary',
      key: 'salary',
      render: (salary: number) => `${salary.toLocaleString()} RWF`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'dateOfJoining',
      key: 'dateOfJoining',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Employee) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View Details',
                onClick: () => navigate(`/admin/employees/${record.id}`),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit',
                onClick: () => handleEdit(record),
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                danger: true,
                onClick: () => handleDelete(record.id),
              },
            ],
          }}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>
        <TeamOutlined /> Employee Management
      </Title>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={totalEmployees}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Active"
              value={activeEmployees}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="On Leave"
              value={onLeave}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Monthly Payroll"
              value={totalPayroll}
              prefix="RWF"
              valueStyle={{ color: '#722ed1', fontSize: 18 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Employee List */}
      <Card
        title="All Employees"
        extra={
          <Space>
            <Input
              placeholder="Search employees..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Select value={departmentFilter} onChange={setDepartmentFilter} style={{ width: 150 }}>
              <Option value="all">All Departments</Option>
              <Option value="Sales">Sales</Option>
              <Option value="Marketing">Marketing</Option>
              <Option value="IT">IT</Option>
              <Option value="HR">HR</Option>
              <Option value="Finance">Finance</Option>
            </Select>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }}>
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="on_leave">On Leave</Option>
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingId(null);
                form.resetFields();
                setShowAddModal(true);
              }}
            >
              Add Employee
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={filteredEmployees}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>

      {/* Add/Edit Employee Modal */}
      <Modal
        title={editingId ? "Edit Employee" : "Add New Employee"}
        open={showAddModal}
        onCancel={() => {
          setShowAddModal(false);
          setEditingId(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleAddEmployee}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Department" rules={[{ required: true }]}>
                <Select size="large">
                  <Option value="Sales">Sales</Option>
                  <Option value="Marketing">Marketing</Option>
                  <Option value="IT">IT</Option>
                  <Option value="HR">HR</Option>
                  <Option value="Finance">Finance</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="position" label="Position" rules={[{ required: true }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salary" label="Monthly Salary (RWF)" rules={[{ required: true }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  size="large"
                  min={0}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>

            {/* Status - Only show when editing, or default to active */}
            <Col span={12}>
              <Form.Item name="status" label="Status" initialValue="active">
                <Select size="large">
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="on_leave">On Leave</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="password"
                label={editingId ? "Reset Password (Optional)" : "Password"}
                rules={[
                  { required: !editingId, message: 'Please enter a password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password size="large" placeholder={editingId ? "Leave blank to keep unchanged" : "Login Password"} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dateOfJoining" label="Date of Joining" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="bankAccount" label="Bank Account Number" rules={[{ required: true }]}>
                <Input size="large" placeholder="For direct deposit" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingId(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingId ? "Update Employee" : "Add Employee"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeManagementPage;
