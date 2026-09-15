import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAlert } from '../context/AlertContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import StaffNavbar from './common/StaffNavbar';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SalesHistory = () => {
  const { showConfirm, showAlert } = useAlert();
  const navigate = useNavigate();

  // State
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('30days'); // all, today, 7days, 30days
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState(null);
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await api.get('/sales/');
      
      // Sort sales by newest first
      const sortedSales = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSales(sortedSales);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError(true);
    } finally {
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

  // Filtering Logic
  const filteredSales = useMemo(() => {
    let result = [...sales];

    // Date Filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (dateFilter === 'today') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (dateFilter === '7days') {
        cutoff.setDate(now.getDate() - 7);
      } else if (dateFilter === '30days') {
        cutoff.setDate(now.getDate() - 30);
      }
      result = result.filter(sale => new Date(sale.date) >= cutoff);
    }

    // Search Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(sale => 
        sale.customer_name?.toLowerCase().includes(lowerSearch) ||
        sale.medicine_name?.toLowerCase().includes(lowerSearch) ||
        sale.sale_id?.toString().includes(lowerSearch)
      );
    }

    return result;
  }, [sales, searchTerm, dateFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const currentSales = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const itemsSold = filteredSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
    const totalTransactions = filteredSales.length;
    const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    return {
      totalRevenue,
      itemsSold,
      totalTransactions,
      avgOrderValue
    };
  }, [filteredSales]);

  // Charts Data Aggregation
  const chartsData = useMemo(() => {
    // Group by date string YYYY-MM-DD
    const grouped = {};
    const daysToLookBack = dateFilter === 'today' ? 1 : dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 30; // fallback to 30 for 'all' to avoid massive charts
    
    // Initialize last N days to 0 to ensure clean chart even if no sales
    for (let i = daysToLookBack - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      grouped[dateStr] = { revenue: 0, count: 0 };
    }

    filteredSales.forEach(sale => {
      const dateStr = new Date(sale.date).toISOString().split('T')[0];
      if (grouped[dateStr] !== undefined) {
        grouped[dateStr].revenue += sale.total;
        grouped[dateStr].count += 1;
      }
    });

    const labels = Object.keys(grouped).map(d => {
      const date = new Date(d);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    const revenueData = Object.values(grouped).map(g => g.revenue);
    const countData = Object.values(grouped).map(g => g.count);

    return { labels, revenueData, countData };
  }, [filteredSales, dateFilter]);

  // Chart Configurations
  const revenueChartData = {
    labels: chartsData.labels,
    datasets: [
      {
        label: 'Revenue (₹)',
        data: chartsData.revenueData,
        fill: true,
        backgroundColor: 'rgba(14, 165, 233, 0.1)', // sky-500
        borderColor: 'rgb(14, 165, 233)',
        tension: 0.4,
        pointRadius: 3,
      },
    ],
  };

  const volumeChartData = {
    labels: chartsData.labels,
    datasets: [
      {
        label: 'Transactions',
        data: chartsData.countData,
        backgroundColor: 'rgba(16, 185, 129, 0.8)', // emerald-500
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.04)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Export to CSV
  const handleExport = () => {
    if (filteredSales.length === 0) {
      showAlert({ type: 'warning', message: 'No data to export.' });
      return;
    }

    const headers = ['Sale ID', 'Date', 'Customer', 'Medicine', 'Quantity', 'Price', 'Total'];
    const rows = filteredSales.map(s => [
      s.sale_id,
      new Date(s.date).toLocaleString(),
      s.customer_name || 'Walk-in',
      s.medicine_name,
      s.quantity,
      s.price,
      s.total
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation */}
      <StaffNavbar activePage="sales-history" />

      {/* Main content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sales History</h1>
            <p className="text-slate-500 mt-1">Track, search, analyze, and manage completed pharmacy sales.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 text-slate-700 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm outline-none font-medium"
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            
            <button
              onClick={handleExport}
              disabled={loading || error || filteredSales.length === 0}
              className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-red-800 mb-2">Unable to load sales history</h3>
            <p className="text-red-600 mb-4">We couldn't retrieve your sales data right now. Please try again.</p>
            <button onClick={fetchSales} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none">
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse h-32">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl h-64 border border-slate-100 shadow-sm animate-pulse"></div>
            <div className="bg-white rounded-2xl h-96 border border-slate-100 shadow-sm animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm shadow-slate-200/50">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Sales</p>
                    <p className="text-2xl font-black text-slate-900">{metrics.totalTransactions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm shadow-slate-200/50">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Revenue</p>
                    <p className="text-2xl font-black text-slate-900">₹{metrics.totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm shadow-slate-200/50">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Avg Order Value</p>
                    <p className="text-2xl font-black text-slate-900">₹{metrics.avgOrderValue.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm shadow-slate-200/50">
                <div className="flex items-center">
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Items Sold</p>
                    <p className="text-2xl font-black text-slate-900">{metrics.itemsSold}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            {filteredSales.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-2">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Revenue Trend</h3>
                  <div className="h-64 w-full">
                    <Line data={revenueChartData} options={chartOptions} />
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Sales Volume</h3>
                  <div className="h-64 w-full">
                    <Bar data={volumeChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            )}

            {/* Sales Table Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-white">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h3 className="text-lg font-bold text-slate-900">Transaction Ledger</h3>
                  <div className="relative w-full sm:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search Invoice ID, Customer, or Medicine..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {filteredSales.length === 0 ? (
                <div className="p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">No Sales Found</h3>
                  <p className="text-slate-500 mb-6">There are no completed transactions matching your criteria.</p>
                  <button 
                    onClick={() => navigate('/sales')}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Create New Sale
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Sale ID</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Customer</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Medicine</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Qty</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {currentSales.map((sale) => (
                          <tr key={sale.sale_id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                              #{sale.sale_id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {new Date(sale.date).toLocaleString('en-US', { 
                                month: 'short', day: 'numeric', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-slate-900">{sale.customer_name || 'Walk-in'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-900 font-medium">{sale.medicine_name}</div>
                              <div className="text-xs text-slate-500">₹{sale.price.toFixed(2)}/unit</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-center font-bold">
                              {sale.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 text-right font-black">
                              ₹{sale.total.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                Completed
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => setSelectedSale(sale)}
                                className="text-primary-600 hover:text-primary-900 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded-lg transition-colors"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6 flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-700">
                          Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredSales.length)}</span> of <span className="font-bold">{filteredSales.length}</span> sales
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px bg-white" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-xl border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i + 1}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === i + 1
                                  ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                  : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}

                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-xl border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setSelectedSale(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-slate-100">
              
              {/* Receipt Header */}
              <div className="bg-slate-50 px-6 py-6 border-b border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-1" id="modal-title">
                      Medi-Flow Pharmacy
                    </h3>
                    <h4 className="text-2xl font-black text-slate-900">Invoice</h4>
                    <p className="text-sm text-slate-500 font-medium">#{selectedSale.sale_id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="bg-white rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shadow-sm border border-slate-200"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4 text-sm text-slate-600">
                  <p>{new Date(selectedSale.date).toLocaleString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}</p>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="px-6 py-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h4>
                  <p className="text-base font-bold text-slate-900">{selectedSale.customer_name || 'Walk-in Customer'}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Items Purchased</h4>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-200 border-dashed">
                      <span className="font-bold text-slate-900">{selectedSale.medicine_name}</span>
                      <span className="font-bold text-slate-900">₹{selectedSale.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>{selectedSale.quantity} × ₹{selectedSale.price.toFixed(2)}</span>
                      <span>Subtotal</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 font-medium">Payment Method</span>
                    <span className="text-slate-900 font-bold">Standard (POS)</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 font-medium">Status</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      Completed
                    </span>
                  </div>
                </div>

                <div className="bg-primary-50 rounded-xl p-4 flex justify-between items-center">
                  <span className="font-bold text-primary-900">Total Amount</span>
                  <span className="text-2xl font-black text-primary-700">₹{selectedSale.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-bold text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                  onClick={() => setSelectedSale(null)}
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

export default SalesHistory;
