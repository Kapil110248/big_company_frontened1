import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  message,
  Typography,
  Row,
  Col,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  ShoppingOutlined,
  SearchOutlined,
  TagOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '../../services/apiService';

const { Text } = Typography;
const { TextArea } = Input;

interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  productCount?: number;
}

const CategoriesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getCategories();
      if (response.data?.categories) {
        setCategories(response.data.categories);
      }
    } catch (error: any) {
      console.error('Failed to load categories:', error);
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      if (editingId) {
        await adminApi.updateCategory(editingId, values);
        message.success('Category updated successfully');
      } else {
        await adminApi.createCategory(values);
        message.success('Category created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingId(null);
      loadCategories();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Category) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: 'Delete Category',
      content: `Are you sure you want to delete ${name}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await adminApi.deleteCategory(id);
          message.success('Category deleted successfully');
          loadCategories();
        } catch (error: any) {
          message.error('Failed to delete category');
        }
      },
    });
  };

  const filterCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchText.toLowerCase()) ||
    category.code.toLowerCase().includes(searchText.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns: ColumnsType<Category> = [
    {
      title: 'Category',
      key: 'category',
      render: (_, record) => (
        <Space size="middle">
          <div className="bg-blue-500 w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm">
            <AppstoreOutlined style={{ fontSize: '20px' }} />
          </div>
          <div className="flex flex-col">
            <Text bold className="text-[15px] font-bold text-gray-800">{record.name}</Text>
            <Tag color="#f0f0f0" className="m-0 py-0 px-1 text-[10px] w-fit text-gray-500 border-none rounded">
              {record.code}
            </Tag>
          </div>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <Text type="secondary" className="text-gray-500">{text || 'No description provided'}</Text>,
    },
    {
      title: 'Products',
      key: 'products',
      render: (_, record) => (
        <Space className="text-blue-500 cursor-pointer hover:text-blue-600 transition-colors">
          <ShoppingOutlined />
          <span className="font-medium">{record.productCount || 0} products</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive) => (
        <Tag color={isActive ? 'blue' : 'default'} className="rounded-full px-4 border-none py-1 font-medium capitalize">
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            className="flex items-center gap-1 hover:text-blue-500 border-gray-200 rounded-lg text-xs"
          >
            Edit
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id, record.name)}
            className="flex items-center gap-1 rounded-lg text-xs"
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const stats = [
    { title: 'Total Categories', value: categories.length, icon: <AppstoreOutlined className="text-blue-500" />, border: '#1890ff' },
    { title: 'Active', value: categories.filter(c => c.isActive).length, icon: <CheckCircleTwoTone twoToneColor="#52c41a" />, border: '#52c41a' },
    { title: 'Inactive', value: categories.filter(c => !c.isActive).length, icon: <CloseCircleTwoTone twoToneColor="#faad14" />, border: '#faad14' },
    { title: 'Total Products', value: categories.reduce((acc, c) => acc + (c.productCount || 0), 0), icon: <ShoppingOutlined className="text-purple-500" />, border: '#722ed1' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Pink Header Banner */}
        <div className="bg-[#d53f8c] p-8 rounded-xl shadow-lg mb-8 text-white relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-xl text-3xl">
                <AppstoreOutlined />
              </div>
              <div>
                <h1 className="text-3xl font-bold m-0 text-white leading-tight">Product Categories</h1>
                <p className="text-pink-100 m-0 text-base opacity-90">Manage product categories for inventory organization</p>
              </div>
            </div>
            <Space size="middle">
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadCategories}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 transition-all rounded-lg h-10 px-6 font-medium border-solid"
              >
                Refresh
              </Button>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingId(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
                className="bg-[#1890ff] hover:bg-[#40a9ff] border-none h-10 px-6 rounded-lg shadow-sm font-medium"
              >
                Add Category
              </Button>
            </Space>
          </div>
          {/* Decorative effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        </div>

        {/* Stats Section */}
        <Row gutter={[20, 20]} className="mb-8">
          {stats.map((stat, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card bordered={false} className="shadow-sm rounded-xl h-[120px] border-t-4" style={{ borderTopColor: stat.border }}>
                <div className="flex flex-col h-full justify-between py-1">
                  <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{stat.title}</span>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-gray-800">{stat.value}</span>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Search Bar */}
        <Card bordered={false} className="mb-8 shadow-sm rounded-xl p-1">
          <Input
            placeholder="Search categories by name, code, or description..."
            prefix={<SearchOutlined className="text-gray-400 mr-2" />}
            size="large"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="border-none bg-gray-50/50 hover:bg-white focus:bg-white transition-all rounded-lg"
            allowClear
          />
        </Card>

        {/* Table Content */}
        <Card bordered={false} className="shadow-sm rounded-xl overflow-hidden p-0 min-h-[500px]">
          <Table
            columns={columns}
            dataSource={filterCategories}
            rowKey="id"
            loading={loading}
            className="category-table"
            pagination={{
              showSizeChanger: true,
              pageSize: 10,
              showTotal: (total) => `Total ${total} categories`,
              className: "px-6 py-4 border-t",
            }}
            locale={{
              emptyText: (
                <div className="py-24 flex flex-col items-center">
                  <p className="text-gray-400 text-sm">No data found</p>
                </div>
              )
            }}
          />
        </Card>
      </div>

      <Modal
        title={<span className="text-lg font-bold">{editingId ? 'Edit Category' : 'Add Category'}</span>}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingId(null);
        }}
        footer={null}
        width={500}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{ isActive: true }}
          className="mt-4"
        >
          <Form.Item
            name="name"
            label={<span className="font-semibold text-gray-700">Category Name</span>}
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input size="large" placeholder="e.g. Beverages" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            name="code"
            label={<span className="font-semibold text-gray-700">Category Code</span>}
            help="Unique code for internal tracking (e.g. BEV)"
          >
            <Input size="large" placeholder="e.g. BEV" className="rounded-lg" />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="font-semibold text-gray-700">Description</span>}
          >
             <TextArea rows={3} placeholder="Describe the category..." className="rounded-lg" />
          </Form.Item>

          <div className="flex justify-end gap-3 mt-8">
            <Button size="large" onClick={() => setModalVisible(false)} className="rounded-lg h-10 px-6 font-medium">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} className="bg-[#1890ff] hover:bg-[#40a9ff] border-none h-10 px-8 rounded-lg font-medium shadow-sm">
              {editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        </Form>
      </Modal>

      <style>{`
        .category-table .ant-table-thead > tr > th {
          background: #fafafa !important;
          border-bottom: 1px solid #f0f0f0 !important;
          font-weight: 600 !important;
          color: #262626 !important;
          font-size: 13px !important;
        }
        .category-table .ant-table-tbody > tr > td {
          padding: 16px !important;
          border-bottom: 1px solid #f0f0f0 !important;
        }
        .category-table .ant-table-row:hover > td {
          background: #fafafa !important;
        }
      `}</style>
    </div>
  );
};

export default CategoriesPage;
