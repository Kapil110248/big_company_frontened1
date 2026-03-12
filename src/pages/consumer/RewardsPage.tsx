import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Tag,
  Space,
  Tabs,
  Progress,
  message,
  Spin,
  Empty,
  Input,
  Table,
  Badge,
  Alert,
  Statistic,
  Divider,
  Modal,
  Form,
  InputNumber,
} from 'antd';
import {
  GiftOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  FireOutlined,
  TeamOutlined,
  CrownOutlined,
  ShareAltOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  StarFilled,
  ShoppingOutlined,
  CommentOutlined,
  UserAddOutlined,
  LinkOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { consumerApi } from '../../services/apiService';
import { FRONTEND_URL } from '../../config';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface RewardsBalance {
  points: number;
  lifetime_points: number;
}

interface RewardTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'bonus' | 'referral';
  points: number;
  description: string;
  created_at: string;
  meter_id?: string;
  order_amount?: number;
  order_id?: string;
  metadata?: {
    gas_amount?: number;
    order_id?: string;
    referral_code?: string;
  };
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  tier: string;
  is_current_user: boolean;
}


const transactionTypeConfig: any = {
  earned: { color: 'success', icon: '+', label: 'Earned' },
  purchase: { color: 'success', icon: '+', label: 'Purchase Reward' },
  redeemed: { color: 'processing', icon: '-', label: 'Redeemed' },
  redemption: { color: 'processing', icon: '-', label: 'Redeemed' },
  sent: { color: 'warning', icon: '-', label: 'Sent to Meter' },
  order_payment: { color: 'orange', icon: '-', label: 'Order Payment' },
  expired: { color: 'error', icon: '-', label: 'Expired' },
  bonus: { color: 'purple', icon: '+', label: 'Bonus' },
  referral: { color: 'orange', icon: '+', label: 'Referral' },
};

