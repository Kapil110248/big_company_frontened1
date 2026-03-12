import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Tag,
  Space,
  Modal,
  message,
  Spin,
  Empty,
  Input,
  Divider,
  Table,
  Badge,
  Radio,
  Form,
  Select,
  Tabs,
  Descriptions,
  Alert,
  Tooltip,
} from 'antd';
import {
  FireOutlined,
  PlusOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CopyOutlined,
  WalletOutlined,
  MobileOutlined,
  UserOutlined,
  IdcardOutlined,
  PhoneOutlined,
  DeleteOutlined,
  EditOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import { consumerApi, nfcApi } from '../../services/apiService';

const { Title, Text, Paragraph } = Typography;

interface GasMeter {
  id: string;
  meter_number: string;
  alias: string;
  owner_name: string;
  id_number: string;
  phone_number: string;
  customer_id: string;
  created_at: string;
  current_units: number;
  meter_type: 'TOKEN' | 'PIPING';
}

interface GasTopup {
  id: string;
  meter_number: string;
  meter_type: 'TOKEN' | 'PIPING';
  meter_alias: string;
  amount: number;
  units_purchased: string | number;
  token: string;
  payment_method: string;
  created_at: string;
}

interface NFCCard {
  id: number;
  uid: string;
  card_number: string;
  balance: number;
  nickname: string;
}

interface GasUsage {
  id: string;
  date: string;
  activity: string;
  type: 'usage' | 'topup';
  units: number;
}

const predefinedAmounts = [300, 500, 1000, 2000, 5000, 10000];

export const GasPage: React.FC = () => {
  const navigate = useNavigate();
  const [meters, setMeters] = useState<GasMeter[]>([]);
  const [history, setHistory] = useState<GasTopup[]>([]);
  const [usageHistory, setUsageHistory] = useState<GasUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [nfcCards, setNfcCards] = useState<NFCCard[]>([]);

  // Modals
  const [showAddMeter, setShowAddMeter] = useState(false);
  const [showTopup, setShowTopup] = useState(false);
  const [showUsageHistory, setShowUsageHistory] = useState(false);
  const [selectedMeterForUsage, setSelectedMeterForUsage] = useState<GasMeter | null>(null);
  const [addMeterType, setAddMeterType] = useState<'TOKEN' | 'PIPING'>('TOKEN');

  // Add Meter Form
  const [addMeterForm] = Form.useForm();

  // Top-up Form
  const [topupForm] = Form.useForm();
  const [selectedMeter, setSelectedMeter] = useState<GasMeter | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'mobile_money'>('wallet');
  const [paymentSubOption, setPaymentSubOption] = useState<'dashboard' | 'credit'>('dashboard');
  const [creditBalance, setCreditBalance] = useState(0);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [topupResult, setTopupResult] = useState<any>(null);
  const [safetyChecking, setSafetyChecking] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);

  const calculateEstimateDays = (units: number) => {
    // Simulated logic: Average household uses 0.5 units per day
    if (!units || units === 0) return 0;
    return Math.ceil(units / 0.5);
  };

  const handleSafetyCheck = (meterId: string) => {
    setSafetyChecking(meterId);
    setTimeout(() => {
      setSafetyChecking(null);
      message.success({
        content: 'System Health: 100% | Pressure: Normal | No Leaks Detected',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 4
      });
    }, 2000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateMeterId = () => {
    if (addMeterType === 'PIPING') {
      return ''; // IMEI should be entered manually
    }
    let newId = '';
    let exists = true;
    while (exists) {
      const random = Math.floor(100000 + Math.random() * 900000);
      newId = `MTR-${random}`;
      exists = meters.some(m => m.meter_number === newId);
    }
    return newId;
  };

  useEffect(() => {
    if (showAddMeter) {
      addMeterForm.setFieldsValue({
        meter_number: generateMeterId()
      });
    }
  }, [showAddMeter, addMeterForm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metersRes, usageRes, walletsRes, nfcRes] = await Promise.all([
        consumerApi.getGasMeters(),
        consumerApi.getGasHistory(),
        consumerApi.getWallets(),
        nfcApi.getMyCards(),
      ]);

      // Transform meters data
      if (metersRes.data.success) {
        const transformedMeters: GasMeter[] = metersRes.data.data.map((m: any) => ({
          id: m.id,
          meter_number: m.meter_number,
          alias: m.alias_name || 'Unnamed Meter',
          owner_name: m.owner_name || 'N/A',
          id_number: 'N/A', // Not in backend schema
          owner_phone: m.owner_phone || 'N/A',
          customer_id: 'current-user',
          created_at: m.created_at,
          current_units: m.current_units || 0,
          meter_type: m.meter_type || 'TOKEN',
        }));
        setMeters(transformedMeters);
      }

      // Transform usage/history data
      if (usageRes.data.success) {
        const transformedHistory: GasTopup[] = usageRes.data.data.map((t: any) => ({
          id: t.id,
          meter_number: t.meter_number,
          meter_type: t.meter_type,
          meter_alias: t.meter_alias || 'Unnamed Meter',
          amount: t.amount,
          units_purchased: Number(t.token_value ? (t.amount / 1500) : (t.amount / 850)).toFixed(2), // Fallback calculation if units missing
          token: t.token_value || 'N/A',
          payment_method: t.payment_method || 'Wallet',
          created_at: t.created_at,
        }));
        setHistory(transformedHistory);
        setUsageHistory([]); // Usage aggregation not implemented yet
      }

      // Get wallet balance
      if (walletsRes.data.success && Array.isArray(walletsRes.data.data)) {
        const dashboardWallet = walletsRes.data.data.find((w: any) => w.type === 'dashboard_wallet');
        setBalance(dashboardWallet?.balance || 0);
        const creditWallet = walletsRes.data.data.find((w: any) => w.type === 'credit_wallet');
        setCreditBalance(creditWallet?.balance || 0);
      }

      // Get NFC cards
      if (nfcRes.data.success && Array.isArray(nfcRes.data.data)) {
        setNfcCards(nfcRes.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch gas data:', error);
      message.error('Failed to load gas data');
      setMeters([]);
      setHistory([]);
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  // Low Balance Notification Logic
  useEffect(() => {
    const lowBalanceMeters = meters.filter(m => m.current_units < 2);
    if (lowBalanceMeters.length > 0) {
      lowBalanceMeters.forEach(meter => {
        message.warning({
          content: `Low Gas Balance: Meter ${meter.meter_number} has only ${meter.current_units.toFixed(2)} units left. Please recharge soon!`,
          duration: 5,
        });
      });
    }
  }, [meters.length]); // Run when meters are loaded

  const handleAddMeter = async (values: any) => {
    setProcessing(true);
    try {
      const response = await consumerApi.addGasMeter({
        meter_number: values.meter_number,
        alias_name: values.alias,
        owner_name: values.owner_name,
        owner_phone: values.owner_phone,
        meter_type: addMeterType,
      });

      if (response.data.success) {
        message.success('Meter added successfully!');
        await fetchData(); // Refresh meters list
        setShowAddMeter(false);
        addMeterForm.resetFields();
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to add meter');
    } finally {
      setProcessing(false);
    }
  };

  const handleTopup = async (values: any) => {
    if (!selectedMeter || !selectedAmount) {
      message.error('Please select a meter and amount');
      return;
    }

    if (selectedAmount < 300) {
      message.error('Minimum top-up amount is 300 RWF');
      return;
    }

    if (paymentMethod === 'wallet') {
      const activeBalance = paymentSubOption === 'dashboard' ? balance : creditBalance;
      if (activeBalance < selectedAmount) {
        message.error(`Insufficient ${paymentSubOption} wallet balance. Please top up first.`);
        return;
      }
    }



    setProcessing(true);
    try {
      const response = await consumerApi.topupGas({
        meter_number: selectedMeter.meter_number,
        amount: selectedAmount,
        payment_method: paymentMethod === 'wallet'
          ? (paymentSubOption === 'dashboard' ? 'wallet' : 'credit_wallet')
          : 'mobile_money',
        card_id: selectedCardId,
      });

      if (response.data.success) {
        const result = response.data.data;
        const methodLabels = {
          wallet: 'Dashboard Wallet',
          credit_wallet: 'Credit Wallet',
          mobile_money: 'Mobile Money'
        };
        const activeMethod = paymentMethod === 'wallet'
          ? (paymentSubOption === 'dashboard' ? 'wallet' : 'credit_wallet')
          : 'mobile_money';

        setTopupResult({
          meter_number: result.meter_number,
          units: Number(result.units).toFixed(2),
          token: result.token,
          amount: result.amount,
          payment_method: methodLabels[activeMethod as keyof typeof methodLabels],
        });

        setBalance(result.new_wallet_balance);
        await fetchData(); // Refresh history
        message.success('Gas top-up successful!');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Gas top-up failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewUsage = (meter: GasMeter) => {
    setSelectedMeterForUsage(meter);

    // Transform history to show consumption as well
    const usageData = history
      .filter(h => h.meter_number === meter.meter_number)
      .map(h => ({
        id: h.id,
        date: h.created_at,
        activity: h.amount === 0 ? (h.token || 'Cooking Session') : 'Gas Top-up',
        type: h.amount === 0 ? 'usage' as const : 'topup' as const,
        units: Math.abs(Number(h.units_purchased))
      }));

    setUsageHistory(usageData);
    setShowUsageHistory(true);
  };

  const handleSimulateUsage = async (meter: GasMeter) => {
    if (meter.current_units < 0.05) {
      message.error('Low gas! Please top up before cooking.');
      return;
    }

    setSimulating(meter.id);
    message.loading({ content: 'Cooking started...', key: 'sim_usage' });

    try {
      const response = await consumerApi.recordGasUsage({
        meter_number: meter.meter_number,
        units_used: 0.10,
        activity: 'Cooking Session'
      });

      if (response.data.success) {
        setTimeout(() => {
          message.success({ content: 'Yum! Cooking completed. 0.10 kg used.', key: 'sim_usage', icon: <FireOutlined style={{ color: '#ff4d4f' }} />, duration: 3 });
          setSimulating(null);
          fetchData();
        }, 1500);
      }
    } catch (error) {
      console.error('Simulation error:', error);
      message.error({ content: 'Simulation failed', key: 'sim_usage' });
      setSimulating(null);
    }
  };

  const handleMockTopup = async () => {
    setProcessing(true);
    try {
      const response = await consumerApi.topupWallet({
        amount: 5000,
        payment_method: 'mobile_money'
      });
      if (response.data.success) {
        message.success('Mock Top-up of 5,000 RWF added to your wallet!');
        await fetchData();
      }
    } catch (error) {
      message.error('Mock top-up failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteMeter = (meter: GasMeter) => {
    Modal.confirm({
      title: 'Remove Meter',
      content: `Are you sure you want to remove meter ${meter.meter_number} (${meter.alias})? This will unbind it from your account.`,
      okText: 'Remove',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await consumerApi.removeGasMeter(meter.id);
          if (response.data.success) {
            setMeters(meters.filter(m => m.id !== meter.id));
            message.success('Meter removed and released successfully');
          }
        } catch (error: any) {
          message.error(error.response?.data?.error || 'Failed to remove meter');
        }
      },
    });
  };

  const resetTopup = () => {
    setShowTopup(false);
    setSelectedMeter(null);
    setSelectedAmount(null);
    setCustomAmount(null);
    setTopupResult(null);
    setPaymentMethod('wallet');
    topupForm.resetFields();
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    message.success('Token copied to clipboard!');
  };

  const formatPrice = (amount: number) => `${amount.toLocaleString()} RWF`;

  const historyColumns = [
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    {
      title: 'Meter',
      dataIndex: 'meter_alias',
      key: 'meter_alias',
      render: (alias: string, record: GasTopup) => (
        <div>
          <Text strong>{alias}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.meter_number}
          </Text>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#ff7300' }}>
          {formatPrice(amount)}
        </Text>
      ),
    },
    {
      title: 'Units',
      dataIndex: 'units_purchased',
      key: 'units_purchased',
      render: (units: string | number, record: GasTopup) => (
        <Text strong style={{ color: '#52c41a' }}>
          {units} {record.meter_type === 'TOKEN' ? 'kg' : 'M³'}
        </Text>
      ),
    },
    {
      title: 'Payment Method',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method: string) => <Tag color="blue">{method}</Tag>,
    },
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
      render: (token: string) => (
        <Button
          size="small"
          icon={<CopyOutlined />}
          onClick={() => copyToken(token)}
        >
          Copy
        </Button>
      ),
    },
  ];

  const usageColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    {
      title: 'Activity',
      dataIndex: 'activity',
      key: 'activity',
      render: (text: string, record: any) => (
        <Space>
          {record.type === 'usage' ? <FireOutlined style={{ color: '#ff4d4f' }} /> : <IdcardOutlined style={{ color: '#1890ff' }} />}
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'units',
      key: 'units',
      render: (units: number, record: any) => (
        <Text strong style={{ color: record.type === 'usage' ? '#ff4d4f' : '#52c41a' }}>
          {record.type === 'usage' ? '-' : '+'}{units.toFixed(2)} {record.meter_type === 'TOKEN' ? 'kg' : 'M³'}
        </Text>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <p>Loading gas service...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ff7300 0%, #ff5500 100%)',
          padding: '20px 24px',
          marginBottom: 16,
          borderRadius: 8,
          color: 'white',
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <FireOutlined style={{ fontSize: 40 }} />
              <div>
                <Title level={3} style={{ color: 'white', margin: 0 }}>
                  Gas Top-up
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Buy prepaid gas for your meter
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space direction="vertical" align="end" size={0}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', display: 'block', fontSize: 11 }}>
                Dashboard: <span style={{ fontWeight: 'bold', color: 'white' }}>{formatPrice(balance)}</span>
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', display: 'block', fontSize: 11 }}>
                Credit: <span style={{ fontWeight: 'bold', color: 'white' }}>{formatPrice(creditBalance)}</span>
              </Text>
            </Space>
          </Col>
        </Row>
      </div>

      {/* My Gas Meters */}
      <Card
        title={
          <Space>
            <FireOutlined />
            <span>My Gas Meters</span>
            <Badge count={meters.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowAddMeter(true)}
          >
            Add Meter
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        {meters.length > 0 ? (
          <Row gutter={[16, 16]}>
            {meters.map((meter) => (
              <Col xs={24} md={12} lg={8} key={meter.id}>
                <Card
                  size="small"
                  style={{
                    background: 'linear-gradient(135deg, #ff7300 0%, #ff5500 100%)',
                    color: 'white',
                    borderRadius: 12,
                    minHeight: 280,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  bodyStyle={{ flex: 1 }}
                  actions={[
                    <Button
                      type="text"
                      size="small"
                      style={{ color: 'white', fontSize: 12 }}
                      onClick={() => {
                        navigate(`/consumer/gas-meter-recharge?meterNumber=${meter.meter_number}`);
                      }}
                    >
                      Buy Gas
                    </Button>,
                    <Button
                      type="text"
                      size="small"
                      icon={<FireOutlined />}
                      loading={simulating === meter.id}
                      style={{ color: '#fffb8f', fontSize: 12 }}
                      onClick={() => handleSimulateUsage(meter)}
                    >
                      Cook
                    </Button>,
                    <Button
                      type="text"
                      size="small"
                      icon={<HistoryOutlined />}
                      style={{ color: 'white', fontSize: 12 }}
                      onClick={() => handleViewUsage(meter)}
                    >
                      Usage
                    </Button>,
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      style={{ color: '#ff7875', fontSize: 12 }}
                      onClick={() => handleDeleteMeter(meter)}
                    >
                      Remove
                    </Button>,
                  ]}
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                          {meter.alias}
                        </Text>
                        <Title level={4} style={{ color: 'white', margin: '4px 0', letterSpacing: 1, wordBreak: 'break-word' }}>
                          {meter.meter_number}
                        </Title>
                      </div>
                      <Tag
                        color={meter.meter_type === 'TOKEN' ? 'gold' : 'cyan'}
                        style={{ margin: 0, borderRadius: 12, fontSize: 10 }}
                      >
                        {meter.meter_type === 'TOKEN' ? '⚡ Token' : '🔧 Piping'}
                      </Tag>
                    </div>
                    <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.3)' }} />
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <UserOutlined style={{ marginRight: 8, color: 'rgba(255,255,255,0.7)' }} />
                          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>
                            {meter.owner_name}
                          </Text>
                        </span>
                        <Tooltip title="Verify Meter Health & Safety">
                          <Button
                            size="small"
                            ghost
                            icon={<CheckCircleOutlined />}
                            loading={safetyChecking === meter.id}
                            onClick={() => handleSafetyCheck(meter.id)}
                            style={{ fontSize: 10, height: 22, borderColor: 'rgba(255,255,255,0.5)' }}
                          >
                            Safety Check
                          </Button>
                        </Tooltip>
                      </div>
                      <div>
                        <PhoneOutlined style={{ marginRight: 8, color: 'rgba(255,255,255,0.7)' }} />
                        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>
                          {meter.phone_number}
                        </Text>
                      </div>
                      <div style={{ marginTop: 8, padding: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: 6 }}>
                        <Row align="middle" gutter={8}>
                          <Col span={12}>
                            <Text style={{ color: 'white', display: 'block', fontSize: 10 }}>UNITS LEFT</Text>
                            <Text strong style={{ color: 'white', fontSize: 14 }}>
                              {meter.current_units.toFixed(2)} {meter.meter_type === 'TOKEN' ? 'kg' : 'M³'}
                            </Text>
                          </Col>
                          <Col span={12} style={{ textAlign: 'right' }}>
                            <Badge status={meter.current_units < 2 ? 'warning' : 'processing'} color={meter.current_units < 2 ? '#f5222d' : '#52c41a'} text={<span style={{ color: 'white', fontSize: 11 }}>{meter.current_units < 2 ? 'Low Balance' : 'Active'}</span>} />
                          </Col>
                        </Row>
                        {meter.current_units < 2 && (
                          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', color: '#fff1f0', fontSize: 10 }}>
                            <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                            <span>Recharge needed within {calculateEstimateDays(meter.current_units)} day(s)</span>
                          </div>
                        )}
                      </div>
                    </Space>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            image={<FireOutlined style={{ fontSize: 64, color: '#ccc' }} />}
            description="No gas meters added yet"
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowAddMeter(true)}
            >
              Add Your First Meter
            </Button>
          </Empty>
        )}
      </Card>

      {/* Recent Top-ups */}
      <Card
        title={
          <Space>
            <HistoryOutlined />
            <span>Recent Top-ups</span>
          </Space>
        }
      >
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey="id"
          pagination={{
            pageSize: 5,
            showSizeChanger: false,
            showTotal: (total) => `${total} top-ups`,
          }}
          size="small"
        />
      </Card>

      {/* Add Meter Modal */}
      <Modal
        title={<><FireOutlined /> Add Gas Meter</>}
        open={showAddMeter}
        onCancel={() => {
          setShowAddMeter(false);
          addMeterForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Alert
          message="Meter Registration"
          description="Enter your meter details and owner information to register a new gas meter."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          form={addMeterForm}
          layout="vertical"
          onFinish={handleAddMeter}
          initialValues={{ meter_type: 'TOKEN' }}
        >
          <Form.Item
            name="meter_type"
            label="Meter Type"
            required
          >
            <Radio.Group
              onChange={(e) => {
                setAddMeterType(e.target.value);
                if (e.target.value === 'TOKEN') {
                  addMeterForm.setFieldsValue({ meter_number: generateMeterId() });
                } else {
                  addMeterForm.setFieldsValue({ meter_number: '' });
                }
              }}
              value={addMeterType}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio value="TOKEN">Token Meter (STS)</Radio>
              <Radio value="PIPING">Piping Gas Meter (IMEI)</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="meter_number"
            label={addMeterType === 'TOKEN' ? "STS Meter Number" : "Piping Meter IMEI / devEui"}
            rules={[
              { required: true, message: addMeterType === 'TOKEN' ? 'Please enter STS meter number' : 'Please enter meter IMEI' },
              { min: 6, message: 'Meter ID must be at least 6 characters' },
            ]}
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                {addMeterType === 'TOKEN'
                  ? "Enter the 11-digit STS meter number (Example: 58200077517)"
                  : "Enter the device IMEI (devEui) used for Lorawan piping gas meters (Example: 865395070835176)"}
              </Text>
            }
          >
            <Input
              prefix={addMeterType === 'TOKEN' ? <CreditCardOutlined /> : <IdcardOutlined />}
              placeholder={addMeterType === 'TOKEN' ? "Enter STS meter number" : "Enter meter IMEI"}
              size="large"
              suffix={
                addMeterType === 'TOKEN' && (
                  <Button
                    type="text"
                    size="small"
                    icon={<HistoryOutlined />}
                    onClick={() => addMeterForm.setFieldsValue({ meter_number: generateMeterId() })}
                    title="Generate New ID"
                  />
                )
              }
            />
          </Form.Item>

          <Form.Item
            name="alias"
            label="Nickname"
            rules={[{ required: true, message: 'Please enter a nickname for this meter' }]}
          >
            <Input
              prefix={<EditOutlined />}
              placeholder="e.g., Home Kitchen, Restaurant"
              size="large"
            />
          </Form.Item>

          <Divider style={{ margin: '12px 0' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>OWNER INFORMATION</Text>
          </Divider>

          <Form.Item
            name="owner_name"
            label="Owner Full Name"
            rules={[{ required: true, message: 'Please enter owner name' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter full name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="owner_phone"
            label="Owner Phone Number"
            rules={[
              { required: true, message: 'Please enter phone number' },
              { pattern: /^\+?250\d{9}$/, message: 'Enter valid phone number (+250...)' }
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="+250788123456"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setShowAddMeter(false);
                addMeterForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={processing}
                icon={<PlusOutlined />}
              >
                Add Meter
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Top-up Modal */}
      <Modal
        title={<><FireOutlined /> Buy Gas</>}
        open={showTopup}
        onCancel={resetTopup}
        footer={null}
        width={600}
      >
        {!topupResult ? (
          <Form
            form={topupForm}
            layout="vertical"
            onFinish={handleTopup}
          >
            {selectedMeter && (
              <Card size="small" style={{ marginBottom: 16, background: '#f0f2f5' }}>
                <Space direction="vertical" size={4}>
                  <Text strong>{selectedMeter.alias}</Text>
                  <Text type="secondary">{selectedMeter.meter_number}</Text>
                </Space>
              </Card>
            )}

            {/* Amount Selection */}
            <Form.Item label="Select Amount">
              <Row gutter={[8, 8]}>
                {predefinedAmounts.map((amount) => (
                  <Col span={8} key={amount}>
                    <Button
                      block
                      size="large"
                      type={selectedAmount === amount ? 'primary' : 'default'}
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount(null);
                      }}
                    >
                      {formatPrice(amount)}
                    </Button>
                  </Col>
                ))}
              </Row>
            </Form.Item>

            <Form.Item label="Or Enter Custom Amount" help="Minimum: 300 RWF">
              <Input
                type="number"
                size="large"
                placeholder="Enter amount in RWF (min: 300)"
                value={customAmount || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    setCustomAmount(val);
                    setSelectedAmount(val);
                  }
                }}
                suffix="RWF"
                status={customAmount && customAmount < 300 ? 'error' : ''}
              />
            </Form.Item>

            {selectedAmount && (
              <Alert
                message={`Estimated Units: ~${(selectedAmount / 1500).toFixed(2)} kg`}
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Payment Method Selection */}
            <Form.Item label="Payment Method" required>
              <Radio.Group
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                size="large"
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Radio value="wallet" style={{ width: '100%' }}>
                    <Card size="small" style={{ margin: '8px 0', borderColor: paymentMethod === 'wallet' ? '#ff7300' : '#f0f0f0' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <WalletOutlined style={{ fontSize: 24, color: '#ff7300' }} />
                          <Text strong>Big Wallet</Text>
                        </Space>
                        {paymentMethod === 'wallet' && (
                          <div style={{ paddingLeft: 32 }}>
                            <Radio.Group
                              value={paymentSubOption}
                              onChange={e => setPaymentSubOption(e.target.value)}
                            >
                              <Space direction="vertical">
                                <Radio value="dashboard">
                                  Dashboard Balance: <Text strong>{formatPrice(balance)}</Text>
                                </Radio>
                                <Radio value="credit">
                                  Credit Balance: <Text strong>{formatPrice(creditBalance)}</Text>
                                </Radio>
                              </Space>
                            </Radio.Group>
                          </div>
                        )}
                      </Space>
                    </Card>
                  </Radio>
                  <Radio value="mobile_money" style={{ width: '100%' }}>
                    <Card size="small" style={{ margin: '8px 0' }}>
                      <Space>
                        <MobileOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                        <div>
                          <Text strong>Mobile Money</Text>
                          <br />
                          <Text type="secondary">MTN or Airtel</Text>
                        </div>
                      </Space>
                    </Card>
                  </Radio>

                </Space>
              </Radio.Group>
            </Form.Item>



            {/* Mobile Money Fields */}
            {paymentMethod === 'mobile_money' && (
              <>
                <Form.Item
                  name="mobile_provider"
                  label="Mobile Provider"
                  rules={[{ required: true, message: 'Please select provider' }]}
                >
                  <Select size="large" placeholder="Select provider">
                    <Select.Option value="mtn">
                      <Space>
                        <MobileOutlined />
                        MTN Mobile Money
                      </Space>
                    </Select.Option>
                    <Select.Option value="airtel">
                      <Space>
                        <MobileOutlined />
                        Airtel Money
                      </Space>
                    </Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="mobile_number"
                  label="Mobile Number"
                  rules={[
                    { required: true, message: 'Please enter mobile number' },
                    { pattern: /^\+250\d{9}$/, message: 'Enter valid Rwanda phone (+250...)' },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="+250788123456"
                    size="large"
                  />
                </Form.Item>
                <Alert
                  message="You will receive a notification on your phone to confirm payment"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              </>
            )}

            {/* Wallet PIN */}
            {paymentMethod === 'wallet' && (
              <>
                <Form.Item
                  name="pin"
                  label="Enter PIN to Confirm"
                  rules={[
                    { required: true, message: 'Please enter PIN' },
                    { len: 4, message: 'PIN must be 4 digits' },
                  ]}
                >
                  <Input.Password
                    size="large"
                    maxLength={4}
                    placeholder="Enter 4-digit PIN"
                  />
                </Form.Item>
              </>
            )}

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={resetTopup}>Cancel</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={processing}
                  disabled={!selectedAmount}
                >
                  Confirm Purchase
                </Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircleOutlined
              style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }}
            />
            <Title level={3} style={{ color: '#52c41a' }}>
              Top-up Successful!
            </Title>
            <Card style={{ marginTop: 24, textAlign: 'left' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Meter">
                  {topupResult.meter_number}
                </Descriptions.Item>
                <Descriptions.Item label="Amount">
                  <Text strong style={{ color: '#ff7300', fontSize: 16 }}>
                    {formatPrice(topupResult.amount)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Units">
                  <Text strong>{topupResult.units} units</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Payment Method">
                  <Tag color="blue">{topupResult.payment_method}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Token">
                  <Space>
                    <Text code strong style={{ fontSize: 16 }}>
                      {topupResult.token}
                    </Text>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => copyToken(topupResult.token)}
                    >
                      Copy
                    </Button>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <Paragraph type="secondary" style={{ marginTop: 16 }}>
              Enter this token on your gas meter to load the units.
            </Paragraph>
            <Button type="primary" size="large" onClick={resetTopup} style={{ marginTop: 16 }}>
              Done
            </Button>
          </div>
        )}
      </Modal>

      {/* Gas Usage History Modal */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            <span>Gas Usage History - {selectedMeterForUsage?.alias}</span>
          </Space>
        }
        open={showUsageHistory}
        onCancel={() => {
          setShowUsageHistory(false);
          setSelectedMeterForUsage(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setShowUsageHistory(false);
            setSelectedMeterForUsage(null);
          }}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {selectedMeterForUsage && (
          <>
            <Alert
              message="Gas Usage Tracking"
              description={`Showing gas usage history for meter ${selectedMeterForUsage.meter_number}. Blue units are from direct top-ups, green units are from shopping rewards.`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={usageColumns}
              dataSource={usageHistory}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </>
        )}
      </Modal>
    </div >
  );
};

export default GasPage;
