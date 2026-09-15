import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAlert } from '../context/AlertContext';
import StaffNavbar from './common/StaffNavbar';

const SalesForm = () => {
  const { showAlert, showConfirm } = useAlert();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines');
      setMedicines(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      showAlert({ type: 'error', message: 'Failed to load medicines', title: 'Error' });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const medicine = medicines.find(m => m.medicine_id === parseInt(selectedMedicine));
      
      if (!medicine) {
        throw new Error('Please select a valid medicine');
      }

      if (quantity > medicine.quantity) {
        throw new Error(`Only ${medicine.quantity} units available in stock`);
      }

      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      const response = await api.post('/sales', {
        medicine_id: selectedMedicine,
        quantity: parseInt(quantity),
        customer_name: customerName
      });

      showAlert({ type: 'success', message: 'Sale completed successfully!' });
      
      // Reset form
      setSelectedMedicine('');
      setQuantity(1);
      setCustomerName('');
      
      // Refresh medicine stock
      fetchMedicines();
    } catch (error) {
      showAlert({ type: 'error', message: error.message || 'Failed to complete sale', title: 'Error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Find currently selected medicine to show price/stock preview
  const activeMedicine = medicines.find(m => m.medicine_id === parseInt(selectedMedicine));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <StaffNavbar activePage="sales" />

      {/* Main content */}
      <main className="flex-grow py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="md:grid md:grid-cols-12 md:gap-8">
          
          {/* Left Column: Context & History */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Point of Sale</h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                Process over-the-counter medicine sales, verify stock, and generate immediate customer invoices.
              </p>
            </div>
            
            <div className="bg-primary-50 rounded-xl p-5 border border-primary-100">
              <h3 className="text-sm font-bold text-primary-900 uppercase tracking-wider mb-2">Quick Actions</h3>
              <button
                onClick={() => navigate('/sales/history')}
                className="w-full flex items-center justify-between bg-white px-4 py-3 border border-primary-200 rounded-lg shadow-sm text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <span className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  View Sales History
                </span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Column: Sale Form */}
          <div className="mt-8 md:mt-0 md:col-span-8 lg:col-span-9">
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
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Grid for Form Inputs */}
                  <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
                    
                    {/* Medicine Selection */}
                    <div className="sm:col-span-2">
                      <label htmlFor="medicine" className="block text-sm font-semibold text-slate-700 mb-1">
                        Select Medicine <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="medicine"
                          value={selectedMedicine}
                          onChange={(e) => setSelectedMedicine(e.target.value)}
                          className={`appearance-none block w-full pl-4 pr-10 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors shadow-sm ${
                            loading ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-300 text-slate-900 focus:border-primary-500 focus:ring-primary-500/20'
                          }`}
                          disabled={loading || isProcessing || medicines.length === 0}
                          required
                        >
                          <option value="">Select a medicine from inventory...</option>
                          {loading ? (
                            <option value="" disabled>Loading inventory data...</option>
                          ) : medicines.length === 0 ? (
                            <option value="" disabled>No medicines available in inventory</option>
                          ) : (
                            medicines.map((medicine) => (
                              <option 
                                key={medicine.medicine_id} 
                                value={medicine.medicine_id}
                                disabled={medicine.quantity <= 0}
                              >
                                {medicine.name} - {medicine.company} {medicine.quantity <= 0 ? '(Out of Stock)' : `(${medicine.quantity} in stock)`}
                              </option>
                            ))
                          )}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                          {loading ? (
                            <svg className="animate-spin h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-1">
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
                        className="block w-full border border-slate-300 rounded-xl shadow-sm py-3 px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors sm:text-sm"
                        disabled={isProcessing || !selectedMedicine}
                        required
                      />
                      {activeMedicine && (
                        <p className={`mt-1.5 text-xs font-medium ${parseInt(quantity) > activeMedicine.quantity ? 'text-red-600' : 'text-slate-500'}`}>
                          Max available: {activeMedicine.quantity}
                        </p>
                      )}
                    </div>

                    {/* Customer Name */}
                    <div className="sm:col-span-1">
                      <label htmlFor="customer" className="block text-sm font-semibold text-slate-700 mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        id="customer"
                        placeholder="Optional for OTC"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="block w-full border border-slate-300 rounded-xl shadow-sm py-3 px-4 bg-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors sm:text-sm"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>

                  {/* Summary Box (Visible only if medicine selected) */}
                  {activeMedicine && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mt-6 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Unit Price: <span className="font-semibold text-slate-900">₹{activeMedicine.price}</span></span>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 uppercase tracking-wider font-bold block">Total Amount</span>
                          <span className="text-2xl font-black text-primary-600">
                            ₹{((parseFloat(activeMedicine.price) || 0) * (parseInt(quantity) || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={isProcessing || loading || !selectedMedicine || (activeMedicine && quantity > activeMedicine.quantity)}
                      className="inline-flex justify-center items-center py-3 px-8 border border-transparent shadow-sm text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 w-full sm:w-auto"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
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
      </main>
    </div>
  );
};

export default SalesForm;