export const RewardsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [balance, setBalance] = useState<RewardsBalance | null>(null);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [copied, setCopied] = useState(false);

  const [sendToMeterModalVisible, setSendToMeterModalVisible] = useState(false);
  const [sendToMeterForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balanceRes, historyRes, referralRes, leaderboardRes] = await Promise.all([
        consumerApi.getRewardsBalance(),
        consumerApi.getRewardsHistory(20),
        consumerApi.getReferralCode(),
        consumerApi.getLeaderboard('month'),
      ]);

      // Transform balance: backend returns units (m³), frontend uses points (100 points = 1 m³)
      if (balanceRes.data.success) {
        const totalUnits = balanceRes.data.data.total_units || 0;
        setBalance({
          points: Math.round(totalUnits * 100), // Convert m³ to points
          lifetime_points: Math.round(totalUnits * 100), // For now, same as current
        });
      }

      // Transform history: map units to points and add metadata
      if (historyRes.data.success && historyRes.data.data.transactions) {
        const transformedTransactions: RewardTransaction[] = historyRes.data.data.transactions.map((item: any) => {
          return {
            id: item.id,
            type: item.type || 'earned',
            points: item.points || 0, // Keep original sign
            description: item.description || 'Gas reward',
            created_at: item.created_at,
            meter_id: item.meter_id,
            order_amount: item.order_amount,
            order_id: item.order_id,
            metadata: item.metadata
          };
        });
        setTransactions(transformedTransactions);
      }

      // Referral code
      if (referralRes.data.success) {
        setReferralCode(referralRes.data.data.referral_code);
      }

      // Transform leaderboard: map units to points
      if (leaderboardRes.data.success) {
        const userId = localStorage.getItem('bigcompany_user');
        const currentUserName = userId ? JSON.parse(userId).name : '';

        const transformedLeaderboard: LeaderboardEntry[] = leaderboardRes.data.data.map((item: any, index: number) => ({
          rank: item.rank || index + 1,
          name: item.customer_name,
          points: Math.round(item.total_units * 100), // Convert m³ to points
          tier: item.total_units > 100 ? 'PLATINUM' :
            item.total_units > 50 ? 'GOLD' :
              item.total_units > 20 ? 'SILVER' : 'BRONZE',
          is_current_user: item.customer_name === currentUserName,
        }));
        setLeaderboard(transformedLeaderboard);
      }
    } catch (error) {
      console.error('Failed to fetch rewards data:', error);
      message.error('Failed to load rewards data');
      // Set empty states on error
      setBalance({ points: 0, lifetime_points: 0 });
      setTransactions([]);
      setReferralCode('BIG' + Math.random().toString(36).substr(2, 6).toUpperCase());
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    message.success('Referral code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferralCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join BIG Company',
          text: `Use my referral code ${referralCode} to sign up and get bonus rewards!`,
          url: `https://big.rw/register?ref=${referralCode}`,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      copyReferralCode();
    }
  };

  const handleRedeem = async () => {
    const points = parseInt(redeemAmount);
    if (!points || points < 100) {
      message.error('Minimum 100 points to redeem');
      return;
    }
    if (balance && points > balance.points) {
      message.error('Insufficient points');
      return;
    }

    setRedeeming(true);
    try {
      const response = await consumerApi.redeemRewards(points);
      if (response.data.success) {
        const walletCredit = response.data.data.wallet_credit;
        message.success(
          `Redeemed ${points} points for ${walletCredit.toLocaleString()} RWF wallet credit!`
        );
        setRedeemAmount('');
        await fetchData(); // Refresh all data
      } else {
        message.error(response.data.error || 'Failed to redeem points');
      }
    } catch (error: any) {
      console.error('Redemption failed:', error);
      message.error(error.response?.data?.error || 'Failed to redeem points');
    } finally {
      setRedeeming(false);
    }
  };

  const handleSendToMeter = async (values: any) => {
    try {
      setRedeeming(true);
      const response = await consumerApi.sendToMeter({
        meterId: values.meterId,
        amount: values.amount // Amount in m3
      });

      if (response.data.success) {
        message.success(response.data.message || 'Sent successfully!');
        setSendToMeterModalVisible(false);
        sendToMeterForm.resetFields();
        await fetchData();
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to send rewards');
    } finally {
      setRedeeming(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-RW', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
      width: 150,
    },
    {
      title: 'Meter ID',
      dataIndex: 'meter_id',
      key: 'meter_id',
      render: (meterId: string) => meterId || 'N/A',
      width: 120,
    },
    {
      title: 'Order Amount',
      dataIndex: 'order_amount',
      key: 'order_amount',
      render: (amount: number) => amount ? `${amount.toLocaleString()} RWF` : 'N/A',
      width: 120,
    },
    {
      title: 'Gas Amount (M³)',
      dataIndex: 'points',
      key: 'points',
      render: (points: number, record: RewardTransaction) => {
        const isPositive = ['earned', 'bonus', 'referral', 'refund'].includes(record.type) || (record.type as any) === 'sent' ? false : true;
        // Logic fix: Sent = negative. Earned = positive.
        // My transform logic in fetchData: points = abs(units)*100.
        // And isPositive = units > 0.
        // So I should just check if units > 0 from raw data... but I don't have raw here. I have points (positive).
        // Wait, I should rely on 'type'.
        // Backend types: 'purchase', 'redemption', 'bonus', 'referral', 'sent'.
        // My frontend types: 'earned', 'redeemed', 'expired', 'bonus', 'referral'.
        // I need to add 'sent' to frontend types.
        return null; // Logic is handled in render below
      },
      // ... I'll use the existing render logic which was:
      // render: (points: number, record: RewardTransaction) => {
      //   const isPositive = ['earned', 'bonus', 'referral'].includes(record.type);
      //   // ...
      // }
      // I need to ensure 'sent' is handled as negative.
      // But fetchData maps 'sent' to... what?
      // "item.source === 'redemption' ? 'redeemed' ..."
      // I need to update fetchData mapping too.
    },
    {
      title: 'Order ID',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (orderId: string) => orderId ? (
        <Button type="link" size="small" onClick={() => message.info(`View invoice for ${orderId}`)}>
          {orderId}
        </Button>
      ) : 'N/A',
      width: 130,
    },
  ];

  // Custom render for columns to handle types better
  const renderAmount = (points: number, record: RewardTransaction) => {
    const isPositive = points >= 0;
    const gasAmount = (Math.abs(points) * 0.01).toFixed(2);
    return (
      <Text strong style={{ color: isPositive ? '#52c41a' : '#ff4d4f' }}>
        {isPositive ? '+' : '-'}
        {gasAmount} M³
      </Text>
    );
  };

  // Overwriting columns to use renderAmount
  const columnsWithRender = [
    transactionColumns[0],
    transactionColumns[1],
    transactionColumns[2],
    { ...transactionColumns[3], render: renderAmount },
    transactionColumns[4]
  ];


  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <p>Loading rewards...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: 24,
          marginBottom: 16,
          borderRadius: 8,
          color: 'white',
        }}
      >
        <Row gutter={16} align="middle">
          <Col flex={1}>
            <Space direction="vertical" size={4}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FireOutlined style={{ fontSize: 32 }} />
                <div>
                  <Title level={4} style={{ color: 'white', margin: 0 }}>
                    Gas Rewards
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                    Earn free gas with every purchase
                  </Text>
                </div>
              </div>
            </Space>
          </Col>
          <Col>
            <div style={{ textAlign: 'right' }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                Available Gas Rewards
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
                <Title level={2} style={{ color: 'white', margin: '8px 0 0 0' }}>
                  {((balance?.points || 0) * 0.01).toFixed(2)} M³
                </Title>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => setSendToMeterModalVisible(true)}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}
                >
                  Send to Meter
                </Button>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                Cubic Meters
              </Text>
            </div>
          </Col>
        </Row>

        <Text
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 12,
            display: 'block',
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          Lifetime: {((balance?.lifetime_points || 0) * 0.01).toFixed(2)} M³ earned
        </Text>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Overview Tab */}
          <TabPane
            tab={
              <span>
                <GiftOutlined />
                Overview
              </span>
            }
            key="overview"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* How to Earn Gas Rewards */}
              <Card title="How to Earn Gas Rewards" size="small">
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {/* Shop and get free gas */}
                  <Card
                    size="small"
                    style={{ background: '#fff7e6', border: '1px solid #ffd591' }}
                  >
                    <Row align="middle" gutter={16}>
                      <Col>
                        <ShoppingOutlined style={{ fontSize: 32, color: '#ff7300' }} />
                      </Col>
                      <Col flex={1}>
                        <Text strong>Shop and get free gas</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Earn gas rewards as you shop with BIG stores
                        </Text>
                      </Col>
                      <Col>
                        <FireOutlined style={{ fontSize: 20, color: '#ff7300' }} />
                      </Col>
                    </Row>
                  </Card>

                  {/* Share your gas rewards */}
                  <Card
                    size="small"
                    style={{ background: '#f9f0ff', border: '1px solid #d3adf7' }}
                  >
                    <Row align="middle" gutter={16}>
                      <Col>
                        <GiftOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                      </Col>
                      <Col flex={1}>
                        <Text strong>Share your gas rewards with your friends</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          While shopping share your gas rewards to your friend's meter ID
                        </Text>
                      </Col>
                      <Col>
                        <ShareAltOutlined style={{ fontSize: 20, color: '#722ed1' }} />
                      </Col>
                    </Row>
                  </Card>

                  {/* Share your experience */}
                  <Card
                    size="small"
                    style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}
                  >
                    <Row align="middle" gutter={16}>
                      <Col>
                        <CommentOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                      </Col>
                      <Col flex={1}>
                        <Text strong>Share your experience with friends</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Inform friends and family, this information should be known by all
                        </Text>
                      </Col>
                      <Col>
                        <TeamOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                      </Col>
                    </Row>
                  </Card>

                  {/* Invite friends */}
                  <Card
                    size="small"
                    style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}
                  >
                    <Row align="middle" gutter={16}>
                      <Col>
                        <UserAddOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                      </Col>
                      <Col flex={1}>
                        <Text strong>Invite friends</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Copy the link and share with friends to sign up
                        </Text>
                      </Col>
                      <Col>
                        <LinkOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                      </Col>
                    </Row>
                  </Card>
                </Space>
              </Card>

              {/* Invite Friends - Share Link */}
              <Card
                title={
                  <Space>
                    <ShareAltOutlined />
                    Share BIG Company
                  </Space>
                }
                size="small"
              >
                <Paragraph type="secondary">
                  Copy the link and share with friends and family to sign up!
                </Paragraph>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    size="large"
                    value={`${FRONTEND_URL}/consumer`}
                    readOnly
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                    }}
                  />
                  <Button
                    size="large"
                    icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(`${FRONTEND_URL}/consumer`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                      message.success('Link copied to clipboard!');
                    }}
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button
                    size="large"
                    type="primary"
                    icon={<ShareAltOutlined />}
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Join BIG Company',
                          text: 'Shop and earn free gas rewards!',
                          url: `${FRONTEND_URL}/consumer`,
                        });
                      } else {
                        message.info('Share link copied to clipboard!');
                      }
                    }}
                  >
                    Share
                  </Button>
                </Space.Compact>
              </Card>
            </Space>
          </TabPane>

          {/* History Tab */}
          <TabPane
            tab={
              <span>
                <ClockCircleOutlined />
                History
              </span>
            }
            key="history"
          >
            <Table
              dataSource={transactions}
              columns={columnsWithRender}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{
                emptyText: (
                  <Empty
                    description="No history yet"
                    image={<ClockCircleOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
                  >
                    <Paragraph type="secondary">
                      Start earning points by buying gas or referring friends!
                    </Paragraph>
                  </Empty>
                ),
              }}
            />
          </TabPane>

        </Tabs>
      </Card>

      {/* Send to Meter Modal */}
      <Modal title="Send Gas Rewards to Meter" open={sendToMeterModalVisible} onCancel={() => setSendToMeterModalVisible(false)} footer={null}>
        <Form form={sendToMeterForm} onFinish={handleSendToMeter} layout="vertical">
          <Alert message={`Available Balance: ${((balance?.points || 0) * 0.01).toFixed(2)} M³`} type="info" showIcon style={{ marginBottom: 16 }} />
          <Form.Item name="meterId" label="Recipient Meter Number (or ID)" rules={[{ required: true }]}>
            <Input placeholder="Enter meter number" />
          </Form.Item>
          <Form.Item name="amount" label="Amount (M³)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} step={0.01} min={0.01} max={(balance?.points || 0) * 0.01} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={redeeming} block>Send Now</Button>
        </Form>
      </Modal>
    </div>
  );
};

export default RewardsPage;
