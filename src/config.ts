/**
 * ===========================================
 * CENTRALIZED API CONFIGURATION
 * ===========================================
 * 
 * यहाँ से सभी API endpoints control होते हैं।
 * बस API_BASE_URL change करें और सभी APIs update हो जाएंगी।
 * 
//  * Production: https://bigcompanybackend-production.up.railway.app
//  * Development: http://localhost:9005
 */

// ========================================
// MAIN API URL - यहाँ change करें
// ========================================
export const API_URL = "https://big-pos-production.up.railway.app";
// export const API_URL = "http://localhost:9001";

// ========================================
// ENVIRONMENT CHECK  
// ========================================
export const IS_PRODUCTION = API_URL.includes("railway.app");
export const IS_DEVELOPMENT = !IS_PRODUCTION;

// ========================================
// API ENDPOINTS - सभी routes यहाँ defined हैं
// ========================================
export const API_ENDPOINTS = {
  // Auth Endpoints
  AUTH: {
    CONSUMER_LOGIN: "/store/auth/login",
    EMPLOYEE_LOGIN: "/employee/auth/login",
    RETAILER_LOGIN: "/retailer/auth/login",
    WHOLESALER_LOGIN: "/wholesaler/auth/login",
    ADMIN_LOGIN: "/admin/auth/login",
    CONSUMER_REGISTER: "/store/auth/register",
    RETAILER_REGISTER: "/retailer/auth/register",
    WHOLESALER_REGISTER: "/wholesaler/auth/register",
  },

  // Consumer/Store Endpoints
  STORE: {
    RETAILERS: "/store/retailers",
    CATEGORIES: "/store/categories",
    PRODUCTS: "/store/products",
    CARTS: "/store/carts",
    ORDERS: "/store/orders",
    WALLET: "/store/wallet/balance",
    WALLETS: "/store/wallets",
    GAS: "/store/gas",
    REWARDS: "/store/rewards",
    LOANS: "/store/loans",
    CUSTOMERS: "/store/customers",
  },

  // Retailer Endpoints
  RETAILER: {
    PROFILE: "/retailer/profile",
    DASHBOARD: "/retailer/dashboard",
    INVENTORY: "/retailer/inventory",
    ORDERS: "/retailer/orders",
    POS: "/retailer/pos",
    WALLET: "/retailer/wallet",
    CREDIT: "/retailer/credit",
    WHOLESALERS: "/retailer/wholesalers",
    BRANCHES: "/retailer/branches",
    NFC_CARDS: "/retailer/nfc-cards",
  },

  // Wholesaler Endpoints
  WHOLESALER: {
    DASHBOARD: "/wholesaler/dashboard",
    INVENTORY: "/wholesaler/inventory",
    ORDERS: "/wholesaler/retailer-orders",
    RETAILERS: "/wholesaler/retailers",
    CREDIT: "/wholesaler/credit-requests",
    PROFILE: "/wholesaler/profile",
    MANAGEMENT: "/wholesaler/management",
  },

  // Admin Endpoints
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    CUSTOMERS: "/admin/customers",
    RETAILERS: "/admin/retailers",
    WHOLESALERS: "/admin/wholesalers",
    EMPLOYEES: "/admin/employees",
    PRODUCTS: "/admin/products",
    CATEGORIES: "/admin/categories",
    LOANS: "/admin/loans",
    NFC_CARDS: "/admin/nfc-cards",
    REPORTS: "/admin/reports",
    SETTINGS: "/admin/settings",
    AUDIT_LOGS: "/admin/audit-logs",
    VENDORS: "/admin/vendors",
    SUPPLIERS: "/admin/suppliers",
    JOBS: "/admin/jobs",
    APPLICATIONS: "/admin/applications",
    DEALS: "/admin/deals",
    LINKAGE: "/admin/linkage",
    SETTLEMENT_INVOICES: "/admin/settlement-invoices",
    SYSTEM_CONFIG: "/admin/system-config",
  },

  // Employee Endpoints
  EMPLOYEE: {
    DASHBOARD: "/employee/dashboard",
    ATTENDANCE: "/employee/attendance",
    PAYSLIPS: "/employee/payslips",
    TASKS: "/employee/tasks",
    LEAVES: "/employee/leaves",
    PROJECTS: "/employee/projects",
    TRAINING: "/employee/training",
    BILL_PAYMENTS: "/employee/bill-payments",
  },

  // NFC Card Endpoints
  NFC: {
    CARDS: "/nfc/cards",
    POS: "/nfc/pos",
    ADMIN: "/nfc/admin",
  },

  // Wallet Endpoints
  WALLET: {
    BALANCE: "/wallet/balance",
    TRANSACTIONS: "/wallet/transactions",
    TOPUP: "/wallet/topup",
    TRANSFER: "/wallet/transfer",
    ADMIN: "/wallet/admin",
  },
};

// ========================================
// HELPER FUNCTION - Full URL बनाने के लिए
// ========================================
export const getApiUrl = (endpoint: string): string => {
  return `${API_URL}${endpoint}`;
};

// ========================================
// DEFAULT CONFIGURATION
// ========================================
export const DEFAULT_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  headers: {
    "Content-Type": "application/json",
  },
};

// ========================================
// FRONTEND URL (for sharing/referral links)
// ========================================
export const FRONTEND_URL = IS_PRODUCTION
  ? "https://unified-frontend-production.up.railway.app"
  : "http://localhost:3062";

export default {
  API_URL,
  API_ENDPOINTS,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  getApiUrl,
  DEFAULT_CONFIG,
  FRONTEND_URL,
};
