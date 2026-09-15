import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StaffNavbar from './common/StaffNavbar';

const SmartReplenishment = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Create Purchase Order modal state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [purchaseData, setPurchaseData] = useState({
    quantity: 0,
    cost_price: 0,
    invoice_no: '',
    status: 'Pending',
    expected_date: ''
  });
  const [submittingPurchase, setSubmittingPurchase] = useState(false);

  // Filters and sort
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const token = localStorage.getItem('token');
  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/inventory/replenishment`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPredictions(response.data);
      setError('');
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
      setError('Failed to load replenishment predictions');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'NORMAL': return 'bg-green-100 text-green-800 border-green-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };
  
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'INCREASING': return <span className="text-red-500 font-bold">↑ Increasing</span>;
      case 'DECREASING': return <span className="text-blue-500 font-bold">↓ Decreasing</span>;
      case 'STABLE': return <span className="text-green-500 font-bold">→ Stable</span>;
      default: return <span className="text-slate-500">Insufficient Data</span>;
    }
  };

  const openPurchaseModal = (med) => {
    setSelectedMedicine(med);
    
    // Set default expected date to today + lead time
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + med.lead_time_days);
    
    setPurchaseData({
      quantity: med.recommended_quantity > 0 ? med.recommended_quantity : 0,
      cost_price: med.cost_price,
      invoice_no: `PO-${new Date().getTime()}`,
      status: 'Pending',
      expected_date: expectedDate.toISOString().split('T')[0]
    });
    setIsPurchaseModalOpen(true);
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setSelectedMedicine(null);
  };

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    try {
      setSubmittingPurchase(true);
      await axios.post(`${API_URL}/purchase/`, {
        supplier_id: selectedMedicine.supplier_id,
        medicine_id: selectedMedicine.medicine_id,
        quantity: parseInt(purchaseData.quantity),
        cost_price: parseFloat(purchaseData.cost_price),
        invoice_no: purchaseData.invoice_no,
        status: purchaseData.status,
        expected_date: purchaseData.expected_date
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      closePurchaseModal();
      // Refresh predictions to reflect new pending purchase
      fetchPredictions();
    } catch (err) {
      console.error("Failed to create purchase:", err);
      alert(err.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setSubmittingPurchase(false);
    }
  };

  // Filter logic
  const filteredPredictions = predictions.filter(p => {
    if (filterPriority !== 'ALL' && p.priority !== filterPriority) return false;
    if (searchQuery && !p.medicine_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Calculate summary stats
  const stats = {
    critical: predictions.filter(p => p.priority === 'CRITICAL').length,
    high: predictions.filter(p => p.priority === 'HIGH').length,
    increasing: predictions.filter(p => p.trend === 'INCREASING').length,
    potentialStockouts: predictions.filter(p => p.days_until_stockout !== null && p.days_until_stockout <= 14).length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <StaffNavbar activePage="smart-replenishment" />
      
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Smart Stock Replenishment</h2>
          <p className="mt-1 text-sm text-slate-500">AI-driven inventory forecasting based on actual sales data.</p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4 flex flex-col">
            <span className="text-sm font-medium text-slate-500">Critical Reorders</span>
            <span className="text-3xl font-bold text-red-600 mt-1">{stats.critical}</span>
          </div>
          <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-4 flex flex-col">
            <span className="text-sm font-medium text-slate-500">High Priority</span>
            <span className="text-3xl font-bold text-orange-500 mt-1">{stats.high}</span>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-4 flex flex-col">
            <span className="text-sm font-medium text-slate-500">Increasing Demand</span>
            <span className="text-3xl font-bold text-blue-600 mt-1">{stats.increasing}</span>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
            <span className="text-sm font-medium text-slate-500">Potential Stockouts (&le;14 days)</span>
            <span className="text-3xl font-bold text-slate-800 mt-1">{stats.potentialStockouts}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search medicine..."
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
              <option value="INSUFFICIENT DATA">Insufficient Data</option>
            </select>
          </div>
          <div>
            <button onClick={fetchPredictions} className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-primary-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Forecast
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Analyzing historical sales data and forecasting demand...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">{error}</div>
          ) : filteredPredictions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No predictions matching filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicine</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Info</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Demand Forecast</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Recommendation</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredPredictions.map((pred) => (
                    <tr key={pred.medicine_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">{pred.medicine_name}</div>
                        <div className="text-xs text-slate-500">{pred.company_name}</div>
                        <div className="text-xs text-slate-400 mt-1">Lead Time: {pred.lead_time_days} days</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">Current: <strong>{pred.current_stock}</strong></div>
                        <div className="text-xs text-slate-500">Pending: {pred.pending_purchases}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Coverage: {pred.days_until_stockout !== null ? <strong>~{pred.days_until_stockout} days</strong> : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{pred.forecast_daily}/day</div>
                        <div className="text-xs mt-1">{getTrendIcon(pred.trend)}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          (30d: {pred.demand_30d} | 7d: {pred.demand_7d})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">Order: <strong className="text-primary-600">{pred.recommended_quantity}</strong> units</div>
                        <div className="text-xs text-slate-500 mt-1">Reorder Pt: {pred.reorder_point}</div>
                        <div className="text-xs text-slate-500">Safety Stock: {pred.safety_stock}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getPriorityColor(pred.priority)}`}>
                          {pred.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {pred.recommended_quantity > 0 && (
                          <button
                            onClick={() => openPurchaseModal(pred)}
                            className="text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm text-xs font-bold"
                          >
                            Reorder
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      {isPurchaseModalOpen && selectedMedicine && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closePurchaseModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleCreatePurchase}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-bold text-slate-900" id="modal-title">
                        Create Purchase Order: {selectedMedicine.medicine_name}
                      </h3>
                      
                      {/* Explanation Panel */}
                      <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Recommendation Reasoning</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li>• Forecasted demand is <strong>{selectedMedicine.forecast_daily} units/day</strong>.</li>
                          <li>• Current inventory covers approximately <strong>{selectedMedicine.days_until_stockout} days</strong>.</li>
                          <li>• Supplier takes <strong>{selectedMedicine.lead_time_days} days</strong> to deliver.</li>
                          {selectedMedicine.pending_purchases > 0 && (
                            <li>• You already have <strong>{selectedMedicine.pending_purchases} units</strong> pending.</li>
                          )}
                          <li>• To maintain a 30-day supply and safety stock, ordering <strong>{selectedMedicine.recommended_quantity} units</strong> is optimal.</li>
                        </ul>
                      </div>

                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={purchaseData.quantity}
                              onChange={(e) => setPurchaseData({...purchaseData, quantity: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price (Est.)</label>
                            <input
                              type="number"
                              required
                              step="0.01"
                              min="0"
                              value={purchaseData.cost_price}
                              onChange={(e) => setPurchaseData({...purchaseData, cost_price: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Invoice / PO Number</label>
                            <input
                              type="text"
                              required
                              value={purchaseData.invoice_no}
                              onChange={(e) => setPurchaseData({...purchaseData, invoice_no: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                            <select
                              value={purchaseData.status}
                              onChange={(e) => setPurchaseData({...purchaseData, status: e.target.value})}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white"
                            >
                              <option value="Pending">Pending (Order Sent)</option>
                              <option value="Received">Received (Arrived)</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Expected Arrival Date</label>
                          <input
                            type="date"
                            required
                            value={purchaseData.expected_date}
                            onChange={(e) => setPurchaseData({...purchaseData, expected_date: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={submittingPurchase}
                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submittingPurchase ? 'Creating...' : 'Confirm Order'}
                  </button>
                  <button
                    type="button"
                    onClick={closePurchaseModal}
                    className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartReplenishment;
