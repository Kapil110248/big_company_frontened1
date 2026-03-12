import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Card,
  Row,
  Col,
  Typography,
  Input,
  Button,
  Tag,
  Space,
  Badge,
  message,
  Spin,
  Empty,
  Modal,
  Drawer,
  Divider,
  Alert,
  Form,
  Select,
  Radio,
  Avatar,
  ConfigProvider,
  Tooltip,
} from 'antd';
import {
  ShoppingCartOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  StarFilled,
  PlusOutlined,
  MinusOutlined,
  FilterOutlined,
  RightOutlined,
  AimOutlined,
  WalletOutlined,
  MobileOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  LockOutlined,
  DeleteOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { consumerApi } from '../../services/apiService';
import { useCart, Retailer } from '../../contexts/CartContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Product {
  id: string;
  title?: string;
  name?: string; // Backend uses 'name' instead of 'title'
  description: string | null;
  thumbnail?: string;
  price?: number; // Backend simple price
  stock?: number; // Backend stock
  category?: string; // Backend category
  image?: string; // New Cloudinary image field
  variants?: Array<{
    id: string;
    title: string;
    prices: Array<{ amount: number; currency_code: string }>;
    inventory_quantity: number;
  }>;
  categories?: Array<{ id: string; name: string }>;
}

interface Category {
  id: string;
  name: string;
  handle: string;
}

interface CustomerLocation {
  district: string;
  sector: string;
  cell: string;
}

