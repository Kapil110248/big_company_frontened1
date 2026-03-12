import React, { useState } from 'react';
import {
  Modal,
  Steps,
  Input,
  Button,
  Radio,
  Space,
  Card,
  Alert,
  Statistic,
  Typography,
  Spin,
  Result,
  Divider,
  Tag,
} from 'antd';
import {
  CreditCardOutlined,
  LockOutlined,
  SafetyOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { API_URL } from '../../config';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type VerificationMethod = 'pin' | 'code' | 'otp';

interface ManualPaymentFlowProps {
  visible: boolean;
  amount: number;
  onClose: () => void;
  onSuccess: (transactionId: string, cardBalance: number) => void;
}

interface PaymentCode {
  code: string;
  expires_at: string;
}

interface VerificationResult {
  success: boolean;
  error?: string;
  transaction_id?: string;
  card_balance?: number;
}

export const ManualPaymentFlow: React.FC<ManualPaymentFlowProps> = ({
  visible,
  amount,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [cardId, setCardId] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('pin');
  const [pin, setPin] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [generatedCode, setGeneratedCode] = useState<PaymentCode | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);

  // Format Rwanda phone number
  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      return '250' + cleaned.substring(1);
    }
    if (cleaned.startsWith('250')) {
      return cleaned;
    }
    if (cleaned.length <= 9) {
      return '250' + cleaned;
    }
    return cleaned;
  };

  // Validate card ID format
  const isValidCardId = (id: string): boolean => {
    return id.length >= 8 && /^[A-Za-z0-9]+$/.test(id);
  };

  // Validate phone number
  const isValidPhone = (phone: string): boolean => {
    const formatted = formatPhone(phone);
    return /^250[7][0-9]{8}$/.test(formatted);
  };

  // Calculate time remaining for code expiry
  const getTimeRemaining = (expiresAt: string): string => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Step 1: Enter card ID
  const handleCardIdSubmit = () => {
    if (!isValidCardId(cardId)) {
      setError('Invalid card ID format. Must be at least 8 alphanumeric characters.');
      return;
    }
    setError(null);
    setCurrentStep(1);
  };

  // Step 2: Choose verification method
  const handleMethodSelect = () => {
    setError(null);
    setCurrentStep(2);
  };

  // Method 1: PIN Verification
  const handlePinVerification = async () => {
    if (pin.length < 4 || pin.length > 6) {
      setError('PIN must be 4-6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/retailer/manual-payment/verify-pin`,
        {
          card_id: cardId,
          pin: pin,
          amount: amount,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setResult({
          success: true,
          transaction_id: response.data.transaction_id,
          card_balance: response.data.card_balance,
        });
        setCurrentStep(3);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Verification failed. Please try again.';
      setError(errorMsg);

      // If too many attempts, show lockout message
      if (errorMsg.includes('locked')) {
        setResult({
          success: false,
          error: errorMsg,
        });
        setCurrentStep(3);
      }
    } finally {
      setLoading(false);
    }
  };

  // Method 2: Generate One-Time Code
  const handleGenerateCode = async () => {
    if (customerPhone && !isValidPhone(customerPhone)) {
      setError('Invalid Rwanda phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/retailer/manual-payment/generate-code`,
        {
          card_id: cardId,
          amount: amount,
          customer_phone: customerPhone ? formatPhone(customerPhone) : undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setGeneratedCode({
        code: response.data.code,
        expires_at: response.data.expires_at,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  };

  // Method 2: Verify Code
  const handleCodeVerification = async () => {
    if (enteredCode.length !== 8) {
      setError('Code must be 8 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/retailer/manual-payment/verify-code`,
        {
          card_id: cardId,
          code: enteredCode,
          amount: amount,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setResult({
          success: true,
          transaction_id: response.data.transaction_id,
          card_balance: response.data.card_balance,
        });
        setCurrentStep(3);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Code verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Method 3: Request OTP
  const handleRequestOTP = async () => {
    if (!customerPhone) {
      setError('Customer phone number is required');
      return;
    }

    if (!isValidPhone(customerPhone)) {
      setError('Invalid Rwanda phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/retailer/manual-payment/request-otp`,
        {
          card_id: cardId,
          amount: amount,
          customer_phone: formatPhone(customerPhone),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setOtpSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Method 3: Verify OTP
  const handleOTPVerification = async () => {
    if (otpCode.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/retailer/manual-payment/verify-otp`,
        {
          card_id: cardId,
          otp: otpCode,
          customer_phone: formatPhone(customerPhone),
          amount: amount,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setResult({
          success: true,
          transaction_id: response.data.transaction_id,
          card_balance: response.data.card_balance,
        });
        setCurrentStep(3);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Reset modal state
  const handleClose = () => {
    setCurrentStep(0);
    setCardId('');
    setVerificationMethod('pin');
    setPin('');
    setCustomerPhone('');
    setGeneratedCode(null);
    setEnteredCode('');
    setOtpCode('');
    setOtpSent(false);
    setLoading(false);
    setError(null);
    setResult(null);
    onClose();
  };

  // Handle success
  const handleComplete = () => {
    if (result?.success && result.transaction_id && result.card_balance !== undefined) {
      onSuccess(result.transaction_id, result.card_balance);
    }
    handleClose();
  };

  // Render verification method specific content
  const renderVerificationContent = () => {
    switch (verificationMethod) {
      case 'pin':
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message="PIN Verification"
              description="Ask the customer to provide their card PIN. They can share this over phone or in person."
              type="info"
              showIcon
              icon={<LockOutlined />}
            />

            <Input.Password
              size="large"
              placeholder="Enter 4-6 digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              prefix={<LockOutlined />}
              disabled={loading}
            />

            {error && <Alert message={error} type="error" showIcon />}

            <Button
              type="primary"
              size="large"
              block
              onClick={handlePinVerification}
              loading={loading}
              disabled={pin.length < 4}
              icon={<CheckCircleOutlined />}
            >
              Verify PIN & Process Payment
            </Button>
          </Space>
        );

      case 'code':
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {!generatedCode ? (
              <>
                <Alert
                  message="One-Time Payment Code"
                  description="Generate a one-time 8-digit code. The customer will receive it via SMS (if phone provided) and must share it with you within 10 minutes."
                  type="info"
                  showIcon
                  icon={<SafetyOutlined />}
                />

                <Input
                  size="large"
                  placeholder="Customer phone (optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  prefix={<MessageOutlined />}
                  disabled={loading}
                  addonBefore="+250"
                />

                {error && <Alert message={error} type="error" showIcon />}

                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleGenerateCode}
                  loading={loading}
                  icon={<SafetyOutlined />}
                >
                  Generate Payment Code
                </Button>
              </>
            ) : (
              <>
                <Card style={{ backgroundColor: '#f0f5ff', border: '2px solid #1890ff' }}>
                  <Space direction="vertical" style={{ width: '100%' }} align="center">
                    <Text type="secondary">Payment Code Generated</Text>
                    <Title level={2} copyable style={{ margin: 0 }}>
                      {generatedCode.code}
                    </Title>
                    <Tag color="orange" icon={<ClockCircleOutlined />}>
                      Expires in: {getTimeRemaining(generatedCode.expires_at)}
                    </Tag>
                    {customerPhone && (
                      <Text type="success">SMS sent to {formatPhone(customerPhone)}</Text>
                    )}
                  </Space>
                </Card>

                <Alert
                  message="Ask customer for the code"
                  description="The customer should have received this code via SMS (if phone was provided). Ask them to share the code with you."
                  type="warning"
                  showIcon
                />

                <Input
                  size="large"
                  placeholder="Enter 8-digit code from customer"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  maxLength={8}
                  prefix={<SafetyOutlined />}
                  disabled={loading}
                />

                {error && <Alert message={error} type="error" showIcon />}

                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleCodeVerification}
                  loading={loading}
                  disabled={enteredCode.length !== 8}
                  icon={<CheckCircleOutlined />}
                >
                  Verify Code & Process Payment
                </Button>
              </>
            )}
          </Space>
        );

      case 'otp':
        return (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {!otpSent ? (
              <>
                <Alert
                  message="SMS OTP Verification"
                  description="Send a one-time password to the customer's phone. They will receive it via SMS and must share it with you within 5 minutes."
                  type="info"
                  showIcon
                  icon={<MessageOutlined />}
                />

                <Input
                  size="large"
                  placeholder="Customer phone number (required)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  prefix={<MessageOutlined />}
                  disabled={loading}
                  addonBefore="+250"
                />

                {error && <Alert message={error} type="error" showIcon />}

                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleRequestOTP}
                  loading={loading}
                  disabled={!customerPhone}
                  icon={<MessageOutlined />}
                >
                  Send OTP via SMS
                </Button>
              </>
            ) : (
              <>
                <Alert
                  message="OTP Sent"
                  description={`A 6-digit OTP has been sent to ${formatPhone(customerPhone)}. Ask the customer to share it with you.`}
                  type="success"
                  showIcon
                />

                <Input
                  size="large"
                  placeholder="Enter 6-digit OTP from customer"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  prefix={<MessageOutlined />}
                  disabled={loading}
                  autoFocus
                />

                {error && <Alert message={error} type="error" showIcon />}

                <Space style={{ width: '100%' }}>
                  <Button
                    type="default"
                    onClick={handleRequestOTP}
                    loading={loading}
                    disabled={loading}
                  >
                    Resend OTP
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    style={{ flex: 1 }}
                    onClick={handleOTPVerification}
                    loading={loading}
                    disabled={otpCode.length !== 6}
                    icon={<CheckCircleOutlined />}
                  >
                    Verify OTP & Process Payment
                  </Button>
                </Space>
              </>
            )}
          </Space>
        );
    }
  };

  return (
    <Modal
      open={visible}
      title="Manual Card Payment"
      onCancel={handleClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Spin spinning={loading}>
        <Steps
          current={currentStep}
          style={{ marginBottom: 24 }}
          items={[
            { title: 'Card ID', icon: <CreditCardOutlined /> },
            { title: 'Method', icon: <SafetyOutlined /> },
            { title: 'Verify', icon: <LockOutlined /> },
            { title: 'Complete', icon: <CheckCircleOutlined /> },
          ]}
        />

        {/* Step 0: Enter Card ID */}
        {currentStep === 0 && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Statistic
              title="Payment Amount"
              value={amount}
              suffix="RWF"
              precision={2}
              valueStyle={{ color: '#1890ff', fontSize: 32 }}
            />

            <Alert
              message="Remote Payment"
              description="This feature allows you to process payments when the customer is not physically present. Ask the customer for their card details."
              type="info"
              showIcon
            />

            <Input
              size="large"
              placeholder="Enter card ID (e.g., A1B2C3D4E5F6)"
              value={cardId}
              onChange={(e) => setCardId(e.target.value.toUpperCase())}
              prefix={<CreditCardOutlined />}
              disabled={loading}
            />

            {error && <Alert message={error} type="error" showIcon />}

            <Button
              type="primary"
              size="large"
              block
              onClick={handleCardIdSubmit}
              disabled={!cardId}
              icon={<CheckCircleOutlined />}
            >
              Continue
            </Button>
          </Space>
        )}

        {/* Step 1: Choose Verification Method */}
        {currentStep === 1 && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message="Choose Verification Method"
              description="Select how you want the customer to authorize this payment. Each method has different security levels and use cases."
              type="info"
              showIcon
            />

            <Radio.Group
              value={verificationMethod}
              onChange={(e) => setVerificationMethod(e.target.value)}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Card
                  hoverable
                  onClick={() => setVerificationMethod('pin')}
                  style={{
                    border: verificationMethod === 'pin' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  }}
                >
                  <Radio value="pin">
                    <Space direction="vertical">
                      <Space>
                        <LockOutlined style={{ fontSize: 20 }} />
                        <Text strong>Direct PIN Entry</Text>
                      </Space>
                      <Paragraph type="secondary" style={{ marginBottom: 0, marginLeft: 28 }}>
                        Customer provides their card PIN directly. Fastest method but requires trust.
                      </Paragraph>
                    </Space>
                  </Radio>
                </Card>

                <Card
                  hoverable
                  onClick={() => setVerificationMethod('code')}
                  style={{
                    border: verificationMethod === 'code' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  }}
                >
                  <Radio value="code">
                    <Space direction="vertical">
                      <Space>
                        <SafetyOutlined style={{ fontSize: 20 }} />
                        <Text strong>One-Time Payment Code</Text>
                      </Space>
                      <Paragraph type="secondary" style={{ marginBottom: 0, marginLeft: 28 }}>
                        Generate a unique 8-digit code sent via SMS. Customer shares the code with you.
                      </Paragraph>
                    </Space>
                  </Radio>
                </Card>

                <Card
                  hoverable
                  onClick={() => setVerificationMethod('otp')}
                  style={{
                    border: verificationMethod === 'otp' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  }}
                >
                  <Radio value="otp">
                    <Space direction="vertical">
                      <Space>
                        <MessageOutlined style={{ fontSize: 20 }} />
                        <Text strong>SMS OTP</Text>
                      </Space>
                      <Paragraph type="secondary" style={{ marginBottom: 0, marginLeft: 28 }}>
                        Send a 6-digit OTP via SMS. Most secure method for phone-based payments.
                      </Paragraph>
                    </Space>
                  </Radio>
                </Card>
              </Space>
            </Radio.Group>

            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Button onClick={() => setCurrentStep(0)}>Back</Button>
              <Button
                type="primary"
                size="large"
                onClick={handleMethodSelect}
                icon={<CheckCircleOutlined />}
              >
                Continue with {verificationMethod.toUpperCase()}
              </Button>
            </Space>
          </Space>
        )}

        {/* Step 2: Verification */}
        {currentStep === 2 && (
          <div>
            <Divider>
              <Space>
                <CreditCardOutlined />
                <Text strong>Card: {cardId}</Text>
              </Space>
            </Divider>

            <Statistic
              title="Payment Amount"
              value={amount}
              suffix="RWF"
              precision={2}
              valueStyle={{ fontSize: 24, marginBottom: 16 }}
            />

            {renderVerificationContent()}

            <Divider />

            <Button type="link" onClick={() => setCurrentStep(1)} disabled={loading}>
              ← Change verification method
            </Button>
          </div>
        )}

        {/* Step 3: Result */}
        {currentStep === 3 && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {result?.success ? (
              <Result
                status="success"
                title="Payment Successful!"
                subTitle={
                  <Space direction="vertical">
                    <Text>Transaction ID: {result.transaction_id}</Text>
                    <Text>New Card Balance: {result.card_balance?.toLocaleString()} RWF</Text>
                  </Space>
                }
                extra={[
                  <Button type="primary" size="large" onClick={handleComplete}>
                    Done
                  </Button>,
                ]}
              />
            ) : (
              <Result
                status="error"
                title="Payment Failed"
                subTitle={result?.error || 'An error occurred during payment processing'}
                extra={[
                  <Button type="default" onClick={() => setCurrentStep(2)}>
                    Try Again
                  </Button>,
                  <Button type="primary" onClick={handleClose}>
                    Cancel
                  </Button>,
                ]}
              />
            )}
          </Space>
        )}
      </Spin>
    </Modal>
  );
};
