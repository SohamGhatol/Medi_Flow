import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import StaffNavbar from './common/StaffNavbar';
import { 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  TrendingDown, 
  DollarSign,
  Search,
  Filter
} from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ExpiryDashboard = () => {
  const { token } = useAuth();
  const [data, setData] = useState({ metrics: {}, batches: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchExpiryData();
  }, []);

  const fetchExpiryData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/inventory/expiry/alerts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
      setError('');
    } catch (err) {
      console.error("Error fetching expiry alerts:", err);
      setError('Failed to load expiry intelligence data.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'EXPIRED': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">EXPIRED</span>;
      case 'CRITICAL': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-bold">CRITICAL</span>;
      case 'HIGH': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">HIGH</span>;
      case 'MEDIUM': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold">MEDIUM</span>;
      case 'SAFE': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">SAFE</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-bold">UNKNOWN</span>;
    }
  };

  const filteredBatches = data.batches.filter(b => {
    if (filter !== 'ALL' && b.risk_level !== filter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return b.medicine_name.toLowerCase().includes(term) || b.batch_no.toLowerCase().includes(term);
    }
    return true;
  }).sort((a, b) => {
    if (a.days_remaining === null) return 1;
    if (b.days_remaining === null) return -1;
    return a.days_remaining - b.days_remaining;
  });

  if (loading) return <><StaffNavbar activePage="expiry-intelligence" /><div className="p-8 text-center text-gray-500">Loading expiry intelligence...</div></>;
  if (error) return <><StaffNavbar activePage="expiry-intelligence" /><div className="p-8 text-center text-red-500">{error} <br/><button onClick={fetchExpiryData} className="mt-4 text-blue-500 underline">Retry</button></div></>;

  return (
    <div className="min-h-screen bg-slate-50">
      <StaffNavbar activePage="expiry-intelligence" />
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Expiry Intelligence & FEFO Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-red-200">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Expired Batches</h3>
            <ShieldAlert className="text-red-500 w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{data.metrics.expired_count}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-200">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Critical (≤7 days)</h3>
            <AlertTriangle className="text-orange-500 w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{data.metrics.critical_count}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-200">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium">High Risk (≤30 days)</h3>
            <Clock className="text-yellow-500 w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{data.metrics.high_count}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium">Value At Risk</h3>
            <DollarSign className="text-gray-500 w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">
            ₹{data.metrics.total_value_at_risk.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by medicine or batch..."
            className="w-full pl-9 pr-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400 w-4 h-4" />
          <select 
            className="border rounded-md px-3 py-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="EXPIRED">Expired</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="SAFE">Safe</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine & Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Demand</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Leftover</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => (
                  <tr key={batch.batch_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{batch.medicine_name}</div>
                      <div className="text-xs text-gray-500">Batch: {batch.batch_no}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${batch.days_remaining <= 0 ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                        {batch.exp_date || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {batch.days_remaining !== null ? `${batch.days_remaining} days left` : '---'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {batch.current_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {batch.daily_demand > 0 ? batch.daily_demand : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {batch.estimated_stock_at_expiry !== null && batch.estimated_stock_at_expiry > 0 ? (
                        <span className="text-red-500 flex items-center justify-center font-medium">
                          <TrendingDown className="w-3 h-3 mr-1" />
                          {batch.estimated_stock_at_expiry}
                        </span>
                      ) : (
                        <span className="text-green-500">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getRiskBadge(batch.risk_level)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No batches match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiryDashboard;
