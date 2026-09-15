import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAlert } from '../context/AlertContext';
import StaffNavbar from './common/StaffNavbar';

const Dashboard = () => {
  const { showConfirm } = useAlert();
  const [stats, setStats] = useState({
    total_medicines: 0,
    low_stock_medicines: 0,
    expiring_soon: 0,
    sales_period_total: 0,
    purchases_period_total: 0
  });
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();
  
  // Quick POS State
  const [medicines, setMedicines] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines');
      setMedicines(response.data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const handlePOSSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const medicine = medicines.find(m => m.medicine_id === parseInt(selectedMedicine));
      
      if (!medicine) throw new Error('Please select a valid medicine');
      if (quantity > medicine.quantity) throw new Error(`Only ${medicine.quantity} units available in stock`);
      if (quantity <= 0) throw new Error('Quantity must be greater than 0');

      await api.post('/sales', {
        medicine_id: selectedMedicine,
        quantity: parseInt(quantity),
        customer_name: customerName
      });

      showAlert({ type: 'success', message: 'Sale completed successfully!' });
      
      // Reset form & refresh stats
      setSelectedMedicine('');
      setQuantity(1);
      setCustomerName('');
      fetchMedicines();
      fetchDashboardStats();
    } catch (error) {
      showAlert({ type: 'error', message: error.message || 'Failed to complete sale', title: 'Error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const activeMedicine = medicines.find(m => m.medicine_id === parseInt(selectedMedicine));

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm('Are you sure you want to logout from Medi-Flow?', 'Confirm Logout', 'Logout');
    if (confirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <StaffNavbar activePage="dashboard" />

      {/* Main content */}
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              
              {/* Quick Actions removed - Replaced by Embedded POS Below */}

              {/* Stats cards */}
              <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Overview</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-primary-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Medicines</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {loading ? 'Loading...' : stats.total_medicines}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Low Stock Medicines</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {loading ? 'Loading...' : stats.low_stock_medicines}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Expiring Soon</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {loading ? 'Loading...' : stats.expiring_soon}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Sales (30 days)</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              ₹{loading ? 'Loading...' : stats.sales_period_total.toFixed(2)}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Purchases (30 days)</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              ₹{loading ? 'Loading...' : stats.purchases_period_total.toFixed(2)}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Embedded Point of Sale */}
              <div className="mt-12">
                <h2 className="text-xl leading-6 font-bold text-gray-900 mb-6">Point of Sale (Quick Checkout)</h2>
                
                <div className="bg-white shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center">
                      <svg className="h-5 w-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      New Transaction
                    </h3>
                  </div>
                  
                  <div className="p-6 sm:p-8">
                    <form onSubmit={handlePOSSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                        
                        <div className="sm:col-span-2">
                          <label htmlFor="medicine" className="block text-sm font-semibold text-slate-700 mb-1">
                            Select Medicine <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="medicine"
                            value={selectedMedicine}
                            onChange={(e) => setSelectedMedicine(e.target.value)}
                            required
                            className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-xl shadow-sm transition-shadow"
                          >
                            <option value="">Select a medicine...</option>
                            {medicines.map((medicine) => (
                              <option 
                                key={medicine.medicine_id} 
                                value={medicine.medicine_id}
                                disabled={medicine.quantity === 0}
                              >
                                {medicine.name} (Stock: {medicine.quantity}) - ₹{parseFloat(medicine.price).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="quantity" className="block text-sm font-semibold text-slate-700 mb-1">
                            Quantity <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="quantity"
                            min="1"
                            max={activeMedicine ? activeMedicine.quantity : undefined}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                            className="mt-1 block w-full border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-3 px-4 transition-shadow"
                          />
                        </div>

                        <div>
                          <label htmlFor="customer" className="block text-sm font-semibold text-slate-700 mb-1">
                            Customer Name (Optional)
                          </label>
                          <input
                            type="text"
                            id="customer"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="mt-1 block w-full border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm py-3 px-4 transition-shadow"
                            placeholder="Walk-in Customer"
                          />
                        </div>
                      </div>

                      {activeMedicine && (
                        <div className="mt-8 bg-blue-50/50 rounded-xl p-6 border border-blue-100 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-blue-800">Total Amount</p>
                            <p className="text-3xl font-bold text-blue-900 mt-1">
                              ₹{(parseFloat(activeMedicine.price) * quantity || 0).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-blue-600">Per unit: ₹{parseFloat(activeMedicine.price).toFixed(2)}</p>
                            <p className="text-xs text-blue-500 mt-1">Available: {activeMedicine.quantity}</p>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-200 flex justify-end">
                        <button
                          type="submit"
                          disabled={isProcessing || !selectedMedicine}
                          className="inline-flex justify-center items-center py-3 px-8 border border-transparent shadow-sm text-base font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isProcessing ? (
                            <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...</>
                          ) : (
                            'Complete Sale'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
