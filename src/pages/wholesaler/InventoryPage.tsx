import { useEffect, useState } from 'react';
import {
  Table,
  Space,
  Form,
  Input,
  InputNumber,
  Select,
  Card,
  Tag,
  Progress,
  Typography,
  Button,
  Modal,
  message,
  Spin,
  Alert,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Avatar,
  Upload,
} from 'antd';
import {
  ReloadOutlined,
  PlusOutlined,
  WarningOutlined,
  AppstoreOutlined,
  DollarOutlined,
  InboxOutlined,
  SearchOutlined,
  DeleteOutlined,
  InboxOutlined as UploadIcon,
} from '@ant-design/icons';
import { wholesalerApi } from '../../services/apiService';
import { AddInventoryModal } from '../../components/wholesaler/AddInventoryModal';

const { Title, Text } = Typography;

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  low_stock_threshold: number;
  cost_price: number;  // Supplier/manufacturer cost
  wholesale_price: number;  // Wholesaler selling price
  unit: string;
  barcode?: string;
  // Invoice number for retailers to reference when adding inventory
  invoice_number?: string;
  image?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface InventoryStats {
  total_products: number;
  // Stock value at supplier/manufacturer cost
  stock_value_supplier_cost: number;
  // Stock value at wholesaler price
  stock_value_wholesaler_price: number;
  // Profit margin of current stock (wholesaler price - supplier cost)
  stock_profit_margin: number;
  low_stock_count: number;
  out_of_stock_count: number;
  categories_count: number;
}

const defaultCategories = [
  'Grains & Cereals',
  'Cooking Essentials',
  'Beverages',
  'Snacks',
  'Dairy & Eggs',
  'Meat & Fish',
  'Fruits & Vegetables',
  'Household Items',
  'Personal Care',
  'Baby Products',
];

