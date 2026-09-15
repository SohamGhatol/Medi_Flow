import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
  AlertTriangle, Search, Filter, Calendar, TrendingDown,
  PackageX, DollarSign, Clock, ShieldAlert, X
} from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const DeadStockAnalytics = () => {
  const [data, setData] = useState({ summary: {}, items: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState(null);
  const { showAlert } = useAlert();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dead-stock');
      setData(res.data);
    } catch (err) {
      console.error(err);
      showAlert({ type: 'error', message: 'Failed to fetch dead stock data', title: 'Error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return data.items.filter(item => {
      const matchesSearch = item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = classificationFilter === 'ALL' || item.classification.includes(classificationFilter);
      return matchesSearch && matchesClass;
    });
  }, [data.items, searchTerm, classificationFilter]);

  const getRiskColor = (score) => {
    if (score >= 90) return 'text-red-600 bg-red-100';
    if (score >= 70) return 'text-orange-600 bg-orange-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-emerald-600 bg-emerald-100';
  };

  const getClassificationColor = (classification) => {
    if (classification.includes('DEAD STOCK')) return 'bg-red-100 text-red-800 border-red-200';
    if (classification.includes('SLOW MOVING')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (classification.includes('EXPIRY RISK')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (classification.includes('FAST MOVING')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (classification.includes('NEW')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Intelligence</h1>
          <p className="text-slate-500 mt-1">Identify slow-moving, dead, and expiry-risk inventory</p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2">
          <TrendingDown size={16} />
          Refresh Analysis
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-500 text-sm font-medium">Dead Stock Items</h3>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><PackageX size={20}/></div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{data.summary.dead_stock_items || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-500 text-sm font-medium">Slow Moving</h3>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Clock size={20}/></div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{data.summary.slow_moving_items || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-500 text-sm font-medium">Value At Risk</h3>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><DollarSign size={20}/></div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">
            ₹{data.summary.inventory_value_at_risk?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-500 text-sm font-medium">Expiry Risk Items</h3>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><ShieldAlert size={20}/></div>
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-2">{data.summary.expiry_risk_items || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search medicines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
          >
            <option value="ALL">All Classifications</option>
            <option value="DEAD STOCK">Dead Stock</option>
            <option value="SLOW MOVING">Slow Moving</option>
            <option value="EXPIRY RISK">Expiry Risk</option>
            <option value="FAST MOVING">Fast Moving</option>
            <option value="NEW">New / Insufficient Data</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Medicine</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Sale</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Velocity</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Coverage</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Value (₹)</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Classification</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-500">Loading analytics...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-500">No inventory matches criteria.</td></tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.medicine_id} onClick={() => setSelectedItem(item)} className="hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{item.medicine_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-700">
                      {item.current_stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">
                      {item.days_since_last_sale === null ? 'Never' : `${item.days_since_last_sale} days ago`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500">
                      {item.average_daily_demand}/day
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">
                      {item.days_of_stock === null ? 'Infinite' : `${item.days_of_stock} days`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-700">
                      {item.inventory_value.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded border ${getClassificationColor(item.classification)}`}>
                        {item.classification}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${getRiskColor(item.risk_score)}`}>
                        {item.risk_score}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900 bg-opacity-75 transition-opacity" onClick={() => setSelectedItem(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full">
              
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl leading-6 font-bold text-slate-900" id="modal-title">
                      {selectedItem.medicine_name}
                    </h3>
                    <div className="mt-2 flex gap-2">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded border ${getClassificationColor(selectedItem.classification)}`}>
                        {selectedItem.classification}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded border ${getRiskColor(selectedItem.risk_score)}`}>
                        Risk Score: {selectedItem.risk_score}/100
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-500">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-6">
                  {/* Inventory Overview */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Inventory Profile</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500 text-sm">Current Stock:</span> <span className="font-medium text-slate-800">{selectedItem.current_stock}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 text-sm">Value At Risk:</span> <span className="font-medium text-slate-800">₹{selectedItem.inventory_value.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 text-sm">Days of Stock:</span> <span className="font-medium text-slate-800">{selectedItem.days_of_stock === null ? 'Infinite' : `${selectedItem.days_of_stock} days`}</span></div>
                    </div>
                  </div>
                  
                  {/* Demand Overview */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Demand Context (90 Days)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-slate-500 text-sm">Units Sold:</span> <span className="font-medium text-slate-800">{selectedItem.units_sold}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 text-sm">Avg Daily Demand:</span> <span className="font-medium text-slate-800">{selectedItem.average_daily_demand}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 text-sm">Last Sale:</span> <span className="font-medium text-slate-800">{selectedItem.days_since_last_sale === null ? 'Never' : `${selectedItem.days_since_last_sale} days ago`}</span></div>
                    </div>
                  </div>
                </div>

                {/* Analysis Reasons */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Analysis Findings</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {selectedItem.reasons.length > 0 ? (
                      selectedItem.reasons.map((reason, idx) => (
                        <li key={idx} className="text-sm text-slate-600">{reason}</li>
                      ))
                    ) : (
                      <li className="text-sm text-slate-600">Operating within normal parameters.</li>
                    )}
                  </ul>
                </div>

                {/* Batch Breakdown */}
                {selectedItem.batches && selectedItem.batches.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">Batch Expiry Breakdown</h4>
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Batch</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Days to Expiry</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Risk</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {selectedItem.batches.map((b, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm text-slate-800">{b.batch_no}</td>
                              <td className="px-4 py-2 text-sm text-right text-slate-800">{b.quantity}</td>
                              <td className="px-4 py-2 text-sm text-right text-slate-800">{b.days_to_expiry}</td>
                              <td className="px-4 py-2 text-sm">
                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                  b.risk.includes('Risk') || b.risk.includes('Expired') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {b.risk}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Recommendations */}
                <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} /> Operational Recommendations
                  </h4>
                  <p className="text-sm text-indigo-800">
                    {selectedItem.classification.includes('DEAD STOCK') 
                      ? "Review purchasing rules for this medicine. It has tied up capital with zero movement. Do not replenish until demand increases."
                      : selectedItem.classification.includes('SLOW MOVING')
                      ? "Current stock exceeds reasonable demand. Monitor closely before making future purchase orders."
                      : selectedItem.classification.includes('EXPIRY RISK')
                      ? "Prioritize this stock for FEFO sales. Consider discounting or reaching out to suppliers for returns."
                      : selectedItem.classification.includes('NEW')
                      ? "New inventory item. Monitor sales over the next 30-60 days to establish baseline velocity."
                      : "Inventory levels are healthy relative to historical demand."}
                  </p>
                </div>

              </div>
              <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl border-t border-slate-200">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-slate-800 text-base font-medium text-white hover:bg-slate-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeadStockAnalytics;
