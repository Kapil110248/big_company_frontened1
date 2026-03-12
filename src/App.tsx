import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Components
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { ShopPage } from './pages/consumer/ShopPage';
import { OrdersPage as ConsumerOrdersPage } from './pages/consumer/OrdersPage';
import { RetailersPage as ConsumerRetailersPage } from './pages/consumer/RetailersPage';
import ConsumerWalletPage from './pages/consumer/WalletPage';
import ConsumerProfilePage from './pages/consumer/ProfilePage';
import GasPage from './pages/consumer/GasPage';
import RewardsPage from './pages/consumer/RewardsPage';
import CreditLedgerPage from './pages/consumer/CreditLedgerPage';
import CreditTransactionsPage from './pages/consumer/CreditTransactionsPage';
import RetailerDiscoveryPage from './pages/consumer/RetailerDiscoveryPage';
import GasMeterRechargePage from './pages/consumer/GasMeterRechargePage';

// Employee Pages


// Retailer Pages
import { RetailerDashboard } from './pages/retailer/RetailerDashboard';
import { InventoryPage as RetailerInventoryPage } from './pages/retailer/InventoryPage';
import { OrdersPage as RetailerOrdersPage } from './pages/retailer/OrdersPage';
import POSPage from './pages/retailer/POSPage';
import { WalletPage } from './pages/retailer/WalletPage';
import AddStockPage from './pages/retailer/AddStockPage';
import ManagementPage from './pages/retailer/ManagementPage';
import RetailerAnalyticsPage from './pages/retailer/AnalyticsPage';
import WholesalerDiscoveryPage from './pages/retailer/WholesalerDiscoveryPage';
import CustomerLinkRequestsPage from './pages/retailer/CustomerLinkRequestsPage';
import PurchaseOrdersPage from './pages/retailer/PurchaseOrdersPage'; // Add this

// Wholesaler Pages
import { WholesalerDashboard } from './pages/wholesaler/WholesalerDashboard';
import { InventoryPage as WholesalerInventoryPage } from './pages/wholesaler/InventoryPage';
import WholesalerOrdersPage from './pages/wholesaler/OrdersPage';
import RetailersPage from './pages/wholesaler/RetailersPage';
import WholesalerAnalyticsPage from './pages/wholesaler/AnalyticsPage';
import WalletCreditPage from './pages/wholesaler/WalletCreditPage';
import MyManagementPage from './pages/wholesaler/MyManagementPage';
import LinkRequestsPage from './pages/wholesaler/LinkRequestsPage';
import ProfileSettingsPage from './pages/shared/ProfileSettingsPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AccountManagementPage from './pages/admin/AccountManagementPage';
import { ProductListingPage } from './pages/admin/ProductListingPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import RetailerManagementPage from './pages/admin/RetailerManagementPage';
import WholesalerManagementPage from './pages/admin/WholesalerManagementPage';
import LoanManagementPage from './pages/admin/LoanManagementPage';
import NFCCardManagementPage from './pages/admin/NFCCardManagementPage';
import ReportsPage from './pages/admin/ReportsPage';
import CustomerManagementPage from './pages/admin/CustomerManagementPage';
import EmployeeManagementPage from './pages/admin/EmployeeManagementPage';
import EmployeeDetailsPage from './pages/admin/EmployeeDetailsPage';
import PayrollProcessingPage from './pages/admin/PayrollProcessingPage';
import RecruitmentPage from './pages/admin/RecruitmentPage';
import VendorManagementPage from './pages/admin/VendorManagementPage';
import DealsPage from './pages/admin/DealsPage';
import PricingConfigPage from './pages/admin/PricingConfigPage';
// New Admin Pages for Client Requirements
import SettlementInvoicesPage from './pages/admin/SettlementInvoicesPage';
import AccountDetailsPage from './pages/admin/AccountDetailsPage';
import LinkageManagementPage from './pages/admin/LinkageManagementPage';

