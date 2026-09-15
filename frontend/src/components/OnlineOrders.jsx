import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAlert } from '../context/AlertContext';
import StaffNavbar from './common/StaffNavbar';

const OnlineOrders = () => {
  const { showAlert, showPrompt } = useAlert();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  
  // OCR state
  const [ocrData, setOcrData] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  
  // Inline editing state
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [inlineStatus, setInlineStatus] = useState('');
  const [customStatus, setCustomStatus] = useState(''); // tracks order_id during async actions
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return { start: today, end: today };
  });

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    fetchOrders();
  }, [filter, dateFilter, debouncedSearch]);

  useEffect(() => {
    if (selectedOrder && selectedOrder.prescription_uploaded) {
      fetchOcrData(selectedOrder.order_id);
    } else {
      setOcrData(null);
    }
  }, [selectedOrder]);

  const fetchOcrData = async (orderId) => {
    try {
      setOcrLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/staff/online-orders/${orderId}/ocr`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status !== 'NOT_PROCESSED') {
        setOcrData(response.data);
      } else {
        setOcrData(null);
      }
    } catch (error) {
      console.error('Error fetching OCR data:', error);
      setOcrData(null);
    } finally {
      setOcrLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = {};
      
      if (filter === 'needs_review') {
        params.requires_review = true;
      } else if (filter !== 'all') {
        params.status = filter;
      }
      
      if (dateFilter.start) {
        params.start_date = dateFilter.start;
      }
      if (dateFilter.end) {
        params.end_date = dateFilter.end;
      }
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const response = await axios.get(`${API_URL}/staff/online-orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewPrescription = async (orderId, action) => {
    let notes = '';
    if (action === 'reject') {
      notes = await showPrompt('Please provide a reason for rejection:', 'Reject Prescription');
      if (!notes) return; // cancelled
    }

    try {
      setActionLoading(orderId);
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/staff/online-orders/${orderId}/review-prescription`,
        { action, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showAlert({ type: 'success', message: `Prescription ${action}d successfully` });
      fetchOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error(`Error ${action}ing prescription:`, error);
      showAlert({ type: 'error', message: error.response?.data?.message || `Failed to ${action} prescription` });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmOcr = async (orderId) => {
    try {
      setOcrLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/staff/online-orders/${orderId}/ocr/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showAlert({ type: 'success', message: 'OCR verification confirmed' });
      fetchOcrData(orderId);
    } catch (error) {
      console.error('Error confirming OCR:', error);
      showAlert({ type: 'error', message: error.response?.data?.message || 'Failed to confirm OCR' });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, currentStatus) => {
    setEditingOrderId(orderId);
    setInlineStatus(currentStatus || 'Processing');
    setCustomStatus('');
  };

  const submitInlineStatus = async (orderId) => {
    const finalStatus = inlineStatus === 'Custom' ? customStatus : inlineStatus;
    if (!finalStatus.trim()) {
      showAlert({ type: 'warning', message: 'Status cannot be empty', title: 'Warning' });
      return;
    }

    try {
      setActionLoading(orderId);
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/staff/online-orders/${orderId}/status`,
        { status: finalStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showAlert({ type: 'success', message: 'Order status updated successfully', title: 'Success' });
      fetchOrders();
      setEditingOrderId(null);
    } catch (err) {
      console.error('Error updating order status:', err);
      showAlert({ type: 'error', message: 'Error updating order status', title: 'Error' });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending Review': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
      'Approved': 'bg-blue-50 text-blue-700 ring-blue-600/20',
      'Processing': 'bg-primary-50 text-primary-700 ring-primary-600/20',
      'Out for Delivery': 'bg-purple-50 text-purple-700 ring-purple-600/20',
      'Delivered': 'bg-green-50 text-green-700 ring-green-600/20',
      'Rejected': 'bg-red-50 text-red-700 ring-red-600/20',
      'Cancelled': 'bg-slate-50 text-slate-700 ring-slate-600/20'
    };
    return colors[status] || 'bg-slate-50 text-slate-700 ring-slate-600/20';
  };

  // Skeleton Row Component
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-48"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-slate-200 rounded-full w-24"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-6 bg-slate-200 rounded-full w-24"></div></td>
      <td className="px-6 py-4 whitespace-nowrap"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <StaffNavbar activePage="online-orders" />
      <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Online Customer Orders</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage and process e-commerce purchases • <span className="font-medium text-slate-700">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by ID or Name..."
              className="pl-10 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date Filters */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="text-sm border-none focus:ring-0 text-slate-600 bg-transparent cursor-pointer p-1"
                aria-label="Start date"
              />
              <span className="text-slate-400 font-medium text-xs">to</span>
              <input
                type="date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="text-sm border-none focus:ring-0 text-slate-600 bg-transparent cursor-pointer p-1"
                aria-label="End date"
              />
            </div>
            {(dateFilter.start || dateFilter.end) && (
              <button 
                onClick={() => setDateFilter({ start: '', end: '' })}
                className="ml-1 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                title="Clear dates"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 ${
              filter === 'all' 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilter('needs_review')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 ${
              filter === 'needs_review' 
                ? 'bg-red-600 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Needs Review
          </button>
          <button
            onClick={() => setFilter('Processing')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 ${
              filter === 'Processing' 
                ? 'bg-primary-600 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Processing
          </button>
          <button
            onClick={() => setFilter('Delivered')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 ${
              filter === 'Delivered' 
                ? 'bg-green-600 text-white shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Delivered
          </button>
        </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prescription</th>
                <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="mt-4 text-sm text-slate-500 font-medium">No orders found matching your filters</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                      #{order.order_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">{order.customer_name}</span>
                        <span className="text-sm text-slate-500">{order.customer_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(order.order_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      ₹{order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {order.requires_prescription ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            order.prescription_status === 'Pending' ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                            order.prescription_status === 'Approved' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                            'bg-red-50 text-red-700 ring-red-600/20'
                          }`}>
                          {order.prescription_status}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {order.needs_review && (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-primary-600 hover:text-primary-800 transition-colors focus:outline-none focus:underline"
                          >
                            Review Rx
                          </button>
                        )}
                        
                        {editingOrderId === order.order_id ? (
                          <div className="flex items-center space-x-2">
                            <select
                              autoFocus
                              value={inlineStatus}
                              onChange={(e) => setInlineStatus(e.target.value)}
                              className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && inlineStatus !== 'Custom') submitInlineStatus(order.order_id);
                              }}
                            >
                              <option value="Processing">Processing</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Custom">Custom</option>
                            </select>
                            
                            {inlineStatus === 'Custom' && (
                              <input
                                type="text"
                                maxLength={10}
                                placeholder="Max 10 chars"
                                value={customStatus}
                                onChange={(e) => setCustomStatus(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') submitInlineStatus(order.order_id);
                                }}
                                className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-1 w-28"
                              />
                            )}
                            
                            <button
                              onClick={() => submitInlineStatus(order.order_id)}
                              disabled={actionLoading === order.order_id}
                              className="text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded shadow-sm text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {actionLoading === order.order_id ? '...' : 'Submit'}
                            </button>
                            <button
                              onClick={() => setEditingOrderId(null)}
                              className="text-gray-500 hover:text-gray-700 px-2 py-1 text-xs font-medium focus:outline-none"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(order.order_id, order.status)}
                            disabled={actionLoading === order.order_id || order.status === 'Delivered'}
                            className="text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            {actionLoading === order.order_id ? (
                              <svg className="animate-spin h-4 w-4 text-blue-600 mr-1" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : null}
                            Update Status
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-slate-900">Review Prescription</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Order Number</p>
                  <p className="text-base font-bold text-slate-900">#{selectedOrder.order_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Customer</p>
                  <p className="text-base font-bold text-slate-900">{selectedOrder.customer_name}</p>
                  <p className="text-sm text-slate-600">{selectedOrder.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Order Total</p>
                  <p className="text-xl font-bold text-primary-600">₹{selectedOrder.total_amount.toFixed(2)}</p>
                </div>
              </div>
            </div>
              
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Side: Original Image */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Original Prescription</h4>
                {selectedOrder.prescription_uploaded && selectedOrder.prescription_file_path ? (
                  <div className="border border-slate-200 rounded-xl p-4 bg-white flex justify-center h-full items-start">
                    <img 
                      src={`http://localhost:5000/${selectedOrder.prescription_file_path}`}
                      alt="Prescription"
                      className="max-w-full h-auto max-h-[500px] object-contain rounded shadow-sm hover:scale-[1.02] transition-transform"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f8fafc" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="16"%3EPrescription Image Not Available%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center bg-slate-50 h-full flex flex-col justify-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium text-slate-600">Prescription not available</p>
                  </div>
                )}
              </div>
              
              {/* Right Side: OCR Extractions */}
              <div className="flex flex-col h-full">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  AI Extractions
                </h4>
                
                <div className="border border-slate-200 rounded-xl p-4 bg-white flex-1 overflow-y-auto max-h-[500px]">
                  {ocrLoading ? (
                    <div className="flex flex-col items-center justify-center h-full py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                      <p className="text-slate-500 text-sm">Loading OCR data...</p>
                    </div>
                  ) : !ocrData ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <p className="text-slate-500 text-sm mb-2">No AI analysis available for this prescription.</p>
                    </div>
                  ) : ocrData.status === 'PROCESSING' ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                      <p className="text-indigo-600 font-medium">Processing...</p>
                      <p className="text-slate-500 text-xs mt-1">AI is actively analyzing this image.</p>
                    </div>
                  ) : ocrData.status === 'FAILED' ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <svg className="w-10 h-10 text-red-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      <p className="text-red-600 font-medium mb-1">Analysis Failed</p>
                      <p className="text-slate-500 text-xs">The prescription image was too blurry or unsupported.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ocrData.extractions.length === 0 ? (
                        <p className="text-slate-500 italic text-center py-4 text-sm">No medicines clearly extracted.</p>
                      ) : (
                        ocrData.extractions.map((med, idx) => (
                          <div key={idx} className="border border-slate-100 bg-slate-50 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-wrap gap-2 mb-2 w-full">
                                          {med.match_status === 'HIGH' && (
                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                                              High Match ({Math.round(med.confidence_score)}%)
                                            </span>
                                          )}
                                          {med.match_status === 'MEDIUM' && (
                                            <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                                              Medium Match ({Math.round(med.confidence_score)}%)
                                            </span>
                                          )}
                                          {med.match_status === 'AMBIGUOUS' && (
                                            <span className="bg-orange-100 text-orange-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                              Ambiguous
                                            </span>
                                          )}
                                          {med.match_status === 'LOW' && (
                                            <span className="bg-rose-100 text-rose-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                                              Low Match - Verify
                                            </span>
                                          )}
                                          {med.match_status === 'NO_MATCH' && (
                                            <span className="bg-slate-100 text-slate-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                                              No DB Match
                                            </span>
                                          )}
                                        </div>
                            </div>
                            
                            <div className="mb-2">
                                          <label className="block text-[10px] uppercase text-slate-500 font-medium mb-1">Medicine Name</label>
                                          {med.match_status === 'AMBIGUOUS' && med.candidate_medicines ? (
                                            <select
                                              className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2 border bg-white"
                                              value={med.extracted_name}
                                              onChange={(e) => {
                                                const newExtractions = [...ocrData.extractions];
                                                newExtractions[idx].extracted_name = e.target.value;
                                                setOcrData({...ocrData, extractions: newExtractions});
                                              }}
                                            >
                                              <option value="" disabled>Select best match...</option>
                                              {med.candidate_medicines.map((cand, i) => (
                                                <option key={i} value={cand.med_name}>
                                                  {cand.med_name} {cand.med_strength} ({Math.round(cand.score)}%)
                                                </option>
                                              ))}
                                              <option value={med.extracted_name}>Keep OCR: {med.extracted_name}</option>
                                            </select>
                                          ) : (
                                            <input 
                                              type="text" 
                                              value={med.extracted_name || ''} 
                                              onChange={(e) => {
                                                const newExtractions = [...ocrData.extractions];
                                                newExtractions[idx].extracted_name = e.target.value;
                                                setOcrData({...ocrData, extractions: newExtractions});
                                              }}
                                              className="w-full text-sm border-slate-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-2 border bg-white"
                                            />
                                          )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="text-[10px] uppercase text-slate-500 font-medium">Strength</label>
                                <input type="text" defaultValue={med.extracted_strength} className="w-full text-sm p-1 border rounded" />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase text-slate-500 font-medium">Dosage</label>
                                <input type="text" defaultValue={med.extracted_dosage} className="w-full text-sm p-1 border rounded" />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      
                      {ocrData.extractions.length > 0 && (
                        <div className="pt-3 border-t mt-4 flex justify-between items-center">
                          <span className="text-xs text-slate-500">
                            Confidence: {Math.round(ocrData.overall_confidence || 0)}%
                          </span>
                          <button 
                            onClick={() => handleConfirmOcr(selectedOrder.order_id)}
                            disabled={ocrData.status === 'VERIFIED'}
                            className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {ocrData.status === 'VERIFIED' ? 'Verified' : 'Confirm Verification'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 border-t pt-6">
              <button
                onClick={() => handleReviewPrescription(selectedOrder.order_id, 'approve')}
                disabled={actionLoading === selectedOrder.order_id}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 hover:shadow-md transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex justify-center items-center"
              >
                {actionLoading === selectedOrder.order_id ? (
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                )}
                Approve Prescription
              </button>
              <button
                onClick={() => handleReviewPrescription(selectedOrder.order_id, 'reject')}
                disabled={actionLoading === selectedOrder.order_id}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 hover:shadow-md transition-all duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex justify-center items-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Reject Prescription
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 bg-white border border-slate-300 text-slate-700 py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors duration-200 font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default OnlineOrders;
