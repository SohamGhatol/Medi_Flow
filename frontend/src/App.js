import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Staff Portal Components
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import MedicineTable from './components/MedicineTable';
import AddMedicine from './components/AddMedicine';
import EditMedicine from './components/EditMedicine';
import SalesForm from './components/SalesForm';
import SalesHistory from './components/SalesHistory';
import Reports from './components/Reports';
import AdminPanel from './components/AdminPanel';
import ExpiryDashboard from './components/ExpiryDashboard';
import SmartReplenishment from './components/SmartReplenishment';
import DemandAnalytics from './components/DemandAnalytics';
import DeadStockAnalytics from './components/DeadStockAnalytics';

// Customer Portal Components
import DualLoginPage from './components/DualLoginPage';
import CustomerLogin from './components/CustomerLogin';
import CustomerRegister from './components/CustomerRegister';
import ProductCatalog from './components/ProductCatalog';
import ShoppingCart from './components/ShoppingCart';
import Checkout from './components/Checkout';
import ProductDetails from './components/ProductDetails';
import OrderConfirmation from './components/OrderConfirmation';
import CustomerDashboard from './components/CustomerDashboard';
import OrderTracking from './components/OrderTracking';
import OnlineOrders from './components/OnlineOrders';

// Shared
import ChatWidgetV2 from './components/ChatWidgetV2';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <Router>
          <div className="App">
          <Routes>
            {/* Landing Page - Dual Login */}
            <Route path="/" element={<DualLoginPage />} />
            
            {/* Staff Portal Routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/medicines" element={<MedicineTable />} />
            <Route path="/medicines/add" element={<AddMedicine />} />
            <Route path="/medicines/edit/:id" element={<EditMedicine />} />
            <Route path="/sales" element={<SalesForm />} />
            <Route path="/sales/history" element={<SalesHistory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/expiry-intelligence" element={<ExpiryDashboard />} />
            <Route path="/smart-replenishment" element={<SmartReplenishment />} />
            <Route path="/demand-analytics" element={<DemandAnalytics />} />
            <Route path="/dead-stock" element={<DeadStockAnalytics />} />
            
            {/* Customer Portal Routes */}
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/register" element={<CustomerRegister />} />
            <Route path="/shop" element={<ProductCatalog />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<ShoppingCart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/customer/orders" element={<CustomerDashboard />} />
            <Route path="/customer/orders/:orderId" element={<CustomerDashboard />} />
            <Route path="/customer/orders/:orderId/track" element={<OrderTracking />} />
            
            {/* Staff Online Orders */}
            <Route path="/online-orders" element={<OnlineOrders />} />
          </Routes>
          <ChatWidgetV2 />
        </div>
      </Router>
    </AuthProvider>
    </AlertProvider>
  );
}

export default App;