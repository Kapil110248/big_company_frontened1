import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { API_URL } from "../../config";
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Statistic,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Avatar,
  Descriptions,
  Tabs,
  Alert,
  List,
  Divider,
  Select,
} from "antd";
import {
  ShopOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  TruckOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  BankOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

// Supplier/Manufacturer interface
interface Supplier {
  id: string;
  name: string;
  type: "supplier" | "manufacturer";
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  status: "active" | "inactive";
  payment_terms: string;
  total_orders: number;
  total_paid: number;
  outstanding_balance: number;
  products_supplied: number;
  created_at: string;
}

// Profit Invoice from Admin
interface ProfitInvoice {
  id: string;
  invoice_number: string;
  period: string; // e.g., "November 2024"
  gross_profit: number;
  monthly_expenses: number;
  net_profit: number;
  status: "pending" | "paid" | "disputed";
  admin_notes?: string;
  created_at: string;
  due_date: string;
  paid_at?: string;
}

export const MyManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<ProfitInvoice[]>([]);
  const [managementStats, setManagementStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    outstandingPayments: 0,
    netProfit: 0,
  });
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [selectedInvoice, setSelectedInvoice] = useState<ProfitInvoice | null>(
    null
  );
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [addSupplierModalOpen, setAddSupplierModalOpen] = useState(false);
  const [editSupplierModalOpen, setEditSupplierModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchManagementData();
  }, []);

  const fetchManagementData = async () => {
    setLoading(true);
    try {
      const authToken = token || localStorage.getItem("bigcompany_token");

      // Fetch suppliers from real API
      const suppliersResponse = await fetch(
        `${API_URL}/wholesaler/management/suppliers`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!suppliersResponse.ok) {
        throw new Error("Failed to fetch suppliers");
      }

      const suppliersData = await suppliersResponse.json();
      setSuppliers(suppliersData.suppliers || []);

      // Fetch profit invoices from real API
      const invoicesResponse = await fetch(
        `${API_URL}/wholesaler/management/profit-invoices`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!invoicesResponse.ok) {
        throw new Error("Failed to fetch profit invoices");
      }

      const invoicesData = await invoicesResponse.json();
      setInvoices(invoicesData.invoices || []);

      // Fetch management stats from real API
      const statsResponse = await fetch(
        `${API_URL}/wholesaler/management/stats`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setManagementStats(statsData);
      }
    } catch (error) {
      console.error("Error fetching management data:", error);
      message.error("Failed to load management data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    `${(amount ?? 0).toLocaleString()} RWF`;
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-RW", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchText.toLowerCase()) ||
      s.contact_person.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleAddSupplier = async (values: any) => {
    try {
      const authToken = token || localStorage.getItem("bigcompany_token");

      const response = await fetch(
        `${API_URL}/wholesaler/management/suppliers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add supplier");
      }

      const data = await response.json();
      console.log("Supplier added:", data);
      message.success("Supplier added successfully!");
      setAddSupplierModalOpen(false);
      form.resetFields();
      fetchManagementData();
    } catch (error) {
      console.error("Error adding supplier:", error);
      message.error("Failed to add supplier");
    }
  };

  const handleEditSupplier = async (values: any) => {
    if (!selectedSupplier) return;
    try {
      const authToken = token || localStorage.getItem("bigcompany_token");

      const response = await fetch(
        `${API_URL}/wholesaler/management/suppliers/${selectedSupplier.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update supplier");
      }

      message.success("Supplier updated successfully!");
      setEditSupplierModalOpen(false);
      editForm.resetFields();
      setSelectedSupplier(null);
      fetchManagementData();
    } catch (error) {
      console.error("Error updating supplier:", error);
      message.error("Failed to update supplier");
    }
  };

  const totalSuppliers = managementStats.totalSuppliers;
  const activeSuppliers = managementStats.activeSuppliers;
  const totalOutstanding = managementStats.outstandingPayments;
  const totalNetProfit = managementStats.netProfit;

  const supplierColumns = [
    {
      title: "Supplier/Manufacturer",
      key: "name",
      render: (_: any, record: Supplier) => (
        <Space>
          <Avatar
            style={{
              backgroundColor:
                record.type === "manufacturer" ? "#722ed1" : "#1890ff",
            }}
          >
            {record.type === "manufacturer" ? "M" : "S"}
          </Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Tag color={record.type === "manufacturer" ? "purple" : "blue"}>
              {record.type.toUpperCase()}
            </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_: any, record: Supplier) => (
        <div>
          <Text>{record.contact_person}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.phone}
          </Text>
        </div>
      ),
    },
    {
      title: "Products Supplied",
      dataIndex: "products_supplied",
      key: "products_supplied",
    },
    {
      title: "Total Paid",
      dataIndex: "total_paid",
      key: "total_paid",
      render: (v: number) => formatCurrency(v),
    },
    {
      title: "Outstanding",
      dataIndex: "outstanding_balance",
      key: "outstanding_balance",
      render: (v: number) => (
        <Text style={{ color: v > 0 ? "#ff4d4f" : "#52c41a" }}>
          {formatCurrency(v)}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "default"}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Supplier) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedSupplier(record);
              setSupplierModalOpen(true);
            }}
          >
            View
          </Button>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedSupplier(record);
              editForm.setFieldsValue(record);
              setEditSupplierModalOpen(true);
            }}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  const invoiceColumns = [
    {
      title: "Invoice #",
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (v: string) => <Tag color="purple">{v}</Tag>,
    },
    {
      title: "Period",
      dataIndex: "period",
      key: "period",
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: "Gross Profit",
      dataIndex: "gross_profit",
      key: "gross_profit",
      render: (v: number) => (
        <Text style={{ color: "#52c41a" }}>{formatCurrency(v)}</Text>
      ),
    },
    {
      title: "Monthly Expenses",
      dataIndex: "monthly_expenses",
      key: "monthly_expenses",
      render: (v: number) => (
        <Text style={{ color: "#ff4d4f" }}>-{formatCurrency(v)}</Text>
      ),
    },
    {
      title: "Net Profit",
      dataIndex: "net_profit",
      key: "net_profit",
      render: (v: number) => (
        <Text strong style={{ color: "#722ed1", fontSize: 16 }}>
          {formatCurrency(v)}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: Record<string, string> = {
          paid: "green",
          pending: "orange",
          disputed: "red",
        };
        const icons: Record<string, React.ReactNode> = {
          paid: <CheckCircleOutlined />,
          pending: <ClockCircleOutlined />,
        };
        return (
          <Tag color={colors[status]} icon={icons[status]}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      render: (v: string) => formatDate(v),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ProfitInvoice) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedInvoice(record);
            setInvoiceModalOpen(true);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #722ed1 0%, #531dab 100%)",
          padding: "24px",
          marginBottom: 24,
          borderRadius: 12,
          color: "white",
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: "white", margin: 0 }}>
              <SettingOutlined /> My Management
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.8)" }}>
              Manage your suppliers, manufacturers, and profit invoices
            </Text>
          </Col>
        </Row>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="Total Suppliers"
              value={totalSuppliers}
              prefix={<TruckOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="Active"
              value={activeSuppliers}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="Outstanding Payments"
              value={totalOutstanding}
              prefix={<DollarOutlined style={{ color: "#ff4d4f" }} />}
              valueStyle={{ color: "#ff4d4f" }}
              formatter={(v) => formatCurrency(Number(v))}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="Net Profit (Paid)"
              value={totalNetProfit}
              prefix={<DollarOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1" }}
              formatter={(v) => formatCurrency(Number(v))}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card>
        <Tabs defaultActiveKey="suppliers">
          <TabPane
            tab={
              <span>
                <TruckOutlined /> Suppliers & Manufacturers ({suppliers.length})
              </span>
            }
            key="suppliers"
          >
            <Alert
              message="Supplier/Manufacturer Management"
              description="List of all suppliers and manufacturers that supply goods to your wholesaler account"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Space style={{ marginBottom: 16 }}>
              <Input
                placeholder="Search suppliers..."
                prefix={<SearchOutlined />}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddSupplierModalOpen(true)}
              >
                Add Supplier
              </Button>
            </Space>
            <Table
              columns={supplierColumns}
              dataSource={filteredSuppliers}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <FileTextOutlined /> Profit Invoices ({invoices.length})
              </span>
            }
            key="invoices"
          >
            <Alert
              message="Admin Profit Invoices"
              description="Monthly profit invoices sent by admin after expenses are removed. These show your net profit after platform fees and other deductions."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={invoiceColumns}
              dataSource={invoices}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Supplier Details Modal */}
      <Modal
        title="Supplier Details"
        open={supplierModalOpen}
        onCancel={() => setSupplierModalOpen(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setSupplierModalOpen(false)}>
            Close
          </Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />}>
            Edit Supplier
          </Button>,
        ]}
      >
        {selectedSupplier && (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Company Name" span={2}>
                <Space>
                  <Avatar
                    style={{
                      backgroundColor:
                        selectedSupplier.type === "manufacturer"
                          ? "#722ed1"
                          : "#1890ff",
                    }}
                    size="large"
                  >
                    {selectedSupplier.type === "manufacturer" ? "M" : "S"}
                  </Avatar>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      {selectedSupplier.name}
                    </Text>
                    <br />
                    <Tag
                      color={
                        selectedSupplier.type === "manufacturer"
                          ? "purple"
                          : "blue"
                      }
                    >
                      {selectedSupplier.type.toUpperCase()}
                    </Tag>
                  </div>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <PhoneOutlined /> Contact Person
                  </>
                }
              >
                {selectedSupplier.contact_person}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <MailOutlined /> Email
                  </>
                }
              >
                {selectedSupplier.email}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <PhoneOutlined /> Phone
                  </>
                }
              >
                {selectedSupplier.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Terms">
                <Tag>{selectedSupplier.payment_terms}</Tag>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <EnvironmentOutlined /> Address
                  </>
                }
                span={2}
              >
                {selectedSupplier.address}
              </Descriptions.Item>
              <Descriptions.Item label="Total Orders">
                {selectedSupplier.total_orders}
              </Descriptions.Item>
              <Descriptions.Item label="Products Supplied">
                {selectedSupplier.products_supplied}
              </Descriptions.Item>
              <Descriptions.Item label="Total Paid">
                <Text style={{ color: "#52c41a" }}>
                  {formatCurrency(selectedSupplier.total_paid)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Outstanding Balance">
                <Text
                  style={{
                    color:
                      selectedSupplier.outstanding_balance > 0
                        ? "#ff4d4f"
                        : "#52c41a",
                  }}
                >
                  {formatCurrency(selectedSupplier.outstanding_balance)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                <Tag
                  color={
                    selectedSupplier.status === "active" ? "green" : "default"
                  }
                >
                  {selectedSupplier.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      {/* Invoice Details Modal */}
      <Modal
        title="Profit Invoice Details"
        open={invoiceModalOpen}
        onCancel={() => setInvoiceModalOpen(false)}
        width={600}
        footer={[
          <Button key="close" onClick={() => setInvoiceModalOpen(false)}>
            Close
          </Button>,
          selectedInvoice?.status === "pending" && (
            <Button key="pay" type="primary" icon={<DollarOutlined />}>
              Mark as Paid
            </Button>
          ),
        ].filter(Boolean)}
      >
        {selectedInvoice && (
          <>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Invoice Number">
                <Tag color="purple" style={{ fontSize: 14 }}>
                  {selectedInvoice.invoice_number}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Period">
                <Text strong>{selectedInvoice.period}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Gross Profit">
                <Text style={{ color: "#52c41a", fontSize: 16 }}>
                  {formatCurrency(selectedInvoice.gross_profit)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Monthly Expenses">
                <Text style={{ color: "#ff4d4f", fontSize: 16 }}>
                  -{formatCurrency(selectedInvoice.monthly_expenses)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Net Profit">
                <Text strong style={{ color: "#722ed1", fontSize: 20 }}>
                  {formatCurrency(selectedInvoice.net_profit)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag
                  color={selectedInvoice.status === "paid" ? "green" : "orange"}
                >
                  {selectedInvoice.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Due Date">
                {formatDate(selectedInvoice.due_date)}
              </Descriptions.Item>
              {selectedInvoice.paid_at && (
                <Descriptions.Item label="Paid Date">
                  {formatDate(selectedInvoice.paid_at)}
                </Descriptions.Item>
              )}
              {selectedInvoice.admin_notes && (
                <Descriptions.Item label="Admin Notes">
                  {selectedInvoice.admin_notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </Modal>

      {/* Add Supplier Modal */}
      <Modal
        title="Add New Supplier/Manufacturer"
        open={addSupplierModalOpen}
        onCancel={() => {
          setAddSupplierModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleAddSupplier}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Company Name"
                rules={[{ required: true }]}
              >
                <Input size="large" placeholder="e.g., Bralirwa Ltd" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                <Select size="large" placeholder="Select type">
                  <Option value="supplier">Supplier</Option>
                  <Option value="manufacturer">Manufacturer</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contact_person"
                label="Contact Person"
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, type: "email" }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="payment_terms"
                label="Payment Terms"
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Option value="Net 7">Net 7</Option>
                  <Option value="Net 15">Net 15</Option>
                  <Option value="Net 30">Net 30</Option>
                  <Option value="Net 60">Net 60</Option>
                  <Option value="Cash on Delivery">Cash on Delivery</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address" label="Address">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setAddSupplierModalOpen(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Add Supplier
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Supplier Modal */}
      <Modal
        title="Edit Supplier/Manufacturer"
        open={editSupplierModalOpen}
        onCancel={() => {
          setEditSupplierModalOpen(false);
          editForm.resetFields();
          setSelectedSupplier(null);
        }}
        footer={null}
        width={700}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSupplier}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Company Name"
                rules={[{ required: true }]}
              >
                <Input size="large" placeholder="e.g., Bralirwa Ltd" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                <Select size="large" placeholder="Select type">
                  <Option value="supplier">Supplier</Option>
                  <Option value="manufacturer">Manufacturer</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contact_person"
                label="Contact Person"
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ required: true, type: "email" }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[{ required: true }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="payment_terms"
                label="Payment Terms"
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Option value="Net 7">Net 7</Option>
                  <Option value="Net 15">Net 15</Option>
                  <Option value="Net 30">Net 30</Option>
                  <Option value="Net 60">Net 60</Option>
                  <Option value="Cash on Delivery">Cash on Delivery</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address" label="Address">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button
                onClick={() => {
                  setEditSupplierModalOpen(false);
                  editForm.resetFields();
                  setSelectedSupplier(null);
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Update Supplier
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MyManagementPage;
