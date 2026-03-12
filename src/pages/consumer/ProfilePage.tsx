import React, { useState, useEffect } from 'react';
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
  Spin,
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
  CreditCardOutlined,
  HistoryOutlined,
  ShopOutlined,
  LinkOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { user, token } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [form] = Form.useForm();

  // State for API data
  const [profileData, setProfileData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>(null);

  // Fetch all profile data on mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    if (!token) {
      setPageLoading(false);
      return;
    }

    try {
      setPageLoading(true);

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch all data in parallel
      const [profileRes, statsRes, activityRes, preferencesRes] = await Promise.all([
        fetch(`${API_URL}/store/customers/me`, { headers }),
        fetch(`${API_URL}/store/customers/me/stats`, { headers }),
        fetch(`${API_URL}/store/customers/me/activity`, { headers }),
        fetch(`${API_URL}/store/customers/me/preferences`, { headers }),
      ]);

      const profileJson = await profileRes.json();
      const statsJson = await statsRes.json();
      const activityJson = await activityRes.json();
      const preferencesJson = await preferencesRes.json();

      if (profileJson.success) {
        setProfileData(profileJson.data);
        // Update form with fetched data
        form.setFieldsValue({
          name: profileJson.data.full_name || user?.name,
          phone: profileJson.data.phone || user?.phone,
          email: profileJson.data.email || user?.email,
          address: profileJson.data.address || '',
          landmark: profileJson.data.landmark || '',
        });
      }

      if (statsJson.success) {
        setStats(statsJson.data);
      }

      if (activityJson.success) {
        setActivity(activityJson.data);
      }

      if (preferencesJson.success) {
        setPreferences(preferencesJson.data);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      message.error('Failed to load profile data');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/store/customers/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: values.name,
          email: values.email,
          address: values.address,
          landmark: values.landmark,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('Profile updated successfully');
        setProfileData(data.data);
        setEditing(false);
      } else {
        message.error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    if (!token) return;

    try {
      const updatedPreferences = {
        push_notifications: preferences?.push_notifications,
        email_notifications: preferences?.email_notifications,
        sms_notifications: preferences?.sms_notifications,
        [key]: value,
      };

      const response = await fetch(`${API_URL}/store/customers/me/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPreferences),
      });

      const data = await response.json();

      if (data.success) {
        setPreferences(data.data);
        message.success('Preferences updated successfully');
      } else {
        message.error(data.error || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      message.error('Failed to update preferences');
    }
  };

  if (pageLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', marginTop: '100px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              {profileData?.full_name || user?.name || 'Consumer'}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
              <PhoneOutlined /> {profileData?.phone || user?.phone || '+250788000001'}
            </Text>
            <div style={{ marginTop: 8 }}>
              {profileData?.is_verified && <Tag color="green">Verified Account</Tag>}
              {profileData?.membership_type === 'premium' && <Tag color="blue">Premium Member</Tag>}
              {profileData?.membership_type === 'standard' && <Tag color="default">Standard Member</Tag>}
            </div>
          </Col>
          <Col>
            <Button
              type={editing ? 'primary' : 'default'}
              icon={editing ? <SaveOutlined /> : <EditOutlined />}
              onClick={() => (editing ? form.submit() : setEditing(true))}
              loading={loading}
              style={editing ? {} : { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
            >
              {editing ? 'Save Changes' : 'Edit Profile'}
            </Button>
          </Col>
        </Row>
      </div>

      <Row gutter={[24, 24]}>
        {/* Personal Information */}
        <Col xs={24} lg={16}>
          <Card title={<><UserOutlined /> Personal Information</>}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="name" label="Full Name">
                    <Input
                      prefix={<UserOutlined />}
                      disabled={!editing}
                      placeholder="Enter your full name"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="phone" label="Phone Number">
                    <Input
                      prefix={<PhoneOutlined />}
                      disabled
                      placeholder="Phone number"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="email" label="Email Address">
                    <Input
                      prefix={<MailOutlined />}
                      disabled={!editing}
                      placeholder="Enter email"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="address" label="Delivery Address">
                    <Input
                      prefix={<HomeOutlined />}
                      disabled={!editing}
                      placeholder="Enter address"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="landmark" label="Landmark/Additional Info">
                <Input.TextArea
                  disabled={!editing}
                  placeholder="Any landmark or additional delivery instructions"
                  rows={2}
                />
              </Form.Item>
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

          {/* Settings */}
          <Card title={<><BellOutlined /> Preferences & Settings</>} style={{ marginTop: 24 }}>
            <List>
              <List.Item
                actions={[
                  <Switch
                    checked={preferences?.push_notifications ?? true}
                    onChange={(checked) => handlePreferenceChange('push_notifications', checked)}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={<BellOutlined style={{ fontSize: 20, color: '#667eea' }} />}
                  title="Push Notifications"
                  description="Receive order updates and promotions"
                />
              </List.Item>
              <List.Item
                actions={[
                  <Switch
                    checked={preferences?.email_notifications ?? true}
                    onChange={(checked) => handlePreferenceChange('email_notifications', checked)}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={<MailOutlined style={{ fontSize: 20, color: '#667eea' }} />}
                  title="Email Notifications"
                  description="Receive order confirmations via email"
                />
              </List.Item>
              <List.Item
                actions={[
                  <Switch
                    checked={preferences?.sms_notifications ?? false}
                    onChange={(checked) => handlePreferenceChange('sms_notifications', checked)}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={<PhoneOutlined style={{ fontSize: 20, color: '#667eea' }} />}
                  title="SMS Notifications"
                  description="Receive SMS for important updates"
                />
              </List.Item>
            </List>
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          {/* Account Stats */}
          <Card>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Text type="secondary">Total Orders</Text>
                  <Title level={2} style={{ margin: '8px 0 0', color: '#667eea' }}>
                    {stats?.total_orders ?? 0}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>Online + Shop Orders</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Text type="secondary">Available Balance</Text>
                  <Title level={4} style={{ margin: '8px 0 0', color: '#52c41a' }}>
                    {stats?.wallet_balance?.toLocaleString() ?? 0} RWF
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>Dashboard + Credit</Text>
                </div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
              <Col span={24}>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Text type="secondary">Gas Rewards</Text>
                  <Title level={3} style={{ margin: '8px 0 0', color: '#fa8c16' }}>
                    {stats?.gas_rewards?.toFixed(1) ?? 0} M³
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>Cubic Meters</Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Security */}
          <Card title={<><LockOutlined /> Security</>} style={{ marginTop: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block icon={<LockOutlined />}>
                Change PIN
              </Button>
              <Button block icon={<CreditCardOutlined />}>
                Manage Payment Methods
              </Button>
              <Button block type="text" danger>
                Logout from All Devices
              </Button>
            </Space>
          </Card>

          {/* My Linked Retailers */}
          <Card
            title={<><LinkOutlined /> My Linked Retailers</>}
            style={{ marginTop: 24 }}
          >
            {profileData?.linkedRetailers && profileData.linkedRetailers.length > 0 ? (
              <List
                dataSource={profileData.linkedRetailers}
                renderItem={(retailer: any) => (
                  <List.Item key={retailer.id}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <Avatar
                          size={40}
                          icon={<ShopOutlined />}
                          style={{ backgroundColor: retailer.id === profileData.linkedRetailer?.id ? '#52c41a' : '#1890ff', marginRight: 12 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Text strong style={{ fontSize: 14, display: 'block' }}>
                              {retailer.shopName}
                            </Text>
                            {retailer.id === profileData.linkedRetailer?.id && (
                              <Tag color="green" style={{ margin: 0, fontSize: 10 }}>Primary</Tag>
                            )}
                          </div>
                          <Text type="secondary" style={{ fontSize: 12 }}>ID: {retailer.id}</Text>
                        </div>
                      </div>
                      <Space direction="vertical" size={2} style={{ width: '100%', paddingLeft: 52 }}>
                        {retailer.phone && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <PhoneOutlined style={{ marginRight: 8 }} />
                            {retailer.phone}
                          </Text>
                        )}
                        {retailer.address && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <HomeOutlined style={{ marginRight: 8 }} />
                            {retailer.address}
                          </Text>
                        )}
                      </Space>
                      <div style={{ marginTop: 12, paddingLeft: 52 }}>
                        <Button 
                          type="primary" 
                          size="small" 
                          ghost 
                          onClick={() => window.location.href = `/consumer/shop?retailerId=${retailer.id}`}
                        >
                          Shop Now
                        </Button>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '16px 0' }}>
                <ShopOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <div>No retailers linked yet</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Discover and link with retailers to start shopping
                </Text>
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card title={<><HistoryOutlined /> Recent Activity</>} style={{ marginTop: 24 }}>
            <List
              size="small"
              dataSource={activity}
              locale={{ emptyText: 'No recent activity' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Tag
                        color={
                          item.type === 'order' ? 'blue' : item.type === 'wallet' ? 'green' : 'purple'
                        }
                      >
                        {item.type}
                      </Tag>
                    }
                    title={item.action}
                    description={item.time}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;
