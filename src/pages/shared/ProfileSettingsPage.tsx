import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Avatar,
  Form,
  Input,
  Button,
  Divider,
  message,
  Space,
  Tag,
  List,
  Switch,
  Tabs,
  Alert,
  Select,
  InputNumber,
  Modal,
} from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  EditOutlined,
  SaveOutlined,
  BellOutlined,
  LockOutlined,
  SettingOutlined,
  MobileOutlined,
  DollarOutlined,
  WifiOutlined,
  QrcodeOutlined,
  PrinterOutlined,
  GlobalOutlined,
  ApiOutlined,
  BankOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { retailerApi } from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';
import { wholesalerApi, authApi } from '../../services/apiService';
import { useEffect } from 'react';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

export const ProfileSettingsPage: React.FC = () => {
  const { user, login } = useAuth(); // Assuming login or setUser can update context, but maybe just re-fetch is enough.
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [pinForm] = Form.useForm();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const isWholesaler = user?.role === 'wholesaler';
  const isRetailer = user?.role === 'retailer';

  const [profileData, setProfileData] = useState<any>(null);
  const [settingsData, setSettingsData] = useState<any>(null);

  const fetchProfile = async () => {
    if (!isWholesaler && !isRetailer) return;
    setLoading(true);
    try {
      let response;
      if (isWholesaler) {
        response = await wholesalerApi.getProfile();
      } else if (isRetailer) {
        response = await retailerApi.getProfile();
      }

      if (response && response.data.success) {
        setProfileData(response.data.profile);
        setSettingsData(response.data.profile.settings);
        profileForm.setFieldsValue({
          name: response.data.profile.user.name,
          company_name: response.data.profile.companyName || response.data.profile.shop_name,
          phone: response.data.profile.user.phone,
          email: response.data.profile.user.email,
          address: response.data.profile.address,
          tin_number: response.data.profile.tinNumber,
        });
        if (response.data.profile.settings) {
          settingsForm.setFieldsValue({
            payment_terms: response.data.profile.settings.paymentTerms,
            default_credit: response.data.profile.settings.defaultCreditLimit,
            accepted_payments: response.data.profile.settings.acceptedPayments || ['wallet', 'mobile_money', 'cash'],
            ussd_business_code: response.data.profile.settings.ussdBusinessCode,
            ussd_language: response.data.profile.settings.ussdLanguage,
            ussd_auto_response: response.data.profile.settings.ussdAutoResponse,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      message.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (values: any) => {
    if (!isWholesaler && !isRetailer) {
      message.info('Simulation: Profile updated');
      setEditing(false);
      return;
    }

    setLoading(true);
    try {
      let response;
      if (isWholesaler) {
        response = await wholesalerApi.updateProfile(values);
      } else if (isRetailer) {
        response = await retailerApi.updateProfile(values);
      }

      if (response && response.data.success) {
        message.success('Profile updated successfully');
        setProfileData(response.data.profile);
        setEditing(false);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (values: any) => {
    if (!isWholesaler) {
      message.info('Simulation: Settings updated');
      return;
    }

    setLoading(true);
    try {
      // Map frontend keys to backend keys if necessary
      const payload = {
        paymentTerms: values.payment_terms,
        defaultCreditLimit: values.default_credit,
        acceptedPayments: values.accepted_payments,
        ussdBusinessCode: values.ussd_business_code,
        ussdLanguage: values.ussd_language,
        ussdAutoResponse: values.ussd_auto_response,
      };

      const response = await wholesalerApi.updateSettings(payload);
      if (response.data.success) {
        message.success('Settings updated successfully');
        setSettingsData(response.data.settings);
      }
    } catch (error) {
      message.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async (key: string, enabled: boolean) => {
    if (!isWholesaler) return; // Retailer settings not fully implemented yet
    try {
      await wholesalerApi.updateSettings({ [key]: enabled });
      setSettingsData({ ...settingsData, [key]: enabled });
    } catch (error) {
      message.error('Failed to update notification setting');
    }
  };

  const handleUpdatePassword = async (values: any) => {
    setLoading(true);
    try {
      await authApi.updatePassword(values);
      message.success('Password updated successfully');
      setIsPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePin = async (values: any) => {
    setLoading(true);
    try {
      await authApi.updatePin(values);
      message.success('PIN updated successfully');
      setIsPinModalOpen(false);
      pinForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to update PIN');
    } finally {
      setLoading(false);
    }
  };

  const roleColor = isWholesaler ? '#722ed1' : isRetailer ? '#1890ff' : '#52c41a';
  const roleName = user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) || '');

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${roleColor} 0%, ${roleColor}dd 100%)`,
          padding: '32px',
          borderRadius: 12,
          marginBottom: 24,
          color: 'white',
        }}
      >
        <Row align="middle" gutter={24}>
          <Col>
            <Avatar
              size={100}
              icon={<UserOutlined />}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '3px solid white',
              }}
            />
          </Col>
          <Col flex={1}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              {user?.name || user?.company_name || user?.shop_name || roleName}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
              <PhoneOutlined /> {user?.phone || '+250788000000'}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Tag color="green">Verified Account</Tag>
              <Tag color="blue">{roleName}</Tag>
            </div>
          </Col>
          <Col>
            <Button
              type={editing ? 'primary' : 'default'}
              icon={editing ? <SaveOutlined /> : <EditOutlined />}
              onClick={() => (editing ? profileForm.submit() : setEditing(true))}
              loading={loading}
              style={editing ? {} : { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
            >
              {editing ? 'Save Changes' : 'Edit Profile'}
            </Button>
          </Col>
        </Row>
      </div>

      <Tabs defaultActiveKey="profile" size="large">
        {/* Profile Tab */}
        <TabPane
          tab={<span><UserOutlined />Profile</span>}
          key="profile"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card title={<><UserOutlined /> Business Information</>}>
                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleSaveProfile}
                  initialValues={{
                    name: user?.name || '',
                    company_name: user?.company_name || user?.shop_name || '',
                    phone: user?.phone || '+250788000000',
                    email: user?.email || '',
                    address: 'Kigali, Rwanda',
                    tin_number: 'TIN123456789',
                  }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="name" label="Contact Person">
                        <Input
                          prefix={<UserOutlined />}
                          disabled={!editing}
                          placeholder="Full name"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="company_name" label={isWholesaler ? 'Company Name' : 'Shop Name'}>
                        <Input
                          prefix={<HomeOutlined />}
                          disabled={!editing}
                          placeholder={isWholesaler ? 'Company name' : 'Shop name'}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="phone" label="Phone Number">
                        <Input
                          prefix={<PhoneOutlined />}
                          disabled
                          placeholder="Phone number"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="email" label="Email Address">
                        <Input
                          prefix={<MailOutlined />}
                          disabled={!editing}
                          placeholder="Email address"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="address" label="Business Address">
                        <Input
                          prefix={<HomeOutlined />}
                          disabled={!editing}
                          placeholder="Business address"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="tin_number" label="TIN Number">
                        <Input
                          disabled={!editing}
                          placeholder="Tax ID"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  {editing && (
                    <Space>
                      <Button type="primary" htmlType="submit" loading={loading}>
                        Save Changes
                      </Button>
                      <Button onClick={() => setEditing(false)}>Cancel</Button>
                    </Space>
                  )}
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title={<><LockOutlined /> Security</>}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    block
                    icon={<LockOutlined />}
                    onClick={() => setIsPasswordModalOpen(true)}
                  >
                    Change Password
                  </Button>
                  <Button
                    block
                    icon={<MobileOutlined />}
                    onClick={() => setIsPinModalOpen(true)}
                  >
                    Change PIN
                  </Button>
                  <Button block icon={<PhoneOutlined />}>
                    Two-Factor Auth
                  </Button>
                  <Divider />
                  <Button block type="text" danger>
                    Logout from All Devices
                  </Button>
                </Space>
              </Card>

              {/* Linked Wholesaler Card - Only for Retailers */}
              {isRetailer && (
                <Card
                  title={<><LinkOutlined /> My Wholesaler</>}
                  style={{ marginTop: 16 }}
                  styles={{ body: { padding: profileData?.linkedWholesaler ? 16 : 24 } }}
                >
                  {profileData?.linkedWholesaler ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <Avatar
                          size={48}
                          icon={<BankOutlined />}
                          style={{ backgroundColor: '#722ed1', marginRight: 12 }}
                        />
                        <div>
                          <Text strong style={{ fontSize: 16, display: 'block' }}>
                            {profileData.linkedWholesaler.companyName}
                          </Text>
                          <Tag color="purple">Wholesaler</Tag>
                        </div>
                      </div>
                      <Divider style={{ margin: '12px 0' }} />
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        {profileData.linkedWholesaler.contactPerson && (
                          <Text type="secondary">
                            <UserOutlined style={{ marginRight: 8 }} />
                            {profileData.linkedWholesaler.contactPerson}
                          </Text>
                        )}
                        {profileData.linkedWholesaler.phone && (
                          <Text type="secondary">
                            <PhoneOutlined style={{ marginRight: 8 }} />
                            {profileData.linkedWholesaler.phone}
                          </Text>
                        )}
                        {profileData.linkedWholesaler.email && (
                          <Text type="secondary">
                            <MailOutlined style={{ marginRight: 8 }} />
                            {profileData.linkedWholesaler.email}
                          </Text>
                        )}
                        {profileData.linkedWholesaler.address && (
                          <Text type="secondary">
                            <HomeOutlined style={{ marginRight: 8 }} />
                            {profileData.linkedWholesaler.address}
                          </Text>
                        )}
                      </Space>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#999' }}>
                      <BankOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                      <div>No wholesaler linked yet</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Place your first order to get linked
                      </Text>
                    </div>
                  )}
                </Card>
              )}
            </Col>
          </Row>
        </TabPane>

        {/* Notifications Tab */}
        <TabPane
          tab={<span><BellOutlined />Notifications</span>}
          key="notifications"
        >
          <Card title={<><BellOutlined /> Notification Preferences</>}>
            <List>
              <List.Item actions={[
                <Switch
                  checked={settingsData?.pushNotifications ?? true}
                  onChange={(checked) => handleNotificationToggle('pushNotifications', checked)}
                  key="push"
                />
              ]}>
                <List.Item.Meta
                  avatar={<BellOutlined style={{ fontSize: 20, color: roleColor }} />}
                  title="Push Notifications"
                  description="Receive order updates and alerts"
                />
              </List.Item>
              <List.Item actions={[
                <Switch
                  checked={settingsData?.emailNotifications ?? true}
                  onChange={(checked) => handleNotificationToggle('emailNotifications', checked)}
                  key="email"
                />
              ]}>
                <List.Item.Meta
                  avatar={<MailOutlined style={{ fontSize: 20, color: roleColor }} />}
                  title="Email Notifications"
                  description="Receive daily summaries and reports"
                />
              </List.Item>
              <List.Item actions={[
                <Switch
                  checked={settingsData?.smsNotifications ?? true}
                  onChange={(checked) => handleNotificationToggle('smsNotifications', checked)}
                  key="sms"
                />
              ]}>
                <List.Item.Meta
                  avatar={<PhoneOutlined style={{ fontSize: 20, color: roleColor }} />}
                  title="SMS Notifications"
                  description="Receive critical alerts via SMS"
                />
              </List.Item>
              <List.Item actions={[
                <Switch
                  checked={settingsData?.ussdAlerts ?? false}
                  onChange={(checked) => handleNotificationToggle('ussdAlerts', checked)}
                  key="ussd"
                />
              ]}>
                <List.Item.Meta
                  avatar={<MobileOutlined style={{ fontSize: 20, color: roleColor }} />}
                  title="USSD Alerts"
                  description="Receive order notifications via USSD callback"
                />
              </List.Item>
            </List>
          </Card>
        </TabPane>

        {/* USSD Settings Tab */}
        <TabPane
          tab={<span><MobileOutlined />USSD Settings</span>}
          key="ussd"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Alert
                message="USSD Integration"
                description="Configure your USSD settings to allow customers to place orders and check balances via USSD codes. This enables offline ordering for customers without smartphones."
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
              />
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<><MobileOutlined /> USSD Configuration</>}>
                <Form layout="vertical" form={settingsForm} onFinish={handleSaveSettings}>
                  <Form.Item label="USSD Short Code" help="Your assigned USSD code">
                    <Input
                      addonBefore="*"
                      addonAfter="#"
                      placeholder="123"
                      defaultValue={isWholesaler ? '284*1' : '284*2'}
                      disabled
                    />
                  </Form.Item>
                  <Form.Item label="Business Code" name="ussd_business_code" help="Unique code for your business">
                    <Input
                      placeholder="BIZ001"
                    />
                  </Form.Item>
                  <Form.Item label="USSD Menu Language" name="ussd_language">
                    <Select>
                      <Select.Option value="en">English</Select.Option>
                      <Select.Option value="rw">Kinyarwanda</Select.Option>
                      <Select.Option value="fr">French</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Auto-Response" name="ussd_auto_response" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                    Save USSD Settings
                  </Button>
                </Form>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<><GlobalOutlined /> USSD Menu Preview</>}>
                <div
                  style={{
                    background: '#1a1a2e',
                    color: '#00ff00',
                    padding: 16,
                    borderRadius: 8,
                    fontFamily: 'monospace',
                    fontSize: 14,
                    lineHeight: 1.8,
                  }}
                >
                  <div>Welcome to BIG Company</div>
                  <div>------------------------</div>
                  <div>1. Check Balance</div>
                  <div>2. Place Order</div>
                  <div>3. Order History</div>
                  <div>4. Top Up Wallet</div>
                  <div>5. Contact Support</div>
                  <div>------------------------</div>
                  <div>Reply with option number</div>
                </div>
                <Paragraph type="secondary" style={{ marginTop: 16 }}>
                  Customers dial <Text code>*284#</Text> to access this menu
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Business Settings Tab */}
        <TabPane
          tab={<span><SettingOutlined />Business Settings</span>}
          key="business"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Card title={<><DollarOutlined /> Payment Settings</>}>
                <Form layout="vertical" form={settingsForm} onFinish={handleSaveSettings}>
                  <Form.Item label="Default Payment Terms" name="payment_terms">
                    <Select>
                      <Select.Option value="cod">Cash on Delivery</Select.Option>
                      <Select.Option value="net7">Net 7 Days</Select.Option>
                      <Select.Option value="net14">Net 14 Days</Select.Option>
                      <Select.Option value="net30">Net 30 Days</Select.Option>
                    </Select>
                  </Form.Item>
                  {isWholesaler && (
                    <Form.Item label="Default Credit Limit for New Retailers" name="default_credit">
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={(value) => `RWF ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value?.replace(/RWF\s?|(,*)/g, '') as any}
                      />
                    </Form.Item>
                  )}
                  <Form.Item label="Accepted Payment Methods" name="accepted_payments">
                    <Select mode="multiple">
                      <Select.Option value="wallet">Wallet Balance</Select.Option>
                      <Select.Option value="mobile_money">Mobile Money</Select.Option>
                      <Select.Option value="cash">Cash</Select.Option>
                      <Select.Option value="credit">Credit</Select.Option>
                      <Select.Option value="nfc">NFC Card</Select.Option>
                    </Select>
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Save Payment Settings
                  </Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title={<><PrinterOutlined /> POS & Hardware</>}>
                <Form layout="vertical">
                  <Form.Item label="Receipt Printer">
                    <Select defaultValue="bluetooth">
                      <Select.Option value="none">No Printer</Select.Option>
                      <Select.Option value="bluetooth">Bluetooth Printer</Select.Option>
                      <Select.Option value="usb">USB Printer</Select.Option>
                      <Select.Option value="network">Network Printer</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Barcode Scanner">
                    <Select defaultValue="camera">
                      <Select.Option value="none">No Scanner</Select.Option>
                      <Select.Option value="camera">Camera Scanner</Select.Option>
                      <Select.Option value="bluetooth">Bluetooth Scanner</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="NFC Reader" valuePropName="checked">
                    <Switch defaultChecked />
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      Enable NFC card payments
                    </Text>
                  </Form.Item>
                  <Button icon={<QrcodeOutlined />}>
                    Test Hardware Connection
                  </Button>
                </Form>
              </Card>
            </Col>

            <Col xs={24}>
              <Card title={<><ApiOutlined /> API & Integrations</>}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="API Key">
                      <Input.Password
                        defaultValue="sk_live_xxxxxxxxxxxxxxxxxxxx"
                        disabled
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Webhook URL">
                      <Input
                        placeholder="https://your-server.com/webhook"
                        defaultValue=""
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Space>
                  <Button icon={<ApiOutlined />}>
                    Regenerate API Key
                  </Button>
                  <Button>
                    View API Documentation
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Password Change Modal */}
      <Modal
        title="Change Password"
        open={isPasswordModalOpen}
        onCancel={() => setIsPasswordModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical" onFinish={handleUpdatePassword}>
          <Form.Item
            name="old_password"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter current password' }]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item
            name="confirm_password"
            label="Confirm New Password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Please confirm new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Update Password
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* PIN Change Modal */}
      <Modal
        title="Change PIN"
        open={isPinModalOpen}
        onCancel={() => setIsPinModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={pinForm} layout="vertical" onFinish={handleUpdatePin}>
          <Form.Item
            name="old_pin"
            label="Current PIN"
            rules={[{ required: true, message: 'Please enter current PIN' }]}
          >
            <Input.Password prefix={<MobileOutlined />} maxLength={4} />
          </Form.Item>
          <Form.Item
            name="new_pin"
            label="New PIN"
            rules={[
              { required: true, message: 'Please enter new PIN' },
              { len: 4, message: 'PIN must be exactly 4 digits' },
              { pattern: /^\d+$/, message: 'PIN must contain only numbers' }
            ]}
          >
            <Input.Password prefix={<MobileOutlined />} maxLength={4} />
          </Form.Item>
          <Form.Item
            name="confirm_pin"
            label="Confirm New PIN"
            dependencies={['new_pin']}
            rules={[
              { required: true, message: 'Please confirm new PIN' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_pin') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('PINs do not match'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<MobileOutlined />} maxLength={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Update PIN
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfileSettingsPage;