export const ShopPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlRetailerId = searchParams.get('retailerId');

  const {
    items: cartItems,
    selectedRetailer,
    total: cartTotal,
    itemCount: cartItemCount,
    addItem,
    updateQuantity,
    clearCart,
    selectRetailer,
    getItemQuantity,
    removeItem,
  } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showRetailerModal, setShowRetailerModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // NEW: Track if user can buy (linked to this retailer)
  const [canBuy, setCanBuy] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [viewingRetailerInfo, setViewingRetailerInfo] = useState<{ id: number, shopName: string, address: string } | null>(null);

  const [customerLocation, setCustomerLocation] = useState<CustomerLocation | null>(() => {
    try {
      const saved = localStorage.getItem('bigcompany_location');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [showLocationModal, setShowLocationModal] = useState(!customerLocation);
  const [locationForm] = Form.useForm();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  // Payment Selection State
  const [paymentCategory, setPaymentCategory] = useState<'big_wallet' | 'mobile_money' | null>('big_wallet');
  const [paymentSubOption, setPaymentSubOption] = useState<'dashboard' | 'credit' | 'mtn' | 'airtel'>('dashboard');

  const [gasRewardWalletId, setGasRewardWalletId] = useState<string | null>(null);
  const [checkoutForm] = Form.useForm();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const formatPrice = (amount: number) => `${amount.toLocaleString()} RWF`;

  // Set gas reward wallet ID when checkout modal opens, only for Dashboard Wallet
  useEffect(() => {
    if (showCheckoutModal) {
      // Only pre-fill for Dashboard Wallet, leave empty for Mobile Money
      if (paymentCategory === 'big_wallet' && paymentSubOption === 'dashboard' && gasRewardWalletId) {
        checkoutForm.setFieldsValue({ gasRewardWalletId });
      } else if (paymentCategory === 'mobile_money') {
        // Don't auto-fill for mobile money - leave it empty
        checkoutForm.setFieldsValue({ gasRewardWalletId: '' });
      }
    }
  }, [showCheckoutModal, paymentCategory, paymentSubOption, gasRewardWalletId, checkoutForm]);


  useEffect(() => {
    const init = async () => {
      try {
        const [c, profileRes] = await Promise.all([
          consumerApi.getCategories(),
          consumerApi.getProfile()
        ]);
        setCategories(c.data.categories || []);

        let currentLocation = customerLocation;

        // If no location in localStorage, try loading from profile
        if (!currentLocation && profileRes.data.success && profileRes.data.data.address) {
          const addr = profileRes.data.data.address;
          const parts = addr.split(',').map((p: string) => p.trim());
          if (parts.length >= 2) {
            const loc = {
              cell: parts.length === 3 ? parts[0] : '',
              sector: parts.length === 3 ? parts[1] : parts[0],
              district: parts.length === 3 ? parts[2] : parts[1]
            };
            currentLocation = loc;
            setCustomerLocation(loc);
            localStorage.setItem('bigcompany_location', JSON.stringify(loc));
            setShowLocationModal(false);
          }
        }

        // NEW: Load linked retailers from profile
        if (profileRes.data.success && profileRes.data.data.linkedRetailers) {
          const linked = profileRes.data.data.linkedRetailers.map((r: any) => ({
            id: r.id,
            name: r.shopName,
            location: r.address,
            image: r.image, // Ensure image is passed if available
            isLinked: true
          }));
          setRetailers(linked);

          if (profileRes.data.success) {
            setGasRewardWalletId(profileRes.data.data.gas_reward_wallet_id);
          }

          // Auto-show modal if not already viewing a specific retailer
          if (!selectedRetailer && !urlRetailerId && linked.length > 0) {
            setShowRetailerModal(true);
          }
        }

        // Auto-fetch nearby stores if location exists (will append to linked ones)
        if (currentLocation) {
          const response = await consumerApi.getRetailers({
            district: currentLocation.district,
            sector: currentLocation.sector,
            cell: currentLocation.cell
          });

          const nearby = response.data.retailers?.map((r: any) => ({
            id: r.id,
            name: r.shopName,
            location: r.address,
            image: r.image,
            isLinked: r.requestStatus === 'approved'
          })) || [];

          setRetailers(prev => {
            // Merge lists, avoiding duplicates
            const ids = new Set(prev.map(p => p.id));
            const combined = [...prev];
            nearby.forEach((n: any) => {
              if (!ids.has(n.id)) {
                combined.push(n);
              }
            });
            return combined;
          });
        }
      } catch (error) {
        console.error("Error fetching shop data:", error);
        message.error("Failed to load initial shop data");
        setCategories([]);
      } finally { setLoading(false); }
    };
    init();
  }, [customerLocation, selectedRetailer]);

  const fetchProducts = useCallback(async () => {
    // Use URL retailerId if available, otherwise use selected retailer
    const retailerIdToFetch = urlRetailerId || selectedRetailer?.id;
    if (!retailerIdToFetch) return;

    setLoadingProducts(true);
    try {
      const res = await consumerApi.getProducts({ retailerId: retailerIdToFetch });
      setProducts(res.data.products || []);
      setCanBuy(res.data.canBuy || false);
      setIsLinked(res.data.isLinked || false);
      if (res.data.retailerInfo) {
        setViewingRetailerInfo(res.data.retailerInfo);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      message.error("Failed to load products");
      setProducts([]);
    }
    finally { setLoadingProducts(false); }
  }, [selectedRetailer, urlRetailerId]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const productName = p.title || p.name || '';
      const productDesc = p.description || '';
      const ms = (productName + productDesc).toLowerCase().includes(searchQuery.toLowerCase());
      const mc = !selectedCategory ||
        p.categories?.some(c => c.id === selectedCategory) ||
        p.category === selectedCategory;
      return ms && mc;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleLocationSubmit = async (v: CustomerLocation) => {
    setCustomerLocation(v);
    localStorage.setItem('bigcompany_location', JSON.stringify(v));

    setLoading(true);
    try {
      // Formatted address for database
      const addressString = `${v.cell}, ${v.sector}, ${v.district}`;

      // Save to database
      await consumerApi.updateProfile({ address: addressString });

      const response = await consumerApi.getRetailers({
        district: v.district,
        sector: v.sector,
        cell: v.cell
      });
      setRetailers(response.data.retailers || []);
      if (response.data.retailers?.length === 0) {
        message.info("No stores found in this location");
      } else {
        message.success(`Location saved and ${response.data.retailers.length} stores found`);
      }
    } catch (error) {
      console.error("Error updating location:", error);
      message.error("Failed to save location to profile");
    } finally {
      setLoading(false);
      setShowLocationModal(false);
      setShowRetailerModal(true);
    }
  };

  const handleSelectRetailer = (r: Retailer) => {
    selectRetailer(r);
    setShowRetailerModal(false);
  };

  const handleAddToCart = (p: Product) => {
    // Block if not allowed to buy
    if (!canBuy) {
      message.warning('You must be linked to this retailer to add items to cart. Send a link request first.');
      return;
    }

    // Handle backend simple format
    if (p.price !== undefined) {
      addItem({
        id: p.id,
        productId: p.id,
        name: p.name || p.title || 'Product',
        price: p.price,
        image: p.image || p.thumbnail
      });
      message.success('Added!');
      return;
    }

    // Handle Medusa variant format
    if (p.variants && p.variants.length > 0) {
      const v = p.variants[0];
      const price = v.prices.find(pr => pr.currency_code.toLowerCase() === 'rwf')?.amount || v.prices[0].amount;
      addItem({ id: p.id, productId: p.id, name: p.title || p.name || 'Product', price, image: p.image || p.thumbnail });
      message.success('Added!');
    }
  };

  const handlePaymentSubmit = async (values: any) => {
    if (!selectedRetailer) return;
    setProcessingPayment(true);
    try {
      // Map UI selection to Backend Payment Method
      let backendPaymentMethod = 'wallet'; // Default
      if (paymentCategory === 'big_wallet') {
        if (paymentSubOption === 'dashboard') backendPaymentMethod = 'wallet';
        if (paymentSubOption === 'credit') backendPaymentMethod = 'credit_wallet';
      } else if (paymentCategory === 'mobile_money') {
        backendPaymentMethod = 'mobile_money';
      }

      const payload = {
        retailerId: selectedRetailer.id,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        })),
        paymentMethod: backendPaymentMethod,
        meterId: values.gasRewardWalletId,
        gasRewardWalletId: gasRewardWalletId,
        total: cartTotal,
        metadata: {
          provider: paymentCategory === 'mobile_money' ? paymentSubOption : undefined
        }
      };

      const response = await consumerApi.createOrder(payload);

      if (response.data.success) {
        setPaymentSuccess(true);
        message.success("Order placed successfully!");
        setTimeout(() => {
          clearCart();
          setShowCheckoutModal(false);
          setPaymentSuccess(false);
        }, 2000);
      }
    } catch (error: any) {
      console.error("Payment failed:", error);
      message.error(error.response?.data?.error || "Payment failed. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#10b981', borderRadius: 16 } }}>
      <div className="shop-container" style={{ minHeight: '100vh', background: '#fdfdfd', padding: 24, margin: -24 }}>
        <style>{`
          .hero-section { background: linear-gradient(135deg, #059669 0%, #10b981 100%); border-radius: 28px; padding: 48px; margin-bottom: 32px; color: white; position: relative; overflow: hidden; box-shadow: 0 15px 35px rgba(16, 185, 129, 0.15); }
          .category-tag { padding: 10px 20px; border-radius: 12px; border: 1px solid #f1f5f9; cursor: pointer; transition: 0.3s; background: white; color: #64748b; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; }
          .category-tag-active { background: #059669 !important; color: white !important; border-color: #059669 !important; box-shadow: 0 8px 20px rgba(5, 150, 105, 0.2); }
          .product-card { border-radius: 20px; overflow: hidden; border: 1px solid #f1f5f9; transition: 0.3s; background: white; }
          .product-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
          .floating-cart { position: fixed; bottom: 40px; right: 40px; z-index: 1000; width: 70px; height: 70px; border-radius: 24px; background: #059669; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 15px 40px rgba(5, 150, 105, 0.4); transition: 0.3s; }
          .floating-cart:hover { transform: scale(1.1) rotate(-5deg); }
        `}</style>

        <Modal open={showLocationModal} footer={null} closable={false} className="premium-modal" centered>
          <div style={{ textAlign: 'center', padding: 24 }}>
            <EnvironmentOutlined style={{ fontSize: 48, color: '#10b981', marginBottom: 16 }} />
            <Title level={4}>Find Nearby Stores</Title>
            <Form form={locationForm} layout="vertical" onFinish={handleLocationSubmit}>
              <Form.Item name="district" rules={[{ required: true }]}><Select placeholder="District"><Option value="Gasabo">Gasabo</Option><Option value="Nyarugenge">Nyarugenge</Option></Select></Form.Item>
              <Form.Item name="sector" rules={[{ required: true }]}><Input placeholder="Sector" /></Form.Item>
              <Form.Item name="cell" rules={[{ required: true }]}><Input placeholder="Cell" /></Form.Item>
              <Button type="primary" htmlType="submit" block size="large">Locate Stores</Button>
            </Form>
          </div>
        </Modal>

        <Modal open={showRetailerModal} title="Select a Store" footer={null} onCancel={() => setShowRetailerModal(false)} width={500}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {retailers.map(r => (
              <Card key={r.id} hoverable onClick={() => handleSelectRetailer(r)} bodyStyle={{ padding: 16 }}>
                <Row align="middle" gutter={16}>
                  <Col><Avatar src={r.image} shape="square" size={64} /></Col>
                  <Col flex={1}><Title level={5} style={{ margin: 0 }}>{r.name}</Title><Text type="secondary">{r.location}</Text></Col>
                  <Col><RightOutlined /></Col>
                </Row>
              </Card>
            ))}
          </Space>
        </Modal>

        <div className="hero-section">
          <Row justify="space-between" align="middle">
            <Col md={16}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <Text style={{ opacity: 0.8, fontWeight: 700 }}>WELCOME BACK, {user?.name?.toUpperCase() || 'USER'}</Text>
                {customerLocation && (
                  <Button
                    size="small"
                    icon={<EnvironmentOutlined />}
                    onClick={() => setShowLocationModal(true)}
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: 8 }}
                  >
                    {customerLocation.sector}, {customerLocation.district} (Change)
                  </Button>
                )}
              </div>
              <Title level={1} style={{ color: 'white', margin: '8px 0', fontSize: 42 }}>Freshness at your doorstep.</Title>
              <Input size="large" placeholder="Search products..." prefix={<SearchOutlined style={{ color: '#10b981' }} />} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ height: 56, borderRadius: 16, marginTop: 16 }} />
            </Col>
            <Col md={8} style={{ textAlign: 'right' }}>
              <Badge count={cartItemCount} color="#fbbf24"><Button onClick={() => setShowCartDrawer(true)} style={{ height: 60, borderRadius: 16, background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}><ShoppingCartOutlined /> {formatPrice(cartTotal)}</Button></Badge>
            </Col>
          </Row>
        </div>

        <div className="floating-cart" onClick={() => setShowCartDrawer(true)}>
          <Badge count={cartItemCount} color="#fbbf24"><ShoppingCartOutlined style={{ fontSize: 32, color: 'white' }} /></Badge>
        </div>

        <div style={{ marginBottom: 32, overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <Space>
            <div className={`category-tag ${!selectedCategory ? 'category-tag-active' : ''}`} onClick={() => setSelectedCategory('')}>All Items</div>
            {categories.map(c => <div key={c.id} className={`category-tag ${selectedCategory === c.id ? 'category-tag-active' : ''}`} onClick={() => setSelectedCategory(c.id)}>{c.name}</div>)}
          </Space>
        </div>

        {(selectedRetailer || urlRetailerId) ? (
          <div>
            {/* Read-Only Banner for unlinked retailers - with Send Link Request button */}
            {!canBuy && urlRetailerId && (
              <Alert
                message={<Text strong><LockOutlined /> Read-Only Mode - Link Required to Order</Text>}
                description={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text>You are viewing {viewingRetailerInfo?.shopName || 'this retailer'}'s products. To place orders, you must first send a link request and wait for approval.</Text>
                    <Space>
                      <Button
                        type="primary"
                        size="small"
                        icon={<SendOutlined />}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        onClick={() => navigate('/consumer/discover-retailers')}
                      >
                        Send Link Request
                      </Button>
                      <Button size="small" onClick={() => navigate('/consumer/discover-retailers')}>
                        View All Retailers
                      </Button>
                    </Space>
                  </Space>
                }
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Retailer Info Card */}
            <Card style={{ marginBottom: 32, border: canBuy ? '1px solid #10b981' : '1px solid #faad14', background: canBuy ? '#f0fdf4' : '#fffbe6' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Space>
                    <Avatar src={selectedRetailer?.image} size={48} icon={<ShopOutlined />} />
                    <div>
                      <Text strong>{viewingRetailerInfo?.shopName || selectedRetailer?.name || 'Retailer'}</Text>
                      <div style={{ fontSize: 12, opacity: 0.6 }}>{viewingRetailerInfo?.address || selectedRetailer?.location}</div>
                      {canBuy ? (
                        <Tag color="green" style={{ marginTop: 4 }}>Linked - Can Order</Tag>
                      ) : (
                        <Tag color="orange" style={{ marginTop: 4 }}>Not Linked - View Only</Tag>
                      )}
                    </div>
                  </Space>
                </Col>
                <Col>
                  <Space>
                    {/* Send Link Request button - visible when not linked */}
                    {!canBuy && urlRetailerId && (
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                        onClick={() => navigate('/consumer/discover-retailers')}
                      >
                        Send Link Request
                      </Button>
                    )}
                    {urlRetailerId && (
                      <Button shape="round" onClick={() => navigate('/consumer/discover-retailers')}>Back to Retailers</Button>
                    )}
                    {!urlRetailerId && (
                      <Button shape="round" onClick={() => setShowRetailerModal(true)}>Change Store</Button>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>

            <Title level={3} style={{ marginBottom: 24 }}>{selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Top Picks'}</Title>

            {loadingProducts ? <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div> : filteredProducts.length === 0 ? <Empty description="No products found" /> : (
              <Row gutter={[24, 24]}>
                {filteredProducts.map(p => {
                  // Handle both backend simple format and Medusa variant format
                  let pr: number;
                  let stock: number;

                  if (p.price !== undefined) {
                    // Backend simple format
                    pr = p.price;
                    stock = p.stock || 0;
                  } else if (p.variants && p.variants.length > 0) {
                    // Medusa variant format
                    const v = p.variants[0];
                    pr = v.prices.find(x => x.currency_code.toLowerCase() === 'rwf')?.amount || v.prices[0].amount;
                    stock = v.inventory_quantity;
                  } else {
                    return null; // Skip invalid products
                  }

                  const productName = p.title || p.name || 'Product';
                  const categoryName = p.categories?.[0]?.name || p.category || 'GENERAL';
                  const q = getItemQuantity(p.id);

                  return (
                    <Col xs={12} md={8} lg={6} key={p.id}>
                      <Card className="product-card" cover={<div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}><img src={p.image || p.thumbnail || 'https://via.placeholder.com/200'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /></div>}>
                        <Text type="secondary" style={{ fontSize: 10, fontWeight: 700 }}>{categoryName}</Text>
                        <Title level={5} style={{ margin: '4px 0 12px', height: 44, overflow: 'hidden' }}>{productName}</Title>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: 18, color: '#059669' }}>{formatPrice(pr)}</Text>
                          {canBuy ? (
                            q > 0 ? (
                              <Space style={{ background: '#f0fdf4', borderRadius: 10, padding: 4 }}>
                                <Button size="small" type="text" icon={<MinusOutlined />} onClick={() => updateQuantity(p.id, q - 1)} />
                                <Text strong>{q}</Text>
                                <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => updateQuantity(p.id, q + 1)} />
                              </Space>
                            ) : (
                              <Button type="primary" shape="circle" icon={<PlusOutlined />} onClick={() => handleAddToCart(p)} disabled={stock === 0} />
                            )
                          ) : (
                            <Tooltip title="Link with this retailer to order">
                              <Button shape="circle" icon={<LockOutlined />} disabled />
                            </Tooltip>
                          )}
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 100, background: 'white', borderRadius: 28 }}>
            <ShopOutlined style={{ fontSize: 64, color: '#10b981', opacity: 0.2, marginBottom: 24 }} />
            <Title level={3}>Choose a Store to Begin</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
              Browse available retailers or go to "Find & Link Retailer" to send a link request.
            </Text>
            <Space>
              <Button type="primary" size="large" onClick={() => setShowRetailerModal(true)}>Browse Retailers</Button>
              <Button size="large" onClick={() => navigate('/consumer/discover-retailers')}>Link a Retailer</Button>
            </Space>
          </div>
        )}

        <Modal open={showCheckoutModal} title="Checkout" onCancel={() => !processingPayment && setShowCheckoutModal(false)} footer={null}>
          {paymentSuccess ? <div style={{ textAlign: 'center', padding: 40 }}><CheckCircleOutlined style={{ fontSize: 64, color: '#10b981' }} /><Title level={3}>Success!</Title></div> : (
            <Form layout="vertical" onFinish={handlePaymentSubmit} form={checkoutForm}>
              <Card style={{ marginBottom: 24, background: '#f0fdf4', border: 'none' }}><Text type="secondary">Total</Text><Title level={2} style={{ margin: 0, color: '#10b981' }}>{formatPrice(cartTotal)}</Title></Card>
              <Form.Item label="Payment Method" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                  {/* BIG Wallet Group */}
                  <Card
                    size="small"
                    style={{
                      borderColor: paymentCategory === 'big_wallet' ? '#10b981' : '#f0f0f0',
                      background: paymentCategory === 'big_wallet' ? '#f6ffed' : '#ffffff',
                      cursor: 'pointer'
                    }}
                    onClick={() => { setPaymentCategory('big_wallet'); setPaymentSubOption('dashboard'); }}
                  >
                    <Radio checked={paymentCategory === 'big_wallet'}>
                      <Text strong>BIG Wallet</Text>
                    </Radio>
                    {paymentCategory === 'big_wallet' && (
                      <div style={{ paddingLeft: 28, marginTop: 12 }}>
                        <Radio.Group value={paymentSubOption} onChange={e => setPaymentSubOption(e.target.value)}>
                          <Space direction="vertical">
                            <Radio value="dashboard">Dashboard Wallet</Radio>
                            <Radio value="credit">Credit Wallet</Radio>
                          </Space>
                        </Radio.Group>
                      </div>
                    )}
                  </Card>

                  {/* Mobile Money Group */}
                  <Card
                    size="small"
                    style={{
                      borderColor: paymentCategory === 'mobile_money' ? '#10b981' : '#f0f0f0',
                      background: paymentCategory === 'mobile_money' ? '#f6ffed' : '#ffffff',
                      cursor: 'pointer'
                    }}
                    onClick={() => { setPaymentCategory('mobile_money'); setPaymentSubOption('mtn'); }}
                  >
                    <Radio checked={paymentCategory === 'mobile_money'}>
                      <Text strong>Mobile Money</Text>
                    </Radio>
                    {paymentCategory === 'mobile_money' && (
                      <div style={{ paddingLeft: 28, marginTop: 12 }}>
                        <Radio.Group value={paymentSubOption} onChange={e => setPaymentSubOption(e.target.value)}>
                          <Space direction="vertical">
                            <Radio value="mtn">MTN Mobile Money</Radio>
                            <Radio value="airtel">Airtel Money</Radio>
                          </Space>
                        </Radio.Group>
                      </div>
                    )}
                  </Card>
                </div>
              </Form.Item>

              {/* Mobile Money Phone Number Field */}
              {paymentCategory === 'mobile_money' && paymentSubOption && (
                <Form.Item
                  name="mobileNumber"
                  label="Mobile Number"
                  rules={[
                    { required: true, message: 'Please enter your mobile number' },
                    { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit mobile number' }
                  ]}
                >
                  <Input
                    placeholder="e.g., 0788123456"
                    prefix={<PhoneOutlined />}
                    maxLength={10}
                  />
                </Form.Item>
              )}

              {/* Logic Check: Hide Rewards for Credit Wallet */}
              {!(paymentCategory === 'big_wallet' && paymentSubOption === 'credit') && (
                <div style={{ marginBottom: 24, padding: 16, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
                  <Text type="success" strong><StarFilled /> Earn Gas Rewards!</Text>
                  <Paragraph style={{ margin: '8px 0', fontSize: 13 }}>
                    Enter your Gas Reward Wallet ID to receive 12% of your purchase as gas units.
                    {paymentCategory === 'mobile_money' && ' (Optional for Mobile Money)'}
                  </Paragraph>
                  <Form.Item
                    name="gasRewardWalletId"
                    label="Gas Reward Wallet ID"
                    rules={[
                      {
                        required: paymentCategory === 'big_wallet' && paymentSubOption === 'dashboard',
                        message: 'Gas Reward Wallet ID is required for Dashboard Wallet rewards'
                      }
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <Input
                      placeholder={paymentCategory === 'mobile_money' ? 'Gas Reward Wallet ID (Optional - GRW-...)' : 'Gas Reward Wallet ID (GRW-...)'}
                      prefix={<WalletOutlined />}
                    />
                  </Form.Item>
                </div>
              )}

              {(paymentCategory === 'big_wallet' && paymentSubOption === 'credit') && (
                <Alert
                  message="No Rewards"
                  description="Purchases made with Credit Wallet are not eligible for gas rewards."
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
              )}

              <Button type="primary" htmlType="submit" block size="large" loading={processingPayment}>Pay Now</Button>
            </Form>
          )}
        </Modal>

        <Drawer title="Your Cart" onClose={() => setShowCartDrawer(false)} open={showCartDrawer} width={380}>
          {cartItems.length === 0 ? <Empty description="Cart is empty" /> : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Space direction="vertical" style={{ flex: 1, overflow: 'auto', width: '100%' }}>
                {cartItems.map(item => (
                  <Card key={item.id} size="small">
                    <Row align="middle" gutter={12}>
                      <Col span={4}><Avatar src={item.image} shape="square" /></Col>
                      <Col span={12}><Text strong>{item.name}</Text><div>{formatPrice(item.price)}</div></Col>
                      <Col span={5} style={{ textAlign: 'right' }}><Text strong>x{item.quantity}</Text></Col>
                      <Col span={3} style={{ textAlign: 'right' }}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeItem(item.productId)}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
              <Divider />
              <div style={{ padding: 16 }}>
                <Row justify="space-between" style={{ marginBottom: 16 }}><Text>Total</Text><Title level={4} style={{ margin: 0 }}>{formatPrice(cartTotal)}</Title></Row>
                <Button
                  type="primary"
                  block
                  size="large"
                  onClick={() => {
                    if (!canBuy) {
                      message.error('You must be approved by this retailer before placing orders. Please send a link request and wait for approval.');
                      return;
                    }
                    setShowCartDrawer(false);
                    setShowCheckoutModal(true);
                  }}
                  disabled={!canBuy}
                >
                  Checkout
                </Button>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </ConfigProvider>
  );
};
