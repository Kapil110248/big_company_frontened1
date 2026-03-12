import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Statistic,
  message,
  Modal,
  Form,
  Input,
  Select,
} from 'antd';
import {
  CreditCardOutlined,
  CalendarOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MobileOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { consumerApi } from '../../services/apiService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface PaymentSchedule {
  id: string;
  payment_number: number;
  due_date: string;
  amount: number;
  status: 'paid' | 'upcoming' | 'overdue';
  paid_date?: string;
}

interface LoanDetails {
  id: string;
  loan_number: string;
  amount: number;
  disbursed_date: string;
  repayment_frequency: 'daily' | 'weekly';
  interest_rate: number;
  total_amount: number;
  outstanding_balance: number;
  paid_amount: number;
  next_payment_date: string;
  next_payment_amount: number;
  status: 'active' | 'completed' | 'overdue';
  payment_schedule: PaymentSchedule[];
}

const CreditLedgerPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loan, setLoan] = useState<LoanDetails | null>(null);
  const [countdown, setCountdown] = useState('');
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'mobile_money' | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchLoanDetails();
  }, []);

  // Countdown timer for next payment
  useEffect(() => {
    if (!loan?.next_payment_date) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadline = new Date(loan.next_payment_date).getTime();
      const distance = deadline - now;

      if (distance < 0) {
        setCountdown('Payment Overdue');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`${days} day${days > 1 ? 's' : ''}, ${hours} hours`);
      } else if (hours > 0) {
        setCountdown(`${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minutes`);
      } else {
        setCountdown(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [loan]);

  const fetchLoanDetails = async () => {
    setLoading(true);
    try {
      const response = await consumerApi.getActiveLoanLedger();
      if (response.data.loan) {
        setLoan(response.data.loan);
      } else {
        setLoan(null);
      }
    } catch (error) {
      console.error("Error fetching loan ledger:", error);
      message.error('Failed to load loan details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (method: 'wallet' | 'mobile_money') => {
    setPaymentMethod(method);
    setPaymentModalVisible(true);
    if (method === 'wallet') {
      form.setFieldsValue({ amount: loan?.next_payment_amount });
    }
  };

  const submitPayment = async (values: any) => {
    if (!loan) return;
    setLoading(true);
    try {
      // paymentMethod in form submission is handled by state `paymentMethod`
      const payload = {
        amount: Number(values.amount),
        payment_method: paymentMethod || 'wallet', // Default to wallet if null
        // Mobile money fields if applicable (backend needs to support them, currently likely mocked or basic)
        phone: values.phone,
        provider: values.provider
      };

      await consumerApi.repayLoan(loan.id, payload);

      message.success(`Payment of ${values.amount.toLocaleString()} RWF processed successfully!`);
      setPaymentModalVisible(false);
      form.resetFields();
      fetchLoanDetails(); // Refresh loan details
    } catch (error: any) {
      console.error("Repayment failed:", error);
      message.error(error.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<PaymentSchedule> = [
    {
      title: 'Payment #',
      dataIndex: 'payment_number',
      key: 'payment_number',
      width: 100,
      render: (num: number) => <Text strong>#{num}</Text>,
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        </Space>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#722ed1' }}>
          {amount.toLocaleString()} RWF
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: PaymentSchedule) => {
        if (status === 'paid') {
          return (
            <Space direction="vertical" size={0}>
              <Tag icon={<CheckCircleOutlined />} color="success">
                Paid
              </Tag>
              {record.paid_date && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(record.paid_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              )}
            </Space>
          );
        } else if (status === 'overdue') {
          return (
            <Tag icon={<ExclamationCircleOutlined />} color="error">
              Overdue
            </Tag>
          );
        } else {
          return (
            <Tag icon={<ClockCircleOutlined />} color="default">
              Upcoming
            </Tag>
          );
        }
      },
    },
  ];

  if (!loan) {
    return (
      <div style={{ padding: 24 }}>
        <Card loading={loading}>
          <div style={{ textAlign: 'center', padding: 48 }}>
            <CreditCardOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4}>No Active Loan</Title>
            <Paragraph type="secondary">You don't have any active loans at the moment.</Paragraph>
            <Button type="primary" size="large" href="/consumer/wallet">
              Request a Loan
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Credit Ledger</Title>
        <Text type="secondary">Manage your loan payments and view payment schedule</Text>
      </div>

      {/* Loan Summary Card */}
      <Card
        style={{
          marginBottom: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
        }}
        loading={loading}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={2}>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Loan Number</Text>
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                {loan.loan_number}
              </Title>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Space direction="vertical" size={2} style={{ width: '100%', textAlign: 'right' }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Original Amount</Text>
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                {loan.amount.toLocaleString()} RWF
              </Title>
            </Space>
          </Col>
        </Row>

        {/* Prominent Date Display */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} sm={12}>
            <Card
              size="small"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: 12,
              }}
            >
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  <CalendarOutlined style={{ marginRight: 6 }} />
                  Current Loan Date Given
                </Text>
                <Title level={4} style={{ color: 'white', margin: 0 }}>
                  {new Date(loan.disbursed_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Title>
              </Space>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card
              size="small"
              style={{
                background: 'rgba(255,76,79,0.3)',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: 12,
              }}
            >
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 6 }} />
                  Next Payment Deadline
                </Text>
                <Title level={4} style={{ color: 'white', margin: 0 }}>
                  {new Date(loan.next_payment_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Title>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={12} sm={6}>
            <Space direction="vertical" size={0}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Frequency</Text>
              <Text style={{ color: 'white', fontWeight: 500 }}>
                {loan.repayment_frequency.charAt(0).toUpperCase() + loan.repayment_frequency.slice(1)}
              </Text>
            </Space>
          </Col>
          <Col xs={12} sm={6}>
            <Space direction="vertical" size={0}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Interest Rate</Text>
              <Text style={{ color: 'white', fontWeight: 500 }}>{loan.interest_rate}%</Text>
            </Space>
          </Col>
          <Col xs={12} sm={6}>
            <Space direction="vertical" size={0}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Total Amount</Text>
              <Text style={{ color: 'white', fontWeight: 500 }}>{loan.total_amount.toLocaleString()} RWF</Text>
            </Space>
          </Col>
          <Col xs={12} sm={6}>
            <Space direction="vertical" size={0}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>Time Remaining</Text>
              <Text style={{ color: countdown === 'Payment Overdue' ? '#ff7875' : '#52c41a', fontWeight: 600 }}>
                {countdown}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Next Payment & Outstanding Balance */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card>
            <Statistic
              title={
                <Space>
                  <ClockCircleOutlined />
                  <span>Next Payment Due</span>
                </Space>
              }
              value={loan.next_payment_amount.toLocaleString()}
              suffix="RWF"
              valueStyle={{ color: '#ff4d4f' }}
            />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Due Date: </Text>
              <Text strong>
                {new Date(loan.next_payment_date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </div>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">Time Remaining: </Text>
              <Text strong style={{ color: countdown === 'Payment Overdue' ? '#ff4d4f' : '#52c41a' }}>
                {countdown}
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Outstanding Balance"
                  value={loan.outstanding_balance.toLocaleString()}
                  suffix="RWF"
                  valueStyle={{ color: '#722ed1', fontSize: 24 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Amount Paid"
                  value={loan.paid_amount.toLocaleString()}
                  suffix="RWF"
                  valueStyle={{ color: '#52c41a', fontSize: 24 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Payment Buttons */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={5}>Make a Payment</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Choose your preferred payment method
        </Text>
        <Space size="middle" wrap>
          <Button
            type="primary"
            size="large"
            icon={<WalletOutlined />}
            onClick={() => handlePayment('wallet')}
            style={{ minWidth: 200 }}
          >
            Pay from Dashboard Balance
          </Button>
          <Button
            size="large"
            icon={<MobileOutlined />}
            onClick={() => handlePayment('mobile_money')}
            style={{ minWidth: 200, borderColor: '#722ed1', color: '#722ed1' }}
          >
            Pay via Mobile Money
          </Button>
        </Space>
      </Card>

      {/* Payment Schedule Table */}
      <Card title="Payment Schedule" loading={loading}>
        <Table
          columns={columns}
          dataSource={loan.payment_schedule}
          rowKey="id"
          pagination={false}
          scroll={{ x: 600 }}
        />
      </Card>

      {/* Payment Modal */}
      <Modal
        title={
          paymentMethod === 'wallet' ? (
            <Space>
              <WalletOutlined />
              <span>Pay from Dashboard Balance</span>
            </Space>
          ) : (
            <Space>
              <MobileOutlined />
              <span>Pay via Mobile Money</span>
            </Space>
          )
        }
        open={paymentModalVisible}
        onCancel={() => {
          setPaymentModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={submitPayment}>
          <Form.Item
            name="amount"
            label="Payment Amount"
            rules={[{ required: true, message: 'Please enter payment amount' }]}
          >
            <Input
              type="number"
              size="large"
              placeholder="Enter amount"
              suffix="RWF"
              addonBefore={<DollarOutlined />}
            />
          </Form.Item>

          {paymentMethod === 'mobile_money' && (
            <>
              <Form.Item
                name="phone"
                label="Mobile Money Number"
                rules={[
                  { required: true, message: 'Please enter phone number' },
                  { pattern: /^[0-9]{10}$/, message: 'Please enter valid 10-digit phone number' },
                ]}
              >
                <Input size="large" placeholder="0781234567" prefix="+250" />
              </Form.Item>

              <Form.Item
                name="provider"
                label="Mobile Money Provider"
                rules={[{ required: true, message: 'Please select provider' }]}
              >
                <Select size="large" placeholder="Select provider">
                  <Option value="mtn">MTN Mobile Money</Option>
                  <Option value="airtel">Airtel Money</Option>
                </Select>
              </Form.Item>
            </>
          )}

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setPaymentModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Confirm Payment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CreditLedgerPage;
