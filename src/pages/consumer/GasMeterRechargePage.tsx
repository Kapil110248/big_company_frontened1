import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Card,
    Row,
    Col,
    Typography,
    Button,
    Form,
    Input,
    Select,
    Radio,
    Space,
    Tag,
    Table,
    Modal,
    message,
    Spin,
    Alert,
    Divider,
    Badge,
    Tooltip,
    Steps,
} from 'antd';
import {
    FireOutlined,
    KeyOutlined,
    HistoryOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CopyOutlined,
    PrinterOutlined,
    WalletOutlined,
    MobileOutlined,
    CreditCardOutlined,
    ThunderboltOutlined,
    InfoCircleOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { gasMeterRechargeApi, consumerApi, nfcApi } from '../../services/apiService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface RechargeResult {
    transactionId: number;
    meterNumber: string;
    meterType: 'TOKEN' | 'PIPING';
    amount: number;
    units?: number;
    token?: string;
    apiReference?: string;
    message?: string;
}

interface RechargeTransaction {
    id: number;
    meter_number: string;
    meter_type: string;
    amount: number;
    token_value: string | null;
    api_reference: string | null;
    status: string;
    payment_method: string;
    created_at: string;
}

const PREDEFINED_AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

const GasMeterRechargePage: React.FC = () => {
    const [form] = Form.useForm();
    const [searchParams] = useSearchParams();
    const printRef = useRef<HTMLDivElement>(null);

    // State
    const [currentStep, setCurrentStep] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [result, setResult] = useState<RechargeResult | null>(null);
    const [history, setHistory] = useState<RechargeTransaction[]>([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [nfcCards, setNfcCards] = useState<any[]>([]);
    const [registeredMeters, setRegisteredMeters] = useState<any[]>([]);
    const [metersLoading, setMetersLoading] = useState(false);

    // Form values
    const [meterType, setMeterType] = useState<'LORA_NB' | 'GPRS'>('LORA_NB');
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'mobile_money' | 'nfc_card'>('wallet');
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [pipingMode, setPipingMode] = useState<'ORDINARY' | 'TOKEN_PUSH'>('ORDINARY');

    useEffect(() => {
        loadInitialData();
        loadHistory();

        // Handle pre-filled meter number from query params
        const queryMeter = searchParams.get('meterNumber');
        if (queryMeter) {
            form.setFieldsValue({ meterNumber: queryMeter });
            message.info(`Ready to recharge meter ${queryMeter}`);
        }
    }, [searchParams]);

    const loadInitialData = async () => {
        setMetersLoading(true);
        try {
            const [walletsRes, nfcRes, metersRes] = await Promise.all([
                consumerApi.getWallets(),
                nfcApi.getMyCards(),
                consumerApi.getGasMeters(),
            ]);

            if (walletsRes.data.success && Array.isArray(walletsRes.data.data)) {
                const dashWallet = walletsRes.data.data.find((w: any) => w.type === 'dashboard_wallet');
                setWalletBalance(dashWallet?.balance || 0);
            }

            if (nfcRes.data.success && Array.isArray(nfcRes.data.data)) {
                setNfcCards(nfcRes.data.data);
            }

            if (metersRes.data.success && Array.isArray(metersRes.data.data)) {
                setRegisteredMeters(metersRes.data.data);
            }
        } catch (err) {
            console.error('Failed to load initial data:', err);
        } finally {
            setMetersLoading(false);
        }
    };

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await gasMeterRechargeApi.getHistory({ limit: 20 });
            if (res.data.success) {
                setHistory(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load recharge history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    // LoRaWAN-based recharge function removed per requirement to completely disable LoRaWAN recharge logic from frontend.

    const getEffectiveAmount = (): number => {
        return selectedAmount ?? (Number(customAmount) || 0);
    };

    const handleSubmit = async (values: any) => {
        const amount = getEffectiveAmount();
        const isPushToken = meterType === 'GPRS' && !!values.pipingToken;

        // Money amount is chosen directly now
        const cost = isPushToken ? 0 : amount;

        if (!isPushToken && amount < 1) {
            message.error('Minimum recharge amount is 1 RWF.');
            return;
        }

        if (!isPushToken && paymentMethod === 'wallet' && walletBalance < cost) {
            message.error(`Insufficient wallet balance. Available: ${walletBalance.toLocaleString()} RWF. Required: ${cost.toLocaleString()} RWF`);
            return;
        }

        if (paymentMethod === 'mobile_money' && !values.phone) {
            message.error('Please enter a phone number for mobile money payment.');
            return;
        }

        setProcessing(true);
        try {
            // Direct client-side Piping meter API call has been disabled. All recharges strictly flow through the backend gasMeterRechargeApi.initiate now.

            const response = await gasMeterRechargeApi.initiate({
                meterNumber: values.meterNumber?.trim(),
                // Differentiate logic: LORA_NB maps to TOKEN (Type A), GPRS maps to PIPING (Type B)
                meterType: meterType === 'LORA_NB' ? 'TOKEN' : 'PIPING',
                amount: amount,
                paymentMethod,
                phone: values.phone,
                cardId: values.cardId,
                token: values.pipingToken?.replace(/\s/g, ''),
                provider: meterType === 'LORA_NB' ? 'stronpower' : 'piping',
            });

            if (response.data.success) {
                const data = response.data.data;
                setResult({
                    transactionId: data.transactionId,
                    meterNumber: data.meterNumber,
                    meterType: data.meterType,
                    amount: data.amount,
                    units: data.units,
                    token: data.token,
                    apiReference: data.apiReference,
                    message: data.message,
                });
                setCurrentStep(1);
                message.success('Gas meter recharged successfully!');
                await loadHistory();
                if (paymentMethod === 'wallet') {
                    setWalletBalance((prev) => prev - amount);
                }
            }
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Recharge failed. Please try again.';
            message.error(msg);
        } finally {
            setProcessing(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setCurrentStep(0);
        setSelectedAmount(null);
        setCustomAmount('');
        form.resetFields();
    };

    const copyToken = (token: string) => {
        navigator.clipboard.writeText(token);
        message.success('Token copied to clipboard!');
    };

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent || !result) return;

        const printWindow = window.open('', '_blank', 'width=600,height=500');
        if (!printWindow) return;

        printWindow.document.write(`
      <html>
        <head>
          <title>Gas Meter Recharge Receipt</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; background: #fff; }
            .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 16px; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 14px; }
            .label { color: #666; }
            .value { font-weight: bold; }
            .token-block { 
              background: #f0f5ff; border: 2px solid #1890ff; border-radius: 8px; 
              padding: 16px; text-align: center; margin: 16px 0; 
            }
            .token-label { font-size: 12px; text-transform: uppercase; color: #666; }
            .token-value { font-size: 28px; font-weight: 900; letter-spacing: 4px; color: #1890ff; margin: 8px 0; }
            .footer { text-align: center; margin-top: 16px; border-top: 2px dashed #333; padding-top: 10px; font-size: 11px; color: #888; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size:20px;font-weight:bold;">🔥 GAS METER RECHARGE</div>
            <div style="font-size:12px;color:#888;">Big Company POS • ${new Date().toLocaleString()}</div>
          </div>
          <div class="row"><span class="label">Transaction ID:</span><span class="value">#${result.transactionId}</span></div>
          <div class="row"><span class="label">Meter Number:</span><span class="value">${result.meterNumber}</span></div>
          <div class="row"><span class="label">Meter Type:</span><span class="value">${result.meterType === 'TOKEN' ? 'Token-Based Prepaid' : 'Piping Gas Meter'}</span></div>
          <div class="row"><span class="label">Amount Paid:</span><span class="value">${result.amount.toLocaleString()} RWF</span></div>
          ${result.units ? `<div class="row"><span class="label">Gas Units:</span><span class="value">${result.units} ${result.meterType === 'TOKEN' ? 'kg' : 'm³'}</span></div>` : ''}
          ${result.apiReference ? `<div class="row"><span class="label">API Reference:</span><span class="value">${result.apiReference}</span></div>` : ''}
          ${result.token ? `
            <div class="token-block">
              <div class="token-label">⚡ ENTER THIS TOKEN INTO YOUR METER</div>
              <div class="token-value">${result.token}</div>
              <div style="font-size:11px;color:#666;">Type these digits into your gas meter keypad</div>
            </div>
          ` : `
            <div class="token-block" style="background:#f6ffed;border-color:#52c41a;">
              <div class="token-label" style="color:#52c41a;">✅ PIPING METER RECHARGED</div>
              <div style="margin-top:8px;font-size:14px;">Your meter has been credited automatically.<br/>No token entry required.</div>
            </div>
          `}
          <div class="footer">Thank you for using Big Company Gas Service<br/>Keep this receipt for your records</div>
        </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    // =============================================================
    // HISTORY TABLE COLUMNS
    // =============================================================
    const historyColumns = [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) =>
                new Date(date).toLocaleDateString('en-US', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                }),
        },
        {
            title: 'Meter',
            dataIndex: 'meter_number',
            key: 'meter_number',
            render: (num: string, rec: RechargeTransaction) => (
                <div>
                    <Text strong>{num}</Text>
                    <br />
                    <Tag color={rec.meter_type === 'TOKEN' ? 'blue' : 'green'} style={{ fontSize: 11 }}>
                        {rec.meter_type === 'TOKEN' ? '⚡ Token' : '🔧 Piping'}
                    </Tag>
                </div>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amt: number) => (
                <Text strong style={{ color: '#ff6b35' }}>{amt.toLocaleString()} RWF</Text>
            ),
        },
        {
            title: 'Token',
            dataIndex: 'token_value',
            key: 'token_value',
            render: (token: string | null, rec: RechargeTransaction) => {
                if (rec.meter_type === 'PIPING' || !token) {
                    return <Tag color="green">Auto-credited</Tag>;
                }
                return (
                    <Space>
                        <Text code style={{ fontSize: 11 }}>{token.substring(0, 10)}...</Text>
                        <Tooltip title="Copy full token">
                            <Button size="small" icon={<CopyOutlined />} onClick={() => copyToken(token)} />
                        </Tooltip>
                    </Space>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const cfg = {
                    SUCCESS: { color: 'green', icon: <CheckCircleOutlined /> },
                    FAILED: { color: 'red', icon: <CloseCircleOutlined /> },
                    PENDING: { color: 'orange', icon: <ReloadOutlined spin /> },
                }[status] || { color: 'default', icon: null };
                return <Tag color={cfg.color} icon={cfg.icon}>{status}</Tag>;
            },
        },
    ];

    // =============================================================
    // RENDER
    // =============================================================
    return (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 8px' }}>
            {/* ── HERO HEADER ─────────────────────────────────────── */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    borderRadius: 16,
                    padding: '28px 32px',
                    marginBottom: 24,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        position: 'absolute', top: -30, right: -30,
                        width: 120, height: 120,
                        background: 'rgba(255,107,53,0.15)',
                        borderRadius: '50%',
                    }}
                />
                <Row justify="space-between" align="middle">
                    <Col>
                        <Space align="center">
                            <div
                                style={{
                                    width: 56, height: 56, borderRadius: 14,
                                    background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 28, boxShadow: '0 4px 16px rgba(255,107,53,0.4)',
                                }}
                            >
                                🔥
                            </div>
                            <div>
                                <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>
                                    Piped Gas Meter Recharge
                                </Title>
                                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                                    Recharge LoRa / NB-IoT & GPRS Piped Gas Meters instantly
                                </Text>
                            </div>
                        </Space>
                    </Col>
                    <Col>
                        <div
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                borderRadius: 12, padding: '12px 20px',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.12)',
                            }}
                        >
                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, display: 'block' }}>
                                Wallet Balance
                            </Text>
                            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
                                {walletBalance.toLocaleString()} <span style={{ fontSize: 12, opacity: 0.7 }}>RWF</span>
                            </Text>
                        </div>
                    </Col>
                </Row>
            </div>

            <Row gutter={[20, 20]}>
                {/* ── LEFT PANEL: FORM ──────────────────────────────── */}
                <Col xs={24} lg={14}>
                    <Card
                        style={{
                            borderRadius: 16,
                            border: '1px solid #f0f0f0',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        }}
                        bodyStyle={{ padding: 28 }}
                    >
                        {/* Steps Indicator */}
                        <Steps
                            current={currentStep}
                            size="small"
                            style={{ marginBottom: 28 }}
                            items={[
                                { title: 'Enter Details', icon: <FireOutlined /> },
                                { title: 'Recharge Result', icon: <CheckCircleOutlined /> },
                            ]}
                        />

                        {/* ── STEP 0: FORM ─────────────────────────────── */}
                        {currentStep === 0 && (
                            <Form form={form} layout="vertical" onFinish={handleSubmit} preserve={true}>

                                {/* Registered Meter Selection */}
                                {registeredMeters.length > 0 && (
                                    <Form.Item label={<Text strong>Select Registered Meter</Text>}>
                                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
                                            {registeredMeters.map(meter => (
                                                <div
                                                    key={meter.id}
                                                    onClick={() => {
                                                        form.setFieldsValue({ meterNumber: meter.meter_number });
                                                        // Heuristic: if it looks like STS it's TOKEN, otherwise check if we store type
                                                        // For now just set number, user can toggle type if needed
                                                        message.success(`Selected meter ${meter.meter_number}`);
                                                    }}
                                                    style={{
                                                        minWidth: '160px',
                                                        padding: '12px',
                                                        borderRadius: '12px',
                                                        background: '#f8f9fb',
                                                        border: '1px solid #e8e8e8',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        textAlign: 'center'
                                                    }}
                                                    onMouseMove={(e) => {
                                                        e.currentTarget.style.borderColor = '#ff6b35';
                                                        e.currentTarget.style.background = '#fff';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = '#e8e8e8';
                                                        e.currentTarget.style.background = '#f8f9fb';
                                                    }}
                                                >
                                                    <div style={{ fontSize: '18px', marginBottom: '4px' }}>🔥</div>
                                                    <Text strong style={{ fontSize: '13px', display: 'block' }}>{meter.alias_name || 'My Meter'}</Text>
                                                    <Text type="secondary" style={{ fontSize: '12px' }}>{meter.meter_number}</Text>
                                                </div>
                                            ))}
                                        </div>
                                        <Text type="secondary" style={{ fontSize: '11px' }}>Click a card to auto-fill the meter number below.</Text>
                                    </Form.Item>
                                )}

                                {/* Meter Type Dropdown */}
                                <Form.Item label={<Text strong>Meter Type</Text>}>
                                    <Select
                                        size="large"
                                        value={meterType}
                                        onChange={(val) => setMeterType(val as any)}
                                        style={{ borderRadius: 8 }}
                                    >
                                        <Option value="LORA_NB">LoRa / NB-IoT Meter</Option>
                                        <Option value="GPRS">GPRS Piped Gas Meter</Option>
                                    </Select>
                                </Form.Item>

                                {/* Meter Number / IMEI Input (Always Rendered or dynamic label) */}
                                <Form.Item
                                    name="meterNumber"
                                    label={<Text strong>{meterType === 'GPRS' ? 'Gas Meter Number (IMEI)' : 'Meter Number'}</Text>}
                                    rules={[
                                        { required: true, message: 'Please enter the Meter Number.' },
                                        { min: 4, message: 'Meter number must be at least 4 characters.' },
                                    ]}
                                >
                                    <Input
                                        prefix={<FireOutlined style={{ color: '#ff6b35' }} />}
                                        placeholder={meterType === 'GPRS' ? "Enter IMEI number" : "e.g. 12345678 or MTR-00123"}
                                        size="large"
                                        style={{ borderRadius: 8 }}
                                    />
                                </Form.Item>

                                {meterType === 'LORA_NB' && !form.getFieldValue('meterNumber') && registeredMeters.length > 0 && (
                                    <div style={{ marginBottom: 16 }}>
                                        <Alert
                                            type="info"
                                            showIcon
                                            message="Please select a registered meter from the list above."
                                        />
                                    </div>
                                )}

                                {/* Amount Selection - Money Based */}
                                <Form.Item
                                    label={<Text strong>Recharge Amount (RWF)</Text>}
                                    help={<Text type="secondary" style={{ fontSize: 11 }}>Choose or enter amount in RWF. Conversion to m³ will be done based on current rates.</Text>}
                                >
                                    <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
                                        {PREDEFINED_AMOUNTS.map((amt) => (
                                            <Col span={8} key={amt}>
                                                <div
                                                    onClick={() => {
                                                        setSelectedAmount(amt);
                                                        setCustomAmount('');
                                                    }}
                                                    style={{
                                                        border: `2px solid ${selectedAmount === amt ? '#ff6b35' : '#e8e8e8'}`,
                                                        borderRadius: 8,
                                                        padding: '10px 4px',
                                                        cursor: 'pointer',
                                                        textAlign: 'center',
                                                        background: selectedAmount === amt ? '#fff7f0' : '#fff',
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    <Text
                                                        strong
                                                        style={{
                                                            color: selectedAmount === amt ? '#ff6b35' : '#333',
                                                            fontSize: 13,
                                                        }}
                                                    >
                                                        {amt.toLocaleString()} RWF
                                                    </Text>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                    <Input
                                        prefix="RWF"
                                        placeholder="Or enter custom amount (e.g. 500)"
                                        value={customAmount}
                                        size="large"
                                        style={{ borderRadius: 8 }}
                                        onChange={(e) => {
                                                            setCustomAmount(e.target.value);
                                                            setSelectedAmount(null);
                                        }}
                                        type="number"
                                        min={100}
                                    />
                                </Form.Item>

                                {/* Optional Token Input for GPRS */}
                                {meterType === 'GPRS' && (
                                    <>
                                        <Divider style={{ margin: '24px 0 12px 0', fontSize: 12, color: '#999' }} plain>
                                            <Text type="secondary" style={{ fontSize: 12 }}>— OR PUSH STS TOKEN —</Text>
                                        </Divider>
                                        <Form.Item
                                            name="pipingToken"
                                            label={<Text strong>STS Token (Pre-Bought)</Text>}
                                            help={<Text type="secondary" style={{ fontSize: 11 }}>Type a 20-digit token code if you already bought one to push to the meter. Leave volume empty.</Text>}
                                        >
                                            <Input
                                                prefix={<KeyOutlined style={{ color: '#ff6b35' }} />}
                                                placeholder="Enter 20-digit token code"
                                                size="large"
                                                style={{ borderRadius: 8 }}
                                            />
                                        </Form.Item>
                                    </>
                                )}

                                <Divider style={{ margin: '16px 0' }} />

                                {/* Payment Method */}
                                <Form.Item label={<Text strong>Payment Method</Text>}>
                                    <Radio.Group
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    >
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <Radio value="wallet">
                                                <Space>
                                                    <WalletOutlined style={{ color: '#1890ff' }} />
                                                    <span>Wallet Balance</span>
                                                    <Tag color="blue">{walletBalance.toLocaleString()} RWF</Tag>
                                                </Space>
                                            </Radio>
                                            <Radio value="mobile_money">
                                                <Space>
                                                    <MobileOutlined style={{ color: '#52c41a' }} />
                                                    <span>Mobile Money (MTN / Airtel)</span>
                                                </Space>
                                            </Radio>
                                            {nfcCards.length > 0 && (
                                                <Radio value="nfc_card">
                                                    <Space>
                                                        <CreditCardOutlined style={{ color: '#722ed1' }} />
                                                        <span>NFC Card</span>
                                                    </Space>
                                                </Radio>
                                            )}
                                        </Space>
                                    </Radio.Group>
                                </Form.Item>

                                {/* Mobile Money Phone */}
                                {paymentMethod === 'mobile_money' && (
                                    <Form.Item
                                        name="phone"
                                        label="Phone Number"
                                        rules={[{ required: true, message: 'Enter phone number for mobile money.' }]}
                                    >
                                        <Input
                                            prefix={<MobileOutlined />}
                                            placeholder="e.g. 07XXXXXXXX"
                                            size="large"
                                            style={{ borderRadius: 8 }}
                                        />
                                    </Form.Item>
                                )}

                                {/* NFC Card Selector */}
                                {paymentMethod === 'nfc_card' && (
                                    <Form.Item
                                        name="cardId"
                                        label="Select NFC Card"
                                        rules={[{ required: true, message: 'Please select a card.' }]}
                                    >
                                        <Select placeholder="Choose card" size="large" style={{ borderRadius: 8 }}>
                                            {nfcCards.map((card: any) => (
                                                <Option key={card.id} value={card.id}>
                                                    {card.nickname || card.uid} — {card.balance?.toLocaleString()} RWF
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                )}

                                {/* Summary Preview */}
                                {getEffectiveAmount() > 0 && (
                                    <Alert
                                        type="info"
                                        showIcon
                                        icon={<InfoCircleOutlined />}
                                        style={{ borderRadius: 8, marginBottom: 16 }}
                                        message={
                                            <span>
                                                Recharging <strong>{meterType === 'LORA_NB' ? 'LoRa / NB-IoT' : 'GPRS'} Meter</strong> with{' '}
                                                <strong>{getEffectiveAmount().toLocaleString()} RWF</strong>
                                            </span>
                                        }
                                    />
                                )}

                                {/* Submit Button */}
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    size="large"
                                    loading={processing}
                                    icon={<ThunderboltOutlined />}
                                    style={{
                                        background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                                        border: 'none',
                                        borderRadius: 10,
                                        height: 48,
                                        fontSize: 15,
                                        fontWeight: 700,
                                        boxShadow: '0 4px 16px rgba(255,107,53,0.4)',
                                    }}
                                >
                                    {processing ? 'Processing Recharge...' : '⚡ Recharge Piped Gas Meter'}
                                </Button>
                            </Form>
                        )}

                        {/* ── STEP 1: RESULT ────────────────────────────── */}
                        {currentStep === 1 && result && (
                            <div ref={printRef}>
                                {/* Success Banner */}
                                <div
                                    style={{
                                        background: 'linear-gradient(135deg, #52c41a, #389e0d)',
                                        borderRadius: 12,
                                        padding: '20px 24px',
                                        marginBottom: 20,
                                        textAlign: 'center',
                                        color: '#fff',
                                    }}
                                >
                                    <CheckCircleOutlined style={{ fontSize: 40, marginBottom: 4 }} />
                                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>
                                        Recharge Successful!
                                    </div>
                                    <div style={{ opacity: 0.85, fontSize: 13 }}>
                                        Transaction #{result.transactionId}
                                    </div>
                                </div>

                                {/* Details */}
                                <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                                    {[
                                        { label: 'Meter Number', value: result.meterNumber },
                                        { label: 'Meter Type', value: result.meterType === 'TOKEN' ? '⚡ Token-Based' : '🔧 Piping Gas' },
                                        { label: 'Amount Paid', value: `${result.amount.toLocaleString()} RWF` },
                                        { label: 'Gas Units', value: result.units ? `${result.units} ${result.meterType === 'TOKEN' ? 'kg' : 'm³'}` : 'N/A' },
                                        ...(result.apiReference ? [{ label: 'API Reference', value: result.apiReference }] : []),
                                    ].map((item) => (
                                        <Col span={12} key={item.label}>
                                            <div
                                                style={{
                                                    background: '#f8f9fb',
                                                    borderRadius: 10,
                                                    padding: '12px 14px',
                                                }}
                                            >
                                                <Text style={{ fontSize: 11, color: '#888', display: 'block' }}>{item.label}</Text>
                                                <Text strong style={{ fontSize: 14 }}>{item.value}</Text>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>

                                {/* TOKEN Display */}
                                {result.meterType === 'TOKEN' && result.token && (
                                    <div
                                        style={{
                                            background: 'linear-gradient(135deg, #e6f4ff, #bae0ff)',
                                            border: '2px solid #1890ff',
                                            borderRadius: 14,
                                            padding: '20px 24px',
                                            marginBottom: 20,
                                            textAlign: 'center',
                                        }}
                                    >
                                        <KeyOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
                                        <div style={{ fontSize: 12, color: '#1890ff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                                            ⚡ Enter This Token Into Your Meter
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 28,
                                                fontWeight: 900,
                                                letterSpacing: 6,
                                                color: '#003a8c',
                                                fontFamily: 'Courier New, monospace',
                                                margin: '12px 0',
                                                background: '#fff',
                                                padding: '12px 16px',
                                                borderRadius: 8,
                                                border: '1px dashed #1890ff',
                                            }}
                                        >
                                            {result.token}
                                        </div>
                                        <Button
                                            icon={<CopyOutlined />}
                                            onClick={() => copyToken(result.token!)}
                                            style={{ borderRadius: 6, borderColor: '#1890ff', color: '#1890ff' }}
                                        >
                                            Copy Token
                                        </Button>
                                        <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
                                            Enter the digits above into your gas meter keypad to activate the credit.
                                        </div>
                                    </div>
                                )}

                                {/* PIPING: auto-credit message */}
                                {result.meterType === 'PIPING' && (
                                    <div
                                        style={{
                                            background: 'linear-gradient(135deg, #f6ffed, #d9f7be)',
                                            border: '2px solid #52c41a',
                                            borderRadius: 14,
                                            padding: '20px 24px',
                                            marginBottom: 20,
                                            textAlign: 'center',
                                        }}
                                    >
                                        <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a', marginBottom: 8 }} />
                                        <div style={{ fontSize: 15, fontWeight: 700, color: '#389e0d' }}>
                                            Meter Credited Automatically
                                        </div>
                                        <div style={{ fontSize: 13, color: '#595959', marginTop: 6 }}>
                                            Your piping gas meter has been recharged directly via our network.
                                            No token entry is required — the meter will display the updated balance shortly.
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <Row gutter={12}>
                                    <Col span={12}>
                                        <Button
                                            block
                                            icon={<PrinterOutlined />}
                                            onClick={handlePrint}
                                            style={{ borderRadius: 8, height: 42 }}
                                        >
                                            Print Receipt
                                        </Button>
                                    </Col>
                                    <Col span={12}>
                                        <Button
                                            block
                                            type="primary"
                                            icon={<ReloadOutlined />}
                                            onClick={handleReset}
                                            style={{ borderRadius: 8, height: 42, background: '#ff6b35', border: 'none' }}
                                        >
                                            New Recharge
                                        </Button>
                                    </Col>
                                </Row>
                            </div>
                        )}
                    </Card>
                </Col>

                {/* ── RIGHT PANEL: INFO + HISTORY ────────────────────── */}
                <Col xs={24} lg={10}>
                    {/* Meter Type Info Card */}
                    <Card
                        title={
                            <Space>
                                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                                <span>How It Works</span>
                            </Space>
                        }
                        style={{ borderRadius: 14, marginBottom: 16, border: '1px solid #e8f4fd' }}
                        bodyStyle={{ padding: 16 }}
                    >
                        <div style={{ marginBottom: 14 }}>
                            <Badge color="#1890ff" text={<Text strong>⚡ Token-Based Prepaid</Text>} />
                            <Paragraph style={{ margin: '6px 0 0 16px', fontSize: 12, color: '#666' }}>
                                The system generates a 20-digit STS token after payment. Enter the token into
                                your meter keypad to load gas credit.
                            </Paragraph>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div>
                            <Badge color="#52c41a" text={<Text strong>🔧 Piping Gas Meter</Text>} />
                            <Paragraph style={{ margin: '6px 0 0 16px', fontSize: 12, color: '#666' }}>
                                The system credits your piping meter directly via the Stronpower network.
                                No token is required — credit appears on your meter automatically.
                            </Paragraph>
                        </div>
                    </Card>

                    {/* Recent History */}
                    <Card
                        title={
                            <Space>
                                <HistoryOutlined />
                                <span>Recent Recharges</span>
                            </Space>
                        }
                        extra={
                            <Button size="small" icon={<ReloadOutlined />} onClick={loadHistory} loading={historyLoading}>
                                Refresh
                            </Button>
                        }
                        style={{ borderRadius: 14, border: '1px solid #f0f0f0' }}
                        bodyStyle={{ padding: 0 }}
                    >
                        {historyLoading ? (
                            <div style={{ textAlign: 'center', padding: 40 }}>
                                <Spin />
                            </div>
                        ) : (
                            <Table
                                columns={historyColumns}
                                dataSource={history}
                                rowKey="id"
                                size="small"
                                pagination={{ pageSize: 5, showSizeChanger: false }}
                                scroll={{ x: 400 }}
                                locale={{ emptyText: 'No recharges yet' }}
                            />
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};


export default GasMeterRechargePage;
