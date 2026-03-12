import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [form] = Form.useForm();

  // Demo credentials for admin
  const demoCredentials = {
    email: 'admin@bigcompany.rw',
    password: 'admin123',
  };

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      // Try real backend authentication first
      await login(
        { email: values.email, password: values.password },
        'admin'
      );
      message.success('Admin login successful!');
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Admin login error:', error);
      message.error(error.response?.data?.error || error.message || 'Invalid admin credentials');
    }
  };

  const fillDemoCredentials = () => {
    form.setFieldsValue(demoCredentials);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5222d 0%, #722ed1 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: 400,
          borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #f5222d, #722ed1)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <SafetyCertificateOutlined style={{ fontSize: 40, color: '#fff' }} />
          </div>
          <Title level={2} style={{ margin: 0, color: '#f5222d' }}>
            Admin Portal
          </Title>
          <Text type="secondary">BIG Company Rwanda - Administration</Text>
        </div>

        {/* Default Backend Credentials Box */}
        <Card
          size="small"
          style={{
            background: '#fff2f0',
            border: '1px solid #ffccc7',
            marginBottom: 24,
            borderRadius: 8,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <Text strong style={{ color: '#f5222d' }}>Default Backend Admin</Text>
          </div>
          <div style={{ fontSize: 12 }}>
            <div>Email: <code>{demoCredentials.email}</code></div>
            <div>Password: <code>{demoCredentials.password}</code></div>
          </div>
          <Button
            type="dashed"
            size="small"
            block
            onClick={fillDemoCredentials}
            style={{ marginTop: 8 }}
          >
            Auto-fill Credentials
          </Button>
        </Card>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleLogin}
          initialValues={demoCredentials}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Admin Email"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isLoading}
              style={{
                background: 'linear-gradient(90deg, #f5222d, #722ed1)',
                border: 'none',
                height: 48,
              }}
            >
              Sign in as Admin
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Button type="link" onClick={() => navigate('/')}>
            ← Back to Home
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AdminLoginPage;
