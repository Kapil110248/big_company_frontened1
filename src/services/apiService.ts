import axios from "axios";


import { API_URL } from "../config";

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("bigcompany_token") ||
    localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// Handle 401 responses and API errors (only relevant if FORCE_MOCK is false)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("bigcompany_token");
      localStorage.removeItem("admin_token");
      localStorage.removeItem("bigcompany_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Employee APIs
export const employeeApi = {
  getDashboard: () => api.get("/employee/dashboard"),
  getAttendance: () => api.get("/employee/attendance"),
  checkIn: () => api.post("/employee/attendance/check-in"),
  checkOut: () => api.post("/employee/attendance/check-out"),
  getPayslips: () => api.get("/employee/payslips"),
  getPayslip: (id: string) => api.get(`/employee/payslips/${id}`),
  getTasks: () => api.get("/employee/tasks"),
  getLeaveBalance: () => api.get("/employee/leave/balance"),
  requestLeave: (data: any) => api.post("/employee/leave/request", data),
};

// Consumer/Shop APIs
export const consumerApi = {
  // Retailers
  getRetailers: (params?: { lat?: number; lng?: number; province?: string; district?: string; sector?: string; cell?: string; search?: string }) =>
    api.get("/store/retailers", { params }),

  // Categories
  getCategories: () => api.get("/store/categories"),

  // Products
  getProducts: (params?: {
    retailerId?: string;
    category?: string;
    search?: string;
    limit?: number;
  }) => api.get("/store/products", { params }),
  getProduct: (id: string) => api.get(`/store/products/${id}`),

  // Cart
  getCart: () => api.get("/store/carts"),
  createCart: (retailerId: string) =>
    api.post("/store/carts", { retailer_id: retailerId }),
  addToCart: (cartId: string, productId: string, quantity: number) =>
    api.post(`/store/carts/${cartId}/line-items`, {
      product_id: productId,
      quantity,
    }),
  updateCartItem: (cartId: string, itemId: string, quantity: number) =>
    api.put(`/store/carts/${cartId}/line-items/${itemId}`, { quantity }),
  removeCartItem: (cartId: string, itemId: string) =>
    api.delete(`/store/carts/${cartId}/line-items/${itemId}`),
  clearCart: (cartId: string) => api.delete(`/store/carts/${cartId}`),

  // Checkout
  checkout: (
    cartId: string,
    data?: { delivery_address?: string; notes?: string }
  ) => api.post(`/store/carts/${cartId}/complete`, data),

  // Orders
  getOrders: (params?: any) =>
    api.get("/store/customers/me/orders", { params }),
  getOrder: (id: string) => api.get(`/store/customers/me/orders/${id}`),
  trackOrder: (id: string) => api.get(`/store/customers/me/orders/${id}/track`),
  cancelOrder: (id: string, reason: string) => api.post(`/store/orders/${id}/cancel`, { reason }),
  confirmDelivery: (id: string) => api.post(`/store/orders/${id}/confirm-delivery`),
  createOrder: (data: { retailerId: string; items: any[]; paymentMethod: string; total: number; meterId?: string; cardId?: number }) => api.post('/store/orders', data),

  // Wallet
  getWallet: () => api.get("/store/wallet/balance"), // Legacy route
  getWallets: () => api.get("/store/wallets"), // Get all wallets (dashboard + credit)
  topupWallet: (data: { amount: number; payment_method: string }) =>
    api.post("/store/wallets/topup", data),
  requestRefund: (data: any) => api.post("/store/wallets/refund-request", data),
  getWalletTransactions: (params?: any) =>
    api.get("/store/wallets/transactions", { params }),

  // Gas Service
  getGasMeters: () => api.get("/store/gas/meters"),
  addGasMeter: (data: { meter_number: string; meter_type: string; alias_name: string; owner_name: string; owner_phone: string }) =>
    api.post("/store/gas/meters", data),
  removeGasMeter: (id: string) => api.delete(`/store/gas/meters/${id}`),
  topupGas: (data: { meter_number: string; amount: number; payment_method: string; card_id?: number | null }) =>
    api.post("/store/gas/topup", data),
  recordGasUsage: (data: { meter_number: string; units_used: number; activity: string }) =>
    api.post("/store/gas/usage", data),
  getGasHistory: () => api.get("/store/gas/usage"),

  // Rewards
  getRewardsBalance: () => api.get("/store/gas/rewards/balance"),
  getRewardsHistory: (limit?: number) =>
    api.get("/store/gas/rewards/history", { params: { limit } }),
  redeemRewards: (points: number) =>
    api.post("/store/rewards/redeem", { points }),
  getReferralCode: () => api.get("/store/rewards/referral-code"),
  applyReferralCode: (code: string) =>
    api.post("/store/rewards/apply-referral", { code }),
  getLeaderboard: (period: "week" | "month" | "all") =>
    api.get("/store/gas/rewards/leaderboard", { params: { period } }),
  sendToMeter: (data: { meterId: string; amount: number }) =>
    api.post("/rewards/send-to-meter", data),

  // Loans
  getLoanProducts: () => api.get("/store/loans/products"),
  checkLoanEligibility: () => api.get("/store/loans/eligibility"),
  getLoans: () => api.get("/store/loans"),
  getActiveLoanLedger: () => api.get('/store/loans/active'),
  getCreditTransactions: () => api.get('/store/loans/transactions'),
  getLoanDetails: (id: string) => api.get(`/store/loans/${id}`),
  applyForLoan: (data: {
    loan_product_id: string;
    amount: number;
    purpose?: string;
  }) => api.post("/store/loans/apply", data),
  repayLoan: (id: string, data: { amount: number; payment_method: string }) =>
    api.post(`/store/loans/${id}/repay`, data),
  getFoodCredit: () => api.get("/store/loans/food-credit"),

  // Profile
  getProfile: () => api.get("/store/customers/me"),
  updateProfile: (data: { full_name?: string; address?: string; landmark?: string }) =>
    api.put("/store/customers/me", data),
};

// Retailer APIs
export const retailerApi = {
  // Profile
  getProfile: () => api.get("/retailer/profile"),
  updateProfile: (data: any) => api.put("/retailer/profile", data),

  // Dashboard & Analytics
  getDashboardStats: () => api.get("/retailer/dashboard"),
  getAnalytics: (params?: any) => api.get("/retailer/analytics", { params }),

  // Inventory
  getInventory: (params?: any) => api.get("/retailer/inventory", { params }),
  getProducts: (params?: any) => api.get("/retailer/inventory", { params }),
  getCategories: () => api.get("/retailer/inventory/categories"),
  createProduct: (data: any) => api.post("/retailer/inventory", data),
  updateProduct: (id: string, data: any) =>
    api.put(`/retailer/inventory/${id}`, data),
  updateInventory: (id: string, data: any) =>
    api.put(`/retailer/inventory/${id}`, data),
  updateStock: (id: string, quantity: number, type: string, reason?: string) =>
    api.post(`/retailer/inventory/${id}/stock`, { quantity, type, reason }),
  updatePrice: (id: string, sellingPrice: number, costPrice?: number) =>
    api.put(`/retailer/inventory/${id}/price`, {
      selling_price: sellingPrice,
      cost_price: costPrice,
    }),

  // Orders
  getOrders: (params?: any) => api.get("/retailer/orders", { params }),
  getOrder: (id: string) => api.get(`/retailer/orders/${id}`),
  createOrder: (data: any) => api.post("/retailer/orders", data),
  updateOrderStatus: (id: string, status: string, notes?: string) =>
    api.put(`/retailer/orders/${id}/status`, { status, notes }),
  cancelOrder: (id: string, reason: string) =>
    api.post(`/retailer/orders/${id}/cancel`, { reason }),
  fulfillOrder: (id: string) => api.post(`/retailer/orders/${id}/fulfill`),

  // POS
  getPOSProducts: (params?: any) =>
    api.get("/retailer/pos/products", { params }),
  scanBarcode: (barcode: string) => api.post("/retailer/pos/scan", { barcode }),
  createSale: (data: any) => api.post("/retailer/pos/sale", data),
  getDailySales: () => api.get("/retailer/pos/daily-sales"),

  // Wallet & Credit
  getWallet: () => api.get("/retailer/wallet"),
  getWalletBalance: () => api.get("/retailer/wallet"), // Mapped to /retailer/wallet as it returns balance
  getWalletTransactions: (params?: any) =>
    api.get("/retailer/wallet/transactions", { params }),
  getCreditInfo: () => api.get("/retailer/credit"),
  getCreditOrders: (params?: any) =>
    api.get("/retailer/credit/orders", { params }),
  getCreditOrder: (id: string) => api.get(`/retailer/credit/orders/${id}`),
  requestCredit: (data: any) => api.post("/retailer/credit/request", data),
  makeRepayment: (orderId: string, amount: number) =>
    api.post(`/retailer/credit/orders/${orderId}/repay`, { amount }),
  topUpWallet: (amount: number, source: string) =>
    api.post("/retailer/wallet/topup", { amount, source }),

  // Wholesalers & Stock
  getWholesalers: () => api.get("/retailer/wholesalers"),
  getWholesalerProducts: (params?: any) =>
    api.get("/retailer/wholesaler/products", { params }), // Correct endpoint
  getPurchaseOrders: (params?: any) =>
    api.get("/retailer/wholesaler/orders", { params }),
  getPurchaseOrder: (id: string) =>
    api.get(`/retailer/wholesaler/orders/${id}`),

  // Branch Management
  getBranches: () => api.get("/retailer/branches"),
  getBranchStats: () => api.get("/retailer/branches/stats"),
  getBranch: (id: string) => api.get(`/retailer/branches/${id}`),
  createBranch: (data: any) => api.post("/retailer/branches", data),
  updateBranch: (id: string, data: any) =>
    api.put(`/retailer/branches/${id}`, data),
  deleteBranch: (id: string) => api.delete(`/retailer/branches/${id}`),
  getBranchTransactions: (branchId: string, params?: any) =>
    api.get(`/retailer/branches/${branchId}/transactions`, { params }),
  getBranchSummary: (branchId: string, period?: string) =>
    api.get(`/retailer/branches/${branchId}/summary`, { params: { period } }),

  // POS Terminal Management
  getBranchTerminals: (branchId: string) =>
    api.get(`/retailer/branches/${branchId}/terminals`),
  createTerminal: (branchId: string, data: any) =>
    api.post(`/retailer/branches/${branchId}/terminals`, data),
  updateTerminal: (terminalId: string, data: any) =>
    api.put(`/retailer/terminals/${terminalId}`, data),
  deleteTerminal: (terminalId: string) =>
    api.delete(`/retailer/terminals/${terminalId}`),

  // NFC Cards (Retailer)
  getNFCCards: (params?: any) => api.get("/retailer/nfc-cards", { params }),
  getNFCCardStats: () => api.get("/retailer/nfc-cards/stats"),
  issueNFCCard: (data: any) => api.post("/retailer/nfc-cards/issue", data),
  blockNFCCard: (cardId: string, reason: string) =>
    api.post(`/retailer/nfc-cards/${cardId}/block`, { reason }),
  unblockNFCCard: (cardId: string) =>
    api.post(`/retailer/nfc-cards/${cardId}/unblock`),
  topUpNFCCard: (cardId: string, data: any) =>
    api.post(`/retailer/nfc-cards/${cardId}/topup`, data),
  getNFCCardTransactions: (cardId: string, params?: any) =>
    api.get(`/retailer/nfc-cards/${cardId}/transactions`, { params }),

  // Manual Card Payments (3 Verification Methods)
  verifyPinAndCharge: (
    cardId: string,
    pin: string,
    amount: number,
    branchId?: string
  ) =>
    api.post("/retailer/manual-payment/verify-pin", {
      card_id: cardId,
      pin,
      amount,
      branch_id: branchId,
    }),
  generatePaymentCode: (
    cardId: string,
    amount: number,
    customerPhone?: string,
    branchId?: string
  ) =>
    api.post("/retailer/manual-payment/generate-code", {
      card_id: cardId,
      amount,
      customer_phone: customerPhone,
      branch_id: branchId,
    }),
  verifyCodeAndCharge: (
    cardId: string,
    code: string,
    amount: number,
    branchId?: string
  ) =>
    api.post("/retailer/manual-payment/verify-code", {
      card_id: cardId,
      code,
      amount,
      branch_id: branchId,
    }),
  requestPaymentOTP: (cardId: string, amount: number, customerPhone: string) =>
    api.post("/retailer/manual-payment/request-otp", {
      card_id: cardId,
      amount,
      customer_phone: customerPhone,
    }),
  verifyOTPAndCharge: (
    cardId: string,
    otp: string,
    customerPhone: string,
    amount: number
  ) =>
    api.post("/retailer/manual-payment/verify-otp", {
      card_id: cardId,
      otp,
      customer_phone: customerPhone,
      amount,
    }),
  getPaymentAuditLogs: (params?: {
    limit?: number;
    offset?: number;
    card_id?: string;
    method?: string;
  }) => api.get("/retailer/manual-payment/audit", { params }),

  // Customer Link Request Management (Retailer manages customer requests)
  getCustomerLinkRequests: (params?: any) =>
    api.get("/retailer/customer-link-requests", { params }),
  approveCustomerLinkRequest: (requestId: number) =>
    api.post(`/retailer/customer-link-requests/${requestId}/approve`),
  rejectCustomerLinkRequest: (requestId: number, reason?: string) =>
    api.post(`/retailer/customer-link-requests/${requestId}/reject`, { reason }),
  getLinkedCustomers: () => api.get("/retailer/linked-customers"),
  unlinkCustomer: (customerId: number) =>
    api.delete(`/retailer/linked-customers/${customerId}`),
};

// Wholesaler APIs
export const wholesalerApi = {
  // Dashboard
  getDashboardStats: () => api.get("/wholesaler/dashboard/stats"),

  // Inventory
  getInventory: (params?: any) => api.get("/wholesaler/inventory", { params }),
  getProducts: (params?: any) => api.get("/wholesaler/inventory", { params }),
  getCategories: () => api.get("/wholesaler/inventory/categories"),
  getInventoryStats: () => api.get("/wholesaler/inventory/stats"),
  createProduct: (data: any) => api.post("/wholesaler/inventory", data),
  addInventory: (data: any) => api.post("/wholesaler/inventory", data),
  updateProduct: (id: string, data: any) =>
    api.put(`/wholesaler/inventory/${id}`, data),
  updateInventory: (id: string, data: any) =>
    api.put(`/wholesaler/inventory/${id}`, data),
  updateStock: (id: string, quantity: number, type: string, reason?: string) =>
    api.post(`/wholesaler/inventory/${id}/stock`, { quantity, type, reason }),
  updatePrice: (id: string, wholesalePrice: number, costPrice?: number) =>
    api.put(`/wholesaler/inventory/${id}/price`, {
      wholesale_price: wholesalePrice,
      cost_price: costPrice,
    }),
  deleteProduct: (id: string) => api.delete(`/wholesaler/inventory/${id}`),

  // Retailer Orders
  getRetailerOrders: (params?: any) =>
    api.get("/wholesaler/retailer-orders", { params }),
  getOrders: (params?: any) =>
    api.get("/wholesaler/retailer-orders", { params }),
  getOrder: (id: string) => api.get(`/wholesaler/retailer-orders/${id}`),
  getOrderStats: () => api.get("/wholesaler/retailer-orders/stats"),
  updateOrderStatus: (id: string, status: string) =>
    api.put(`/wholesaler/retailer-orders/${id}/status`, { status }),
  confirmOrder: (id: string) =>
    api.post(`/wholesaler/retailer-orders/${id}/confirm`),
  rejectOrder: (id: string, reason: string) =>
    api.post(`/wholesaler/retailer-orders/${id}/reject`, { reason }),
  shipOrder: (id: string, trackingNumber?: string, deliveryNotes?: string) =>
    api.post(`/wholesaler/retailer-orders/${id}/ship`, {
      tracking_number: trackingNumber,
      delivery_notes: deliveryNotes,
    }),
  confirmDelivery: (id: string) =>
    api.post(`/wholesaler/retailer-orders/${id}/deliver`),

  // Retailers Management
  getRetailers: (params?: any) => api.get("/wholesaler/retailers", { params }),
  getRetailer: (id: string) => api.get(`/wholesaler/retailers/${id}`),
  getRetailerOrdersById: (id: string, limit?: number) =>
    api.get(`/wholesaler/retailers/${id}/orders`, { params: { limit } }),
  getRetailerStats: (id: string) =>
    api.get(`/wholesaler/retailers/${id}/stats`),
  updateRetailerCreditLimit: (id: string, creditLimit: number) =>
    api.put(`/wholesaler/retailers/${id}/credit-limit`, { creditLimit }),
  blockRetailer: (id: string, reason: string) =>
    api.post(`/wholesaler/retailers/${id}/block`, { reason }),
  unblockRetailer: (id: string) =>
    api.post(`/wholesaler/retailers/${id}/unblock`),

  // Credit Management
  getSupplierOrders: () => api.get("/wholesaler/supplier-orders"),
  getCreditRequests: (params?: any) =>
    api.get("/wholesaler/credit-requests", { params }),
  approveCreditRequest: (id: string) =>
    api.post(`/wholesaler/credit-requests/${id}/approve`),
  rejectCreditRequest: (id: string, reason?: string) =>
    api.post(`/wholesaler/credit-requests/${id}/reject`, { reason }),

  // Profile & Settings
  getProfile: () => api.get("/wholesaler/profile"),
  updateProfile: (data: any) => api.put("/wholesaler/profile", data),
  updateSettings: (data: any) => api.put("/wholesaler/settings", data),
};

// NFC Card APIs - for managing customer NFC cards
export const nfcApi = {
  // Customer's own cards
  getMyCards: () => api.get("/nfc/cards"),
  linkCard: (uid: string, pin: string, nickname?: string) =>
    api.post("/nfc/cards/link", { uid, pin, nickname }),
  unlinkCard: (cardId: string) => api.delete(`/nfc/cards/${cardId}`),
  setCardPin: (cardId: string, oldPin: string, newPin: string) =>
    api.put(`/nfc/cards/${cardId}/pin`, { old_pin: oldPin, new_pin: newPin }),
  setPrimaryCard: (cardId: string) => api.put(`/nfc/cards/${cardId}/primary`),
  updateCardNickname: (cardId: string, nickname: string) =>
    api.put(`/nfc/cards/${cardId}/nickname`, { nickname }),
  topUpCard: (cardId: string, data: { amount: number; pin?: string }) =>
    api.post(`/nfc/cards/${cardId}/topup`, data),
  getCardOrders: (cardId: string) => api.get(`/nfc/cards/${cardId}/orders`),

  // POS NFC operations (for retailers)
  processNFCPayment: (
    cardUid: string,
    pin: string,
    amount: number,
    description?: string
  ) =>
    api.post("/nfc/pos/payment", {
      card_uid: cardUid,
      pin,
      amount,
      description,
    }),
  checkCardBalance: (cardUid: string, pin: string) =>
    api.post("/nfc/pos/balance", { card_uid: cardUid, pin }),
  validateCard: (cardUid: string) =>
    api.post("/nfc/pos/validate", { card_uid: cardUid }),

  // Admin NFC operations (for wholesaler admin)
  getAllCards: (params?: any) => api.get("/nfc/admin/cards", { params }),
  getCardDetails: (cardId: string) => api.get(`/nfc/admin/cards/${cardId}`),
  blockCard: (cardId: string, reason: string) =>
    api.post(`/nfc/admin/cards/${cardId}/block`, { reason }),
  unblockCard: (cardId: string) =>
    api.post(`/nfc/admin/cards/${cardId}/unblock`),
  getCardTransactions: (cardId: string, params?: any) =>
    api.get(`/nfc/admin/cards/${cardId}/transactions`, { params }),
  issueNewCard: (customerId: string, uid: string, pin: string) =>
    api.post("/nfc/admin/cards/issue", { customer_id: customerId, uid, pin }),
  getCardStats: () => api.get("/nfc/admin/stats"),
};

// Wallet APIs - for managing customer wallets
export const walletApi = {
  // Customer wallet
  getBalance: () => api.get("/wallet/balance"),
  getTransactions: (params?: any) =>
    api.get("/wallet/transactions", { params }),

  // Top-up
  topUpMobileMoney: (
    amount: number,
    phone: string,
    provider: "mtn" | "airtel"
  ) => api.post("/wallet/topup/mobile-money", { amount, phone, provider }),
  topUpBankTransfer: (amount: number) =>
    api.post("/wallet/topup/bank", { amount }),
  checkTopUpStatus: (transactionId: string) =>
    api.get(`/wallet/topup/status/${transactionId}`),

  // Transfer
  transfer: (
    recipientPhone: string,
    amount: number,
    pin: string,
    description?: string
  ) =>
    api.post("/wallet/transfer", {
      recipient_phone: recipientPhone,
      amount,
      pin,
      description,
    }),

  // Admin wallet operations
  getCustomerWallet: (customerId: string) =>
    api.get(`/wallet/admin/customers/${customerId}`),
  adjustBalance: (
    customerId: string,
    amount: number,
    type: "credit" | "debit",
    reason: string
  ) =>
    api.post(`/wallet/admin/customers/${customerId}/adjust`, {
      amount,
      type,
      reason,
    }),
  getWalletStats: () => api.get("/wallet/admin/stats"),
};

// Admin APIs
export const adminApi = {
  // Dashboard
  getDashboard: () => api.get("/admin/dashboard"),

  // Customers
  getCustomers: (params?: any) => api.get("/admin/customers", { params }),
  getCustomer: (id: string) => api.get(`/admin/customers/${id}`),
  createCustomer: (data: any) => api.post("/admin/customers", data),
  updateCustomer: (id: string, data: any) =>
    api.put(`/admin/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/admin/customers/${id}`),
  creditCustomer: (id: string, amount: number, reason: string) =>
    api.post(`/admin/customers/${id}/credit`, { amount, reason }),
  updateCustomerStatus: (id: string, data: { status: string }) =>
    api.put(`/admin/customers/${id}/status`, data),

  // Categories
  getCategories: () => api.get("/admin/categories"),
  createCategory: (data: any) => api.post("/admin/categories", data),
  updateCategory: (id: string, data: any) =>
    api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/categories/${id}`),

  // Retailers
  getRetailers: (params?: any) => api.get("/admin/retailers", { params }),
  createRetailer: (data: any) => api.post("/admin/retailers", data), // Fixed endpoint
  updateRetailer: (id: string, data: any) =>
    api.put(`/admin/retailers/${id}`, data),
  deleteRetailer: (id: string) => api.delete(`/admin/retailers/${id}`),
  verifyRetailer: (id: string) => api.post(`/admin/retailers/${id}/verify`),
  updateRetailerStatus: (id: string, isActive: boolean, reason?: string) =>
    api.post(`/admin/retailers/${id}/status`, { isActive, reason }),
  updateRetailerCreditLimit: (
    id: string,
    creditLimit: number,
    reason?: string
  ) => api.post(`/admin/retailers/${id}/credit-limit`, { creditLimit, reason }),

  // Wholesalers
  getWholesalers: (params?: any) => api.get("/admin/wholesalers", { params }),
  createWholesaler: (data: any) => api.post("/admin/wholesalers", data), // Fixed endpoint
  updateWholesaler: (id: string, data: any) =>
    api.put(`/admin/wholesalers/${id}`, data),
  deleteWholesaler: (id: string) => api.delete(`/admin/wholesalers/${id}`),
  verifyWholesaler: (id: string) => api.post(`/admin/wholesalers/${id}/verify`),
  updateWholesalerStatus: (id: string, isActive: boolean, reason?: string) =>
    api.post(`/admin/wholesalers/${id}/status`, { isActive, reason }),

  // Loans
  getLoans: (params?: any) => api.get("/admin/loans", { params }),
  approveLoan: (id: string) => api.post(`/admin/loans/${id}/approve`),
  rejectLoan: (id: string, reason: string) =>
    api.post(`/admin/loans/${id}/reject`, { reason }),

  // NFC Cards
  getNFCCards: (params?: any) => api.get("/admin/nfc-cards", { params }),
  registerNFCCard: (data: {
    uid: string;
    pin?: string;
    cardType?: string;
    cardholderName?: string;
    nationalId?: string;
    phone?: string;
    email?: string;
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
    streetAddress?: string;
    landmark?: string;
    userId?: string;
  }) => api.post("/admin/nfc-cards", data),
  blockNFCCard: (id: string) =>
    api.put(`/admin/nfc-cards/${id}/block`),
  activateNFCCard: (id: string) =>
    api.put(`/admin/nfc-cards/${id}/activate`),
  unlinkNFCCard: (id: string) =>
    api.put(`/admin/nfc-cards/${id}/unlink`),

  // Reports
  getTransactionReport: (params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    groupBy?: string;
  }) => api.get("/admin/reports/transactions", { params }),
  getRevenueReport: (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }) => api.get("/admin/reports/revenue", { params }),

  // Audit Logs
  getAuditLogs: (params?: any) => api.get("/admin/audit-logs", { params }),

  // Products
  getProducts: (params?: any) => api.get("/admin/products", { params }),
  createProduct: (data: any) => api.post("/admin/products", data),
  updateProduct: (id: string, data: any) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),

  // Settings
  getSettings: () => api.get("/admin/settings"),
  updateSettings: (settings: Record<string, any>) =>
    api.post("/admin/settings", { settings }),

  // System Config
  getSystemConfig: () => api.get("/admin/system-config"),
  updateSystemConfig: (data: any) => api.put("/admin/system-config", data),

  // Reports
  getReports: (params?: any) => api.get("/admin/reports", { params }),

  // ==========================================
  // REAL-TIME READ-ONLY ACCOUNT ACCESS (Admin views)
  // ==========================================
  getCustomerAccountDetails: (id: string) => api.get(`/admin/customers/${id}/account-details`),
  getRetailerAccountDetails: (id: string) => api.get(`/admin/retailers/${id}/account-details`),
  getWorkerAccountDetails: (id: string) => api.get(`/admin/employees/${id}/account-details`),
  getWholesalerAccountDetails: (id: string) => api.get(`/admin/wholesalers/${id}/account-details`),

  // ==========================================
  // WHOLESALER-RETAILER LINKAGE
  // ==========================================
  getRetailerWholesalerLinkage: () => api.get('/admin/linkage'),
  linkRetailerToWholesaler: (retailerId: number, wholesalerId: number) =>
    api.post('/admin/linkage/link', { retailerId, wholesalerId }),
  unlinkRetailerFromWholesaler: (retailerId: number) =>
    api.post('/admin/linkage/unlink', { retailerId }),

  // ==========================================
  // SETTLEMENT INVOICE MANAGEMENT
  // ==========================================
  getSettlementInvoices: (params?: { month?: string; partyType?: string; partyId?: number }) =>
    api.get('/admin/settlement-invoices', { params }),
  createSettlementInvoice: (data: {
    partyType: 'retailer' | 'wholesaler';
    partyId: number;
    settlementMonth: string;
    totalAmount: number;
    invoiceFileUrl?: string;
    notes?: string;
  }) => api.post('/admin/settlement-invoices', data),
  getSettlementInvoice: (id: string) => api.get(`/admin/settlement-invoices/${id}`),
  updateSettlementInvoice: (id: string, data: { totalAmount?: number; invoiceFileUrl?: string; notes?: string }) =>
    api.put(`/admin/settlement-invoices/${id}`, data),
  deleteSettlementInvoice: (id: string) => api.delete(`/admin/settlement-invoices/${id}`),

  // ==========================================
  // EMPLOYEES (for Workers)
  // ==========================================
  getEmployees: (params?: any) => api.get('/admin/employees', { params }),
};

// General Auth APIs (Protected)
// These use role-based endpoints: /wholesaler/auth, /retailer/auth, etc.
const getUserRole = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.role || "wholesaler"; // Default to wholesaler
};

export const authApi = {
  updatePassword: (data: any) => {
    const role = getUserRole();
    return api.put(`/${role}/auth/update-password`, data);
  },
  updatePin: (data: any) => {
    const role = getUserRole();
    return api.put(`/${role}/auth/update-pin`, data);
  },
};

// Gas Meter Recharge APIs
export const gasMeterRechargeApi = {
  // Initiate a new gas meter recharge (TOKEN or PIPING)
  initiate: (data: {
    meterNumber: string;
    meterType: 'TOKEN' | 'PIPING';
    amount: number;
    paymentMethod: 'wallet' | 'mobile_money' | 'nfc_card';
    phone?: string;
    cardId?: number;
    token?: string;
    provider?: string;
  }) => api.post('/gas-recharge/initiate', data),

  // Get recharge history for the current user
  getHistory: (params?: { limit?: number; offset?: number; meterNumber?: string }) =>
    api.get('/gas-recharge/history', { params }),

  // Get a specific transaction by ID
  getTransaction: (id: number) => api.get(`/gas-recharge/transaction/${id}`),
};

export default api;

