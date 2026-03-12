import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    Descriptions,
    Avatar,
    Tag,
    Button,
    Spin,
    message,
    Typography,
    Row,
    Col,
    Tabs,
    Space
} from 'antd';
import {
    UserOutlined,
    ArrowLeftOutlined,
    MailOutlined,
    PhoneOutlined,
    BankOutlined,
    CalendarOutlined,
    FallOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { employeeService, Employee } from '../../services/employeeService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const EmployeeDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                if (!id) return;
                // Fetch all managers/employees to find the specific one 
                // Or implement a getEmployeeById in service. 
                // For now, let's reuse getEmployees and filter, but finding by ID is better.
                // Assuming we update backend to support GET /employees/:id or we just filter client side for now.
                const response = await employeeService.getEmployees();
                const found = response.employees.find((e: Employee) => e.id === id);
                if (found) {
                    setEmployee(found);
                } else {
                    message.error('Employee not found');
                    navigate('/admin/employees');
                }
            } catch (error) {
                message.error('Failed to load employee details');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployee();
    }, [id, navigate]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div>
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/admin/employees')}
                style={{ marginBottom: 16 }}
            >
                Back to List
            </Button>

            <Card>
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
                    <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff', marginRight: 24 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <Title level={2} style={{ marginBottom: 4 }}>{employee.firstName} {employee.lastName}</Title>
                                <Space size={[0, 8]} wrap>
                                    <Tag color="blue">{employee.department}</Tag>
                                    <Tag color="cyan">{employee.position}</Tag>
                                    <Tag color={employee.status === 'active' ? 'success' : 'default'}>
                                        {employee.status.toUpperCase()}
                                    </Tag>
                                </Space>
                                <div style={{ marginTop: 16 }}>
                                    <Space direction="vertical" size={2}>
                                        <Space><MailOutlined /> <Text copyable>{employee.email}</Text></Space>
                                        <Space><PhoneOutlined /> <Text copyable>{employee.phone}</Text></Space>
                                        <Space><CalendarOutlined /> <Text>Joined: {dayjs(employee.dateOfJoining).format('MMMM DD, YYYY')}</Text></Space>
                                    </Space>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>Employee ID</Text>
                                <Text strong>{employee.employeeNumber}</Text>
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultActiveKey="1">
                    <TabPane tab="Personal Information" key="1">
                        <Descriptions title="Banking & Finance" bordered>
                            <Descriptions.Item label="Salary">{employee.salary.toLocaleString()} RWF / Month</Descriptions.Item>
                            <Descriptions.Item label="Bank Account" span={2}><BankOutlined /> {employee.bankAccount || 'Not Provided'}</Descriptions.Item>
                            <Descriptions.Item label="Address">Kigali, Rwanda (Placeholder)</Descriptions.Item>
                        </Descriptions>
                    </TabPane>

                    <TabPane tab="Attendance" key="2">
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <CalendarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                            <Title level={4} type="secondary">Attendance History</Title>
                            <Text type="secondary">Attendance records will appear here.</Text>
                        </div>
                    </TabPane>

                    <TabPane tab="Leaves" key="3">
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <FallOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                            <Title level={4} type="secondary">Leave History</Title>
                            <Text type="secondary">Leave requests and history will appear here.</Text>
                        </div>
                    </TabPane>

                    <TabPane tab="Projects" key="4">
                        <div style={{ textAlign: 'center', padding: 40 }}>
                            <Title level={4} type="secondary">Assigned Projects</Title>
                            <Text type="secondary">No active projects assigned.</Text>
                        </div>
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    );
};

export default EmployeeDetailsPage;
