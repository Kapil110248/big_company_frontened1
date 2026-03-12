import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Table,
  Statistic,
  message,
  Tabs,
  Alert,
  Empty,
} from 'antd';
import {
  WalletOutlined,
  CreditCardOutlined,
  HistoryOutlined,
  PlusOutlined,
  MobileOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  DollarOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { consumerApi, nfcApi } from '../../services/apiService';

const { Title, Text } = Typography;

// Updated Types for 3-balance structure
interface WalletBalance {
  dashboardBalance: number;
  creditBalance: number;
  availableBalance: number; // dashboardBalance + creditBalance
  currency: string;
}

interface Transaction {
  id: string;
  type: 'top_up' | 'gas_payment' | 'order_payment' | 'refund' | 'credit_payment' | 'loan_disbursement';
  amount: number;
  balance_type: 'dashboard' | 'credit';
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  merchant_name?: string;
  meter_id?: string;
  order_id?: string;
  reference_number?: string;
}

interface CreditInfo {
  credit_limit: number;
  available_credit: number;
  used_credit: number;
  outstanding_balance: number;
  payment_status: 'current' | 'overdue' | 'pending';
  next_payment_date?: string;
  next_payment_amount?: number;
}

interface CreditOrder {
  id: string;
  order_number: string;
  amount: number;
  date: string;
  status: string;
}

interface CreditApproval {
  id: string;
  amount_requested: number;
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reason?: string;
}

const ConsumerWalletPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [creditOrders, setCreditOrders] = useState<CreditOrder[]>([]);
  const [creditApprovals, setCreditApprovals] = useState<CreditApproval[]>([]);
  const [nfcCards, setNfcCards] = useState<any[]>([]);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  
  // Modals
  const [topUpModalVisible, setTopUpModalVisible] = useState(false);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [loanModalVisible, setLoanModalVisible] = useState(false);
  const [repayModalVisible, setRepayModalVisible] = useState(false);
  const [linkCardModalVisible, setLinkCardModalVisible] = useState(false);
  const [topUpCardModalVisible, setTopUpCardModalVisible] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState('transactions');

  const [topUpForm] = Form.useForm();
  const [refundForm] = Form.useForm();
  const [loanForm] = Form.useForm();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [walletsRes, transactionsRes, loansRes, nfcRes] = await Promise.all([
        consumerApi.getWallets(),
        consumerApi.getWalletTransactions({ limit: 50 }),
        consumerApi.getLoans(),
        nfcApi.getMyCards(),
      ]);

      if (walletsRes.data.success) {
        const wallets = walletsRes.data.data;
        const dashboardWallet = wallets.find((w: any) => w.type === 'dashboard_wallet');
        const creditWallet = wallets.find((w: any) => w.type === 'credit_wallet');

        const dashboardBalance = dashboardWallet?.balance || 0;
        const creditBalance = creditWallet?.balance || 0;

        setBalance({
          dashboardBalance,
          creditBalance,
          availableBalance: dashboardBalance + creditBalance,
          currency: 'RWF',
        });
      }

      if (transactionsRes.data.success) {
        const transformedTransactions: Transaction[] = transactionsRes.data.data.map((t: any) => ({
          id: t.id,
          type: t.type as any,
          amount: t.amount,
          balance_type: t.wallet_type === 'dashboard_wallet' ? 'dashboard' : 'credit',
          description: t.description,
          status: t.status,
          created_at: t.created_at,
          reference_number: t.reference,
        }));
        setTransactions(transformedTransactions);
      }

      // Process Loans
      if (loansRes.data.loans) {
            const loans = loansRes.data.loans;
            setActiveLoans(loans);
            setCreditApprovals(loans.map((l: any) => ({
              id: l.id,
              amount_requested: l.amount,
              status: l.status,
              submitted_at: l.createdAt,
              reason: 'Loan Request'
            })));

            const usedCredit = loans.reduce((sum: number, l: any) => sum + l.amount, 0);
            const creditLimit = 50000;

            setCreditInfo({
              credit_limit: creditLimit,
              available_credit: creditLimit - usedCredit,
              used_credit: usedCredit,
              outstanding_balance: usedCredit,
              payment_status: 'current',
              next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });
      }

      // Process NFC Cards
      if (nfcRes.data.success) {
        setNfcCards(nfcRes.data.data || []);
      }

    } catch (error) {
      console.error('Failed to load wallet data:', error);
      message.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const handleTopUp = async (values: any) => {
      try {
          setLoading(true);
          const response = await consumerApi.topupWallet({
              amount: values.amount,
              payment_method: values.payment_method || 'mobile_money',
          });
          if (response.data.success) {
              message.success('Top-up successful');
              setTopUpModalVisible(false);
              topUpForm.resetFields();
              loadData();
          }
      } catch (error: any) {
          message.error(error.response?.data?.error || 'Top-up failed');
      } finally {
          setLoading(false);
      }
  };

  const handleRefundRequest = async (values: any) => {
      try {
           setLoading(true);
           await consumerApi.requestRefund(values);
           message.success('Refund request submitted');
           setRefundModalVisible(false);
           refundForm.resetFields();
      } catch (error: any) {
           message.error('Failed to submit refund');
      } finally {
           setLoading(false);
      }
  };

  const handleLoanRequest = async (values: any) => {
       try {
           setLoading(true);
           const loanProduct = await consumerApi.getLoanProducts();
           let product = loanProduct.data.products?.find((p: any) => p.loan_type === 'cash');
           await consumerApi.applyForLoan({
               loan_product_id: product?.id || 'lp_2',
               amount: values.amount,
               purpose: values.purpose
           });
           message.success('Loan application submitted');
           setLoanModalVisible(false);
           loanForm.resetFields();
           loadData();
       } catch (error: any) {
           message.error('Failed to submit loan');
       } finally {
           setLoading(false);
       }
  };

   const handleRepayLoan = async (values: any) => {
        try {
            setLoading(true);
            await consumerApi.repayLoan(selectedLoan.id, {
                amount: values.amount,
                payment_method: values.payment_method || 'wallet'
            });
            message.success('Repayment successful');
            setRepayModalVisible(false);
            loadData();
        } catch (error: any) {
            message.error('Repayment failed');
        } finally {
            setLoading(false);
        }
   };

   const handleLinkCard = async (values: any) => {
        try {
            setLoading(true);
            await nfcApi.linkCard(values.uid, values.pin, values.nickname);
            message.success('Card linked successfully');
            setLinkCardModalVisible(false);
            loadData();
        } catch (error: any) {
            message.error('Failed to link card');
        } finally {
            setLoading(false);
        }
   };

   const handleTopUpCard = async (values: any) => {
        try {
            setLoading(true);
            await nfcApi.topUpCard(selectedCard.id, {
                amount: values.amount,
                pin: values.pin
            });
            message.success('Card topped up successfully');
            setTopUpCardModalVisible(false);
            loadData();
        } catch (error: any) {
            message.error('Failed to top up card');
        } finally {
            setLoading(false);
        }
   };

   const handleUnlinkCard = async (cardId: string) => {
        try {
            setLoading(true);
            await nfcApi.unlinkCard(cardId);
            message.success('Card unlinked successfully');
            loadData();
        } catch (error: any) {
            message.error('Failed to unlink card');
        } finally {
            setLoading(false);
        }
   };

  const transactionColumns: ColumnsType<Transaction> = [
      {
        title: 'Date',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (date) => new Date(date).toLocaleDateString(),
        width: 100,
      },
      {
        title: 'Description',
        key: 'description',
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Text>{record.description}</Text>
            {record.merchant_name && (
              <Text type="secondary" style={{ fontSize: 12 }}>{record.merchant_name}</Text>
            )}
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.balance_type === 'dashboard' ? 'Dashboard' : 'Credit'}
            </Text>
          </Space>
        ),
      },
      {
        title: 'Type',
        dataIndex: 'type',
        key: 'type',
        render: (type) => {
          const config: Record<string, { color: string; label: string }> = {
            order_payment: { color: 'red', label: 'Purchase' },
            gas_payment: { color: 'orange', label: 'Gas' },
            top_up: { color: 'green', label: 'Top-up' },
            refund: { color: 'cyan', label: 'Refund' },
            loan_disbursement: { color: 'purple', label: 'Loan' },
            credit_payment: { color: 'blue', label: 'Credit' },
          };
          const { color, label } = config[type] || { color: 'default', label: type };
          return <Tag color={color}>{label}</Tag>;
        },
        width: 100,
      },
      {
        title: 'Amount',
        dataIndex: 'amount',
        key: 'amount',
        render: (amount) => (
          <Text strong style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f' }}>
            {amount > 0 ? '+' : ''}{amount.toLocaleString()} RWF
          </Text>
        ),
        align: 'right',
        width: 120,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: (status) => {
          const color = status === 'completed' ? 'success' : status === 'pending' ? 'warning' : 'error';
          return <Tag color={color}>{status}</Tag>;
        },
        width: 100,
      },
  ];

  return (
      <div style={{ padding: '24px' }} className="wallet-page">
          <div style={{ marginBottom: 32 }}>
              <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                  <WalletOutlined style={{ marginRight: 16, color: '#333' }} />
                  Wallet & Cards
              </Title>
              <Text type="secondary" style={{ fontSize: 16 }}>Manage your balances and NFC payment cards</Text>
          </div>

          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
               {/* Available Balance Summary Card */}
               <Col xs={24} lg={8}>
                   <Card 
                       style={{ 
                           height: '100%', 
                           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                           borderRadius: 16,
                           border: 'none',
                           color: 'white',
                           display: 'flex',
                           flexDirection: 'column',
                           justifyContent: 'center',
                           minHeight: 180
                       }}
                       bodyStyle={{ padding: '24px' }}
                   >
                       <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Available Balance</Text>
                       <Title level={1} style={{ color: 'white', margin: '8px 0', fontSize: 36 }}>
                           {(balance?.availableBalance || 0).toLocaleString()} RWF
                       </Title>
                       <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Dashboard + Credit Balance</Text>
                   </Card>
               </Col>

               {/* Dashboard Balance Card */}
               <Col xs={24} sm={12} lg={8}>
                   <Card 
                       style={{ borderRadius: 16, height: '100%' }}
                       bodyStyle={{ padding: '24px' }}
                   >
                       <Space align="start" style={{ marginBottom: 20 }}>
                           <div style={{ background: '#e6f7ff', padding: 10, borderRadius: 8 }}>
                               <WalletOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                           </div>
                           <div>
                               <Text type="secondary" style={{ fontSize: 12 }}>Dashboard Balance</Text>
                               <Title level={3} style={{ margin: 0 }}>{(balance?.dashboardBalance || 0).toLocaleString()} RWF</Title>
                               <Text style={{ fontSize: 11, color: '#8c8c8c' }}>Main wallet</Text>
                           </div>
                       </Space>
                       
                       <Space direction="vertical" style={{ width: '100%' }} size={12}>
                           <Button 
                               type="primary" 
                               icon={<PlusOutlined />} 
                               block 
                               size="large"
                               style={{ borderRadius: 8 }}
                               onClick={() => setTopUpModalVisible(true)}
                           >
                               Top Up
                           </Button>
                           <Button 
                               icon={<ArrowUpOutlined />} 
                               block 
                               size="large"
                               style={{ borderRadius: 8 }}
                               onClick={() => setRefundModalVisible(true)}
                           >
                               Request Refund
                           </Button>
                       </Space>
                   </Card>
               </Col>

               {/* Credit Balance Card */}
               <Col xs={24} sm={12} lg={8}>
                   <Card 
                       style={{ borderRadius: 16, height: '100%' }}
                       bodyStyle={{ padding: '24px' }}
                   >
                       <Space align="start" style={{ marginBottom: 20 }}>
                           <div style={{ background: '#f6ffed', padding: 10, borderRadius: 8 }}>
                               <CreditCardOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                           </div>
                           <div>
                               <Text type="secondary" style={{ fontSize: 12 }}>Credit Balance</Text>
                               <Title level={3} style={{ margin: 0 }}>{(balance?.creditBalance || 0).toLocaleString()} RWF</Title>
                               <Text style={{ fontSize: 11, color: '#8c8c8c' }}>Available credit</Text>
                           </div>
                       </Space>

                       <Space direction="vertical" style={{ width: '100%' }} size={12}>
                           <Button 
                               type="primary" 
                               icon={<PlusOutlined />} 
                               block 
                               size="large"
                               style={{ borderRadius: 8, background: '#1890ff' }}
                               onClick={() => setLoanModalVisible(true)}
                           >
                               Request Loan
                           </Button>
                           <Button 
                               icon={<FileTextOutlined />} 
                               block 
                               size="large"
                               style={{ borderRadius: 8 }}
                               onClick={() => window.location.href = '/consumer/credit-ledger'}
                           >
                               View Details
                           </Button>
                       </Space>
                   </Card>
               </Col>
          </Row>

          <Alert
            message="Access your wallet via USSD"
            description={
              <span>Dial <Text strong code>*939#</Text> from your registered phone to check balance without internet.</span>
            }
            type="info"
            showIcon
            icon={<MobileOutlined />}
            style={{ marginBottom: 24 }}
          />

          <Card>
              <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={[
                      {
                          key: 'transactions',
                          label: <span><HistoryOutlined /> Transactions</span>,
                          children: (
                              <Table
                                  columns={transactionColumns}
                                  dataSource={transactions}
                                  rowKey="id"
                                  loading={loading}
                                  pagination={{ pageSize: 10 }}
                              />
                          )
                      },
                       {
                           key: 'cards',
                           label: <span><CreditCardOutlined /> My NFC Cards ({nfcCards.length}/3)</span>,
                           children: (
                               <div style={{ padding: '24px 0' }}>
                                   <Row gutter={[24, 24]}>
                                       {nfcCards.map(card => (
                                           <Col xs={24} sm={12} md={8} key={card.id}>
                                               <Card 
                                                   style={{ 
                                                       borderRadius: 16,
                                                       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                       color: 'white',
                                                       border: 'none',
                                                       position: 'relative',
                                                       overflow: 'hidden',
                                                       minHeight: 180
                                                   }}
                                                   bodyStyle={{ padding: '24px' }}
                                               >
                                                   <div style={{ position: 'absolute', top: 20, right: 20 }}>
                                                       <Tag color="#1890ff" style={{ border: 'none', borderRadius: 4, fontWeight: 'bold' }}>Primary</Tag>
                                                   </div>
                                                   <CreditCardOutlined style={{ fontSize: 32, marginBottom: 20, opacity: 0.8 }} />
                                                   <div>
                                                       <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, display: 'block' }}>NFC Card ({card.uid.slice(-4)})</Text>
                                                       <Title level={4} style={{ color: 'white', margin: '4px 0' }}>{card.nickname || `NFC-${card.uid.slice(-4)}`}</Title>
                                                   </div>
                                                   <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                       <div>
                                                           <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Balance</Text>
                                                           <div style={{ fontSize: 20, fontWeight: 'bold' }}>{card.balance.toLocaleString()} RWF</div>
                                                       </div>
                                                       <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>UID: {card.uid}</Text>
                                                   </div>
                                               </Card>
                                           </Col>
                                       ))}
                                       {nfcCards.length < 3 && (
                                           <Col xs={24} sm={12} md={8}>
                                               <div 
                                                   onClick={() => setLinkCardModalVisible(true)}
                                                   style={{
                                                       height: '100%',
                                                       minHeight: 180,
                                                       border: '2px dashed #d9d9d9',
                                                       borderRadius: 16,
                                                       display: 'flex',
                                                       flexDirection: 'column',
                                                       alignItems: 'center',
                                                       justifyContent: 'center',
                                                       cursor: 'pointer',
                                                       transition: 'all 0.3s'
                                                   }}
                                                   className="link-card-placeholder"
                                               >
                                                   <PlusOutlined style={{ fontSize: 32, color: '#8c8c8c', marginBottom: 12 }} />
                                                   <Text style={{ color: '#8c8c8c', fontWeight: 500 }}>Link New Card</Text>
                                               </div>
                                           </Col>
                                       )}
                                   </Row>
                               </div>
                           )
                       },
                       {
                           key: 'dashboard_ledger',
                           label: <span><FileTextOutlined /> Dashboard Ledger</span>,
                           children: <div style={{ padding: '24px 0' }}><Table columns={transactionColumns} dataSource={transactions.filter(t => t.balance_type === 'dashboard')} rowKey="id" pagination={{ pageSize: 10 }} /></div>
                       },
                       {
                           key: 'credit_ledger',
                           label: <span><DollarOutlined /> Credit Ledger</span>,
                           children: <div style={{ padding: '24px 0' }}><Table columns={transactionColumns} dataSource={transactions.filter(t => t.balance_type === 'credit')} rowKey="id" pagination={{ pageSize: 10 }} /></div>
                       }
                  ]}
              />
          </Card>

          <Modal title="Top Up Wallet" open={topUpModalVisible} onCancel={() => setTopUpModalVisible(false)} footer={null}>
              <Form form={topUpForm} onFinish={handleTopUp} layout="vertical">
                  <Form.Item name="amount" label="Amount (RWF)" rules={[{ required: true }]}>
                      <InputNumber style={{ width: '100%' }} min={100} />
                  </Form.Item>
                  <Form.Item name="payment_method" label="Payment Method" initialValue="mobile_money">
                      <Select>
                          <Select.Option value="mobile_money">Mobile Money</Select.Option>
                      </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>Top Up</Button>
              </Form>
          </Modal>

          <Modal title="Request Refund" open={refundModalVisible} onCancel={() => setRefundModalVisible(false)} footer={null}>
              <Form form={refundForm} onFinish={handleRefundRequest} layout="vertical">
                  <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
                      <InputNumber style={{ width: '100%' }} min={100} max={balance?.dashboardBalance} />
                  </Form.Item>
                  <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
                      <Input.TextArea />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>Submit Request</Button>
              </Form>
          </Modal>

          <Modal title="Request Loan" open={loanModalVisible} onCancel={() => setLoanModalVisible(false)} footer={null}>
               <Form form={loanForm} onFinish={handleLoanRequest} layout="vertical">
                  <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
                      <InputNumber style={{ width: '100%' }} min={1000} max={creditInfo?.available_credit} />
                  </Form.Item>
                  <Form.Item name="purpose" label="Purpose">
                      <Input />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>Apply</Button>
               </Form>
          </Modal>

          <Modal title="Repay Loan" open={repayModalVisible} onCancel={() => setRepayModalVisible(false)} footer={null}>
               <Form onFinish={handleRepayLoan} layout="vertical">
                  <Title level={5}>Loan Amount: {selectedLoan?.amount?.toLocaleString()} RWF</Title>
                  <Form.Item name="amount" label="Repayment Amount" rules={[{ required: true }]}>
                      <InputNumber style={{ width: '100%' }} min={100} max={selectedLoan?.amount} />
                  </Form.Item>
                  <Form.Item name="payment_method" label="Source" initialValue="wallet">
                      <Select>
                          <Select.Option value="wallet">Main Wallet</Select.Option>
                          <Select.Option value="mobile_money">Mobile Money</Select.Option>
                      </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>Repay</Button>
               </Form>
          </Modal>

          <Modal title="Link NFC Card" open={linkCardModalVisible} onCancel={() => setLinkCardModalVisible(false)} footer={null}>
               <Form onFinish={handleLinkCard} layout="vertical">
                  <Form.Item name="uid" label="Card UID" rules={[{ required: true }]}>
                      <Input placeholder="Enter 8 or 14 digit UID" />
                  </Form.Item>
                  <Form.Item name="pin" label="Card PIN" rules={[{ required: true }]}>
                      <Input.Password maxLength={4} placeholder="4 digit PIN" />
                  </Form.Item>
                  <Form.Item name="nickname" label="Card Nickname">
                      <Input placeholder="e.g. My Main Card" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>Link Card</Button>
               </Form>
          </Modal>

          <Modal title="Top Up NFC Card" open={topUpCardModalVisible} onCancel={() => setTopUpCardModalVisible(false)} footer={null}>
               <Form onFinish={handleTopUpCard} layout="vertical">
                  <Title level={5}>Card: {selectedCard?.nickname || selectedCard?.uid}</Title>
                  <Form.Item name="amount" label="Top Up Amount" rules={[{ required: true }]}>
                      <InputNumber style={{ width: '100%' }} min={100} />
                  </Form.Item>
                  <Form.Item name="pin" label="Card PIN" rules={[{ required: true }]}>
                      <Input.Password maxLength={4} placeholder="4 digit PIN" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading} block>Top Up</Button>
               </Form>
          </Modal>
      </div>
  );
};

export default ConsumerWalletPage;
