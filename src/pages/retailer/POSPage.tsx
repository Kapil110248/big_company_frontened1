import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  List,
  Typography,
  Tag,
  Divider,
  Modal,
  Input,
  Radio,
  message,
  Space,
  Badge,
  Spin,
  Statistic,
  Empty,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  CreditCardOutlined,
  WalletOutlined,
  MobileOutlined,
  SearchOutlined,
  BarcodeOutlined,
  CheckCircleOutlined,
  PrinterOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { retailerApi } from '../../services/apiService';

const { Title, Text } = Typography;

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  category: string;
  stock: number;
  barcode?: string;
  image?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface DailySalesStats {
  total_sales: number;
  transaction_count: number;
  mobile_payment_transactions: number;  // Mobile Money (MTN/Airtel)
  dashboard_wallet_transactions: number; // Dashboard Wallet payments
  credit_wallet_transactions: number;    // Credit Wallet payments
  gas_rewards_m3: number;               // Gas rewards given in M³
  gas_rewards_rwf: number;              // Gas rewards value in RWF
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  wallet_balance: number;
  credit_limit: number;
  credit_used: number;
}

const POSPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bigshop_card' | 'mobile_money'>('bigshop_card');
  const [processing, setProcessing] = useState(false);

  // Big Shop Card payment flow
  const [cardStep, setCardStep] = useState<'tap' | 'pin' | 'wallet_choice' | 'reward_id'>('tap');
  const [cardWalletType, setCardWalletType] = useState<'dashboard' | 'credit'>('dashboard');
  const [cardPin, setCardPin] = useState('');

  // Mobile Money payment
  const [mobileProvider, setMobileProvider] = useState<'mtn' | 'airtel'>('mtn');

  // Customer state (for wallet/credit payments)
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerLoading, setCustomerLoading] = useState(false);

  // Gas Reward Wallet ID for rewards
  const [gasRewardWalletId, setGasRewardWalletId] = useState('');

  // Daily stats
  const [dailyStats, setDailyStats] = useState<DailySalesStats | null>(null);

  // Receipt modal
  const [receiptModal, setReceiptModal] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  // Discount
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');

  const barcodeInputRef = useRef<any>(null);

  // Load products and daily stats
  useEffect(() => {
    loadProducts();
    loadDailyStats();

    // Refresh stats every minute
    const interval = setInterval(loadDailyStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await retailerApi.getPOSProducts({ limit: 100 });
      setProducts(response.data?.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Fallback to inventory
      try {
        const response = await retailerApi.getInventory({ limit: 100 });
        setProducts(response.data?.products || []);
      } catch (err) {
        message.error('Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDailyStats = async () => {
    try {
      const response = await retailerApi.getDailySales();
      setDailyStats(response.data);
    } catch (error) {
      console.error('Failed to load daily stats:', error);
    }
  };

  // Search products
  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (!query.trim()) {
      loadProducts();
      return;
    }
    setSearchLoading(true);
    try {
      const response = await retailerApi.getPOSProducts({ search: query });
      setProducts(response.data?.products || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Barcode scanning
  const handleBarcodeScan = async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      const response = await retailerApi.scanBarcode(barcode);
      if (response.data?.product) {
        addToCart(response.data.product);
        message.success(`Added: ${response.data.product.name}`);
      } else {
        message.warning('Product not found for this barcode');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Barcode scan failed');
    }

    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      message.warning('Product out of stock');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          message.warning(`Only ${product.stock} units available`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const newQty = item.quantity + delta;
          if (newQty > item.stock) {
            message.warning(`Only ${item.stock} units available`);
            return item;
          }
          return { ...item, quantity: Math.max(0, newQty) };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const setItemQuantity = (id: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          if (quantity > item.stock) {
            message.warning(`Only ${item.stock} units available`);
            return { ...item, quantity: item.stock };
          }
          return { ...item, quantity: Math.max(0, quantity) };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // Calculate totals with 18% VAT
  const TAX_RATE = 0.18; // 18% VAT
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = subtotal * TAX_RATE;
  const discountAmount = discountType === 'percent'
    ? (subtotal * discount / 100)
    : discount;
  const total = Math.max(0, subtotal + taxAmount - discountAmount);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Complete the sale
  const completeSale = async (method: string, paymentDetails?: any) => {
    setProcessing(true);

    try {
      const saleData = {
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          cost_price: item.cost_price,
        })),
        subtotal,
        tax_amount: taxAmount,
        tax_rate: TAX_RATE,
        payment_method: method as 'dashboard_wallet' | 'credit_wallet' | 'mobile_money',
        customer_phone: customer?.phone || customerPhone || undefined,
        discount: discountAmount > 0 ? discountAmount : undefined,
        gasRewardWalletId: paymentDetails?.gasRewardWalletId || gasRewardWalletId || undefined,
        payment_details: paymentDetails,
      };

      const response = await retailerApi.createSale(saleData);

      if (response.data?.success) {
        message.success('Sale completed successfully!');
        setLastSale({
          ...response.data,
          items: cart,
          subtotal,
          tax: taxAmount,
          discount: discountAmount,
          total,
          method,
          gasRewardWalletId: paymentDetails?.gasRewardWalletId || gasRewardWalletId,
        });

        // Reset state
        setPaymentModal(false);
        setCart([]);
        setDiscount(0);
        setCustomer(null);
        setCustomerPhone('');
        setCardStep('tap');
        setCardPin('');
        setGasRewardWalletId('');

        // Show receipt
        setReceiptModal(true);

        // Refresh stats and products
        loadDailyStats();
        loadProducts();
      } else {
        throw new Error(response.data?.error || 'Sale failed');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || error.message || 'Sale failed');
    } finally {
      setProcessing(false);
    }
  };

  // Handle payment based on method
  const handlePayment = async () => {
    if (cart.length === 0) {
      message.error('Cart is empty');
      return;
    }

    let paymentType: string;
    let paymentDetails: any = {};

    switch (paymentMethod) {
      case 'bigshop_card':
        paymentType = cardWalletType === 'dashboard' ? 'dashboard_wallet' : 'credit_wallet';
        paymentDetails = {
          card_pin: cardPin,
          wallet_type: cardWalletType,
          gasRewardWalletId: cardWalletType === 'dashboard' ? gasRewardWalletId : undefined,
        };
        break;

      case 'mobile_money':
        if (!customerPhone || customerPhone.length < 10) {
          message.error('Please enter a valid phone number');
          return;
        }
        paymentType = 'mobile_money';
        paymentDetails = {
          provider: mobileProvider,
          phone: customerPhone,
          gasRewardWalletId: gasRewardWalletId || undefined,
        };
        // Simulate mobile money request
        message.loading('Sending payment request to customer...', 2);
        await new Promise(resolve => setTimeout(resolve, 2000));
        message.success(`Payment request sent to ${customerPhone}`);
        break;

      default:
        message.error('Invalid payment method');
        return;
    }

    await completeSale(paymentType, paymentDetails);
  };

  // Print receipt
  const printReceipt = () => {
    window.print();
  };

  // Filtered products
  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', height: 'calc(100vh - 64px)' }}>
      {/* Daily Stats Banner */}
      {dailyStats && (
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={16}>
            <Col span={5}>
              <Statistic
                title="Total Sales"
                value={dailyStats.total_sales}
                suffix="RWF"
                valueStyle={{ color: '#3f8600', fontSize: '16px' }}
                formatter={(value) => value?.toLocaleString()}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Mobile Payment"
                value={dailyStats.mobile_payment_transactions || 0}
                prefix={<MobileOutlined />}
                valueStyle={{ fontSize: '16px', color: '#faad14' }}
              />
            </Col>
            <Col span={5}>
              <Statistic
                title="Dashboard Wallet"
                value={dailyStats.dashboard_wallet_transactions || 0}
                prefix={<WalletOutlined />}
                valueStyle={{ fontSize: '16px', color: '#1890ff' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="Credit Wallet"
                value={dailyStats.credit_wallet_transactions || 0}
                prefix={<CreditCardOutlined />}
                valueStyle={{ fontSize: '16px', color: '#722ed1' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Gas Rewards"
                value={`${(dailyStats.gas_rewards_m3 || 0).toFixed(2)} M³`}
                suffix={<span style={{ fontSize: '12px', color: '#8c8c8c' }}>({(dailyStats.gas_rewards_rwf || 0).toLocaleString()} RWF)</span>}
                valueStyle={{ fontSize: '16px', color: '#fa541c' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Row gutter={16} style={{ height: 'calc(100% - 100px)' }}>
        {/* Products Grid */}
        <Col xs={24} lg={16} style={{ height: '100%', overflow: 'auto' }}>
          <Card
            title="Products"
            extra={
              <Space>
                <Input
                  placeholder="Scan barcode"
                  prefix={<BarcodeOutlined />}
                  value={barcodeInput}
                  ref={barcodeInputRef}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onPressEnter={() => handleBarcodeScan(barcodeInput)}
                  style={{ width: 150 }}
                />
                <Input.Search
                  placeholder="Search..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  loading={searchLoading}
                  style={{ width: 150 }}
                  allowClear
                />
              </Space>
            }
          >
            {filteredProducts.length === 0 ? (
              <Empty description="No products found" />
            ) : (
              <Row gutter={[12, 12]}>
                {filteredProducts.map((product) => (
                  <Col xs={12} sm={8} md={6} key={product.id}>
                    <Card
                      hoverable
                      onClick={() => addToCart(product)}
                      size="small"
                      style={{
                        textAlign: 'center',
                        opacity: product.stock === 0 ? 0.5 : 1,
                        cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Badge
                        count={product.stock <= 10 ? `${product.stock} left` : 0}
                        style={{ backgroundColor: product.stock <= 5 ? '#f5222d' : '#faad14' }}
                      >
                        <div style={{ padding: '8px 0' }}>
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              style={{ width: 60, height: 60, objectFit: 'cover', margin: '0 auto 8px', borderRadius: 8, display: 'block' }} 
                            />
                          ) : (
                            <div style={{ width: 60, height: 60, background: '#f0f0f0', margin: '0 auto 8px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShoppingCartOutlined style={{ fontSize: 24, color: '#ccc' }} />
                            </div>
                          )}
                          <Text strong style={{ display: 'block', fontSize: '13px' }}>{product.name}</Text>
                          <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                            {product.sku}
                          </Text>
                          <Text strong style={{ color: '#0ea5e9', fontSize: '16px' }}>
                            {product.price?.toLocaleString()} RWF
                          </Text>
                          {product.stock === 0 && (
                            <Tag color="red" style={{ marginTop: 4 }}>OUT OF STOCK</Tag>
                          )}
                        </div>
                      </Badge>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>

        {/* Cart */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <span>Cart</span>
                {itemCount > 0 && <Tag color="blue">{itemCount} items</Tag>}
              </Space>
            }
            extra={
              cart.length > 0 && (
                <Button type="text" danger size="small" onClick={clearCart}>
                  Clear
                </Button>
              )
            }
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
          >
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                <BarcodeOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <Text type="secondary" style={{ display: 'block' }}>
                  Scan barcode or click products to add
                </Text>
              </div>
            ) : (
              <>
                <List
                  dataSource={cart}
                  style={{ flex: 1, overflow: 'auto' }}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeItem(item.id)}
                        />,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} 
                            />
                          ) : (
                            <div style={{ width: 40, height: 40, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ShoppingCartOutlined style={{ fontSize: 20, color: '#ccc' }} />
                            </div>
                          )
                        }
                        title={
                          <Text style={{ fontSize: '13px' }}>{item.name}</Text>
                        }
                        description={
                          <Space>
                            <Button
                              size="small"
                              icon={<MinusOutlined />}
                              onClick={() => updateQuantity(item.id, -1)}
                            />
                            <InputNumber
                              size="small"
                              min={1}
                              max={item.stock}
                              value={item.quantity}
                              onChange={(val) => setItemQuantity(item.id, val || 1)}
                              style={{ width: 50 }}
                            />
                            <Button
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={item.quantity >= item.stock}
                            />
                          </Space>
                        }
                      />
                      <Text strong style={{ fontSize: '13px' }}>
                        {(item.price * item.quantity).toLocaleString()} RWF
                      </Text>
                    </List.Item>
                  )}
                />

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ marginTop: 'auto' }}>
                  {/* Discount */}
                  <Row gutter={8} style={{ marginBottom: 12 }}>
                    <Col span={16}>
                      <InputNumber
                        placeholder="Discount"
                        value={discount}
                        onChange={(val) => setDiscount(val || 0)}
                        style={{ width: '100%' }}
                        min={0}
                        max={discountType === 'percent' ? 100 : subtotal}
                      />
                    </Col>
                    <Col span={8}>
                      <Radio.Group
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value)}
                        size="small"
                      >
                        <Radio.Button value="fixed">RWF</Radio.Button>
                        <Radio.Button value="percent">%</Radio.Button>
                      </Radio.Group>
                    </Col>
                  </Row>

                  <Row justify="space-between" style={{ marginBottom: 8 }}>
                    <Text>Subtotal:</Text>
                    <Text>{subtotal.toLocaleString()} RWF</Text>
                  </Row>
                  <Row justify="space-between" style={{ marginBottom: 8 }}>
                    <Text type="secondary">Tax (18% VAT):</Text>
                    <Text type="secondary">+{taxAmount.toLocaleString()} RWF</Text>
                  </Row>
                  {discountAmount > 0 && (
                    <Row justify="space-between" style={{ marginBottom: 8 }}>
                      <Text type="success">Discount:</Text>
                      <Text type="success">-{discountAmount.toLocaleString()} RWF</Text>
                    </Row>
                  )}
                  <Row justify="space-between" style={{ marginBottom: 16 }}>
                    <Title level={4} style={{ margin: 0 }}>Total:</Title>
                    <Title level={4} style={{ margin: 0, color: '#0ea5e9' }}>
                      {total.toLocaleString()} RWF
                    </Title>
                  </Row>

                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={() => setPaymentModal(true)}
                    disabled={cart.length === 0}
                  >
                    Checkout ({itemCount} items)
                  </Button>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Payment Modal */}
      <Modal
        title="Payment"
        open={paymentModal}
        onCancel={() => {
          setPaymentModal(false);
          setCardStep('tap');
          setCardPin('');
          setGasRewardWalletId('');
        }}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ textAlign: 'center', color: '#0ea5e9', margin: 0 }}>
            {total.toLocaleString()} RWF
          </Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
            {itemCount} items (incl. 18% VAT: {taxAmount.toLocaleString()} RWF)
          </Text>
        </div>

        {/* Payment Method Selection */}
        <Radio.Group
          value={paymentMethod}
          onChange={(e) => {
            setPaymentMethod(e.target.value);
            setCardStep('tap');
            setCardPin('');
            setGasRewardWalletId('');
          }}
          style={{ width: '100%', marginBottom: 24 }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio.Button value="bigshop_card" style={{ width: '100%', height: 56, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
              <Space>
                <CreditCardOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>Big Shop Card</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>Tap card, enter PIN, pay with wallet</div>
                </div>
              </Space>
            </Radio.Button>
            <Radio.Button value="mobile_money" style={{ width: '100%', height: 56, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
              <Space>
                <MobileOutlined style={{ fontSize: 20, color: '#faad14' }} />
                <div>
                  <div style={{ fontWeight: 500 }}>Mobile Money</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>MTN MoMo or Airtel Money</div>
                </div>
              </Space>
            </Radio.Button>
          </Space>
        </Radio.Group>

        <Divider style={{ margin: '16px 0' }} />

        {/* Big Shop Card Payment Flow */}
        {paymentMethod === 'bigshop_card' && (
          <div>
            {cardStep === 'tap' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CreditCardOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
                <Title level={4}>Tap Customer Card on Reader</Title>
                <Text type="secondary">Ask customer to tap their Big Shop Card on the NFC reader</Text>
                <Button
                  type="primary"
                  size="large"
                  block
                  style={{ marginTop: 24 }}
                  onClick={() => setCardStep('pin')}
                >
                  Card Detected - Continue
                </Button>
              </div>
            )}

            {cardStep === 'pin' && (
              <div style={{ padding: '20px 0' }}>
                <Title level={5} style={{ textAlign: 'center', marginBottom: 16 }}>Enter Card PIN</Title>
                <Input.Password
                  size="large"
                  placeholder="Enter 4-digit PIN"
                  value={cardPin}
                  onChange={(e) => setCardPin(e.target.value)}
                  maxLength={4}
                  style={{ textAlign: 'center', letterSpacing: 8, fontSize: 24 }}
                />
                <Button
                  type="primary"
                  size="large"
                  block
                  style={{ marginTop: 16 }}
                  disabled={cardPin.length !== 4}
                  onClick={() => setCardStep('wallet_choice')}
                >
                  Verify PIN
                </Button>
              </div>
            )}

            {cardStep === 'wallet_choice' && (
              <div style={{ padding: '20px 0' }}>
                <Title level={5} style={{ textAlign: 'center', marginBottom: 16 }}>Select Payment Wallet</Title>
                <Radio.Group
                  value={cardWalletType}
                  onChange={(e) => setCardWalletType(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Radio.Button value="dashboard" style={{ width: '100%', height: 60, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                      <Space>
                        <WalletOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                        <div>
                          <div style={{ fontWeight: 500 }}>Dashboard Wallet</div>
                          <div style={{ fontSize: 11, color: '#52c41a' }}>Eligible for gas rewards</div>
                        </div>
                      </Space>
                    </Radio.Button>
                    <Radio.Button value="credit" style={{ width: '100%', height: 60, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                      <Space>
                        <CreditCardOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                        <div>
                          <div style={{ fontWeight: 500 }}>Credit Wallet</div>
                          <div style={{ fontSize: 11, color: '#8c8c8c' }}>No gas rewards</div>
                        </div>
                      </Space>
                    </Radio.Button>
                  </Space>
                </Radio.Group>
                <Button
                  type="primary"
                  size="large"
                  block
                  style={{ marginTop: 16 }}
                  onClick={() => {
                    if (cardWalletType === 'dashboard') {
                      setCardStep('reward_id');
                    } else {
                      // Credit wallet - no gas rewards, proceed to payment
                      handlePayment();
                    }
                  }}
                >
                  Continue
                </Button>
              </div>
            )}

            {cardStep === 'reward_id' && (
              <div style={{ padding: '20px 0' }}>
                <Title level={5} style={{ textAlign: 'center', marginBottom: 16 }}>Enter Gas Reward Wallet ID</Title>
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 16 }}>
                  Required for Dashboard Wallet (Gas Rewards Eligible)
                </Text>
                <Input
                  size="large"
                  placeholder="Gas Reward Wallet ID (GRW-...)"
                  value={gasRewardWalletId}
                  onChange={(e) => setGasRewardWalletId(e.target.value)}
                  style={{ textAlign: 'center' }}
                />
                <Button
                  type="primary"
                  size="large"
                  block
                  style={{ marginTop: 16 }}
                  disabled={!gasRewardWalletId}
                  onClick={handlePayment}
                >
                  Complete Payment
                </Button>
                 <Button
                  type="text"
                  block
                  style={{ marginTop: 8 }}
                  onClick={() => setCardStep('wallet_choice')}
                >
                  Back
                 </Button>
              </div>
            )}
          </div>
        )}

        {/* Mobile Money Payment Flow */}
        {paymentMethod === 'mobile_money' && (
          <div style={{ padding: '20px 0' }}>
            <Title level={5} style={{ marginBottom: 16 }}>Select Mobile Money Provider</Title>
            <Radio.Group
              value={mobileProvider}
              onChange={(e) => setMobileProvider(e.target.value)}
              style={{ width: '100%', marginBottom: 16 }}
            >
              <Space style={{ width: '100%' }}>
                <Radio.Button value="mtn" style={{ flex: 1, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 500, color: '#faad14' }}>MTN MoMo</span>
                </Radio.Button>
                <Radio.Button value="airtel" style={{ flex: 1, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontWeight: 500, color: '#f5222d' }}>Airtel Money</span>
                </Radio.Button>
              </Space>
            </Radio.Group>

            <Input
              size="large"
              placeholder="Customer phone number (07XXXXXXXX)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              prefix={<MobileOutlined />}
              style={{ marginBottom: 12 }}
            />

            <Input
              size="large"
              placeholder="Gas Reward Wallet ID (Optional)"
              value={gasRewardWalletId}
              onChange={(e) => setGasRewardWalletId(e.target.value)}
              prefix={<span style={{ color: '#fa541c' }}>🎁</span>}
              style={{ marginBottom: 16 }}
            />
            <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
              Payment request will be sent to customer's phone
            </Text>

            <Button
              type="primary"
              size="large"
              block
              loading={processing}
              disabled={!customerPhone || customerPhone.length < 10}
              onClick={handlePayment}
            >
              {processing ? 'Sending Payment Request...' : `Request ${total.toLocaleString()} RWF`}
            </Button>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            Sale Completed
          </Space>
        }
        open={receiptModal}
        onCancel={() => setReceiptModal(false)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={printReceipt}>
            Print Receipt
          </Button>,
          <Button key="new" type="primary" onClick={() => setReceiptModal(false)}>
            New Sale
          </Button>,
        ]}
        width={400}
      >
        {lastSale && (
          <div className="receipt" style={{ fontFamily: 'monospace' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>BIG Company</Title>
              <Text type="secondary">Sales Receipt</Text>
            </div>

            <Divider dashed style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">Receipt #:</Text>{' '}
              <Text strong>{lastSale.receipt_number || lastSale.order_id?.slice(0, 8)}</Text>
              <br />
              <Text type="secondary">Date:</Text>{' '}
              <Text>{new Date().toLocaleString('en-RW')}</Text>
              <br />
              <Text type="secondary">Payment:</Text>{' '}
              <Tag>{lastSale.method?.toUpperCase()}</Tag>
            </div>

            <Divider dashed style={{ margin: '12px 0' }} />

            {lastSale.items?.map((item: CartItem, index: number) => (
              <Row key={index} justify="space-between" style={{ marginBottom: 4 }}>
                <Col span={14}>
                  <Text>{item.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {item.quantity} x {item.price?.toLocaleString()}
                  </Text>
                </Col>
                <Col span={10} style={{ textAlign: 'right' }}>
                  <Text>{(item.price * item.quantity).toLocaleString()}</Text>
                </Col>
              </Row>
            ))}

            <Divider dashed style={{ margin: '12px 0' }} />

            <Row justify="space-between">
              <Text>Subtotal:</Text>
              <Text>{lastSale.subtotal?.toLocaleString()} RWF</Text>
            </Row>
            <Row justify="space-between">
              <Text type="secondary">Tax (18% VAT):</Text>
              <Text type="secondary">+{lastSale.tax?.toLocaleString()} RWF</Text>
            </Row>
            {lastSale.discount > 0 && (
              <Row justify="space-between">
                <Text>Discount:</Text>
                <Text>-{lastSale.discount?.toLocaleString()} RWF</Text>
              </Row>
            )}
            <Row justify="space-between" style={{ marginTop: 8 }}>
              <Title level={4} style={{ margin: 0 }}>Total:</Title>
              <Title level={4} style={{ margin: 0 }}>{lastSale.total?.toLocaleString()} RWF</Title>
            </Row>
            {lastSale.gasRewardWalletId && (
              <Row justify="space-between" style={{ marginTop: 8 }}>
                <Text type="secondary">Gas Reward Wallet:</Text>
                <Text type="secondary">{lastSale.gasRewardWalletId}</Text>
              </Row>
            )}

            <Divider dashed style={{ margin: '12px 0' }} />

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Thank you for shopping!</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default POSPage;