// Placeholder for pages not yet implemented
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ textAlign: 'center', padding: 48 }}>
    <h2>{title}</h2>
    <p>Coming soon</p>
  </div>
);

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#667eea',
          borderRadius: 8,
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Consumer Routes - wrapped with CartProvider */}
            <Route
              path="/consumer"
              element={
                <ProtectedRoute allowedRoles={['consumer']}>
                  <CartProvider>
                    <AppLayout />
                  </CartProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/consumer/discover-retailers" replace />} />
              <Route path="discover-retailers" element={<RetailerDiscoveryPage />} />
              <Route path="retailers" element={<ConsumerRetailersPage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="orders" element={<ConsumerOrdersPage />} />
              <Route path="wallet" element={<ConsumerWalletPage />} />
              <Route path="gas" element={<GasPage />} />
              <Route path="gas-meter-recharge" element={<GasMeterRechargePage />} />
              <Route path="rewards" element={<RewardsPage />} />
              <Route path="loans/ledger" element={<CreditLedgerPage />} />
              <Route path="loans/transactions" element={<CreditTransactionsPage />} />
              <Route path="profile" element={<ConsumerProfilePage />} />
            </Route>

            {/* Employee Routes - DELETED */}
            {/* <Route
              path="/employee"
              element={
                <ProtectedRoute allowedRoles={['employee']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/" replace />} />
            </Route> */}

            {/* Retailer Routes */}
            <Route
              path="/retailer"
              element={
                <ProtectedRoute allowedRoles={['retailer']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/retailer/dashboard" replace />} />
              <Route path="dashboard" element={<RetailerDashboard />} />
              <Route path="pos" element={<POSPage />} />
              <Route path="add-stock" element={<AddStockPage />} />
              <Route path="inventory" element={<RetailerInventoryPage />} />
              <Route path="orders" element={<RetailerOrdersPage />} />
              <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="management" element={<ManagementPage />} />
              <Route path="analytics" element={<RetailerAnalyticsPage />} />
              <Route path="wholesalers" element={<WholesalerDiscoveryPage />} />
              <Route path="customer-requests" element={<CustomerLinkRequestsPage />} />
              <Route path="profile" element={<ProfileSettingsPage />} />
            </Route>

            {/* Wholesaler Routes */}
            <Route
              path="/wholesaler"
              element={
                <ProtectedRoute allowedRoles={['wholesaler']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/wholesaler/dashboard" replace />} />
              <Route path="dashboard" element={<WholesalerDashboard />} />
              <Route path="inventory" element={<WholesalerInventoryPage />} />
              <Route path="orders" element={<WholesalerOrdersPage />} />
              <Route path="retailers" element={<RetailersPage />} />
              <Route path="link-requests" element={<LinkRequestsPage />} />
              <Route path="wallet" element={<WalletCreditPage />} />
              <Route path="management" element={<MyManagementPage />} />
              <Route path="analytics" element={<WholesalerAnalyticsPage />} />
              <Route path="profile" element={<ProfileSettingsPage />} />
            </Route>

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout />
                </ProtectedRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="accounts" element={<AccountManagementPage />} />
              <Route path="products" element={<ProductListingPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="customers" element={<CustomerManagementPage />} />
              <Route path="retailers" element={<RetailerManagementPage />} />
              <Route path="wholesalers" element={<WholesalerManagementPage />} />
              <Route path="loans" element={<LoanManagementPage />} />
              <Route path="nfc-cards" element={<NFCCardManagementPage />} />
              <Route path="pricing-config" element={<PricingConfigPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="profile" element={<ProfileSettingsPage />} />
              {/* New routes for client requirements */}
              <Route path="settlement-invoices" element={<SettlementInvoicesPage />} />
              <Route path="account-details/:id" element={<AccountDetailsPage />} />
              <Route path="linkage" element={<LinkageManagementPage />} />
              {/* HR Routes */}
              <Route path="employees" element={<EmployeeManagementPage />} />
              <Route path="employees/:id" element={<EmployeeDetailsPage />} />
              <Route path="payroll" element={<PayrollProcessingPage />} />
              <Route path="recruitment" element={<RecruitmentPage />} />
              <Route path="vendors" element={<VendorManagementPage />} />
              <Route path="deals" element={<DealsPage />} />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
