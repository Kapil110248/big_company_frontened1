import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Form,
  InputNumber,
  message,
  Typography,
  Row,
  Col,
  Divider,
  Statistic,
  Alert,
  Tag,
  Modal
} from 'antd';
import {
  SettingOutlined,
  ReloadOutlined,
  SaveOutlined,
  PercentageOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  EditOutlined,
  LockOutlined,
  ThunderboltOutlined,
  WalletOutlined,
  CreditCardOutlined,
  FireOutlined,
  GiftOutlined
} from '@ant-design/icons';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;

const PricingConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [form] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getSystemConfig();
      if (response.data?.config) {
        setConfig(response.data.config);
        form.setFieldsValue(response.data.config);
      }
    } catch (error: any) {
      console.error('Failed to load config:', error);
      message.error('Failed to load system configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await adminApi.updateSystemConfig(values);
      message.success('Settings updated successfully');
      setIsEditing(false);
      setIsModalVisible(false);
      loadConfig();
    } catch (error: any) {
      message.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const showEditModal = () => {
    modalForm.setFieldsValue(config);
    setIsModalVisible(true);
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '24px' }}>
      {/* Orange Header Banner */}
      <Card bordered={false} style={{ 
        background: 'linear-gradient(90deg, #ff9800 0%, #f57c00 100%)', 
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(245, 124, 0, 0.2)'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="start">
              <SettingOutlined style={{ color: 'white', fontSize: 32, marginTop: 4 }} />
              <div>
                <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 600 }}>Pricing & System Configuration</Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Configure pricing, margins, rewards, and transaction limits</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadConfig}
              style={{ borderRadius: '8px', height: '40px' }}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
      >
        {/* Profit Margin Section */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <PercentageOutlined style={{ marginRight: '8px', color: '#f57c00' }} />
              Profit Margin Settings
            </Title>
            <Button 
              type="link" 
              icon={<EditOutlined />} 
              onClick={showEditModal}
              style={{ color: '#1890ff', fontWeight: 500 }}
            >
              Edit
            </Button>
          </div>

          <Alert
            message="Profit Distribution Model"
            description="Configure how profits are distributed between retailers, company, and gas rewards."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: '16px', borderRadius: '8px', background: '#e3f2fd', border: '1px solid #90caf9' }}
          />

          <Row gutter={16}>
            <Col span={8}>
              <Card bordered={false} style={{ borderRadius: '12px', background: '#e1f5fe' }}>
                <Form.Item name="retailerShare" label="Retailer Share (%)" style={{ margin: 0 }}>
                  <InputNumber 
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '24px', fontWeight: 'bold' }} 
                    formatter={value => `${value}%`}
                    parser={value => value!.replace('%', '')}
                  />
                </Form.Item>
              </Card>
            </Col>
            <Col span={8}>
              <Card bordered={false} style={{ borderRadius: '12px', background: '#fff3e0' }}>
                <Form.Item name="companyShare" label="Company Share (%)">
                  <InputNumber 
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '24px', fontWeight: 'bold' }} 
                    formatter={value => `${value}%`}
                    parser={value => value!.replace('%', '')}
                  />
                </Form.Item>
              </Card>
            </Col>
            <Col span={8}>
              <Card bordered={false} style={{ borderRadius: '12px', background: '#f1f8e9' }}>
                <Form.Item name="gasRewardShare" label="Gas Reward (%)">
                  <InputNumber 
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '24px', fontWeight: 'bold' }} 
                    formatter={value => `${value}% - M³`}
                    parser={value => value!.replace('% - M³', '')}
                    disabled
                  />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </section>

        <Row gutter={24}>
          {/* Gas Pricing Column */}
          <Col span={12}>
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                  <FireOutlined style={{ marginRight: '8px', color: '#f57c00' }} />
                  Gas Pricing
                </Title>
                {!isEditing && (
                  <Button type="link" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>Edit</Button>
                )}
                {isEditing && (
                  <Space>
                    <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={loading} style={{ background: '#f57c00', borderColor: '#f57c00' }}>Save</Button>
                  </Space>
                )}
              </div>
              <Card bordered={false} style={{ borderRadius: '12px' }}>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Col><Text type="secondary">Price per M³</Text></Col>
                  <Col>
                    <Form.Item name="gasPricePerM3" style={{ margin: 0 }}>
                      <InputNumber style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} formatter={value => `${value} RWF`} disabled={!isEditing} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Col><Text type="secondary">Min Top-up</Text></Col>
                  <Col>
                    <Form.Item name="minGasTopup" style={{ margin: 0 }}>
                      <InputNumber style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} formatter={value => `${value} RWF`} disabled={!isEditing} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0' }}>
                  <Col><Text type="secondary">Max Top-up</Text></Col>
                  <Col>
                    <Form.Item name="maxGasTopup" style={{ margin: 0 }}>
                      <InputNumber style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} formatter={value => `${value} RWF`} disabled={!isEditing} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </section>
          </Col>

          {/* Transaction Limits Column */}
          <Col span={12}>
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                  <ThunderboltOutlined style={{ marginRight: '8px', color: '#f57c00' }} />
                  Transaction Limits
                </Title>
                {!isEditing && (
                  <Button type="link" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>Edit</Button>
                )}
                {isEditing && (
                  <Space>
                    <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={loading} style={{ background: '#f57c00', borderColor: '#f57c00' }}>Save</Button>
                  </Space>
                )}
              </div>
              <Card bordered={false} style={{ borderRadius: '12px' }}>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Col><Text type="secondary">Min Wallet Top-up</Text></Col>
                  <Col>
                    <Form.Item name="minWalletTopup" style={{ margin: 0 }}>
                      <InputNumber style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} formatter={value => `${value} RWF`} disabled={!isEditing} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Col><Text type="secondary">Max Wallet Top-up</Text></Col>
                  <Col>
                    <Form.Item name="maxWalletTopup" style={{ margin: 0 }}>
                      <InputNumber style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} formatter={value => `${value} RWF`} disabled={!isEditing} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Col><Text type="secondary">Max Daily Transaction</Text></Col>
                  <Col>
                    <Form.Item name="maxDailyTransaction" style={{ margin: 0 }}>
                      <InputNumber style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} formatter={value => `${value} RWF`} disabled={!isEditing} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row justify="space-between" align="middle" style={{ padding: '12px 0' }}>
                  <Col><Text type="secondary">Max Credit Limit</Text></Col>
                  <Col>
                    <Form.Item name="maxCreditLimit" style={{ margin: 0 }}>
                      <InputNumber style={{ border: 'none', textAlign: 'right', fontWeight: 'bold' }} formatter={value => `${value} RWF`} disabled={!isEditing} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </section>
          </Col>
        </Row>

        {/* Gas Rewards Configuration */}
        <section style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <GiftOutlined style={{ marginRight: '8px', color: '#f1c40f' }} />
              Gas Rewards Configuration (In M³)
            </Title>
          </div>
          <Alert
            message="Rewards are in Meter Cubes (M³)"
            description="Gas reward equals a percentage of profit for each transaction. Only customers with meter IDs can earn gas rewards."
            type="warning"
            showIcon
            style={{ marginBottom: '16px', borderRadius: '8px', background: '#fffde7', border: '1px solid #fff59d' }}
          />
          <Card bordered={false} style={{ borderRadius: '12px' }}>
             <Row gutter={48}>
                <Col span={12}>
                    <div style={{ marginBottom: '12px' }}><Text strong style={{ color: '#52c41a' }}>WITH Meter ID (Gas Reward Eligible)</Text></div>
                    <Row justify="space-between" style={{ padding: '8px 0' }}>
                        <Col><Text type="secondary">Retailer Share</Text></Col>
                        <Col><Tag color="blue">60%</Tag></Col>
                    </Row>
                    <Row justify="space-between" style={{ padding: '8px 0' }}>
                        <Col><Text type="secondary">Company Share</Text></Col>
                        <Col><Tag color="orange">28%</Tag></Col>
                    </Row>
                    <Row justify="space-between" style={{ padding: '8px 0' }}>
                        <Col><Text type="secondary">Gas Reward (M³)</Text></Col>
                        <Col><Tag color="green">12%</Tag></Col>
                    </Row>
                </Col>
                <Col span={12} style={{ borderLeft: '1px solid #f0f0f0' }}>
                    <div style={{ marginBottom: '12px' }}><Text strong style={{ color: '#ff4d4f' }}>WITHOUT Meter ID (No Gas Reward)</Text></div>
                    <Row justify="space-between" style={{ padding: '8px 0' }}>
                        <Col><Text type="secondary">Retailer Share</Text></Col>
                        <Col><Tag color="blue">60%</Tag></Col>
                    </Row>
                    <Row justify="space-between" style={{ padding: '8px 0' }}>
                        <Col><Text type="secondary">Company Share</Text></Col>
                        <Col><Tag color="red">40%</Tag></Col>
                    </Row>
                    <Row justify="space-between" style={{ padding: '8px 0' }}>
                        <Col><Text type="secondary">Gas Reward</Text></Col>
                        <Col><Text type="danger" style={{ fontSize: '12px' }}>0% (User not eligible)</Text></Col>
                    </Row>
                </Col>
             </Row>
          </Card>
        </section>
      </Form>

      <Modal
        title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Edit Profit Margins</span>}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
        centered
        styles={{
          header: { borderBottom: 'none', padding: '24px 24px 0' },
          body: { padding: '24px' }
        }}
      >
        <Form
          form={modalForm}
          layout="vertical"
          onFinish={handleSave}
          requiredMark
        >
          <Form.Item
            name="retailerShare"
            label={<Text strong>Retailer Share (%)</Text>}
            rules={[{ required: true, message: 'Please input retailer share' }]}
          >
            <InputNumber
              style={{ width: '100%', borderRadius: '8px' }}
              suffix="%"
              placeholder="Enter retailer share"
            />
          </Form.Item>

          <Form.Item
            name="companyShare"
            label={<Text strong>Company Share (%)</Text>}
            rules={[{ required: true, message: 'Please input company share' }]}
          >
            <InputNumber
              style={{ width: '100%', borderRadius: '8px' }}
              suffix="%"
              placeholder="Enter company share"
            />
          </Form.Item>

          <Form.Item
            name="gasRewardShare"
            label={<Text strong>Gas Reward (% of profit in M³)</Text>}
            rules={[{ required: true, message: 'Please input gas reward share' }]}
          >
            <InputNumber
              style={{ width: '100%', borderRadius: '8px' }}
              suffix="%"
              placeholder="Enter gas reward share"
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <Button 
              onClick={() => setIsModalVisible(false)}
              style={{ borderRadius: '8px', height: '40px', padding: '0 24px' }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
              style={{ 
                borderRadius: '8px', 
                height: '40px', 
                padding: '0 24px',
                background: '#1890ff',
                borderColor: '#1890ff'
              }}
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal>

      <style>{`
        .ant-input-number-input {
          text-align: right !important;
          padding-right: 0 !important;
        }
        .ant-input-number-handler-wrap {
          display: none;
        }
        .ant-form-item-label > label {
            color: #8c8c8c !important;
        }
      `}</style>
    </div>
  );
};

export default PricingConfigPage;
