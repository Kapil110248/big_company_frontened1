import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Table,
  Tag,
  Select,
  Modal,
  Descriptions,
  Statistic,
  message,
  Alert,
  Progress,
} from 'antd';
import {
  DollarOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  BankOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string;
  grossSalary: number;
  deductions: {
    tax: number;
    insurance: number;
    pension: number;
    billPayments: number;
  };
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paymentDate?: string;
  bankAccount: string;
}

export const PayrollProcessingPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('2025-12');
  const [showProcessModal, setShowProcessModal] = useState(false);

  const payrollRecords: PayrollRecord[] = [
    {
      id: '1',
      employeeId: 'emp-001',
      employeeName: 'John Employee',
      employeeNumber: 'EMP001',
      department: 'Sales',
      grossSalary: 850000,
      deductions: {
        tax: 85000,
        insurance: 25000,
        pension: 42500,
        billPayments: 52500,
      },
      netSalary: 645000,
      status: 'pending',
      bankAccount: '**** **** 1234',
    },
    {
      id: '2',
      employeeId: 'emp-002',
      employeeName: 'Sarah Johnson',
      employeeNumber: 'EMP002',
      department: 'Marketing',
      grossSalary: 1200000,
      deductions: {
        tax: 120000,
        insurance: 35000,
        pension: 60000,
        billPayments: 75000,
      },
      netSalary: 910000,
      status: 'pending',
      bankAccount: '**** **** 5678',
    },
    {
      id: '3',
      employeeId: 'emp-003',
      employeeName: 'Michael Chen',
      employeeNumber: 'EMP003',
      department: 'IT',
      grossSalary: 1500000,
      deductions: {
        tax: 150000,
        insurance: 45000,
        pension: 75000,
        billPayments: 80000,
      },
      netSalary: 1150000,
      status: 'pending',
      bankAccount: '**** **** 9012',
    },
  ];

  const totalGross = payrollRecords.reduce((sum, r) => sum + r.grossSalary, 0);
  const totalDeductions = payrollRecords.reduce(
    (sum, r) => sum + r.deductions.tax + r.deductions.insurance + r.deductions.pension + r.deductions.billPayments,
    0
  );
  const totalNet = payrollRecords.reduce((sum, r) => sum + r.netSalary, 0);
  const processed = payrollRecords.filter((r) => r.status === 'processed' || r.status === 'paid').length;

  const handleProcessPayroll = () => {
    Modal.confirm({
      title: 'Process Payroll',
      content: `Are you sure you want to process payroll for ${payrollRecords.length} employees? Total amount: ${totalNet.toLocaleString()} RWF`,
      okText: 'Process Payroll',
      okType: 'primary',
      onOk: async () => {
        message.loading('Processing payroll...', 2);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        message.success('Payroll processed successfully! Direct deposits initiated.');
      },
    });
  };

  const columns = [
    {
      title: 'Employee',
      key: 'employee',
      render: (_: any, record: PayrollRecord) => (
        <div>
          <Text strong>{record.employeeName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.employeeNumber} • {record.department}
          </Text>
        </div>
      ),
    },
    {
      title: 'Gross Salary',
      dataIndex: 'grossSalary',
      key: 'grossSalary',
      render: (amount: number) => `${amount.toLocaleString()} RWF`,
    },
    {
      title: 'Total Deductions',
      key: 'totalDeductions',
      render: (_: any, record: PayrollRecord) => {
        const total =
          record.deductions.tax +
          record.deductions.insurance +
          record.deductions.pension +
          record.deductions.billPayments;
        return <Text type="danger">{total.toLocaleString()} RWF</Text>;
      },
    },
    {
      title: 'Net Salary',
      dataIndex: 'netSalary',
      key: 'netSalary',
      render: (amount: number) => (
        <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
          {amount.toLocaleString()} RWF
        </Text>
      ),
    },
    {
      title: 'Bank Account',
      dataIndex: 'bankAccount',
      key: 'bankAccount',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'processing',
          processed: 'success',
          paid: 'default',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: PayrollRecord) => (
        <Button type="link" icon={<EyeOutlined />}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>
        <DollarOutlined /> Payroll Processing
      </Title>

      <Alert
        message="Direct Deposit System"
        description="Payroll will be automatically deposited to employee bank accounts. Bill payments will be deducted and sent directly to service providers."
        type="info"
        showIcon
        icon={<BankOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={payrollRecords.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Gross Payroll"
              value={totalGross}
              prefix="RWF"
              valueStyle={{ color: '#722ed1', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Deductions"
              value={totalDeductions}
              prefix="RWF"
              valueStyle={{ color: '#ff4d4f', fontSize: 18 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Net Payroll"
              value={totalNet}
              prefix="RWF"
              valueStyle={{ color: '#52c41a', fontSize: 18 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Payroll Details */}
      <Card
        title={
          <Space>
            <Text>Payroll for {dayjs(selectedMonth).format('MMMM YYYY')}</Text>
            <Progress
              percent={(processed / payrollRecords.length) * 100}
              size="small"
              style={{ width: 100 }}
            />
          </Space>
        }
        extra={
          <Space>
            <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: 150 }}>
              <Option value="2025-12">December 2025</Option>
              <Option value="2025-11">November 2025</Option>
              <Option value="2025-10">October 2025</Option>
            </Select>
            <Button icon={<DownloadOutlined />}>Export Report</Button>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleProcessPayroll}>
              Process Payroll
            </Button>
          </Space>
        }
      >
        <Table dataSource={payrollRecords} columns={columns} rowKey="id" pagination={false} />

        <Card style={{ marginTop: 24, background: '#f0f2f5' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Gross Payroll">
                  <Text strong>{totalGross.toLocaleString()} RWF</Text>
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={8}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Total Deductions">
                  <Text strong type="danger">
                    {totalDeductions.toLocaleString()} RWF
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={8}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Net Payroll">
                  <Text strong style={{ color: '#52c41a', fontSize: 18 }}>
                    {totalNet.toLocaleString()} RWF
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>
      </Card>

      {/* Deductions Breakdown */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Deductions Breakdown">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="Income Tax"
                  value={payrollRecords.reduce((sum, r) => sum + r.deductions.tax, 0)}
                  prefix="RWF"
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Health Insurance"
                  value={payrollRecords.reduce((sum, r) => sum + r.deductions.insurance, 0)}
                  prefix="RWF"
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Pension Fund"
                  value={payrollRecords.reduce((sum, r) => sum + r.deductions.pension, 0)}
                  prefix="RWF"
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Bill Payments"
                  value={payrollRecords.reduce((sum, r) => sum + r.deductions.billPayments, 0)}
                  prefix="RWF"
                  valueStyle={{ fontSize: 16, color: '#faad14' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PayrollProcessingPage;
