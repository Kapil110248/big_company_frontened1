import { useEffect, useState } from 'react';
import {
  Table,
  Space,
  Card,
  Tag,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  message,
  Statistic,
  Switch
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { adminApi } from '../../services/apiService';

const { Title, Text } = Typography;

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  price: number; // Wholesaler Price
  costPrice: number; // Supplier Price
  retailerPrice: number; // Retailer Price
  stock: number;
  unit: string;
  status: 'active' | 'inactive';
  invoiceNumber: string;
  barcode: string;
  image?: string;
}

export const ProductListingPage = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getProducts();
      setProducts(response.data.products || []);
    } catch (error) {
      message.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteProduct(id);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const newStatus = product.status === 'active' ? 'inactive' : 'active';
      await adminApi.updateProduct(product.id, { status: newStatus });
      message.success(`Product marked as ${newStatus}`);
      fetchProducts();
    } catch (error) {
      message.error('Failed to update status');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingProduct) {
        await adminApi.updateProduct(editingProduct.id, values);
        message.success('Product updated successfully');
      } else {
        await adminApi.createProduct(values);
        message.success('Product created successfully');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      message.error('Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      title: 'Product',
      key: 'product',
      width: 250,
      render: (_: any, record: Product) => (
        <Space>
          <div style={{ 
            width: 32, height: 32, borderRadius: '4px', 
            overflow: 'hidden', display: 'flex', 
            alignItems: 'center', justifyContent: 'center',
            border: '1px solid #f0f0f0' 
          }}>
            {record.image ? (
              <img src={record.image} alt={record.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <ShoppingOutlined style={{ color: '#1890ff', fontSize: 16 }} />
            )}
          </div>
          <div>
            <Text strong style={{ display: 'block' }}>{record.name}</Text>
            <Tag color="#f0f0f0" style={{ color: '#666', border: 'none', margin: 0, fontSize: '10px' }}>
              {record.sku || 'SKU-001'}
            </Tag>
          </div>
        </Space>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => <Text style={{ color: '#1890ff' }}>{cat}</Text>
    },
    {
      title: 'Supplier Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (price: number) => <Text style={{ color: '#666' }}>{price?.toLocaleString() || 0} RWF</Text>
    },
    {
      title: 'Wholesaler Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => <Text style={{ color: '#ff7a45' }}>{price?.toLocaleString() || 0} RWF</Text>
    },
    {
      title: 'Retailer Price',
      dataIndex: 'retailerPrice',
      key: 'retailerPrice',
      render: (price: number) => <Text strong style={{ color: '#52c41a' }}>{price?.toLocaleString() || 0} RWF</Text>
    },
    {
      title: 'Stock',
      key: 'stock',
      render: (_: any, record: Product) => (
        <Text style={{ color: '#52c41a' }}>{record.stock} {record.unit || 'unit'}</Text>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Product) => (
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '8px',
          background: record.status === 'active' ? '#e6f7ff' : '#fff1f0',
          padding: '2px 12px', borderRadius: '20px', width: 'fit-content'
        }}>
          <Text style={{ color: record.status === 'active' ? '#1890ff' : '#f5222d', fontSize: '12px' }}>
            {record.status === 'active' ? 'Active' : 'Inactive'}
          </Text>
          <Switch 
            size="small" 
            checked={record.status === 'active'} 
            onChange={() => handleToggleStatus(record)}
          />
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space>
          <Button 
            icon={<EditOutlined style={{ color: '#faad14' }} />} 
            style={{ border: 'none', background: 'transparent' }} 
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            style={{ border: 'none', background: 'transparent' }}
            onClick={() => {
              Modal.confirm({
                title: 'Confirm Delete',
                content: `Are you sure you want to delete ${record.name}?`,
                onOk: () => handleDelete(record.id),
                okButtonProps: { danger: true }
              });
            }}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '24px' }}>
      {/* Header Banner */}
      <Card bordered={false} style={{ 
        background: 'linear-gradient(90deg, #1890ff 0%, #0050b3 100%)', 
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(24, 144, 255, 0.2)'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space align="start">
              <ShoppingOutlined style={{ color: 'white', fontSize: 32, marginTop: 4 }} />
              <div>
                <Title level={2} style={{ color: 'white', margin: 0, fontWeight: 600 }}>Product Listing</Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Manage all products, pricing, and inventory levels</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchProducts}
                style={{ borderRadius: '8px' }}
              >
                Refresh
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAdd}
                style={{ borderRadius: '8px', background: 'rgba(255,255,255,0.2)', border: 'none' }}
              >
                Add Product
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: '12px', borderLeft: '4px solid #1890ff' }}>
            <Statistic
              title={<Text type="secondary">Total Products</Text>}
              value={products.length}
              prefix={<ShoppingOutlined style={{ color: '#666', marginRight: 12 }} />}
              valueStyle={{ fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: '12px', borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title={<Text style={{ color: '#52c41a' }}>Active</Text>}
              value={products.filter(p => p.status === 'active').length}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 12 }} />}
              valueStyle={{ fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: '12px', borderLeft: '4px solid #faad14' }}>
            <Statistic
              title={<Text style={{ color: '#faad14' }}>Inactive</Text>}
              value={products.filter(p => p.status !== 'active').length}
              prefix={<CloseCircleOutlined style={{ color: '#faad14', marginRight: 12 }} />}
              valueStyle={{ fontWeight: 'bold' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false} style={{ borderRadius: '12px', borderLeft: '4px solid #f5222d' }}>
            <Statistic
              title={<Text style={{ color: '#f5222d' }}>Low Stock</Text>}
              value={products.filter(p => p.stock < 10).length}
              prefix={<WarningOutlined style={{ color: '#f5222d', marginRight: 12 }} />}
              valueStyle={{ fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Toolbar */}
      <Card bordered={false} style={{ borderRadius: '12px', marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col flex="auto">
            <Input
              placeholder="Search products by name, SKU, or descr..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              suffix={<FilterOutlined style={{ color: '#bfbfbf' }} />}
              style={{ borderRadius: '8px', height: '40px', background: '#f5f7fa', border: 'none' }}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </Col>
          <Col flex="200px">
            <Select 
              placeholder="All Categories" 
              style={{ width: '100%', height: '40px' }}
              className="custom-select"
            >
              <Select.Option value="all">All Categories</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card bordered={false} style={{ borderRadius: '12px', overflow: 'hidden' }}>
        <Table 
          columns={columns} 
          dataSource={filteredProducts} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          className="product-table"
        />
      </Card>

      <style>{`
        .product-table .ant-table-thead > tr > th {
          background: white;
          color: #8c8c8c;
          font-weight: 500;
          border-bottom: 1px solid #f0f0f0;
        }
        .ant-statistic-title {
          margin-bottom: 8px;
        }
        .custom-select .ant-select-selector {
          background: #f5f7fa !important;
          border: none !important;
          border-radius: 8px !important;
        }
      `}</style>

      {/* Add/Edit Modal */}
      <Modal
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ status: 'active', stock: 0 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="sku" label="SKU / Item Code">
                <Input placeholder="e.g. PRD-001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select placeholder="Select category">
                  <Select.Option value="Grains & Cereals">Grains & Cereals</Select.Option>
                  <Select.Option value="Beverages">Beverages</Select.Option>
                  <Select.Option value="Snacks">Snacks</Select.Option>
                  <Select.Option value="Dairy & Eggs">Dairy & Eggs</Select.Option>
                  <Select.Option value="Household Items">Household Items</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="Unit">
                <Select placeholder="Select unit">
                  <Select.Option value="KG">Kilogram (KG)</Select.Option>
                  <Select.Option value="PCS">Pieces (PCS)</Select.Option>
                  <Select.Option value="LTR">Liters (LTR)</Select.Option>
                  <Select.Option value="PKT">Packet (PKT)</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="costPrice" label="Supplier Price (RWF)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price" label="Wholesaler Price (RWF)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="retailerPrice" label="Retailer Price (RWF)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="stock" label="Stock Quantity">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="lowStockThreshold" label="Low Stock Threshold">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Status">
                <Select>
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="inactive">Inactive</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Enter product description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductListingPage;
