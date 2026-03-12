import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Button,
  Space,
  Tag,
  List,
  Avatar,
  Spin,
  Empty,
  message,
  Divider,
  Badge,
} from 'antd';
import {
  ShopOutlined,
  SearchOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  InboxOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

interface Retailer {
  id: number;
  shopName: string;
  address: string;
  phone: string;
  email: string;
  isVerified: boolean;
  productCount: number;
  wholesaler: string | null;
}

export const RetailersPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [favoriteRetailer, setFavoriteRetailer] = useState<number | null>(null);

  useEffect(() => {
    fetchRetailers();
    // Load favorite from localStorage
    const saved = localStorage.getItem('favoriteRetailerId');
    if (saved) setFavoriteRetailer(parseInt(saved));
  }, []);

  const fetchRetailers = async (search?: string, location?: string) => {
    setLoading(true);
    try {
      let url = `${API_URL}/store/retailers?`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (location) url += `district=${encodeURIComponent(location)}&`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setRetailers(data.retailers);
      } else {
        message.error('Failed to load retailers');
      }
    } catch (error) {
      console.error('Error fetching retailers:', error);
      message.error('Failed to load retailers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchRetailers(searchText, locationFilter);
  };

  const handleSetFavorite = (retailerId: number) => {
    if (favoriteRetailer === retailerId) {
      // Remove favorite
      setFavoriteRetailer(null);
      localStorage.removeItem('favoriteRetailerId');
      message.info('Retailer removed from favorites');
    } else {
      // Set favorite
      setFavoriteRetailer(retailerId);
      localStorage.setItem('favoriteRetailerId', retailerId.toString());
      message.success('Retailer added to favorites!');
    }
  };

  const handleShopNow = (retailerId: number) => {
    // Navigate to shop page with retailer ID
    navigate(`/consumer/shop?retailerId=${retailerId}`);
  };

  // Sort retailers to show favorite first
  const sortedRetailers = [...retailers].sort((a, b) => {
    if (a.id === favoriteRetailer) return -1;
    if (b.id === favoriteRetailer) return 1;
    return 0;
  });

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          padding: '32px',
          borderRadius: 12,
          marginBottom: 24,
          color: 'white',
        }}
      >
        <Row align="middle" gutter={24}>
          <Col>
            <Avatar
              size={80}
              icon={<ShopOutlined />}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '3px solid white',
              }}
            />
          </Col>
          <Col flex={1}>
            <Title level={2} style={{ color: 'white', margin: 0 }}>
              Find Retailers
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
              Discover retailers near you and start shopping
            </Text>
          </Col>
        </Row>
      </div>

      {/* Search & Filter */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <Input
              placeholder="Search by shop name..."
              prefix={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} md={10}>
            <Input
              placeholder="Filter by location (district, sector)..."
              prefix={<EnvironmentOutlined />}
              size="large"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Col>
          <Col xs={24} md={4}>
            <Button
              type="primary"
              size="large"
              block
              icon={<SearchOutlined />}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                {retailers.length}
              </Title>
              <Text type="secondary">Available Retailers</Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ margin: 0, color: '#52c41a' }}>
                {retailers.filter(r => r.isVerified).length}
              </Title>
              <Text type="secondary">Verified Shops</Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ margin: 0, color: '#fa8c16' }}>
                {retailers.reduce((sum, r) => sum + r.productCount, 0)}
              </Title>
              <Text type="secondary">Total Products</Text>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ margin: 0, color: '#eb2f96' }}>
                {favoriteRetailer ? 1 : 0}
              </Title>
              <Text type="secondary">My Favorite</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Retailers List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 100 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading retailers...</div>
        </div>
      ) : retailers.length === 0 ? (
        <Empty
          image={<ShopOutlined style={{ fontSize: 64, color: '#ccc' }} />}
          description="No retailers found"
        >
          <Button type="primary" onClick={() => fetchRetailers()}>
            Show All Retailers
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {sortedRetailers.map((retailer) => (
            <Col xs={24} md={12} lg={8} key={retailer.id}>
              <Badge.Ribbon
                text={retailer.id === favoriteRetailer ? 'My Favorite' : ''}
                color={retailer.id === favoriteRetailer ? 'pink' : 'transparent'}
                style={{ display: retailer.id === favoriteRetailer ? 'block' : 'none' }}
              >
                <Card
                  hoverable
                  style={{
                    height: '100%',
                    borderColor: retailer.id === favoriteRetailer ? '#eb2f96' : undefined,
                    borderWidth: retailer.id === favoriteRetailer ? 2 : 1,
                  }}
                  actions={[
                    <Button
                      type="text"
                      icon={retailer.id === favoriteRetailer ? <HeartFilled style={{ color: '#eb2f96' }} /> : <HeartOutlined />}
                      onClick={() => handleSetFavorite(retailer.id)}
                    >
                      {retailer.id === favoriteRetailer ? 'Favorited' : 'Favorite'}
                    </Button>,
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={() => handleShopNow(retailer.id)}
                    >
                      Shop Now
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <Avatar
                        size={56}
                        icon={<ShopOutlined />}
                        style={{ backgroundColor: '#1890ff' }}
                      />
                    }
                    title={
                      <Space>
                        <span>{retailer.shopName}</span>
                        {retailer.isVerified && (
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        )}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        {retailer.address && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <EnvironmentOutlined style={{ marginRight: 4 }} />
                            {retailer.address}
                          </Text>
                        )}
                        {retailer.phone && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <PhoneOutlined style={{ marginRight: 4 }} />
                            {retailer.phone}
                          </Text>
                        )}
                      </Space>
                    }
                  />
                  <Divider style={{ margin: '12px 0' }} />
                  <Row gutter={8}>
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        <InboxOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                        <div>
                          <Text strong>{retailer.productCount}</Text>
                          <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
                            Products
                          </Text>
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ textAlign: 'center' }}>
                        {retailer.isVerified ? (
                          <>
                            <CheckCircleOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                            <div>
                              <Tag color="green" style={{ margin: 0 }}>Verified</Tag>
                            </div>
                          </>
                        ) : (
                          <>
                            <CheckCircleOutlined style={{ fontSize: 20, color: '#d9d9d9' }} />
                            <div>
                              <Tag style={{ margin: 0 }}>Pending</Tag>
                            </div>
                          </>
                        )}
                      </div>
                    </Col>
                  </Row>
                  {retailer.wholesaler && (
                    <>
                      <Divider style={{ margin: '12px 0' }} />
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Supplied by: <Text strong style={{ fontSize: 11 }}>{retailer.wholesaler}</Text>
                      </Text>
                    </>
                  )}
                </Card>
              </Badge.Ribbon>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default RetailersPage;