export const InventoryPage = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [lowStockFilter, setLowStockFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [actionLoading, setActionLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  const fetchProducts = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [productsResponse, statsResponse, categoriesResponse] = await Promise.all([
        wholesalerApi.getProducts({
          category: categoryFilter || undefined,
          low_stock: lowStockFilter || undefined,
          search: searchQuery || undefined,
          limit: pagination.pageSize,
          offset: (pagination.current - 1) * pagination.pageSize,
        }),
        wholesalerApi.getInventoryStats(),
        wholesalerApi.getCategories(),
      ]);

      const productsData = productsResponse.data;
      const productsList = (productsData.products || []).map((p: any) => ({
        ...p,
        cost_price: p.costPrice || 0,
        wholesale_price: p.price || 0,
        low_stock_threshold: p.lowStockThreshold || 0,
        invoice_number: p.invoiceNumber || '',
      }));
      setProducts(productsList);
      setPagination(prev => ({ ...prev, total: productsData.total || 0 }));

      // Calculate dual stock values from products
      const stockValueSupplierCost = productsList.reduce((sum: number, p: Product) => sum + (p.stock * p.cost_price), 0);
      const stockValueWholesalerPrice = productsList.reduce((sum: number, p: Product) => sum + (p.stock * p.wholesale_price), 0);
      const stockProfitMargin = stockValueWholesalerPrice - stockValueSupplierCost;
      const lowStockCount = productsList.filter((p: Product) => p.stock > 0 && p.stock <= p.low_stock_threshold).length;
      const outOfStockCount = productsList.filter((p: Product) => p.stock === 0).length;

      setStats({
        ...statsResponse.data,
        stock_value_supplier_cost: statsResponse.data?.stock_value_supplier_cost || stockValueSupplierCost,
        stock_value_wholesaler_price: statsResponse.data?.stock_value_wholesaler_price || stockValueWholesalerPrice,
        stock_profit_margin: statsResponse.data?.stock_profit_margin || stockProfitMargin,
        low_stock_count: statsResponse.data?.low_stock_count ?? lowStockCount,
        out_of_stock_count: statsResponse.data?.out_of_stock_count ?? outOfStockCount,
      });
      setCategories(categoriesResponse.data?.categories || defaultCategories);
    } catch (err: any) {
      console.error('Inventory error:', err);
      setError(err.response?.data?.error || 'Failed to load inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, lowStockFilter, pagination.current, pagination.pageSize]);

  const getStockStatus = (stock: number, threshold: number) => {
    if (stock === 0) return { color: 'red', text: 'Out of Stock', status: 'exception' as const };
    const percentage = (stock / threshold) * 100;
    if (percentage <= 50) return { color: 'red', text: 'Critical', status: 'exception' as const };
    if (percentage <= 100) return { color: 'orange', text: 'Low Stock', status: 'normal' as const };
    return { color: 'green', text: 'In Stock', status: 'success' as const };
  };

  const handleCreateProduct = async () => {
    // This is now handled by AddInventoryModal
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    try {
      const values = await form.validateFields();
      setActionLoading(true);

      // Add image to values if available
      if (fileList.length > 0 && fileList[0].originFileObj) {
        const base64 = await getBase64(fileList[0].originFileObj);
        values.image = base64;
      }

      await wholesalerApi.updateProduct(selectedProduct.id, values);
      message.success('Product updated successfully');
      setEditModalOpen(false);
      setSelectedProduct(null);
      form.resetFields();
      setFileList([]);
      fetchProducts(true);
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(err.response?.data?.error || 'Failed to update product');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct) return;
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      await wholesalerApi.updateStock(
        selectedProduct.id,
        values.quantity,
        values.type,
        values.reason
      );
      message.success('Stock updated successfully');
      setStockModalOpen(false);
      setSelectedProduct(null);
      form.resetFields();
      fetchProducts(true);
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(err.response?.data?.error || 'Failed to update stock');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!selectedProduct) return;
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      await wholesalerApi.updatePrice(
        selectedProduct.id,
        values.wholesale_price,
        values.cost_price
      );
      message.success('Price updated successfully');
      setPriceModalOpen(false);
      setSelectedProduct(null);
      form.resetFields();
      fetchProducts(true);
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(err.response?.data?.error || 'Failed to update price');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      setActionLoading(true);
      await wholesalerApi.deleteProduct(id);
      message.success('Product deleted successfully');
      fetchProducts(true);
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Failed to delete product');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (value: string) => <code>{value}</code>,
    },
    {
      title: 'Invoice #',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (value: string) => value ? (
        <Tag color="blue">{value}</Tag>
      ) : <Text type="secondary">-</Text>,
    },
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (value: string, record: Product) => (
        <Space>
          <Avatar src={record.image} shape="square" size={40} icon={<InboxOutlined />} />
          <strong>{value}</strong>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: 'Stock Level',
      key: 'stock_level',
      render: (_: any, record: Product) => {
        const status = getStockStatus(record.stock, record.low_stock_threshold);
        return (
          <div style={{ width: 150 }}>
            <Progress
              percent={Math.min((record.stock / record.low_stock_threshold) * 100, 100)}
              size="small"
              status={status.status}
              format={() => `${record.stock} ${record.unit || 'units'}`}
            />
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Product) => {
        const status = getStockStatus(record.stock, record.low_stock_threshold);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: 'Supplier Cost',
      dataIndex: 'cost_price',
      key: 'cost_price',
      render: (value: number) => (
        <Text style={{ color: '#fa8c16' }}>
          {value?.toLocaleString()} RWF
        </Text>
      ),
    },
    {
      title: 'Wholesaler Price',
      dataIndex: 'wholesale_price',
      key: 'wholesale_price',
      render: (value: number) => (
        <Text strong style={{ color: '#7c3aed' }}>
          {value?.toLocaleString()} RWF
        </Text>
      ),
    },
    {
      title: 'Margin',
      key: 'margin',
      render: (_: any, record: Product) => {
        const margin = record.cost_price > 0
          ? ((record.wholesale_price - record.cost_price) / record.cost_price) * 100
          : 0;
        return <span style={{ color: margin > 0 ? '#22c55e' : '#ef4444' }}>{margin.toFixed(1)}%</span>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setSelectedProduct(record);
              form.setFieldsValue(record);
              if (record.image) {
                setFileList([{
                  uid: '-1',
                  name: 'image.png',
                  status: 'done',
                  url: record.image,
                }]);
              } else {
                setFileList([]);
              }
              setEditModalOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            type="primary"
            ghost
            onClick={() => {
              setSelectedProduct(record);
              form.resetFields();
              setStockModalOpen(true);
            }}
          >
            Stock
          </Button>
          <Button
            size="small"
            onClick={() => {
              setSelectedProduct(record);
              form.setFieldsValue({
                wholesale_price: record.wholesale_price,
                cost_price: record.cost_price,
              });
              setPriceModalOpen(true);
            }}
          >
            Price
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDeleteProduct(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true, loading: actionLoading }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>Inventory Management</Title>
        <Space>
          <Button
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={() => fetchProducts(true)}
            loading={refreshing}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setCreateModalOpen(true);
            }}
          >
            Add Product
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Stats Cards - Updated with dual stock values per client requirements */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6} lg={4}>
          <Card size="small">
            <Statistic
              title="Total Products"
              value={stats?.total_products || products.length}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={4}>
          <Card size="small" style={{ borderLeft: '3px solid #fa8c16' }}>
            <Statistic
              title="Stock Value (Supplier Cost)"
              value={stats?.stock_value_supplier_cost || 0}
              suffix="RWF"
              prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
              formatter={(value) => value?.toLocaleString()}
              valueStyle={{ color: '#fa8c16', fontSize: '16px' }}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>Based on supplier/manufacturer price</Text>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={4}>
          <Card size="small" style={{ borderLeft: '3px solid #7c3aed' }}>
            <Statistic
              title="Stock Value (Wholesaler Price)"
              value={stats?.stock_value_wholesaler_price || 0}
              suffix="RWF"
              prefix={<DollarOutlined style={{ color: '#7c3aed' }} />}
              formatter={(value) => value?.toLocaleString()}
              valueStyle={{ color: '#7c3aed', fontSize: '16px' }}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>Based on your selling price</Text>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={4}>
          <Card size="small" style={{ borderLeft: '3px solid #22c55e' }}>
            <Statistic
              title="Profit Margin (Current Stock)"
              value={stats?.stock_profit_margin || 0}
              suffix="RWF"
              prefix={<DollarOutlined style={{ color: '#22c55e' }} />}
              formatter={(value) => value?.toLocaleString()}
              valueStyle={{ color: '#22c55e', fontSize: '16px' }}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>Wholesaler price - Supplier cost</Text>
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={4}>
          <Card size="small">
            <Statistic
              title="Low Stock"
              value={stats?.low_stock_count || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: (stats?.low_stock_count || 0) > 0 ? '#f97316' : '#22c55e' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={4}>
          <Card size="small">
            <Statistic
              title="Out of Stock"
              value={stats?.out_of_stock_count || 0}
              prefix={<InboxOutlined />}
              valueStyle={{ color: (stats?.out_of_stock_count || 0) > 0 ? '#ef4444' : '#22c55e' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Space wrap>
          <Input.Search
            placeholder="Search products..."
            allowClear
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            onSearch={(value) => {
              setSearchQuery(value);
              setPagination(prev => ({ ...prev, current: 1 }));
              fetchProducts();
            }}
          />
          <Select
            placeholder="Filter by Category"
            allowClear
            style={{ width: 180 }}
            value={categoryFilter || undefined}
            onChange={(value) => {
              setCategoryFilter(value || '');
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
          >
            {categories.map(cat => (
              <Select.Option key={cat} value={cat}>{cat}</Select.Option>
            ))}
          </Select>
          <Button
            type={lowStockFilter ? 'primary' : 'default'}
            danger={lowStockFilter}
            icon={<WarningOutlined />}
            onClick={() => {
              setLowStockFilter(!lowStockFilter);
              setPagination(prev => ({ ...prev, current: 1 }));
            }}
          >
            Low Stock Only
          </Button>
        </Space>
      </Card>

      {/* Products Table */}
      <Card>
        <Table
          dataSource={products}
          columns={columns}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} products`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }));
            },
          }}
        />
      </Card>

      <AddInventoryModal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          fetchProducts(true);
        }}
      />

      {/* Edit Product Modal */}
      <Modal
        title={`Edit Product: ${selectedProduct?.name}`}
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedProduct(null);
          form.resetFields();
          setFileList([]);
        }}
        onOk={handleUpdateProduct}
        confirmLoading={actionLoading}
        okText="Save Changes"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Product Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                <Select>
                  {categories.map(cat => (
                    <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="low_stock_threshold" label="Low Stock Threshold" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="units">Units</Select.Option>
                  <Select.Option value="kg">Kilograms</Select.Option>
                  <Select.Option value="liters">Liters</Select.Option>
                  <Select.Option value="packs">Packs</Select.Option>
                  <Select.Option value="boxes">Boxes</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Product Image">
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList }) => setFileList(fileList.slice(-1))}
              maxCount={1}
            >
              {fileList.length < 1 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Update Stock Modal */}
      <Modal
        title={`Update Stock: ${selectedProduct?.name}`}
        open={stockModalOpen}
        onCancel={() => {
          setStockModalOpen(false);
          setSelectedProduct(null);
          form.resetFields();
        }}
        onOk={handleUpdateStock}
        confirmLoading={actionLoading}
        okText="Update Stock"
      >
        {selectedProduct && (
          <div style={{ marginBottom: '16px' }}>
            <Text>Current Stock: <strong>{selectedProduct.stock} {selectedProduct.unit || 'units'}</strong></Text>
          </div>
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="type"
            label="Action Type"
            rules={[{ required: true, message: 'Select action type' }]}
          >
            <Select placeholder="Select action">
              <Select.Option value="add">Add Stock</Select.Option>
              <Select.Option value="remove">Remove Stock</Select.Option>
              <Select.Option value="set">Set Exact Quantity</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Enter quantity' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={2} placeholder="Optional reason for stock adjustment" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Update Price Modal */}
      <Modal
        title={`Update Price: ${selectedProduct?.name}`}
        open={priceModalOpen}
        onCancel={() => {
          setPriceModalOpen(false);
          setSelectedProduct(null);
          form.resetFields();
        }}
        onOk={handleUpdatePrice}
        confirmLoading={actionLoading}
        okText="Update Price"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="cost_price"
            label="Cost Price (RWF)"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="wholesale_price"
            label="Wholesale Price (RWF)"
            rules={[{ required: true, message: 'Wholesale price is required' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Helper function to convert file to base64
const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default InventoryPage;
